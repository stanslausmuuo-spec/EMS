const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const webhookDeliverySchema = new mongoose.Schema(
  {
    webhookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Webhook', required: true, index: true },
    eventId: { type: String, required: true, index: true, unique: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    responseStatus: { type: Number, default: null },
    responseBodySnippet: { type: String, default: null },
    error: { type: String, default: null },
    nextRetryAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });

const MongooseWebhookDelivery =
  mongoose.models.WebhookDelivery || mongoose.model('WebhookDelivery', webhookDeliverySchema);

const db = () => memoryDb.webhookDeliveries;

module.exports = {
  findOne: (query) => {
    if (global.USE_MEMORY_DB) return makeChainable(db().findOne(query));
    return MongooseWebhookDelivery.findOne(query);
  },
  find: (query) => {
    if (global.USE_MEMORY_DB) return makeChainable(db().find(query));
    return MongooseWebhookDelivery.find(query);
  },
  findById: (id) => {
    if (global.USE_MEMORY_DB) return makeChainable(db().findById(id));
    return MongooseWebhookDelivery.findById(id);
  },
  create: (doc) => {
    if (global.USE_MEMORY_DB) return db().create(doc);
    return MongooseWebhookDelivery.create(doc);
  },
  countDocuments: (query) => {
    if (global.USE_MEMORY_DB) return db().countDocuments(query);
    return MongooseWebhookDelivery.countDocuments(query);
  },
  findByIdAndUpdate: (id, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(db().findByIdAndUpdate(id, update, options));
    return MongooseWebhookDelivery.findByIdAndUpdate(id, update, options);
  },
};