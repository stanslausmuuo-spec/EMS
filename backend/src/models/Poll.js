const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const pollSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  question: { type: String, required: true, trim: true },
  options: [{
    text: { type: String, required: true, trim: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

const MongoosePoll = mongoose.models.Poll || mongoose.model('Poll', pollSchema);

module.exports = {
  findOne: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.polls.findOne(query));
    return MongoosePoll.findOne(query, projection, options);
  },
  find: (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.polls.find(query));
    return MongoosePoll.find(query, projection, options);
  },
  findById: (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.polls.findById(id));
    return MongoosePoll.findById(id, projection, options);
  },
  create: (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.polls.create(doc);
    return MongoosePoll.create(doc);
  },
  countDocuments: (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.polls.countDocuments(query);
    return MongoosePoll.countDocuments(query);
  },
  findOneAndUpdate: (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.polls.findOneAndUpdate(query, update, options));
    return MongoosePoll.findOneAndUpdate(query, update, options);
  }
};
