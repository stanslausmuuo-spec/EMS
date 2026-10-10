const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const AppError = require('../../src/utils/AppError');
const errorHandler = require('../../src/middleware/errorHandler');
const requestId = require('../../src/middleware/requestId');

const buildApp = (handler) => {
  const app = express();
  app.use(requestId);
  app.get('/boom', handler);
  app.use(errorHandler);
  return app;
};

describe('errorHandler', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('maps AppError subclasses to the safe envelope', async () => {
    const cases = [
      [AppError.badRequest('nope'), 400, 'BAD_REQUEST', 'nope'],
      [AppError.unauthorized('auth'), 401, 'UNAUTHORIZED', 'auth'],
      [AppError.forbidden('denied'), 403, 'FORBIDDEN', 'denied'],
      [AppError.notFound('missing'), 404, 'NOT_FOUND', 'missing'],
      [AppError.conflict('dupe'), 409, 'CONFLICT', 'dupe'],
      [AppError.validation('bad input'), 400, 'VALIDATION_ERROR', 'bad input'],
      [AppError.tooManyRequests(), 429, 'RATE_LIMITED', 'Too many requests'],
    ];

    for (const [err, status, code, message] of cases) {
      const res = await request(buildApp((req, res, next) => next(err))).get('/boom');
      expect(res.status).toBe(status);
      expect(res.body).toEqual({ success: false, code, message });
    }
  });

  it('maps ZodError to 400 VALIDATION_ERROR with field errors', async () => {
    const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
    let zodError;
    try {
      schema.parse({ email: 'nope', age: 3 });
    } catch (err) {
      zodError = err;
    }

    const res = await request(buildApp((req, res, next) => next(zodError))).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'age' }),
      ])
    );
  });

  it('maps a Mongoose ValidationError-like error', async () => {
    const err = new Error('validation failed');
    err.name = 'ValidationError';
    err.errors = { name: { message: 'Name is required' } };

    const res = await request(buildApp((req, res, next) => next(err))).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ path: 'name', message: 'Name is required' }]);
  });

  it('maps a CastError to 400 BAD_REQUEST', async () => {
    const err = new Error('cast');
    err.name = 'CastError';
    const res = await request(buildApp((req, res, next) => next(err))).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('maps a Mongo duplicate key error to 409 CONFLICT', async () => {
    const err = new Error('duplicate');
    err.name = 'MongoServerError';
    err.code = 11000;
    const res = await request(buildApp((req, res, next) => next(err))).get('/boom');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('hides internal error details for unexpected errors', async () => {
    const err = new Error('secret database password leaked');
    err.stack = 'Error: secret database password leaked\n at internal.js:1';

    const res = await request(buildApp((req, res, next) => next(err))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    });
    expect(JSON.stringify(res.body)).not.toContain('secret database password');
    expect(JSON.stringify(res.body)).not.toContain('internal.js');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('attaches a request id header and echoes it', async () => {
    const app = express();
    app.use(requestId);
    app.get('/ok', (req, res) => res.json({ id: req.requestId }));
    app.use(errorHandler);

    const res = await request(app).get('/ok');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(res.body.id);
    expect(res.body.id).toEqual(expect.any(String));

    const withHeader = await request(app).get('/ok').set('X-Request-Id', 'client-id-123');
    expect(withHeader.headers['x-request-id']).toBe('client-id-123');
  });
});
