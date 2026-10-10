const request = require('supertest');
const nock = require('nock');
const createApp = require('../../src/app');

const WEBHOOK_HOST = 'https://93.184.216.34';

describe('webhook API (integration)', () => {
  const app = createApp();
  let organizerToken;
  let attendeeToken;

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  const waitForSeeds = async () => {
    for (let i = 0; i < 20; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'organizer@ems.local', password: 'password123' });
      if (res.status === 200) return res.body.data.token;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('seeded organizer not available');
  };

  beforeAll(async () => {
    nock.disableNetConnect();
    nock.enableNetConnect((host) => /127\.0\.0\.1|localhost/.test(host));
    organizerToken = await waitForSeeds();
    const attendee = await request(app)
      .post('/api/auth/login')
      .send({ email: 'attendee@ems.local', password: 'password123' });
    attendeeToken = attendee.body.data.token;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/webhooks');
    expect(res.status).toBe(401);
  });

  it('forbids non-organizer roles', async () => {
    const res = await request(app).get('/api/webhooks').set(auth(attendeeToken));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('requires a url', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ events: ['registration.created'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/url is required/i);
  });

  it('rejects unsupported events', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['bogus.event'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported/i);
  });

  it('rejects SSRF-unsafe urls', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: 'http://169.254.169.254/latest/meta-data', events: ['registration.created'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/blocked/i);
  });

  it('creates a webhook and returns the secret exactly once', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created', 'checkin.completed'] });
    expect(create.status).toBe(201);
    expect(create.body.secret).toMatch(/^whsec_[0-9a-f]{64}$/);
    expect(create.body.data).not.toHaveProperty('secret');
    expect(create.body.data).not.toHaveProperty('secretEnc');
    expect(create.body.data.active).toBe(true);

    const list = await request(app).get('/api/webhooks').set(auth(organizerToken));
    expect(list.status).toBe(200);
    const stored = list.body.data.find((w) => w._id === create.body.data._id);
    expect(stored).toBeTruthy();
    expect(stored).not.toHaveProperty('secret');
    expect(stored).not.toHaveProperty('secretEnc');
    expect(JSON.stringify(list.body)).not.toContain('whsec_');
  });

  it('updates active state and url', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created'] });

    const pause = await request(app)
      .patch(`/api/webhooks/${create.body.data._id}`)
      .set(auth(organizerToken))
      .send({ active: false });
    expect(pause.status).toBe(200);
    expect(pause.body.data.active).toBe(false);

    const resume = await request(app)
      .patch(`/api/webhooks/${create.body.data._id}`)
      .set(auth(organizerToken))
      .send({ active: true, events: ['checkin.completed'] });
    expect(resume.status).toBe(200);
    expect(resume.body.data.active).toBe(true);
    expect(resume.body.data.events).toEqual(['checkin.completed']);
  });

  it('rotates the secret with a 24h overlap window', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created'] });

    const rotate = await request(app)
      .post(`/api/webhooks/${create.body.data._id}/rotate-secret`)
      .set(auth(organizerToken));
    expect(rotate.status).toBe(200);
    expect(rotate.body.secret).toMatch(/^whsec_/);
    expect(rotate.body.secret).not.toBe(create.body.secret);
    expect(rotate.body.data.secretRotatedAt).toBeTruthy();
  });

  it('pings an endpoint and records a delivery', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created'] });

    nock(WEBHOOK_HOST).post('/hook').reply(200, { received: true });

    const ping = await request(app)
      .post(`/api/webhooks/${create.body.data._id}/ping`)
      .set(auth(organizerToken));
    expect(ping.status).toBe(200);
    expect(ping.body.data.ok).toBe(true);

    const deliveries = await request(app)
      .get(`/api/webhooks/${create.body.data._id}/deliveries`)
      .set(auth(organizerToken));
    expect(deliveries.status).toBe(200);
    expect(deliveries.body.count).toBeGreaterThanOrEqual(1);
    expect(deliveries.body.data[0]).toMatchObject({ event: 'webhook.ping', status: 'success' });
  });

  it('redelivers a failed delivery', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created'] });

    nock(WEBHOOK_HOST).post('/hook').reply(500, { error: 'boom' });
    const failed = await request(app)
      .post(`/api/webhooks/${create.body.data._id}/ping`)
      .set(auth(organizerToken));
    expect(failed.body.data.ok).toBe(false);

    const list = await request(app)
      .get(`/api/webhooks/${create.body.data._id}/deliveries`)
      .set(auth(organizerToken));
    const failedDelivery = list.body.data.find((d) => d.status === 'failed');
    expect(failedDelivery).toBeTruthy();

    nock(WEBHOOK_HOST).post('/hook').reply(200, { recovered: true });
    const retry = await request(app)
      .post(`/api/webhooks/${create.body.data._id}/deliveries/${failedDelivery._id}/redeliver`)
      .set(auth(organizerToken));
    expect(retry.status).toBe(200);
    expect(retry.body.data.ok).toBe(true);
  });

  it('deletes a webhook', async () => {
    const create = await request(app)
      .post('/api/webhooks')
      .set(auth(organizerToken))
      .send({ url: `${WEBHOOK_HOST}/hook`, events: ['registration.created'] });

    const del = await request(app)
      .delete(`/api/webhooks/${create.body.data._id}`)
      .set(auth(organizerToken));
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/webhooks').set(auth(organizerToken));
    expect(list.body.data.find((w) => w._id === create.body.data._id)).toBeUndefined();
  });

  it('protects the cron drain endpoint with a shared secret', async () => {
    const forbidden = await request(app).post('/api/webhooks/cron/drain').send({ limit: 5 });
    expect(forbidden.status).toBe(403);

    const wrong = await request(app)
      .post('/api/webhooks/cron/drain')
      .set('x-cron-secret', 'nope')
      .send({ limit: 5 });
    expect(wrong.status).toBe(403);

    const ok = await request(app)
      .post('/api/webhooks/cron/drain')
      .set('x-cron-secret', process.env.CRON_SECRET)
      .send({ limit: 5 });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toHaveProperty('processed');
  });
});
