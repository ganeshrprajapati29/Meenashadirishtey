import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { PageLoader } from './Ui';
import { useAuth } from '../context/AuthContext';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

/** Logged-in member routes. needsProfile=true redirects to the profile wizard if not created yet */
export function MemberRoute({ needsProfile = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user || user.role !== 'user') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (needsProfile && !user.hasProfile) return <Navigate to="/create-profile" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
