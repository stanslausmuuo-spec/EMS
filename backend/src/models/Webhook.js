const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const webhookSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true, trim: true },
  events: [{ type: String, required: true }],
  secret: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const MongooseWebhook = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);

module.exports = {
  findOne: async (query) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.webhooks?.findOne(query) || null);
    return MongooseWebhook.findOne(query);
  },
  find: async (query) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.webhooks?.find(query) || []);
    return MongooseWebhook.find(query);
  },
  findById: async (id) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.webhooks?.findById(id) || null);
    return MongooseWebhook.findById(id);
  },
  create: async (doc) => {
    if (global.USE_MEMORY_DB) {
      if (!memoryDb.webhooks) {
        const MemoryModel = require('../config/memoryDb');
        // add webhooks collection
      }
      return memoryDb.webhooks.create(doc);
    }
    return MongooseWebhook.create(doc);
  },
  countDocuments: async (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.webhooks?.countDocuments(query) || 0;
    return MongooseWebhook.countDocuments(query);
  },
  findByIdAndDelete: async (id) => {
    if (global.USE_MEMORY_DB) {
      const idx = memoryDb.webhooks?.data.findIndex(w => w._id?.toString() === id?.toString());
      if (idx !== -1) return memoryDb.webhooks.data.splice(idx, 1)[0];
      return null;
    }
    return MongooseWebhook.findByIdAndDelete(id);
  }
};
