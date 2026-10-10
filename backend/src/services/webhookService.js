const crypto = require('crypto');
const redis = require('../config/redis');
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const { decryptSecret } = require('../utils/secretVault');
const { signPayload } = require('../utils/webhookSignature');
const { postJson } = require('../utils/httpClient');
const { assertSafeWebhookUrl } = require('../utils/urlGuard');

const WEBHOOK_EVENTS = [
  'registration.created',
  'checkin.completed',
  'event.created',
  'lead.captured',
  'webhook.ping',
];

const DEFAULT_MAX_ATTEMPTS = 5;
const AUTO_DISABLE_AFTER_FAILURES = 10;
const DELIVERY_TIMEOUT_MS = 10000;
const OVERLAP_WINDOW_MS = 24 * 60 * 60 * 1000;

const createEventId = () => crypto.randomUUID();

const computeBackoffMs = (attempt) => {
  const base = Math.min(1000 * 2 ** (attempt - 1), 300000);
  const jitter = base * 0.2 * (1 - 2 * Math.random());
  return Math.max(0, Math.round(base + jitter));
};

const serializeWebhook = (w) => {
  if (!w) return null;
  return {
    _id: w._id,
    organizer: w.organizer,
    url: w.url,
    events: w.events,
    active: w.active,
    failureCount: w.failureCount,
    disabledReason: w.disabledReason,
    lastDeliveryStatus: w.lastDeliveryStatus,
    lastDeliveryAt: w.lastDeliveryAt,
    lastSuccessAt: w.lastSuccessAt,
    secretRotatedAt: w.secretRotatedAt,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
};

const safeEmit = async (event, payload, options = {}) => {
  try {
    return await emit(event, payload, options);
  } catch (error) {
    console.error(`[webhooks] emit ${event} failed:`, error.message);
    return { deliveries: [], error: error.message };
  }
};

const emit = async (event, payload, options = {}) => {
  if (!WEBHOOK_EVENTS.includes(event)) {
    throw new Error(`Unsupported webhook event: ${event}`);
  }
  const hooks = await Webhook.find({ events: event, active: true });
  if (!hooks || hooks.length === 0) return { deliveries: [] };

  const eventId = options.eventId || createEventId();
  const deliveries = [];
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  for (const hook of hooks) {
    const existing = await WebhookDelivery.findOne({ eventId, webhookId: hook._id });
    if (existing) continue; // idempotency: a given event is delivered once per webhook

    const delivery = await WebhookDelivery.create({
      webhookId: hook._id,
      eventId,
      event,
      payload: body,
      status: 'pending',
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      nextRetryAt: new Date(),
    });
    deliveries.push(delivery);
  }

  await enqueueDue();
  return { deliveries: deliveries.map((d) => d._id) };
};

const enqueueDue = async () => {
  if (!redis || redis.status !== 'ready') return;
  try {
    const { webhookQueue } = require('../queues/webhookQueue');
    const due = await WebhookDelivery.find({ status: 'pending', nextRetryAt: { $lte: new Date() } });
    for (const delivery of due) {
      await webhookQueue.add(
        'deliver-webhook',
        { deliveryId: delivery._id.toString() },
        { attempts: 1, removeOnComplete: true, removeOnFail: false }
      );
    }
  } catch (error) {
    console.warn('[webhooks] enqueueDue warning:', error.message);
  }
};

const deliverOne = async (deliveryId, { force = false } = {}) => {
  const delivery = await WebhookDelivery.findById(deliveryId);
  if (!delivery || delivery.status === 'success') return { skipped: true };

  if (delivery.status === 'failed' && !force) return { skipped: true };

  const webhook = await Webhook.findById(delivery.webhookId);
  if (!webhook) {
    await WebhookDelivery.findByIdAndUpdate(delivery._id, {
      status: 'failed',
      error: 'Webhook endpoint no longer exists',
      completedAt: new Date(),
      nextRetryAt: null,
    });
    return { ok: false, skipped: true };
  }

  if (!webhook.active && !force) {
    await WebhookDelivery.findByIdAndUpdate(delivery._id, { status: 'skipped' });
    return { ok: false, skipped: true };
  }

  const secret = decryptSecret(webhook.secretEnc);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(delivery.payload, secret, timestamp);
  const headers = {
    'X-EMS-Signature': signature,
    'X-EMS-Event': delivery.event,
    'X-EMS-Delivery': delivery._id.toString(),
    'X-EMS-Timestamp': String(timestamp),
  };

  const attempt = await postJson({
    url: webhook.url,
    body: delivery.payload,
    headers,
    timeoutMs: DELIVERY_TIMEOUT_MS,
  });

  const nextAttempts = Number(delivery.attempts || 0) + 1;

  if (attempt.ok) {
    await WebhookDelivery.findByIdAndUpdate(delivery._id, {
      status: 'success',
      attempts: nextAttempts,
      responseStatus: attempt.status,
      responseBodySnippet: attempt.body || null,
      error: null,
      nextRetryAt: null,
      completedAt: new Date(),
    });
    await Webhook.findByIdAndUpdate(webhook._id, {
      failureCount: 0,
      lastDeliveryStatus: 'success',
      lastDeliveryAt: new Date(),
      lastSuccessAt: new Date(),
      disabledReason: null,
    });
    return { ok: true, attempts: nextAttempts };
  }

  const errorText = attempt.status ? `HTTP ${attempt.status}` : attempt.error || 'Delivery failed';
  const failed = nextAttempts >= (delivery.maxAttempts || DEFAULT_MAX_ATTEMPTS);

  await WebhookDelivery.findByIdAndUpdate(delivery._id, {
    status: failed ? 'failed' : 'pending',
    attempts: nextAttempts,
    ...(attempt.status ? { responseStatus: attempt.status } : {}),
    ...(attempt.body ? { responseBodySnippet: attempt.body } : {}),
    error: errorText,
    nextRetryAt: failed ? null : new Date(Date.now() + computeBackoffMs(nextAttempts)),
    ...(failed ? { completedAt: new Date() } : {}),
  });

  await recordFailure(webhook, failed);

  return { ok: false, attempts: nextAttempts, failed };
};

const recordFailure = async (webhook, failed) => {
  const failureCount = Number(webhook.failureCount || 0) + 1;
  const update = {
    failureCount,
    lastDeliveryStatus: 'failed',
    lastDeliveryAt: new Date(),
  };
  if (failed || failureCount >= AUTO_DISABLE_AFTER_FAILURES) {
    update.active = false;
    update.disabledReason = 'consecutive_failures';
  }
  await Webhook.findByIdAndUpdate(webhook._id, update);
};

const pingWebhook = async (webhookId) => {
  const webhook = await Webhook.findById(webhookId);
  if (!webhook) throw new Error('Webhook not found');

  const body = JSON.stringify({
    event: 'webhook.ping',
    timestamp: new Date().toISOString(),
    data: { message: 'Ping from EMS. Your endpoint is reachable and signatures validate correctly.' },
  });

  const delivery = await WebhookDelivery.create({
    webhookId: webhook._id,
    eventId: createEventId(),
    event: 'webhook.ping',
    payload: body,
    status: 'pending',
    attempts: 0,
    maxAttempts: 1,
    nextRetryAt: new Date(),
  });

  return deliverOne(delivery._id);
};

const redeliver = async (deliveryId) => {
  const delivery = await WebhookDelivery.findById(deliveryId);
  if (!delivery) throw new Error('Delivery not found');
  if (delivery.status === 'success') return { ok: true, alreadySucceeded: true };

  await WebhookDelivery.findByIdAndUpdate(delivery._id, {
    status: 'pending',
    attempts: 0,
    nextRetryAt: new Date(),
    completedAt: null,
    error: null,
  });

  return deliverOne(delivery._id, { force: true });
};

const drainPending = async (limit = 50) => {
  const due = await WebhookDelivery.find({
    status: 'pending',
    nextRetryAt: { $lte: new Date() },
  });
  const batch = (due || []).slice(0, limit);
  let delivered = 0;
  for (const delivery of batch) {
    const result = await deliverOne(delivery._id);
    if (result.ok) delivered += 1;
  }
  return { processed: batch.length, delivered };
};

const assertEventsValid = (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('events must be a non-empty array');
  }
  const unsupported = events.filter((e) => !WEBHOOK_EVENTS.includes(e));
  if (unsupported.length) {
    throw new Error(`Unsupported webhook event(s): ${unsupported.join(', ')}`);
  }
};

module.exports = {
  WEBHOOK_EVENTS,
  DEFAULT_MAX_ATTEMPTS,
  AUTO_DISABLE_AFTER_FAILURES,
  OVERLAP_WINDOW_MS,
  computeBackoffMs,
  serializeWebhook,
  assertEventsValid,
  createEventId,
  emit,
  safeEmit,
  enqueueDue,
  deliverOne,
  pingWebhook,
  redeliver,
  drainPending,
  assertSafeWebhookUrl,
};