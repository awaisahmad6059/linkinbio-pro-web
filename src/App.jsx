import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { useAuthStore } from './store/authStore.js';
import Toaster from './components/common/Toaster.jsx';
import RouteFallback from './components/common/RouteFallback.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/** Blocks the dashboard until the stored JWT has been checked. */
const ProtectedRoute = ({ children }) => {
  const { user, authChecked } = useAuthStore();
  const location = useLocation();

  if (!authChecked) return <RouteFallback />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

  /** Signed-in users should not sit on the login/signup screens — except for
   *  the brief window where the form is playing its success animation. */
  const GuestRoute = ({ children }) => {
    const { user, authChecked, justSignedIn } = useAuthStore();
    if (!authChecked) return <RouteFallback />;
    if (user && !justSignedIn) return <Navigate to="/dashboard" replace />;
    return children;
  };

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);
  const wasSignedIn = useRef(false);

  // Restore the session once, before the first protected render.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Every navigation starts at the top — no sudden scroll jump between routes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

  /**
   * Sends a signed-out visitor back to the landing page.
   *
   * Doing this here, after the session has already been cleared, avoids the
   * race the individual logout buttons hit: calling navigate() in the same tick
   * as clearing the user made the redirect lose against the leaving animation,
   * so the landing page painted while the address bar kept the old path and
   * every link stayed inert until a manual refresh.
   */
  useEffect(() => {
    if (!authChecked) return;
    if (wasSignedIn.current && !user && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    wasSignedIn.current = Boolean(user);
  }, [authChecked, user, location.pathname, navigate]);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Public creator pages live at the root: /awais, /my-studio ... */}
          <Route path="/:username" element={<PublicProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>

      <Toaster />
    </>
  );
};

export default App;
