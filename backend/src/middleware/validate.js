const ApiError = require('../utils/ApiError');

/** validate(schema, 'body' | 'query') with a zod schema */
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(ApiError.badRequest(issues[0] ? `${issues[0].field}: ${issues[0].message}` : 'Invalid input', issues));
  }
  if (source === 'body') req.body = result.data;
  else req.validated = result.data;
  next();
};
