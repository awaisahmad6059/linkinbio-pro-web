import { matchDomain, getPlatform } from '../config/platforms.js';

/**
 * Everything that turns raw user input into a safe, storable link URL.
 *
 * This module is duplicated in spirit on the server (server/src/utils/linkUrl.js)
 * — the server re-validates rather than trusting what the browser produced,
 * because these values end up as real `href` attributes on a public page.
 */

/** Schemes we are willing to render as a clickable destination. */
export const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

/** Schemes that must never survive, regardless of what the client claims. */
const DANGEROUS_SCHEMES = /^\s*(javascript|data|vbscript|file|blob):/i;

const EMAIL_RE = /^[^\s@,;:<>()[\]\\"]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

export const looksLikeEmail = (value = '') => EMAIL_RE.test(String(value).trim());

/** Digits only, so "+92 (300) 123-4567" and "0923001234567" compare equal. */
export const digitsOf = (value = '') => String(value).replace(/[^\d]/g, '');

export const looksLikePhone = (value = '') => {
  const d = digitsOf(value);
  return d.length >= 7 && d.length <= 15;
};

/** Strips a leading https://, http:// or mailto: so all three spellings unify. */
export const stripEmailPrefix = (value = '') =>
  String(value)
    .trim()
    .replace(/^mailto:\s*/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^tel:\s*/i, '')
    .trim();

/** Lowercases the domain only — the local part is left exactly as typed. */
export const normalizeEmail = (value = '') => {
  const cleaned = stripEmailPrefix(value).replace(/\s/g, '');
  const at = cleaned.lastIndexOf('@');
  if (at === -1) return cleaned.toLowerCase();
  return `${cleaned.slice(0, at)}@${cleaned.slice(at + 1).toLowerCase()}`;
};

export const normalizePhone = (value = '') => {
  const raw = String(value).trim().replace(/^tel:\s*/i, '');
  const d = digitsOf(raw);
  // Keep a leading + when the user gave an international number.
  return raw.startsWith('+') ? `+${d}` : d;
};

export const normalizeWhatsApp = (value = '') => digitsOf(value);

/** Rejects anything outside the allowlist. Returns a message, or null if safe. */
export const schemeProblem = (value = '') => {
  const v = String(value).trim();
  if (!v) return 'Paste a URL';
  if (DANGEROUS_SCHEMES.test(v)) {
    return 'That kind of link is not allowed';
  }
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(v);
  if (!match) return null; // no scheme yet — it will get https:// below
  const scheme = `${match[1].toLowerCase()}:`;
  if (!SAFE_SCHEMES.includes(scheme)) {
    return 'Links must start with http, https, mailto or tel';
  }
  return null;
};

/**
 * Normalises whatever the user pasted into the canonical stored form.
 *
 * Order matters and it is the fix for the email bug: the email check runs
 * *before* any scheme is considered, so a bare `awaisahmad6059@gmail.com` is
 * never turned into `https://awaisahmad6059@gmail.com` (which would open
 * gmail.com in a browser tab instead of opening a mail composer).
 *
 * @returns {{ kind: 'email'|'phone'|'whatsapp'|'url', value: string, platform: string }}
 */
export const normalizeLinkInput = (raw, platform = 'custom') => {
  const v = String(raw ?? '').trim();
  if (!v) return { kind: 'url', value: '', platform };

  // An explicit mailto: always wins, whatever the platform is.
  if (/^mailto:/i.test(v)) {
    return { kind: 'email', value: `mailto:${normalizeEmail(v)}`, platform: 'email' };
  }

  // An explicit tel: is a phone number.
  if (/^tel:/i.test(v)) {
    return { kind: 'phone', value: `tel:${normalizePhone(v)}`, platform: 'phone' };
  }

  // The bug this whole branch exists for: the user (or an old importer) stored
  // an email behind an https:// prefix. Detect it *before* treating it as a URL.
  const withoutScheme = v.replace(/^https?:\/\//i, '');
  if (looksLikeEmail(withoutScheme)) {
    return { kind: 'email', value: `mailto:${normalizeEmail(withoutScheme)}`, platform: 'email' };
  }

  // A bare address, no scheme at all.
  if (looksLikeEmail(v)) {
    return { kind: 'email', value: `mailto:${normalizeEmail(v)}`, platform: 'email' };
  }

  if (platform === 'whatsapp') {
    // WhatsApp wants digits only; a pasted wa.me link still works.
    if (looksLikePhone(withoutScheme)) {
      return { kind: 'whatsapp', value: `https://wa.me/${normalizeWhatsApp(withoutScheme)}`, platform: 'whatsapp' };
    }
  }

  if (platform === 'phone' && looksLikePhone(withoutScheme)) {
    return { kind: 'phone', value: `tel:${normalizePhone(withoutScheme)}`, platform: 'phone' };
  }

  // Anything with an unsupported scheme is refused before it can become an href.
  if (DANGEROUS_SCHEMES.test(v)) {
    return { kind: 'url', value: v, platform: 'custom', error: 'That kind of link is not allowed' };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
  return { kind: 'url', value: withScheme, platform: 'custom' };
};

/**
 * The bare hostname of any pasted value, or '' when there isn't one.
 * Used to decide whether the URL has changed enough to re-run auto-detection.
 */
export const hostOfValue = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(candidate).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/** Resolves the platform key for a URL, falling back to "custom". */
export const detectPlatform = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return 'custom';
  if (/^mailto:/i.test(v) || looksLikeEmail(v)) return 'email';
  if (/^tel:/i.test(v)) return 'phone';

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const { hostname } = new URL(candidate);
    return matchDomain(hostname) || 'custom';
  } catch {
    return 'custom';
  }
};

/**
 * Repairs a URL that was stored badly. Runs both in the migration and at render
 * time, so an old `https://user@domain.com` link is fixed even before the
 * one-off script has run against that row.
 */
export const repairStoredUrl = (url, platform) => {
  const v = String(url ?? '').trim();
  if (!v) return v;

  if (/^mailto:/i.test(v)) return `mailto:${normalizeEmail(v)}`;
  if (/^tel:/i.test(v)) return `tel:${normalizePhone(v)}`;

  // https://someone@gmail.com  ->  mailto:someone@gmail.com
  const noScheme = v.replace(/^https?:\/\//i, '');
  if (/^[^/?#\s]*@[^/?#\s]+$/.test(noScheme) && looksLikeEmail(noScheme)) {
    return `mailto:${normalizeEmail(noScheme)}`;
  }

  if (platform === 'email' && looksLikeEmail(noScheme)) {
    return `mailto:${normalizeEmail(noScheme)}`;
  }

  return v;
};

/** The value a visitor's browser should actually follow. */
export const toDestination = (link) => repairStoredUrl(link?.url, link?.platform);

/**
 * What we show as text. An email shows as the address alone, never the
 * `mailto:` prefix or a stray `https://`.
 */
export const displayAddress = (link) => {
  const url = repairStoredUrl(link?.url, link?.platform);
  if (/^mailto:/i.test(url)) return url.replace(/^mailto:/i, '');
  if (/^tel:/i.test(url)) return url.replace(/^tel:/i, '');
  return url;
};

/** mailto: and tel: must not open a new tab — browsers render an empty one. */
export const opensInNewTab = (url) => !/^(mailto|tel):/i.test(String(url || '').trim());

/** The rel attribute every outbound anchor gets. */
export const OUTBOUND_REL = 'noopener noreferrer nofollow';

/** Human-friendly placeholder for the URL field, given the chosen platform. */
export const placeholderFor = (platform) => getPlatform(platform).placeholder || 'example.com';

/** The field caption, which changes for the contact-style platforms. */
export const urlFieldLabel = (platform) => {
  if (platform === 'email') return 'Email address';
  if (platform === 'phone') return 'Phone number';
  if (platform === 'whatsapp') return 'WhatsApp number';
  return 'URL';
};
