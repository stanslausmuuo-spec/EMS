class MockRedis {
  constructor() {
    this.status = 'end';
  }

  on() {
    return this;
  }

  once() {
    return this;
  }

  connect() {
    return Promise.resolve();
  }

  disconnect() {
    return Promise.resolve();
  }

  quit() {
    return Promise.resolve('OK');
  }

  get() {
    return Promise.resolve(null);
  }

  set() {
    return Promise.resolve('OK');
  }

  del() {
    return Promise.resolve(0);
  }
}

module.exports = MockRedis;
module.exports.default = MockRedis;
module.exports.Redis = MockRedis;
module.exports.Cluster = MockRedis;
