const crypto = require('crypto');

exports.randomOtp = (len = 6) => {
  const min = 10 ** (len - 1);
  return String(crypto.randomInt(min, min * 10));
};

exports.sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

exports.ageFromDob = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

/** Date of birth boundaries for an age range */
exports.dobRangeForAge = (minAge, maxAge) => {
  const now = new Date();
  const range = {};
  if (maxAge) range.$gte = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate() + 1);
  if (minAge) range.$lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  return range;
};

exports.paginate = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

exports.escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.normalizePhone = (phone = '') => String(phone).replace(/\D/g, '').slice(-10);
