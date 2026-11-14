import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { PublicLayout, MemberRoute } from './components/Layouts';
import { PageLoader } from './components/Ui';
import Home from './pages/Home';
import Login from './pages/Login';
import { About, Contact, Stories, Privacy, Terms, Safety, NotFound } from './pages/StaticPages';

const CreateProfile = lazy(() => import('./pages/CreateProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Matches = lazy(() => import('./pages/Matches'));
const ProfileDetail = lazy(() => import('./pages/ProfileDetail'));
const Interests = lazy(() => import('./pages/Interests'));
const ProfileList = lazy(() => import('./pages/ProfileList'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Plans = lazy(() => import('./pages/Plans'));
const Settings = lazy(() => import('./pages/Settings'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProfiles = lazy(() => import('./pages/admin/AdminProfiles'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'));
const AdminStories = lazy(() => import('./pages/admin/AdminStories'));
const AdminPayments = lazy(() => import('./pages/admin/AdminMisc').then((m) => ({ default: m.AdminPayments })));
const AdminReports = lazy(() => import('./pages/admin/AdminMisc').then((m) => ({ default: m.AdminReports })));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminMisc').then((m) => ({ default: m.AdminEnquiries })));
const AdminSettings = lazy(() => import('./pages/admin/AdminMisc').then((m) => ({ default: m.AdminSettings })));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/plans" element={<Plans />} />
          <Route element={<MemberRoute needsProfile={false} />}>
            <Route path="/create-profile" element={<CreateProfile />} />
          </Route>
          <Route element={<MemberRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/shortlist" element={<ProfileList kind="shortlist" />} />
            <Route path="/visitors" element={<ProfileList kind="visitors" />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="profiles" element={<AdminProfiles />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
