const request = require('supertest');
const createApp = require('../../src/app');

describe('error contract (integration)', () => {
  const app = createApp();

  it('serves the root health response', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Event Management System API is running',
    });
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/definitely-not-a-route',
    });
  });

  it('returns JSON 400 for malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      code: 'BAD_REQUEST',
      message: 'Invalid JSON body',
    });
  });

  it('returns JSON 401 when authentication is missing', async () => {
    const res = await request(app).get('/api/webhooks');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  });

  it('sets an X-Request-Id on every response', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('rate limits with a JSON 429 envelope', async () => {
    const limited = createApp();
    let last;
    for (let i = 0; i < 101; i += 1) {
      last = await request(limited).get('/api/definitely-not-a-route');
    }
    expect(last.status).toBe(429);
    expect(last.body).toEqual({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again shortly.',
    });
  });
});
