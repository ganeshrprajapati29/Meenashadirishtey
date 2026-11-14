const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, sparse: true, index: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    password: { type: String, select: false }, // admins only
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'blocked', 'deleted'], default: 'active', index: true },
    language: { type: String, enum: ['en', 'hi'], default: 'hi' },
    hasProfile: { type: Boolean, default: false },
    premium: {
      plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      planName: String,
      startedAt: Date,
      expiresAt: Date,
      contactsLeft: { type: Number, default: 0 },
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    fcmToken: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.virtual('isPremium').get(function () {
  return !!(this.premium && this.premium.expiresAt && this.premium.expiresAt > new Date());
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password || '');
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    phone: this.phone,
    countryCode: this.countryCode,
    email: this.email,
    role: this.role,
    status: this.status,
    language: this.language,
    hasProfile: this.hasProfile,
    isPremium: this.isPremium,
    premium: this.premium,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
