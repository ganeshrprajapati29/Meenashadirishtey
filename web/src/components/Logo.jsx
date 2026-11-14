import { Link } from 'react-router-dom';

export default function Logo({ light = false, size = 44, to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Meena Shadi Rishtey – Home">
      <img src="/brand/logo.svg" alt="MSR" width={size} height={size} className="rounded-full shadow-md" />
      <div className="leading-tight">
        <div className={`font-display text-lg font-bold tracking-wide ${light ? 'text-white' : 'text-maroon-800'}`}>Meena Shadi Rishtey</div>
        <div className={`font-hindi text-xs font-semibold ${light ? 'text-gold-300' : 'text-gold-600'}`}>मीणा शादी रिश्ते</div>
      </div>
    </Link>
  );
}
