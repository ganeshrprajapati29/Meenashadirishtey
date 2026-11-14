import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, MousePointerClick, Eye } from 'lucide-react';
import api, { fileUrl } from '../../lib/api';
import { Modal, Spinner, Field, Select } from '../../components/Ui';
import { toDateInput } from '../../lib/format';

const PLACEMENTS = [
  ['home_hero', 'Website – Home top'], ['home_mid', 'Website – Home middle'], ['dashboard', 'Website – Member dashboard'],
  ['search', 'Website – Search page'], ['app_home', 'App – Home slider'], ['app_popup', 'App – Popup ad'],
];
const EMPTY = { title: '', subtitle: '', link: '', ctaText: '', placement: 'home_mid', advertiser: '', isAd: false, isActive: true, order: 0, startDate: '', endDate: '', bgColor: '#7A1F1F' };

export default function AdminBanners() {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => api.get('/admin/banners').then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  const open = (b) => { setFile(null); setEdit(b ? { ...EMPTY, ...b, startDate: toDateInput(b.startDate), endDate: toDateInput(b.endDate) } : { ...EMPTY }); };
  const save = async () => {
    if (!edit.title) return toast.error('Title is required');
    setBusy(true);
    const fd = new FormData();
    ['title', 'subtitle', 'link', 'ctaText', 'placement', 'advertiser', 'isAd', 'isActive', 'order', 'startDate', 'endDate', 'bgColor'].forEach((k) => fd.append(k, edit[k] ?? ''));
    if (file) fd.append('image', file);
    try {
      if (edit._id) await api.put(`/admin/banners/${edit._id}`, fd); else await api.post('/admin/banners', fd);
      toast.success('Saved'); setEdit(null); load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const del = async (b) => { if (!window.confirm('Delete banner?')) return; await api.delete(`/admin/banners/${b._id}`); load(); };
  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold text-maroon-800">Banners & Ads</h1><p className="text-sm text-gray-500">Shown automatically on website & app. Recommended size 1600×500.</p></div>
        <button onClick={() => open(null)} className="btn-primary"><Plus className="h-4 w-4" />New banner</button>
      </div>
      {!items ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <div key={b._id} className={`card overflow-hidden ${b.isActive ? '' : 'opacity-60'}`}>
              {b.image ? <img src={fileUrl(b.image)} alt="" className="aspect-[16/5] w-full object-cover" /> : <div className="aspect-[16/5] p-4 text-white" style={{ background: b.bgColor }}>{b.title}</div>}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{b.title}</div><div className="text-xs text-gray-500">{PLACEMENTS.find((p) => p[0] === b.placement)?.[1]}</div></div>
                  <div className="flex gap-1">{b.isAd && <span className="chip-gold">AD</span>}{!b.isActive && <span className="chip">Off</span>}</div></div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{b.impressions}</span><span className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{b.clicks}</span>{b.link && <span className="truncate">→ {b.link}</span>}</div>
                <div className="mt-3 flex gap-2"><button onClick={() => open(b)} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => del(b)} className="btn btn-sm border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit banner' : 'New banner'} wide>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *"><input className="input" value={edit.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Subtitle"><input className="input" value={edit.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></Field>
            <Field label="Placement"><Select value={edit.placement} onChange={(v) => set('placement', v)} options={PLACEMENTS.map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Link (e.g. /plans or https://...)"><input className="input" value={edit.link || ''} onChange={(e) => set('link', e.target.value)} /></Field>
            <Field label="Button text"><input className="input" value={edit.ctaText || ''} onChange={(e) => set('ctaText', e.target.value)} /></Field>
            <Field label="Advertiser"><input className="input" value={edit.advertiser || ''} onChange={(e) => set('advertiser', e.target.value)} /></Field>
            <Field label="Start date"><input type="date" className="input" value={edit.startDate || ''} onChange={(e) => set('startDate', e.target.value)} /></Field>
            <Field label="End date"><input type="date" className="input" value={edit.endDate || ''} onChange={(e) => set('endDate', e.target.value)} /></Field>
            <Field label="Order"><input type="number" className="input" value={edit.order} onChange={(e) => set('order', e.target.value)} /></Field>
            <Field label="Background colour (no image)"><input type="color" className="input h-11" value={edit.bgColor} onChange={(e) => set('bgColor', e.target.value)} /></Field>
            <Field label="Image" className="sm:col-span-2"><input type="file" accept="image/*" className="input" onChange={(e) => setFile(e.target.files[0])} />
              {(file || edit.image) && <img src={file ? URL.createObjectURL(file) : fileUrl(edit.image)} alt="" className="mt-2 aspect-[16/5] w-full rounded-lg object-cover" />}</Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon-700" checked={!!edit.isActive} onChange={(e) => set('isActive', e.target.checked)} />Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon-700" checked={!!edit.isAd} onChange={(e) => set('isAd', e.target.checked)} />Paid advertisement (shows “Ad” label)</label>
            <button onClick={save} disabled={busy} className="btn-primary sm:col-span-2">{busy ? <Spinner className="h-4 w-4 !text-white" /> : 'Save banner'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
