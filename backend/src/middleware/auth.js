const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

exports.signToken = (user) => jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'active') return null;
    return user;
  } catch {
    return null;
  }
}

exports.protect = async (req, res, next) => {
  const user = await resolveUser(req);
  if (!user) return next(ApiError.unauthorized());
  req.user = user;
  // cheap "last active" tracking (at most once per 5 minutes)
  if (Date.now() - new Date(user.lastActive).getTime() > 5 * 60 * 1000) {
    User.updateOne({ _id: user._id }, { lastActive: new Date() }).catch(() => {});
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  req.user = await resolveUser(req);
  next();
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return next(ApiError.forbidden('Admin access only'));
  next();
};
