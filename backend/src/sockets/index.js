const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret, clientUrls } = require('../config/env');
const { User, Conversation, Message } = require('../models');
const { setIO, emitToUser } = require('../services/notify');
const { sendMessage } = require('../controllers/chatController');

/** userId -> number of open sockets */
const online = new Map();

module.exports = function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: clientUrls, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });
  setIO(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      const { id } = jwt.verify(token, jwtSecret);
      const user = await User.findById(id);
      if (!user || user.status !== 'active') return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = String(socket.user._id);
    socket.join(`user:${uid}`);
    const count = (online.get(uid) || 0) + 1;
    online.set(uid, count);
    if (count === 1) {
      await User.updateOne({ _id: uid }, { isOnline: true, lastActive: new Date() });
      socket.broadcast.emit('presence', { userId: uid, isOnline: true });
    }

    socket.on('message:send', async ({ to, text, tempId } = {}, ack) => {
      try {
        const fresh = await User.findById(uid); // fresh premium/block state
        const msg = await sendMessage(fresh, to, text);
        if (typeof ack === 'function') ack({ ok: true, message: msg, tempId });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message, status: e.status || 500, tempId });
      }
    });

    socket.on('typing', ({ to, typing } = {}) => {
      if (to) emitToUser(to, 'typing', { from: uid, typing: !!typing });
    });

    socket.on('message:read', async ({ with: otherId } = {}) => {
      if (!otherId) return;
      const conv = await Conversation.findOne({ key: Conversation.keyFor(uid, otherId) });
      if (!conv) return;
      conv.unread.set(uid, 0);
      await conv.save();
      await Message.updateMany({ conversation: conv._id, sender: otherId, readAt: null }, { readAt: new Date() });
      emitToUser(otherId, 'message:read', { conversation: conv._id, by: uid });
    });

    socket.on('presence:check', async ({ userIds = [] } = {}, ack) => {
      if (typeof ack !== 'function') return;
      const res = {};
      userIds.slice(0, 100).forEach((id) => { res[id] = (online.get(String(id)) || 0) > 0; });
      ack(res);
    });

    socket.on('disconnect', async () => {
      const left = (online.get(uid) || 1) - 1;
      if (left <= 0) {
        online.delete(uid);
        await User.updateOne({ _id: uid }, { isOnline: false, lastActive: new Date() });
        socket.broadcast.emit('presence', { userId: uid, isOnline: false, lastActive: new Date() });
      } else online.set(uid, left);
    });
  });

  return io;
};
