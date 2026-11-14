import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Star, Trash2, Upload } from 'lucide-react';
import api, { fileUrl } from '../lib/api';
import { useLang } from '../context/LangContext';
import { Spinner } from './Ui';

export default function PhotoManager({ photos = [], onChange }) {
  const { tt } = useLang();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].slice(0, 6 - photos.length).forEach((f) => fd.append('photos', f));
    setBusy(true);
    try {
      const r = await api.post('/profiles/me/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(r.photos);
      toast.success(tt('Photo uploaded', 'फोटो अपलोड हो गई'));
    } catch (e) { toast.error(e.message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const remove = async (id) => {
    if (!window.confirm(tt('Delete this photo?', 'यह फोटो हटाएं?'))) return;
    try { const r = await api.delete(`/profiles/me/photos/${id}`); onChange(r.photos); } catch (e) { toast.error(e.message); }
  };
  const primary = async (id) => {
    try { const r = await api.patch(`/profiles/me/photos/${id}/primary`); onChange(r.photos); toast.success(tt('Profile photo updated', 'प्रोफाइल फोटो बदली')); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p._id} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-maroon-50">
            <img src={fileUrl(p.url)} alt="" className="h-full w-full object-cover" />
            {p.isPrimary && <span className="chip-gold absolute left-2 top-2"><Star className="h-3 w-3 fill-current" /> {tt('Profile photo', 'प्रोफाइल फोटो')}</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
              {!p.isPrimary && <button type="button" onClick={() => primary(p._id)} className="rounded-full bg-white/90 p-2" title="Make profile photo"><Star className="h-4 w-4 text-gold-700" /></button>}
              <button type="button" onClick={() => remove(p._id)} className="rounded-full bg-white/90 p-2" title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
            </div>
          </div>
        ))}
        {photos.length < 6 && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-maroon-300 bg-maroon-50/50 text-maroon-700 transition hover:bg-maroon-50">
            {busy ? <Spinner className="h-6 w-6" /> : <Camera className="h-8 w-8" />}
            <span className="text-sm font-semibold">{tt('Add photo', 'फोटो जोड़ें')}</span>
            <span className="text-xs text-gray-500">{photos.length}/6</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      <p className="mt-3 flex items-center gap-2 text-xs text-gray-500"><Upload className="h-3.5 w-3.5" />{tt('Clear face photos get 10x more responses. JPG/PNG up to 8 MB.', 'साफ चेहरे वाली फोटो पर 10 गुना ज़्यादा जवाब मिलते हैं। JPG/PNG, 8 MB तक।')}</p>
    </div>
  );
}
