import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBarChart2, FiCopy, FiExternalLink, FiEdit3, FiLogOut, FiSettings } from 'react-icons/fi';
import Logo from '../common/Logo.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { publicOrigin } from '../../lib/utils.js';

const NAV = [
  { to: '/dashboard', label: 'Page', Icon: FiEdit3, end: true },
  { to: '/dashboard/analytics', label: 'Analytics', Icon: FiBarChart2, end: false },
  { to: '/dashboard/settings', label: 'Settings', Icon: FiSettings, end: false },
];

/**
 * Authenticated layout: sticky top bar with section nav, the shareable public
 * link, and the account menu.
 */
const AppShell = ({ children }) => {
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

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell">
      <div className="app-top">
        <div className="container app-top-inner">
          <Logo to="/dashboard" />

          <nav className="app-nav">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="row gap-8" style={{ marginLeft: 'auto' }}>
            {user?.username && (
              <>
                <motion.button className="share-pill" onClick={copyLink} whileTap={{ scale: 0.96 }} title="Copy your public link">
                  <span className="share-pill-icon">
                    <FiCopy />
                  </span>
                  <span className="pill-text truncate" style={{ maxWidth: 130 }}>
                    /{user.username}
                  </span>
                  <span className="dot-live" aria-hidden="true" />
                </motion.button>

                <a
                  className="btn btn-outline btn-sm"
                  href={`/${user.username}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open your live page in a new tab"
                >
                  <FiExternalLink /> <span className="live-label">Live page</span>
                </a>
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
                    <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--line-soft)', marginBottom: 4 }}>
                      <div className="small strong truncate">{user?.displayName || user?.username}</div>
                      <div className="tiny muted truncate">{user?.email}</div>
                    </div>

                    <button className="nav-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMenuOpen(false); navigate('/dashboard/settings'); }}>
                      <FiSettings style={{ marginRight: 8 }} /> Account settings
                    </button>
                    <button className="nav-link" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setMenuOpen(false); copyLink(); }}>
                      <FiCopy style={{ marginRight: 8 }} /> Copy public link
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

export default AppShell;
