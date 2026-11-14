class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg = 'Bad request', d) { return new ApiError(400, msg, d); }
  static unauthorized(msg = 'Please login to continue') { return new ApiError(401, msg); }
  static forbidden(msg = 'You are not allowed to do this') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Already exists') { return new ApiError(409, msg); }
  static tooMany(msg = 'Too many requests, please try later') { return new ApiError(429, msg); }
}
module.exports = ApiError;
