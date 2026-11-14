import { Link } from 'react-router-dom';

export default function Logo({ light = false, size = 44, to = '/' }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2" aria-label="Meena Shadi Rishtey – Home">
      <img src="/brand/logo.svg" alt="MSR" width={size} height={size} className="shrink-0 rounded-full shadow-md" />
      <div className="min-w-0 whitespace-nowrap leading-tight">
        <div className={`font-display text-[15px] font-bold sm:text-lg sm:tracking-wide ${light ? 'text-white' : 'text-maroon-800'}`}>Meena Shadi Rishtey</div>
        <div className={`font-hindi text-[11px] font-semibold sm:text-xs ${light ? 'text-gold-300' : 'text-gold-600'}`}>मीणा शादी रिश्ते</div>
      </div>
    </Link>
  );
}
