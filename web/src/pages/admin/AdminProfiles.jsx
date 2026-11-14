import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Check, X, BadgeCheck, Star, Trash2, Eye } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../../lib/api';
import { Modal, Pagination, Spinner } from '../../components/Ui';
import { cmToFeet, formatDate } from '../../lib/format';
import { label } from '../../lib/i18n';

const STATUS_COLORS = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-700' };

function Detail({ id, onClose, onChanged }) {
  const [p, setP] = useState(null);
  const [reason, setReason] = useState('');
  const load = () => api.get(`/admin/profiles/${id}`).then((r) => setP(r.profile));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  const act = async (action) => {
    try {
      if (action === 'reject' && !reason.trim()) return toast.error('Write a reason for rejection');
      await api.patch(`/admin/profiles/${id}`, { action, reason });
      toast.success(`Done: ${action}`);
      load(); onChanged();
    } catch (e) { toast.error(e.message); }
  };
  const delPhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    await api.delete(`/admin/profiles/${id}/photos/${photoId}`); load();
  };
  if (!p) return <div className="flex justify-center py-10"><Spinner /></div>;
  const rows = [
    ['Profile ID', p.profileId], ['Phone', p.account?.phone], ['Created for', p.createdFor], ['Gender', p.gender], ['DOB', `${formatDate(p.dob)} (${p.age} yrs)`],
    ['Height', p.height && `${cmToFeet(p.height)} (${p.height}cm)`], ['Marital', label('maritalStatus', p.maritalStatus)], ['Gotra', p.gotra],
    ["Mother's gotra", p.motherGotra], ["Dadi's gotra", p.dadiGotra], ["Nani's gotra", p.naniGotra], ['Education', [p.education, p.educationDetail].filter(Boolean).join(' – ')],
    ['Employed in', label('employedIn', p.employedIn)], ['Occupation', [p.occupation, p.occupationDetail].filter(Boolean).join(' – ')], ['Income', p.annualIncome],
    ['Location', [p.city, p.district, p.state, p.country].filter(Boolean).join(', ')], ['Father', [p.family?.fatherName, p.family?.fatherOccupation].filter(Boolean).join(' – ')],
    ['Mother', [p.family?.motherName, p.family?.motherOccupation].filter(Boolean).join(' – ')], ['Completeness', `${p.completeness}%`], ['Joined', formatDate(p.createdAt)],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_COLORS[p.status]}`}>{p.status}</span>
        {p.isVerified && <span className="chip !bg-sky-50 !text-sky-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
        {p.isFeatured && <span className="chip-gold"><Star className="h-3 w-3" />Featured</span>}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {p.photos.length ? p.photos.map((ph) => (
          <div key={ph._id} className="relative shrink-0"><a href={fileUrl(ph.url)} target="_blank" rel="noreferrer"><img src={fileUrl(ph.url)} alt="" className="h-36 w-28 rounded-lg object-cover" /></a>
            <button onClick={() => delPhoto(ph._id)} className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"><Trash2 className="h-3.5 w-3.5 text-red-600" /></button></div>
        )) : <div className="text-sm text-gray-500">No photos</div>}
      </div>
      <div className="grid gap-x-6 text-sm sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-dashed border-maroon-100 py-1.5"><span className="text-gray-500">{k}</span><span className="text-right font-medium">{v}</span></div>)}
      </div>
      {p.about && <p className="rounded-lg bg-maroon-50 p-3 text-sm">{p.about}</p>}
      <div className="space-y-3 border-t border-maroon-100 pt-4">
        <div className="flex flex-wrap gap-2">
          {p.status !== 'approved' && <button onClick={() => act('approve')} className="btn-primary btn-sm"><Check className="h-4 w-4" />Approve</button>}
          <button onClick={() => act(p.isVerified ? 'unverify' : 'verify')} className="btn-outline btn-sm"><BadgeCheck className="h-4 w-4" />{p.isVerified ? 'Remove verified' : 'Mark verified'}</button>
          <button onClick={() => act(p.isFeatured ? 'unfeature' : 'feature')} className="btn-outline btn-sm"><Star className="h-4 w-4" />{p.isFeatured ? 'Unfeature' : 'Feature'}</button>
          <a href={`/profile/${p.profileId}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Eye className="h-4 w-4" />Public view</a>
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder="Rejection reason (shown to member)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button onClick={() => act('reject')} className="btn shrink-0 border border-red-300 text-red-600 hover:bg-red-50"><X className="h-4 w-4" />Reject</button>
        </div>
      </div>
      <button onClick={onClose} className="btn-ghost w-full">Close</button>
    </div>
  );
}

export default function AdminProfiles() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  const load = () => api.get(`/admin/profiles?status=${status}&page=${page}&q=${encodeURIComponent(params.get('q') || '')}`).then(setData);
  useEffect(() => { setData(null); load(); /* eslint-disable-next-line */ }, [params]);

  const quick = async (id, action) => { try { await api.patch(`/admin/profiles/${id}`, { action }); toast.success('Approved'); load(); } catch (e) { toast.error(e.message); } };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-maroon-800">Profiles & Approvals</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([k, l]) => (
          <button key={k} onClick={() => setParams(k ? { status: k } : {})} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === k ? 'bg-maroon-700 text-white' : 'bg-white text-gray-600'}`}>{l}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setParams({ ...(status && { status }), q }); }} className="ml-auto flex gap-2">
          <input className="input !py-2" placeholder="Name, MSR id, gotra, district" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary btn-sm"><Search className="h-4 w-4" /></button>
        </form>
      </div>
      <div className="card mt-5 overflow-x-auto">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-maroon-50 text-left text-xs uppercase text-maroon-800"><tr>{['Profile', 'Gotra', 'Education / Job', 'Location', 'Status', 'Joined', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-maroon-50">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-cream">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={p.photo ? fileUrl(p.photo) : avatarFor(p.gender)} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <div><div className="font-semibold">{p.fullName} {p.isVerified && <BadgeCheck className="inline h-4 w-4 text-sky-600" />}</div><div className="text-xs text-gray-500">{p.profileId} · {p.gender === 'male' ? 'M' : 'F'} · {p.age}y · {p.phone}</div></div></div></td>
                  <td className="px-4 py-3">{p.gotra}</td>
                  <td className="px-4 py-3 text-xs">{p.education}<br />{p.occupation}</td>
                  <td className="px-4 py-3 text-xs">{[p.district, p.state].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    {p.status === 'pending' && <button onClick={() => quick(p.id, 'approve')} className="btn-primary btn-sm"><Check className="h-3.5 w-3.5" />Approve</button>}
                    <button onClick={() => setOpen(p.id)} className="btn-outline btn-sm">Review</button></div></td>
                </tr>
              ))}
              {!data.items.length && <tr><td colSpan={7} className="py-12 text-center text-gray-500">No profiles</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pages={data.pages} onChange={(pg) => setParams({ ...Object.fromEntries(params), page: pg })} />}
      <Modal open={!!open} onClose={() => setOpen(null)} title="Profile review" wide>{open && <Detail id={open} onClose={() => setOpen(null)} onChanged={load} />}</Modal>
    </div>
  );
}
