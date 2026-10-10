const crypto = require('crypto');

const DEFAULT_TOLERANCE_SECONDS = 300;

const signPayload = (rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) => {
  const signature = crypto
    .createHmac('sha256', String(secret))
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
};

const parseSignatureHeader = (header) => {
  if (!header || typeof header !== 'string') return null;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx < 1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (key === 'v1') {
      if (/^[0-9a-f]{64}$/.test(value)) signatures.push(value);
    }
  }
  if (timestamp === null || signatures.length === 0) return null;
  return { timestamp, signatures };
};

const safeEqualHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};

const verifySignature = ({ rawBody, header, secret, tolerance = DEFAULT_TOLERANCE_SECONDS, now = Date.now() }) => {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: 'malformed_header' };

  const nowSeconds = Math.floor(now / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > tolerance) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' };
  }

  const expected = crypto
    .createHmac('sha256', String(secret))
    .update(`${parsed.timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  const matches = parsed.signatures.some((candidate) => safeEqualHex(candidate, expected));
  if (!matches) return { ok: false, reason: 'no_matching_signature' };
  return { ok: true };
};

module.exports = {
  signPayload,
  parseSignatureHeader,
  verifySignature,
  DEFAULT_TOLERANCE_SECONDS,
};