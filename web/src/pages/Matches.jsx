import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X, Users } from 'lucide-react';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import ProfileCard from '../components/ProfileCard';
import BannerSlot from '../components/BannerSlot';
import { Empty, Field, Pagination, Select, Spinner } from '../components/Ui';
import { useMeta } from '../components/ProfileForm';
import { heightOptions } from '../lib/format';
import { LABELS } from '../lib/i18n';

const DEFAULTS = { ageMin: '', ageMax: '', heightMin: '', heightMax: '', maritalStatus: '', education: '', employedIn: '', state: '', district: '', isNri: '', withPhoto: '', verified: '', gotraFilter: 'true', keyword: '', sort: '' };

export default function Matches() {
  const { tt, lang } = useLang();
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState(() => ({ ...DEFAULTS, ...Object.fromEntries(params) }));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams(params);
    if (!q.get('gotraFilter')) q.set('gotraFilter', 'true');
    q.set('limit', '12');
    q.delete('gender'); // always opposite gender for members
    api.get(`/profiles/search?${q}`).then(setData).finally(() => setLoading(false));
  }, [params]);

  const apply = (e) => {
    e?.preventDefault();
    const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v != null));
    setParams(clean);
    setShowFilters(false);
  };
  const reset = () => { setF(DEFAULTS); setParams({}); };
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ages = Array.from({ length: 43 }, (_, i) => 18 + i);
  const opt = (g) => Object.entries(LABELS[g]).map(([value, l]) => ({ value, label: lang === 'hi' ? l[1] : l[0] }));

  const filters = (
    <form onSubmit={apply} className="space-y-4">
      <Field label={tt('Name / Profile ID / City', 'नाम / प्रोफाइल ID / शहर')}><input className="input" value={f.keyword} onChange={(e) => set('keyword', e.target.value)} placeholder="MSR10001" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={tt('Age from', 'उम्र से')}><Select value={f.ageMin} onChange={(v) => set('ageMin', v)} options={ages} placeholder="Any" /></Field>
        <Field label={tt('to', 'तक')}><Select value={f.ageMax} onChange={(v) => set('ageMax', v)} options={ages} placeholder="Any" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={tt('Height from', 'लंबाई से')}><Select value={f.heightMin} onChange={(v) => set('heightMin', v)} options={heightOptions().map((h) => ({ value: h.value, label: h.label.split(' ')[0] }))} placeholder="Any" /></Field>
        <Field label={tt('to', 'तक')}><Select value={f.heightMax} onChange={(v) => set('heightMax', v)} options={heightOptions().map((h) => ({ value: h.value, label: h.label.split(' ')[0] }))} placeholder="Any" /></Field>
      </div>
      <Field label={tt('Marital status', 'वैवाहिक स्थिति')}><Select value={f.maritalStatus} onChange={(v) => set('maritalStatus', v)} options={opt('maritalStatus')} placeholder="Any" /></Field>
      <Field label={tt('Employed in', 'रोज़गार')}><Select value={f.employedIn} onChange={(v) => set('employedIn', v)} options={opt('employedIn')} placeholder="Any" /></Field>
      <Field label={tt('Education', 'शिक्षा')}><Select value={f.education} onChange={(v) => set('education', v)} options={meta.constants.EDUCATION || []} placeholder="Any" /></Field>
      <Field label={tt('State', 'राज्य')}><Select value={f.state} onChange={(v) => set('state', v)} options={meta.constants.STATES || []} placeholder="Any" /></Field>
      <Field label={tt('District', 'ज़िला')}><input className="input" value={f.district} onChange={(e) => set('district', e.target.value)} /></Field>
      <div className="space-y-2 text-sm">
        {[
          ['gotraFilter', tt('Apply gotra rules (recommended)', 'गोत्र नियम लागू करें (सुझावित)')],
          ['withPhoto', tt('With photo only', 'सिर्फ फोटो वाली प्रोफाइल')],
          ['verified', tt('Verified only', 'सिर्फ वेरिफाइड')],
          ['isNri', tt('NRI only', 'सिर्फ NRI')],
        ].map(([k, l]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-maroon-700" checked={f[k] === 'true'} onChange={(e) => set(k, e.target.checked ? 'true' : (k === 'gotraFilter' ? 'false' : ''))} />{l}</label>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={reset} className="btn-outline flex-1">{tt('Reset', 'रीसेट')}</button>
        <button className="btn-primary flex-1"><Search className="h-4 w-4" />{tt('Search', 'खोजें')}</button>
      </div>
    </form>
  );

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800">{tt('Find Matches', 'रिश्ते खोजें')}</h1>
          <p className="text-sm text-gray-500">{data ? `${data.total} ${tt('profiles found', 'प्रोफाइल मिलीं')}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Select value={params.get('sort') || ''} onChange={(v) => { const q = new URLSearchParams(params); if (v) q.set('sort', v); else q.delete('sort'); q.delete('page'); setParams(q); }}
            placeholder={tt('Relevance', 'प्रासंगिकता')} className="!w-auto !py-2"
            options={[{ value: 'newest', label: tt('Newest', 'नई प्रोफाइल') }, { value: 'active', label: tt('Recently active', 'हाल ही में सक्रिय') }, { value: 'age_asc', label: tt('Age: low to high', 'उम्र: कम से ज़्यादा') }]} />
          <button onClick={() => setShowFilters(true)} className="btn-outline lg:hidden"><SlidersHorizontal className="h-4 w-4" />{tt('Filters', 'फ़िल्टर')}</button>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block"><div className="card sticky top-24 p-5">{filters}</div></aside>
        <div className="min-w-0">
          <BannerSlot placement="search" className="mb-6" />
          {loading ? <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
            : data?.items?.length ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{data.items.map((p) => <ProfileCard key={p.id} p={p} />)}</div>
                <Pagination page={page} pages={data.pages} onChange={(pg) => { const q = new URLSearchParams(params); q.set('page', pg); setParams(q); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </>
            ) : <Empty icon={Users} title={tt('No profiles found', 'कोई प्रोफाइल नहीं मिली')} text={tt('Try changing your filters.', 'फ़िल्टर बदल कर देखें।')} action={<button onClick={reset} className="btn-primary btn-sm">{tt('Reset filters', 'फ़िल्टर रीसेट करें')}</button>} />}
        </div>
      </div>
      {showFilters && (
        <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-xl font-bold text-maroon-800">{tt('Filters', 'फ़िल्टर')}</h3><button onClick={() => setShowFilters(false)}><X className="h-6 w-6" /></button></div>
            {filters}
          </div>
        </div>
      )}
    </div>
  );
}
