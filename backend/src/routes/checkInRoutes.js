const express = require('express');
const router = express.Router();
const { validateAndCheckIn, getEventCheckInStats } = require('../controllers/checkInController');
const { protect, authorize } = require('../middleware/auth');

router.post('/scan', protect, authorize('Organizer', 'Admin', 'Attendee'), validateAndCheckIn);
router.get('/events/:eventId/stats', protect, authorize('Organizer', 'Admin'), getEventCheckInStats);

module.exports = router;
