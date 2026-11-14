const { Interest, Profile, User } = require('../models');
const { notify, emitToUser } = require('../services/notify');
const { toCard } = require('../services/profileView');
const { paginate } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const DAILY_LIMIT_FREE = 10;
const DAILY_LIMIT_PREMIUM = 50;

exports.send = asyncHandler(async (req, res) => {
  const me = await Profile.findOne({ user: req.user._id });
  if (!me) throw ApiError.badRequest('Please complete your profile first');
  if (me.status !== 'approved') throw ApiError.forbidden('Your profile is under review. You can send interests once it is approved.');

  const target = await Profile.findById(req.body.profileId);
  if (!target || target.status !== 'approved') throw ApiError.notFound('Profile not found');
  if (target.user.equals(req.user._id)) throw ApiError.badRequest('You cannot send interest to yourself');
  if (target.gender === me.gender) throw ApiError.badRequest('Interest can only be sent to the opposite gender');

  const targetUser = await User.findById(target.user).select('blockedUsers status');
  if (!targetUser || targetUser.status !== 'active') throw ApiError.notFound('Profile not available');
  if (targetUser.blockedUsers.some((u) => u.equals(req.user._id)) || req.user.blockedUsers.some((u) => u.equals(target.user))) {
    throw ApiError.forbidden('You cannot send interest to this member');
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const todayCount = await Interest.countDocuments({ from: req.user._id, createdAt: { $gte: since } });
  const limit = req.user.isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
  if (todayCount >= limit) throw ApiError.tooMany(`Daily interest limit (${limit}) reached. ${req.user.isPremium ? '' : 'Upgrade to premium for more.'}`);

  // If they already sent me one, accept it instead
  const reverse = await Interest.findOne({ from: target.user, to: req.user._id });
  if (reverse && reverse.status === 'pending') {
    reverse.status = 'accepted';
    reverse.respondedAt = new Date();
    await reverse.save();
    notify(target.user, { type: 'interest_accepted', title: 'Interest accepted 🎉', body: `${me.firstName} (${me.profileId}) accepted your interest`, link: `/profile/${me.profileId}` }).catch(() => {});
    return res.json({ success: true, interest: reverse, autoAccepted: true });
  }

  let interest = await Interest.findOne({ from: req.user._id, to: target.user });
  if (interest && ['pending', 'accepted'].includes(interest.status)) throw ApiError.conflict('Interest already sent');
  if (interest && interest.status === 'declined') throw ApiError.forbidden('This member has declined your interest earlier');
  if (interest) {
    interest.status = 'pending';
    interest.message = req.body.message;
    interest.respondedAt = undefined;
    await interest.save();
  } else {
    interest = await Interest.create({
      from: req.user._id, to: target.user, fromProfile: me._id, toProfile: target._id,
      message: req.body.message ? String(req.body.message).slice(0, 300) : undefined,
    });
  }
  notify(target.user, {
    type: 'interest_received', title: 'New interest received 💌',
    body: `${me.firstName} (${me.profileId}) is interested in your profile`, link: '/interests?tab=received',
  }).catch(() => {});
  res.status(201).json({ success: true, interest });
});

exports.respond = asyncHandler(async (req, res) => {
  const { action } = req.body; // accept | decline
  if (!['accept', 'decline'].includes(action)) throw ApiError.badRequest('Invalid action');
  const interest = await Interest.findById(req.params.id);
  if (!interest || !interest.to.equals(req.user._id)) throw ApiError.notFound('Interest not found');
  if (interest.status !== 'pending' && !(interest.status === 'declined' && action === 'accept')) {
    throw ApiError.badRequest(`Interest already ${interest.status}`);
  }
  interest.status = action === 'accept' ? 'accepted' : 'declined';
  interest.respondedAt = new Date();
  await interest.save();

  const me = await Profile.findOne({ user: req.user._id }).select('firstName profileId');
  if (action === 'accept') {
    notify(interest.from, { type: 'interest_accepted', title: 'Interest accepted 🎉', body: `${me.firstName} (${me.profileId}) accepted your interest. You can now chat & view contact.`, link: `/profile/${me.profileId}` }).catch(() => {});
  } else {
    notify(interest.from, { type: 'interest_declined', title: 'Interest update', body: `${me.firstName} (${me.profileId}) is not interested right now.`, link: '/interests?tab=sent' }).catch(() => {});
  }
  emitToUser(interest.from, 'interest:update', { id: interest._id, status: interest.status });
  res.json({ success: true, interest });
});

exports.cancel = asyncHandler(async (req, res) => {
  const interest = await Interest.findById(req.params.id);
  if (!interest || !interest.from.equals(req.user._id)) throw ApiError.notFound('Interest not found');
  if (interest.status !== 'pending') throw ApiError.badRequest('Only pending interests can be cancelled');
  await interest.deleteOne();
  res.json({ success: true });
});

/** tab = received | sent | accepted | declined */
exports.list = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const tab = req.query.tab || 'received';
  let filter;
  if (tab === 'received') filter = { to: uid, status: 'pending' };
  else if (tab === 'sent') filter = { from: uid, status: 'pending' };
  else if (tab === 'accepted') filter = { $or: [{ from: uid }, { to: uid }], status: 'accepted' };
  else if (tab === 'declined') filter = { $or: [{ from: uid }, { to: uid }], status: 'declined' };
  else throw ApiError.badRequest('Invalid tab');

  const { page, limit, skip } = paginate(req.query);
  const me = await Profile.findOne({ user: uid });
  const [rows, total] = await Promise.all([
    Interest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)
      .populate({ path: 'fromProfile', populate: { path: 'user', select: 'isOnline premium' } })
      .populate({ path: 'toProfile', populate: { path: 'user', select: 'isOnline premium' } }),
    Interest.countDocuments(filter),
  ]);
  const items = rows
    .map((i) => {
      const sentByMe = i.from.equals(uid);
      const other = sentByMe ? i.toProfile : i.fromProfile;
      if (!other) return null;
      return {
        id: i._id,
        status: i.status,
        direction: sentByMe ? 'sent' : 'received',
        message: i.message,
        createdAt: i.createdAt,
        respondedAt: i.respondedAt,
        profile: toCard(other, { me, viewerPremium: req.user.isPremium, connected: i.status === 'accepted' }),
      };
    })
    .filter(Boolean);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});
