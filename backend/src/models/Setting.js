const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

settingSchema.statics.getAll = async function () {
  const rows = await this.find().lean();
  return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
};

module.exports = mongoose.model('Setting', settingSchema);
