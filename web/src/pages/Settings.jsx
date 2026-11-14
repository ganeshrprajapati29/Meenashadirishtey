import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Languages, Ban, Trash2, Shield, Receipt } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, inr } from '../lib/format';

export default function Settings() {
  const { tt, lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/profiles/blocked').then((r) => setBlocked(r.items));
    api.get('/payments/history').then((r) => setPayments(r.items));
  }, []);

  const changeLang = (l) => { setLang(l); api.patch('/auth/me', { language: l }).catch(() => {}); };
  const unblock = async (id) => { await api.post(`/profiles/${id}/block`); setBlocked((b) => b.filter((x) => x.id !== id)); toast.success(tt('Unblocked', 'अनब्लॉक किया')); };
  const del = async () => {
    if (!window.confirm(tt('Delete your account permanently? This cannot be undone.', 'अपना अकाउंट हमेशा के लिए हटाएं? यह वापस नहीं होगा।'))) return;
    await api.delete('/auth/me');
    logout();
    toast.success(tt('Account deleted', 'अकाउंट हटा दिया गया'));
    navigate('/');
  };

  return (
    <div className="container-x max-w-3xl space-y-5 py-8">
      <h1 className="font-display text-3xl font-bold text-maroon-800">{tt('Settings', 'सेटिंग्स')}</h1>
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-maroon-800"><Shield className="h-5 w-5 text-gold-600" />{tt('Account', 'अकाउंट')}</h2>
        <div className="mt-3 text-sm text-gray-600">{tt('Mobile', 'मोबाइल')}: <b>+91 {user.phone}</b> · {tt('Member since', 'सदस्य')} {formatDate(user.createdAt)}</div>
        <p className="mt-2 text-xs text-gray-500">{tt('Photo & contact privacy can be changed in Edit Profile → Privacy.', 'फोटो व नंबर की गोपनीयता प्रोफाइल बदलें → गोपनीयता में बदलें।')}</p>
      </div>
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-maroon-800"><Languages className="h-5 w-5 text-gold-600" />{tt('Language', 'भाषा')}</h2>
        <div className="mt-3 flex gap-2">{[['hi', 'हिंदी'], ['en', 'English']].map(([k, l]) => <button key={k} onClick={() => changeLang(k)} className={`rounded-full px-5 py-2 text-sm font-semibold ${lang === k ? 'bg-maroon-700 text-white' : 'bg-maroon-50 text-maroon-700'}`}>{l}</button>)}</div>
      </div>
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-maroon-800"><Ban className="h-5 w-5 text-gold-600" />{tt('Blocked members', 'ब्लॉक किए गए सदस्य')}</h2>
        {!blocked.length ? <p className="mt-3 text-sm text-gray-500">{tt('No blocked members', 'कोई ब्लॉक सदस्य नहीं')}</p> : (
          <ul className="mt-3 divide-y divide-maroon-50">{blocked.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2"><div className="flex items-center gap-3"><img src={b.photo ? fileUrl(b.photo) : avatarFor()} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="text-sm font-medium">{b.fullName} <span className="text-gray-400">{b.profileId}</span></span></div>
              <button onClick={() => unblock(b.id)} className="btn-outline btn-sm">{tt('Unblock', 'अनब्लॉक')}</button></li>
          ))}</ul>
        )}
      </div>
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-maroon-800"><Receipt className="h-5 w-5 text-gold-600" />{tt('Payment history', 'भुगतान इतिहास')}</h2>
        {!payments.length ? <p className="mt-3 text-sm text-gray-500">{tt('No payments yet', 'अभी कोई भुगतान नहीं')}</p> : (
          <ul className="mt-3 divide-y divide-maroon-50 text-sm">{payments.map((p) => (
            <li key={p._id} className="flex justify-between py-2"><span>{p.planName} · {formatDate(p.createdAt)}</span><span className={p.status === 'paid' ? 'font-semibold text-emerald-700' : 'text-gray-500'}>{inr(p.amount)} · {p.status}</span></li>
          ))}</ul>
        )}
      </div>
      <div className="card border border-red-100 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-red-700"><Trash2 className="h-5 w-5" />{tt('Delete account', 'अकाउंट हटाएं')}</h2>
        <p className="mt-2 text-sm text-gray-500">{tt('Found your match? Congratulations! You can delete your account here.', 'रिश्ता मिल गया? बधाई हो! आप यहाँ अकाउंट हटा सकते हैं।')}</p>
        <button onClick={del} className="btn mt-3 border border-red-300 text-red-600 hover:bg-red-50">{tt('Delete my account', 'मेरा अकाउंट हटाएं')}</button>
      </div>
    </div>
  );
}
