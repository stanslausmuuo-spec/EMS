const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

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

const MongooseTicket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

module.exports = {
  findOne: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.tickets.findOne(query));
    return MongooseTicket.findOne(query, projection, options);
  },
  find: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.tickets.find(query));
    return MongooseTicket.find(query, projection, options);
  },
  findById: (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.tickets.findById(id));
    return MongooseTicket.findById(id, projection, options);
  },
  create: (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.tickets.create(doc);
    return MongooseTicket.create(doc);
  },
  countDocuments: (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.tickets.countDocuments(query);
    return MongooseTicket.countDocuments(query);
  },
  findOneAndUpdate: (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.tickets.findOneAndUpdate(query, update, options));
    return MongooseTicket.findOneAndUpdate(query, update, options);
  }
};
