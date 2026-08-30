const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

const validateAndCheckIn = async (req, res) => {
  try {
    const { qrCodeHash } = req.body;
    if (!qrCodeHash) {
      return res.status(400).json({ success: false, message: 'QR code hash is required' });
    }

    const ticket = await Ticket.findOne({ qrCodeHash }).populate('event attendee', 'title name email');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Invalid ticket: Not found in database' });
    }

    if (ticket.status === 'Checked-In') {
      return res.status(400).json({ 
        success: false, 
        message: `Ticket already checked in at ${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'earlier'}`,
        data: ticket 
      });
    }

    if (ticket.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Ticket has been cancelled' });
    }

    // Mark as checked in
    ticket.status = 'Checked-In';
    ticket.checkedInAt = new Date();
    await ticket.save();

    // Emit real-time update via Socket.io if io instance is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(ticket.event._id.toString()).emit('ticketCheckedIn', {
        ticketId: ticket._id,
        eventId: ticket.event._id,
        attendeeName: ticket.attendee.name,
        checkedInAt: ticket.checkedInAt
      });
    }

    res.json({
      success: true,
      message: 'Check-in successful!',
      data: ticket
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventCheckInStats = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const totalTicketsSold = event.soldTickets;
    const totalCheckedIn = await Ticket.countDocuments({ event: eventId, status: 'Checked-In' });

    res.json({
      success: true,
      data: {
        eventId,
        title: event.title,
        capacity: event.capacity,
        soldTickets: totalTicketsSold,
        checkedInCount: totalCheckedIn,
        attendanceRate: totalTicketsSold > 0 ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventAttendeesCSV = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tickets = await Ticket.find({ event: eventId }).populate('attendee', 'name email');

    let csv = 'Ticket ID,Attendee Name,Email,Status,Checked-In At\n';
    tickets.forEach(t => {
      csv += `"${t._id}","${t.attendee?.name || 'Unknown'}","${t.attendee?.email || 'Unknown'}","${t.status}","${t.checkedInAt ? new Date(t.checkedInAt).toISOString() : 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendees-${eventId}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  validateAndCheckIn,
  getEventCheckInStats,
  getEventAttendeesCSV
};
