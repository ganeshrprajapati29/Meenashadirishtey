import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Crown } from 'lucide-react';
import api from '../../lib/api';
import { Modal, Spinner, Field } from '../../components/Ui';
import { inr } from '../../lib/format';

const EMPTY = { name: '', nameHi: '', price: '', mrp: '', durationDays: 30, contactLimit: 20, features: '', featuresHi: '', isPopular: false, isActive: true, order: 0, color: '#D4A017' };

export default function AdminPlans() {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = () => api.get('/admin/plans').then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  const open = (p) => setEdit(p ? { ...p, features: (p.features || []).join('\n'), featuresHi: (p.featuresHi || []).join('\n') } : { ...EMPTY });
  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }));
  const save = async () => {
    try {
      const body = { ...edit, price: Number(edit.price), mrp: Number(edit.mrp) || undefined, durationDays: Number(edit.durationDays), contactLimit: Number(edit.contactLimit), order: Number(edit.order) };
      if (edit._id) await api.put(`/admin/plans/${edit._id}`, body); else await api.post('/admin/plans', body);
      toast.success('Saved'); setEdit(null); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (p) => { if (!window.confirm('Delete plan?')) return; await api.delete(`/admin/plans/${p._id}`); load(); };
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl font-bold text-maroon-800">Membership Plans</h1><button onClick={() => open(null)} className="btn-primary"><Plus className="h-4 w-4" />New plan</button></div>
      {!items ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {items.map((p) => (
            <div key={p._id} className={`card p-6 ${p.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between"><Crown className="h-7 w-7" style={{ color: p.color }} />{p.isPopular && <span className="chip-gold">Popular</span>}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{p.name} <span className="text-sm text-gray-500">{p.nameHi}</span></h3>
              <div className="text-2xl font-bold">{inr(p.price)} <span className="text-sm text-gray-400 line-through">{p.mrp ? inr(p.mrp) : ''}</span></div>
              <div className="text-sm text-gray-500">{p.durationDays} days · {p.contactLimit} contacts</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <div className="mt-4 flex gap-2"><button onClick={() => open(p)} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => del(p)} className="btn btn-sm border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit plan' : 'New plan'} wide>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className="input" value={edit.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Name (Hindi)"><input className="input" value={edit.nameHi || ''} onChange={(e) => set('nameHi', e.target.value)} /></Field>
            <Field label="Price ₹"><input type="number" className="input" value={edit.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="MRP ₹ (strike-through)"><input type="number" className="input" value={edit.mrp || ''} onChange={(e) => set('mrp', e.target.value)} /></Field>
            <Field label="Duration (days)"><input type="number" className="input" value={edit.durationDays} onChange={(e) => set('durationDays', e.target.value)} /></Field>
            <Field label="Contact views"><input type="number" className="input" value={edit.contactLimit} onChange={(e) => set('contactLimit', e.target.value)} /></Field>
            <Field label="Features (one per line)"><textarea rows={5} className="input" value={edit.features} onChange={(e) => set('features', e.target.value)} /></Field>
            <Field label="Features Hindi (one per line)"><textarea rows={5} className="input" value={edit.featuresHi} onChange={(e) => set('featuresHi', e.target.value)} /></Field>
            <Field label="Order"><input type="number" className="input" value={edit.order} onChange={(e) => set('order', e.target.value)} /></Field>
            <Field label="Colour"><input type="color" className="input h-11" value={edit.color} onChange={(e) => set('color', e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon-700" checked={!!edit.isPopular} onChange={(e) => set('isPopular', e.target.checked)} />Most popular</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon-700" checked={!!edit.isActive} onChange={(e) => set('isActive', e.target.checked)} />Active</label>
            <button onClick={save} className="btn-primary sm:col-span-2">Save plan</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
