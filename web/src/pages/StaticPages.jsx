import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartHandshake, Target, Eye, ShieldCheck, Phone, Mail, MapPin, MessageCircle, Star, Quote } from 'lucide-react';
import api, { fileUrl } from '../lib/api';
import { useLang } from '../context/LangContext';
import { SectionHeading, Empty, Spinner } from '../components/Ui';
import { useSiteSettings } from '../components/Footer';
import { formatDate } from '../lib/format';

function PageHero({ title, sub }) {
  return (
    <section className="relative overflow-hidden bg-royal py-14 text-center text-white">
      <div className="pattern-bg absolute inset-0 opacity-40" />
      <div className="container-x relative"><h1 className="font-display text-4xl font-bold">{title}</h1>{sub && <p className="mx-auto mt-3 max-w-2xl text-white/80">{sub}</p>}</div>
    </section>
  );
}

export function About() {
  const { tt } = useLang();
  return (
    <div>
      <PageHero title={tt('About Meena Shadi Rishtey', 'मीणा शादी रिश्ते के बारे में')} sub={tt('A trusted matrimony platform dedicated to the Meena samaj', 'मीणा समाज को समर्पित भरोसेमंद वैवाहिक मंच')} />
      <div className="container-x grid gap-6 py-14 md:grid-cols-3">
        {[
          [Target, tt('Our Mission', 'हमारा उद्देश्य'), tt('To help Meena families in India and abroad find suitable matches easily, with respect for our traditions.', 'मीणा समाज के लोगों को देश-विदेश में शादी के लिए रिश्ते आसानी से उपलब्ध कराना – अपनी परंपराओं का सम्मान करते हुए।')],
          [Eye, tt('Our Vision', 'हमारी सोच'), tt('Every Meena family should have access to genuine, verified matches without middlemen.', 'हर मीणा परिवार को बिना बिचौलियों के सच्चे और वेरिफाइड रिश्ते मिलें।')],
          [ShieldCheck, tt('Our Promise', 'हमारा वादा'), tt('Manual screening of every profile, privacy of your contact details and respectful communication.', 'हर प्रोफाइल की जांच, आपके नंबर की गोपनीयता और सम्मानजनक बातचीत।')],
        ].map(([I, t, d]) => (
          <div key={t} className="card p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-shine"><I className="h-7 w-7 text-maroon-900" /></div><h3 className="mt-4 font-display text-xl font-bold text-maroon-800">{t}</h3><p className="mt-2 text-sm text-gray-600">{d}</p></div>
        ))}
      </div>
      <div className="container-x pb-10 text-center"><Link to="/login" className="btn-gold px-8 py-3">{tt('Register Free', 'फ्री रजिस्टर करें')}</Link></div>
    </div>
  );
}

export function Contact() {
  const { tt } = useLang();
  const s = useSiteSettings();
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const r = await api.post('/public/enquiry', f); toast.success(r.message); setF({ name: '', phone: '', email: '', message: '' }); } catch (er) { toast.error(er.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <PageHero title={tt('Contact Us', 'संपर्क करें')} sub={tt('Questions, support or advertising – we are happy to help.', 'प्रश्न, सहायता या विज्ञापन – हम मदद के लिए तैयार हैं।')} />
      <div className="container-x grid gap-8 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {s.contactPhone && <a href={`tel:${s.contactPhone}`} className="card flex items-center gap-4 p-5"><Phone className="h-6 w-6 text-gold-600" /><div><div className="text-xs text-gray-500">{tt('Call us', 'कॉल करें')}</div><div className="font-semibold">{s.contactPhone}</div></div></a>}
          {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5"><MessageCircle className="h-6 w-6 text-emerald-600" /><div><div className="text-xs text-gray-500">WhatsApp</div><div className="font-semibold">+{s.whatsapp}</div></div></a>}
          {s.email && <a href={`mailto:${s.email}`} className="card flex items-center gap-4 p-5"><Mail className="h-6 w-6 text-gold-600" /><div><div className="text-xs text-gray-500">Email</div><div className="font-semibold">{s.email}</div></div></a>}
          {s.address && <div className="card flex items-center gap-4 p-5"><MapPin className="h-6 w-6 text-gold-600" /><div><div className="text-xs text-gray-500">{tt('Address', 'पता')}</div><div className="font-semibold">{s.address}</div></div></div>}
        </div>
        <form onSubmit={submit} className="card grid gap-4 p-7 sm:grid-cols-2">
          <input className="input" required placeholder={tt('Your name *', 'आपका नाम *')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" required placeholder={tt('Mobile *', 'मोबाइल *')} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className="input sm:col-span-2" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <textarea className="input sm:col-span-2" rows={5} required placeholder={tt('Message *', 'संदेश *')} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? <Spinner className="h-4 w-4 !text-white" /> : tt('Send message', 'संदेश भेजें')}</button>
        </form>
      </div>
    </div>
  );
}

export function Stories() {
  const { tt } = useLang();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get('/public/stories?limit=50').then((r) => setItems(r.items)); }, []);
  return (
    <div>
      <PageHero title={tt('Success Stories', 'सफल रिश्ते')} sub={tt('Couples who found their life partner on MSR', 'MSR पर मिले जीवनसाथी')} />
      <div className="container-x py-14">
        {!items ? <div className="flex justify-center"><Spinner className="h-8 w-8" /></div> : !items.length ? <Empty icon={HeartHandshake} title={tt('Stories coming soon', 'जल्द ही')} /> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <div key={s._id} className="card overflow-hidden">
                {s.image ? <img src={fileUrl(s.image)} alt="" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-royal"><HeartHandshake className="h-14 w-14 text-gold-300" /></div>}
                <div className="relative p-6"><Quote className="absolute right-4 top-4 h-8 w-8 text-gold-200" />
                  <h3 className="font-display text-xl font-bold text-maroon-800">{s.coupleNames}</h3>
                  <div className="text-xs text-gray-500">{s.location}{s.weddingDate ? ` · ${formatDate(s.weddingDate)}` : ''}</div>
                  <div className="mt-2 flex text-gold-500">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-3 text-sm text-gray-600">{s.story}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Doc({ title, sections }) {
  return (
    <div>
      <PageHero title={title} />
      <div className="container-x max-w-3xl py-12"><div className="card space-y-6 p-8 text-sm leading-relaxed text-gray-700">
        {sections.map(([h, p]) => <div key={h}><h2 className="mb-2 font-display text-lg font-bold text-maroon-800">{h}</h2><p className="whitespace-pre-line">{p}</p></div>)}
      </div></div>
    </div>
  );
}

export function Privacy() {
  const { tt } = useLang();
  return <Doc title={tt('Privacy Policy', 'गोपनीयता नीति')} sections={[
    [tt('Information we collect', 'हम कौन सी जानकारी लेते हैं'), tt('Mobile number, biodata details you enter, photos you upload and basic usage data.', 'मोबाइल नंबर, आपके द्वारा भरी गई बायोडाटा जानकारी, अपलोड की गई फोटो और सामान्य उपयोग डेटा।')],
    [tt('How we use it', 'हम इसका उपयोग कैसे करते हैं'), tt('Only to show your profile to other registered members, suggest matches and contact you about your account.', 'सिर्फ आपकी प्रोफाइल दूसरे सदस्यों को दिखाने, रिश्ते सुझाने और आपके अकाउंट के बारे में संपर्क करने के लिए।')],
    [tt('Your control', 'आपका नियंत्रण'), tt('Your mobile number is shown only as per your privacy settings. You can hide photos, block members, and delete your account anytime.', 'आपका नंबर आपकी गोपनीयता सेटिंग के अनुसार ही दिखता है। आप फोटो छुपा सकते हैं, सदस्यों को ब्लॉक कर सकते हैं और कभी भी अकाउंट हटा सकते हैं।')],
    [tt('We never sell data', 'हम डेटा नहीं बेचते'), tt('We do not sell or share your personal data with third parties for marketing.', 'हम आपकी निजी जानकारी किसी तीसरे पक्ष को मार्केटिंग के लिए नहीं बेचते।')],
  ]} />;
}

export function Terms() {
  const { tt } = useLang();
  return <Doc title={tt('Terms & Conditions', 'नियम व शर्तें')} sections={[
    [tt('Eligibility', 'पात्रता'), tt('Members must be 18+ (women) / 21+ (men) as per Indian law and intend to marry.', 'सदस्य भारतीय कानून के अनुसार 18+ (महिला) / 21+ (पुरुष) होने चाहिए और विवाह का इरादा रखते हों।')],
    [tt('Genuine information', 'सही जानकारी'), tt('You must provide true information. Fake or misleading profiles will be removed without refund.', 'आपको सही जानकारी देनी होगी। फर्जी या भ्रामक प्रोफाइल बिना रिफंड के हटा दी जाएगी।')],
    [tt('Conduct', 'आचरण'), tt('Respectful communication is mandatory. Harassment, abuse or demand for money leads to a permanent ban.', 'सम्मानजनक बातचीत अनिवार्य है। उत्पीड़न, अभद्रता या पैसे की मांग पर स्थायी प्रतिबंध।')],
    [tt('Payments', 'भुगतान'), tt('Membership fees are non-refundable once the plan is activated.', 'प्लान सक्रिय होने के बाद मेंबरशिप शुल्क वापस नहीं होगा।')],
    [tt('Responsibility', 'ज़िम्मेदारी'), tt('MSR screens profiles but families must independently verify details before marriage.', 'MSR प्रोफाइल की जांच करता है लेकिन विवाह से पहले परिवार स्वयं भी जानकारी की पुष्टि करें।')],
  ]} />;
}

export function Safety() {
  const { tt } = useLang();
  return <Doc title={tt('Safety Tips', 'सुरक्षा सुझाव')} sections={[
    [tt('Never send money', 'कभी पैसे न भेजें'), tt('Do not transfer money to anyone you meet online, for any reason.', 'ऑनलाइन मिले किसी भी व्यक्ति को किसी भी कारण से पैसे न भेजें।')],
    [tt('Involve family', 'परिवार को शामिल करें'), tt('Keep your family informed and meet in public places with family members.', 'परिवार को जानकारी दें और परिवार के साथ सार्वजनिक स्थान पर मिलें।')],
    [tt('Verify details', 'जानकारी जांचें'), tt('Cross-check job, education and family details through your relatives and community.', 'नौकरी, शिक्षा और परिवार की जानकारी रिश्तेदारों और समाज के माध्यम से जांचें।')],
    [tt('Report suspicious profiles', 'संदिग्ध प्रोफाइल रिपोर्ट करें'), tt('Use the Report button on any profile. Our team acts within 24 hours.', 'किसी भी प्रोफाइल पर रिपोर्ट बटन का उपयोग करें। हमारी टीम 24 घंटे में कार्रवाई करती है।')],
  ]} />;
}

export function NotFound() {
  const { tt } = useLang();
  return (
    <div className="container-x py-24 text-center">
      <img src="/brand/logo.svg" alt="" className="mx-auto h-24 w-24 rounded-full" />
      <h1 className="mt-6 font-display text-5xl font-bold text-maroon-800">404</h1>
      <p className="mt-2 text-gray-600">{tt('Page not found', 'पेज नहीं मिला')}</p>
      <Link to="/" className="btn-primary mt-6">{tt('Go home', 'होम पर जाएं')}</Link>
    </div>
  );
}
