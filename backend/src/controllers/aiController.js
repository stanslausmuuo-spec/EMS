const Event = require('../models/Event');
const Session = require('../models/Session');
const Ticket = require('../models/Ticket');

const chatWithAI = async (req, res) => {
  try {
    const { prompt, eventId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const query = prompt.toLowerCase();
    let contextData = '';

    // Fetch relevant context from DB
    if (eventId) {
      const event = await Event.findById(eventId);
      const sessions = await Session.find({ event: eventId });
      contextData = `Event: ${event?.title || 'Unknown'} at ${event?.location || 'Venue'} on ${event?.date || 'TBD'}. Description: ${event?.description || ''}. Sessions: ${sessions.map(s => `${s.title} (${s.track}) at ${new Date(s.startTime).toLocaleTimeString()} in ${s.room}`).join('; ')}`;
    } else {
      const events = await Event.find().limit(5);
      contextData = `Upcoming Events: ${events.map(e => `${e.title} (${e.location})`).join(', ')}`;
    }

    // Smart context-matching response generator (Zero-config reliable fallback)
    let reply = '';
    if (query.includes('hello') || query.includes('hi')) {
      reply = "Hello! I am your EMS AI Event Assistant. How can I help you navigate today's events, sessions, or ticketing?";
    } else if (query.includes('ticket') || query.includes('register') || query.includes('buy')) {
      reply = "You can register for events directly from the Home page or view your active passes under 'My Tickets'. Each ticket generates a unique QR code for gate check-in.";
    } else if (query.includes('session') || query.includes('schedule') || query.includes('agenda') || query.includes('track')) {
      reply = `Here is what is happening: ${contextData}. You can bookmark breakout sessions directly from the Event Agenda view.`;
    } else if (query.includes('check-in') || query.includes('scan') || query.includes('gate')) {
      reply = "Gate scanners support live online validation as well as offline PWA caching with automatic synchronization when network connectivity is restored.";
    } else {
      reply = `Based on event context (${contextData}), regarding "${prompt}": I recommend checking the specific event details page or contacting the event organizer directly. Is there anything else I can assist you with?`;
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        contextUsed: !!eventId
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  chatWithAI
};
