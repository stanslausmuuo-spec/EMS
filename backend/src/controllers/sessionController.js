const Session = require('../models/Session');
const Event = require('../models/Event');

const getEventSessions = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { track } = req.query;

    const query = { event: eventId };
    if (track) query.track = track;

    const sessions = await Session.find(query)
      .populate('attendees', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { title, description, track, speaker, room, startTime, endTime, capacity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const session = await Session.create({
      event: eventId,
      title,
      description,
      track,
      speaker,
      room,
      startTime,
      endTime,
      capacity: capacity || 100
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerForSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already registered for this session' });
    }

    if (session.attendees.length >= session.capacity) {
      return res.status(400).json({ success: false, message: 'Session has reached maximum capacity' });
    }

    session.attendees.push(userId);
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for session',
      data: session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const unregisterSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.attendees = session.attendees.filter(id => id.toString() !== userId.toString());
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from session',
      data: session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEventSessions,
  createSession,
  registerForSession,
  unregisterSession
};
