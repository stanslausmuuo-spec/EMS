const { Queue, Worker } = require('bullmq');
const redis = require('../config/redis');
const webhookService = require('../services/webhookService');

const webhookQueue = new Queue('webhook-delivery', {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const worker = new Worker(
  'webhook-delivery',
  async (job) => {
    const { deliveryId } = job.data;
    return webhookService.deliverOne(deliveryId);
  },
  { connection: redis, concurrency: 5 }
);

worker.on('completed', (job) => {
  console.log(`Webhook delivery job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`Webhook delivery job ${job ? job.id : '?'} failed: ${err.message}`);
});

module.exports = { webhookQueue, worker };