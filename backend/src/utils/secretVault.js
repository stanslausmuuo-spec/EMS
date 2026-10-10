const crypto = require('crypto');

const generateSecret = () => 'whsec_' + crypto.randomBytes(32).toString('hex');

const getKey = () => {
  const raw = process.env.WEBHOOK_SECRET_ENC_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WEBHOOK_SECRET_ENC_KEY must be set in production');
    }
    console.warn('WEBHOOK_SECRET_ENC_KEY not set — using insecure dev fallback. Set it in production.');
    return crypto.createHash('sha256').update('ems-dev-fallback-key').digest().subarray(0, 32);
  }
  return crypto.createHash('sha256').update(String(raw)).digest().subarray(0, 32);
};

const encryptSecret = (plain) => {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
};

const decryptSecret = (enc) => {
  if (!enc || !enc.iv || !enc.tag || !enc.data) return null;
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(enc.tag, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(enc.data, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { generateSecret, encryptSecret, decryptSecret };