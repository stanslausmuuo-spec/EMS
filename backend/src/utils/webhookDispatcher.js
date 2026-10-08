const crypto = require('crypto');
const Webhook = require('../models/Webhook');

const dispatchWebhook = async (eventType, payload) => {
  try {
    const webhooks = await Webhook.find({ events: eventType, active: true });
    if (!webhooks || webhooks.length === 0) return;

    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    });

    for (const hook of webhooks) {
      try {
        const signature = crypto
          .createHmac('sha256', hook.secret || 'ems_secret')
          .update(body)
          .digest('hex');

        // Non-blocking dispatch
        fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-EMS-Signature': `sha256=${signature}`,
            'X-EMS-Event': eventType
          },
          body
        }).catch(err => {
          console.error(`Webhook delivery failed for ${hook.url}:`, err.message);
        });
      } catch (err) {
        console.error(`Error dispatching webhook to ${hook.url}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Webhook dispatcher error:', err.message);
  }
};

module.exports = dispatchWebhook;
