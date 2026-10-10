const mongoose = require('mongoose');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const webhookSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true, trim: true },
    events: [{ type: String, required: true }],
    secretEnc: {
      iv: { type: String },
      tag: { type: String },
      data: { type: String },
    },
    previousSecretEnc: {
      iv: { type: String, default: null },
      tag: { type: String, default: null },
      data: { type: String, default: null },
    },
    previousSecretValidUntil: { type: Date, default: null },
    secretRotatedAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    failureCount: { type: Number, default: 0 },
    disabledReason: { type: String, default: null },
    lastDeliveryStatus: { type: String, default: null },
    lastDeliveryAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const MongooseWebhook = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);

const safely = (promiseFactory) => {
  if (global.USE_MEMORY_DB) return promiseFactory(memoryDb.webhooks);
  return promiseFactory(MongooseWebhook);
};

module.exports = {
  findOne: (query) => safely((db) => makeChainable(db.findOne(query))),
  find: (query) => safely((db) => makeChainable(db.find(query))),
  findById: (id) => safely((db) => makeChainable(db.findById(id))),
  create: (doc) => safely((db) => db.create(doc)),
  countDocuments: (query) => safely((db) => db.countDocuments(query)),
  findByIdAndUpdate: (id, update, options) => safely((db) => makeChainable(db.findByIdAndUpdate(id, update, options))),
  findOneAndUpdate: (query, update, options) => safely((db) => makeChainable(db.findOneAndUpdate(query, update, options))),
  updateById: (id, update) => safely(async (db) => {
    const updated = await db.findByIdAndUpdate(id, update);
    return updated ? decorateSaved(updated) : null;
  }),
  findByIdAndDelete: (id) => safely((db) => db.findByIdAndDelete(id)),
};

function decorateSaved(item) {
  if (!item) return item;
  if (!item.save) {
    item.save = async function save() {
      this.updatedAt = new Date();
      const arr = memoryDb.webhooks.data;
      const idx = arr.findIndex((i) => i._id?.toString() === this._id?.toString());
      if (idx !== -1) arr[idx] = this;
      else arr.push(this);
      return this;
    };
  }
  return item;
}