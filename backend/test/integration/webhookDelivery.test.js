const nock = require('nock');
const memoryDb = require('../../src/config/memoryDb');
const Webhook = require('../../src/models/Webhook');
const WebhookDelivery = require('../../src/models/WebhookDelivery');
const { encryptSecret } = require('../../src/utils/secretVault');
const { postJson } = require('../../src/utils/httpClient');
const service = require('../../src/services/webhookService');

const HOST = 'https://93.184.216.34';
const HOOK_URL = `${HOST}/hook`;

const createWebhook = (overrides = {}) =>
  Webhook.create({
    organizer: 'org_test',
    url: HOOK_URL,
    events: ['registration.created', 'checkin.completed'],
    secretEnc: encryptSecret('whsec_test_secret'),
    active: true,
    failureCount: 0,
    ...overrides,
  });

describe('webhookService delivery engine', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    memoryDb.resetAll();
    nock.cleanAll();
  });

  describe('computeBackoffMs', () => {
    it('grows exponentially within jitter bounds', () => {
      expect(service.computeBackoffMs(1)).toBeGreaterThanOrEqual(800);
      expect(service.computeBackoffMs(1)).toBeLessThanOrEqual(1200);
      expect(service.computeBackoffMs(2)).toBeGreaterThanOrEqual(1600);
      expect(service.computeBackoffMs(2)).toBeLessThanOrEqual(2400);
    });

    it('caps the exponential base at 5 minutes (plus jitter)', () => {
      expect(service.computeBackoffMs(20)).toBeLessThanOrEqual(360000);
      expect(service.computeBackoffMs(20)).toBeGreaterThanOrEqual(240000);
    });
  });

  describe('emit', () => {
    it('creates one pending delivery per subscribed active webhook', async () => {
      await createWebhook();
      const result = await service.emit('registration.created', { id: 't1' });
      expect(result.deliveries).toHaveLength(1);

      const delivery = await WebhookDelivery.findById(result.deliveries[0]);
      expect(delivery).toMatchObject({
        status: 'pending',
        event: 'registration.created',
        attempts: 0,
      });
    });

    it('ignores webhooks not subscribed to the event', async () => {
      await createWebhook({ events: ['lead.captured'] });
      const result = await service.emit('registration.created', {});
      expect(result.deliveries).toHaveLength(0);
    });

    it('ignores inactive webhooks', async () => {
      await createWebhook({ active: false });
      const result = await service.emit('registration.created', {});
      expect(result.deliveries).toHaveLength(0);
    });

    it('is idempotent for a repeated eventId', async () => {
      await createWebhook();
      const eventId = service.createEventId();
      const first = await service.emit('registration.created', {}, { eventId });
      const second = await service.emit('registration.created', {}, { eventId });
      expect(first.deliveries).toHaveLength(1);
      expect(second.deliveries).toHaveLength(0);

      const all = await WebhookDelivery.find({ eventId });
      expect(all).toHaveLength(1);
    });

    it('throws on unsupported events', async () => {
      await expect(service.emit('bogus.event', {})).rejects.toThrow(/unsupported/i);
    });

    it('safeEmit never throws', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.safeEmit('bogus.event', {});
      expect(result).toHaveProperty('error');
      spy.mockRestore();
    });
  });

  describe('deliverOne', () => {
    it('marks a successful delivery and clears failures', async () => {
      const hook = await createWebhook({ failureCount: 3 });
      const { deliveries } = await service.emit('registration.created', { id: 't1' });

      nock(HOST).post('/hook').reply(200, { ok: true });
      const result = await service.deliverOne(deliveries[0]);
      expect(result.ok).toBe(true);

      const delivery = await WebhookDelivery.findById(deliveries[0]);
      expect(delivery).toMatchObject({ status: 'success', attempts: 1, responseStatus: 200 });

      const updatedHook = await Webhook.findById(hook._id);
      expect(updatedHook.failureCount).toBe(0);
      expect(updatedHook.lastDeliveryStatus).toBe('success');
    });

    it('schedules a retry on failure and counts the failure', async () => {
      const hook = await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});

      nock(HOST).post('/hook').reply(500, { error: 'boom' });
      const result = await service.deliverOne(deliveries[0]);
      expect(result.ok).toBe(false);
      expect(result.failed).toBe(false);

      const delivery = await WebhookDelivery.findById(deliveries[0]);
      expect(delivery.status).toBe('pending');
      expect(delivery.attempts).toBe(1);
      expect(new Date(delivery.nextRetryAt).getTime()).toBeGreaterThan(Date.now());

      const updatedHook = await Webhook.findById(hook._id);
      expect(updatedHook.failureCount).toBe(1);
      expect(updatedHook.lastDeliveryStatus).toBe('failed');
    });

    it('recovers on retry after a transient failure', async () => {
      const hook = await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});

      nock(HOST).post('/hook').reply(500);
      await service.deliverOne(deliveries[0]);

      nock(HOST).post('/hook').reply(200);
      const retry = await service.deliverOne(deliveries[0]);
      expect(retry.ok).toBe(true);

      const delivery = await WebhookDelivery.findById(deliveries[0]);
      expect(delivery.status).toBe('success');

      const updatedHook = await Webhook.findById(hook._id);
      expect(updatedHook.failureCount).toBe(0);
    });

    it('marks a delivery failed and disables the webhook after exhausting attempts', async () => {
      const hook = await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});
      await WebhookDelivery.findByIdAndUpdate(deliveries[0], { maxAttempts: 1 });

      nock(HOST).post('/hook').reply(500);
      const result = await service.deliverOne(deliveries[0]);
      expect(result.failed).toBe(true);

      const delivery = await WebhookDelivery.findById(deliveries[0]);
      expect(delivery.status).toBe('failed');
      expect(delivery.nextRetryAt).toBeNull();

      const updatedHook = await Webhook.findById(hook._id);
      expect(updatedHook.active).toBe(false);
      expect(updatedHook.disabledReason).toBe('consecutive_failures');
    });

    it('auto-disables after the failure threshold across deliveries', async () => {
      const hook = await createWebhook({ failureCount: 9 });
      const { deliveries } = await service.emit('registration.created', {});
      await WebhookDelivery.findByIdAndUpdate(deliveries[0], { maxAttempts: 1 });

      nock(HOST).post('/hook').reply(500);
      await service.deliverOne(deliveries[0]);

      const updatedHook = await Webhook.findById(hook._id);
      expect(updatedHook.failureCount).toBe(10);
      expect(updatedHook.active).toBe(false);
    });

    it('skips delivery for an inactive webhook', async () => {
      const hook = await createWebhook({ active: false });
      const { deliveries } = await service.emit('registration.created', {});
      // emit ignores inactive, so insert a delivery manually
      const manual = await WebhookDelivery.create({
        webhookId: hook._id,
        eventId: service.createEventId(),
        event: 'registration.created',
        payload: '{}',
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextRetryAt: new Date(),
      });

      const result = await service.deliverOne(manual._id);
      expect(result.skipped).toBe(true);
      const stored = await WebhookDelivery.findById(manual._id);
      expect(stored.status).toBe('skipped');
      expect(deliveries).toHaveLength(0);
    });

    it('fails a delivery when the webhook no longer exists', async () => {
      const manual = await WebhookDelivery.create({
        webhookId: 'missing_hook',
        eventId: service.createEventId(),
        event: 'registration.created',
        payload: '{}',
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextRetryAt: new Date(),
      });
      const result = await service.deliverOne(manual._id);
      expect(result.ok).toBe(false);
      const stored = await WebhookDelivery.findById(manual._id);
      expect(stored.status).toBe('failed');
    });
  });

  describe('drainPending', () => {
    it('only processes due pending deliveries', async () => {
      await createWebhook();
      await service.emit('registration.created', {});
      await service.emit('checkin.completed', {});

      nock(HOST).post('/hook').times(2).reply(200);
      const first = await service.drainPending();
      expect(first.processed).toBe(2);
      expect(first.delivered).toBe(2);

      // Nothing pending now
      const second = await service.drainPending();
      expect(second.processed).toBe(0);
    });

    it('does not process deliveries scheduled in the future', async () => {
      const hook = await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});
      nock(HOST).post('/hook').reply(500);
      await service.deliverOne(deliveries[0]);

      const drain = await service.drainPending();
      expect(drain.processed).toBe(0);

      const delivery = await WebhookDelivery.findById(deliveries[0]);
      expect(delivery.status).toBe('pending');
      void hook;
    });
  });

  describe('pingWebhook', () => {
    it('sends a ping and records success', async () => {
      const hook = await createWebhook();
      nock(HOST).post('/hook').reply(200, { pong: true });
      const result = await service.pingWebhook(hook._id);
      expect(result.ok).toBe(true);

      const deliveries = await WebhookDelivery.find({ webhookId: hook._id });
      expect(deliveries[0].event).toBe('webhook.ping');
    });

    it('throws for a missing webhook', async () => {
      await expect(service.pingWebhook('nope')).rejects.toThrow(/not found/i);
    });
  });

  describe('redeliver', () => {
    it('resets attempts and retries a failed delivery', async () => {
      const hook = await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});
      await WebhookDelivery.findByIdAndUpdate(deliveries[0], { maxAttempts: 1 });
      nock(HOST).post('/hook').reply(500);
      await service.deliverOne(deliveries[0]);

      nock(HOST).post('/hook').reply(200);
      const result = await service.redeliver(deliveries[0]);
      expect(result.ok).toBe(true);
      void hook;
    });

    it('is a no-op for an already successful delivery', async () => {
      await createWebhook();
      const { deliveries } = await service.emit('registration.created', {});
      nock(HOST).post('/hook').reply(200);
      await service.deliverOne(deliveries[0]);

      const result = await service.redeliver(deliveries[0]);
      expect(result.alreadySucceeded).toBe(true);
    });
  });

  describe('assertEventsValid', () => {
    it('accepts supported events', () => {
      expect(() => service.assertEventsValid(['registration.created'])).not.toThrow();
    });
    it('rejects empty and unsupported events', () => {
      expect(() => service.assertEventsValid([])).toThrow();
      expect(() => service.assertEventsValid(['nope'])).toThrow(/unsupported/i);
    });
  });

  describe('serializeWebhook', () => {
    it('never exposes secret material', () => {
      const serialized = service.serializeWebhook({
        _id: '1',
        url: 'https://x.test',
        events: ['a'],
        secretEnc: { iv: 'x', tag: 'y', data: 'z' },
        previousSecretEnc: { iv: 'x', tag: 'y', data: 'z' },
      });
      expect(serialized).not.toHaveProperty('secretEnc');
      expect(serialized).not.toHaveProperty('previousSecretEnc');
      expect(JSON.stringify(serialized)).not.toContain('secret');
    });
  });

  describe('postJson', () => {
    it('times out slow endpoints', async () => {
      nock(HOST).post('/hook').delayConnection(300).reply(200);
      const result = await postJson({ url: HOOK_URL, body: {}, timeoutMs: 30 });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/timed out/i);
    });

    it('reports non-2xx responses without throwing', async () => {
      nock(HOST).post('/hook').reply(503, 'unavailable');
      const result = await postJson({ url: HOOK_URL, body: {}, timeoutMs: 1000 });
      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);
    });
  });
});
