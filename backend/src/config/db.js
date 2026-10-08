const mongoose = require('mongoose');
const memoryDb = require('./memoryDb');

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { serverSelectionTimeoutMS: 3000, bufferCommands: false };
    cached.promise = mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db', opts)
      .then(async (mongooseInstance) => {
        console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
        global.USE_MEMORY_DB = false;
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn('⚠️ MongoDB connection failed:', err.message);
        console.log('Switching to High-Performance In-Memory Database Mode (No external DB required).');
        global.USE_MEMORY_DB = true;
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
