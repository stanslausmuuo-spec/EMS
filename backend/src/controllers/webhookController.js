const Webhook = require('../models/Webhook');
const crypto = require('crypto');

const getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find({ organizer: req.user._id });
    res.status(200).json({ success: true, count: webhooks.length, data: webhooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ success: false, message: 'URL and events array are required' });
    }

    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    const webhook = await Webhook.create({
      organizer: req.user._id,
      url,
      events,
      secret,
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      data: webhook
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findOne({ _id: id, organizer: req.user._id });
    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    await Webhook.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWebhooks,
  createWebhook,
  deleteWebhook
};
