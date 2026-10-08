const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const questionSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  answered: { type: Boolean, default: false }
}, { timestamps: true });

const MongooseQuestion = mongoose.models.Question || mongoose.model('Question', questionSchema);

module.exports = {
  findOne: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.questions.findOne(query));
    return MongooseQuestion.findOne(query, projection, options);
  },
  find: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.questions.find(query));
    return MongooseQuestion.find(query, projection, options);
  },
  findById: async (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.questions.findById(id));
    return MongooseQuestion.findById(id, projection, options);
  },
  create: async (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.questions.create(doc);
    return MongooseQuestion.create(doc);
  },
  countDocuments: async (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.questions.countDocuments(query);
    return MongooseQuestion.countDocuments(query);
  },
  findOneAndUpdate: async (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.questions.findOneAndUpdate(query, update, options));
    return MongooseQuestion.findOneAndUpdate(query, update, options);
  }
};
