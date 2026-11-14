import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Field, Pagination, Select } from '../../components/Ui';
import { formatDate, inr } from '../../lib/format';

export function AdminPayments() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/admin/payments?page=${page}`).then(setData); }, [page]);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-maroon-800">Payments</h1>
      <div className="card mt-5 overflow-x-auto">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-maroon-50 text-left text-xs uppercase text-maroon-800"><tr>{['Date', 'Member', 'Plan', 'Amount', 'Mode', 'Status', 'Ref'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-maroon-50">
              {data.items.map((p) => (
                <tr key={p._id}><td className="px-4 py-3">{formatDate(p.createdAt)}</td><td className="px-4 py-3 font-mono">{p.user?.phone}</td><td className="px-4 py-3">{p.planName}</td><td className="px-4 py-3 font-semibold">{inr(p.amount)}</td>
                  <td className="px-4 py-3"><span className="chip">{p.mode}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.paymentId || p.orderId || p.note}</td></tr>
              ))}
              {!data.items.length && <tr><td colSpan={7} className="py-12 text-center text-gray-500">No payments yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}

export function AdminReports() {
  const [status, setStatus] = useState('open');
  const [data, setData] = useState(null);
  const load = () => api.get(`/admin/reports?status=${status}`).then(setData);
  useEffect(() => { setData(null); load(); /* eslint-disable-next-line */ }, [status]);
  const update = async (r, body) => { try { await api.patch(`/admin/reports/${r._id}`, body); toast.success('Updated'); load(); } catch (e) { toast.error(e.message); } };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-maroon-800">Reports</h1>
      <div className="mt-5 flex gap-2">{['open', 'resolved', 'dismissed'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${status === s ? 'bg-maroon-700 text-white' : 'bg-white text-gray-600'}`}>{s}</button>)}</div>
      <div className="mt-5 space-y-3">
        {!data ? <Spinner className="h-8 w-8" /> : !data.items.length ? <div className="card p-10 text-center text-gray-500">No reports</div> : data.items.map((r) => (
          <div key={r._id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="text-sm">
              <div className="font-semibold">{r.reportedProfile ? `${r.reportedProfile.firstName} ${r.reportedProfile.lastName || ''} (${r.reportedProfile.profileId})` : 'Profile removed'} <span className="chip !bg-red-50 !text-red-700">{r.reason.replace('_', ' ')}</span></div>
              <div className="text-xs text-gray-500">Reported by {r.reporter?.phone} · {formatDate(r.createdAt)} · reported user status: {r.reportedUser?.status}</div>
              {r.details && <div className="mt-1 text-gray-600">{r.details}</div>}
            </div>
            {r.status === 'open' && <div className="flex gap-2">
              <a href={`/profile/${r.reportedProfile?.profileId}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">View</a>
              <button onClick={() => update(r, { status: 'resolved', blockUser: true })} className="btn btn-sm border border-red-300 text-red-600">Block user</button>
              <button onClick={() => update(r, { status: 'resolved' })} className="btn-primary btn-sm">Resolve</button>
              <button onClick={() => update(r, { status: 'dismissed' })} className="btn-outline btn-sm">Dismiss</button></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminEnquiries() {
  const [items, setItems] = useState(null);
  const load = () => api.get('/admin/enquiries').then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  const set = async (e, status) => { await api.patch(`/admin/enquiries/${e._id}`, { status }); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-maroon-800">Enquiries</h1>
      <div className="mt-5 space-y-3">
        {!items ? <Spinner className="h-8 w-8" /> : !items.length ? <div className="card p-10 text-center text-gray-500">No enquiries</div> : items.map((e) => (
          <div key={e._id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">{e.name} · <a className="font-mono text-maroon-700" href={`tel:${e.phone}`}>{e.phone}</a> {e.email && <span className="text-sm text-gray-500">· {e.email}</span>}</div>
              <Select className="!w-auto !py-1.5" value={e.status} onChange={(v) => set(e, v)} options={['new', 'contacted', 'closed']} placeholder="status" /></div>
            <p className="mt-2 text-sm text-gray-600">{e.message}</p><div className="mt-1 text-xs text-gray-400">{formatDate(e.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [s, setS] = useState(null);
  const [b, setB] = useState({ title: '', body: '', link: '' });
  useEffect(() => { api.get('/admin/settings').then((r) => setS({ ...r.settings, gotraList: (r.settings.gotraList || []).join(', ') })); }, []);
  const save = async () => { try { await api.put('/admin/settings', s); toast.success('Settings saved'); } catch (e) { toast.error(e.message); } };
  const broadcast = async () => { try { const r = await api.post('/admin/broadcast', b); toast.success(`Sent to ${r.sent} members`); setB({ title: '', body: '', link: '' }); } catch (e) { toast.error(e.message); } };
  if (!s) return <Spinner className="h-8 w-8" />;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const fields = [['siteName', 'Site name'], ['tagline', 'Tagline'], ['contactPhone', 'Contact phone'], ['whatsapp', 'WhatsApp (with country code, digits only)'], ['email', 'Email'], ['address', 'Address'],
    ['instagram', 'Instagram URL'], ['facebook', 'Facebook URL'], ['youtube', 'YouTube URL'], ['playStoreUrl', 'Play Store URL'], ['announcement', 'Announcement (app)']];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-maroon-800">Settings</h1>
      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        {fields.map(([k, l]) => <Field key={k} label={l}><input className="input" value={s[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>)}
        <Field label="OTP mode" hint="Screen = OTP shown on screen (demo). SMS = sent by SMS provider configured on server.">
          <Select value={s.otpMode || 'screen'} onChange={(v) => set('otpMode', v)} placeholder="screen" options={[{ value: 'screen', label: 'Show on screen' }, { value: 'sms', label: 'Send SMS' }]} />
        </Field>
        <Field label="Gotra suggestions (comma separated)" className="sm:col-span-2"><textarea rows={3} className="input" value={s.gotraList || ''} onChange={(e) => set('gotraList', e.target.value)} placeholder="Leave empty to use default list" /></Field>
        <button onClick={save} className="btn-primary sm:col-span-2">Save settings</button>
      </div>
      <div className="card space-y-3 p-6">
        <h2 className="font-semibold text-maroon-800">Send notification to all members</h2>
        <input className="input" placeholder="Title" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Message" value={b.body} onChange={(e) => setB({ ...b, body: e.target.value })} />
        <input className="input" placeholder="Link (optional, e.g. /plans)" value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} />
        <button onClick={broadcast} disabled={!b.title} className="btn-gold"><Send className="h-4 w-4" />Send to all</button>
      </div>
    </div>
  );
}
