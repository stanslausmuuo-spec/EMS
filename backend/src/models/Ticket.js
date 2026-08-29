const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  qrCodeHash: { type: String, required: true, unique: true, index: true },
  status: { 
    type: String, 
    enum: ['Valid', 'Checked-In', 'Cancelled'], 
    default: 'Valid' 
  },
  checkedInAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
