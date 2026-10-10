const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const createApp = require('./app');
const setupSocket = require('./sockets/socketManager');

connectDB();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

app.set('io', io);
setupSocket(io);

const PORT = process.env.PORT || 5000;

// Support local execution vs Vercel serverless export
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV) {
  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

module.exports = server;