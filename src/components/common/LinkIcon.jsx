import { memo, useState } from 'react';
import { getPlatform } from '../../config/platforms.js';
import { cn } from '../../lib/utils.js';
import { repairStoredUrl } from '../../lib/linkUrl.js';

/**
 * The only place a link icon is ever drawn.
 *
 * Dashboard cards, the live preview, the public page, the theme thumbnails, the
 * picker preview and the analytics breakdown all render this component, so they
 * can never drift apart.
 *
 * Resolution order (section 3 of the spec):
 *   1. an uploaded image  (iconType: image)
 *   2. an emoji           (iconType: emoji)
 *   3. the registry brand glyph
 *   4. the domain's favicon from a free no-key service
 *   5. a letter avatar derived from the hostname
 *
 * A step that fails hands over to the next one, so a broken image can never
 * reach the page.
 */

/** Perceived luminance, 0 (black) to 1 (white). */
const luminance = (hex) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const LIGHTEN = {
  '#18181B': '#F4F4F5', // X
  '#111111': '#F4F4F5', // TikTok, Threads
  '#181717': '#F4F4F5', // GitHub
  '#000000': '#E4E4E7', // Medium
  '#0A0A0A': '#E4E4E7', // DEV
  '#1E1E1E': '#E4E4E7', // Contra
  '#212121': '#E4E4E7', // CodePen
  '#163300': '#A3E635', // Wise
  '#7AB55C': '#A3E635', // Shopify on dark
};

/**
 * react-icons ships one monochrome glyph per brand, so a black logo cannot be
 * "flipped" the way an official SVG kit can. Instead a near-black brand colour
 * is swapped for a light tint when the icon sits on a dark surface, which is
 * what `tone="on-dark"` asks for.
 */
const glyphColor = (color, tone) => {
  if (tone !== 'on-dark') return color;
  if (LIGHTEN[color.toUpperCase()]) return LIGHTEN[color.toUpperCase()];
  return luminance(color) < 0.22 ? '#E4E4E7' : color;
};

/** Stable background colour for a letter avatar, derived from the hostname. */
const letterColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return `hsl(${hash} 62% 46%)`;
};

/** Pulls a bare hostname out of any link value, or '' for mailto:/tel:. */
export const hostnameOf = (link) => {
  const url = repairStoredUrl(link?.url, link?.platform);
  if (!url || /^(mailto|tel):/i.test(url)) return '';
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return '';
  }
};

/** Free, no-key favicon lookup. Only ever called with a validated hostname. */
const faviconUrl = (hostname) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;

const LinkIcon = memo(function LinkIcon({
  link,
  className,
  size = 28,
  tone = 'solid',
  title,
  // Picker tiles pass false: a tile shows the registry glyph (or a letter when
  // the brand has no icon), never a network request for a favicon.
  faviconFallback = true,
}) {
  const platform = getPlatform(link?.platform);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconWeak, setFaviconWeak] = useState(false);

  const host = hostnameOf(link);
  const iconType = link?.iconType || 'auto';
  const iconValue = link?.iconValue || '';

  // `image` — the user uploaded something.
  if (iconType === 'image' && iconValue && !imageFailed) {
    return (
      <span
        className={cn('link-icon', className)}
        style={{ width: size, height: size, background: link.iconColor || platform.color }}
        title={title}
      >
        <img
          className="link-icon-img"
          src={iconValue}
          alt=""
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  // `emoji` — one or two characters, drawn as text.
  if (iconType === 'emoji' && iconValue) {
    return (
      <span
        className={cn('link-icon', 'is-emoji', className)}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.55),
          background: link.iconColor || platform.color,
        }}
        title={title}
      >
        {iconValue}
      </span>
    );
  }

  // `letter` — skip straight to the avatar, or the user asked for it.
  const brandGlyph = platform.icon && iconType !== 'letter' && iconType !== 'favicon';
  if (brandGlyph) {
    const Glyph = platform.icon;
    const solid = tone === 'solid';
    return (
      <span
        className={cn('link-icon', className)}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.55),
          background: solid ? link?.iconColor || platform.color : 'transparent',
          color: solid ? '#fff' : glyphColor(platform.color, tone),
        }}
        title={title}
      >
        <Glyph />
      </span>
    );
  }

  // `favicon` — the domain's own icon, but only when we know a hostname.
  if (faviconFallback && host && !faviconWeak) {
    return (
      <span
        className={cn('link-icon', className)}
        style={{
          width: size,
          height: size,
          background: link?.iconColor || platform.color,
        }}
        title={title}
      >
        <img
          className="link-icon-img"
          src={faviconUrl(host)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          width={Math.round(size * 0.66)}
          height={Math.round(size * 0.66)}
          onError={() => setFaviconWeak(true)}
          // A tiny result is the service's generic globe, not the real logo.
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth && e.currentTarget.naturalWidth < 32) {
              setFaviconWeak(true);
            }
          }}
        />
      </span>
    );
  }

  // Last resort: the first letter, on a colour derived from the hostname.
  const seed = host || link?.label || '?';
  const letter = (link?.label || seed).trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={cn('link-icon', 'is-letter', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        background: link?.iconColor || (host ? letterColor(host) : platform.color),
      }}
      title={title}
    >
      {letter}
    </span>
  );
});

export default LinkIcon;
