const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const leadRoutes = require('./routes/leadRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const createApp = () => {
  const app = express();

  if (!app.get('io')) app.set('io', null);

  app.use(requestId);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  app.options('*', cors());

  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again shortly.',
      });
    },
  });
  app.use('/api/', limiter);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/check-in', checkInRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/interactions', interactionRoutes);
  app.use('/api/webhooks', webhookRoutes);

  app.get('/', (req, res) => {
    res.json({ success: true, message: 'Event Management System API is running' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;