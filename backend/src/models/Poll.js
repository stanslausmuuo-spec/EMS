const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  question: { type: String, required: true, trim: true },
  options: [{
    text: { type: String, required: true, trim: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
