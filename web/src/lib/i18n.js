/** Labels for enum values + UI strings (English / Hindi) */
export const LABELS = {
  createdFor: { self: ['Self', 'स्वयं'], son: ['Son', 'बेटा'], daughter: ['Daughter', 'बेटी'], brother: ['Brother', 'भाई'], sister: ['Sister', 'बहन'], relative: ['Relative', 'रिश्तेदार'], friend: ['Friend', 'मित्र'] },
  gender: { male: ['Male (Groom)', 'पुरुष (वर)'], female: ['Female (Bride)', 'महिला (वधू)'] },
  maritalStatus: { never_married: ['Never Married', 'अविवाहित'], divorced: ['Divorced', 'तलाकशुदा'], widowed: ['Widowed', 'विधुर/विधवा'], awaiting_divorce: ['Awaiting Divorce', 'तलाक प्रक्रिया में'] },
  employedIn: { government: ['Government Job', 'सरकारी नौकरी'], private: ['Private Job', 'प्राइवेट नौकरी'], business: ['Business', 'व्यवसाय'], self_employed: ['Self Employed', 'स्वरोजगार'], defence: ['Defence / Army', 'सेना / रक्षा'], not_working: ['Not Working', 'कार्यरत नहीं'], student: ['Student', 'विद्यार्थी'] },
  diet: { veg: ['Vegetarian', 'शाकाहारी'], non_veg: ['Non-Vegetarian', 'मांसाहारी'], eggetarian: ['Eggetarian', 'अंडाहारी'] },
  complexion: { very_fair: ['Very Fair', 'बहुत गोरा'], fair: ['Fair', 'गोरा'], wheatish: ['Wheatish', 'गेहुंआ'], dark: ['Dark', 'सांवला'] },
  familyType: { joint: ['Joint Family', 'संयुक्त परिवार'], nuclear: ['Nuclear Family', 'एकल परिवार'] },
  familyStatus: { middle_class: ['Middle Class', 'मध्यम वर्ग'], upper_middle_class: ['Upper Middle Class', 'उच्च मध्यम वर्ग'], rich: ['Rich', 'संपन्न'], affluent: ['Affluent', 'अति संपन्न'] },
  manglik: { no: ['No', 'नहीं'], yes: ['Yes', 'हाँ'], anshik: ['Anshik (Partial)', 'आंशिक'], dont_know: ["Don't Know", 'पता नहीं'] },
};

export const label = (group, value, lang = 'en') => {
  const row = LABELS[group]?.[value];
  if (!row) return value || '—';
  return lang === 'hi' ? row[1] : row[0];
};

export const T = {
  // nav
  home: ['Home', 'होम'], matches: ['Matches', 'रिश्ते खोजें'], interests: ['Interests', 'रुचि'], messages: ['Messages', 'संदेश'],
  dashboard: ['Dashboard', 'डैशबोर्ड'], plans: ['Membership', 'मेंबरशिप'], login: ['Login', 'लॉगिन'], register: ['Register Free', 'फ्री रजिस्टर करें'],
  logout: ['Logout', 'लॉगआउट'], myProfile: ['My Profile', 'मेरी प्रोफाइल'], editProfile: ['Edit Profile', 'प्रोफाइल बदलें'],
  shortlist: ['Shortlisted', 'शॉर्टलिस्ट'], visitors: ['Profile Visitors', 'प्रोफाइल देखने वाले'], notifications: ['Notifications', 'सूचनाएं'],
  settings: ['Settings', 'सेटिंग्स'], about: ['About Us', 'हमारे बारे में'], contact: ['Contact', 'संपर्क'],
  // hero
  heroTitle: ['Find your perfect life partner in Meena Samaj', 'मीणा समाज में अपना जीवनसाथी खोजें'],
  heroSub: ['Trusted matrimony for Meena families in India & abroad – verified profiles, gotra matching & secure chat.', 'देश-विदेश में बसे मीणा परिवारों के लिए भरोसेमंद रिश्ते – वेरिफाइड प्रोफाइल, गोत्र मिलान और सुरक्षित चैट।'],
  lookingFor: ['I am looking for', 'मुझे चाहिए'], bride: ['Bride', 'वधू'], groom: ['Groom', 'वर'], age: ['Age', 'उम्र'], to: ['to', 'से'],
  state: ['State', 'राज्य'], search: ['Search', 'खोजें'], letsBegin: ["Let's Begin", 'शुरू करें'],
  // misc
  sendInterest: ['Send Interest', 'रुचि भेजें'], interestSent: ['Interest Sent', 'रुचि भेजी गई'], accept: ['Accept', 'स्वीकार करें'], decline: ['Decline', 'अस्वीकार करें'],
  viewProfile: ['View Profile', 'प्रोफाइल देखें'], chat: ['Chat', 'चैट'], viewContact: ['View Contact', 'नंबर देखें'], connected: ['Connected', 'जुड़े हुए'],
  years: ['yrs', 'वर्ष'], save: ['Save', 'सेव करें'], next: ['Next', 'आगे'], back: ['Back', 'पीछे'], cancel: ['Cancel', 'रद्द करें'],
  noResults: ['No profiles found', 'कोई प्रोफाइल नहीं मिली'], loading: ['Loading...', 'लोड हो रहा है...'],
  upgrade: ['Upgrade to Premium', 'प्रीमियम लें'], gotraMatch: ['Gotra compatible', 'गोत्र मेल'], verified: ['Verified', 'वेरिफाइड'],
  online: ['Online', 'ऑनलाइन'], match: ['Match', 'मेल'], filters: ['Filters', 'फ़िल्टर'], reset: ['Reset', 'रीसेट'],
};

export const t = (key, lang = 'en') => {
  const row = T[key];
  if (!row) return key;
  return lang === 'hi' ? row[1] : row[0];
};
