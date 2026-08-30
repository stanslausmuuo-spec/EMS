const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const redis = require('../config/redis');
const { ticketQueue } = require('../queues/ticketQueue');
const crypto = require('crypto');

const registerForEvent = async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user._id;
  const lockKey = `lock:event:${eventId}`;
  const lockClient = redis;
  const lockToken = crypto.randomBytes(16).toString('hex');

  // 1. Acquire Redis Atomic Distributed Lock (NX with 5s expiry, fallback safe)
  const acquired = await lockClient.set(lockKey, lockToken, 'PX', 5000, 'NX').catch(() => 'OK');
  if (!acquired) {
    return res.status(429).json({ 
      success: false, 
      message: 'High traffic detected! Please try again in a moment (seat lock contention).' 
    });
  }

  try {
    // 2. Check if user already registered for this event
    const existingTicket = await Ticket.findOne({ event: eventId, attendee: userId, status: { $ne: 'Cancelled' } });
    if (existingTicket) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    // 3. Atomically update Event soldTickets using MongoDB $expr constraint (soldTickets < capacity)
    const updatedEvent = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        $expr: { $lt: ['$soldTickets', '$capacity'] } 
      },
      { $inc: { soldTickets: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({ success: false, message: 'Event is sold out!' });
    }

    // 4. Generate unique QR code hash
    const qrCodeHash = crypto.createHash('sha256').update(`${eventId}-${userId}-${Date.now()}`).digest('hex');

    // 5. Create Ticket in DB
    const ticket = await Ticket.create({
      event: eventId,
      attendee: userId,
      qrCodeHash,
      status: 'Valid'
    });

    // 6. Push Asynchronous Job to BullMQ for PDF & Email generation (with try/catch fallback)
    try {
      await ticketQueue.add('process-ticket', {
        ticketId: ticket._id.toString(),
        attendeeEmail: req.user.email,
        attendeeName: req.user.name,
        eventTitle: updatedEvent.title,
        eventDate: updatedEvent.date,
        eventLocation: updatedEvent.location,
        qrCodeHash
      });
    } catch (qErr) {
      console.warn('Queue warning:', qErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event! Ticket is generated.',
      data: ticket
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // Release Redis Lock safely using Lua script or token match check
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await lockClient.eval(script, 1, lockKey, lockToken).catch(() => {});
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ attendee: req.user._id })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('event attendee', '-password');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.attendee._id.toString() !== req.user._id.toString() && req.user.role === 'Attendee') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerForEvent,
    getMyTickets,
    getTicketById
};
