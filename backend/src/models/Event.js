const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

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

eventSchema.index({ capacity: 1, soldTickets: 1 });

const MongooseEvent = mongoose.models.Event || mongoose.model('Event', eventSchema);

module.exports = {
  findOne: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.events.findOne(query));
    return MongooseEvent.findOne(query, projection, options);
  },
  find: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.events.find(query));
    return MongooseEvent.find(query, projection, options);
  },
  findById: async (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.events.findById(id));
    return MongooseEvent.findById(id, projection, options);
  },
  create: async (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.events.create(doc);
    return MongooseEvent.create(doc);
  },
  countDocuments: async (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.events.countDocuments(query);
    return MongooseEvent.countDocuments(query);
  },
  findOneAndUpdate: async (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.events.findOneAndUpdate(query, update, options));
    return MongooseEvent.findOneAndUpdate(query, update, options);
  }
};
