const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['interest_received', 'interest_accepted', 'interest_declined', 'message', 'profile_view',
        'profile_approved', 'profile_rejected', 'premium', 'system'],
      default: 'system',
    },
    title: String,
    body: String,
    link: String,
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
