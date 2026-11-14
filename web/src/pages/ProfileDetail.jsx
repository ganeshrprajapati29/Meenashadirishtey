import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BadgeCheck, Heart, Send, MessageCircle, Phone, Lock, MapPin, GraduationCap, Briefcase, Users, Star, Flag, Ban,
  ChevronLeft, ChevronRight, Check, GitMerge, Crown, Pencil, Clock, Ruler, Calendar,
} from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Modal, Empty } from '../components/Ui';
import { cmToFeet, formatDate, timeAgo } from '../lib/format';

function Row({ label, value }) {
  if (value === undefined || value === null || value === '' || value === '—') return null;
  return (
    <div className="flex justify-between gap-4 border-b border-dashed border-maroon-100 py-2.5 text-sm last:border-0">
      <span className="text-gray-500">{label}</span><span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-6">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-maroon-800"><Icon className="h-5 w-5 text-gold-600" />{title}</h3>
      {children}
    </div>
  );
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { tt, label, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [idx, setIdx] = useState(0);
  const [contact, setContact] = useState(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: 'fake_profile', details: '' });

  const load = () => api.get(`/profiles/${id}`).then((r) => { setD(r); setIdx(0); }).catch((e) => setErr(e.message));
  useEffect(() => { setD(null); setContact(null); load(); /* eslint-disable-next-line */ }, [id]);

  if (err) return <div className="container-x py-16"><Empty icon={Users} title={err} action={<Link to="/matches" className="btn-primary btn-sm">{tt('Back to search', 'खोज पर वापस')}</Link>} /></div>;
  if (!d) return <PageLoader />;
  const p = d.profile;
  const isOwner = String(p.userId) === String(user.id);
  const photos = p.photos?.length ? p.photos.map((x) => fileUrl(x.url)) : [avatarFor(p.gender)];

  const sendInterest = async () => {
    setBusy(true);
    try {
      const r = await api.post('/interests', { profileId: p.id });
      toast.success(r.autoAccepted ? tt('Connected!', 'जुड़ गए!') : tt('Interest sent', 'रुचि भेज दी गई'));
      load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const respond = async (action) => {
    try { await api.patch(`/interests/${d.interest.id}`, { action }); toast.success(action === 'accept' ? tt('Accepted', 'स्वीकार किया') : tt('Declined', 'अस्वीकार किया')); load(); } catch (e) { toast.error(e.message); }
  };
  const viewContact = async () => {
    setBusy(true);
    try { setContact(await api.get(`/profiles/${p.id}/contact`)); } catch (e) {
      toast.error(e.message);
      if (e.status === 402) navigate('/plans');
    } finally { setBusy(false); }
  };
  const shortlist = async () => {
    try { const r = await api.post(`/profiles/${p.id}/shortlist`); setD({ ...d, isShortlisted: r.shortlisted }); } catch (e) { toast.error(e.message); }
  };
  const block = async () => {
    if (!window.confirm(tt('Block this member? They will not be able to see or contact you.', 'इस सदस्य को ब्लॉक करें? वे आपको देख या संपर्क नहीं कर पाएंगे।'))) return;
    try { await api.post(`/profiles/${p.id}/block`); toast.success(tt('Member blocked', 'सदस्य ब्लॉक किया')); navigate('/matches'); } catch (e) { toast.error(e.message); }
  };
  const submitReport = async () => {
    try { const r = await api.post(`/profiles/${p.id}/report`, reportForm); toast.success(r.message); setReport(false); } catch (e) { toast.error(e.message); }
  };

  const i = d.interest;
  let action;
  if (isOwner) action = <Link to="/profile/edit" className="btn-primary flex-1"><Pencil className="h-4 w-4" />{tt('Edit profile', 'प्रोफाइल बदलें')}</Link>;
  else if (i?.status === 'accepted' || d.canChat) action = <Link to={`/chat/${p.userId}`} className="btn-gold flex-1"><MessageCircle className="h-4 w-4" />{tt('Chat now', 'चैट करें')}</Link>;
  else if (i?.status === 'pending' && i.direction === 'received') action = (
    <div className="flex flex-1 gap-2"><button onClick={() => respond('accept')} className="btn-primary flex-1"><Check className="h-4 w-4" />{tt('Accept', 'स्वीकार')}</button><button onClick={() => respond('decline')} className="btn-outline flex-1">{tt('Decline', 'अस्वीकार')}</button></div>
  );
  else if (i?.status === 'pending') action = <button disabled className="btn-outline flex-1"><Clock className="h-4 w-4" />{tt('Interest sent – awaiting reply', 'रुचि भेजी – जवाब का इंतज़ार')}</button>;
  else if (i?.status === 'declined') action = <button disabled className="btn-outline flex-1">{tt('Not interested', 'रुचि नहीं')}</button>;
  else action = <button onClick={sendInterest} disabled={busy} className="btn-primary flex-1"><Send className="h-4 w-4" />{tt('Send Interest', 'रुचि भेजें')}</button>;

  return (
    <div className="container-x py-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-semibold text-maroon-700"><ChevronLeft className="h-4 w-4" />{tt('Back', 'पीछे')}</button>
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Gallery + actions */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/5] bg-maroon-50">
              <img src={photos[idx]} alt="" className={`h-full w-full object-cover ${p.photoLocked ? 'blur-lg' : ''}`} />
              {p.photoLocked && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 text-white"><Lock className="h-8 w-8" /><span className="text-sm font-semibold">{tt('Photos visible to premium / connected members', 'फोटो प्रीमियम / जुड़े सदस्यों को दिखेंगी')}</span></div>}
              {photos.length > 1 && <>
                <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => setIdx((idx + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{photos.map((_, k) => <span key={k} className={`h-1.5 rounded-full ${k === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>
              </>}
              {d.isOnline && <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">● {tt('Online', 'ऑनलाइन')}</span>}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">{photos.map((src, k) => <button key={k} onClick={() => setIdx(k)}><img src={src} alt="" className={`h-16 w-14 rounded-lg object-cover ${k === idx ? 'ring-2 ring-maroon-600' : 'opacity-70'}`} /></button>)}</div>
            )}
          </div>
          <div className="card space-y-3 p-4">
            <div className="flex gap-2">
              {action}
              {!isOwner && <button onClick={shortlist} className="btn-outline !px-3" title="Shortlist"><Heart className={`h-5 w-5 ${d.isShortlisted ? 'fill-maroon-600' : ''}`} /></button>}
            </div>
            {!isOwner && (contact ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <div className="text-xs font-semibold uppercase text-emerald-700">{tt('Contact number', 'मोबाइल नंबर')}</div>
                <a href={`tel:${contact.countryCode}${contact.phone}`} className="mt-1 block font-mono text-2xl font-bold text-emerald-800">{contact.countryCode} {contact.phone}</a>
                <div className="mt-2 flex justify-center gap-2">
                  <a href={`tel:${contact.countryCode}${contact.phone}`} className="btn-primary btn-sm"><Phone className="h-3.5 w-3.5" />Call</a>
                  <a href={`https://wa.me/${contact.countryCode.replace('+', '')}${contact.phone}`} target="_blank" rel="noreferrer" className="btn-gold btn-sm">WhatsApp</a>
                </div>
              </div>
            ) : (
              <button onClick={viewContact} disabled={busy} className="btn-outline w-full"><Phone className="h-4 w-4" />{d.contactUnlocked ? tt('Show contact number', 'नंबर दिखाएं') : tt('View contact number', 'मोबाइल नंबर देखें')}{!d.contactUnlocked && !user.isPremium && <Crown className="h-4 w-4 text-gold-600" />}</button>
            ))}
            {!isOwner && (
              <div className="flex justify-center gap-6 pt-1 text-xs text-gray-500">
                <button onClick={() => setReport(true)} className="flex items-center gap-1 hover:text-red-600"><Flag className="h-3.5 w-3.5" />{tt('Report', 'रिपोर्ट करें')}</button>
                <button onClick={block} className="flex items-center gap-1 hover:text-red-600"><Ban className="h-3.5 w-3.5" />{tt('Block', 'ब्लॉक करें')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="min-w-0 space-y-5">
          <div className="card relative overflow-hidden p-6">
            <div className="pattern-bg absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold text-maroon-800">{p.firstName} {p.lastName}</h1>
                {p.isVerified && <span className="chip !bg-sky-50 !text-sky-700"><BadgeCheck className="h-4 w-4" />{tt('Verified', 'वेरिफाइड')}</span>}
                {d.isPremiumMember && <span className="chip-gold"><Star className="h-3 w-3 fill-current" />Premium</span>}
              </div>
              <div className="mt-1 text-sm text-gray-500">{p.profileId} · {tt('Profile created by', 'प्रोफाइल बनाई')}: {label('createdFor', p.createdFor)} · {d.isOnline ? tt('Online now', 'अभी ऑनलाइन') : `${tt('Active', 'सक्रिय')} ${timeAgo(d.lastActive, lang)}`}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip"><Calendar className="h-3.5 w-3.5" />{p.age} {tt('yrs', 'वर्ष')}</span>
                {p.height && <span className="chip"><Ruler className="h-3.5 w-3.5" />{cmToFeet(p.height)}</span>}
                <span className="chip">{label('maritalStatus', p.maritalStatus)}</span>
                {p.district && <span className="chip"><MapPin className="h-3.5 w-3.5" />{[p.city, p.district, p.state].filter(Boolean).join(', ')}</span>}
              </div>
              {p.matchScore != null && (
                <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-gold-50 to-maroon-50 p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-shine font-display text-lg font-bold text-maroon-900 shadow-glow">{p.matchScore}%</div>
                  <div className="text-sm"><div className="font-semibold text-maroon-800">{tt('Match with your preferences', 'आपकी पसंद से मेल')}</div>
                    <div className={`mt-1 flex items-center gap-1 ${p.gotraCompatible ? 'text-emerald-700' : 'text-red-600'}`}><GitMerge className="h-4 w-4" />{p.gotraCompatible ? tt('Gotra compatible', 'गोत्र मेल खाता है') : tt('Gotra conflict – same gotra in family', 'गोत्र टकराव – परिवार में समान गोत्र')}</div></div>
                </div>
              )}
              {p.about && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{p.about}</p>}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Section icon={Users} title={tt('Basic details', 'मूल जानकारी')}>
              <Row label={tt('Age', 'उम्र')} value={`${p.age} ${tt('yrs', 'वर्ष')}`} />
              <Row label={tt('Date of birth', 'जन्म तिथि')} value={formatDate(p.dob)} />
              <Row label={tt('Height', 'लंबाई')} value={p.height ? `${cmToFeet(p.height)} (${p.height} cm)` : null} />
              <Row label={tt('Weight', 'वज़न')} value={p.weight ? `${p.weight} kg` : null} />
              <Row label={tt('Complexion', 'रंग')} value={p.complexion && label('complexion', p.complexion)} />
              <Row label={tt('Diet', 'खान-पान')} value={p.diet && label('diet', p.diet)} />
              <Row label={tt('Mother tongue', 'मातृभाषा')} value={p.motherTongue} />
            </Section>
            <Section icon={GitMerge} title={tt('Gotra & horoscope', 'गोत्र व कुंडली')}>
              <Row label={tt('Gotra', 'गोत्र')} value={p.gotra} />
              <Row label={tt("Mother's gotra", 'माँ का गोत्र')} value={p.motherGotra} />
              <Row label={tt("Dadi's gotra", 'दादी का गोत्र')} value={p.dadiGotra} />
              <Row label={tt("Nani's gotra", 'नानी का गोत्र')} value={p.naniGotra} />
              <Row label={tt('Rashi', 'राशि')} value={p.rashi} />
              <Row label={tt('Manglik', 'मांगलिक')} value={label('manglik', p.manglik)} />
              <Row label={tt('Birth time / place', 'जन्म समय / स्थान')} value={[p.birthTime, p.birthPlace].filter(Boolean).join(', ')} />
            </Section>
            <Section icon={GraduationCap} title={tt('Education & career', 'शिक्षा व करियर')}>
              <Row label={tt('Education', 'शिक्षा')} value={p.education} />
              <Row label={tt('Details', 'विवरण')} value={p.educationDetail} />
              <Row label={tt('Employed in', 'रोज़गार')} value={p.employedIn && label('employedIn', p.employedIn)} />
              <Row label={tt('Occupation', 'पेशा')} value={p.occupation} />
              <Row label={tt('Work', 'कार्य')} value={p.occupationDetail} />
              <Row label={tt('Annual income', 'वार्षिक आय')} value={p.annualIncome} />
            </Section>
            <Section icon={Users} title={tt('Family', 'परिवार')}>
              <Row label={tt("Father's occupation", 'पिता का व्यवसाय')} value={p.family?.fatherOccupation} />
              <Row label={tt("Mother's occupation", 'माता का व्यवसाय')} value={p.family?.motherOccupation} />
              <Row label={tt('Brothers', 'भाई')} value={p.family ? `${p.family.brothers || 0} (${p.family.marriedBrothers || 0} ${tt('married', 'विवाहित')})` : null} />
              <Row label={tt('Sisters', 'बहनें')} value={p.family ? `${p.family.sisters || 0} (${p.family.marriedSisters || 0} ${tt('married', 'विवाहित')})` : null} />
              <Row label={tt('Family type', 'परिवार')} value={p.family?.familyType && label('familyType', p.family.familyType)} />
              <Row label={tt('Family status', 'स्थिति')} value={p.family?.familyStatus && label('familyStatus', p.family.familyStatus)} />
              <Row label={tt('Native place', 'मूल निवास')} value={p.family?.nativePlace} />
            </Section>
          </div>
          {p.partnerPreference && (
            <Section icon={Heart} title={tt('Partner preference', 'जीवनसाथी की पसंद')}>
              <div className="grid gap-x-8 md:grid-cols-2">
                <Row label={tt('Age', 'उम्र')} value={p.partnerPreference.ageMin ? `${p.partnerPreference.ageMin} – ${p.partnerPreference.ageMax || ''} ${tt('yrs', 'वर्ष')}` : null} />
                <Row label={tt('Height', 'लंबाई')} value={p.partnerPreference.heightMin ? `${cmToFeet(p.partnerPreference.heightMin)} – ${cmToFeet(p.partnerPreference.heightMax)}` : null} />
                <Row label={tt('Marital status', 'वैवाहिक स्थिति')} value={(p.partnerPreference.maritalStatus || []).map((m) => label('maritalStatus', m)).join(', ')} />
                <Row label={tt('Employed in', 'रोज़गार')} value={(p.partnerPreference.employedIn || []).map((m) => label('employedIn', m)).join(', ')} />
                <Row label={tt('Education', 'शिक्षा')} value={(p.partnerPreference.education || []).join(', ')} />
                <Row label={tt('States', 'राज्य')} value={(p.partnerPreference.states || []).join(', ')} />
              </div>
              {p.partnerPreference.about && <p className="mt-3 text-sm text-gray-700">{p.partnerPreference.about}</p>}
            </Section>
          )}
          {!isOwner && !d.connected && (
            <div className="flex items-center gap-3 rounded-2xl border border-gold-300 bg-gold-50 p-4 text-sm text-gold-900"><Briefcase className="h-5 w-5 shrink-0" />
              {tt("Family names and contact details are shared after the member accepts your interest.", 'परिवार के नाम और संपर्क जानकारी रुचि स्वीकार होने के बाद दिखेगी।')}</div>
          )}
        </div>
      </div>
      <Modal open={report} onClose={() => setReport(false)} title={tt('Report profile', 'प्रोफाइल रिपोर्ट करें')}>
        <div className="space-y-3">
          {[['fake_profile', tt('Fake profile', 'फर्जी प्रोफाइल')], ['married', tt('Already married', 'पहले से विवाहित')], ['abusive', tt('Abusive behaviour', 'अभद्र व्यवहार')], ['wrong_info', tt('Wrong information', 'गलत जानकारी')], ['spam', tt('Spam / money demand', 'स्पैम / पैसे की मांग')], ['other', tt('Other', 'अन्य')]].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm"><input type="radio" name="reason" className="accent-maroon-700" checked={reportForm.reason === v} onChange={() => setReportForm({ ...reportForm, reason: v })} />{l}</label>
          ))}
          <textarea className="input" rows={3} placeholder={tt('Details (optional)', 'विवरण (वैकल्पिक)')} value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} />
          <button onClick={submitReport} className="btn-primary w-full">{tt('Submit report', 'रिपोर्ट भेजें')}</button>
        </div>
      </Modal>
    </div>
  );
}
