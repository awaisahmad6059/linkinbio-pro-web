import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Field from '../common/Field.jsx';
import { authApi } from '../../lib/api.js';
import { useDebounced } from '../../lib/utils.js';
import { USERNAME_MAX, USERNAME_MIN } from '../../lib/constants.js';

const FORMAT_RE = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Username picker with a debounced availability probe.
 *
 * Shows one of: idle · checking (spinner) · available (✅ + your URL) · taken (❌).
 * The parent receives a clean `{ available, username }` via `onStatus`.
 */
const UsernameField = ({ value, onChange, onStatus, error, autoFocus }) => {
  const debounced = useDebounced(value, 500);
  const [status, setStatus] = useState({ state: 'idle' });

  useEffect(() => {
    const username = debounced.trim().toLowerCase();

    if (!username) {
      setStatus({ state: 'idle' });
      onStatus?.({ state: 'idle', available: false });
      return undefined;
    }

    if (username.length < USERNAME_MIN) {
      setStatus({ state: 'idle' });
      onStatus?.({ state: 'idle', available: false });
      return undefined;
    }

    if (username.length > USERNAME_MAX || !FORMAT_RE.test(username)) {
      setStatus({ state: 'invalid', message: 'Use only lowercase letters, numbers, dots, dashes and underscores' });
      onStatus?.({ state: 'invalid', available: false });
      return undefined;
    }

    let cancelled = false;
    setStatus({ state: 'checking' });

    authApi
      .checkUsername(username)
      .then((data) => {
        if (cancelled) return;
        setStatus(
          data.available
            ? { state: 'available', username: data.username }
            : { state: 'taken', message: data.reason || 'That username is already taken' }
        );
        onStatus?.({ state: data.available ? 'available' : 'taken', available: !!data.available, username: data.username });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({ state: 'idle' });
        onStatus?.({ state: 'idle', available: false });
      });

    return () => {
      cancelled = true;
    };
    // onStatus is intentionally excluded: it is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const badge = {
    checking: <span className="spinner" style={{ width: 13, height: 13 }} />,
    available: <FiCheckCircle style={{ color: 'var(--success)', fontSize: 15 }} />,
    taken: <FiXCircle style={{ color: 'var(--danger)', fontSize: 15 }} />,
    invalid: <FiXCircle style={{ color: 'var(--danger)', fontSize: 15 }} />,
  }[status.state];

  return (
    <Field
      label="Your LinkInBio Pro username"
      required
      as="input"
      value={value}
      autoFocus={autoFocus}
      autoComplete="username"
      spellCheck="false"
      placeholder="awais"
      maxLength={USERNAME_MAX}
      onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ''))}
      error={error}
      success={status.state === 'available' ? 'That username is available' : undefined}
      hint={
        status.state === 'available'
          ? `Your page will live at linkinbiopro.com/${status.username}`
          : status.state === 'taken' || status.state === 'invalid'
            ? undefined
            : `This becomes your public link — ${USERNAME_MIN}-${USERNAME_MAX} characters.`
      }
      className="username-field"
    >
      {/* Prefix @ + live status indicator sit inside the control */}
      <span className="input-prefix" aria-hidden="true">
        @
      </span>
      <AnimatePresence>
        {badge && (
          <motion.span
            className="input-suffix"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </Field>
  );
};

export default UsernameField;
