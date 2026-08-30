const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding demo users...');
      const organizer = await User.create({
        name: 'Sarah Organizer',
        email: 'organizer@ems.local',
        password: 'password123',
        role: 'Organizer'
      });

      const attendee = await User.create({
        name: 'Alex Attendee',
        email: 'attendee@ems.local',
        password: 'password123',
        role: 'Attendee'
      });

      console.log('Seeding demo events...');
      const now = new Date();
      const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const futureDate3 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

      await Event.create([
        {
          title: 'AI & Future of Tech Summit 2026',
          description: 'Join industry leaders and visionaries for a deep dive into generative AI, autonomous systems, and next-gen software architecture.',
          category: 'Tech',
          date: futureDate1,
          location: 'San Francisco Convention Center, CA',
          capacity: 250,
          soldTickets: 12,
          organizer: organizer._id
        },
        {
          title: 'Global Electronic Music Festival',
          description: 'Experience 3 days of immersive soundscapes, world-class DJs, and state-of-the-art stage production under the stars.',
          category: 'Music',
          date: futureDate2,
          location: 'Red Rocks Amphitheatre, CO',
          capacity: 500,
          soldTickets: 450,
          organizer: organizer._id
        },
        {
          title: 'Startup Founders & Venture Capital Workshop',
          description: 'An intensive masterclass on pitch deck storytelling, bootstrapping vs VC funding, and scaling early-stage ventures.',
          category: 'Business',
          date: futureDate3,
          location: 'WeWork MetLife Building, NY',
          capacity: 80,
          soldTickets: 35,
          organizer: organizer._id
        }
      ]);
      console.log('Demo database seeding completed successfully!');
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db', opts).then(async (mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      await seedDatabase();
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
