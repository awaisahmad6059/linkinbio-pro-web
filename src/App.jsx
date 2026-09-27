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

/**
 * Routes a signed-out visitor is allowed to settle on. The post-logout effect
 * waits for one of these before releasing the guard, so a stale /login can
 * never be re-applied over the landing page.
 */
const PUBLIC_ROUTES = new Set(['/', '/login', '/signup']);

/** Blocks the dashboard until the stored JWT has been checked. */
const ProtectedRoute = ({ children }) => {
  const { user, authChecked, loggingOut } = useAuthStore();
  const location = useLocation();

  if (!authChecked) return <RouteFallback />;

  // A sign-out is in flight. The navigation and the session teardown are batched
  // into one render, so this component can be evaluated on a protected path
  // with `user === null` *after* the redirect was already issued. Suspending is
  // what stops the guard from issuing a second, competing redirect to /login.
  if (loggingOut) return <RouteFallback />;

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
   * Post-logout navigation and the session-loss safety net.
   *
   * The logout button navigates first and clears the session second (see
   * AppShell.onLogout). Both land in one batched render, so this effect is the
   * place where the two halves are reconciled: it guarantees the landing page is
   * reached, and it holds `loggingOut` until the router is genuinely resting on
   * a public route. Releasing the flag any earlier lets the protected guard
   * re-arm on an intermediate render and re-apply /login over the landing page.
   */
  useEffect(() => {
    if (!authChecked) return;

    if (loggingOut) {
      // Only release the flag once the router has actually committed the public
      // route. Checking `location.pathname` here was not enough: during the exit
      // animation the location still reports the outgoing protected path, so the
      // branch re-issued `navigate('/')` on every render and the guard re-armed
      // in between. A short deferred release lets the navigation commit first.
      if (PUBLIC_ROUTES.has(location.pathname)) {
        const t = setTimeout(() => setLoggingOut(false), 0);
        return () => clearTimeout(t);
      }
      navigate('/', { replace: true });
      return undefined;
    }

    // A session that expires on its own (revoked token, deleted account) never
    // goes through the logout button, so nothing raised the flag. Catch it here.
    if (wasSignedIn.current && !user && !PUBLIC_ROUTES.has(location.pathname)) {
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
