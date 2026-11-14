const { User } = require('../models');
const { notify } = require('./notify');

/** Activate (or extend) a plan for a user */
exports.activatePlan = async (userId, plan) => {
  const user = await User.findById(userId);
  const now = new Date();
  const base = user.premium && user.premium.expiresAt && user.premium.expiresAt > now ? user.premium.expiresAt : now;
  user.premium = {
    plan: plan._id,
    planName: plan.name,
    startedAt: now,
    expiresAt: new Date(base.getTime() + plan.durationDays * 24 * 3600 * 1000),
    contactsLeft: ((user.isPremium && user.premium.contactsLeft) || 0) + (plan.contactLimit || 0),
  };
  await user.save();
  notify(user._id, {
    type: 'premium', title: `${plan.name} activated 👑`,
    body: `Your premium membership is active till ${user.premium.expiresAt.toDateString()}`, link: '/dashboard',
  }).catch(() => {});
  return user;
};
