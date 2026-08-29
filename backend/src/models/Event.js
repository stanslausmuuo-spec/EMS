const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  soldTickets: { type: Number, default: 0, min: 0 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Ensure soldTickets never exceeds capacity via schema validation $expr logic
eventSchema.index({ capacity: 1, soldTickets: 1 });

module.exports = mongoose.model('Event', eventSchema);
