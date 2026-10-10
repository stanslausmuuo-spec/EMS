const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const redis = require('../config/redis');
const { ticketQueue } = require('../queues/ticketQueue');
const crypto = require('crypto');
const { safeEmit } = require('../services/webhookService');

const isPopulated = (value) => value && typeof value === 'object';

const hydrateTickets = async (tickets) => {
  const list = Array.isArray(tickets) ? tickets : [tickets];
  const missingEventIds = [
    ...new Set(
      list
        .filter((t) => t && !isPopulated(t.event))
        .map((t) => String(t.event))
        .filter(Boolean),
    ),
  ];
  let eventMap = new Map();
  if (missingEventIds.length) {
    const events = await Event.find({ _id: { $in: missingEventIds } });
    eventMap = new Map(events.map((e) => [e._id.toString(), e]));
  }
  const missingAttendeeIds = [
    ...new Set(
      list
        .filter((t) => t && t.attendee && !isPopulated(t.attendee))
        .map((t) => String(t.attendee))
        .filter(Boolean),
    ),
  ];
  let attendeeMap = new Map();
  if (missingAttendeeIds.length) {
    const users = await User.find({ _id: { $in: missingAttendeeIds } });
    attendeeMap = new Map(users.map((u) => [u._id.toString(), u]));
  }
  list.forEach((t) => {
    if (!t) return;
    if (!isPopulated(t.event)) t.event = eventMap.get(String(t.event)) || t.event;
    if (t.attendee && !isPopulated(t.attendee)) t.attendee = attendeeMap.get(String(t.attendee)) || t.attendee;
  });
  return tickets;
};

const registerForEvent = async (req, res, next) => {
  const eventId = req.params.eventId;
  const userId = req.user._id;
  const lockKey = `lock:event:${eventId}`;
  const lockClient = redis;
  const lockToken = crypto.randomBytes(16).toString('hex');
  const redisReady = lockClient.status === 'ready';

  // 1. Acquire Redis Atomic Distributed Lock (NX with 5s expiry, fallback safe).
  //    When Redis is unavailable we skip the distributed lock and rely on the
  //    atomic $expr capacity guard below.
  if (redisReady) {
    const acquired = await lockClient.set(lockKey, lockToken, 'PX', 5000, 'NX').catch(() => 'OK');
    if (!acquired) {
      return res.status(429).json({
        success: false,
        message: 'High traffic detected! Please try again in a moment (seat lock contention).'
      });
    }
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

    // 6. Push Asynchronous Job to BullMQ for PDF & Email generation (with try/catch fallback).
    //    Skipped when Redis is unavailable to avoid hanging on the offline queue.
    if (redisReady) {
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
    }

    await safeEmit('registration.created', {
      eventId: String(updatedEvent._id),
      eventTitle: updatedEvent.title,
      ticketId: String(ticket._id),
      attendeeId: String(req.user._id),
      attendeeName: req.user.name,
      attendeeEmail: req.user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event! Ticket is generated.',
      data: ticket
    });

  } catch (error) {
    next(error);
  } finally {
    // Release Redis Lock safely using Lua script or token match check
    if (redisReady) {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await lockClient.eval(script, 1, lockKey, lockToken).catch(() => {});
    }
  }
};

const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ attendee: req.user._id })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    await hydrateTickets(tickets);

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('event attendee', '-password');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await hydrateTickets(ticket);

    if (ticket.attendee?._id?.toString() !== req.user._id.toString() && req.user.role === 'Attendee') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
    getMyTickets,
    getTicketById
};
