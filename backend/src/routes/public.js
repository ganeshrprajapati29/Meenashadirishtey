/** Public, unauthenticated endpoints used by the website & app */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { Banner, SuccessStory, Setting, Enquiry, Profile } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const PUBLIC_SETTINGS = ['siteName', 'tagline', 'contactPhone', 'whatsapp', 'email', 'address', 'facebook', 'instagram',
  'youtube', 'playStoreUrl', 'appStoreUrl', 'announcement'];

router.get('/settings', asyncHandler(async (req, res) => {
  const all = await Setting.getAll();
  const out = {};
  PUBLIC_SETTINGS.forEach((k) => { if (all[k] !== undefined) out[k] = all[k]; });
  res.json({ success: true, settings: out });
}));

router.get('/banners', asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  };
  if (req.query.placement) filter.placement = { $in: String(req.query.placement).split(',') };
  const items = await Banner.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  if (items.length) Banner.updateMany({ _id: { $in: items.map((b) => b._id) } }, { $inc: { impressions: 1 } }).catch(() => {});
  res.json({ success: true, items });
}));

router.post('/banners/:id/click', asyncHandler(async (req, res) => {
  await Banner.updateOne({ _id: req.params.id }, { $inc: { clicks: 1 } });
  res.json({ success: true });
}));

router.get('/stories', asyncHandler(async (req, res) => {
  const items = await SuccessStory.find({ isPublished: true }).sort({ weddingDate: -1, createdAt: -1 }).limit(Number(req.query.limit) || 12).lean();
  res.json({ success: true, items });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const [profiles, brides, grooms, stories] = await Promise.all([
    Profile.countDocuments({ status: 'approved' }),
    Profile.countDocuments({ status: 'approved', gender: 'female' }),
    Profile.countDocuments({ status: 'approved', gender: 'male' }),
    SuccessStory.countDocuments({ isPublished: true }),
  ]);
  res.json({ success: true, stats: { profiles, brides, grooms, stories } });
}));

const enquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10 });
router.post('/enquiry', enquiryLimiter, asyncHandler(async (req, res) => {
  const { name, phone, email, message } = req.body || {};
  if (!name || !phone || !message) throw ApiError.badRequest('Name, phone and message are required');
  await Enquiry.create({ name: String(name).slice(0, 80), phone: String(phone).slice(0, 15), email: email ? String(email).slice(0, 80) : undefined, message: String(message).slice(0, 2000) });
  res.status(201).json({ success: true, message: 'Thank you! We will contact you soon.' });
}));

module.exports = router;
