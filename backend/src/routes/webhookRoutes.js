const express = require('express');
const router = express.Router();
const {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  rotateSecret,
  ping,
  getDeliveries,
  redeliverDelivery,
  drain,
} = require('../controllers/webhookController');
const { protect, authorize } = require('../middleware/auth');

router.post(
  '/cron/drain',
  (req, res, next) => {
    const provided = req.headers['x-cron-secret'];
    const expected = process.env.CRON_SECRET;
    if (!expected || provided !== expected) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
    }
    next();
  },
  drain
);

router.use(protect);
router.use(authorize('Organizer', 'Admin'));

router.get('/', getWebhooks);
router.post('/', createWebhook);
router.patch('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/rotate-secret', rotateSecret);
router.post('/:id/ping', ping);
router.get('/:id/deliveries', getDeliveries);
router.post('/:id/deliveries/:deliveryId/redeliver', redeliverDelivery);

module.exports = router;