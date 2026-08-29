const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors ? error.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : error.message
    });
  }
};

module.exports = validate;
