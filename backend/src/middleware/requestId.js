const crypto = require('crypto');

const requestId = (req, res, next) => {
  const provided = req.headers['x-request-id'];
  const id = typeof provided === 'string' && provided ? provided : crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;