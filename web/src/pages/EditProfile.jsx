import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import ProfileForm, { cleanPayload, fromProfile, useMeta } from '../components/ProfileForm';
import PhotoManager from '../components/PhotoManager';
import { PageLoader, Spinner } from '../components/Ui';

export default function EditProfile() {
  const { tt } = useLang();
  const { refresh } = useAuth();
  const meta = useMeta();
  const [f, setF] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('photos');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/profiles/me').then((r) => { setProfile(r.profile); setF(fromProfile(r.profile)); });
  }, []);

  if (!f) return <PageLoader />;

  const tabs = [
    ['photos', tt('Photos', 'फोटो')], ['basic', tt('Basic', 'मूल')], ['community', tt('Gotra', 'गोत्र')], ['career', tt('Career', 'करियर')],
    ['family', tt('Family', 'परिवार')], ['partner', tt('Partner', 'जीवनसाथी')], ['privacy', tt('Privacy', 'गोपनीयता')],
  ];

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put('/profiles/me', cleanPayload(f));
      setProfile(r.profile);
      await refresh();
      toast.success(tt('Profile saved', 'प्रोफाइल सेव हो गई'));
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-maroon-800">{tt('Edit Profile', 'प्रोफाइल बदलें')}</h1>
            <p className="text-sm text-gray-500">{profile.profileId} · {tt('Profile completeness', 'प्रोफाइल पूर्णता')} {profile.completeness}%</p>
          </div>
          <Link to={`/profile/${profile.profileId}`} className="btn-outline btn-sm"><Eye className="h-4 w-4" />{tt('Preview', 'देखें')}</Link>
        </div>
        {profile.status === 'rejected' && (
          <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="h-5 w-5 shrink-0" />
            <div><b>{tt('Changes needed:', 'बदलाव ज़रूरी:')}</b> {profile.rejectionReason}</div></div>
        )}
        {profile.status === 'pending' && (
          <div className="mt-4 rounded-xl border border-gold-300 bg-gold-50 p-4 text-sm text-gold-900">{tt('Your profile is under review. It will be visible to others once approved.', 'आपकी प्रोफाइल जांच में है। स्वीकृत होने के बाद यह दूसरों को दिखेगी।')}</div>
        )}
        <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-maroon-700 text-white' : 'bg-white text-gray-600 hover:bg-maroon-50'}`}>{l}</button>
          ))}
        </div>
        <div className="card mt-4 p-6 sm:p-8">
          {tab === 'photos'
            ? <PhotoManager photos={profile.photos} onChange={(photos) => { setProfile({ ...profile, photos }); refresh(); }} />
            : <>
              <ProfileForm f={f} setF={setF} section={tab} meta={meta} />
              <div className="mt-8 flex justify-end"><button className="btn-primary min-w-32" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 !text-white" /> : tt('Save changes', 'बदलाव सेव करें')}</button></div>
            </>}
        </div>
      </div>
    </div>
  );
}
