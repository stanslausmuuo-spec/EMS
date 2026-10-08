const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

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

const MongooseLead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = {
  findOne: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.leads.findOne(query));
    return MongooseLead.findOne(query, projection, options);
  },
  find: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.leads.find(query));
    return MongooseLead.find(query, projection, options);
  },
  findById: async (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.leads.findById(id));
    return MongooseLead.findById(id, projection, options);
  },
  create: async (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.leads.create(doc);
    return MongooseLead.create(doc);
  },
  countDocuments: async (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.leads.countDocuments(query);
    return MongooseLead.countDocuments(query);
  },
  findOneAndUpdate: async (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.leads.findOneAndUpdate(query, update, options));
    return MongooseLead.findOneAndUpdate(query, update, options);
  }
};
