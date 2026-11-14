const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

counterSchema.statics.next = async function (name) {
  const c = await this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
