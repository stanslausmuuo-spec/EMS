const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

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

const MongooseSession = mongoose.models.Session || mongoose.model('Session', sessionSchema);

module.exports = {
  findOne: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.sessions.findOne(query));
    return MongooseSession.findOne(query, projection, options);
  },
  find: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.sessions.find(query));
    return MongooseSession.find(query, projection, options);
  },
  findById: (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.sessions.findById(id));
    return MongooseSession.findById(id, projection, options);
  },
  create: (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.sessions.create(doc);
    return MongooseSession.create(doc);
  },
  countDocuments: (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.sessions.countDocuments(query);
    return MongooseSession.countDocuments(query);
  },
  findOneAndUpdate: (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.sessions.findOneAndUpdate(query, update, options));
    return MongooseSession.findOneAndUpdate(query, update, options);
  }
};
