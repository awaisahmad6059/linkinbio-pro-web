import { motion } from 'framer-motion';
import { THEME_MAP, THEMES } from '../../lib/constants.js';
import { ProfileView } from '../profile/ProfileView.jsx';

/**
 * Theme picker: a horizontally scrollable row of real rendered mockups
 * (not flat swatches). Selecting one instantly updates the live preview, which
 * crossfades in the dashboard panel.
 */
const ThemePicker = ({ value, onChange }) => (
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

    <div className="theme-row" role="radiogroup" aria-label="Page theme">
      {THEMES.map((theme) => {
        const active = theme.key === value;
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
  </div>
);

export default ThemePicker;
