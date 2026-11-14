const crypto = require('crypto');
const { Plan, Payment } = require('../models');
const { razorpay: rz } = require('../config/env');
const { activatePlan } = require('../services/premiumService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const razorpayEnabled = () => !!(rz.keyId && rz.keySecret);
let client = null;
function razorpay() {
  if (!client) {
    const Razorpay = require('razorpay');
    client = new Razorpay({ key_id: rz.keyId, key_secret: rz.keySecret });
  }
  return client;
}

exports.plans = asyncHandler(async (req, res) => {
  const items = await Plan.find({ isActive: true }).sort({ order: 1, price: 1 }).lean();
  res.json({ success: true, items, paymentMode: razorpayEnabled() ? 'razorpay' : 'demo' });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.body.planId);
  if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');

  if (!razorpayEnabled()) {
    // DEMO MODE: no payment gateway configured → activate immediately (for client demo)
    const payment = await Payment.create({ user: req.user._id, plan: plan._id, planName: plan.name, amount: plan.price, mode: 'demo', status: 'paid', note: 'Demo mode – no gateway configured' });
    const user = await activatePlan(req.user._id, plan);
    return res.json({ success: true, mode: 'demo', payment, user: user.toSafeJSON() });
  }

  const order = await razorpay().orders.create({
    amount: Math.round(plan.price * 100),
    currency: 'INR',
    receipt: `msr_${Date.now()}`,
    notes: { userId: String(req.user._id), planId: String(plan._id) },
  });
  const payment = await Payment.create({ user: req.user._id, plan: plan._id, planName: plan.name, amount: plan.price, orderId: order.id, mode: 'razorpay' });
  res.json({ success: true, mode: 'razorpay', keyId: rz.keyId, order, paymentId: payment._id, plan: { name: plan.name, price: plan.price } });
});

exports.verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const payment = await Payment.findOne({ orderId, user: req.user._id });
  if (!payment) throw ApiError.notFound('Order not found');
  if (payment.status === 'paid') return res.json({ success: true, alreadyPaid: true });

  const expected = crypto.createHmac('sha256', rz.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const ok = signature && signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) {
    payment.status = 'failed';
    await payment.save();
    throw ApiError.badRequest('Payment verification failed');
  }
  payment.status = 'paid';
  payment.paymentId = paymentId;
  await payment.save();
  const plan = await Plan.findById(payment.plan);
  const user = await activatePlan(req.user._id, plan);
  res.json({ success: true, user: user.toSafeJSON() });
});

exports.history = asyncHandler(async (req, res) => {
  const items = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, items });
});
