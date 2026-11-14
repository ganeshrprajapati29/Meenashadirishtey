const { dobRangeForAge, escapeRegex } = require('../utils/helpers');

const ci = (v) => new RegExp(`^${escapeRegex(String(v).trim())}$`, 'i');

/**
 * Build a MongoDB filter for searching profiles.
 * @param {object} me  the searcher's Profile document (may be null for guests)
 * @param {object} q   query params
 * @param {object} ctx { excludeUserIds }
 */
exports.buildSearchFilter = (me, q = {}, ctx = {}) => {
  const filter = { status: 'approved' };

  // Opposite gender by default
  if (q.gender) filter.gender = q.gender;
  else if (me) filter.gender = me.gender === 'male' ? 'female' : 'male';

  if (ctx.excludeUserIds && ctx.excludeUserIds.length) filter.user = { $nin: ctx.excludeUserIds };

  const ageMin = Number(q.ageMin) || null;
  const ageMax = Number(q.ageMax) || null;
  if (ageMin || ageMax) filter.dob = dobRangeForAge(ageMin, ageMax);

  const hMin = Number(q.heightMin) || null;
  const hMax = Number(q.heightMax) || null;
  if (hMin || hMax) {
    filter.height = {};
    if (hMin) filter.height.$gte = hMin;
    if (hMax) filter.height.$lte = hMax;
  }

  const list = (v) => (Array.isArray(v) ? v : String(v).split(',')).map((s) => s.trim()).filter(Boolean);
  if (q.maritalStatus) filter.maritalStatus = { $in: list(q.maritalStatus) };
  if (q.education) filter.education = { $in: list(q.education) };
  if (q.employedIn) filter.employedIn = { $in: list(q.employedIn) };
  if (q.state) filter.state = { $in: list(q.state).map(ci) };
  if (q.district) filter.district = ci(q.district);
  if (q.isNri === 'true' || q.isNri === true) filter.isNri = true;
  if (q.withPhoto === 'true' || q.withPhoto === true) filter['photos.0'] = { $exists: true };
  if (q.manglik) filter.manglik = q.manglik;
  if (q.diet) filter.diet = q.diet;
  if (q.verified === 'true') filter.isVerified = true;

  if (q.keyword) {
    const kw = String(q.keyword).trim();
    if (/^msr\d+$/i.test(kw)) filter.profileId = kw.toUpperCase();
    else {
      const rx = new RegExp(escapeRegex(kw), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { city: rx }, { district: rx }, { occupation: rx }, { gotra: rx }];
    }
  }

  // Gotra rule (on by default when the searcher has a profile)
  const gotraFilter = !(q.gotraFilter === 'false' || q.gotraFilter === false);
  if (me && gotraFilter) {
    const mine = me.avoidGotras();
    if (mine.length) {
      const mineRx = mine.map(ci);
      filter.gotra = { $nin: mineRx };
      // and my own gotra must not be in THEIR avoid set
      const myGotra = me.gotra ? ci(me.gotra) : null;
      if (myGotra) {
        filter.motherGotra = { $not: myGotra };
        filter.dadiGotra = { $not: myGotra };
        filter.naniGotra = { $not: myGotra };
      }
    }
  }
  return filter;
};

/** Sort options */
exports.sortFor = (sort) => {
  switch (sort) {
    case 'newest': return { createdAt: -1 };
    case 'active': return { lastActive: -1 };
    case 'age_asc': return { dob: -1 };
    case 'age_desc': return { dob: 1 };
    default: return { isFeatured: -1, completeness: -1, lastActive: -1 };
  }
};

/** Score 0-100 of how well `other` matches `me`'s partner preference (and vice-versa lightly) */
exports.matchScore = (me, other) => {
  if (!me || !other) return null;
  const pref = me.partnerPreference || {};
  let total = 0;
  let got = 0;
  const check = (weight, ok) => { total += weight; if (ok) got += weight; };

  const age = other.age;
  if (pref.ageMin || pref.ageMax) check(25, age && (!pref.ageMin || age >= pref.ageMin) && (!pref.ageMax || age <= pref.ageMax));
  if (pref.heightMin || pref.heightMax) check(10, other.height && (!pref.heightMin || other.height >= pref.heightMin) && (!pref.heightMax || other.height <= pref.heightMax));
  if (pref.maritalStatus && pref.maritalStatus.length) check(15, pref.maritalStatus.includes(other.maritalStatus));
  if (pref.education && pref.education.length) check(15, pref.education.includes(other.education));
  if (pref.employedIn && pref.employedIn.length) check(15, pref.employedIn.includes(other.employedIn));
  if (pref.states && pref.states.length) check(10, pref.states.map((s) => s.toLowerCase()).includes((other.state || '').toLowerCase()));

  // gotra compatibility always counts
  const theirs = typeof other.avoidGotras === 'function' ? other.avoidGotras() : [];
  const mine = typeof me.avoidGotras === 'function' ? me.avoidGotras() : [];
  const gotraOk = !mine.includes((other.gotra || '').toLowerCase()) && !theirs.includes((me.gotra || '').toLowerCase());
  check(10, gotraOk);

  if (!total) return 70;
  return Math.max(40, Math.round((got / total) * 100));
};

exports.isGotraCompatible = (me, other) => {
  if (!me || !other) return true;
  return !me.avoidGotras().includes((other.gotra || '').toLowerCase())
    && !other.avoidGotras().includes((me.gotra || '').toLowerCase());
};
