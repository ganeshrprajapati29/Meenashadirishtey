/**
 * Seed script
 *   npm run seed                → admin, plans, settings, banners (safe to run again)
 *   npm run seed -- --demo      → also demo profiles + demo success stories (for client preview)
 *   npm run seed -- --clear-demo → delete all demo data (run before going live)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const { User, Profile, Plan, Banner, Setting, SuccessStory, Interest, ProfileView, Shortlist } = require('./models');
const { UPLOAD_ROOT } = require('./middleware/upload');

const args = process.argv.slice(2);

/* ---------- banner artwork (generated, no external assets) ---------- */
function bannerSvg({ title, sub, cta, c1, c2, accent = '#F5C542', w = 1600, h = 500 }) {
  const rings = Array.from({ length: 14 }, (_, i) => `<circle cx="${1200 + (i % 4) * 90}" cy="${60 + Math.floor(i / 4) * 120}" r="${30 + (i % 3) * 10}" fill="none" stroke="${accent}" stroke-opacity="0.18" stroke-width="2"/>`).join('');
  const mandala = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    return `<ellipse cx="${1320 + Math.cos(a) * 120}" cy="${250 + Math.sin(a) * 120}" rx="60" ry="16" transform="rotate(${i * 15} ${1320 + Math.cos(a) * 120} ${250 + Math.sin(a) * 120})" fill="${accent}" fill-opacity="0.14"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="r" cx="0.82" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#r)"/>
  ${rings}${mandala}
  <circle cx="1320" cy="250" r="70" fill="none" stroke="${accent}" stroke-width="6"/>
  <circle cx="1390" cy="250" r="70" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="6"/>
  <path d="M0 ${h - 22} Q ${w / 4} ${h - 50} ${w / 2} ${h - 22} T ${w} ${h - 22} V ${h} H 0 Z" fill="${accent}" fill-opacity="0.35"/>
  <text x="90" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#fff">${title}</text>
  <text x="92" y="268" font-family="Arial, sans-serif" font-size="32" fill="#FFF3D6">${sub}</text>
  ${cta ? `<rect x="90" y="318" rx="30" width="${cta.length * 19 + 70}" height="62" fill="${accent}"/><text x="${90 + (cta.length * 19 + 70) / 2}" y="359" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#4A1010">${cta}</text>` : ''}
</svg>`;
}

async function makeBanner(name, opts) {
  const dir = path.join(UPLOAD_ROOT, 'banners');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.webp`);
  await sharp(Buffer.from(bannerSvg(opts))).webp({ quality: 88 }).toFile(file);
  return `/uploads/banners/${name}.webp`;
}

async function seedBase() {
  // Admin
  let admin = await User.findOne({ email: env.admin.email, role: 'admin' });
  if (!admin) {
    admin = await User.create({ email: env.admin.email, password: env.admin.password, role: 'admin', language: 'en' });
    console.log(`✔ admin created: ${env.admin.email}`);
  } else console.log('• admin exists');

  // Plans
  if (!(await Plan.countDocuments())) {
    await Plan.insertMany([
      { name: 'Silver', nameHi: 'सिल्वर', price: 499, mrp: 999, durationDays: 30, contactLimit: 20, order: 1, color: '#9CA3AF',
        features: ['View 20 contact numbers', 'Unlimited chat', 'See who viewed you', '50 interests / day'],
        featuresHi: ['20 मोबाइल नंबर देखें', 'अनलिमिटेड चैट', 'किसने प्रोफाइल देखी', 'रोज़ 50 रुचि भेजें'] },
      { name: 'Gold', nameHi: 'गोल्ड', price: 1299, mrp: 2499, durationDays: 90, contactLimit: 75, order: 2, isPopular: true, color: '#D4A017',
        features: ['View 75 contact numbers', 'Unlimited chat', 'Profile highlighted in search', 'See who viewed you', 'Priority support'],
        featuresHi: ['75 मोबाइल नंबर देखें', 'अनलिमिटेड चैट', 'सर्च में हाइलाइट प्रोफाइल', 'किसने प्रोफाइल देखी', 'प्राथमिकता सहायता'] },
      { name: 'Platinum', nameHi: 'प्लैटिनम', price: 2499, mrp: 4999, durationDays: 180, contactLimit: 200, order: 3, color: '#7A1F1F',
        features: ['View 200 contact numbers', 'Unlimited chat', 'Featured profile badge', 'Personal match assistance', 'Priority support'],
        featuresHi: ['200 मोबाइल नंबर देखें', 'अनलिमिटेड चैट', 'फीचर्ड प्रोफाइल बैज', 'व्यक्तिगत रिश्ता सहायता', 'प्राथमिकता सहायता'] },
    ]);
    console.log('✔ plans created');
  }

  // Settings
  const defaults = {
    siteName: 'Meena Shadi Rishtey',
    tagline: 'मीणा समाज के लिए भरोसेमंद रिश्ते',
    contactPhone: '+91 90000 00000',
    whatsapp: '919000000000',
    email: 'support@meenashadirishtey.com',
    address: 'Jaipur, Rajasthan',
    instagram: 'https://www.instagram.com/meenashadirishtey',
    announcement: '',
  };
  for (const [key, value] of Object.entries(defaults)) {
    await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  }
  console.log('✔ settings ready');

  // Banners / ads
  if (!(await Banner.countDocuments())) {
    const b1 = await makeBanner('premium-offer', { title: 'Premium Membership – 50% OFF', sub: 'Contact numbers देखें, अनलिमिटेड चैट करें', cta: 'Upgrade Now', c1: '#5B1414', c2: '#9A3412' });
    const b2 = await makeBanner('free-register', { title: 'Free Registration', sub: 'आज ही अपना बायोडाटा बनाएं – बिल्कुल मुफ्त', cta: 'Register Free', c1: '#7A1F1F', c2: '#B45309' });
    const b3 = await makeBanner('verified', { title: '100% Verified Profiles', sub: 'हर प्रोफाइल हमारी टीम द्वारा जांची जाती है', cta: 'Search Matches', c1: '#14532D', c2: '#7A1F1F' });
    const b4 = await makeBanner('advertise', { title: 'Advertise with MSR', sub: 'Wedding planners, tent house, caterers – अपना विज्ञापन दें', cta: 'Contact Us', c1: '#1E3A8A', c2: '#7A1F1F' });
    await Banner.insertMany([
      { title: 'Premium Membership – 50% OFF', subtitle: 'View contacts & chat unlimited', image: b1, link: '/plans', ctaText: 'Upgrade Now', placement: 'dashboard', order: 1 },
      { title: 'Premium Membership – 50% OFF', subtitle: 'View contacts & chat unlimited', image: b1, link: '/plans', ctaText: 'Upgrade Now', placement: 'app_home', order: 1 },
      { title: 'Free Registration', subtitle: 'Create your biodata today', image: b2, link: '/login', ctaText: 'Register Free', placement: 'home_mid', order: 1 },
      { title: '100% Verified Profiles', subtitle: 'Every profile is screened', image: b3, link: '/matches', ctaText: 'Search', placement: 'app_home', order: 2 },
      { title: '100% Verified Profiles', subtitle: 'Every profile is screened', image: b3, link: '/matches', ctaText: 'Search', placement: 'search', order: 1 },
      { title: 'Advertise with MSR', subtitle: 'Reach thousands of Meena families', image: b4, link: '/contact', ctaText: 'Contact Us', placement: 'home_mid', order: 2, isAd: true, advertiser: 'MSR' },
      { title: 'Advertise with MSR', subtitle: 'Reach thousands of Meena families', image: b4, link: '/contact', ctaText: 'Contact Us', placement: 'dashboard', order: 2, isAd: true, advertiser: 'MSR' },
    ]);
    console.log('✔ banners created');
  }
}

/* ---------- demo data ---------- */
const DEMO_MEN = ['Rahul', 'Vikram', 'Ankit', 'Rohit', 'Deepak', 'Sunil', 'Manish', 'Ajay', 'Pankaj', 'Lokesh', 'Hemraj', 'Mukesh'];
const DEMO_WOMEN = ['Priya', 'Pooja', 'Neha', 'Kavita', 'Sunita', 'Anjali', 'Rekha', 'Manisha', 'Komal', 'Seema', 'Kiran', 'Mamta'];
const GOTRAS = ['Jorwal', 'Sihara', 'Saiwal', 'Mahawar', 'Ghunawat', 'Badgoti', 'Meharda', 'Jarwal', 'Gotwal', 'Kotwal', 'Kanwat', 'Bamanawat'];
const PLACES = [
  ['Rajasthan', 'Jaipur', 'Jaipur'], ['Rajasthan', 'Dausa', 'Lalsot'], ['Rajasthan', 'Sawai Madhopur', 'Gangapur City'],
  ['Rajasthan', 'Karauli', 'Hindaun'], ['Rajasthan', 'Alwar', 'Rajgarh'], ['Rajasthan', 'Tonk', 'Niwai'],
  ['Rajasthan', 'Udaipur', 'Udaipur'], ['Madhya Pradesh', 'Vidisha', 'Vidisha'], ['Delhi', 'New Delhi', 'Delhi'],
  ['Rajasthan', 'Kota', 'Kota'], ['Rajasthan', 'Bundi', 'Bundi'], ['Madhya Pradesh', 'Bhopal', 'Bhopal'],
];
const JOBS = [
  ['government', 'Teacher (Govt.)', 'B.Ed'], ['government', 'Patwari', 'B.A.'], ['private', 'Software Engineer', 'B.Tech/B.E.'],
  ['government', 'RAS Officer', 'M.A.'], ['defence', 'Indian Army', '12th'], ['business', 'Business', 'B.Com'],
  ['government', 'Police Constable', 'B.A.'], ['private', 'Bank Officer', 'MBA'], ['government', 'Doctor', 'MBBS'],
  ['government', 'Railway', 'Diploma'], ['student', 'Preparing for govt. exams', 'M.Sc.'], ['private', 'Nurse', 'Nursing'],
];

function pick(arr, i) { return arr[i % arr.length]; }

async function seedDemo() {
  let n = 0;
  for (let i = 0; i < 24; i++) {
    const female = i % 2 === 1;
    const name = female ? DEMO_WOMEN[Math.floor(i / 2)] : DEMO_MEN[Math.floor(i / 2)];
    const phone = `90000${String(10000 + i).slice(-5)}`;
    if (await User.exists({ phone })) continue;
    const user = await User.create({ phone, hasProfile: true, isDemo: true });
    const [state, district, city] = pick(PLACES, i);
    const [employedIn, occupation, education] = pick(JOBS, i + (female ? 3 : 0));
    const age = female ? 21 + (i % 8) : 24 + (i % 9);
    const dob = new Date(new Date().getFullYear() - age, (i * 3) % 12, 5 + i);
    await Profile.create({
      user: user._id,
      isDemo: true,
      createdFor: pick(['self', female ? 'daughter' : 'son', female ? 'sister' : 'brother'], i),
      firstName: name,
      lastName: 'Meena',
      gender: female ? 'female' : 'male',
      dob,
      maritalStatus: 'never_married',
      height: female ? 152 + (i % 12) : 165 + (i % 15),
      complexion: pick(['fair', 'wheatish', 'very_fair'], i),
      diet: pick(['veg', 'veg', 'non_veg'], i),
      gotra: pick(GOTRAS, i),
      motherGotra: pick(GOTRAS, i + 5),
      dadiGotra: pick(GOTRAS, i + 7),
      naniGotra: pick(GOTRAS, i + 9),
      rashi: pick(['Mesh', 'Kanya', 'Tula', 'Makar', 'Singh', 'Meen'], i),
      manglik: pick(['no', 'no', 'dont_know', 'anshik'], i),
      education, employedIn, occupation,
      annualIncome: pick(['2-4 LPA', '4-6 LPA', '6-10 LPA', '10-15 LPA'], i),
      state, district, city,
      family: {
        fatherOccupation: pick(['Farmer', 'Retired Govt. Employee', 'Business', 'Teacher'], i),
        motherOccupation: 'Homemaker',
        brothers: i % 3, sisters: (i + 1) % 3, familyType: pick(['joint', 'nuclear'], i), familyStatus: pick(['middle_class', 'upper_middle_class'], i),
        nativePlace: `${city}, ${district}`,
      },
      about: female
        ? `मैं ${name}, ${city} से हूँ। परिवार संस्कारी और शिक्षित है। ${occupation} हूँ और एक समझदार, शिक्षित जीवनसाथी की तलाश है।`
        : `I am ${name} from ${city}. Working as ${occupation}. Looking for an educated, family-oriented life partner from Meena samaj.`,
      partnerPreference: { ageMin: female ? age : age - 7, ageMax: female ? age + 7 : age, maritalStatus: ['never_married'] },
      status: 'approved',
      isVerified: i % 3 === 0,
      isFeatured: i < 6,
      lastActive: new Date(Date.now() - i * 3600 * 1000),
    });
    n++;
  }
  console.log(`✔ demo profiles: ${n} created (phones 9000010000-9000010023, login with on-screen OTP)`);

  if (!(await SuccessStory.countDocuments({ isDemo: true }))) {
    await SuccessStory.insertMany([
      { isDemo: true, coupleNames: 'Rahul & Pooja', location: 'Jaipur', weddingDate: new Date('2026-02-14'), story: 'MSR के माध्यम से हमारे परिवार मिले। गोत्र मिलान से लेकर बातचीत तक सब कुछ बहुत आसान रहा।' },
      { isDemo: true, coupleNames: 'Vikram & Kavita', location: 'Dausa', weddingDate: new Date('2025-12-01'), story: 'We connected through Meena Shadi Rishtey and our families met within a week. Thank you MSR team!' },
      { isDemo: true, coupleNames: 'Deepak & Neha', location: 'Sawai Madhopur', weddingDate: new Date('2025-11-20'), story: 'सही जानकारी और verified प्रोफाइल की वजह से भरोसा बना। आज हम बहुत खुश हैं।' },
    ]);
    console.log('✔ demo success stories created');
  }
}

async function clearDemo() {
  const users = await User.find({ isDemo: true }).distinct('_id');
  const profiles = await Profile.find({ isDemo: true }).distinct('_id');
  await Promise.all([
    Interest.deleteMany({ $or: [{ from: { $in: users } }, { to: { $in: users } }] }),
    ProfileView.deleteMany({ $or: [{ viewer: { $in: users } }, { profile: { $in: profiles } }] }),
    Shortlist.deleteMany({ profile: { $in: profiles } }),
    Profile.deleteMany({ isDemo: true }),
    User.deleteMany({ isDemo: true }),
    SuccessStory.deleteMany({ isDemo: true }),
  ]);
  console.log(`✔ removed ${users.length} demo users and demo stories`);
}

(async () => {
  await connectDB();
  if (args.includes('--clear-demo')) await clearDemo();
  else {
    await seedBase();
    if (args.includes('--demo')) await seedDemo();
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
