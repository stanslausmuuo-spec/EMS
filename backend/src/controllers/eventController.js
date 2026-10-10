const Event = require('../models/Event');
const { z } = require('zod');
const { safeEmit } = require('../services/webhookService');

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  location: z.string().min(2, 'Location is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1')
});

const getEvents = async (req, res, next) => {
  try {
    const { category, location, search, date } = req.query;
    let query = {};

    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const events = await Event.find(query).populate('organizer', 'name email').sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const validatedData = eventSchema.parse({
      ...req.body,
      capacity: Number(req.body.capacity)
    });

    const event = await Event.create({
      ...validatedData,
      date: new Date(validatedData.date),
      organizer: req.user._id
    });

    await safeEmit('event.created', {
      eventId: String(event._id),
      title: event.title,
      category: event.category,
      date: event.date,
      location: event.location,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
