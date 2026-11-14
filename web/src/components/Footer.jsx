import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

const brand = (d) => function BrandIcon({ className }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d={d} /></svg>;
};
const Instagram = brand('M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z');
const Facebook = brand('M14 8V6.1c0-.9.2-1.4 1.6-1.4H18V1.2C17.6 1.1 16.2 1 14.6 1 11.2 1 9.6 3 9.6 6v2H6.5v3.6h3.1V23H14V11.6h3.1l.5-3.6H14z');
const Youtube = brand('M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z');
import { useEffect, useState } from 'react';
import Logo from './Logo';
import api from '../lib/api';
import { useLang } from '../context/LangContext';

export function useSiteSettings() {
  const [s, setS] = useState({});
  useEffect(() => { api.get('/public/settings').then((r) => setS(r.settings || {})).catch(() => {}); }, []);
  return s;
}

export default function Footer() {
  const { tt } = useLang();
  const s = useSiteSettings();
  return (
    <footer className="relative mt-16 overflow-hidden bg-royal text-white">
      <div className="pattern-bg absolute inset-0 opacity-40" />
      <div className="container-x relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            {tt('Our mission is to help Meena families in India and abroad find suitable matches easily and safely.',
              'हमारा उद्देश्य है कि हम मीणा समाज के लोगों को देश-विदेश में शादी के लिए रिश्ते आसानी से उपलब्ध कराएं।')}
          </p>
          <div className="mt-5 flex gap-3">
            {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
            {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>}
            {s.youtube && <a href={s.youtube} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>}
          </div>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-gold-300">{tt('Quick Links', 'उपयोगी लिंक')}</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/login" className="hover:text-gold-300">{tt('Register Free', 'फ्री रजिस्टर')}</Link></li>
            <li><Link to="/matches" className="hover:text-gold-300">{tt('Search Matches', 'रिश्ते खोजें')}</Link></li>
            <li><Link to="/plans" className="hover:text-gold-300">{tt('Membership Plans', 'मेंबरशिप प्लान')}</Link></li>
            <li><Link to="/stories" className="hover:text-gold-300">{tt('Success Stories', 'सफल रिश्ते')}</Link></li>
            <li><Link to="/about" className="hover:text-gold-300">{tt('About Us', 'हमारे बारे में')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-gold-300">{tt('Help & Safety', 'सहायता व सुरक्षा')}</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/safety" className="hover:text-gold-300">{tt('Safety Tips', 'सुरक्षा सुझाव')}</Link></li>
            <li><Link to="/privacy" className="hover:text-gold-300">{tt('Privacy Policy', 'गोपनीयता नीति')}</Link></li>
            <li><Link to="/terms" className="hover:text-gold-300">{tt('Terms & Conditions', 'नियम व शर्तें')}</Link></li>
            <li><Link to="/contact" className="hover:text-gold-300">{tt('Contact Us', 'संपर्क करें')}</Link></li>
            <li><Link to="/contact" className="hover:text-gold-300">{tt('Advertise with us', 'विज्ञापन दें')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-gold-300">{tt('Contact', 'संपर्क')}</h4>
          <ul className="space-y-3 text-sm text-white/80">
            {s.contactPhone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold-300" />{s.contactPhone}</li>}
            {s.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold-300" />{s.email}</li>}
            {s.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-300" />{s.address}</li>}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Meena Shadi Rishtey (MSR). {tt('All rights reserved.', 'सर्वाधिकार सुरक्षित।')}
      </div>
    </footer>
  );
}
