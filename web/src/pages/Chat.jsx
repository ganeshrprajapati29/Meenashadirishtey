import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, ChevronLeft, MessageCircle, Crown, Check, CheckCheck } from 'lucide-react';
import api, { fileUrl, avatarFor } from '../lib/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Empty, Spinner } from '../components/Ui';
import { formatTime, timeAgo } from '../lib/format';

function ConversationList({ items, activeId }) {
  const { tt, lang } = useLang();
  if (!items) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (!items.length) return <div className="p-6 text-center text-sm text-gray-500">{tt('No conversations yet. Chat unlocks when an interest is accepted.', 'अभी कोई बातचीत नहीं। रुचि स्वीकार होने पर चैट शुरू होगी।')}</div>;
  return (
    <ul>
      {items.map((c) => (
        <li key={c.id}>
          <Link to={`/chat/${c.otherUserId}`} className={`flex items-center gap-3 border-b border-maroon-50 px-4 py-3 transition hover:bg-maroon-50 ${activeId === c.otherUserId ? 'bg-maroon-50' : ''}`}>
            <div className="relative shrink-0">
              <img src={c.profile.photo ? fileUrl(c.profile.photo) : avatarFor()} alt="" className="h-12 w-12 rounded-full object-cover" />
              {c.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2"><span className="truncate font-semibold text-ink">{c.profile.fullName}</span><span className="shrink-0 text-[11px] text-gray-400">{timeAgo(c.lastMessageAt, lang)}</span></div>
              <div className="flex justify-between gap-2"><span className={`truncate text-sm ${c.unread ? 'font-semibold text-ink' : 'text-gray-500'}`}>{c.lastSenderIsMe ? `${tt('You', 'आप')}: ` : ''}{c.lastMessage}</span>
                {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Chat() {
  const { userId } = useParams();
  const { tt, lang } = useLang();
  const { user } = useAuth();
  const { socket, refreshCounts } = useSocket();
  const navigate = useNavigate();
  const [convs, setConvs] = useState(null);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef(null);
  const typingTimer = useRef(null);

  const loadConvs = useCallback(() => api.get('/chat/conversations').then((r) => setConvs(r.items)).catch(() => setConvs([])), []);
  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!userId) { setThread(null); return; }
    setThread(null);
    api.get(`/chat/${userId}/messages`).then((r) => { setThread(r); loadConvs(); refreshCounts(); }).catch((e) => { toast.error(e.message); navigate('/chat'); });
  }, [userId, loadConvs, refreshCounts, navigate]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread?.items?.length, typing]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMsg = (m) => {
      loadConvs();
      if (userId && (String(m.sender) === String(userId) || String(m.sender) === String(user.id))) {
        setThread((t) => {
          if (!t || t.items.some((x) => x._id === m._id)) return t;
          return { ...t, conversationId: m.conversation, items: [...t.items.filter((x) => !(x.pending && x.text === m.text && String(m.sender) === String(user.id))), m] };
        });
        if (String(m.sender) === String(userId)) socket.emit('message:read', { with: userId });
      }
    };
    const onTyping = ({ from, typing: tp }) => { if (String(from) === String(userId)) setTyping(tp); };
    const onRead = ({ by }) => { if (String(by) === String(userId)) setThread((t) => t && ({ ...t, items: t.items.map((x) => (String(x.sender) === String(user.id) && !x.readAt ? { ...x, readAt: new Date() } : x)) })); };
    const onPresence = ({ userId: uid, isOnline }) => {
      if (String(uid) === String(userId)) setThread((t) => t && ({ ...t, other: { ...t.other, isOnline } }));
      setConvs((cs) => cs && cs.map((c) => (String(c.otherUserId) === String(uid) ? { ...c, isOnline } : c)));
    };
    socket.on('message:new', onMsg);
    socket.on('typing', onTyping);
    socket.on('message:read', onRead);
    socket.on('presence', onPresence);
    return () => { socket.off('message:new', onMsg); socket.off('typing', onTyping); socket.off('message:read', onRead); socket.off('presence', onPresence); };
  }, [socket, userId, user.id, loadConvs]);

  const send = (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setText('');
    const temp = { _id: `tmp-${Date.now()}`, text: msg, sender: user.id, createdAt: new Date().toISOString(), pending: true };
    setThread((t) => ({ ...t, items: [...t.items, temp] }));
    const fail = (err) => { toast.error(err); setThread((t) => ({ ...t, items: t.items.filter((x) => x._id !== temp._id) })); };
    if (socket?.connected) {
      socket.emit('message:send', { to: userId, text: msg }, (ack) => { if (!ack?.ok) fail(ack?.error || 'Failed'); });
    } else {
      api.post(`/chat/${userId}/messages`, { text: msg }).then((r) => setThread((t) => ({ ...t, items: t.items.map((x) => (x._id === temp._id ? r.message : x)) }))).catch((er) => fail(er.message));
    }
    socket?.emit('typing', { to: userId, typing: false });
  };

  const onType = (v) => {
    setText(v);
    if (!socket) return;
    socket.emit('typing', { to: userId, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', { to: userId, typing: false }), 1500);
  };

  return (
    <div className="container-x py-6">
      <div className="card grid h-[calc(100vh-140px)] min-h-[520px] overflow-hidden md:grid-cols-[320px_1fr]">
        <aside className={`overflow-y-auto border-r border-maroon-100 ${userId ? 'hidden md:block' : ''}`}>
          <div className="sticky top-0 border-b border-maroon-100 bg-white px-4 py-4"><h1 className="font-display text-xl font-bold text-maroon-800">{tt('Messages', 'संदेश')}</h1></div>
          <ConversationList items={convs} activeId={userId} />
        </aside>
        <section className={`flex min-h-0 flex-col ${!userId ? 'hidden md:flex' : ''}`}>
          {!userId ? (
            <div className="flex flex-1 items-center justify-center p-6"><Empty icon={MessageCircle} title={tt('Select a conversation', 'बातचीत चुनें')} text={tt('Your chats with connected matches appear here.', 'जुड़े हुए रिश्तों से आपकी बातचीत यहाँ दिखेगी।')} /></div>
          ) : !thread ? <div className="flex flex-1 items-center justify-center"><Spinner className="h-8 w-8" /></div> : (
            <>
              <header className="flex items-center gap-3 border-b border-maroon-100 bg-white px-4 py-3">
                <Link to="/chat" className="md:hidden"><ChevronLeft className="h-6 w-6 text-maroon-700" /></Link>
                <Link to={`/profile/${thread.other.profileId}`} className="flex items-center gap-3">
                  <img src={thread.other.photo ? fileUrl(thread.other.photo) : avatarFor()} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div><div className="font-semibold text-ink">{thread.other.fullName}</div>
                    <div className="text-xs text-gray-500">{typing ? <span className="text-emerald-600">{tt('typing…', 'लिख रहे हैं…')}</span> : thread.other.isOnline ? <span className="text-emerald-600">● {tt('Online', 'ऑनलाइन')}</span> : `${tt('Last seen', 'आखिरी बार')} ${timeAgo(thread.other.lastActive, lang)}`}</div></div>
                </Link>
              </header>
              <div className="pattern-bg flex-1 space-y-2 overflow-y-auto bg-cream/60 p-4">
                {!thread.items.length && <div className="mx-auto mt-10 max-w-xs rounded-xl bg-white p-4 text-center text-sm text-gray-500 shadow">{tt('Say Namaste 🙏 and start the conversation respectfully.', 'नमस्ते 🙏 कहें और सम्मानपूर्वक बातचीत शुरू करें।')}</div>}
                {thread.items.map((m) => {
                  const mine = String(m.sender) === String(user.id);
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine ? 'rounded-br-sm bg-maroon-700 text-white' : 'rounded-bl-sm bg-white text-ink'}`}>
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                          {formatTime(m.createdAt)}
                          {mine && (m.pending ? <Spinner className="h-3 w-3 !text-white/70" /> : m.readAt ? <CheckCheck className="h-3.5 w-3.5 text-gold-300" /> : <Check className="h-3.5 w-3.5" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              {thread.canChat ? (
                <form onSubmit={send} className="flex gap-2 border-t border-maroon-100 bg-white p-3">
                  <input value={text} onChange={(e) => onType(e.target.value)} maxLength={2000} placeholder={tt('Type a message…', 'संदेश लिखें…')} className="input !rounded-full" />
                  <button className="btn-primary !rounded-full !px-4" disabled={!text.trim()} aria-label="Send"><Send className="h-5 w-5" /></button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 border-t border-maroon-100 bg-gold-50 p-4 text-sm text-gold-900">
                  {tt('Chat unlocks when your interest is accepted, or with premium.', 'रुचि स्वीकार होने पर या प्रीमियम से चैट खुलेगी।')}
                  <Link to="/plans" className="btn-gold btn-sm"><Crown className="h-3.5 w-3.5" />{tt('Upgrade', 'अपग्रेड')}</Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
