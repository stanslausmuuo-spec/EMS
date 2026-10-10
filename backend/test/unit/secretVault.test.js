const { generateSecret, encryptSecret, decryptSecret } = require('../../src/utils/secretVault');

describe('secretVault', () => {
  beforeEach(() => {
    process.env.WEBHOOK_SECRET_ENC_KEY = 'test-webhook-encryption-key';
    process.env.NODE_ENV = 'test';
  });

  describe('generateSecret', () => {
    it('generates whsec_-prefixed 32-byte hex secrets', () => {
      const secret = generateSecret();
      expect(secret).toMatch(/^whsec_[0-9a-f]{64}$/);
    });

    it('generates unique secrets', () => {
      const set = new Set(Array.from({ length: 50 }, () => generateSecret()));
      expect(set.size).toBe(50);
    });
  });

  describe('encryptSecret / decryptSecret', () => {
    it('round-trips a secret', () => {
      const secret = generateSecret();
      const enc = encryptSecret(secret);
      expect(enc).toEqual({
        iv: expect.any(String),
        tag: expect.any(String),
        data: expect.any(String),
      });
      expect(decryptSecret(enc)).toBe(secret);
    });

    it('uses a random IV per encryption (ciphertexts differ)', () => {
      const secret = 'whsec_samevalue';
      const a = encryptSecret(secret);
      const b = encryptSecret(secret);
      expect(a.iv).not.toBe(b.iv);
      expect(a.data).not.toBe(b.data);
      expect(decryptSecret(a)).toBe(secret);
      expect(decryptSecret(b)).toBe(secret);
    });

    it('returns null for malformed ciphertext envelopes', () => {
      expect(decryptSecret(null)).toBeNull();
      expect(decryptSecret({})).toBeNull();
      expect(decryptSecret({ iv: 'x', tag: 'y' })).toBeNull();
    });

    it('fails to decrypt under a different key (GCM auth)', () => {
      const enc = encryptSecret('whsec_topsecret');
      process.env.WEBHOOK_SECRET_ENC_KEY = 'a-completely-different-key';
      expect(() => decryptSecret(enc)).toThrow();
    });

    it('throws when encrypting in production without a key', () => {
      delete process.env.WEBHOOK_SECRET_ENC_KEY;
      process.env.NODE_ENV = 'production';
      expect(() => encryptSecret('whsec_x')).toThrow(/WEBHOOK_SECRET_ENC_KEY/);
    });
  });
});
