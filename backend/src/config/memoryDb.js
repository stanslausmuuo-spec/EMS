const bcrypt = require('bcryptjs');

function resolveExprValue(value, item) {
  if (typeof value === 'string' && value.startsWith('$')) return item[value.slice(1)];
  return value;
}

function evalExpr(item, expr) {
  if (!expr || typeof expr !== 'object') return true;
  if (expr.$lt) {
    const [a, b] = expr.$lt;
    return resolveExprValue(a, item) < resolveExprValue(b, item);
  }
  if (expr.$lte) {
    const [a, b] = expr.$lte;
    return resolveExprValue(a, item) <= resolveExprValue(b, item);
  }
  if (expr.$gt) {
    const [a, b] = expr.$gt;
    return resolveExprValue(a, item) > resolveExprValue(b, item);
  }
  if (expr.$gte) {
    const [a, b] = expr.$gte;
    return resolveExprValue(a, item) >= resolveExprValue(b, item);
  }
  if (expr.$eq) {
    const [a, b] = expr.$eq;
    return String(resolveExprValue(a, item)) === String(resolveExprValue(b, item));
  }
  return true;
}

function matchQuery(item, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$expr') {
      if (!evalExpr(item, val)) return false;
      continue;
    }
    if (key === '$or') {
      if (!Array.isArray(val) || !val.some((sub) => matchQuery(item, sub))) return false;
      continue;
    }
    if (val === null || val === undefined) {
      if (item[key] != null) return false;
      continue;
    }
    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof RegExp)) {
      if ('$in' in val) {
        if (!val.$in.map(String).includes(item[key]?.toString())) return false;
        continue;
      }
      if ('$nin' in val) {
        if (val.$nin.map(String).includes(item[key]?.toString())) return false;
        continue;
      }
      if ('$ne' in val) {
        if (item[key]?.toString() === val.$ne?.toString()) return false;
        continue;
      }
      if ('$regex' in val) {
        const re = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex, val.$options || '');
        if (!re.test(String(item[key] ?? ''))) return false;
        continue;
      }
      if ('$gte' in val || '$lte' in val || '$gt' in val || '$lt' in val) {
        const current = item[key] instanceof Date ? item[key].getTime() : new Date(item[key]).getTime();
        if ('$gte' in val && !(current >= new Date(val.$gte).getTime())) return false;
        if ('$lte' in val && !(current <= new Date(val.$lte).getTime())) return false;
        if ('$gt' in val && !(current > new Date(val.$gt).getTime())) return false;
        if ('$lt' in val && !(current < new Date(val.$lt).getTime())) return false;
        continue;
      }
      return false;
    }
    if (item[key]?.toString() !== val?.toString()) return false;
  }
  return true;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function decorate(item, collectionName) {
  if (!item) return item;
  if (!item.save) {
    item.save = async function save() {
      this.updatedAt = new Date();
      const arr = memoryDb[collectionName].data;
      const idx = arr.findIndex((i) => i._id?.toString() === this._id?.toString());
      if (idx !== -1) arr[idx] = this;
      else arr.push(this);
      return this;
    };
  }
  if (!item.populate) item.populate = function populate() { return item; };
  if (!item.sort) item.sort = function sort() { return item; };
  if (!item.select) item.select = function select() { return item; };
  return item;
}

class MemoryModel {
  constructor(collectionName, initialData = []) {
    this.collectionName = collectionName;
    this.data = initialData;
  }

  async find(query = {}) {
    return this.data.filter((item) => matchQuery(item, query)).map((item) => decorate(item, this.collectionName));
  }

  async findOne(query = {}) {
    const found = this.data.find((item) => matchQuery(item, query));
    return found ? decorate(found, this.collectionName) : null;
  }

  async findById(id) {
    const stringId = id?.toString();
    const found = this.data.find((item) => item._id?.toString() === stringId);
    return found ? decorate(found, this.collectionName) : null;
  }

  async countDocuments(query = {}) {
    return this.data.filter((item) => matchQuery(item, query)).length;
  }

  async create(docData) {
    const newItem = {
      _id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...docData,
    };

    if (newItem.password && !String(newItem.password).startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      newItem.password = await bcrypt.hash(newItem.password, salt);
    }
    if (newItem.password) {
      newItem.matchPassword = async function matchPassword(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      };
    }

    decorate(newItem, this.collectionName);
    this.data.push(newItem);
    return newItem;
  }

  async findOneAndUpdate(query, update = {}, options = {}) {
    let found = this.data.find((item) => matchQuery(item, query));

    if (!found && options.upsert) {
      const seed = {};
      ['exhibitor', 'event', 'attendee', 'session', 'author', 'organizer'].forEach((key) => {
        if (query[key] !== undefined) seed[key] = query[key];
      });
      found = {
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...seed,
        ...(update.$setOnInsert || {}),
      };
      this.data.push(found);
    }

    if (!found) return null;

    if (update.$set) Object.assign(found, update.$set);
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([key, amount]) => {
        found[key] = (Number(found[key]) || 0) + amount;
      });
    }
    found.updatedAt = new Date();
    return decorate(found, this.collectionName);
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    const found = this.data.find((item) => item._id?.toString() === id?.toString());
    if (!found) return null;
    const payload = update.$set || update;
    Object.assign(found, payload);
    found.updatedAt = new Date();
    return decorate(found, this.collectionName);
  }

  async findByIdAndDelete(id) {
    const idx = this.data.findIndex((item) => item._id?.toString() === id?.toString());
    if (idx === -1) return null;
    return this.data.splice(idx, 1)[0];
  }
}

const memoryDb = {
  users: new MemoryModel('users'),
  events: new MemoryModel('events'),
  tickets: new MemoryModel('tickets'),
  sessions: new MemoryModel('sessions'),
  leads: new MemoryModel('leads'),
  polls: new MemoryModel('polls'),
  questions: new MemoryModel('questions'),
  webhooks: new MemoryModel('webhooks'),
};

// Seed initial demo data
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
    matchPassword: async function (pw) {
      return bcrypt.compare(pw, this.password);
    },
  });

  memoryDb.users.data.push({
    _id: attendeeId,
    name: 'Alex Attendee',
    email: 'attendee@ems.local',
    password: hashedPassword,
    role: 'Attendee',
    createdAt: new Date(),
    matchPassword: async function (pw) {
      return bcrypt.compare(pw, this.password);
    },
  });

  const now = new Date();
  memoryDb.events.data.push({
    _id: 'ev_1',
    title: 'AI & Future of Tech Summit 2026',
    description:
      'Join industry leaders and visionaries for a deep dive into generative AI, autonomous systems, and next-gen software architecture.',
    category: 'Tech',
    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    location: 'San Francisco Convention Center, CA',
    capacity: 250,
    soldTickets: 12,
    organizer: organizerId,
    createdAt: new Date(),
  });

  memoryDb.events.data.push({
    _id: 'ev_2',
    title: 'Global Electronic Music Festival',
    description:
      'Experience 3 days of immersive soundscapes, world-class DJs, and state-of-the-art stage production under the stars.',
    category: 'Music',
    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    location: 'Red Rocks Amphitheatre, CO',
    capacity: 500,
    soldTickets: 450,
    organizer: organizerId,
    createdAt: new Date(),
  });
})();

module.exports = memoryDb;
