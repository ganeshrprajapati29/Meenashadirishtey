import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Clock, Crown, IndianRupee, HeartHandshake, Flag, Mail, MessageCircle, UserPlus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../../lib/api';
import { PageLoader } from '../../components/Ui';
import { inr } from '../../lib/format';

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(setD); }, []);
  if (!d) return <PageLoader />;
  const s = d.stats;
  const cards = [
    [Users, 'Total members', s.users, 'bg-sky-50 text-sky-600', '/admin/users'],
    [UserPlus, "Today's signups", s.todaySignups, 'bg-violet-50 text-violet-600', '/admin/users'],
    [Clock, 'Pending approval', s.pending, 'bg-amber-50 text-amber-600', '/admin/profiles?status=pending'],
    [UserCheck, 'Live profiles', s.approved, 'bg-emerald-50 text-emerald-600', '/admin/profiles?status=approved'],
    [Crown, 'Premium members', s.premium, 'bg-yellow-50 text-yellow-700', '/admin/users?premium=true'],
    [IndianRupee, 'Revenue', inr(s.revenue), 'bg-green-50 text-green-700', '/admin/payments'],
    [HeartHandshake, 'Connections', `${s.accepted}/${s.interests}`, 'bg-rose-50 text-rose-600', null],
    [MessageCircle, 'Messages', s.messages, 'bg-indigo-50 text-indigo-600', null],
    [Flag, 'Open reports', s.openReports, 'bg-red-50 text-red-600', '/admin/reports'],
    [Mail, 'New enquiries', s.newEnquiries, 'bg-orange-50 text-orange-600', '/admin/enquiries'],
  ];
  const gender = [{ name: 'Grooms', value: s.male }, { name: 'Brides', value: s.female }];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-maroon-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([I, l, v, c, to]) => {
          const inner = (<><div className={`w-fit rounded-xl p-2 ${c}`}><I className="h-5 w-5" /></div><div className="mt-3 font-display text-2xl font-bold">{v}</div><div className="text-xs text-gray-500">{l}</div></>);
          return to ? <Link key={l} to={to} className="card p-4 transition hover:-translate-y-0.5">{inner}</Link> : <div key={l} className="card p-4">{inner}</div>;
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-maroon-800">Signups – last 14 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.signups}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A1F1F" stopOpacity={0.35} /><stop offset="1" stopColor="#7A1F1F" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#7A1F1F" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-maroon-800">Brides vs Grooms</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={gender} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={4} label>
              <Cell fill="#7A1F1F" /><Cell fill="#D4A017" /></Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-maroon-800">Top states</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={d.byState}><CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" /><XAxis dataKey="state" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="count" fill="#D4A017" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
