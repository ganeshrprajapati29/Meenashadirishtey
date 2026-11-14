const { Notification } = require('../models');

let io = null;
exports.setIO = (instance) => { io = instance; };
exports.getIO = () => io;

/** Emit a realtime event to a user (all their connected devices) */
exports.emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

/** Create a notification + push it over socket */
exports.notify = async (userId, { type = 'system', title, body, link, data }) => {
  const n = await Notification.create({ user: userId, type, title, body, link, data });
  exports.emitToUser(userId, 'notification', n);
  return n;
};
