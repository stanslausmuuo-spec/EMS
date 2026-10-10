class Queue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
  }

  add(name, data) {
    const job = { id: `mock-${this.jobs.length + 1}`, name, data };
    this.jobs.push(job);
    return Promise.resolve(job);
  }

  on() {
    return this;
  }

  close() {
    return Promise.resolve();
  }
}

class Worker {
  constructor(name, processor) {
    this.name = name;
    this.processor = processor;
  }

  on() {
    return this;
  }

  close() {
    return Promise.resolve();
  }
}

class QueueEvents extends Queue {}

module.exports = { Queue, Worker, QueueEvents };
