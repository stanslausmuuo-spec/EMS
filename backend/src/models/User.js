const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const memoryDb = require('../config/memoryDb');
const makeChainable = require('../utils/queryHelper');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['Attendee', 'Exhibitor', 'Organizer', 'Admin'], 
    default: 'Attendee' 
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = {
  findOne: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.users.findOne(query));
    return MongooseUser.findOne(query, projection, options);
  },
  find: async (query, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.users.find(query));
    return MongooseUser.find(query, projection, options);
  },
  findById: async (id, projection, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.users.findById(id));
    return MongooseUser.findById(id, projection, options);
  },
  create: async (doc) => {
    if (global.USE_MEMORY_DB) return memoryDb.users.create(doc);
    return MongooseUser.create(doc);
  },
  countDocuments: async (query) => {
    if (global.USE_MEMORY_DB) return memoryDb.users.countDocuments(query);
    return MongooseUser.countDocuments(query);
  },
  findOneAndUpdate: async (query, update, options) => {
    if (global.USE_MEMORY_DB) return makeChainable(memoryDb.users.findOneAndUpdate(query, update, options));
    return MongooseUser.findOneAndUpdate(query, update, options);
  }
};
