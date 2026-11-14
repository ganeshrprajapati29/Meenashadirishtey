import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import { Field, Select } from './Ui';
import { heightOptions, toDateInput } from '../lib/format';
import { LABELS } from '../lib/i18n';

export function useMeta() {
  const [meta, setMeta] = useState({ gotras: [], constants: {} });
  useEffect(() => { api.get('/profiles/meta').then(setMeta).catch(() => {}); }, []);
  return meta;
}

const opts = (group, lang) => Object.entries(LABELS[group]).map(([value, l]) => ({ value, label: lang === 'hi' ? l[1] : l[0] }));

export const EMPTY_PROFILE = {
  createdFor: 'self', firstName: '', lastName: 'Meena', gender: '', dob: '', maritalStatus: 'never_married', height: '', weight: '',
  complexion: '', diet: '', motherTongue: 'Hindi', subCommunity: '', gotra: '', motherGotra: '', dadiGotra: '', naniGotra: '',
  rashi: '', manglik: 'dont_know', birthTime: '', birthPlace: '', education: '', educationDetail: '', employedIn: '', occupation: '',
  occupationDetail: '', annualIncome: '', country: 'India', state: '', district: '', city: '', isNri: false,
  family: { fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '', brothers: 0, marriedBrothers: 0, sisters: 0, marriedSisters: 0, familyType: '', familyStatus: '', nativePlace: '' },
  about: '',
  partnerPreference: { ageMin: '', ageMax: '', heightMin: '', heightMax: '', maritalStatus: [], education: [], employedIn: [], states: [], about: '' },
  photoPrivacy: 'all', contactPrivacy: 'premium',
};

export function fromProfile(p) {
  return {
    ...EMPTY_PROFILE,
    ...Object.fromEntries(Object.keys(EMPTY_PROFILE).map((k) => [k, p[k] ?? EMPTY_PROFILE[k]])),
    dob: toDateInput(p.dob),
    family: { ...EMPTY_PROFILE.family, ...(p.family || {}) },
    partnerPreference: { ...EMPTY_PROFILE.partnerPreference, ...(p.partnerPreference || {}) },
  };
}

/** Remove empty strings so the API ignores them */
export function cleanPayload(f) {
  const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  return { ...strip(f), family: strip(f.family), partnerPreference: strip(f.partnerPreference) };
}

function MultiChips({ value = [], onChange, options }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        const on = value.includes(v);
        return (
          <button type="button" key={v} onClick={() => toggle(v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? 'border-maroon-700 bg-maroon-700 text-white' : 'border-maroon-200 bg-white text-gray-700 hover:border-maroon-400'}`}>{l}</button>
        );
      })}
    </div>
  );
}

export function GotraInput({ value, onChange, gotras, placeholder }) {
  return (
    <>
      <input className="input" list="gotra-list" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <datalist id="gotra-list">{gotras.map((g) => <option key={g} value={g} />)}</datalist>
    </>
  );
}

/** Sections of the biodata form. `section` = basic | community | career | family | partner | privacy */
export default function ProfileForm({ f, setF, section, meta }) {
  const { lang, tt } = useLang();
  const C = meta.constants || {};
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setFam = (k, v) => setF((s) => ({ ...s, family: { ...s.family, [k]: v } }));
  const setPref = (k, v) => setF((s) => ({ ...s, partnerPreference: { ...s.partnerPreference, [k]: v } }));
  const ages = Array.from({ length: 50 }, (_, i) => 18 + i);
  const counts = [0, 1, 2, 3, 4, 5, 6];

  if (section === 'basic') return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={tt('Profile created for', 'प्रोफाइल किसके लिए')} className="sm:col-span-2">
        <MultiChips value={[f.createdFor]} onChange={(v) => set('createdFor', v[v.length - 1] || 'self')} options={opts('createdFor', lang)} />
      </Field>
      <Field label={tt('First name *', 'नाम *')}><input className="input" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} required /></Field>
      <Field label={tt('Surname', 'उपनाम')}><input className="input" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
      <Field label={tt('Gender *', 'लिंग *')}>
        <div className="grid grid-cols-2 gap-2">
          {opts('gender', lang).map((o) => (
            <button type="button" key={o.value} onClick={() => set('gender', o.value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${f.gender === o.value ? 'border-maroon-700 bg-maroon-700 text-white' : 'border-maroon-200 bg-white text-gray-700'}`}>{o.label}</button>
          ))}
        </div>
      </Field>
      <Field label={tt('Date of birth *', 'जन्म तिथि *')}><input type="date" className="input" value={f.dob} max={toDateInput(new Date(Date.now() - 18 * 365.25 * 864e5))} onChange={(e) => set('dob', e.target.value)} required /></Field>
      <Field label={tt('Marital status', 'वैवाहिक स्थिति')}><Select value={f.maritalStatus} onChange={(v) => set('maritalStatus', v)} options={opts('maritalStatus', lang)} /></Field>
      <Field label={tt('Height', 'लंबाई')}><Select value={f.height} onChange={(v) => set('height', v)} options={heightOptions()} /></Field>
      <Field label={tt('Weight (kg)', 'वज़न (किग्रा)')}><input type="number" className="input" value={f.weight} onChange={(e) => set('weight', e.target.value)} /></Field>
      <Field label={tt('Complexion', 'रंग')}><Select value={f.complexion} onChange={(v) => set('complexion', v)} options={opts('complexion', lang)} /></Field>
      <Field label={tt('Diet', 'खान-पान')}><Select value={f.diet} onChange={(v) => set('diet', v)} options={opts('diet', lang)} /></Field>
      <Field label={tt('Disability (if any)', 'विकलांगता (यदि कोई)')}><input className="input" value={f.disability || ''} onChange={(e) => set('disability', e.target.value)} placeholder="None" /></Field>
      <Field label={tt('About me', 'मेरे बारे में')} className="sm:col-span-2">
        <textarea rows={4} className="input" value={f.about} onChange={(e) => set('about', e.target.value)} maxLength={1500}
          placeholder={tt('Write a few lines about yourself, your nature and family values', 'अपने बारे में, स्वभाव और पारिवारिक मूल्यों के बारे में लिखें')} />
      </Field>
    </div>
  );

  if (section === 'community') return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-gold-50 p-4 text-sm text-gold-900 sm:col-span-2">
        {tt('Gotra details help us hide profiles from gotras you cannot marry into (own, mother\'s, dadi\'s & nani\'s).', 'गोत्र की जानकारी से हम उन गोत्रों की प्रोफाइल हटा देते हैं जिनमें विवाह नहीं हो सकता (अपना, माँ, दादी और नानी का)।')}
      </div>
      <Field label={tt('Your gotra *', 'आपका गोत्र *')}><GotraInput value={f.gotra} onChange={(v) => set('gotra', v)} gotras={meta.gotras} placeholder="e.g. Jorwal" /></Field>
      <Field label={tt("Mother's gotra", 'माँ का गोत्र')}><GotraInput value={f.motherGotra} onChange={(v) => set('motherGotra', v)} gotras={meta.gotras} /></Field>
      <Field label={tt("Dadi's gotra", 'दादी का गोत्र')}><GotraInput value={f.dadiGotra} onChange={(v) => set('dadiGotra', v)} gotras={meta.gotras} /></Field>
      <Field label={tt("Nani's gotra", 'नानी का गोत्र')}><GotraInput value={f.naniGotra} onChange={(v) => set('naniGotra', v)} gotras={meta.gotras} /></Field>
      <Field label={tt('Sub-community', 'उप-समुदाय')}><input className="input" value={f.subCommunity} onChange={(e) => set('subCommunity', e.target.value)} placeholder="Meena" /></Field>
      <Field label={tt('Rashi', 'राशि')}><Select value={f.rashi} onChange={(v) => set('rashi', v)} options={C.RASHI || []} /></Field>
      <Field label={tt('Manglik', 'मांगलिक')}><Select value={f.manglik} onChange={(v) => set('manglik', v)} options={opts('manglik', lang)} /></Field>
      <Field label={tt('Birth time', 'जन्म समय')}><input type="time" className="input" value={f.birthTime} onChange={(e) => set('birthTime', e.target.value)} /></Field>
      <Field label={tt('Birth place', 'जन्म स्थान')} className="sm:col-span-2"><input className="input" value={f.birthPlace} onChange={(e) => set('birthPlace', e.target.value)} /></Field>
    </div>
  );

  if (section === 'career') return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={tt('Highest education', 'उच्चतम शिक्षा')}><Select value={f.education} onChange={(v) => set('education', v)} options={C.EDUCATION || []} /></Field>
      <Field label={tt('Education details', 'शिक्षा विवरण')}><input className="input" value={f.educationDetail} onChange={(e) => set('educationDetail', e.target.value)} placeholder="College / University" /></Field>
      <Field label={tt('Employed in', 'रोज़गार क्षेत्र')}><Select value={f.employedIn} onChange={(v) => set('employedIn', v)} options={opts('employedIn', lang)} /></Field>
      <Field label={tt('Occupation', 'पेशा')}><input className="input" value={f.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Teacher, Engineer, Patwari..." /></Field>
      <Field label={tt('Work details', 'कार्य विवरण')}><input className="input" value={f.occupationDetail} onChange={(e) => set('occupationDetail', e.target.value)} placeholder="Department / Company, posting" /></Field>
      <Field label={tt('Annual income', 'वार्षिक आय')}><Select value={f.annualIncome} onChange={(v) => set('annualIncome', v)} options={C.INCOME || []} /></Field>
      <Field label={tt('Country', 'देश')}><input className="input" value={f.country} onChange={(e) => set('country', e.target.value)} /></Field>
      <Field label={tt('State', 'राज्य')}><Select value={f.state} onChange={(v) => set('state', v)} options={C.STATES || []} /></Field>
      <Field label={tt('District', 'ज़िला')}><input className="input" value={f.district} onChange={(e) => set('district', e.target.value)} placeholder="Dausa" /></Field>
      <Field label={tt('City / Village', 'शहर / गाँव')}><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!f.isNri} onChange={(e) => set('isNri', e.target.checked)} className="h-4 w-4 accent-maroon-700" />{tt('I live outside India (NRI)', 'मैं भारत से बाहर रहता/रहती हूँ (NRI)')}</label>
    </div>
  );

  if (section === 'family') return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={tt("Father's name", 'पिता का नाम')}><input className="input" value={f.family.fatherName} onChange={(e) => setFam('fatherName', e.target.value)} /></Field>
      <Field label={tt("Father's occupation", 'पिता का व्यवसाय')}><input className="input" value={f.family.fatherOccupation} onChange={(e) => setFam('fatherOccupation', e.target.value)} /></Field>
      <Field label={tt("Mother's name", 'माता का नाम')}><input className="input" value={f.family.motherName} onChange={(e) => setFam('motherName', e.target.value)} /></Field>
      <Field label={tt("Mother's occupation", 'माता का व्यवसाय')}><input className="input" value={f.family.motherOccupation} onChange={(e) => setFam('motherOccupation', e.target.value)} placeholder="Homemaker" /></Field>
      <Field label={tt('Brothers', 'भाई')}><Select value={f.family.brothers} onChange={(v) => setFam('brothers', v)} options={counts} placeholder="0" /></Field>
      <Field label={tt('Married brothers', 'विवाहित भाई')}><Select value={f.family.marriedBrothers} onChange={(v) => setFam('marriedBrothers', v)} options={counts} placeholder="0" /></Field>
      <Field label={tt('Sisters', 'बहनें')}><Select value={f.family.sisters} onChange={(v) => setFam('sisters', v)} options={counts} placeholder="0" /></Field>
      <Field label={tt('Married sisters', 'विवाहित बहनें')}><Select value={f.family.marriedSisters} onChange={(v) => setFam('marriedSisters', v)} options={counts} placeholder="0" /></Field>
      <Field label={tt('Family type', 'परिवार का प्रकार')}><Select value={f.family.familyType} onChange={(v) => setFam('familyType', v)} options={opts('familyType', lang)} /></Field>
      <Field label={tt('Family status', 'पारिवारिक स्थिति')}><Select value={f.family.familyStatus} onChange={(v) => setFam('familyStatus', v)} options={opts('familyStatus', lang)} /></Field>
      <Field label={tt('Native place', 'मूल निवास')} className="sm:col-span-2"><input className="input" value={f.family.nativePlace} onChange={(e) => setFam('nativePlace', e.target.value)} /></Field>
    </div>
  );

  if (section === 'partner') return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={tt('Age from', 'उम्र से')}><Select value={f.partnerPreference.ageMin} onChange={(v) => setPref('ageMin', v)} options={ages} /></Field>
      <Field label={tt('Age to', 'उम्र तक')}><Select value={f.partnerPreference.ageMax} onChange={(v) => setPref('ageMax', v)} options={ages} /></Field>
      <Field label={tt('Height from', 'लंबाई से')}><Select value={f.partnerPreference.heightMin} onChange={(v) => setPref('heightMin', v)} options={heightOptions()} /></Field>
      <Field label={tt('Height to', 'लंबाई तक')}><Select value={f.partnerPreference.heightMax} onChange={(v) => setPref('heightMax', v)} options={heightOptions()} /></Field>
      <Field label={tt('Marital status', 'वैवाहिक स्थिति')} className="sm:col-span-2"><MultiChips value={f.partnerPreference.maritalStatus} onChange={(v) => setPref('maritalStatus', v)} options={opts('maritalStatus', lang)} /></Field>
      <Field label={tt('Employed in', 'रोज़गार क्षेत्र')} className="sm:col-span-2"><MultiChips value={f.partnerPreference.employedIn} onChange={(v) => setPref('employedIn', v)} options={opts('employedIn', lang)} /></Field>
      <Field label={tt('Education', 'शिक्षा')} className="sm:col-span-2"><MultiChips value={f.partnerPreference.education} onChange={(v) => setPref('education', v)} options={(C.EDUCATION || []).slice(0, 28)} /></Field>
      <Field label={tt('Preferred states', 'पसंदीदा राज्य')} className="sm:col-span-2"><MultiChips value={f.partnerPreference.states} onChange={(v) => setPref('states', v)} options={(C.STATES || []).slice(0, 12)} /></Field>
      <Field label={tt('Expectations', 'अपेक्षाएं')} className="sm:col-span-2"><textarea rows={3} className="input" value={f.partnerPreference.about} onChange={(e) => setPref('about', e.target.value)} /></Field>
    </div>
  );

  if (section === 'privacy') return (
    <div className="grid gap-5">
      <Field label={tt('Who can see my photos?', 'मेरी फोटो कौन देख सकता है?')}>
        <Select value={f.photoPrivacy} onChange={(v) => set('photoPrivacy', v)} placeholder="—" options={[
          { value: 'all', label: tt('All members', 'सभी सदस्य') },
          { value: 'premium', label: tt('Premium members & connections', 'प्रीमियम सदस्य व जुड़े हुए') },
          { value: 'connected', label: tt('Only accepted connections', 'केवल जुड़े हुए सदस्य') },
        ]} />
      </Field>
      <Field label={tt('Who can see my mobile number?', 'मेरा मोबाइल नंबर कौन देख सकता है?')}>
        <Select value={f.contactPrivacy} onChange={(v) => set('contactPrivacy', v)} placeholder="—" options={[
          { value: 'premium', label: tt('Premium members & accepted connections', 'प्रीमियम सदस्य व जुड़े हुए') },
          { value: 'connected', label: tt('Only accepted connections', 'केवल जुड़े हुए सदस्य') },
        ]} />
      </Field>
    </div>
  );
  return null;
}
