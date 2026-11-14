const mongoose = require('mongoose');
const { BANNER_PLACEMENTS } = require('../utils/constants');

// Dynamic banners / advertisements managed from the admin panel
const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: String,
    mobileImage: String,
    link: String,
    ctaText: String,
    placement: { type: String, enum: BANNER_PLACEMENTS, default: 'home_mid', index: true },
    advertiser: String,
    isAd: { type: Boolean, default: false },
    bgColor: { type: String, default: '#7A1F1F' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
