const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const AppError = require('../utils/AppError');
const { generateSecret, encryptSecret } = require('../utils/secretVault');
const webhookService = require('../services/webhookService');
const { assertSafeWebhookUrl, assertEventsValid, serializeWebhook, pingWebhook, redeliver } = require('../services/webhookService');

const getWebhooks = async (req, res, next) => {
  try {
    const webhooks = await Webhook.find({ organizer: req.user._id });
    res.status(200).json({
      success: true,
      count: webhooks.length,
      data: webhooks.map(serializeWebhook),
    });
  } catch (error) {
    next(error);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const { url, events } = req.body || {};
    if (!url) throw AppError.badRequest('Webhook URL is required');
    try {
      assertEventsValid(events);
    } catch (validationError) {
      throw AppError.badRequest(validationError.message);
    }

    let safeUrl;
    try {
      safeUrl = await assertSafeWebhookUrl(url);
    } catch (urlError) {
      throw AppError.badRequest(urlError.message);
    }

    const secret = generateSecret();
    const webhook = await Webhook.create({
      organizer: req.user._id,
      url: safeUrl,
      events,
      secretEnc: encryptSecret(secret),
      active: true,
      failureCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      secret,
      data: serializeWebhook(webhook),
    });
  } catch (error) {
    next(error);
  }
};

const updateWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    const updates = {};
    if (req.body.url !== undefined) {
      try {
        updates.url = await assertSafeWebhookUrl(req.body.url);
      } catch (urlError) {
        throw AppError.badRequest(urlError.message);
      }
    }
    if (req.body.events !== undefined) {
      try {
        assertEventsValid(req.body.events);
      } catch (validationError) {
        throw AppError.badRequest(validationError.message);
      }
      updates.events = req.body.events;
    }
    if (req.body.active !== undefined) {
      updates.active = Boolean(req.body.active);
      if (updates.active) updates.disabledReason = null;
    }

    const updated = await Webhook.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({
      success: true,
      message: 'Webhook updated successfully',
      data: serializeWebhook(updated),
    });
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    await Webhook.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const rotateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    const newSecret = generateSecret();
    const previous = webhook.secretEnc;

    const updated = await Webhook.findByIdAndUpdate(id, {
      secretEnc: encryptSecret(newSecret),
      previousSecretEnc: previous,
      previousSecretValidUntil: new Date(Date.now() + webhookService.OVERLAP_WINDOW_MS),
      secretRotatedAt: new Date(),
      failureCount: 0,
      disabledReason: null,
    });

    res.status(200).json({
      success: true,
      message: 'Webhook secret rotated. The new secret is shown once. The previous secret remains valid for 24 hours.',
      secret: newSecret,
      data: serializeWebhook(updated),
    });
  } catch (error) {
    next(error);
  }
};

const ping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    const result = await pingWebhook(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getDeliveries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    const deliveries = await WebhookDelivery.find({ webhookId: id }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};

const redeliverDelivery = async (req, res, next) => {
  try {
    const { id, deliveryId } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) throw AppError.notFound('Webhook not found');

    const delivery = await WebhookDelivery.findOne({ _id: deliveryId, webhookId: id });
    if (!delivery) throw AppError.notFound('Delivery not found');

    const result = await redeliver(deliveryId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const drain = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.body?.limit) || 50, 200);
    const result = await webhookService.drainPending(limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  rotateSecret,
  ping,
  getDeliveries,
  redeliverDelivery,
  drain,
};