const router = require('express').Router();
const { Notification } = require('../models');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/helpers');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [items, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, items, total, unread, page, pages: Math.ceil(total / limit) });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
}));

module.exports = router;
