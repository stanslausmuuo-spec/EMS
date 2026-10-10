const dns = require('dns').promises;
const net = require('net');
const { URL } = require('url');

const BLOCKED_CIDR_V4 = [
  { start: 0x00000000, end: 0x000000ff }, // 0.0.0.0/8
  { start: 0x0a000000, end: 0x0affffff }, // 10.0.0.0/8
  { start: 0x7f000000, end: 0x7fffffff }, // 127.0.0.0/8
  { start: 0x64400000, end: 0x647fffff }, // 100.64.0.0/10 (CGNAT)
  { start: 0xa9fe0000, end: 0xa9feffff }, // 169.254.0.0/16 incl. metadata
  { start: 0xac100000, end: 0xac1fffff }, // 172.16.0.0/12
  { start: 0xc0a80000, end: 0xc0a8ffff }, // 192.168.0.0/16
];

const ipv4ToInt = (ip) => {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

const isBlockedIpv4 = (ip) => {
  const int = ipv4ToInt(ip);
  if (int === null) return false;
  return BLOCKED_CIDR_V4.some((range) => int >= range.start && int <= range.end);
};

const expandIpv6 = (ip) => {
  if (ip.startsWith('::ffff:')) {
    const v4 = ip.slice(7);
    if (net.isIPv4(v4)) return { ipv4: v4, ipv6: null };
    return { ipv4: null, ipv6: ip };
  }
  if (ip.includes('.')) return { ipv4: ip, ipv6: null };
  return { ipv4: null, ipv6: ip };
};

const isBlockedIpv6 = (ip) => {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 ULA
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true; // fe80::/10 link-local
  if (lower.startsWith('::ffff:7f') || lower.startsWith('::ffff:0a')) return true;
  return false;
};

const isBlockedIp = (ip) => {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (net.isIPv6(ip)) {
    const { ipv4, ipv6 } = expandIpv6(ip);
    if (ipv4 && isBlockedIpv4(ipv4)) return true;
    if (ipv6 && isBlockedIpv6(ipv6)) return true;
    return false;
  }
  return false;
};

const assertSafeWebhookUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Webhook URL is invalid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Webhook URL must use http or https');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Webhook URL must not contain credentials');
  }
  if (parsed.hash) {
    throw new Error('Webhook URL must not contain a fragment');
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('Webhook URL must not use a custom port');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error('Webhook URL resolves to a blocked address');
    return parsed.toString();
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Webhook URL must not target localhost');
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Webhook URL host does not resolve');
  }

  if (!addresses.length) throw new Error('Webhook URL host does not resolve');

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new Error('Webhook URL resolves to a blocked address');
    }
  }

  return parsed.toString();
};

module.exports = { assertSafeWebhookUrl, isBlockedIp };