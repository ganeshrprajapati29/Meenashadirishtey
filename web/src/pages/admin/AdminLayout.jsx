import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Users, Image, Crown, Receipt, Flag, Heart, Mail, Settings, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/Ui';

const NAV = [
  ['/admin', LayoutDashboard, 'Dashboard', true],
  ['/admin/profiles', UserCheck, 'Profiles & Approvals'],
  ['/admin/users', Users, 'Members'],
  ['/admin/banners', Image, 'Banners & Ads'],
  ['/admin/plans', Crown, 'Plans'],
  ['/admin/payments', Receipt, 'Payments'],
  ['/admin/stories', Heart, 'Success Stories'],
  ['/admin/reports', Flag, 'Reports'],
  ['/admin/enquiries', Mail, 'Enquiries'],
  ['/admin/settings', Settings, 'Settings'],
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (loading) return <PageLoader />;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const side = (
    <div className="flex h-full flex-col bg-royal text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <img src="/brand/logo.svg" alt="" className="h-11 w-11 rounded-full" />
        <div><div className="font-display font-bold">MSR Admin</div><div className="text-xs text-gold-300">मीणा शादी रिश्ते</div></div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(([to, Icon, label, end]) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white text-maroon-800 shadow' : 'text-white/80 hover:bg-white/10'}`}>
            <Icon className="h-4 w-4" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10"><ExternalLink className="h-4 w-4" />View website</a>
        <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10"><LogOut className="h-4 w-4" />Logout</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FBF6EE]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-64" onClick={(e) => e.stopPropagation()}>{side}</div></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-maroon-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <div className="text-sm text-gray-500">Logged in as <b className="text-maroon-800">{user.email}</b></div>
        </header>
        <main className="p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
