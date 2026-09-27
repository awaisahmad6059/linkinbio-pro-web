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
  const { user, authChecked, loggingOut } = useAuthStore();
  const location = useLocation();

  if (!authChecked) return <RouteFallback />;

  // While a logout is in flight the app-level effect is already navigating to
  // the landing page. Redirecting here as well is what produced the stale
  // /login address: two competing navigations in the same commit, and the
  // winning one belonged to this guard rather than to the logout. Rendering
  // nothing keeps the dashboard out of the way without a second redirect.
  if (!user) {
    return loggingOut ? <RouteFallback /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
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
  const loggingOut = useAuthStore((s) => s.loggingOut);
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut);
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
   * The one and only post-logout redirect.
   *
   * The session is cleared synchronously by the store, so by the time this
   * effect runs the user object is already gone and this is the single
   * navigation that moves the app out of the protected area. Once it has
   * happened, `loggingOut` is released so the guards resume normal duty for
   * the rest of the session.
   */
  useEffect(() => {
    if (!authChecked) return;

    if (loggingOut) {
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      } else {
        setLoggingOut(false);
      }
      return;
    }

    // A session that expires on its own (cleared token, revoked account) has
    // no loggingOut flag, so the guard below catches it. Keep this as the
    // fallback rather than a second source of truth.
    if (wasSignedIn.current && !user && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    wasSignedIn.current = Boolean(user);
  }, [authChecked, loggingOut, user, location.pathname, navigate, setLoggingOut]);

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
