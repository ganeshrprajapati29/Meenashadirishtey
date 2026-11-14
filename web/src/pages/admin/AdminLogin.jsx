import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Ui';

export default function AdminLogin() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const r = await api.post('/auth/admin/login', f); await loginWithToken(r.token); navigate('/admin'); } catch (er) { toast.error(er.message); } finally { setBusy(false); }
  };
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-royal p-4">
      <div className="pattern-bg absolute inset-0 opacity-40" />
      <form onSubmit={submit} className="card relative w-full max-w-sm p-8">
        <img src="/brand/logo.svg" alt="" className="mx-auto h-20 w-20 rounded-full" />
        <h1 className="mt-4 text-center font-display text-2xl font-bold text-maroon-800">Admin Panel</h1>
        <p className="text-center text-sm text-gray-500">Meena Shadi Rishtey</p>
        <div className="mt-6 space-y-3">
          <input className="input" type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner className="h-4 w-4 !text-white" /> : <><Lock className="h-4 w-4" />Login</>}</button>
        </div>
      </form>
    </div>
  );
}
