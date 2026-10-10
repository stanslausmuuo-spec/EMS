const Lead = require('../models/Lead');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { safeEmit } = require('../services/webhookService');

const isPopulated = (value) => value && typeof value === 'object';

const hydrateLeads = async (leads) => {
  const list = Array.isArray(leads) ? leads : [leads];
  const eventIds = [
    ...new Set(list.filter((l) => l && !isPopulated(l.event)).map((l) => String(l.event)).filter(Boolean)),
  ];
  const attendeeIds = [
    ...new Set(list.filter((l) => l && !isPopulated(l.attendee)).map((l) => String(l.attendee)).filter(Boolean)),
  ];
  let eventMap = new Map();
  let attendeeMap = new Map();
  if (eventIds.length) {
    const events = await Event.find({ _id: { $in: eventIds } });
    eventMap = new Map(events.map((e) => [e._id.toString(), e]));
  }
  if (attendeeIds.length) {
    const users = await User.find({ _id: { $in: attendeeIds } });
    attendeeMap = new Map(users.map((u) => [u._id.toString(), u]));
  }
  list.forEach((l) => {
    if (!l) return;
    if (!isPopulated(l.event)) l.event = eventMap.get(String(l.event)) || l.event;
    if (!isPopulated(l.attendee)) l.attendee = attendeeMap.get(String(l.attendee)) || l.attendee;
  });
  return leads;
};

const captureLead = async (req, res, next) => {
  try {
    const { eventId, attendeeId, email, qrCodeHash, score, notes, tags } = req.body;
    const exhibitorId = req.user._id;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    let targetAttendeeId = attendeeId;

    if (!targetAttendeeId && email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ success: false, message: 'Attendee not found with this email' });
      targetAttendeeId = user._id;
    }

    if (!targetAttendeeId && qrCodeHash) {
      const ticket = await Ticket.findOne({ qrCodeHash }).populate('attendee');
      if (!ticket) return res.status(404).json({ success: false, message: 'Invalid ticket / QR code' });
      targetAttendeeId = ticket.attendee._id;
    }

    if (!targetAttendeeId) {
      return res.status(400).json({ success: false, message: 'Provide attendeeId, email, or qrCodeHash' });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Verify attendee exists
    const attendee = await User.findById(targetAttendeeId);
    if (!attendee) return res.status(404).json({ success: false, message: 'Attendee not found' });

    // Upsert lead (prevent duplicate scans for same exhibitor, event, attendee)
    const lead = await Lead.findOneAndUpdate(
      { exhibitor: exhibitorId, event: eventId, attendee: targetAttendeeId },
      { 
        $set: { 
          score: score || 'Warm', 
          notes: notes !== undefined ? notes : '', 
          tags: tags || [],
          scannedAt: Date.now()
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('attendee', 'name email').populate('event', 'title date');

    await hydrateLeads(lead);

    await safeEmit('lead.captured', {
      leadId: String(lead._id),
      eventId: String(lead.event._id || lead.event),
      attendeeId: String(lead.attendee._id || lead.attendee),
      exhibitorId: String(exhibitorId),
      score: lead.score,
      tags: lead.tags || [],
    });

    res.status(200).json({
      success: true,
      message: 'Lead captured successfully',
      data: lead
    });

  } catch (error) {
    next(error);
  }
};

const getExhibitorLeads = async (req, res, next) => {
  try {
    const exhibitorId = req.user._id;
    const { eventId, score } = req.query;

    const query = { exhibitor: exhibitorId };
    if (eventId) query.event = eventId;
    if (score) query.score = score;

    const leads = await Lead.find(query)
      .populate('attendee', 'name email')
      .populate('event', 'title date location')
      .sort({ scannedAt: -1 });

    await hydrateLeads(leads);

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, notes, tags } = req.body;
    const exhibitorId = req.user._id;

    const lead = await Lead.findOne({ _id: id, exhibitor: exhibitorId });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });
    }

    if (score) lead.score = score;
    if (notes !== undefined) lead.notes = notes;
    if (tags) lead.tags = tags;

    await lead.save();

    const updatedLead = await Lead.findById(lead._id)
      .populate('attendee', 'name email')
      .populate('event', 'title date');

    await hydrateLeads(updatedLead);

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

const exportLeadsCSV = async (req, res, next) => {
  try {
    const exhibitorId = req.user._id;
    const { eventId } = req.query;

    const query = { exhibitor: exhibitorId };
    if (eventId) query.event = eventId;

    const leads = await Lead.find(query)
      .populate('attendee', 'name email')
      .populate('event', 'title')
      .sort({ scannedAt: -1 });

    await hydrateLeads(leads);

    let csv = 'Attendee Name,Email,Event,Score,Notes,Tags,Scanned At\n';
    leads.forEach(l => {
      const name = l.attendee?.name || 'Unknown';
      const email = l.attendee?.email || 'Unknown';
      const eventTitle = l.event?.title || 'Unknown';
      const notesClean = (l.notes || '').replace(/"/g, '""');
      const tagsClean = (l.tags || []).join(';');
      const time = l.scannedAt ? new Date(l.scannedAt).toISOString() : '';
      csv += `"${name}","${email}","${eventTitle}","${l.score}","${notesClean}","${tagsClean}","${time}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=exhibitor-leads.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  captureLead,
  getExhibitorLeads,
  updateLead,
  exportLeadsCSV
};
