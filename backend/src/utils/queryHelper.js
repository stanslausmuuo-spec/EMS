const makeChainable = (promiseOrData) => {
  const query = {
    select: () => query,
    populate: () => query,
    sort: () => query,
    lean: () => query,
    exec: () => Promise.resolve(promiseOrData),
    then: (resolve, reject) => Promise.resolve(promiseOrData).then(resolve, reject),
    catch: (reject) => Promise.resolve(promiseOrData).catch(reject)
  };
  return query;
};

module.exports = makeChainable;
