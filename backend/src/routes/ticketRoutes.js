const express = require('express');
const router = express.Router();
const { registerForEvent, getMyTickets, getTicketById } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.post('/events/:eventId/register', protect, authorize('Attendee', 'Organizer', 'Admin'), registerForEvent);
router.get('/my-tickets', protect, getMyTickets);
router.get('/:id', protect, getTicketById);

module.exports = router;
