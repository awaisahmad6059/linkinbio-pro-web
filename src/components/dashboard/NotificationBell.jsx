import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiHelpCircle,
  FiKey,
  FiLink,
  FiMail,
  FiSlash,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiXCircle,
} from 'react-icons/fi';
import { NOTIFICATION_TONES } from '../../lib/constants.js';
import { formatRelative } from '../../lib/utils.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Icon per notification type.
 *
 * The colour and label live in `NOTIFICATION_TONES` in lib/constants.js, which
 * is the single place that knows what each type means — this map only supplies
 * the component, which has to live in a .jsx file.
 *
 * An unknown type falls back to a neutral help icon rather than rendering
 * nothing, so a notification written by a newer server than the one serving the
 * app is still readable instead of appearing as a blank row.
 */
const NOTIFICATION_ICONS = {
  'email-verified': FiCheckCircle,
  'email-unverified': FiXCircle,
  suspended: FiUserX,
  unsuspended: FiUserCheck,
  'password-reset': FiKey,
  'request-resolved': FiCheckCircle,
  'request-rejected': FiXCircle,
  'link-blocked': FiSlash,
  'link-unblocked': FiLink,
  'link-deleted': FiTrash2,
  'admin-message': FiMail,
};

const TONE_COLOR = {
  ok: 'var(--success)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  brand: 'var(--brand)',
  neutral: 'var(--ink-400)',
};

const notificationMeta = (type) => ({
  Icon: NOTIFICATION_ICONS[type] || FiHelpCircle,
  tone: NOTIFICATION_TONES[type]?.tone || 'neutral',
});

/**
 * Where a notification takes you when opened. A decision the user can act on
 * goes to the page that shows it; the rest simply mark as read.
 */
const targetFor = (n) => {
  switch (n.type) {
    case 'suspended':
    case 'email-unverified':
      return '/dashboard/settings';
    case 'request-resolved':
    case 'request-rejected':
      return '/dashboard';
    // A link decision is only actionable where the links are, so these go
    // straight to the list the admin acted on rather than the dashboard root.
    case 'link-blocked':
    case 'link-unblocked':
    case 'link-deleted':
      return '/dashboard/links';
    default:
      return null;
  }
};

/**
 * The bell and its panel.
 *
 * The button itself is only a badge: the count is polled, the list is not. The
 * panel is a plain animated popover rather than a modal, so reading a message
 * never takes the dashboard away or needs dismissing.
 */
const NotificationBell = () => {
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const { notifications, unread, loading, error, open, loaded, setOpen, fetchAll, markRead, markAllRead } =
    useNotificationStore();

  // Click-away closes the panel, the same way the account menu behaves.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const onOpenRow = async (n) => {
    await markRead(n.id);
    const to = targetFor(n);
    if (to && to !== window.location.pathname) {
      setOpen(false);
      navigate(to);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <motion.button
        className="icon-btn"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.94 }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <FiBell />

        {/* The red dot. Bounces once when a fresh notification lands, so a
            change is noticed without looking for it. */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="dot"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 18 }}
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                minWidth: 15,
                height: 15,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--danger)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                lineHeight: '15px',
                textAlign: 'center',
                boxShadow: '0 0 0 2px var(--surface)',
              }}
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 340,
              maxWidth: 'calc(100vw - 24px)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              boxShadow: 'var(--sh-lg)',
              zIndex: 60,
              overflow: 'hidden',
            }}
            role="dialog"
            aria-label="Notifications"
          >
            <div
              className="row"
              style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', gap: 8 }}
            >
              <strong style={{ fontSize: 14 }}>Notifications</strong>
              {unread > 0 && (
                <span className="badge badge-neutral">{unread} new</span>
              )}
              {unread > 0 && (
                <button
                  className="tiny strong"
                  onClick={markAllRead}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)' }}
                >
                  <FiCheck style={{ verticalAlign: '-2px', marginRight: 3 }} />
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {loading && !loaded ? (
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="row" style={{ gap: 10 }}>
                      <Skeleton width={30} height={30} circle />
                      <div style={{ flex: 1 }}>
                        <Skeleton height={11} />
                        <Skeleton height={9} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>
                  <button className="btn btn-outline btn-sm" onClick={fetchAll} style={{ marginTop: 10 }}>
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="empty" style={{ padding: '30px 16px' }}>
                  <div className="empty-icon"><FiBell /></div>
                  <div className="strong" style={{ fontSize: 13 }}>Nothing here yet</div>
                  <p className="tiny" style={{ marginTop: 4 }}>
                    We&apos;ll tell you when an administrator looks at your account.
                  </p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const { Icon, tone } = notificationMeta(n.type);
                  const color = TONE_COLOR[tone];
                  return (
                    <motion.button
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                      onClick={() => onOpenRow(n)}
                      style={{
                        display: 'flex',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 14px',
                        border: 'none',
                        borderBottom: '1px solid var(--line-soft)',
                        background: n.read ? 'transparent' : 'var(--brand-50)',
                        cursor: 'pointer',
                        opacity: n.read ? 0.72 : 1,
                      }}
                    >
                      <span
                        className="stat-icon"
                        style={{ background: 'var(--surface)', color, width: 30, height: 30, flexShrink: 0 }}
                      >
                        <Icon />
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="row" style={{ gap: 6, marginBottom: 2 }}>
                          <span className="small strong grow truncate">{n.title}</span>
                          {!n.read && (
                            <span
                              aria-label="Unread"
                              style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--brand)', flexShrink: 0 }}
                            />
                          )}
                        </span>
                        {n.body && (
                          <span className="tiny muted" style={{ display: 'block', lineHeight: 1.45 }}>
                            {n.body}
                          </span>
                        )}
                        <span className="tiny muted" style={{ display: 'block', marginTop: 4, opacity: 0.8 }}>
                          {formatRelative(n.createdAt)}
                        </span>
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
