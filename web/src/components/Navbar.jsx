import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, MessageCircle, User, LogOut, Crown, Heart, LayoutDashboard, Settings, Languages, Search, Eye } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { fileUrl } from '../lib/api';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { lang, setLang, t, tt } = useLang();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loggedIn = user && user.role === 'user';
  const links = loggedIn
    ? [
      { to: '/dashboard', label: t('dashboard') },
      { to: '/matches', label: t('matches') },
      { to: '/interests', label: t('interests') },
      { to: '/chat', label: t('messages'), badge: socket?.unreadMessages },
      { to: '/plans', label: t('plans') },
    ]
    : [
      { to: '/', label: t('home'), end: true },
      { to: '/about', label: t('about') },
      { to: '/plans', label: t('plans') },
      { to: '/stories', label: tt('Success Stories', 'सफल रिश्ते') },
      { to: '/contact', label: t('contact') },
    ];

  const doLogout = () => { logout(); navigate('/'); };
  const photo = profile?.photos?.find((p) => p.isPrimary)?.url || profile?.photos?.[0]?.url;

  return (
    <header className={`sticky top-0 z-50 transition ${scrolled ? 'bg-white/95 shadow-md backdrop-blur' : 'bg-white/80 backdrop-blur'}`}>
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo to={loggedIn ? '/dashboard' : '/'} />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `relative rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-maroon-50 text-maroon-700' : 'text-gray-700 hover:text-maroon-700'}`}>
              {l.label}
              {l.badge > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-saffron-500 px-1.5 text-[10px] font-bold text-white">{l.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} className="btn-ghost btn-sm !px-2.5" title="Change language">
            <Languages className="h-4 w-4" /> <span className="hidden sm:inline">{lang === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>
          {loggedIn ? (
            <>
              <Link to="/notifications" className="relative rounded-full p-2 text-maroon-700 hover:bg-maroon-50" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {socket?.unreadNotifications > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">{socket.unreadNotifications}</span>}
              </Link>
              <Link to="/chat" className="relative rounded-full p-2 text-maroon-700 hover:bg-maroon-50 lg:hidden" aria-label="Messages">
                <MessageCircle className="h-5 w-5" />
                {socket?.unreadMessages > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">{socket.unreadMessages}</span>}
              </Link>
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-gold-300" aria-label="Account menu">
                  {photo ? <img src={fileUrl(photo)} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-700 font-semibold text-white">{(profile?.firstName || 'M')[0]}</div>}
                </button>
                {menu && (
                  <div className="card absolute right-0 mt-2 w-60 overflow-hidden py-2 text-sm">
                    <div className="border-b border-maroon-100 px-4 pb-2">
                      <div className="font-semibold text-maroon-800">{profile ? `${profile.firstName} ${profile.lastName || ''}` : user.phone}</div>
                      <div className="text-xs text-gray-500">{profile?.profileId || tt('Profile not created', 'प्रोफाइल नहीं बनी')}</div>
                      {user.isPremium && <span className="chip-gold mt-1"><Crown className="h-3 w-3" /> {user.premium?.planName}</span>}
                    </div>
                    {[
                      { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
                      { to: profile ? `/profile/${profile.profileId}` : '/create-profile', icon: User, label: t('myProfile') },
                      { to: '/profile/edit', icon: Settings, label: t('editProfile') },
                      { to: '/shortlist', icon: Heart, label: t('shortlist') },
                      { to: '/visitors', icon: Eye, label: t('visitors') },
                      { to: '/plans', icon: Crown, label: t('upgrade') },
                      { to: '/settings', icon: Settings, label: t('settings') },
                    ].map((i) => (
                      <Link key={i.to + i.label} to={i.to} className="flex items-center gap-3 px-4 py-2 hover:bg-maroon-50"><i.icon className="h-4 w-4 text-gold-600" />{i.label}</Link>
                    ))}
                    <button onClick={doLogout} className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />{t('logout')}</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">{t('login')}</Link>
              <Link to="/login" className="btn-gold btn-sm">{t('register')}</Link>
            </>
          )}
          <button className="rounded-full p-2 text-maroon-700 hover:bg-maroon-50 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-maroon-100 bg-white lg:hidden">
          <nav className="container-x flex flex-col py-2">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-maroon-50 text-maroon-700' : 'text-gray-700'}`}>{l.label}</NavLink>
            ))}
            {loggedIn && <NavLink to="/matches" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-gray-700"><Search className="h-4 w-4" />{t('search')}</NavLink>}
          </nav>
        </div>
      )}
    </header>
  );
}
