const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  score: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Warm' },
  notes: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  scannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

leadSchema.index({ exhibitor: 1, event: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
