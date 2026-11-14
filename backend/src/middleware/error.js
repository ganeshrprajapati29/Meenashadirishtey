const { isProd } = require('../config/env');

exports.notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Already exists';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File too large (max 8 MB)';
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? 'Server error, please try again' : message,
    ...(err.details ? { details: err.details } : {}),
  });
};
