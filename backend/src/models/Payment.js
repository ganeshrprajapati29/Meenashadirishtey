const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    planName: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    mode: { type: String, enum: ['razorpay', 'demo', 'manual'], default: 'razorpay' },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
    orderId: String,
    paymentId: String,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
