import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Spinner = () => (
  <div className="min-h-dvh flex items-center justify-center bg-surface">
    <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
  </div>
);

export const AuthGuard = () => {
  const { isAuthenticated, isHydrating } = useAuthStore(s => ({
    isAuthenticated: s.isAuthenticated,
    isHydrating:     s.isHydrating,
  }));
  if (isHydrating) return <Spinner />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const GuestGuard = () => {
  const { isAuthenticated, isHydrating } = useAuthStore(s => ({
    isAuthenticated: s.isAuthenticated,
    isHydrating:     s.isHydrating,
  }));
  if (isHydrating) return <Spinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
