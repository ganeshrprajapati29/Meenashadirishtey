import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, HeartHandshake } from 'lucide-react';
import api, { fileUrl } from '../../lib/api';
import { Modal, Spinner, Field } from '../../components/Ui';
import { toDateInput, formatDate } from '../../lib/format';

const EMPTY = { coupleNames: '', story: '', location: '', weddingDate: '', isPublished: true };

export default function AdminStories() {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const [file, setFile] = useState(null);
  const load = () => api.get('/admin/stories').then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }));
  const save = async () => {
    const fd = new FormData();
    ['coupleNames', 'story', 'location', 'weddingDate', 'isPublished'].forEach((k) => fd.append(k, edit[k] ?? ''));
    if (file) fd.append('image', file);
    try { if (edit._id) await api.put(`/admin/stories/${edit._id}`, fd); else await api.post('/admin/stories', fd); toast.success('Saved'); setEdit(null); load(); } catch (e) { toast.error(e.message); }
  };
  const del = async (s) => { if (!window.confirm('Delete story?')) return; await api.delete(`/admin/stories/${s._id}`); load(); };
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl font-bold text-maroon-800">Success Stories</h1><button onClick={() => { setFile(null); setEdit({ ...EMPTY }); }} className="btn-primary"><Plus className="h-4 w-4" />Add story</button></div>
      {!items ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <div key={s._id} className={`card overflow-hidden ${s.isPublished ? '' : 'opacity-60'}`}>
              {s.image ? <img src={fileUrl(s.image)} alt="" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-royal"><HeartHandshake className="h-12 w-12 text-gold-300" /></div>}
              <div className="p-4"><div className="font-semibold">{s.coupleNames} {s.isDemo && <span className="chip">demo</span>}</div><div className="text-xs text-gray-500">{s.location} · {formatDate(s.weddingDate)}</div><p className="mt-2 line-clamp-3 text-sm text-gray-600">{s.story}</p>
                <div className="mt-3 flex gap-2"><button onClick={() => { setFile(null); setEdit({ ...s, weddingDate: toDateInput(s.weddingDate) }); }} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => del(s)} className="btn btn-sm border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Success story">
        {edit && (
          <div className="space-y-3">
            <Field label="Couple names"><input className="input" value={edit.coupleNames} onChange={(e) => set('coupleNames', e.target.value)} /></Field>
            <Field label="Location"><input className="input" value={edit.location || ''} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Wedding date"><input type="date" className="input" value={edit.weddingDate || ''} onChange={(e) => set('weddingDate', e.target.value)} /></Field>
            <Field label="Story"><textarea rows={5} className="input" value={edit.story} onChange={(e) => set('story', e.target.value)} /></Field>
            <Field label="Photo"><input type="file" accept="image/*" className="input" onChange={(e) => setFile(e.target.files[0])} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon-700" checked={!!edit.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />Published</label>
            <button onClick={save} className="btn-primary w-full">Save</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
