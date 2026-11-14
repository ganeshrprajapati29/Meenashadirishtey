const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    key: { type: String, unique: true }, // sorted ids joined → one conversation per pair
    lastMessage: String,
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

conversationSchema.statics.keyFor = (a, b) => [String(a), String(b)].sort().join('_');

module.exports = mongoose.model('Conversation', conversationSchema);
