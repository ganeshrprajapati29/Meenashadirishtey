import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { fileUrl } from '../lib/api';

/** Dynamic banners / ads from admin panel, rendered as an auto-rotating slider */
export default function BannerSlot({ placement, className = '', rounded = 'rounded-2xl' }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.get(`/public/banners?placement=${placement}`).then((r) => setItems(r.items || [])).catch(() => {});
  }, [placement]);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;

  const click = (b) => api.post(`/public/banners/${b._id}/click`).catch(() => {});

  return (
    <div className={`relative overflow-hidden ${rounded} shadow-card ${className}`}>
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {items.map((b) => {
          const inner = b.image ? (
            <img src={fileUrl(b.image)} alt={b.title} className="aspect-[16/5] w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex aspect-[16/5] w-full flex-col justify-center px-8 text-white" style={{ background: b.bgColor }}>
              <div className="font-display text-2xl font-bold">{b.title}</div>
              <div className="opacity-80">{b.subtitle}</div>
            </div>
          );
          const isExternal = b.link && /^https?:/.test(b.link);
          return (
            <div key={b._id} className="relative w-full shrink-0">
              {b.link ? (
                isExternal
                  ? <a href={b.link} target="_blank" rel="noreferrer" onClick={() => click(b)}>{inner}</a>
                  : <Link to={b.link} onClick={() => click(b)}>{inner}</Link>
              ) : inner}
              {b.isAd && <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white">Ad</span>}
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((b, i) => (
            <button key={b._id} onClick={() => setIdx(i)} aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
