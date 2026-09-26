import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import Button from '../common/Button.jsx';
import Logo from '../common/Logo.jsx';
import { useAuthStore } from '../../store/authStore.js';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Themes', href: '#themes' },
  { label: 'Analytics', href: '#analytics' },
];

/** Sticky marketing navbar with a scroll-reactive border and a mobile sheet. */
const MarketingNav = () => {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`nav${stuck ? ' is-stuck' : ''}`}>
      <div className="container nav-inner">
        <Logo />

        <nav className="nav-links">
          {LINKS.map((link) => (
            <a key={link.href} className="nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-cta">
          {user ? (
            <Button to="/dashboard" size="sm">
              Open dashboard
            </Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="nav-login">
                Log in
              </Button>
              <Button to="/signup" size="sm">
                Get started free
              </Button>
            </>
          )}
          <button
            className="nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="nav-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {LINKS.map((link) => (
              <a key={link.href} className="nav-link" href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            {!user && (
              <Link className="nav-link" to="/login" style={{ color: 'var(--brand)', fontWeight: 650 }}>
                Log in
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MarketingNav;
