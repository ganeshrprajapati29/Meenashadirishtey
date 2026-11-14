const {
  User, Profile, Interest, Payment, Plan, Banner, SuccessStory, Report, Setting, Enquiry, Message,
} = require('../models');
const { notify } = require('../services/notify');
const { activatePlan } = require('../services/premiumService');
const { toDetail } = require('../services/profileView');
const { saveImage, deleteImage } = require('../middleware/upload');
const { paginate, escapeRegex } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/* ---------- Dashboard ---------- */
exports.stats = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const now = new Date();
  const [users, profiles, pending, approved, male, female, premium, todaySignups, interests, accepted, revenueAgg, openReports, newEnquiries, messages] = await Promise.all([
    User.countDocuments({ role: 'user', status: { $ne: 'deleted' } }),
    Profile.countDocuments(),
    Profile.countDocuments({ status: 'pending' }),
    Profile.countDocuments({ status: 'approved' }),
    Profile.countDocuments({ gender: 'male' }),
    Profile.countDocuments({ gender: 'female' }),
    User.countDocuments({ 'premium.expiresAt': { $gt: now } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
    Interest.countDocuments(),
    Interest.countDocuments({ status: 'accepted' }),
    Payment.aggregate([{ $match: { status: 'paid', mode: { $ne: 'demo' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Report.countDocuments({ status: 'open' }),
    Enquiry.countDocuments({ status: 'new' }),
    Message.countDocuments(),
  ]);

  // signups for last 14 days
  const from = new Date(today.getTime() - 13 * 24 * 3600 * 1000);
  const daily = await User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: from } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(daily.map((d) => [d._id, d.count]));
  const signups = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(from.getTime() + i * 24 * 3600 * 1000);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    signups.push({ date: key, count: map.get(key) || 0 });
  }
  const byState = await Profile.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  res.json({
    success: true,
    stats: { users, profiles, pending, approved, male, female, premium, todaySignups, interests, accepted, revenue: revenueAgg[0] ? revenueAgg[0].total : 0, openReports, newEnquiries, messages },
    signups,
    byState: byState.map((s) => ({ state: s._id || 'Unknown', count: s.count })),
  });
});

/* ---------- Members ---------- */
exports.users = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { role: 'user' };
  if (req.query.status) filter.status = req.query.status;
  else filter.status = { $ne: 'deleted' };
  if (req.query.premium === 'true') filter['premium.expiresAt'] = { $gt: new Date() };
  if (req.query.q) {
    const q = String(req.query.q).trim();
    const rx = new RegExp(escapeRegex(q), 'i');
    const profileUsers = await Profile.find({ $or: [{ firstName: rx }, { lastName: rx }, { profileId: rx }] }).distinct('user');
    filter.$or = [{ phone: rx }, { email: rx }, { _id: { $in: profileUsers } }];
  }
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const profiles = await Profile.find({ user: { $in: rows.map((u) => u._id) } }).select('user profileId firstName lastName gender status photos isVerified');
  const pMap = new Map(profiles.map((p) => [String(p.user), p]));
  const items = rows.map((u) => {
    const p = pMap.get(String(u._id));
    return {
      ...u.toSafeJSON(),
      lastActive: u.lastActive,
      profile: p ? { id: p._id, profileId: p.profileId, fullName: p.fullName, gender: p.gender, status: p.status, photo: p.primaryPhoto, isVerified: p.isVerified } : null,
    };
  });
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

exports.setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) throw ApiError.badRequest('Invalid status');
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'user' }, { status }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user: user.toSafeJSON() });
});

exports.givePremium = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.body.planId);
  if (!plan) throw ApiError.notFound('Plan not found');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  await Payment.create({ user: user._id, plan: plan._id, planName: plan.name, amount: Number(req.body.amount ?? plan.price), mode: 'manual', status: 'paid', note: req.body.note || 'Activated by admin' });
  const updated = await activatePlan(user._id, plan);
  res.json({ success: true, user: updated.toSafeJSON() });
});

exports.removePremium = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { $unset: { premium: 1 } }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user: user.toSafeJSON() });
});

/* ---------- Profiles ---------- */
exports.profiles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.gender) filter.gender = req.query.gender;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { profileId: rx }, { gotra: rx }, { district: rx }];
  }
  const [rows, total] = await Promise.all([
    Profile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'phone status premium'),
    Profile.countDocuments(filter),
  ]);
  const items = rows.map((p) => ({
    id: p._id, profileId: p.profileId, fullName: p.fullName, gender: p.gender, age: p.age, gotra: p.gotra,
    education: p.education, occupation: p.occupation, district: p.district, state: p.state, status: p.status,
    isVerified: p.isVerified, isFeatured: p.isFeatured, completeness: p.completeness, photo: p.primaryPhoto,
    photoCount: p.photos.length, createdAt: p.createdAt, phone: p.user ? p.user.phone : null, userId: p.user ? p.user._id : null,
    rejectionReason: p.rejectionReason,
  }));
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

exports.profile = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id).populate('user', 'phone email status premium createdAt lastActive');
  if (!p) throw ApiError.notFound('Profile not found');
  const detail = toDetail(p, { isAdmin: true });
  detail.account = p.user;
  res.json({ success: true, profile: detail });
});

exports.moderateProfile = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // approve | reject | verify | unverify | feature | unfeature
  const p = await Profile.findById(req.params.id);
  if (!p) throw ApiError.notFound('Profile not found');
  switch (action) {
    case 'approve':
      p.status = 'approved'; p.rejectionReason = undefined;
      notify(p.user, { type: 'profile_approved', title: 'Profile approved ✅', body: 'Your profile is now live. Start finding your match!', link: '/matches' }).catch(() => {});
      break;
    case 'reject':
      p.status = 'rejected'; p.rejectionReason = reason || 'Please update your details and photos';
      notify(p.user, { type: 'profile_rejected', title: 'Profile needs changes', body: p.rejectionReason, link: '/profile/edit' }).catch(() => {});
      break;
    case 'verify': p.isVerified = true; break;
    case 'unverify': p.isVerified = false; break;
    case 'feature': p.isFeatured = true; break;
    case 'unfeature': p.isFeatured = false; break;
    default: throw ApiError.badRequest('Invalid action');
  }
  await p.save();
  res.json({ success: true, status: p.status, isVerified: p.isVerified, isFeatured: p.isFeatured });
});

exports.deletePhoto = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id);
  if (!p) throw ApiError.notFound('Profile not found');
  const ph = p.photos.id(req.params.photoId);
  if (!ph) throw ApiError.notFound('Photo not found');
  deleteImage(ph.url);
  ph.deleteOne();
  if (p.photos.length && !p.photos.some((x) => x.isPrimary)) p.photos[0].isPrimary = true;
  await p.save();
  res.json({ success: true, photos: p.photos });
});

/* ---------- Generic CRUD factory for Banner / Plan / Story ---------- */
function crud(Model, { imageField, imageFolder, sort = { createdAt: -1 }, imageOpts } = {}) {
  const parse = (body) => {
    const out = { ...body };
    Object.keys(out).forEach((k) => {
      if (out[k] === 'true') out[k] = true;
      else if (out[k] === 'false') out[k] = false;
      else if (out[k] === '' || out[k] === 'null') out[k] = null;
    });
    ['features', 'featuresHi'].forEach((k) => {
      if (typeof out[k] === 'string') out[k] = out[k].split('\n').map((s) => s.trim()).filter(Boolean);
    });
    delete out._id; delete out.impressions; delete out.clicks;
    return out;
  };
  return {
    list: asyncHandler(async (req, res) => {
      const items = await Model.find().sort(sort).lean();
      res.json({ success: true, items });
    }),
    create: asyncHandler(async (req, res) => {
      const data = parse(req.body);
      if (imageField && req.files) {
        for (const f of req.files) data[f.fieldname] = await saveImage(f.buffer, imageFolder, imageOpts);
      }
      const doc = await Model.create(data);
      res.status(201).json({ success: true, item: doc });
    }),
    update: asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound();
      const data = parse(req.body);
      if (imageField && req.files) {
        for (const f of req.files) {
          deleteImage(doc[f.fieldname]);
          data[f.fieldname] = await saveImage(f.buffer, imageFolder, imageOpts);
        }
      }
      doc.set(data);
      await doc.save();
      res.json({ success: true, item: doc });
    }),
    remove: asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound();
      if (imageField) { deleteImage(doc.image); deleteImage(doc.mobileImage); }
      await doc.deleteOne();
      res.json({ success: true });
    }),
  };
}

exports.banners = crud(Banner, { imageField: true, imageFolder: 'banners', sort: { placement: 1, order: 1 }, imageOpts: { width: 1920 } });
exports.plans = crud(Plan, { sort: { order: 1, price: 1 } });
exports.stories = crud(SuccessStory, { imageField: true, imageFolder: 'stories', imageOpts: { width: 1000 } });

/* ---------- Payments ---------- */
exports.payments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'phone').lean(),
    Payment.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

/* ---------- Reports ---------- */
exports.reports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [rows, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('reportedProfile', 'profileId firstName lastName status')
      .populate('reporter', 'phone')
      .populate('reportedUser', 'phone status'),
    Report.countDocuments(filter),
  ]);
  res.json({ success: true, items: rows, total, page, pages: Math.ceil(total / limit) });
});

exports.updateReport = asyncHandler(async (req, res) => {
  const { status, adminNote, blockUser } = req.body;
  const r = await Report.findById(req.params.id);
  if (!r) throw ApiError.notFound();
  if (status) r.status = status;
  if (adminNote !== undefined) r.adminNote = adminNote;
  await r.save();
  if (blockUser) await User.updateOne({ _id: r.reportedUser }, { status: 'blocked' });
  res.json({ success: true, item: r });
});

/* ---------- Enquiries ---------- */
exports.enquiries = asyncHandler(async (req, res) => {
  const items = await Enquiry.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, items });
});
exports.updateEnquiry = asyncHandler(async (req, res) => {
  const e = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, item: e });
});

/* ---------- Settings ---------- */
exports.getSettings = asyncHandler(async (req, res) => {
  res.json({ success: true, settings: await Setting.getAll() });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['siteName', 'tagline', 'contactPhone', 'whatsapp', 'email', 'address', 'facebook', 'instagram', 'youtube',
    'playStoreUrl', 'appStoreUrl', 'announcement', 'gotraList', 'otpMode'];
  const ops = Object.entries(req.body || {})
    .filter(([k]) => allowed.includes(k))
    .map(([key, value]) => {
      if (key === 'gotraList' && typeof value === 'string') value = value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      if (key === 'otpMode' && !['screen', 'sms'].includes(value)) value = 'screen';
      return { updateOne: { filter: { key }, update: { key, value }, upsert: true } };
    });
  if (ops.length) await Setting.bulkWrite(ops);
  res.json({ success: true, settings: await Setting.getAll() });
});

/* ---------- Broadcast notification ---------- */
exports.broadcast = asyncHandler(async (req, res) => {
  const { title, body, link } = req.body;
  if (!title) throw ApiError.badRequest('Title is required');
  const users = await User.find({ role: 'user', status: 'active' }).select('_id').lean();
  await Promise.all(users.map((u) => notify(u._id, { type: 'system', title, body, link })));
  res.json({ success: true, sent: users.length });
});
