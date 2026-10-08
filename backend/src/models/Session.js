const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  track: { type: String, default: 'General', trim: true },
  speaker: { type: String, default: '', trim: true },
  room: { type: String, default: 'Main Hall', trim: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  capacity: { type: Number, default: 100 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
