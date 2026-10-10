const crypto = require('crypto');
const {
  signPayload,
  parseSignatureHeader,
  verifySignature,
  DEFAULT_TOLERANCE_SECONDS,
} = require('../../src/utils/webhookSignature');

const hmac = (secret, timestamp, rawBody) =>
  crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');

describe('webhookSignature', () => {
  describe('signPayload', () => {
    it('produces a Stripe-style t=...,v1=... header over "{timestamp}.{body}"', () => {
      const header = signPayload('{"hello":"world"}', 'whsec_test', 1700000000);
      const expected = hmac('whsec_test', 1700000000, '{"hello":"world"}');
      expect(header).toBe(`t=1700000000,v1=${expected}`);
    });

    it('uses the current time by default', () => {
      const before = Math.floor(Date.now() / 1000);
      const header = signPayload('body', 'secret');
      const ts = Number(header.split(',')[0].slice(2));
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });
  });

  describe('parseSignatureHeader', () => {
    it('parses timestamp and signature', () => {
      const sig = 'a'.repeat(64);
      expect(parseSignatureHeader(`t=123,v1=${sig}`)).toEqual({ timestamp: 123, signatures: [sig] });
    });

    it('collects multiple v1 signatures', () => {
      const a = 'a'.repeat(64);
      const b = 'b'.repeat(64);
      expect(parseSignatureHeader(`t=123,v1=${a},v1=${b}`)).toEqual({
        timestamp: 123,
        signatures: [a, b],
      });
    });

    it('rejects malformed / empty / non-hex headers', () => {
      expect(parseSignatureHeader(null)).toBeNull();
      expect(parseSignatureHeader('')).toBeNull();
      expect(parseSignatureHeader('garbage')).toBeNull();
      expect(parseSignatureHeader('t=123,v1=nothex')).toBeNull();
      expect(parseSignatureHeader('v1=' + 'a'.repeat(64))).toBeNull();
    });
  });

  describe('verifySignature', () => {
    const secret = 'whsec_secret';
    const rawBody = '{"id":"evt_1"}';

    it('accepts a valid signature', () => {
      const header = signPayload(rawBody, secret, 1700000000);
      const result = verifySignature({ rawBody, header, secret, now: 1700000000 * 1000 });
      expect(result).toEqual({ ok: true });
    });

    it('rejects a tampered body', () => {
      const header = signPayload(rawBody, secret, 1700000000);
      const result = verifySignature({ rawBody: rawBody + 'x', header, secret, now: 1700000000 * 1000 });
      expect(result).toEqual({ ok: false, reason: 'no_matching_signature' });
    });

    it('rejects a wrong secret', () => {
      const header = signPayload(rawBody, secret, 1700000000);
      const result = verifySignature({ rawBody, header, secret: 'other', now: 1700000000 * 1000 });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('no_matching_signature');
    });

    it('rejects stale timestamps outside tolerance', () => {
      const header = signPayload(rawBody, secret, 1700000000);
      const result = verifySignature({
        rawBody,
        header,
        secret,
        now: (1700000000 + DEFAULT_TOLERANCE_SECONDS + 1) * 1000,
      });
      expect(result).toEqual({ ok: false, reason: 'timestamp_out_of_tolerance' });
    });

    it('accepts timestamps within tolerance', () => {
      const header = signPayload(rawBody, secret, 1700000000);
      const result = verifySignature({
        rawBody,
        header,
        secret,
        now: (1700000000 + DEFAULT_TOLERANCE_SECONDS - 1) * 1000,
      });
      expect(result).toEqual({ ok: true });
    });

    it('accepts when any provided v1 matches (dual-secret rotation)', () => {
      const oldSig = hmac(secret, 1700000000, rawBody);
      const newSig = hmac('whsec_new', 1700000000, rawBody);
      const header = `t=1700000000,v1=${'0'.repeat(64)},v1=${newSig},v1=${oldSig}`;
      const result = verifySignature({ rawBody, header, secret, now: 1700000000 * 1000 });
      expect(result).toEqual({ ok: true });
    });

    it('rejects malformed headers', () => {
      expect(verifySignature({ rawBody, header: 'nope', secret })).toEqual({
        ok: false,
        reason: 'malformed_header',
      });
    });
  });
});
