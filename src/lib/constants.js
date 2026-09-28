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
];

export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.key, t]));

export const getTheme = (key) => THEME_MAP[key] || THEME_MAP.gradient;

export const BIO_MAX = 160;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
