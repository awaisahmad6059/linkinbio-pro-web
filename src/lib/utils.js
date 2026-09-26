import { useEffect, useRef, useState } from 'react';

/** Join conditional class names. */
export const cn = (...parts) => parts.filter(Boolean).join(' ');

/** 12400 -> "12.4k" */
export const formatCompact = (n = 0) => {
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
};

export const formatNumber = (n = 0) => new Intl.NumberFormat('en-US').format(n);

/** "Mon 22 Sep" — used for analytics axis labels. */
export const formatDayLabel = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const formatRelative = (date) => {
  if (!date) return 'never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const initialsOf = (text = '') =>
  text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

/** Debounce a rapidly-changing value (used for the username probe + autosave). */
export const useDebounced = (value, delay = 450) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/** Wrap a platform icon in a mailto: URL for the Email platform. */
export const toDestination = (link) => {
  const url = link.url || '';
  if (link.platform === 'email' && !/^mailto:/i.test(url)) {
    return url.includes('@') ? `mailto:${url}` : url;
  }
  return url;
};

/**
 * Counts from 0 to `value` with an ease-out curve so stat tiles feel alive.
 * Uses requestAnimationFrame and respects reduced-motion preferences.
 *
 * requestAnimationFrame is paused whenever the tab is hidden or the browser
 * throttles it, so a safety timer always snaps to the final value. Without it a
 * stat tile can be left reading "0" long after its data actually arrived.
 */
export const useCountUp = (value, duration = 1100) => {
  const [display, setDisplay] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce || target === 0) {
      setDisplay(target);
      return undefined;
    }

    const start = performance.now();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setDisplay(target);
    };

    const tick = (now) => {
      if (settled) return;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else finish();
    };

    frame.current = requestAnimationFrame(tick);
    const safety = setTimeout(finish, duration + 250);

    return () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(safety);
    };
  }, [value, duration]);

  return display;
};

/** Reads an image file as a base64 data URL, rejecting anything over `maxKB`. */
export const readImageAsDataUrl = (file, maxKB = 320) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    if (file.size > maxKB * 1024) {
      reject(new Error(`Image must be smaller than ${maxKB}KB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.readAsDataURL(file);
  });

/** Base URL used when telling the user where to share their page. */
export const publicOrigin = () =>
  import.meta.env.VITE_PUBLIC_URL || window.location.origin;
