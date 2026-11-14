const mongoose = require('mongoose');

// A premium member who unlocked a contact number (consumes 1 credit once per profile)
const contactViewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  },
  { timestamps: true }
);
contactViewSchema.index({ user: 1, profile: 1 }, { unique: true });

module.exports = mongoose.model('ContactView', contactViewSchema);
