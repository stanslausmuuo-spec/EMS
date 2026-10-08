const express = require('express');
const router = express.Router();
const { getEventSessions, createSession, registerForSession, unregisterSession } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/event/:eventId', getEventSessions);
router.post('/event/:eventId', protect, authorize('Organizer', 'Admin'), createSession);
router.post('/:id/register', protect, registerForSession);
router.delete('/:id/register', protect, unregisterSession);

module.exports = router;
