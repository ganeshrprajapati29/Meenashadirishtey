/**
 * Serializes a profile for a viewer, applying privacy rules:
 *  - phone number never included here (use /profiles/:id/contact)
 *  - photos hidden when photoPrivacy requires premium / connection
 */
const { matchScore, isGotraCompatible } = require('./matchService');

const CARD_FIELDS = [
  'profileId', 'firstName', 'lastName', 'gender', 'maritalStatus', 'height', 'gotra', 'education', 'employedIn',
  'occupation', 'annualIncome', 'state', 'district', 'city', 'country', 'isNri', 'isVerified', 'isFeatured', 'lastActive',
  'createdFor', 'manglik', 'diet',
];

function canSeePhotos(profile, { isOwner, isAdmin, viewerPremium, connected }) {
  if (isOwner || isAdmin) return true;
  if (profile.photoPrivacy === 'all') return true;
  if (profile.photoPrivacy === 'premium') return viewerPremium || connected;
  return connected; // 'connected'
}

exports.toCard = (p, ctx = {}) => {
  const out = { id: p._id, userId: p.user && p.user._id ? p.user._id : p.user };
  CARD_FIELDS.forEach((k) => { out[k] = p[k]; });
  out.age = p.age;
  out.fullName = p.fullName;
  const photosVisible = canSeePhotos(p, ctx);
  out.photoLocked = !photosVisible && p.photos && p.photos.length > 0;
  out.photo = photosVisible ? p.primaryPhoto : null;
  out.photoCount = (p.photos || []).length;
  if (ctx.me) {
    out.matchScore = matchScore(ctx.me, p);
    out.gotraCompatible = isGotraCompatible(ctx.me, p);
  }
  if (p.user && p.user.isOnline !== undefined) out.isOnline = p.user.isOnline;
  if (p.user && p.user.premium) out.isPremium = !!(p.user.premium.expiresAt && p.user.premium.expiresAt > new Date());
  return out;
};

exports.toDetail = (p, ctx = {}) => {
  const obj = p.toObject({ virtuals: true });
  const photosVisible = canSeePhotos(p, ctx);
  delete obj.__v;
  obj.id = obj._id;
  obj.userId = p.user && p.user._id ? p.user._id : p.user;
  delete obj.user;
  obj.photoLocked = !photosVisible && p.photos && p.photos.length > 0;
  obj.photos = photosVisible ? (p.photos || []).filter((x) => x.approved || ctx.isOwner || ctx.isAdmin) : [];
  obj.primaryPhoto = photosVisible ? p.primaryPhoto : null;
  if (!ctx.isOwner && !ctx.isAdmin) {
    // keep family names private from strangers
    if (obj.family) { delete obj.family.fatherName; delete obj.family.motherName; }
    delete obj.rejectionReason;
  }
  if (ctx.me && !ctx.isOwner) {
    obj.matchScore = matchScore(ctx.me, p);
    obj.gotraCompatible = isGotraCompatible(ctx.me, p);
  }
  return obj;
};
