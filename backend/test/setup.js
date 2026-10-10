process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.WEBHOOK_SECRET_ENC_KEY = 'test-webhook-encryption-key';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.REDIS_URL = 'redis://127.0.0.1:6399';

global.USE_MEMORY_DB = true;

jest.setTimeout(20000);
