const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    toProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    message: { type: String, maxlength: 300 },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending', index: true },
    respondedAt: Date,
  },
  { timestamps: true }
);
interestSchema.index({ from: 1, to: 1 }, { unique: true });

/** true if two users have an accepted interest in either direction */
interestSchema.statics.areConnected = async function (a, b) {
  const doc = await this.exists({
    status: 'accepted',
    $or: [{ from: a, to: b }, { from: b, to: a }],
  });
  return !!doc;
};

module.exports = mongoose.model('Interest', interestSchema);
