import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Send, HeartHandshake, Heart, Eye, Crown, Pencil, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import BannerSlot from '../components/BannerSlot';
import { PageLoader, Empty } from '../components/Ui';
import { formatDate } from '../lib/format';

export default function Dashboard() {
  const { tt } = useLang();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    api.get('/profiles/dashboard').then(setD);
    api.get('/profiles/recommendations?limit=8').then((r) => setRecs(r.items)).catch(() => setRecs([]));
  }, []);

  if (!d) return <PageLoader />;
  const p = d.profile;
  const photo = p.primaryPhoto ? fileUrl(p.primaryPhoto) : avatarFor(p.gender);
  const stats = [
    { to: '/interests?tab=received', icon: Inbox, label: tt('Interests received', 'प्राप्त रुचि'), value: d.stats.received, color: 'bg-rose-50 text-rose-600' },
    { to: '/interests?tab=sent', icon: Send, label: tt('Interests sent', 'भेजी गई रुचि'), value: d.stats.sent, color: 'bg-sky-50 text-sky-600' },
    { to: '/interests?tab=accepted', icon: HeartHandshake, label: tt('Connections', 'जुड़े हुए'), value: d.stats.accepted, color: 'bg-emerald-50 text-emerald-600' },
    { to: '/shortlist', icon: Heart, label: tt('Shortlisted', 'शॉर्टलिस्ट'), value: d.stats.shortlisted, color: 'bg-pink-50 text-pink-600' },
    { to: '/visitors', icon: Eye, label: tt('Profile views', 'प्रोफाइल व्यू'), value: d.stats.visitors, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="container-x py-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="card overflow-hidden">
            <div className="h-20 bg-royal" />
            <div className="-mt-12 px-5 pb-5 text-center">
              <img src={photo} alt="" className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
              <h2 className="mt-2 font-display text-xl font-bold text-maroon-800">{p.firstName} {p.lastName}</h2>
              <div className="text-sm text-gray-500">{p.profileId}</div>
              {user.isPremium
                ? <div className="chip-gold mt-2"><Crown className="h-3 w-3" /> {user.premium.planName} · {tt('till', 'तक')} {formatDate(user.premium.expiresAt)}</div>
                : <div className="chip mt-2">{tt('Free member', 'फ्री सदस्य')}</div>}
              <div className="mt-4 text-left">
                <div className="flex justify-between text-xs font-semibold text-gray-600"><span>{tt('Profile completeness', 'प्रोफाइल पूर्णता')}</span><span>{p.completeness}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-maroon-100"><div className="h-full rounded-full bg-gold-shine" style={{ width: `${p.completeness}%` }} /></div>
              </div>
              <Link to="/profile/edit" className="btn-outline btn-sm mt-4 w-full"><Pencil className="h-3.5 w-3.5" />{tt('Edit profile', 'प्रोफाइल बदलें')}</Link>
            </div>
          </div>
          {!user.isPremium && (
            <div className="relative overflow-hidden rounded-2xl bg-royal p-5 text-white shadow-card">
              <div className="pattern-bg absolute inset-0 opacity-40" />
              <div className="relative">
                <Crown className="h-8 w-8 text-gold-300" />
                <h3 className="mt-2 font-display text-xl font-bold">{tt('Go Premium', 'प्रीमियम बनें')}</h3>
                <p className="mt-1 text-sm text-white/80">{tt('View contact numbers & chat with anyone.', 'मोबाइल नंबर देखें और किसी से भी चैट करें।')}</p>
                <Link to="/plans" className="btn-gold btn-sm mt-4">{tt('See plans', 'प्लान देखें')}</Link>
              </div>
            </div>
          )}
          {user.isPremium && (
            <div className="card p-5 text-sm">
              <div className="font-semibold text-maroon-800">{tt('Contact views left', 'बाकी नंबर व्यू')}</div>
              <div className="mt-1 font-display text-3xl font-bold text-gold-600">{user.premium.contactsLeft}</div>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="min-w-0 space-y-6">
          {p.status === 'pending' && (
            <div className="flex gap-3 rounded-2xl border border-gold-300 bg-gold-50 p-4 text-sm text-gold-900"><Clock className="h-5 w-5 shrink-0" />
              {tt('Your profile is under review by our team. Meanwhile, complete your profile & add photos.', 'आपकी प्रोफाइल हमारी टीम द्वारा जांची जा रही है। तब तक प्रोफाइल पूरी करें और फोटो जोड़ें।')}</div>
          )}
          {p.status === 'rejected' && (
            <Link to="/profile/edit" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="h-5 w-5 shrink-0" />
              <span><b>{tt('Profile needs changes:', 'प्रोफाइल में बदलाव ज़रूरी:')}</b> {p.rejectionReason}</span></Link>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-maroon-800 sm:text-3xl">{tt('Namaste', 'नमस्ते')}, {p.firstName} 🙏</h1>
            <p className="text-sm text-gray-500">{tt("Here's what's happening with your profile", 'आपकी प्रोफाइल पर क्या हो रहा है')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {stats.map((s) => (
              <Link key={s.to} to={s.to} className="card flex flex-col gap-2 p-4 transition hover:-translate-y-0.5">
                <div className={`w-fit rounded-xl p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div className="font-display text-2xl font-bold text-ink">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </Link>
            ))}
          </div>
          <BannerSlot placement="dashboard" />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-maroon-800"><Sparkles className="h-5 w-5 text-gold-500" />{tt('Recommended for you', 'आपके लिए सुझाव')}</h2>
              <Link to="/matches" className="flex items-center text-sm font-semibold text-maroon-700">{tt('See all', 'सभी देखें')}<ChevronRight className="h-4 w-4" /></Link>
            </div>
            {recs === null ? <PageLoader /> : recs.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{recs.map((r) => <ProfileCard key={r.id} p={r} />)}</div>
            ) : <Empty icon={Sparkles} title={tt('No recommendations yet', 'अभी कोई सुझाव नहीं')} text={tt('Update your partner preferences to get better matches.', 'बेहतर सुझाव के लिए जीवनसाथी की पसंद अपडेट करें।')} />}
          </div>
        </div>
      </div>
    </div>
  );
}
