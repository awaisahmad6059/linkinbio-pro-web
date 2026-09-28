import {
  // Social
  SiInstagram, SiFacebook, SiX, SiTiktok, SiThreads, SiSnapchat, SiPinterest,
  SiReddit, SiBluesky, SiMastodon,
  // Freelance / work
  SiUpwork, SiFiverr, SiFreelancer, SiToptal,
  // Developer
  SiGithub, SiGitlab, SiBitbucket, SiStackoverflow, SiDevdotto, SiHashnode,
  SiLeetcode, SiKaggle, SiHuggingface, SiNpm,
  // Design
  SiBehance, SiDribbble, SiFigma, SiNotion,
  // Writing / creator
  SiMedium, SiSubstack, SiPatreon, SiKofi, SiBuymeacoffee, SiGumroad,
  // Video / streaming
  SiYoutube, SiTwitch, SiVimeo, SiKick,
  // Music / podcast
  SiSpotify, SiApplemusic, SiSoundcloud, SiApplepodcasts,
  // Messaging
  SiWhatsapp, SiTelegram, SiDiscord, SiSignal, SiMessenger,
  // Shop
  SiEtsy, SiShopify, SiEbay,
  // Payments
  SiPaypal, SiPayoneer, SiWise,
  // Contact
  SiCalendly, SiGooglemaps,
} from 'react-icons/si';

import {
  FaLinkedinIn, FaCodepen, FaAmazon,
  FaEnvelope, FaPhone, FaGlobe, FaLink,
} from 'react-icons/fa6';

/**
 * Icon imports come from two packs on purpose: react-icons/si carries most of
 * the brand marks, but a handful (LinkedIn, CodePen, Amazon) only exist in the
 * Font Awesome pack, and some regional brands (Canva, Contra, PeoplePerHour,
 * Daraz, JazzCash, Easypaisa) ship no icon at all. Every import below was
 * checked against the installed react-icons 5.7.0 — see verify-icons.mjs.
 *
 * A null `icon` is deliberate, not a placeholder: LinkIcon falls through to the
 * favicon and then the letter avatar for those.
 */
const UNSUPPORTED = null;

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'social', label: 'Social' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'developer', label: 'Developer' },
  { key: 'design', label: 'Design' },
  { key: 'creator', label: 'Creator' },
  { key: 'video', label: 'Video & Music' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'shop', label: 'Shop' },
  { key: 'payments', label: 'Payments' },
  { key: 'contact', label: 'Contact' },
];

/**
 * The platform registry — the single source of truth for the picker, the
 * auto-detection and every icon rendered anywhere in the app.
 *
 * `domains` are hostnames without `www.` / `m.`. Subdomains match too, so
 * `awais.behance.net` still resolves to Behance.
 *
 * The first twelve keys are the original set and must never be renamed —
 * existing links in the database reference them by string.
 */
export const PLATFORMS = [
  /* ------------------------------------------------------------- social */
  {
    key: 'instagram', label: 'Instagram', short: 'Insta', icon: SiInstagram, color: '#E1306C',
    category: 'social', placeholder: 'instagram.com/yourhandle',
    domains: ['instagram.com'],
  },
  {
    key: 'facebook', label: 'Facebook', short: 'Face', icon: SiFacebook, color: '#1877F2',
    category: 'social', placeholder: 'facebook.com/yourpage',
    domains: ['facebook.com', 'fb.com', 'fb.me'],
  },
  {
    key: 'linkedin', label: 'LinkedIn', short: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2',
    category: 'social', placeholder: 'linkedin.com/in/yourname',
    domains: ['linkedin.com', 'lnkd.in'],
  },
  {
    key: 'twitter', label: 'X (Twitter)', short: 'X', icon: SiX, color: '#18181B',
    category: 'social', placeholder: 'x.com/yourhandle',
    domains: ['x.com', 'twitter.com'],
  },
  {
    key: 'tiktok', label: 'TikTok', short: 'TikTok', icon: SiTiktok, color: '#111111',
    category: 'social', placeholder: 'tiktok.com/@yourhandle',
    domains: ['tiktok.com'],
  },
  {
    key: 'threads', label: 'Threads', short: 'Threads', icon: SiThreads, color: '#18181B',
    category: 'social', placeholder: 'threads.net/@yourhandle',
    domains: ['threads.net', 'threads.com'],
  },
  {
    key: 'snapchat', label: 'Snapchat', short: 'Snap', icon: SiSnapchat, color: '#F5C400',
    category: 'social', placeholder: 'snapchat.com/add/yourhandle',
    domains: ['snapchat.com'],
  },
  {
    key: 'pinterest', label: 'Pinterest', short: 'Pin', icon: SiPinterest, color: '#E60023',
    category: 'social', placeholder: 'pinterest.com/yourname',
    domains: ['pinterest.com', 'pinterest.co.uk', 'pin.it'],
  },
  {
    key: 'reddit', label: 'Reddit', short: 'Reddit', icon: SiReddit, color: '#FF4500',
    category: 'social', placeholder: 'reddit.com/u/yourname',
    domains: ['reddit.com'],
  },
  {
    key: 'bluesky', label: 'Bluesky', short: 'Bluesky', icon: SiBluesky, color: '#1185FE',
    category: 'social', placeholder: 'bsky.app/profile/you',
    domains: ['bsky.app'],
  },
  {
    key: 'mastodon', label: 'Mastodon', short: 'Mastodon', icon: SiMastodon, color: '#6364FF',
    category: 'social', placeholder: 'mastodon.social/@you',
    domains: ['mastodon.social', 'mastodon.online', 'mas.to'],
  },

  /* ---------------------------------------------------------- freelance */
  {
    key: 'upwork', label: 'Upwork', short: 'Upwork', icon: SiUpwork, color: '#14A800',
    category: 'freelance', placeholder: 'upwork.com/freelancers/~yourname',
    domains: ['upwork.com'],
  },
  {
    key: 'fiverr', label: 'Fiverr', short: 'Fiverr', icon: SiFiverr, color: '#1DBF73',
    category: 'freelance', placeholder: 'fiverr.com/yourname',
    domains: ['fiverr.com'],
  },
  {
    key: 'freelancer', label: 'Freelancer', short: 'Freelancer', icon: SiFreelancer, color: '#29B2FE',
    category: 'freelance', placeholder: 'freelancer.com/u/yourname',
    domains: ['freelancer.com'],
  },
  {
    key: 'peopleperhour', label: 'PeoplePerHour', short: 'PeoplePerHour', icon: UNSUPPORTED, color: '#FF7300',
    category: 'freelance', placeholder: 'peopleperhour.com/freelancer/yourname',
    domains: ['peopleperhour.com'],
  },
  {
    key: 'toptal', label: 'Toptal', short: 'Toptal', icon: SiToptal, color: '#204ECF',
    category: 'freelance', placeholder: 'toptal.com/yourname',
    domains: ['toptal.com'],
  },
  {
    key: 'contra', label: 'Contra', short: 'Contra', icon: UNSUPPORTED, color: '#1E1E1E',
    category: 'freelance', placeholder: 'contra.com/yourname',
    domains: ['contra.com'],
  },
  {
    key: 'rozee', label: 'Rozee.pk', short: 'Rozee', icon: UNSUPPORTED, color: '#0B7D3E',
    category: 'freelance', placeholder: 'rozee.pk/yourname',
    domains: ['rozee.pk'],
  },

  /* ----------------------------------------------------------- developer */
  {
    key: 'github', label: 'GitHub', short: 'GitHub', icon: SiGithub, color: '#181717',
    category: 'developer', placeholder: 'github.com/yourname',
    domains: ['github.com', 'github.io', 'githubusercontent.com'],
  },
  {
    key: 'gitlab', label: 'GitLab', short: 'GitLab', icon: SiGitlab, color: '#FC6D26',
    category: 'developer', placeholder: 'gitlab.com/yourname',
    domains: ['gitlab.com'],
  },
  {
    key: 'bitbucket', label: 'Bitbucket', short: 'Bitbucket', icon: SiBitbucket, color: '#0052CC',
    category: 'developer', placeholder: 'bitbucket.org/yourname',
    domains: ['bitbucket.org'],
  },
  {
    key: 'stackoverflow', label: 'Stack Overflow', short: 'StackOverflow', icon: SiStackoverflow, color: '#F48024',
    category: 'developer', placeholder: 'stackoverflow.com/users/123/you',
    domains: ['stackoverflow.com', 'stackexchange.com', 'superuser.com', 'serverfault.com'],
  },
  {
    key: 'devto', label: 'DEV Community', short: 'DEV', icon: SiDevdotto, color: '#0A0A0A',
    category: 'developer', placeholder: 'dev.to/yourname',
    domains: ['dev.to'],
  },
  {
    key: 'hashnode', label: 'Hashnode', short: 'Hashnode', icon: SiHashnode, color: '#2962FF',
    category: 'developer', placeholder: 'hashnode.dev/@yourname',
    domains: ['hashnode.dev', 'hashnode.com'],
  },
  {
    key: 'codepen', label: 'CodePen', short: 'CodePen', icon: FaCodepen, color: '#212121',
    category: 'developer', placeholder: 'codepen.io/yourname',
    domains: ['codepen.io'],
  },
  {
    key: 'leetcode', label: 'LeetCode', short: 'LeetCode', icon: SiLeetcode, color: '#FFA116',
    category: 'developer', placeholder: 'leetcode.com/yourname',
    domains: ['leetcode.com'],
  },
  {
    key: 'kaggle', label: 'Kaggle', short: 'Kaggle', icon: SiKaggle, color: '#20BEFF',
    category: 'developer', placeholder: 'kaggle.com/yourname',
    domains: ['kaggle.com'],
  },
  {
    key: 'huggingface', label: 'Hugging Face', short: 'HuggingFace', icon: SiHuggingface, color: '#FFD21E',
    category: 'developer', placeholder: 'huggingface.co/yourname',
    domains: ['huggingface.co'],
  },
  {
    key: 'npm', label: 'npm', short: 'npm', icon: SiNpm, color: '#CB3837',
    category: 'developer', placeholder: 'npmjs.com/package/yourname',
    domains: ['npmjs.com', 'npmjs.org', 'npm.im'],
  },

  /* -------------------------------------------------------------- design */
  {
    key: 'behance', label: 'Behance', short: 'Behance', icon: SiBehance, color: '#1769FF',
    category: 'design', placeholder: 'behance.net/yourname',
    domains: ['behance.net'],
  },
  {
    key: 'dribbble', label: 'Dribbble', short: 'Dribbble', icon: SiDribbble, color: '#EA4C89',
    category: 'design', placeholder: 'dribbble.com/yourname',
    domains: ['dribbble.com'],
  },
  {
    key: 'figma', label: 'Figma', short: 'Figma', icon: SiFigma, color: '#F24E1E',
    category: 'design', placeholder: 'figma.com/@yourname',
    domains: ['figma.com'],
  },
  {
    key: 'canva', label: 'Canva', short: 'Canva', icon: UNSUPPORTED, color: '#7D2AE8',
    category: 'design', placeholder: 'canva.com/design/yourname',
    domains: ['canva.com'],
  },
  {
    key: 'notion', label: 'Notion', short: 'Notion', icon: SiNotion, color: '#111111',
    category: 'design', placeholder: 'notion.so/yourname',
    domains: ['notion.so', 'notion.site', 'notion.sh'],
  },

  /* ------------------------------------------------------------- creator */
  {
    key: 'medium', label: 'Medium', short: 'Medium', icon: SiMedium, color: '#000000',
    category: 'creator', placeholder: 'medium.com/@yourname',
    domains: ['medium.com'],
  },
  {
    key: 'substack', label: 'Substack', short: 'Substack', icon: SiSubstack, color: '#FF6719',
    category: 'creator', placeholder: 'yourname.substack.com',
    domains: ['substack.com', 'substackcdn.com'],
  },
  {
    key: 'patreon', label: 'Patreon', short: 'Patreon', icon: SiPatreon, color: '#FF424D',
    category: 'creator', placeholder: 'patreon.com/yourname',
    domains: ['patreon.com'],
  },
  {
    key: 'kofi', label: 'Ko-fi', short: 'Ko-fi', icon: SiKofi, color: '#FF5E5B',
    category: 'creator', placeholder: 'ko-fi.com/yourname',
    domains: ['ko-fi.com'],
  },
  {
    key: 'buymeacoffee', label: 'Buy Me a Coffee', short: 'Coffee', icon: SiBuymeacoffee, color: '#FFDD00',
    category: 'creator', placeholder: 'buymeacoffee.com/yourname',
    domains: ['buymeacoffee.com', 'buymecoffee.com'],
  },
  {
    key: 'gumroad', label: 'Gumroad', short: 'Gumroad', icon: SiGumroad, color: '#FF90E8',
    category: 'creator', placeholder: 'gumroad.com/yourname',
    domains: ['gumroad.com'],
  },

  /* -------------------------------------------------- video & streaming */
  {
    key: 'youtube', label: 'YouTube', short: 'YouTube', icon: SiYoutube, color: '#FF0000',
    category: 'video', placeholder: 'youtube.com/@yourchannel',
    domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  },
  {
    key: 'twitch', label: 'Twitch', short: 'Twitch', icon: SiTwitch, color: '#9146FF',
    category: 'video', placeholder: 'twitch.tv/yourchannel',
    domains: ['twitch.tv'],
  },
  {
    key: 'vimeo', label: 'Vimeo', short: 'Vimeo', icon: SiVimeo, color: '#19B7EA',
    category: 'video', placeholder: 'vimeo.com/yourname',
    domains: ['vimeo.com'],
  },
  {
    key: 'kick', label: 'Kick', short: 'Kick', icon: SiKick, color: '#53FC18',
    category: 'video', placeholder: 'kick.com/yourchannel',
    domains: ['kick.com'],
  },
  {
    key: 'spotify', label: 'Spotify', short: 'Spotify', icon: SiSpotify, color: '#1DB954',
    category: 'video', placeholder: 'open.spotify.com/artist/yourname',
    domains: ['spotify.com', 'spotify.link'],
  },
  {
    key: 'applemusic', label: 'Apple Music', short: 'AppleMusic', icon: SiApplemusic, color: '#FA243C',
    category: 'video', placeholder: 'music.apple.com/us/artist/yourname',
    domains: ['music.apple.com', 'itunes.apple.com'],
  },
  {
    key: 'soundcloud', label: 'SoundCloud', short: 'SoundCloud', icon: SiSoundcloud, color: '#FF5500',
    category: 'video', placeholder: 'soundcloud.com/yourname',
    domains: ['soundcloud.com'],
  },
  {
    key: 'applepodcasts', label: 'Apple Podcasts', short: 'Podcasts', icon: SiApplepodcasts, color: '#9933CC',
    category: 'video', placeholder: 'podcasts.apple.com/us/podcast/yourname',
    domains: ['podcasts.apple.com'],
  },

  /* ----------------------------------------------------------- messaging */
  {
    key: 'whatsapp', label: 'WhatsApp', short: 'WhatsApp', icon: SiWhatsapp, color: '#25D366',
    category: 'messaging', placeholder: '+92 300 1234567', phone: true,
    domains: ['wa.me', 'whatsapp.com', 'chat.whatsapp.com', 'api.whatsapp.com'],
  },
  {
    key: 'telegram', label: 'Telegram', short: 'Telegram', icon: SiTelegram, color: '#26A5E4',
    category: 'messaging', placeholder: 't.me/yourname',
    domains: ['t.me', 'telegram.me', 'telegram.org'],
  },
  {
    key: 'discord', label: 'Discord', short: 'Discord', icon: SiDiscord, color: '#5865F2',
    category: 'messaging', placeholder: 'discord.gg/yourserver',
    domains: ['discord.gg', 'discord.com', 'discordapp.com'],
  },
  {
    key: 'signal', label: 'Signal', short: 'Signal', icon: SiSignal, color: '#3A76F0',
    category: 'messaging', placeholder: 'signal.me/#p/...',
    domains: ['signal.me'],
  },
  {
    key: 'messenger', label: 'Messenger', short: 'Messenger', icon: SiMessenger, color: '#A334FA',
    category: 'messaging', placeholder: 'm.me/yourname',
    domains: ['messenger.com', 'm.me'],
  },

  /* ---------------------------------------------------------------- shop */
  {
    key: 'etsy', label: 'Etsy', short: 'Etsy', icon: SiEtsy, color: '#F56400',
    category: 'shop', placeholder: 'etsy.com/shop/yourname',
    domains: ['etsy.com', 'etsy.me'],
  },
  {
    key: 'shopify', label: 'Shopify', short: 'Shopify', icon: SiShopify, color: '#7AB55C',
    category: 'shop', placeholder: 'yourshop.myshopify.com',
    domains: ['shopify.com', 'myshopify.com', 'bigcartel.com'],
  },
  {
    key: 'amazon', label: 'Amazon', short: 'Amazon', icon: FaAmazon, color: '#FF9900',
    category: 'shop', placeholder: 'amazon.com/dp/...',
    domains: ['amazon.com', 'amazon.co.uk', 'amazon.in', 'amazon.de', 'amazon.ae', 'amzn.to', 'a.co'],
  },
  {
    key: 'ebay', label: 'eBay', short: 'eBay', icon: SiEbay, color: '#E53238',
    category: 'shop', placeholder: 'ebay.com/usr/yourname',
    domains: ['ebay.com', 'ebay.co.uk', 'ebay.com.au', 'ebay.in'],
  },
  {
    key: 'daraz', label: 'Daraz', short: 'Daraz', icon: UNSUPPORTED, color: '#F85606',
    category: 'shop', placeholder: 'daraz.com.pk/...',
    domains: ['daraz.pk', 'daraz.com', 'daraz.la'],
  },

  /* ------------------------------------------------------------ payments */
  {
    key: 'paypal', label: 'PayPal', short: 'PayPal', icon: SiPaypal, color: '#003087',
    category: 'payments', placeholder: 'paypal.me/yourname',
    domains: ['paypal.com', 'paypal.me', 'pp.me'],
  },
  {
    key: 'payoneer', label: 'Payoneer', short: 'Payoneer', icon: SiPayoneer, color: '#FF4800',
    category: 'payments', placeholder: 'payoneer.com/...',
    domains: ['payoneer.com'],
  },
  {
    key: 'wise', label: 'Wise', short: 'Wise', icon: SiWise, color: '#163300',
    category: 'payments', placeholder: 'wise.com/invite/...',
    domains: ['wise.com', 'transferwise.com'],
  },
  {
    key: 'jazzcash', label: 'JazzCash', short: 'JazzCash', icon: UNSUPPORTED, color: '#B31E3A',
    category: 'payments', placeholder: 'jazzcash.com/go/...',
    domains: ['jazzcash.com'],
  },
  {
    key: 'easypaisa', label: 'Easypaisa', short: 'Easypaisa', icon: UNSUPPORTED, color: '#0B3B6F',
    category: 'payments', placeholder: 'easypaisa.com/...',
    domains: ['easypaisa.com'],
  },

  /* ------------------------------------------------------------- contact */
  {
    key: 'email', label: 'Email', short: 'Email', icon: FaEnvelope, color: '#4F46E5',
    category: 'contact', placeholder: 'you@example.com', contact: 'email',
    domains: [],
  },
  {
    key: 'phone', label: 'Phone', short: 'Phone', icon: FaPhone, color: '#0EA5E9',
    category: 'contact', placeholder: '+92 300 1234567', contact: 'phone',
    domains: [],
  },
  {
    key: 'website', label: 'Website', short: 'Website', icon: FaGlobe, color: '#6366F1',
    category: 'contact', placeholder: 'yourwebsite.com',
    domains: [],
  },
  {
    key: 'calendly', label: 'Calendly', short: 'Calendly', icon: SiCalendly, color: '#006BFF',
    category: 'contact', placeholder: 'calendly.com/yourname',
    domains: ['calendly.com'],
  },
  {
    key: 'googlemaps', label: 'Google Maps', short: 'Maps', icon: SiGooglemaps, color: '#34A853',
    category: 'contact', placeholder: 'maps.google.com/...',
    domains: ['maps.google.com', 'goo.gl', 'maps.app.goo.gl'],
  },
  {
    key: 'custom', label: 'Custom / Other', short: 'Custom', icon: FaLink, color: '#6B6780',
    category: 'contact', placeholder: 'example.com', contact: 'custom',
    domains: [],
  },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));

export const getPlatform = (key) => PLATFORM_MAP[key] || PLATFORM_MAP.custom;

/** Every registry key. The server mirrors exactly this list. */
export const PLATFORM_KEYS = PLATFORMS.map((p) => p.key);

/** Platforms surfaced before the user expands "Show all". */
export const POPULAR_KEYS = [
  'instagram', 'youtube', 'linkedin', 'twitter', 'facebook', 'tiktok',
  'github', 'upwork', 'fiverr', 'behance', 'telegram', 'whatsapp',
  'discord', 'spotify', 'threads', 'reddit', 'medium', 'custom',
];

/* --------------------------------------------------------------- matching */

// Longest-first so a specific host wins over a broader one, e.g. music.apple.com
// before apple.com, and a.co before a bare amazon.com guess.
const DOMAIN_INDEX = PLATFORMS
  .filter((p) => p.domains?.length)
  .flatMap((p) => p.domains.map((d) => [d.toLowerCase(), p.key]))
  .sort((a, b) => b[0].length - a[0].length);

/** Strips the noise a real hostname carries: www., m., en., shop. */
const baseHost = (host) =>
  String(host || '')
    .toLowerCase()
    .split(':')[0]
    .replace(/^(www|m|en|shop|uk)\./, '');

/**
 * Maps a hostname to a platform key by matching the domain and then any
 * parent domain, so `awais.behance.net` resolves through `behance.net`.
 * Returns null when nothing matches.
 */
export const matchDomain = (hostname) => {
  const host = baseHost(hostname);
  if (!host) return null;

  for (const [domain, key] of DOMAIN_INDEX) {
    if (host === domain || host.endsWith(`.${domain}`)) return key;
  }
  return null;
};
