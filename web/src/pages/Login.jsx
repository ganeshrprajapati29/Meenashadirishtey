import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, ShieldCheck, KeyRound, ArrowLeft, Copy } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Spinner } from '../components/Ui';

export default function Login() {
  const { tt } = useLang();
  const { loginWithToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [screenOtp, setScreenOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (user?.role === 'user') navigate(user.hasProfile ? '/dashboard' : '/create-profile', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error(tt('Enter a valid 10 digit mobile number', 'सही 10 अंकों का मोबाइल नंबर डालें'));
    setBusy(true);
    try {
      const r = await api.post('/auth/send-otp', { phone });
      setScreenOtp(r.otp || null);
      setStep('otp');
      setTimer(r.resendIn || 30);
      setOtp(['', '', '', '', '', '']);
      toast.success(tt('OTP sent', 'OTP भेजा गया'));
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const verify = async (code) => {
    setBusy(true);
    try {
      const r = await api.post('/auth/verify-otp', { phone, otp: code });
      const me = await loginWithToken(r.token);
      toast.success(tt('Welcome to MSR!', 'MSR में आपका स्वागत है!'));
      const from = location.state?.from;
      navigate(me?.user?.hasProfile ? (from || '/dashboard') : '/create-profile', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setBusy(false); }
  };

  const onDigit = (i, v) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length > 1) { // paste
      const arr = digits.slice(0, 6).split('');
      const next = [...otp];
      arr.forEach((d, k) => { if (i + k < 6) next[i + k] = d; });
      setOtp(next);
      if (next.every(Boolean)) verify(next.join(''));
      else inputs.current[Math.min(i + arr.length, 5)]?.focus();
      return;
    }
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const fillScreenOtp = () => {
    const arr = screenOtp.split('');
    setOtp(arr);
    verify(screenOtp);
  };

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-royal py-12">
      <div className="pattern-bg absolute inset-0 opacity-40" />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-2">
        <div className="hidden text-white lg:block">
          <img src="/brand/logo.svg" alt="MSR" className="h-28 w-28 rounded-full shadow-2xl" />
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight">{tt('Your journey to a happy married life starts here', 'खुशहाल वैवाहिक जीवन की शुरुआत यहीं से')}</h1>
          <ul className="mt-8 space-y-3 text-white/85">
            {[tt('Free registration with mobile OTP', 'मोबाइल OTP से फ्री रजिस्ट्रेशन'), tt('Gotra-aware matching', 'गोत्र अनुसार मिलान'), tt('Your number stays private', 'आपका नंबर सुरक्षित रहता है')].map((x) => (
              <li key={x} className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-gold-300" />{x}</li>
            ))}
          </ul>
        </div>

        <div className="card mx-auto w-full max-w-md p-7 sm:p-9">
          {step === 'phone' ? (
            <form onSubmit={sendOtp}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50"><Phone className="h-7 w-7 text-maroon-700" /></div>
              <h2 className="mt-4 text-center font-display text-2xl font-bold text-maroon-800">{tt('Login / Register', 'लॉगिन / रजिस्टर')}</h2>
              <p className="mt-1 text-center text-sm text-gray-500">{tt('Enter your mobile number to continue', 'आगे बढ़ने के लिए मोबाइल नंबर डालें')}</p>
              <div className="mt-6 flex overflow-hidden rounded-xl border border-maroon-200 focus-within:border-maroon-500 focus-within:ring-4 focus-within:ring-maroon-100">
                <span className="flex items-center border-r border-maroon-100 bg-maroon-50 px-3 text-sm font-semibold text-maroon-700">+91</span>
                <input type="tel" inputMode="numeric" autoFocus maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210" className="w-full px-3 py-3 text-lg tracking-wider outline-none" />
              </div>
              <button className="btn-primary mt-5 w-full py-3" disabled={busy}>{busy ? <Spinner className="h-4 w-4 !text-white" /> : tt('Get OTP', 'OTP प्राप्त करें')}</button>
              <p className="mt-5 text-center text-xs text-gray-500">
                {tt('By continuing you agree to our', 'आगे बढ़कर आप हमारी')} <Link to="/terms" className="text-maroon-700 underline">{tt('Terms', 'शर्तें')}</Link> & <Link to="/privacy" className="text-maroon-700 underline">{tt('Privacy Policy', 'गोपनीयता नीति')}</Link> {tt('', 'से सहमत हैं')}
              </p>
            </form>
          ) : (
            <div>
              <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm text-maroon-700"><ArrowLeft className="h-4 w-4" /> {tt('Change number', 'नंबर बदलें')}</button>
              <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50"><KeyRound className="h-7 w-7 text-maroon-700" /></div>
              <h2 className="mt-4 text-center font-display text-2xl font-bold text-maroon-800">{tt('Verify OTP', 'OTP सत्यापित करें')}</h2>
              <p className="mt-1 text-center text-sm text-gray-500">{tt('Enter the 6 digit code sent to', '6 अंकों का कोड डालें जो भेजा गया')} <b>+91 {phone}</b></p>

              {screenOtp && (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gold-800">{tt('Your OTP', 'आपका OTP')}</div>
                  <div className="mt-1 font-mono text-4xl font-bold tracking-[0.35em] text-maroon-800">{screenOtp}</div>
                  <button onClick={fillScreenOtp} className="btn-gold btn-sm mt-3"><Copy className="h-3.5 w-3.5" /> {tt('Auto-fill OTP', 'OTP भरें')}</button>
                </div>
              )}

              <div className="mt-6 flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input key={i} ref={(el) => (inputs.current[i] = el)} value={d} inputMode="numeric" maxLength={6}
                    onChange={(e) => onDigit(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus(); }}
                    className="h-14 w-12 rounded-xl border-2 border-maroon-200 text-center text-2xl font-bold text-maroon-800 outline-none focus:border-maroon-600 focus:ring-4 focus:ring-maroon-100" />
                ))}
              </div>
              <button className="btn-primary mt-6 w-full py-3" disabled={busy || otp.some((d) => !d)} onClick={() => verify(otp.join(''))}>
                {busy ? <Spinner className="h-4 w-4 !text-white" /> : tt('Verify & Continue', 'सत्यापित करें')}
              </button>
              <div className="mt-4 text-center text-sm text-gray-500">
                {timer > 0 ? <>{tt('Resend OTP in', 'OTP दोबारा भेजें')} <b>{timer}s</b></> : <button onClick={sendOtp} className="font-semibold text-maroon-700">{tt('Resend OTP', 'OTP दोबारा भेजें')}</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
