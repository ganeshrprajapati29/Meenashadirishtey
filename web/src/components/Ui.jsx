import { X, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-maroon-600 ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/brand/logo.svg" alt="" className="h-16 w-16 animate-pulse rounded-full" />
        <Spinner className="h-5 w-5" />
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {Icon && <div className="rounded-full bg-maroon-50 p-4"><Icon className="h-8 w-8 text-maroon-500" /></div>}
      <h3 className="text-lg font-semibold text-maroon-800">{title}</h3>
      {text && <p className="max-w-md text-sm text-gray-500">{text}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-maroon-100 bg-white px-5 py-3.5">
          <h3 className="font-display text-lg font-bold text-maroon-800">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-maroon-50" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder = 'Select', className = '', ...rest }) {
  return (
    <select className={`input ${className}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Prev</button>
      <span className="text-sm text-gray-600">{page} / {pages}</span>
      <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next ›</button>
    </div>
  );
}

export function Ornament() {
  return (
    <div className="ornament" aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-500" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.5 3 1.5 5 0 8-1.5-3-1.5-5 0-8Zm0 12c1.5 3 1.5 5 0 8-1.5-3-1.5-5 0-8ZM2 12c3-1.5 5-1.5 8 0-3 1.5-5 1.5-8 0Zm12 0c3-1.5 5-1.5 8 0-3 1.5-5 1.5-8 0Z"/></svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-500" />
    </div>
  );
}

export function SectionHeading({ title, sub, light = false }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 className={`section-title ${light ? '!text-white' : ''}`}>{title}</h2>
      <Ornament />
      {sub && <p className={`mt-3 text-sm sm:text-base ${light ? 'text-white/80' : 'text-gray-600'}`}>{sub}</p>}
    </div>
  );
}
