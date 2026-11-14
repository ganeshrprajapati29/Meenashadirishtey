import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Crown, BadgeCheck, ShieldCheck, Phone, MessageCircle, Eye } from 'lucide-react';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { SectionHeading, Spinner } from '../components/Ui';
import { inr, formatDate } from '../lib/format';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Plans() {
  const { tt, lang } = useLang();
  const { user, refresh, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => { api.get('/payments/plans').then(setData); }, []);

  const buy = async (plan) => {
    if (!user || user.role !== 'user') return navigate('/login', { state: { from: '/plans' } });
    setBusy(plan._id);
    try {
      const r = await api.post('/payments/order', { planId: plan._id });
      if (r.mode === 'demo') {
        await refresh();
        toast.success(tt(`${plan.name} activated (demo mode)`, `${plan.nameHi || plan.name} सक्रिय (डेमो मोड)`));
        navigate('/dashboard');
        return;
      }
      if (!(await loadRazorpay())) throw new Error('Could not load payment gateway');
      const rz = new window.Razorpay({
        key: r.keyId,
        amount: r.order.amount,
        currency: 'INR',
        name: 'Meena Shadi Rishtey',
        description: `${plan.name} membership`,
        image: '/brand/logo.svg',
        order_id: r.order.id,
        prefill: { contact: user.phone, name: profile ? `${profile.firstName} ${profile.lastName || ''}` : '' },
        theme: { color: '#7A1F1F' },
        handler: async (resp) => {
          try {
            await api.post('/payments/verify', resp);
            await refresh();
            toast.success(tt('Payment successful! Premium activated 👑', 'भुगतान सफल! प्रीमियम सक्रिय 👑'));
            navigate('/dashboard');
          } catch (e) { toast.error(e.message); }
        },
      });
      rz.open();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="bg-gradient-to-b from-gold-50 to-cream py-14">
      <div className="container-x">
        <SectionHeading title={tt('Choose your membership', 'अपनी मेंबरशिप चुनें')} sub={tt('Connect faster with the right match. Secure payment.', 'सही रिश्ते से जल्दी जुड़ें। सुरक्षित भुगतान।')} />
        {user?.isPremium && (
          <div className="mx-auto mb-8 flex max-w-xl items-center gap-3 rounded-2xl bg-royal p-4 text-white shadow-card">
            <Crown className="h-8 w-8 text-gold-300" />
            <div className="text-sm">{tt('Your', 'आपका')} <b>{user.premium.planName}</b> {tt('plan is active till', 'प्लान सक्रिय है')} <b>{formatDate(user.premium.expiresAt)}</b> · {user.premium.contactsLeft} {tt('contacts left', 'नंबर बाकी')}</div>
          </div>
        )}
        {data?.paymentMode === 'demo' && (
          <div className="mx-auto mb-8 max-w-xl rounded-xl border border-dashed border-gold-400 bg-white p-3 text-center text-xs text-gold-800">{tt('Demo mode: payment gateway not connected yet – plans activate instantly for testing.', 'डेमो मोड: पेमेंट गेटवे अभी जुड़ा नहीं है – टेस्टिंग के लिए प्लान तुरंत सक्रिय होगा।')}</div>
        )}
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div> : (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {data.items.map((p) => (
              <div key={p._id} className={`card relative flex flex-col p-7 ${p.isPopular ? 'ring-2 ring-gold-500 md:-translate-y-3' : ''}`}>
                {p.isPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-shine px-4 py-1 text-xs font-bold text-maroon-900 shadow">{tt('Most Popular', 'सबसे लोकप्रिय')}</span>}
                <Crown className="h-9 w-9" style={{ color: p.color }} />
                <h3 className="mt-3 font-display text-2xl font-bold text-maroon-800">{lang === 'hi' && p.nameHi ? p.nameHi : p.name}</h3>
                <div className="mt-2 flex items-end gap-2"><span className="text-4xl font-bold text-ink">{inr(p.price)}</span>{p.mrp > p.price && <span className="pb-1 text-sm text-gray-400 line-through">{inr(p.mrp)}</span>}</div>
                <div className="text-sm text-gray-500">{p.durationDays} {tt('days', 'दिन')} · {p.contactLimit} {tt('contacts', 'नंबर')}</div>
                {p.mrp > p.price && <div className="mt-2 w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{Math.round((1 - p.price / p.mrp) * 100)}% OFF</div>}
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-gray-700">
                  {((lang === 'hi' && p.featuresHi?.length) ? p.featuresHi : p.features).map((f) => <li key={f} className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}
                </ul>
                <button onClick={() => buy(p)} disabled={busy === p._id} className={`${p.isPopular ? 'btn-gold' : 'btn-primary'} mt-6 w-full py-3`}>
                  {busy === p._id ? <Spinner className="h-4 w-4" /> : tt('Buy now', 'अभी खरीदें')}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-4">
          {[[Phone, tt('View contacts', 'नंबर देखें')], [MessageCircle, tt('Unlimited chat', 'अनलिमिटेड चैट')], [Eye, tt('See visitors', 'विज़िटर देखें')], [ShieldCheck, tt('Secure payment', 'सुरक्षित भुगतान')]].map(([I, l]) => (
            <div key={l} className="flex flex-col items-center gap-2 text-center text-sm font-medium text-maroon-800"><div className="rounded-full bg-white p-3 shadow-card"><I className="h-6 w-6 text-gold-600" /></div>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
