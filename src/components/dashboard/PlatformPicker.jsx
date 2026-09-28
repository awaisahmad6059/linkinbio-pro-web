import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { CATEGORIES, PLATFORMS, PLATFORM_MAP, POPULAR_KEYS, getPlatform } from '../../config/platforms.js';
import LinkIcon from '../common/LinkIcon.jsx';
import { cn } from '../../lib/utils.js';
import { detectPlatform } from '../../lib/linkUrl.js';

const RECENT_KEY = 'libpro.recentPlatforms';
const RECENT_MAX = 6;

const readRecent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((k) => PLATFORM_MAP[k]) : [];
  } catch {
    return [];
  }
};

const pushRecent = (key) => {
  try {
    const next = [key, ...readRecent().filter((k) => k !== key)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private browsing — recents are a nicety, not a requirement */
  }
};

/**
 * The platform chooser.
 *
 * Typing filters the tiles, and pasting a URL jumps straight to the matching
 * platform. It is fully keyboard operable: arrow keys move the highlight,
 * Enter selects, Escape clears the search.
 */
const PlatformPicker = ({ value, url, onChange }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const [focusIndex, setFocusIndex] = useState(-1);
  const gridRef = useRef(null);

  const matchesSearch = useCallback((platform) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    // A pasted URL should resolve to its platform, not just match a label.
    if (/^https?:\/\/|@|\.[a-z]{2,}(\/|$)/i.test(q)) {
      return detectPlatform(q) === platform.key;
    }
    return (
      platform.key.includes(q) ||
      platform.label.toLowerCase().includes(q) ||
      platform.short.toLowerCase().includes(q) ||
      (platform.domains || []).some((d) => d.includes(q))
    );
  }, [query]);

  const visible = useMemo(() => {
    const inCategory = PLATFORMS.filter(
      (p) => (category === 'all' || p.category === category) && matchesSearch(p)
    );

    // "Custom / Other" is always pinned last so it never floats to the top of a
    // search result for a site we have no tile for.
    const custom = inCategory.filter((p) => p.key === 'custom');
    const rest = inCategory.filter((p) => p.key !== 'custom');

    const searching = query.trim().length > 0;
    if (searching) return [...rest, ...custom];

    // Recents first, then the popular set, then the long tail.
    const seen = new Set();
    const ordered = [];
    for (const key of [...recent, ...POPULAR_KEYS, ...rest.map((p) => p.key)]) {
      if (seen.has(key) || key === 'custom') continue;
      const p = PLATFORM_MAP[key];
      if (p && (category === 'all' || p.category === category)) {
        seen.add(key);
        ordered.push(p);
      }
    }

    if (!expanded) {
      const limited = ordered.slice(0, 18);
      // Auto-detection can land on a platform that is neither recent nor
      // popular (an email address, say). Without this the selection would
      // happen silently with no tile highlighted, which reads as "nothing
      // happened". It is appended rather than swapped in so the popular tiles
      // stay put, and it is never duplicated by the "custom" entry that gets
      // pinned last below.
      const picked = value && value !== 'custom' ? PLATFORM_MAP[value] : null;
      if (picked && !limited.some((p) => p.key === picked.key)) limited.push(picked);
      return [...limited, ...custom];
    }
    return [...ordered, ...custom];
  }, [category, query, recent, expanded, matchesSearch, value]);

  const select = (key) => {
    onChange(key);
    pushRecent(key);
    setRecent(readRecent());
  };

  const onKeyDown = (e) => {
    if (!visible.length) return;
    const cols = 6;
    // The grid is 6 columns wide, so vertical arrows should move a full row.
    const clamp = (i) => Math.min(Math.max(i, 0), visible.length - 1);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIndex((i) => clamp(i + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusIndex((i) => clamp(i - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => clamp(i + cols));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => clamp(i - cols));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIndex(visible.length - 1);
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      select(visible[focusIndex].key);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  useEffect(() => {
    setFocusIndex(-1);
  }, [query, category, expanded]);

  // Move DOM focus to the highlighted tile so screen readers follow along.
  useEffect(() => {
    if (focusIndex < 0 || !gridRef.current) return;
    const el = gridRef.current.querySelectorAll('.platform-chip')[focusIndex];
    el?.focus();
  }, [focusIndex]);

  const preview = getPlatform(value);
  const hasResults = visible.length > 0;

  return (
    <div className="picker">
      <div className="picker-search">
        <FiSearch className="picker-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="picker-search-input"
          placeholder="Search platform or paste a link…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search platform or paste a link"
        />
        {query && (
          <button
            type="button"
            className="picker-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>

      <div className="picker-chips" role="tablist" aria-label="Platform categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={category === c.key}
            className={cn('picker-chip', category === c.key && 'is-active')}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {recent.length > 0 && !query.trim() && category === 'all' && (
        <div className="picker-hint">Recently used</div>
      )}

      <div
        className="platform-grid"
        ref={gridRef}
        role="radiogroup"
        aria-label="Link platform"
        onKeyDown={onKeyDown}
      >
        {visible.map(({ key, label, short }, i) => {
          const active = value === key;
          const wasRecent = recent.includes(key) && !query.trim() && category === 'all' && !expanded;
          return (
            <motion.button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              tabIndex={focusIndex === i ? 0 : -1}
              className={cn('platform-chip', active && 'is-active', wasRecent && 'is-recent')}
              onClick={() => select(key)}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            >
              <LinkIcon
                link={{ platform: key, url: '' }}
                size={22}
                tone="brand"
                faviconFallback={false}
                className="platform-chip-icon"
              />
              <span className="platform-chip-label">{short}</span>
              <AnimatePresence>
                {active && (
                  <motion.span
                    className="platform-chip-check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 24 }}
                  >
                    <FiCheck />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {!hasResults && (
        <p className="picker-empty">
          Can&apos;t find it? Choose <strong>Custom</strong> &mdash; we&apos;ll fetch its logo from the link.
        </p>
      )}

      {hasResults && !query.trim() && category === 'all' && (
        <button
          type="button"
          className="picker-expand"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show fewer' : `Show all ${PLATFORMS.length} platforms`}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-flex' }}
          >
            <FiChevronDown />
          </motion.span>
        </button>
      )}

      <div className="picker-preview">
        <span className="picker-preview-label">Preview</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={value}
            className="picker-preview-row"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <LinkIcon link={{ platform: value, url }} size={28} tone="solid" />
            <span className="picker-preview-text">
              <strong>{preview.label}</strong>
              <small>{query ? 'matches your search' : 'icon on your link'}</small>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlatformPicker;
