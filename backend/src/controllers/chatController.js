const { Conversation, Message, Interest, Profile, User } = require('../models');
const { emitToUser } = require('../services/notify');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Can user A chat with user B? accepted interest, or A is premium */
async function canChat(userA, userBId) {
  if (await Interest.areConnected(userA._id, userBId)) return true;
  return !!userA.isPremium;
}
exports.canChat = canChat;

async function getOrCreateConversation(a, b) {
  const key = Conversation.keyFor(a, b);
  let conv = await Conversation.findOne({ key });
  if (!conv) conv = await Conversation.create({ key, participants: [a, b] });
  return conv;
}

/** Shared by REST + socket */
async function sendMessage(sender, toUserId, text) {
  if (String(toUserId) === String(sender._id)) throw ApiError.badRequest('You cannot message yourself');
  text = String(text || '').trim();
  if (!text) throw ApiError.badRequest('Message is empty');
  if (text.length > 2000) throw ApiError.badRequest('Message too long');
  const other = await User.findById(toUserId).select('status blockedUsers');
  if (!other || other.status !== 'active') throw ApiError.notFound('User not available');
  if (other.blockedUsers.some((u) => u.equals(sender._id)) || sender.blockedUsers.some((u) => u.equals(other._id))) {
    throw ApiError.forbidden('You cannot message this member');
  }
  if (!(await canChat(sender, other._id))) {
    throw new ApiError(402, 'Chat unlocks after your interest is accepted, or upgrade to premium');
  }
  const conv = await getOrCreateConversation(sender._id, other._id);
  const msg = await Message.create({ conversation: conv._id, sender: sender._id, text });
  conv.lastMessage = text.slice(0, 120);
  conv.lastMessageAt = msg.createdAt;
  conv.lastSender = sender._id;
  conv.unread.set(String(other._id), (conv.unread.get(String(other._id)) || 0) + 1);
  await conv.save();

  const payload = { ...msg.toObject(), conversation: conv._id };
  emitToUser(other._id, 'message:new', payload);
  emitToUser(sender._id, 'message:new', payload);
  return payload;
}
exports.sendMessage = sendMessage;

exports.conversations = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const convs = await Conversation.find({ participants: uid }).sort({ lastMessageAt: -1 }).limit(100).lean();
  const otherIds = convs.map((c) => c.participants.find((p) => String(p) !== String(uid)));
  const [profiles, users] = await Promise.all([
    Profile.find({ user: { $in: otherIds } }).select('user profileId firstName lastName photos photoPrivacy'),
    User.find({ _id: { $in: otherIds } }).select('isOnline lastActive'),
  ]);
  const pMap = new Map(profiles.map((p) => [String(p.user), p]));
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const items = convs.map((c, i) => {
    const oid = String(otherIds[i]);
    const p = pMap.get(oid);
    const u = uMap.get(oid);
    return {
      id: c._id,
      otherUserId: oid,
      profile: p ? { id: p._id, profileId: p.profileId, fullName: p.fullName, photo: p.primaryPhoto } : { fullName: 'Member' },
      isOnline: u ? u.isOnline : false,
      lastActive: u ? u.lastActive : null,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastSenderIsMe: c.lastSender && String(c.lastSender) === String(uid),
      unread: (c.unread && c.unread[String(uid)]) || 0,
    };
  });
  res.json({ success: true, items, totalUnread: items.reduce((s, i) => s + i.unread, 0) });
});

/** Messages with a user (by their userId) */
exports.messages = asyncHandler(async (req, res) => {
  const otherId = req.params.userId;
  if (String(otherId) === String(req.user._id)) throw ApiError.badRequest('You cannot chat with yourself');
  const conv = await Conversation.findOne({ key: Conversation.keyFor(req.user._id, otherId) });
  const allowed = await canChat(req.user, otherId);
  const otherProfile = await Profile.findOne({ user: otherId }).select('profileId firstName lastName photos photoPrivacy');
  const otherUser = await User.findById(otherId).select('isOnline lastActive');
  if (!otherProfile) throw ApiError.notFound('Member not found');
  let items = [];
  if (conv) {
    const before = req.query.before ? new Date(req.query.before) : new Date();
    items = await Message.find({ conversation: conv._id, createdAt: { $lt: before } }).sort({ createdAt: -1 }).limit(50).lean();
    items.reverse();
    // mark as read
    if (conv.unread.get(String(req.user._id))) {
      conv.unread.set(String(req.user._id), 0);
      await conv.save();
    }
    const r = await Message.updateMany({ conversation: conv._id, sender: otherId, readAt: null }, { readAt: new Date() });
    if (r.modifiedCount) emitToUser(otherId, 'message:read', { conversation: conv._id, by: req.user._id });
  }
  res.json({
    success: true,
    canChat: allowed,
    conversationId: conv ? conv._id : null,
    other: {
      userId: otherId,
      profileId: otherProfile.profileId,
      id: otherProfile._id,
      fullName: otherProfile.fullName,
      photo: otherProfile.primaryPhoto,
      isOnline: otherUser ? otherUser.isOnline : false,
      lastActive: otherUser ? otherUser.lastActive : null,
    },
    items,
  });
});

exports.send = asyncHandler(async (req, res) => {
  const msg = await sendMessage(req.user, req.params.userId, req.body.text);
  res.status(201).json({ success: true, message: msg });
});
