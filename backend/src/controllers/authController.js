const { z } = require('zod');
const { User, Otp, Setting } = require('../models');
const { otp: otpCfg } = require('../config/env');
const { signToken } = require('../middleware/auth');
const { randomOtp, sha256, normalizePhone } = require('../utils/helpers');
const { sendOtpSms } = require('../services/smsService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.schemas = {
  sendOtp: z.object({ phone: z.string().min(10).max(15), countryCode: z.string().optional() }),
  verifyOtp: z.object({ phone: z.string().min(10).max(15), otp: z.string().length(6), countryCode: z.string().optional() }),
  adminLogin: z.object({ email: z.string().email(), password: z.string().min(4) }),
};

const validPhone = (p) => /^[6-9]\d{9}$/.test(p);

exports.sendOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!validPhone(phone)) throw ApiError.badRequest('Please enter a valid 10 digit mobile number');

  const existing = await User.findOne({ phone });
  if (existing && existing.status === 'blocked') throw ApiError.forbidden('This number is blocked. Please contact support.');

  const last = await Otp.findOne({ phone }).sort({ createdAt: -1 });
  if (last && Date.now() - last.createdAt.getTime() < otpCfg.resendSeconds * 1000) {
    const wait = Math.ceil((otpCfg.resendSeconds * 1000 - (Date.now() - last.createdAt.getTime())) / 1000);
    throw ApiError.tooMany(`Please wait ${wait}s before requesting a new OTP`);
  }

  const code = randomOtp(otpCfg.length);
  await Otp.deleteMany({ phone });
  await Otp.create({ phone, codeHash: sha256(`${phone}:${code}`), expiresAt: new Date(Date.now() + otpCfg.ttlMinutes * 60000) });

  // Admin can switch mode from settings; env is the default
  const settings = await Setting.findOne({ key: 'otpMode' }).lean();
  const mode = (settings && settings.value) || otpCfg.mode;

  const payload = { success: true, message: 'OTP sent', expiresIn: otpCfg.ttlMinutes * 60, resendIn: otpCfg.resendSeconds, isNewUser: !existing };
  if (mode === 'sms') {
    try {
      await sendOtpSms(phone, code);
    } catch (e) {
      console.error('[otp] sms failed, falling back to screen mode:', e.message);
      payload.otp = code;
      payload.otpMode = 'screen';
      return res.json(payload);
    }
    payload.otpMode = 'sms';
  } else {
    payload.otp = code; // shown on screen until SMS provider is configured
    payload.otpMode = 'screen';
  }
  res.json(payload);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const record = await Otp.findOne({ phone }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) throw ApiError.badRequest('OTP expired, please request a new one');
  if (record.attempts >= otpCfg.maxAttempts) {
    await record.deleteOne();
    throw ApiError.tooMany('Too many wrong attempts, please request a new OTP');
  }
  if (record.codeHash !== sha256(`${phone}:${req.body.otp}`)) {
    record.attempts += 1;
    await record.save();
    throw ApiError.badRequest(`Wrong OTP. ${otpCfg.maxAttempts - record.attempts} attempts left`);
  }
  await Otp.deleteMany({ phone });

  let user = await User.findOne({ phone });
  const isNewUser = !user;
  if (!user) user = await User.create({ phone, countryCode: req.body.countryCode || '+91' });
  if (user.status !== 'active') throw ApiError.forbidden('Your account is blocked. Please contact support.');

  user.lastActive = new Date();
  await user.save();
  res.json({ success: true, token: signToken(user), user: user.toSafeJSON(), isNewUser });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase(), role: 'admin' }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') throw ApiError.forbidden('Account disabled');
  res.json({ success: true, token: signToken(user), user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  const { Profile } = require('../models');
  const profile = await Profile.findOne({ user: req.user._id }).select('profileId firstName lastName photos status completeness gender');
  res.json({
    success: true,
    user: req.user.toSafeJSON(),
    profile: profile ? profile.toJSON() : null,
  });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { language, fcmToken, email } = req.body || {};
  if (language && ['en', 'hi'].includes(language)) req.user.language = language;
  if (fcmToken) req.user.fcmToken = String(fcmToken);
  if (email !== undefined && req.user.role === 'user') req.user.email = email ? String(email).toLowerCase() : undefined;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const { Profile } = require('../models');
  req.user.status = 'deleted';
  req.user.phone = `deleted_${req.user._id}`;
  req.user.email = undefined;
  await req.user.save();
  await Profile.deleteOne({ user: req.user._id });
  res.json({ success: true, message: 'Account deleted' });
});
