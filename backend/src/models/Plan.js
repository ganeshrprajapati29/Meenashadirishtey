const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameHi: String,
    price: { type: Number, required: true, min: 0 },
    mrp: Number,
    durationDays: { type: Number, required: true, min: 1 },
    contactLimit: { type: Number, default: 0 },
    features: [String],
    featuresHi: [String],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    color: { type: String, default: '#D4A017' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
