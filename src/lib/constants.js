import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaWhatsapp,
  FaSnapchat,
  FaPinterest,
  FaThreads,
  FaEnvelope,
  FaLink,
} from 'react-icons/fa6';

/**
 * Platform catalogue — mirrors `server/src/constants.js`.
 * `color` is used for the icon badge on link cards and inside public link buttons.
 */
export const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', short: 'Insta', Icon: FaInstagram, color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', short: 'Face', Icon: FaFacebookF, color: '#1877F2' },
  { key: 'linkedin', label: 'LinkedIn', short: 'LinkedIn', Icon: FaLinkedinIn, color: '#0A66C2' },
  { key: 'twitter', label: 'X (Twitter)', short: 'X', Icon: FaXTwitter, color: '#18181B' },
  { key: 'tiktok', label: 'TikTok', short: 'TikTok', Icon: FaTiktok, color: '#111111' },
  { key: 'youtube', label: 'YouTube', short: 'YouTube', Icon: FaYoutube, color: '#FF0000' },
  { key: 'whatsapp', label: 'WhatsApp', short: 'WhatsApp', Icon: FaWhatsapp, color: '#25D366' },
  { key: 'snapchat', label: 'Snapchat', short: 'Snap', Icon: FaSnapchat, color: '#F5C400' },
  { key: 'pinterest', label: 'Pinterest', short: 'Pin', Icon: FaPinterest, color: '#E60023' },
  { key: 'threads', label: 'Threads', short: 'Threads', Icon: FaThreads, color: '#18181B' },
  { key: 'email', label: 'Email', short: 'Email', Icon: FaEnvelope, color: '#4F46E5' },
  { key: 'custom', label: 'Custom', short: 'Custom', Icon: FaLink, color: '#6B6780' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));

export const getPlatform = (key) => PLATFORM_MAP[key] || PLATFORM_MAP.custom;

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
