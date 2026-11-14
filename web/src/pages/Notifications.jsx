import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Heart, MessageCircle, Eye, BadgeCheck, AlertTriangle, Crown, Info } from 'lucide-react';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { Empty, Spinner, Pagination } from '../components/Ui';
import { timeAgo } from '../lib/format';

const ICONS = { interest_received: Heart, interest_accepted: Heart, interest_declined: Heart, message: MessageCircle, profile_view: Eye, profile_approved: BadgeCheck, profile_rejected: AlertTriangle, premium: Crown, system: Info };

export default function Notifications() {
  const { tt, lang } = useLang();
  const { setUnreadNotifications } = useSocket();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/notifications?page=${page}`).then(setData); }, [page]);

  const readAll = async () => {
    await api.patch('/notifications/read-all');
    setUnreadNotifications(0);
    setData((d) => ({ ...d, items: d.items.map((n) => ({ ...n, read: true })) }));
  };
  const readOne = (n) => { if (!n.read) { api.patch(`/notifications/${n._id}/read`); setUnreadNotifications((x) => Math.max(0, x - 1)); } };

  return (
    <div className="container-x max-w-3xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-maroon-800">{tt('Notifications', 'सूचनाएं')}</h1>
        <button onClick={readAll} className="btn-ghost btn-sm"><CheckCheck className="h-4 w-4" />{tt('Mark all read', 'सभी पढ़ी गईं')}</button>
      </div>
      <div className="mt-6">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
          : !data.items.length ? <Empty icon={Bell} title={tt('No notifications', 'कोई सूचना नहीं')} />
          : <div className="card divide-y divide-maroon-50 overflow-hidden">
            {data.items.map((n) => {
              const I = ICONS[n.type] || Info;
              return (
                <Link key={n._id} to={n.link || '#'} onClick={() => readOne(n)} className={`flex gap-4 px-5 py-4 transition hover:bg-maroon-50 ${n.read ? '' : 'bg-gold-50/60'}`}>
                  <div className="h-fit rounded-full bg-maroon-50 p-2.5"><I className="h-5 w-5 text-maroon-600" /></div>
                  <div className="min-w-0 flex-1"><div className="font-semibold text-ink">{n.title}</div><div className="text-sm text-gray-600">{n.body}</div><div className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt, lang)}</div></div>
                  {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-saffron-500" />}
                </Link>
              );
            })}
          </div>}
        {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}
      </div>
    </div>
  );
}
