const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Try again after some time.' } });

router.post('/send-otp', otpLimiter, validate(c.schemas.sendOtp), c.sendOtp);
router.post('/verify-otp', otpLimiter, validate(c.schemas.verifyOtp), c.verifyOtp);
router.post('/admin/login', otpLimiter, validate(c.schemas.adminLogin), c.adminLogin);
router.get('/me', protect, c.me);
router.patch('/me', protect, c.updateMe);
router.delete('/me', protect, c.deleteAccount);

module.exports = router;
