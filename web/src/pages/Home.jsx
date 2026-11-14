import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, HeartHandshake, MessageCircle, Search, UserPlus, BadgeCheck, Smartphone, Lock, Sparkles,
  ChevronDown, Star, Quote, Crown, GitMerge, Download,
} from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { SectionHeading, Select } from '../components/Ui';
import BannerSlot from '../components/BannerSlot';
import { useSiteSettings } from '../components/Footer';
import { inr } from '../lib/format';

const STATES = ['Rajasthan', 'Madhya Pradesh', 'Delhi', 'Uttar Pradesh', 'Haryana', 'Gujarat', 'Maharashtra'];

function HeroSearch() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState({ gender: 'female', ageMin: 21, ageMax: 30, state: '' });
  const ages = Array.from({ length: 43 }, (_, i) => 18 + i);
  const go = (e) => {
    e.preventDefault();
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    navigate(user ? `/matches?${q}` : '/login', { state: { from: `/matches?${q}` } });
  };
  return (
    <form onSubmit={go} className="card grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] sm:items-end sm:p-5">
      <div>
        <span className="label">{t('lookingFor')}</span>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-maroon-50 p-1">
          {['female', 'male'].map((g) => (
            <button type="button" key={g} onClick={() => setF({ ...f, gender: g })}
              className={`rounded-lg py-2 text-sm font-semibold transition ${f.gender === g ? 'bg-maroon-700 text-white shadow' : 'text-maroon-700'}`}>
              {g === 'female' ? t('bride') : t('groom')}
            </button>
          ))}
        </div>
      </div>
      <div><span className="label">{t('age')}</span><Select value={f.ageMin} onChange={(v) => setF({ ...f, ageMin: v })} options={ages} placeholder="Min" /></div>
      <div><span className="label">{t('to')}</span><Select value={f.ageMax} onChange={(v) => setF({ ...f, ageMax: v })} options={ages} placeholder="Max" /></div>
      <div><span className="label">{t('state')}</span><Select value={f.state} onChange={(v) => setF({ ...f, state: v })} options={STATES} placeholder="Any" /></div>
      <button className="btn-primary h-[42px] px-7"><Search className="h-4 w-4" />{t('letsBegin')}</button>
    </form>
  );
}

function Counter({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-bold text-gold-300 sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/75 sm:text-sm">{label}</div>
    </div>
  );
}

export default function Home() {
  const { t, tt, lang } = useLang();
  const { user } = useAuth();
  const settings = useSiteSettings();
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [stories, setStories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [faq, setFaq] = useState(0);

  useEffect(() => {
    api.get('/public/stats').then((r) => setStats(r.stats)).catch(() => {});
    api.get('/profiles/featured?limit=8').then((r) => setFeatured(r.items)).catch(() => {});
    api.get('/public/stories?limit=6').then((r) => setStories(r.items)).catch(() => {});
    api.get('/payments/plans').then((r) => setPlans(r.items)).catch(() => {});
  }, []);

  const features = [
    { icon: GitMerge, title: tt('Gotra Matching', 'गोत्र मिलान'), text: tt('Automatically hides profiles of your own, mother\'s, dadi\'s & nani\'s gotra.', 'अपना, माँ, दादी और नानी का गोत्र अपने आप अलग हो जाता है।') },
    { icon: BadgeCheck, title: tt('Verified Profiles', 'वेरिफाइड प्रोफाइल'), text: tt('Every profile is screened by our team before going live.', 'हर प्रोफाइल को लाइव होने से पहले हमारी टीम जांचती है।') },
    { icon: Lock, title: tt('Privacy First', 'पूर्ण गोपनीयता'), text: tt('Your number is shared only when you accept. Photo privacy controls.', 'आपका नंबर तभी दिखेगा जब आप रुचि स्वीकार करेंगे।') },
    { icon: MessageCircle, title: tt('Secure Chat', 'सुरक्षित चैट'), text: tt('Real-time chat with connected matches – no number needed.', 'जुड़े हुए रिश्तों से तुरंत चैट – नंबर देने की जरूरत नहीं।') },
    { icon: Users, title: tt('Only Meena Samaj', 'सिर्फ मीणा समाज'), text: tt('A dedicated community platform for Meena families in India & abroad.', 'देश-विदेश के मीणा परिवारों के लिए समर्पित मंच।') },
    { icon: Smartphone, title: tt('Mobile App', 'मोबाइल ऐप'), text: tt('Find matches on the go with our Android app.', 'हमारे एंड्रॉइड ऐप से कहीं भी रिश्ते देखें।') },
  ];

  const steps = [
    { icon: UserPlus, title: tt('Register Free', 'फ्री रजिस्टर करें'), text: tt('Sign up with your mobile number & OTP in 30 seconds.', 'मोबाइल नंबर और OTP से 30 सेकंड में रजिस्टर करें।') },
    { icon: Sparkles, title: tt('Create Biodata', 'बायोडाटा बनाएं'), text: tt('Add details, gotra, family & photos.', 'अपनी जानकारी, गोत्र, परिवार और फोटो जोड़ें।') },
    { icon: Search, title: tt('Find Matches', 'रिश्ते खोजें'), text: tt('Search with filters & get daily recommendations.', 'फ़िल्टर से खोजें और रोज़ नए सुझाव पाएं।') },
    { icon: HeartHandshake, title: tt('Connect & Meet', 'जुड़ें और मिलें'), text: tt('Send interest, chat and take it forward with family.', 'रुचि भेजें, चैट करें और परिवार के साथ बात आगे बढ़ाएं।') },
  ];

  const faqs = [
    [tt('Is registration free?', 'क्या रजिस्ट्रेशन फ्री है?'), tt('Yes. Registration, creating your biodata, searching and sending interests are free. Premium plans unlock contact numbers and unlimited chat.', 'हाँ। रजिस्ट्रेशन, बायोडाटा बनाना, खोजना और रुचि भेजना बिल्कुल मुफ्त है। प्रीमियम प्लान से मोबाइल नंबर और अनलिमिटेड चैट मिलती है।')],
    [tt('How does gotra matching work?', 'गोत्र मिलान कैसे काम करता है?'), tt('You enter your gotra and your mother\'s, dadi\'s and nani\'s gotra. We automatically hide profiles from these gotras in your search.', 'आप अपना, माँ, दादी और नानी का गोत्र भरते हैं। खोज में इन गोत्रों की प्रोफाइल अपने आप हट जाती हैं।')],
    [tt('Who can see my phone number?', 'मेरा मोबाइल नंबर कौन देख सकता है?'), tt('Only members whose interest you have accepted, or premium members if you allow it in privacy settings.', 'सिर्फ वे सदस्य जिनकी रुचि आपने स्वीकार की है, या प्रीमियम सदस्य (अगर आपने सेटिंग में अनुमति दी है)।')],
    [tt('Can parents create a profile?', 'क्या माता-पिता प्रोफाइल बना सकते हैं?'), tt('Yes, parents, brothers, sisters or relatives can create a profile on behalf of the bride or groom.', 'हाँ, माता-पिता, भाई-बहन या रिश्तेदार वर/वधू की ओर से प्रोफाइल बना सकते हैं।')],
  ];

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-royal text-white">
        <div className="pattern-bg absolute inset-0 opacity-50" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-saffron-500/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="container-x relative grid items-center gap-10 pb-28 pt-12 lg:grid-cols-2 lg:pb-36 lg:pt-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-white/10 px-4 py-1.5 text-xs font-semibold text-gold-200">
              <Sparkles className="h-3.5 w-3.5" /> {tt("Meena Samaj's trusted matrimony", 'मीणा समाज का भरोसेमंद रिश्ता मंच')}
            </span>
            <h1 className={`mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl ${lang === 'hi' ? 'font-hindi' : ''}`}>
              {lang === 'hi' ? <>मीणा समाज में अपना <span className="text-gold-300">जीवनसाथी</span> खोजें</> : <>Find your perfect <span className="text-gold-300">life partner</span> in Meena Samaj</>}
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">{t('heroSub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user?.role === 'user'
                ? <Link to="/dashboard" className="btn-gold px-7 py-3 text-base"><Sparkles className="h-5 w-5" />{tt('Go to my dashboard', 'मेरा डैशबोर्ड')}</Link>
                : <Link to="/login" className="btn-gold px-7 py-3 text-base"><UserPlus className="h-5 w-5" />{t('register')}</Link>}
              <Link to="/about" className="btn border border-white/40 px-7 py-3 text-base text-white hover:bg-white/10">{tt('How it works', 'कैसे काम करता है')}</Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-white/80">
              <div className="flex -space-x-3">
                {['female', 'male', 'female', 'male'].map((g, i) => <img key={i} src={avatarFor(g)} alt="" className="h-9 w-9 rounded-full border-2 border-maroon-700 object-cover" />)}
              </div>
              <span>{tt('Join Meena families finding matches every day', 'रोज़ नए मीणा परिवार जुड़ रहे हैं')}</span>
            </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute inset-0 rounded-full bg-gold-300/20 blur-2xl" />
            <img src="/brand/hero-art.svg" alt="" className="relative w-full animate-float drop-shadow-2xl" />
            <div className="card absolute -left-6 top-16 flex items-center gap-3 px-4 py-3 text-ink animate-fade-up" style={{ animationDelay: '.3s' }}>
              <div className="rounded-full bg-emerald-100 p-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
              <div><div className="text-sm font-semibold">{tt('100% Screened', '100% जांची गई')}</div><div className="text-xs text-gray-500">{tt('Profiles', 'प्रोफाइल')}</div></div>
            </div>
            <div className="card absolute -right-4 bottom-24 flex items-center gap-3 px-4 py-3 text-ink animate-fade-up" style={{ animationDelay: '.5s' }}>
              <div className="rounded-full bg-gold-100 p-2"><GitMerge className="h-5 w-5 text-gold-700" /></div>
              <div><div className="text-sm font-semibold">{tt('Gotra Match', 'गोत्र मिलान')}</div><div className="text-xs text-gray-500">{tt('Automatic', 'स्वचालित')}</div></div>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-cream" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden><path fill="currentColor" d="M0,64 C240,10 480,96 720,64 C960,32 1200,80 1440,40 L1440,90 L0,90 Z" /></svg>
      </section>

      {/* ---------- SEARCH ---------- */}
      <section className="container-x relative z-10 -mt-20 lg:-mt-24"><HeroSearch /></section>

      {/* ---------- STATS ---------- */}
      <section className="container-x mt-12">
        <div className="relative overflow-hidden rounded-3xl bg-royal px-6 py-8 shadow-card">
          <div className="pattern-bg absolute inset-0 opacity-30" />
          <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Counter value={stats ? `${stats.profiles}+` : '—'} label={tt('Verified Profiles', 'वेरिफाइड प्रोफाइल')} />
            <Counter value={stats ? `${stats.brides}+` : '—'} label={tt('Brides', 'वधू')} />
            <Counter value={stats ? `${stats.grooms}+` : '—'} label={tt('Grooms', 'वर')} />
            <Counter value="100%" label={tt('Meena Samaj', 'मीणा समाज')} />
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="container-x py-20">
        <SectionHeading title={tt('How it works', 'कैसे काम करता है')} sub={tt('Four simple steps to find your life partner', 'जीवनसाथी खोजने के चार आसान कदम')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="card group relative p-6 text-center transition hover:-translate-y-1">
              <div className="absolute right-4 top-3 font-display text-5xl font-bold text-maroon-50">{i + 1}</div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-shine shadow-glow transition group-hover:rotate-6"><s.icon className="h-7 w-7 text-maroon-900" /></div>
              <h3 className="mt-5 text-lg font-semibold text-maroon-800">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- ADS / BANNERS ---------- */}
      <section className="container-x"><BannerSlot placement="home_mid" /></section>

      {/* ---------- FEATURED ---------- */}
      {featured.length > 0 && (
        <section className="container-x py-20">
          <SectionHeading title={tt('Featured Profiles', 'चुनिंदा प्रोफाइल')} sub={tt('Login to see full details, photos and send interest', 'पूरी जानकारी देखने और रुचि भेजने के लिए लॉगिन करें')} />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <Link to="/login" key={p.id} className="card group overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden bg-maroon-50">
                  <img src={p.photo ? fileUrl(p.photo) : avatarFor(p.gender)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
                    <div className="flex items-center gap-1 font-semibold">{p.firstName} {p.isVerified && <BadgeCheck className="h-4 w-4 fill-sky-500 text-white" />}</div>
                    <div className="text-xs text-white/80">{p.age} {t('years')} · {p.district || p.state}</div>
                  </div>
                </div>
                <div className="p-3 text-xs text-gray-600">{p.education}{p.occupation ? ` · ${p.occupation}` : ''}</div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center"><Link to="/login" className="btn-primary px-8">{tt('View all profiles', 'सभी प्रोफाइल देखें')}</Link></div>
        </section>
      )}

      {/* ---------- WHY MSR ---------- */}
      <section className="relative overflow-hidden bg-white py-20">
        <div className="pattern-bg absolute inset-0 opacity-60" />
        <div className="container-x relative">
          <SectionHeading title={tt('Why Meena Shadi Rishtey?', 'मीणा शादी रिश्ते ही क्यों?')} sub={tt('Built specially for the traditions and trust of Meena samaj', 'मीणा समाज की परंपराओं और भरोसे के लिए खास तौर पर बनाया गया')} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="card flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-maroon-700 text-gold-300"><f.icon className="h-6 w-6" /></div>
                <div><h3 className="font-semibold text-maroon-800">{f.title}</h3><p className="mt-1 text-sm text-gray-600">{f.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- STORIES ---------- */}
      {stories.length > 0 && (
        <section className="container-x py-20">
          <SectionHeading title={tt('Success Stories', 'सफल रिश्ते')} sub={tt('Happy couples who found each other on MSR', 'MSR पर मिले खुशहाल जोड़े')} />
          <div className="grid gap-6 md:grid-cols-3">
            {stories.slice(0, 3).map((s) => (
              <div key={s._id} className="card relative overflow-hidden p-6">
                <Quote className="absolute right-4 top-4 h-10 w-10 text-gold-200" />
                <div className="flex items-center gap-3">
                  {s.image ? <img src={fileUrl(s.image)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-gold-300" />
                    : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-gold-300"><HeartHandshake className="h-6 w-6" /></div>}
                  <div><div className="font-display text-lg font-bold text-maroon-800">{s.coupleNames}</div><div className="text-xs text-gray-500">{s.location}</div></div>
                </div>
                <div className="mt-3 flex text-gold-500">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.story}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- PLANS ---------- */}
      {plans.length > 0 && (
        <section className="bg-gradient-to-b from-gold-50 to-cream py-20">
          <div className="container-x">
            <SectionHeading title={tt('Membership Plans', 'मेंबरशिप प्लान')} sub={tt('Register free. Upgrade anytime to connect faster.', 'रजिस्ट्रेशन फ्री है। जल्दी जुड़ने के लिए कभी भी अपग्रेड करें।')} />
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {plans.map((p) => (
                <div key={p._id} className={`card relative flex flex-col p-7 ${p.isPopular ? 'ring-2 ring-gold-500 md:-translate-y-3' : ''}`}>
                  {p.isPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-shine px-4 py-1 text-xs font-bold text-maroon-900 shadow">{tt('Most Popular', 'सबसे लोकप्रिय')}</span>}
                  <Crown className="h-8 w-8" style={{ color: p.color }} />
                  <h3 className="mt-3 font-display text-2xl font-bold text-maroon-800">{lang === 'hi' && p.nameHi ? p.nameHi : p.name}</h3>
                  <div className="mt-2 flex items-end gap-2"><span className="text-3xl font-bold text-ink">{inr(p.price)}</span>{p.mrp > p.price && <span className="pb-1 text-sm text-gray-400 line-through">{inr(p.mrp)}</span>}</div>
                  <div className="text-sm text-gray-500">{p.durationDays} {tt('days', 'दिन')}</div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-gray-700">
                    {((lang === 'hi' && p.featuresHi?.length) ? p.featuresHi : p.features).map((f) => <li key={f} className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}
                  </ul>
                  <Link to="/plans" className={`${p.isPopular ? 'btn-gold' : 'btn-outline'} mt-6 w-full`}>{tt('Choose plan', 'प्लान चुनें')}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- APP CTA ---------- */}
      <section className="container-x py-16">
        <div className="relative overflow-hidden rounded-3xl bg-royal p-8 text-white shadow-card sm:p-12">
          <div className="pattern-bg absolute inset-0 opacity-30" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{tt('Get the MSR mobile app', 'MSR मोबाइल ऐप डाउनलोड करें')}</h2>
              <p className="mt-3 text-white/80">{tt('Instant notifications for interests & messages. Find matches anywhere, anytime.', 'रुचि और संदेशों की तुरंत सूचना। कहीं भी, कभी भी रिश्ते देखें।')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={settings.playStoreUrl || '#'} className="btn-gold px-6 py-3"><Download className="h-5 w-5" /> {tt('Download for Android', 'एंड्रॉइड के लिए डाउनलोड करें')}</a>
              </div>
            </div>
            <div className="mx-auto">
              <div className="relative h-72 w-40 rounded-[2rem] border-4 border-gold-300 bg-cream p-2 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] bg-royal">
                  <img src="/brand/logo.svg" alt="" className="h-20 w-20 animate-float rounded-full" />
                  <div className="mt-3 text-center font-hindi text-xs text-gold-200">मीणा शादी रिश्ते</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="container-x pb-8">
        <SectionHeading title={tt('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')} />
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map(([q, a], i) => (
            <div key={i} className="card overflow-hidden">
              <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-maroon-800" onClick={() => setFaq(faq === i ? -1 : i)}>
                {q}<ChevronDown className={`h-5 w-5 shrink-0 transition ${faq === i ? 'rotate-180' : ''}`} />
              </button>
              {faq === i && <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600">{a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
