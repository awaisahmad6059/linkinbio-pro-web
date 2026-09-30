import { PLATFORMS, PLATFORM_MAP, getPlatform } from '../config/platforms.js';

/**
 * Backwards-compatible re-exports.
 *
 * The platform catalogue now lives in `src/config/platforms.js` — it is the
 * single source of truth for the picker, the URL auto-detection and every
 * rendered icon. These aliases keep the older `getPlatform` import sites
 * working unchanged.
 *
 * The twelve original keys (instagram, facebook, linkedin, twitter, tiktok,
 * youtube, whatsapp, snapchat, pinterest, threads, email, custom) are preserved
 * verbatim, so links already stored against them keep resolving.
 */
export { PLATFORMS, PLATFORM_MAP, getPlatform };
export { PLATFORM_KEYS } from '../config/platforms.js';

// The original twelve, kept as a named export for the regression checks.
export const ORIGINAL_PLATFORM_KEYS = [
  'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube',
  'whatsapp', 'snapchat', 'pinterest', 'threads', 'email', 'custom',
];


/**
 * Theme catalogue. `sample` drives the live thumbnail mockups so each preview
 * shows the real thing rather than a flat swatch.
 */
export const THEMES = [
  {
    key: 'minimal',
    name: 'Minimal Light',
    blurb: 'Clean & editorial',
    accent: '#FFFFFF',
  },
  {
    key: 'dark',
    name: 'Dark Mode',
    blurb: 'Sleek & focused',
    accent: '#0B0B0F',
  },
  {
    key: 'gradient',
    name: 'Gradient',
    blurb: 'Animated & vibrant',
    accent: 'linear-gradient(135deg,#6D3BF5,#EC4899)',
  },
  {
    key: 'bold',
    name: 'Colorful Bold',
    blurb: 'Loud & playful',
    accent: '#FF4D8D',
  },
  {
    key: 'nature',
    name: 'Nature Soft',
    blurb: 'Calm & warm',
    accent: '#E7ECDC',
  },
  {
    // The only theme with no fixed palette of its own: it takes its background
    // from a photo the user uploads, which is why the accent is a gradient —
    // a single swatch would misrepresent every possible cover.
    key: 'custom',
    name: 'Custom Photo',
    blurb: 'Your own background',
    accent: 'linear-gradient(135deg,#2e1065,#6d28d9 45%,#db2777)',
  },
];

export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.key, t]));

export const getTheme = (key) => THEME_MAP[key] || THEME_MAP.gradient;

export const BIO_MAX = 160;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;

/**
 * Help-request types, kept in sync with `REQUEST_TYPES` on the server. The
 * login screen and the dashboard verification card both read this list.
 */
export const REQUEST_TYPES = [
  'verify-email',
  'password-reset',
  'account-suspend',
  'unblock-link',
  'other',
];

/**
 * Types that are raised from the dashboard against the caller's own account, and
 * are therefore not offered on the public "cannot sign in" form.
 *
 * Excluded by list rather than one exclusion at a time, so a new session-only
 * type cannot appear on the login screen by being added to `REQUEST_TYPES`
 * without remembering to hide it there.
 */
export const SESSION_ONLY_REQUEST_TYPES = ['verify-email', 'unblock-link'];

export const REQUEST_TYPE_LABELS = {
  'verify-email': 'Please verify my email',
  'password-reset': 'I forgot my password',
  'account-suspend': 'My account was suspended',
  'unblock-link': 'Please unblock my link',
  other: 'Something else',
};

export const REQUEST_STATUS_LABELS = {
  open: 'Open',
  resolved: 'Resolved',
};

/**
 * How a request was closed out. `rejected` is a real answer, not a failure, and
 * the admin panel offers both explicitly rather than folding "no" into "done".
 */
export const REQUEST_OUTCOME_LABELS = {
  resolved: 'Resolved',
  rejected: 'Declined',
};

/**
 * Notification types, mirrored from `NOTIFICATION_TYPES` on the server.
 *
 * `tone` drives the icon's colour, so a decision that went the user's way reads
 * differently from one that needs their attention: green for approved, amber for
 * un-verified or suspended, red for declined, and the brand colour for a plain
 * message from the team.
 */
export const NOTIFICATION_TONES = {
  'email-verified': { tone: 'ok' },
  'email-unverified': { tone: 'warn' },
  suspended: { tone: 'danger' },
  unsuspended: { tone: 'ok' },
  'password-reset': { tone: 'warn' },
  'request-resolved': { tone: 'ok' },
  'request-rejected': { tone: 'danger' },
  'link-blocked': { tone: 'danger' },
  'link-unblocked': { tone: 'ok' },
  'link-deleted': { tone: 'warn' },
  'admin-message': { tone: 'brand' },
};
