const makeChainable = (promiseOrData) => {
  const query = {
    select: () => query,
    populate: () => query,
    sort: () => query,
    limit: () => query,
    skip: () => query,
    lean: () => query,
    exec: () => Promise.resolve(promiseOrData),
    then: (resolve, reject) => Promise.resolve(promiseOrData).then(resolve, reject),
    catch: (reject) => Promise.resolve(promiseOrData).catch(reject),
    finally: (cb) => Promise.resolve(promiseOrData).finally(cb)
  };
  return query;
};

module.exports = makeChainable;
