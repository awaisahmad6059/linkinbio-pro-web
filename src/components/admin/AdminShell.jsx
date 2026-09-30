import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiActivity,
  FiBarChart2,
  FiExternalLink,
  FiGrid,
  FiInbox,
  FiLogOut,
  FiSettings,
  FiSlash,
  FiUsers,
} from 'react-icons/fi';
import Logo from '../common/Logo.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { publicOrigin } from '../../lib/utils.js';

const NAV = [
  { to: '/admin', label: 'Overview', Icon: FiGrid, end: true },
  { to: '/admin/users', label: 'Users', Icon: FiUsers, end: false },
  { to: '/admin/requests', label: 'Requests', Icon: FiInbox, end: false },
  { to: '/admin/blocks', label: 'Blocked', Icon: FiSlash, end: false },
  { to: '/admin/insights', label: 'Insights', Icon: FiBarChart2, end: false },
];

/**
 * Layout for the admin area.
 *
 * Mirrors AppShell so the admin screens are recognisably the same product, with
 * a different set of sections. The admin area is no longer read-only: account
 * actions (suspend, reset password, verified flag, delete), verification-code
 * resends and the user help-request queue are all driven from here.
 */
const AdminShell = ({ children }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const success = useToastStore((s) => s.success);
  const info = useToastStore((s) => s.info);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const publicUrl = user ? `${publicOrigin()}/${user.username}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      success('Public link copied to clipboard');
    } catch {
      info(`Copy this link: ${publicUrl}`);
    }
  };

  // Navigate before tearing the session down, for the same reason AppShell does:
  // the reverse order lets the route guard re-issue a competing redirect.
  const onLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  return (
    <div className="app-shell admin-shell">
      <div className="admin-banner" role="note">
        <FiActivity />
        <span>Admin area — live controls. Changes take effect immediately.</span>
      </div>

      <div className="app-top">
        <div className="container app-top-inner">
          <Logo to="/admin" />

          <nav className="app-nav">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="row gap-8" style={{ marginLeft: 'auto' }}>
            {user?.username && (
              <>
                <motion.button
                  className="share-pill"
                  onClick={copyLink}
                  whileTap={{ scale: 0.96 }}
                  title="Copy your public link"
                >
                  <span className="share-pill-icon">
                    <FiExternalLink />
                  </span>
                  <span className="pill-text truncate" style={{ maxWidth: 120 }}>
                    /{user.username}
                  </span>
                </motion.button>

                {/* An admin is still a person with their own page.

                    `app-top-action`, not the account-menu's `nav-link`: this one
                    sits in the top bar beside the share pill and the avatar, not
                    in the dropdown. It also must not claim `width: 100%` the way
                    the full-width menu rows do — a flex child asking for the
                    whole row gets the whole row only by shrinking its siblings,
                    and the 34px avatar next to it was being squeezed into a
                    squashed, washed-out blob as a result. */}
                <button
                  className="app-top-action"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  <FiSettings /> My page
                </button>
              </>
            )}

            <div ref={menuRef} style={{ position: 'relative' }}>
              <motion.button
                className="avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                whileTap={{ scale: 0.94 }}
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                <Avatar src={user?.profilePhotoUrl} name={user?.displayName || user?.username} size="sm" />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 218,
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r)',
                      boxShadow: 'var(--sh-lg)',
                      padding: 6,
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 10px 10px',
                        borderBottom: '1px solid var(--line-soft)',
                        marginBottom: 4,
                      }}
                    >
                      <div className="small strong truncate">{user?.displayName || user?.username}</div>
                      <div className="tiny muted truncate">{user?.email}</div>
                    </div>

                    <button
                      className="nav-link"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/dashboard');
                      }}
                    >
                      <FiSettings style={{ marginRight: 8 }} /> My own page
                    </button>
                    <button
                      className="nav-link"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => {
                        setMenuOpen(false);
                        copyLink();
                      }}
                    >
                      <FiExternalLink style={{ marginRight: 8 }} /> Copy public link
                    </button>
                    <button
                      className="nav-link"
                      style={{ width: '100%', textAlign: 'left', color: 'var(--danger)' }}
                      onClick={onLogout}
                    >
                      <FiLogOut style={{ marginRight: 8 }} /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {children || <Outlet />}
    </div>
  );
};

export default AdminShell;
