import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, User, GitMerge, Briefcase, Users, Heart, Camera } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import ProfileForm, { EMPTY_PROFILE, cleanPayload, useMeta } from '../components/ProfileForm';
import PhotoManager from '../components/PhotoManager';
import { Spinner } from '../components/Ui';

export default function CreateProfile() {
  const { tt } = useLang();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const meta = useMeta();
  const [f, setF] = useState(EMPTY_PROFILE);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);

  const steps = [
    { key: 'basic', icon: User, title: tt('Basic details', 'मूल जानकारी') },
    { key: 'community', icon: GitMerge, title: tt('Gotra & horoscope', 'गोत्र व कुंडली') },
    { key: 'career', icon: Briefcase, title: tt('Education & location', 'शिक्षा व स्थान') },
    { key: 'family', icon: Users, title: tt('Family', 'परिवार') },
    { key: 'partner', icon: Heart, title: tt('Partner preference', 'जीवनसाथी की पसंद') },
    { key: 'photos', icon: Camera, title: tt('Photos', 'फोटो') },
  ];

  const validate = () => {
    if (step === 0) {
      if (!f.firstName.trim()) return tt('Please enter name', 'कृपया नाम भरें');
      if (!f.gender) return tt('Please select gender', 'कृपया लिंग चुनें');
      if (!f.dob) return tt('Please enter date of birth', 'कृपया जन्म तिथि भरें');
    }
    if (step === 1 && !f.gotra.trim()) return tt('Please enter your gotra', 'कृपया अपना गोत्र भरें');
    return null;
  };

  const next = async () => {
    const err = validate();
    if (err) return toast.error(err);
    if (step === 4) {
      setBusy(true);
      try {
        await api.post('/profiles/me', cleanPayload(f));
        await refresh();
        toast.success(tt('Profile created! Now add photos', 'प्रोफाइल बन गई! अब फोटो जोड़ें'));
        setStep(5);
      } catch (e) { toast.error(e.message); } finally { setBusy(false); }
      return;
    }
    if (step === 5) { navigate('/dashboard'); return; }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-display text-3xl font-bold text-maroon-800">{tt('Create your biodata', 'अपना बायोडाटा बनाएं')}</h1>
        <p className="mt-2 text-center text-sm text-gray-500">{tt('It takes only 3 minutes. Your profile will be live after a quick review.', 'सिर्फ 3 मिनट लगेंगे। जांच के बाद आपकी प्रोफाइल लाइव हो जाएगी।')}</p>

        <div className="scrollbar-none mt-8 flex gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.key} className={`flex min-w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${i === step ? 'bg-maroon-700 text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-500'}`}>
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}{s.title}
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-maroon-100"><div className="h-full rounded-full bg-gold-shine transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="card mt-6 p-6 sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-maroon-800">{(() => { const I = steps[step].icon; return <I className="h-5 w-5 text-gold-600" />; })()}{steps[step].title}</h2>
          {step < 5 ? <ProfileForm f={f} setF={setF} section={steps[step].key} meta={meta} /> : <PhotoManager photos={photos} onChange={setPhotos} />}
          <div className="mt-8 flex justify-between gap-3">
            <button className="btn-outline" disabled={step === 0 || step === 5 || busy} onClick={() => setStep(step - 1)}>{tt('Back', 'पीछे')}</button>
            <button className="btn-primary min-w-36" disabled={busy} onClick={next}>
              {busy ? <Spinner className="h-4 w-4 !text-white" /> : step === 4 ? tt('Create Profile', 'प्रोफाइल बनाएं') : step === 5 ? (photos.length ? tt('Go to Dashboard', 'डैशबोर्ड पर जाएं') : tt('Skip for now', 'अभी छोड़ें')) : tt('Next', 'आगे')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
