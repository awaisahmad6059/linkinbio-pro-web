import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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

  /**
   * Sends anyone who is not signed in to the landing page instead of the login
   * form. Without this, signing out from a deep link left the address bar on
   * /login: the guard below kept rendering the form because no user was
   * present, and the redirect a component had already requested was never
   * honoured.
   *
   * The wait key lets the leaving animation finish before the URL changes, so
   * the address bar and the painted page never disagree.
   */
  const PublicOnlyRoute = ({ children }) => {
    const { user, authChecked } = useAuthStore();
    if (!authChecked) return <RouteFallback />;
    if (!user) return <Navigate to="/" replace />;
    return children;
  };

const App = () => {
  const location = useLocation();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const authChecked = useAuthStore((s) => s.authChecked);

  // Restore the session once, before the first protected render.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Every navigation starts at the top — no sudden scroll jump between routes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

  /**
   * Keeps the URL honest while a route guard decides where to send someone.
   *
   * Signing out from /login left the address bar on /login even though the
   * landing page was already on screen: the redirect fired while the leaving
   * animation was still running, so the address update was lost and the
   * rendered page no longer matched the route the app thought it was on. Links
   * stayed unclickable until a hard refresh re-synced everything.
   *
   * Re-asserting the pathname once the exit animation has finished fixes the
   * mismatch without introducing a visible jump.
   */
  useEffect(() => {
    if (!authChecked) return undefined;
    if (location.pathname !== window.location.pathname) {
      window.history.replaceState(null, '', `${location.pathname}${window.location.search}`);
    }
    return undefined;
  }, [authChecked, location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnlyRoute><GuestRoute><LoginPage /></GuestRoute></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><GuestRoute><SignupPage /></GuestRoute></PublicOnlyRoute>} />

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
