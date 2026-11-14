const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    reason: { type: String, enum: ['fake_profile', 'abusive', 'married', 'spam', 'wrong_info', 'other'], required: true },
    details: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    adminNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
