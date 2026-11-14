const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    coupleNames: { type: String, required: true },
    story: { type: String, required: true, maxlength: 2000 },
    image: String,
    location: String,
    weddingDate: Date,
    isPublished: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SuccessStory', storySchema);
