const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getEvents)
  .post(protect, authorize('Organizer', 'Admin'), createEvent);

router.route('/:id')
  .get(getEventById)
  .put(protect, authorize('Organizer', 'Admin'), updateEvent)
  .delete(protect, authorize('Organizer', 'Admin'), deleteEvent);

module.exports = router;
