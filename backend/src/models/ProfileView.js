const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema(
  {
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  },
  { timestamps: true }
);
viewSchema.index({ viewer: 1, profile: 1 }, { unique: true });

module.exports = mongoose.model('ProfileView', viewSchema);
