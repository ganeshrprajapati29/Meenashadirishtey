import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, GraduationCap, Briefcase, BadgeCheck, Lock, Star, Send, Check, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl, avatarFor } from '../lib/api';
import { cmToFeet } from '../lib/format';
import { useLang } from '../context/LangContext';

export default function ProfileCard({ p, onChange }) {
  const { t, tt, label } = useLang();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [shortlisted, setShortlisted] = useState(!!p.isShortlisted);
  const [interest, setInterest] = useState(p.interest);

  const sendInterest = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post('/interests', { profileId: p.id });
      setInterest({ status: r.autoAccepted ? 'accepted' : 'pending', direction: 'sent', id: r.interest._id });
      toast.success(r.autoAccepted ? tt('Connected! You can chat now', 'जुड़ गए! अब चैट करें') : tt('Interest sent', 'रुचि भेज दी गई'));
      onChange?.();
    } catch (err) {
      toast.error(err.message);
      if (err.status === 402 || /premium/i.test(err.message)) navigate('/plans');
    } finally { setBusy(false); }
  };

  const toggleShortlist = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post(`/profiles/${p.id}/shortlist`);
      setShortlisted(r.shortlisted);
      toast.success(r.shortlisted ? tt('Added to shortlist', 'शॉर्टलिस्ट में जोड़ा') : tt('Removed from shortlist', 'शॉर्टलिस्ट से हटाया'));
    } catch (err) { toast.error(err.message); }
  };

  const photo = p.photo ? fileUrl(p.photo) : avatarFor(p.gender);

  return (
    <Link to={`/profile/${p.profileId}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-maroon-50">
        <img src={photo} alt={p.firstName} loading="lazy"
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${p.photoLocked ? 'blur-md' : ''}`} />
        {p.photoLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20 text-white">
            <Lock className="h-6 w-6" /><span className="text-xs font-semibold">{tt('Photo protected', 'फोटो सुरक्षित')}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-10 text-white">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-semibold">{p.firstName} {p.lastName}</h3>
            {p.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 fill-sky-500 text-white" />}
          </div>
          <div className="text-xs text-white/85">{p.profileId} · {p.age} {t('years')}{p.height ? ` · ${cmToFeet(p.height)}` : ''}</div>
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.isPremium && <span className="chip-gold !bg-gold-300/95"><Star className="h-3 w-3 fill-current" /> Premium</span>}
          {p.isOnline && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" />{t('online')}</span>}
        </div>
        <button onClick={toggleShortlist} aria-label="Shortlist"
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow transition hover:scale-110">
          <Heart className={`h-4 w-4 ${shortlisted ? 'fill-maroon-600 text-maroon-600' : 'text-maroon-700'}`} />
        </button>
        {p.matchScore != null && (
          <div className="absolute bottom-3 right-3 rounded-full bg-gold-300 px-2 py-0.5 text-xs font-bold text-maroon-900 shadow">{p.matchScore}% {t('match')}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 text-sm text-gray-700">
        <div className="flex items-center gap-2"><span className="chip">गोत्र: {p.gotra}</span>
          {p.gotraCompatible === false && <span className="chip !bg-red-50 !text-red-600">{tt('Gotra clash', 'गोत्र टकराव')}</span>}
        </div>
        {p.education && <div className="flex items-center gap-2 truncate"><GraduationCap className="h-4 w-4 shrink-0 text-gold-600" />{p.education}</div>}
        {(p.occupation || p.employedIn) && <div className="flex items-center gap-2 truncate"><Briefcase className="h-4 w-4 shrink-0 text-gold-600" />{p.occupation || label('employedIn', p.employedIn)}</div>}
        {(p.district || p.state) && <div className="flex items-center gap-2 truncate"><MapPin className="h-4 w-4 shrink-0 text-gold-600" />{[p.city, p.district, p.state].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>}
        <div className="mt-auto pt-2">
          {interest?.status === 'accepted' ? (
            <button onClick={(e) => { e.preventDefault(); navigate(`/chat/${p.userId}`); }} className="btn-gold w-full"><MessageCircle className="h-4 w-4" /> {t('chat')}</button>
          ) : interest?.status === 'pending' && interest.direction === 'sent' ? (
            <button disabled className="btn-outline w-full"><Check className="h-4 w-4" /> {t('interestSent')}</button>
          ) : interest?.status === 'pending' && interest.direction === 'received' ? (
            <button onClick={(e) => { e.preventDefault(); navigate('/interests?tab=received'); }} className="btn-gold w-full">{tt('Respond to interest', 'रुचि का जवाब दें')}</button>
          ) : interest?.status === 'declined' ? (
            <button disabled className="btn-outline w-full">{tt('Declined', 'अस्वीकृत')}</button>
          ) : (
            <button onClick={sendInterest} disabled={busy} className="btn-primary w-full"><Send className="h-4 w-4" /> {t('sendInterest')}</button>
          )}
        </div>
      </div>
    </Link>
  );
}
