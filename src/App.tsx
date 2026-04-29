import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthGuard, GuestGuard } from '@/components/guards/AuthGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';

const LandingPage      = lazy(() => import('@/pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage        = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage       = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TransactionsPage = lazy(() => import('@/pages/dashboard/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const TransferPage     = lazy(() => import('@/pages/dashboard/TransferPage').then(m => ({ default: m.TransferPage })));
const CardsPage        = lazy(() => import('@/pages/dashboard/CardsPage').then(m => ({ default: m.CardsPage })));
const AnalyticsPage    = lazy(() => import('@/pages/dashboard/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage     = lazy(() => import('@/pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-surface">
    <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only routes */}
          <Route element={<GuestGuard />}>
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index                  element={<DashboardPage />}    />
              <Route path="transactions"    element={<TransactionsPage />} />
              <Route path="transfer"        element={<TransferPage />}     />
              <Route path="cards"           element={<CardsPage />}        />
              <Route path="analytics"       element={<AnalyticsPage />}    />
              <Route path="settings"        element={<SettingsPage />}     />
            </Route>
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
