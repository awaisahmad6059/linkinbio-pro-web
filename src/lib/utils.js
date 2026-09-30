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

/**
 * Reads an image, draws it into a square canvas at `size` and returns a compact
 * data URL.
 *
 * Link icons are drawn at 22-36 CSS pixels, so uploading a full-resolution photo
 * would waste the user's database for nothing. Re-encoding client-side also
 * means the file never leaves the browser, and it lets us reject anything the
 * canvas cannot vouch for.
 *
 * SVG is refused on purpose: it is a script-bearing document, and these values
 * end up as an <img src> on a public page.
 */
export const resizeImageToDataUrl = (file, { size = 128, maxKB = 100 } = {}) =>
  new Promise((resolve, reject) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!file) {
      reject(new Error('Choose an image file'));
      return;
    }
    if (!allowed.includes(String(file.type).toLowerCase())) {
      reject(new Error('Use a PNG, JPG or WebP image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Your browser could not process that image'));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        // PNG keeps transparency for logos; fall back to JPEG if it is too big.
        const asPng = canvas.toDataURL('image/png');
        if (asPng.length / 1024 <= maxKB) {
          resolve(asPng);
          return;
        }
        const asJpeg = canvas.toDataURL('image/jpeg', 0.82);
        if (asJpeg.length / 1024 > maxKB) {
          reject(new Error('That image is too detailed — try a simpler one'));
          return;
        }
        resolve(asJpeg);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

/** Base URL used when telling the user where to share their page. */
export const publicOrigin = () =>
  import.meta.env.VITE_PUBLIC_URL || window.location.origin;

/**
 * Reads a full-bleed background photo and re-encodes it to something worth
 * storing.
 *
 * The naive version of this — hand the file over as-is — fails in both
 * directions. A 6MB phone photo is far more than the API will accept and far
 * more detail than a blurred backdrop behind a text column can show, while a
 * small image is rejected for being small when it was only small in bytes.
 *
 * So the image is drawn to a canvas scaled to fit `maxEdge`, then encoded as
 * JPEG at a quality walked downwards until it fits `maxKB`. Scaling first does
 * most of the work on its own — a 12-megapixel photo re-encoded at 1600px is
 * usually well inside the budget at full quality.
 *
 * SVG is refused for the same reason the API refuses it: it is a
 * script-bearing document, and this string ends up as a background on a public
 * page. GIF is refused because a static cover has no use for animation, and
 * because a canvas draw would only ever capture its first frame anyway.
 */
export const resizeCoverToDataUrl = (
  file,
  { maxEdge = 1600, maxKB = 300 } = {}
) =>
  new Promise((resolve, reject) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!file) {
      reject(new Error('Choose an image file'));
      return;
    }
    if (!allowed.includes(String(file.type).toLowerCase())) {
      reject(new Error('Use a PNG, JPG or WebP image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Your browser could not process that image'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Walk the quality down rather than making the user pick a smaller photo
        // because of a byte count they never asked for.
        for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length / 1024 <= maxKB) {
            resolve(dataUrl);
            return;
          }
        }

        // Still too big: drop the long edge and try once more before giving up,
        // since a softer image is much better than no image at all.
        canvas.width = Math.max(1, Math.round(width * 0.75));
        canvas.height = Math.max(1, Math.round(height * 0.75));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const retry = canvas.toDataURL('image/jpeg', 0.5);
        if (retry.length / 1024 <= maxKB) {
          resolve(retry);
          return;
        }

        reject(new Error('That photo is too detailed to use as a background — try a simpler one'));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
