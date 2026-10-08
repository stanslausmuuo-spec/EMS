const bcrypt = require('bcryptjs');

class MemoryModel {
  constructor(collectionName, initialData = []) {
    this.collectionName = collectionName;
    this.data = initialData;
  }

  async find(query = {}) {
    return this.data.filter(item => matchQuery(item, query));
  }

  async findOne(query = {}) {
    const found = this.data.find(item => matchQuery(item, query));
    return found ? clone(found) : null;
  }

  async findById(id) {
    const stringId = id?.toString();
    const found = this.data.find(item => item._id?.toString() === stringId);
    return found ? clone(found) : null;
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async create(docData) {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const newItem = {
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...docData,
      matchPassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      },
      save: async function() {
        this.updatedAt = new Date();
        const idx = memoryDb[collectionMap[collectionName]].data.findIndex(i => i._id?.toString() === this._id?.toString());
        if (idx !== -1) {
          memoryDb[collectionMap[collectionName]].data[idx] = clone(this);
        }
        return this;
      },
      populate: function() { return this; },
      sort: function() { return this; }
    };

    if (newItem.password && !newItem.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      newItem.password = await bcrypt.hash(newItem.password, salt);
    }

    this.data.push(newItem);
    return clone(newItem);
  }

  async findOneAndUpdate(query, update, options = {}) {
    let found = this.data.find(item => matchQuery(item, query));
    if (!found && options.upsert) {
      const newDoc = {
        _id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(query.exhibitor ? { exhibitor: query.exhibitor } : {}),
        ...(query.event ? { event: query.event } : {}),
        ...(query.attendee ? { attendee: query.attendee } : {}),
        ...(update.$set || {})
      };
      this.data.push(newDoc);
      found = newDoc;
    } else if (found && update.$set) {
      Object.assign(found, update.$set, { updatedAt: new Date() });
    }
    return found ? clone(found) : null;
  }
}

function matchQuery(item, query) {
  for (const [key, val] of Object.entries(query)) {
    if (val && typeof val === 'object' && val.$in) {
      if (!val.$in.map(String).includes(item[key]?.toString())) return false;
    } else if (item[key]?.toString() !== val?.toString()) {
      return false;
    }
  }
  return true;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const memoryDb = {
  users: new MemoryModel('users'),
  events: new MemoryModel('events'),
  tickets: new MemoryModel('tickets'),
  sessions: new MemoryModel('sessions'),
  leads: new MemoryModel('leads'),
  polls: new MemoryModel('polls'),
  questions: new MemoryModel('questions'),
  webhooks: new MemoryModel('webhooks')
};

const collectionMap = {
  User: 'users',
  Event: 'events',
  Ticket: 'tickets',
  Session: 'sessions',
  Lead: 'leads',
  Poll: 'polls',
  Question: 'questions',
  Webhook: 'webhooks'
};

// Seed initial data
(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const organizerId = 'org_123';
  const attendeeId = 'att_123';

  memoryDb.users.data.push({
    _id: organizerId,
    name: 'Sarah Organizer',
    email: 'organizer@ems.local',
    password: hashedPassword,
    role: 'Organizer',
    createdAt: new Date(),
    matchPassword: async function(pw) { return bcrypt.compare(pw, this.password); }
  });

  memoryDb.users.data.push({
    _id: attendeeId,
    name: 'Alex Attendee',
    email: 'attendee@ems.local',
    password: hashedPassword,
    role: 'Attendee',
    createdAt: new Date(),
    matchPassword: async function(pw) { return bcrypt.compare(pw, this.password); }
  });

  const now = new Date();
  memoryDb.events.data.push({
    _id: 'ev_1',
    title: 'AI & Future of Tech Summit 2026',
    description: 'Join industry leaders and visionaries for a deep dive into generative AI, autonomous systems, and next-gen software architecture.',
    category: 'Tech',
    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    location: 'San Francisco Convention Center, CA',
    capacity: 250,
    soldTickets: 12,
    organizer: organizerId,
    createdAt: new Date()
  });

  memoryDb.events.data.push({
    _id: 'ev_2',
    title: 'Global Electronic Music Festival',
    description: 'Experience 3 days of immersive soundscapes, world-class DJs, and state-of-the-art stage production under the stars.',
    category: 'Music',
    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    location: 'Red Rocks Amphitheatre, CO',
    capacity: 500,
    soldTickets: 450,
    organizer: organizerId,
    createdAt: new Date()
  });
})();

module.exports = memoryDb;
