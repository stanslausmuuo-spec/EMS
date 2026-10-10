const http = require('http');
const https = require('https');
const { URL } = require('url');

const MAX_RESPONSE_SNIPPET = 2000;

const postJson = ({ url, body, headers = {}, timeoutMs = 10000, signal }) => {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      return resolve({ ok: false, error: `Invalid URL: ${error.message}` });
    }

    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const content = typeof body === 'string' ? body : JSON.stringify(body);
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(content),
      ...headers,
    };

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const req = lib.request(
      parsed,
      { method: 'POST', headers: requestHeaders, signal },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
          if (raw.length > MAX_RESPONSE_SNIPPET) raw = raw.slice(0, MAX_RESPONSE_SNIPPET);
        });
        res.on('end', () => {
          finish({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            body: raw.slice(0, MAX_RESPONSE_SNIPPET),
          });
        });
        res.on('error', (error) => {
          finish({ ok: false, error: error.message });
        });
      }
    );

    req.on('error', (error) => {
      if (error.name === 'AbortError') {
        finish({ ok: false, error: 'Timed out' });
      } else {
        finish({ ok: false, error: error.message });
      }
    });

    const timer = setTimeout(() => {
      req.destroy(new Error('Timed out'));
    }, timeoutMs);

    req.write(content);
    req.end();
  });
};

module.exports = { postJson, MAX_RESPONSE_SNIPPET };