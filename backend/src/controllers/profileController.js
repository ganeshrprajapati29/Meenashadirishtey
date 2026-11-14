const { z } = require('zod');
const C = require('../utils/constants');
const DEFAULT_GOTRAS = require('../utils/gotras');
const {
  Profile, User, Interest, Shortlist, ProfileView, ContactView, Report, Setting,
} = require('../models');
const { buildSearchFilter, sortFor } = require('../services/matchService');
const { toCard, toDetail } = require('../services/profileView');
const { notify } = require('../services/notify');
const { saveImage, deleteImage } = require('../middleware/upload');
const { paginate } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const str = (max = 100) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));
const num = (min, max) => z.coerce.number().min(min).max(max).optional().or(z.literal('').transform(() => undefined)).or(z.null().transform(() => undefined));
const en = (arr) => z.enum(arr).optional().or(z.literal('').transform(() => undefined));
const strArr = z.array(z.string().max(60)).max(30).optional();

const profileSchema = z.object({
  createdFor: en(C.CREATED_FOR),
  firstName: z.string().trim().min(2).max(40),
  lastName: str(40),
  gender: z.enum(C.GENDERS),
  dob: z.coerce.date().refine((d) => {
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18 && age <= 75;
  }, 'Age must be between 18 and 75'),
  maritalStatus: en(C.MARITAL_STATUS),
  height: num(120, 220),
  weight: num(30, 200),
  complexion: en(C.COMPLEXION),
  diet: en(C.DIET),
  disability: str(60),
  motherTongue: str(30),
  subCommunity: str(60),
  gotra: z.string().trim().min(2).max(40),
  motherGotra: str(40),
  dadiGotra: str(40),
  naniGotra: str(40),
  rashi: str(20),
  manglik: en(C.MANGLIK),
  birthTime: str(20),
  birthPlace: str(80),
  education: str(60),
  educationDetail: str(150),
  employedIn: en(C.EMPLOYED_IN),
  occupation: str(80),
  occupationDetail: str(200),
  annualIncome: str(30),
  country: str(50),
  state: str(50),
  district: str(60),
  city: str(80),
  isNri: z.coerce.boolean().optional(),
  family: z.object({
    fatherName: str(60),
    fatherOccupation: str(100),
    motherName: str(60),
    motherOccupation: str(100),
    brothers: num(0, 20),
    marriedBrothers: num(0, 20),
    sisters: num(0, 20),
    marriedSisters: num(0, 20),
    familyType: en(C.FAMILY_TYPE),
    familyStatus: en(C.FAMILY_STATUS),
    nativePlace: str(100),
  }).partial().optional(),
  about: str(1500),
  partnerPreference: z.object({
    ageMin: num(18, 75),
    ageMax: num(18, 75),
    heightMin: num(120, 220),
    heightMax: num(120, 220),
    maritalStatus: strArr,
    education: strArr,
    employedIn: strArr,
    states: strArr,
    isNriOk: z.coerce.boolean().optional(),
    about: str(1000),
  }).partial().optional(),
  photoPrivacy: z.enum(['all', 'premium', 'connected']).optional(),
  contactPrivacy: z.enum(['connected', 'premium']).optional(),
});

exports.schemas = { profile: profileSchema, profileUpdate: profileSchema.partial() };

async function myProfile(userId) {
  return Profile.findOne({ user: userId });
}

async function excludedUserIds(user) {
  // me + people I blocked + people who blocked me
  const blockedMe = await User.find({ blockedUsers: user._id }).distinct('_id');
  return [user._id, ...(user.blockedUsers || []), ...blockedMe];
}

/* ---------- Meta ---------- */
exports.meta = asyncHandler(async (req, res) => {
  const s = await Setting.findOne({ key: 'gotraList' }).lean();
  res.json({
    success: true,
    gotras: (s && Array.isArray(s.value) && s.value.length ? s.value : DEFAULT_GOTRAS),
    constants: C,
  });
});

/* ---------- My profile ---------- */
exports.getMine = asyncHandler(async (req, res) => {
  const p = await myProfile(req.user._id);
  if (!p) return res.json({ success: true, profile: null });
  res.json({ success: true, profile: toDetail(p, { isOwner: true }) });
});

exports.createMine = asyncHandler(async (req, res) => {
  if (await myProfile(req.user._id)) throw ApiError.conflict('Profile already exists, use update');
  const p = await Profile.create({ ...req.body, user: req.user._id, status: 'pending' });
  req.user.hasProfile = true;
  await req.user.save();
  res.status(201).json({ success: true, profile: toDetail(p, { isOwner: true }) });
});

const SENSITIVE = ['firstName', 'lastName', 'gender', 'dob', 'gotra'];
exports.updateMine = asyncHandler(async (req, res) => {
  const p = await myProfile(req.user._id);
  if (!p) throw ApiError.notFound('Create your profile first');
  const body = { ...req.body };
  if (body.family) body.family = { ...(p.family ? p.family.toObject() : {}), ...body.family };
  if (body.partnerPreference) body.partnerPreference = { ...(p.partnerPreference ? p.partnerPreference.toObject() : {}), ...body.partnerPreference };
  // changing identity fields sends profile back for re-approval
  const sensitiveChanged = SENSITIVE.some((k) => body[k] !== undefined && String(body[k]) !== String(p[k]));
  p.set(body);
  if (sensitiveChanged && p.status === 'approved') p.status = 'pending';
  if (p.status === 'rejected') p.status = 'pending';
  await p.save();
  res.json({ success: true, profile: toDetail(p, { isOwner: true }) });
});

exports.uploadPhotos = asyncHandler(async (req, res) => {
  const p = await myProfile(req.user._id);
  if (!p) throw ApiError.notFound('Create your profile first');
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('Please select a photo');
  if (p.photos.length + files.length > 6) throw ApiError.badRequest('Maximum 6 photos allowed');
  for (const f of files) {
    const url = await saveImage(f.buffer, 'profiles', { width: 900 });
    p.photos.push({ url, isPrimary: p.photos.length === 0 });
  }
  await p.save();
  res.json({ success: true, photos: p.photos });
});

exports.deletePhoto = asyncHandler(async (req, res) => {
  const p = await myProfile(req.user._id);
  if (!p) throw ApiError.notFound();
  const photo = p.photos.id(req.params.photoId);
  if (!photo) throw ApiError.notFound('Photo not found');
  const wasPrimary = photo.isPrimary;
  deleteImage(photo.url);
  photo.deleteOne();
  if (wasPrimary && p.photos.length) p.photos[0].isPrimary = true;
  await p.save();
  res.json({ success: true, photos: p.photos });
});

exports.setPrimaryPhoto = asyncHandler(async (req, res) => {
  const p = await myProfile(req.user._id);
  if (!p) throw ApiError.notFound();
  if (!p.photos.id(req.params.photoId)) throw ApiError.notFound('Photo not found');
  p.photos.forEach((ph) => { ph.isPrimary = String(ph._id) === req.params.photoId; });
  await p.save();
  res.json({ success: true, photos: p.photos });
});

/* ---------- Discovery ---------- */
async function runSearch(req, overrides = {}) {
  const me = req.user ? await myProfile(req.user._id) : null;
  const exclude = req.user ? await excludedUserIds(req.user) : [];
  const q = { ...req.query, ...overrides };
  const filter = buildSearchFilter(me, q, { excludeUserIds: exclude });
  const { page, limit, skip } = paginate(q);
  const [items, total] = await Promise.all([
    Profile.find(filter).sort(sortFor(q.sort)).skip(skip).limit(limit).populate('user', 'isOnline premium'),
    Profile.countDocuments(filter),
  ]);
  const viewerPremium = !!(req.user && req.user.isPremium);
  let shortlisted = new Set();
  let interestMap = new Map();
  if (req.user && items.length) {
    const ids = items.map((i) => i._id);
    const sl = await Shortlist.find({ user: req.user._id, profile: { $in: ids } }).distinct('profile');
    shortlisted = new Set(sl.map(String));
    const ints = await Interest.find({
      $or: [{ from: req.user._id, toProfile: { $in: ids } }, { to: req.user._id, fromProfile: { $in: ids } }],
    }).lean();
    ints.forEach((i) => {
      const pid = String(i.from.equals(req.user._id) ? i.toProfile : i.fromProfile);
      interestMap.set(pid, { status: i.status, direction: i.from.equals(req.user._id) ? 'sent' : 'received', id: i._id });
    });
  }
  const cards = items.map((p) => ({
    ...toCard(p, { me, viewerPremium, connected: interestMap.get(String(p._id))?.status === 'accepted' }),
    isShortlisted: shortlisted.has(String(p._id)),
    interest: interestMap.get(String(p._id)) || null,
  }));
  return { items: cards, total, page, pages: Math.ceil(total / limit), hasProfile: !!me };
}

exports.search = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await runSearch(req)) });
});

exports.recommendations = asyncHandler(async (req, res) => {
  const me = await myProfile(req.user._id);
  const pref = (me && me.partnerPreference) || {};
  const overrides = {};
  if (pref.ageMin) overrides.ageMin = pref.ageMin;
  if (pref.ageMax) overrides.ageMax = pref.ageMax;
  let result = await runSearch(req, overrides);
  if (!result.total) result = await runSearch(req, {}); // relax if nothing matched
  result.items.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  res.json({ success: true, ...result });
});

/** Public featured / latest profiles for the home page (limited info) */
exports.featured = asyncHandler(async (req, res) => {
  const items = await Profile.find({ status: 'approved', 'photos.0': { $exists: true }, photoPrivacy: 'all' })
    .sort({ isFeatured: -1, completeness: -1, createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 8, 20));
  res.json({
    success: true,
    items: items.map((p) => {
      const c = toCard(p, {});
      return { id: c.id, profileId: c.profileId, firstName: c.firstName, age: c.age, gender: c.gender, education: c.education,
        occupation: c.occupation, district: c.district, state: c.state, photo: c.photo, isVerified: c.isVerified };
    }),
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = /^msr\d+$/i.test(id)
    ? await Profile.findOne({ profileId: id.toUpperCase() })
    : await Profile.findById(id);
  if (!p) throw ApiError.notFound('Profile not found');

  const isOwner = req.user && p.user.equals(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    if (p.status !== 'approved') throw ApiError.notFound('Profile not found');
    const exclude = await excludedUserIds(req.user);
    if (exclude.some((x) => String(x) === String(p.user))) throw ApiError.notFound('Profile not available');
  }

  const me = isOwner ? p : await myProfile(req.user._id);
  const connected = !isOwner && (await Interest.areConnected(req.user._id, p.user));
  const owner = await User.findById(p.user).select('isOnline lastActive premium');

  if (!isOwner && !isAdmin && me) {
    // record view (once per viewer) and notify
    const r = await ProfileView.updateOne(
      { viewer: req.user._id, profile: p._id },
      { $set: { viewerProfile: me._id }, $setOnInsert: { viewer: req.user._id, profile: p._id } },
      { upsert: true }
    );
    if (r.upsertedCount) {
      await Profile.updateOne({ _id: p._id }, { $inc: { views: 1 } });
      notify(p.user, { type: 'profile_view', title: 'Someone viewed your profile', body: `${me.firstName} (${me.profileId}) viewed your profile`, link: `/profile/${me.profileId}` }).catch(() => {});
    }
  }

  const detail = toDetail(p, { isOwner, isAdmin, me, viewerPremium: req.user.isPremium, connected });
  let interest = null;
  if (!isOwner) {
    const i = await Interest.findOne({ $or: [{ from: req.user._id, to: p.user }, { from: p.user, to: req.user._id }] }).lean();
    if (i) interest = { id: i._id, status: i.status, direction: i.from.equals(req.user._id) ? 'sent' : 'received' };
  }
  const isShortlisted = !isOwner && !!(await Shortlist.exists({ user: req.user._id, profile: p._id }));
  const contactUnlocked = !isOwner && !!(await ContactView.exists({ user: req.user._id, profile: p._id }));

  res.json({
    success: true,
    profile: detail,
    isOnline: owner ? owner.isOnline : false,
    lastActive: owner ? owner.lastActive : null,
    isPremiumMember: !!(owner && owner.premium && owner.premium.expiresAt > new Date()),
    connected,
    interest,
    isShortlisted,
    contactUnlocked: connected || contactUnlocked,
    canChat: connected || req.user.isPremium,
  });
});

/** Reveal phone number: connected (accepted interest) OR premium with credits */
exports.contact = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id);
  if (!p || p.status !== 'approved') throw ApiError.notFound('Profile not found');
  if (p.user.equals(req.user._id)) throw ApiError.badRequest('This is your own profile');
  const owner = await User.findById(p.user);
  if (!owner || owner.status !== 'active') throw ApiError.notFound('Profile not available');

  const connected = await Interest.areConnected(req.user._id, p.user);
  const already = await ContactView.exists({ user: req.user._id, profile: p._id });

  if (!connected && !already) {
    if (p.contactPrivacy === 'connected') {
      throw ApiError.forbidden('This member shares contact details only after accepting your interest');
    }
    if (!req.user.isPremium) throw new ApiError(402, 'Upgrade to premium to view contact numbers');
    if ((req.user.premium.contactsLeft || 0) <= 0) throw new ApiError(402, 'Your contact view limit is over. Please renew your plan.');
    await ContactView.create({ user: req.user._id, profile: p._id });
    req.user.premium.contactsLeft -= 1;
    req.user.markModified('premium');
    await req.user.save();
  }
  res.json({
    success: true,
    phone: owner.phone,
    countryCode: owner.countryCode,
    email: owner.email || null,
    contactsLeft: req.user.premium ? req.user.premium.contactsLeft : 0,
  });
});

/* ---------- Shortlist ---------- */
exports.toggleShortlist = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id).select('_id user');
  if (!p) throw ApiError.notFound('Profile not found');
  const existing = await Shortlist.findOne({ user: req.user._id, profile: p._id });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, shortlisted: false });
  }
  await Shortlist.create({ user: req.user._id, profile: p._id });
  res.json({ success: true, shortlisted: true });
});

exports.shortlist = asyncHandler(async (req, res) => {
  const me = await myProfile(req.user._id);
  const { page, limit, skip } = paginate(req.query);
  const rows = await Shortlist.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate({ path: 'profile', populate: { path: 'user', select: 'isOnline premium' } });
  const total = await Shortlist.countDocuments({ user: req.user._id });
  const items = rows.filter((r) => r.profile && r.profile.status === 'approved')
    .map((r) => ({ ...toCard(r.profile, { me, viewerPremium: req.user.isPremium }), isShortlisted: true }));
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

/* ---------- Visitors ---------- */
exports.visitors = asyncHandler(async (req, res) => {
  const me = await myProfile(req.user._id);
  if (!me) return res.json({ success: true, items: [], total: 0 });
  const { page, limit, skip } = paginate(req.query);
  const rows = await ProfileView.find({ profile: me._id }).sort({ updatedAt: -1 }).skip(skip).limit(limit)
    .populate({ path: 'viewerProfile', populate: { path: 'user', select: 'isOnline premium' } });
  const total = await ProfileView.countDocuments({ profile: me._id });
  const items = rows.filter((r) => r.viewerProfile && r.viewerProfile.status === 'approved')
    .map((r) => ({ ...toCard(r.viewerProfile, { me, viewerPremium: req.user.isPremium }), viewedAt: r.updatedAt }));
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

/* ---------- Block & report ---------- */
exports.block = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id).select('user');
  if (!p) throw ApiError.notFound('Profile not found');
  if (p.user.equals(req.user._id)) throw ApiError.badRequest('You cannot block yourself');
  const isBlocked = req.user.blockedUsers.some((u) => u.equals(p.user));
  if (isBlocked) req.user.blockedUsers.pull(p.user);
  else req.user.blockedUsers.push(p.user);
  await req.user.save();
  res.json({ success: true, blocked: !isBlocked });
});

exports.blockedList = asyncHandler(async (req, res) => {
  const items = await Profile.find({ user: { $in: req.user.blockedUsers } }).select('profileId firstName lastName photos');
  res.json({ success: true, items: items.map((p) => ({ id: p._id, profileId: p.profileId, fullName: p.fullName, photo: p.primaryPhoto })) });
});

exports.report = asyncHandler(async (req, res) => {
  const p = await Profile.findById(req.params.id).select('user');
  if (!p) throw ApiError.notFound('Profile not found');
  const reason = ['fake_profile', 'abusive', 'married', 'spam', 'wrong_info', 'other'].includes(req.body.reason) ? req.body.reason : 'other';
  await Report.create({
    reporter: req.user._id, reportedUser: p.user, reportedProfile: p._id, reason, details: String(req.body.details || '').slice(0, 1000),
  });
  res.status(201).json({ success: true, message: 'Thank you. Our team will review this profile.' });
});

/* ---------- Dashboard summary ---------- */
exports.dashboard = asyncHandler(async (req, res) => {
  const me = await myProfile(req.user._id);
  const uid = req.user._id;
  const [received, sent, accepted, shortlisted, visitors] = await Promise.all([
    Interest.countDocuments({ to: uid, status: 'pending' }),
    Interest.countDocuments({ from: uid, status: 'pending' }),
    Interest.countDocuments({ $or: [{ from: uid }, { to: uid }], status: 'accepted' }),
    Shortlist.countDocuments({ user: uid }),
    me ? ProfileView.countDocuments({ profile: me._id }) : 0,
  ]);
  res.json({
    success: true,
    profile: me ? toDetail(me, { isOwner: true }) : null,
    stats: { received, sent, accepted, shortlisted, visitors },
    user: req.user.toSafeJSON(),
  });
});
