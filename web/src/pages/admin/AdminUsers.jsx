import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Crown, Ban, CheckCircle } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../../lib/api';
import { Modal, Pagination, Spinner, Select } from '../../components/Ui';
import { formatDate, timeAgo } from '../../lib/format';

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const [q, setQ] = useState(params.get('q') || '');
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [premiumFor, setPremiumFor] = useState(null);
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');

  const load = () => {
    const sp = new URLSearchParams(params); sp.set('page', page);
    api.get(`/admin/users?${sp}`).then(setData);
  };
  useEffect(() => { setData(null); load(); /* eslint-disable-next-line */ }, [params]);
  useEffect(() => { api.get('/admin/plans').then((r) => setPlans(r.items)); }, []);

  const setStatus = async (u, status) => {
    if (!window.confirm(`${status === 'blocked' ? 'Block' : 'Unblock'} ${u.phone}?`)) return;
    try { await api.patch(`/admin/users/${u.id}/status`, { status }); toast.success('Updated'); load(); } catch (e) { toast.error(e.message); }
  };
  const give = async () => {
    try { await api.post(`/admin/users/${premiumFor.id}/premium`, { planId, amount: amount || undefined, note: 'Offline payment' }); toast.success('Premium activated'); setPremiumFor(null); load(); } catch (e) { toast.error(e.message); }
  };
  const remove = async (u) => { if (!window.confirm('Remove premium?')) return; await api.delete(`/admin/users/${u.id}/premium`); load(); };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-maroon-800">Members</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[['', 'All'], ['premium', 'Premium'], ['blocked', 'Blocked']].map(([k, l]) => {
          const active = (k === 'premium' && params.get('premium') === 'true') || (k === 'blocked' && params.get('status') === 'blocked') || (!k && !params.get('premium') && !params.get('status'));
          return <button key={k} onClick={() => setParams(k === 'premium' ? { premium: 'true' } : k === 'blocked' ? { status: 'blocked' } : {})} className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? 'bg-maroon-700 text-white' : 'bg-white text-gray-600'}`}>{l}</button>;
        })}
        <form onSubmit={(e) => { e.preventDefault(); setParams({ q }); }} className="ml-auto flex gap-2">
          <input className="input !py-2" placeholder="Phone, name, MSR id" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary btn-sm"><Search className="h-4 w-4" /></button>
        </form>
      </div>
      <div className="card mt-5 overflow-x-auto">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-maroon-50 text-left text-xs uppercase text-maroon-800"><tr>{['Member', 'Phone', 'Profile', 'Membership', 'Last active', 'Status', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-maroon-50">
              {data.items.map((u) => (
                <tr key={u.id} className="hover:bg-cream">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={u.profile?.photo ? fileUrl(u.profile.photo) : avatarFor(u.profile?.gender)} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div><div className="font-semibold">{u.profile?.fullName || '—'}</div><div className="text-xs text-gray-500">Joined {formatDate(u.createdAt)}</div></div></div></td>
                  <td className="px-4 py-3 font-mono">{u.phone}</td>
                  <td className="px-4 py-3 text-xs">{u.profile ? <>{u.profile.profileId}<br /><span className="text-gray-500">{u.profile.status}</span></> : <span className="text-gray-400">Not created</span>}</td>
                  <td className="px-4 py-3 text-xs">{u.isPremium ? <span className="chip-gold"><Crown className="h-3 w-3" />{u.premium.planName} · {formatDate(u.premium.expiresAt)}</span> : 'Free'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(u.lastActive)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    {u.isPremium ? <button onClick={() => remove(u)} className="btn-outline btn-sm">Remove premium</button>
                      : <button onClick={() => { setPremiumFor(u); setPlanId(plans[0]?._id || ''); }} className="btn-gold btn-sm"><Crown className="h-3.5 w-3.5" />Premium</button>}
                    {u.status === 'active' ? <button onClick={() => setStatus(u, 'blocked')} className="btn btn-sm border border-red-300 text-red-600"><Ban className="h-3.5 w-3.5" /></button>
                      : <button onClick={() => setStatus(u, 'active')} className="btn btn-sm border border-emerald-300 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /></button>}
                  </div></td>
                </tr>
              ))}
              {!data.items.length && <tr><td colSpan={7} className="py-12 text-center text-gray-500">No members</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pages={data.pages} onChange={(pg) => setParams({ ...Object.fromEntries(params), page: pg })} />}
      <Modal open={!!premiumFor} onClose={() => setPremiumFor(null)} title="Activate premium (offline payment)">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Member: <b>{premiumFor?.profile?.fullName || premiumFor?.phone}</b></div>
          <Select value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p._id, label: `${p.name} – ₹${p.price} / ${p.durationDays} days` }))} />
          <input className="input" type="number" placeholder="Amount received (optional)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={give} disabled={!planId} className="btn-gold w-full">Activate</button>
        </div>
      </Modal>
    </div>
  );
}
