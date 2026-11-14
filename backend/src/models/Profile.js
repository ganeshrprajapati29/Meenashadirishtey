const mongoose = require('mongoose');
const C = require('../utils/constants');
const Counter = require('./Counter');

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profileId: { type: String, unique: true, index: true }, // MSR10001
    createdFor: { type: String, enum: C.CREATED_FOR, default: 'self' },

    // Basic
    firstName: { type: String, required: true, trim: true, maxlength: 40 },
    lastName: { type: String, trim: true, maxlength: 40, default: 'Meena' },
    gender: { type: String, enum: C.GENDERS, required: true, index: true },
    dob: { type: Date, required: true, index: true },
    maritalStatus: { type: String, enum: C.MARITAL_STATUS, default: 'never_married', index: true },
    height: { type: Number, min: 120, max: 220 }, // cm
    weight: { type: Number, min: 30, max: 200 },
    complexion: { type: String, enum: C.COMPLEXION },
    diet: { type: String, enum: C.DIET },
    disability: { type: String, default: 'none' },
    motherTongue: { type: String, default: 'Hindi' },

    // Community
    community: { type: String, default: 'Meena' },
    subCommunity: String,
    gotra: { type: String, required: true, trim: true, index: true },
    motherGotra: { type: String, trim: true },
    dadiGotra: { type: String, trim: true },
    naniGotra: { type: String, trim: true },
    rashi: String,
    manglik: { type: String, enum: C.MANGLIK, default: 'dont_know' },
    birthTime: String,
    birthPlace: String,

    // Education & career
    education: { type: String, index: true },
    educationDetail: String,
    employedIn: { type: String, enum: C.EMPLOYED_IN, index: true },
    occupation: String,
    occupationDetail: String,
    annualIncome: String,

    // Location
    country: { type: String, default: 'India' },
    state: { type: String, index: true },
    district: { type: String, index: true },
    city: String,
    isNri: { type: Boolean, default: false, index: true },

    // Family
    family: {
      fatherName: String,
      fatherOccupation: String,
      motherName: String,
      motherOccupation: String,
      brothers: { type: Number, default: 0 },
      marriedBrothers: { type: Number, default: 0 },
      sisters: { type: Number, default: 0 },
      marriedSisters: { type: Number, default: 0 },
      familyType: { type: String, enum: C.FAMILY_TYPE },
      familyStatus: { type: String, enum: C.FAMILY_STATUS },
      nativePlace: String,
    },

    about: { type: String, maxlength: 1500 },

    partnerPreference: {
      ageMin: Number,
      ageMax: Number,
      heightMin: Number,
      heightMax: Number,
      maritalStatus: [String],
      education: [String],
      employedIn: [String],
      states: [String],
      isNriOk: { type: Boolean, default: true },
      about: { type: String, maxlength: 1000 },
    },

    photos: [photoSchema],
    photoPrivacy: { type: String, enum: ['all', 'premium', 'connected'], default: 'all' },
    contactPrivacy: { type: String, enum: ['connected', 'premium'], default: 'premium' },

    // Moderation & ranking
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: String,
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    completeness: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now, index: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

profileSchema.index({ status: 1, gender: 1, dob: 1 });
profileSchema.index({ firstName: 'text', lastName: 'text', occupation: 'text', city: 'text', district: 'text' });

profileSchema.virtual('age').get(function () {
  if (!this.dob) return null;
  const now = new Date();
  let age = now.getFullYear() - this.dob.getFullYear();
  const m = now.getMonth() - this.dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < this.dob.getDate())) age--;
  return age;
});

profileSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

profileSchema.virtual('primaryPhoto').get(function () {
  if (!this.photos || !this.photos.length) return null;
  const p = this.photos.find((x) => x.isPrimary) || this.photos[0];
  return p.url;
});

/** Gotras this person must avoid */
profileSchema.methods.avoidGotras = function () {
  return [this.gotra, this.motherGotra, this.dadiGotra, this.naniGotra]
    .filter(Boolean)
    .map((g) => g.trim().toLowerCase());
};

profileSchema.methods.computeCompleteness = function () {
  const checks = [
    this.firstName, this.gender, this.dob, this.maritalStatus, this.height, this.gotra, this.motherGotra,
    this.education, this.employedIn, this.occupation, this.annualIncome, this.state, this.district, this.city,
    this.family && this.family.fatherOccupation, this.family && this.family.familyType, this.about,
    this.photos && this.photos.length, this.partnerPreference && this.partnerPreference.ageMin, this.diet,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

profileSchema.pre('save', async function (next) {
  if (!this.profileId) {
    const seq = await Counter.next('profile');
    this.profileId = `MSR${10000 + seq}`;
  }
  ['gotra', 'motherGotra', 'dadiGotra', 'naniGotra'].forEach((k) => {
    if (this[k]) this[k] = this[k].trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  });
  this.completeness = this.computeCompleteness();
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
