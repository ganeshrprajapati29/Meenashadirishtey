import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Inbox, Check, X, MessageCircle, Trash2 } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { Empty, Pagination, Spinner } from '../components/Ui';
import { timeAgo } from '../lib/format';

export default function Interests() {
  const { tt, lang, label } = useLang();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'received';
  const page = Number(params.get('page')) || 1;
  const [data, setData] = useState(null);

  const load = () => { setData(null); api.get(`/interests?tab=${tab}&page=${page}`).then(setData).catch(() => setData({ items: [] })); };
  useEffect(load, [tab, page]);

  const respond = async (id, action) => {
    try { await api.patch(`/interests/${id}`, { action }); toast.success(action === 'accept' ? tt('Interest accepted 🎉', 'रुचि स्वीकार की 🎉') : tt('Declined', 'अस्वीकार किया')); load(); } catch (e) { toast.error(e.message); }
  };
  const cancel = async (id) => {
    try { await api.delete(`/interests/${id}`); toast.success(tt('Interest withdrawn', 'रुचि वापस ली')); load(); } catch (e) { toast.error(e.message); }
  };

  const tabs = [['received', tt('Received', 'प्राप्त')], ['sent', tt('Sent', 'भेजी गई')], ['accepted', tt('Connected', 'जुड़े हुए')], ['declined', tt('Declined', 'अस्वीकृत')]];

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-bold text-maroon-800">{tt('Interests', 'रुचि')}</h1>
      <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setParams({ tab: k })} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold ${tab === k ? 'bg-maroon-700 text-white' : 'bg-white text-gray-600'}`}>{l}</button>)}
      </div>
      <div className="mt-6">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
          : !data.items.length ? <Empty icon={Inbox} title={tt('Nothing here yet', 'अभी यहाँ कुछ नहीं')} text={tab === 'received' ? tt('Complete your profile with photos to receive more interests.', 'ज़्यादा रुचि पाने के लिए फोटो के साथ प्रोफाइल पूरी करें।') : ''} action={<Link to="/matches" className="btn-primary btn-sm">{tt('Find matches', 'रिश्ते खोजें')}</Link>} />
          : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.items.map((it) => {
                const p = it.profile;
                return (
                  <div key={it.id} className="card flex gap-4 p-4">
                    <Link to={`/profile/${p.profileId}`} className="shrink-0"><img src={p.photo ? fileUrl(p.photo) : avatarFor(p.gender)} alt="" className={`h-28 w-24 rounded-xl object-cover ${p.photoLocked ? 'blur-sm' : ''}`} /></Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${p.profileId}`} className="font-semibold text-maroon-800 hover:underline">{p.firstName} {p.lastName}</Link>
                      <div className="text-xs text-gray-500">{p.profileId} · {p.age} {tt('yrs', 'वर्ष')} · {p.gotra}</div>
                      <div className="mt-1 truncate text-sm text-gray-600">{[p.education, p.occupation || label('employedIn', p.employedIn), p.district].filter(Boolean).join(' · ')}</div>
                      {it.message && <div className="mt-2 rounded-lg bg-maroon-50 px-3 py-2 text-xs italic text-maroon-800">“{it.message}”</div>}
                      <div className="mt-1 text-[11px] text-gray-400">{timeAgo(it.createdAt, lang)}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tab === 'received' && <>
                          <button onClick={() => respond(it.id, 'accept')} className="btn-primary btn-sm"><Check className="h-3.5 w-3.5" />{tt('Accept', 'स्वीकार')}</button>
                          <button onClick={() => respond(it.id, 'decline')} className="btn-outline btn-sm"><X className="h-3.5 w-3.5" />{tt('Decline', 'अस्वीकार')}</button>
                        </>}
                        {tab === 'sent' && <button onClick={() => cancel(it.id)} className="btn-outline btn-sm"><Trash2 className="h-3.5 w-3.5" />{tt('Withdraw', 'वापस लें')}</button>}
                        {tab === 'accepted' && <Link to={`/chat/${p.userId}`} className="btn-gold btn-sm"><MessageCircle className="h-3.5 w-3.5" />{tt('Chat', 'चैट')}</Link>}
                        {tab === 'declined' && it.direction === 'received' && <button onClick={() => respond(it.id, 'accept')} className="btn-outline btn-sm">{tt('Accept now', 'अब स्वीकार करें')}</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        {data && <Pagination page={page} pages={data.pages} onChange={(pg) => setParams({ tab, page: pg })} />}
      </div>
    </div>
  );
}
