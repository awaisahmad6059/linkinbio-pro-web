import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { THEME_MAP, THEMES } from '../../lib/constants.js';
import { ProfileView } from '../profile/ProfileView.jsx';
import { SAMPLE_COVER } from '../../lib/cover.js';

/**
 * Theme picker: a horizontally scrollable row of real rendered mockups
 * (not flat swatches). Selecting one instantly updates the live preview, which
 * crossfades in the dashboard panel.
 *
 * The `custom` tile shows the user's own uploaded photo and the adjustments as
 * they stand, not a stand-in — so it doubles as a second, glanceable answer to
 * "what have I actually done to my background". With nothing uploaded yet it
 * falls back to the built-in sample, which is also what the landing page and the
 * "no photo yet" preview use.
 */
const ThemePicker = ({ value, onChange, cover }) => {
  const rowRef = useRef(null);

  const scrollLeft = useCallback(() => {
    rowRef.current?.scrollBy({ left: -250, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    rowRef.current?.scrollBy({ left: 250, behavior: 'smooth' });
  }, []);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Theme</div>
          <div className="hint" style={{ marginTop: 2 }}>
            Pick a look — the preview updates instantly
          </div>
        </div>
        <span className="badge badge-brand">{THEME_MAP[value]?.name || 'Gradient'}</span>
      </div>

      <div className="theme-row-wrapper">
        <button
          type="button"
          className="theme-scroll-btn theme-scroll-btn--left"
          onClick={scrollLeft}
          aria-label="Scroll themes left"
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="theme-row" role="radiogroup" aria-label="Page theme" ref={rowRef}>
          {THEMES.map((theme) => {
            const active = theme.key === value;
            // Only the custom tile draws a background, and it draws the user's own —
            // so the tile is a second, glanceable answer to "what have I done to my
            // background". With nothing uploaded it falls back to the same sample the
            // landing page uses.
            const tileCover =
              theme.key === 'custom' ? (cover?.image ? cover : SAMPLE_COVER) : undefined;
            return (
              <motion.button
                key={theme.key}
                type="button"
                role="radio"
                aria-checked={active}
                className={`theme-tile${active ? ' is-active' : ''}`}
                onClick={() => onChange(theme.key)}
                whileTap={{ scale: 0.96 }}
              >
                <div className="theme-tile-frame">
                  <ProfileView
                    compact
                    animate={false}
                    theme={theme.key}
                    cover={tileCover}
                    profile={{ displayName: 'Your Name', username: 'yourname', bio: 'A short line about you' }}
                    links={[
                      { _id: 's1', label: 'Shop my store', platform: 'instagram', isActive: true },
                      { _id: 's2', label: 'Watch my videos', platform: 'youtube', isActive: true },
                      { _id: 's3', label: 'Book a call', platform: 'email', isActive: true },
                    ]}
                  />
                </div>
                <div className="theme-tile-name">
                  <span>{theme.name}</span>
                  {active ? (
                    <motion.span
                      className="theme-tile-check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.6 }}
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <span style={{ width: 16 }} />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          className="theme-scroll-btn theme-scroll-btn--right"
          onClick={scrollRight}
          aria-label="Scroll themes right"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ThemePicker;
