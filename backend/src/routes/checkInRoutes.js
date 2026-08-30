const express = require('express');
const router = express.Router();
const { validateAndCheckIn, getEventCheckInStats, getEventAttendeesCSV } = require('../controllers/checkInController');
const { protect, authorize } = require('../middleware/auth');

router.post('/scan', protect, authorize('Organizer', 'Admin', 'Attendee'), validateAndCheckIn);
router.get('/events/:eventId/stats', protect, authorize('Organizer', 'Admin'), getEventCheckInStats);
router.get('/events/:eventId/attendees/csv', protect, authorize('Organizer', 'Admin'), getEventAttendeesCSV);

module.exports = router;
