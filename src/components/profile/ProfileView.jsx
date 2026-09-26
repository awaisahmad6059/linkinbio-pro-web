import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { getPlatform as platformMeta } from '../../lib/constants.js';
import { cn, toDestination as destOf } from '../../lib/utils.js';

/* Link button entrance — staggered slide-up so the list "reveals" itself. */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.7 },
  },
};

/**
 * The single source of truth for how a public page looks.
 *
 * Rendered in three places:
 *   1. the real route  `/:username`        (full page, animated entrance)
 *   2. the dashboard live preview          (compact, inside a phone frame)
 *   3. theme thumbnails / landing mockup   (compact, static)
 *
 * Because all three use this component, the preview is pixel-identical to the
 * published page.
 */
export const ProfileView = ({
  profile = {},
  links = [],
  theme = 'gradient',
  compact = false,
  animate = true,
  onLinkClick,
  showFooter = true,
  crossfade = false,
  isPage = false,
  className,
}) => {
  const displayName = profile.displayName || profile.username || 'Your name';
  const activeLinks = links.filter((l) => l.isActive !== false);

  const body = (themeKey, layerProps = {}) => (
    <div className={cn('profile', `theme-${themeKey}`, compact && 'is-compact', isPage && 'is-page', className)} {...layerProps}>
      <div className="profile-inner">
        {/* Photo fades + scales in first, so the page feels like it reveals itself */}
        <motion.div
          className="profile-avatar"
          initial={animate ? { opacity: 0, scale: 0.82 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={animate ? { type: 'spring', stiffness: 300, damping: 22, delay: 0.04 } : { duration: 0 }}
        >
          {profile.profilePhotoUrl ? (
            <motion.img
              src={profile.profilePhotoUrl}
              alt={displayName}
              initial={animate ? { scale: 1.08 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </motion.div>

        <motion.h1
          className="profile-name"
          initial={animate ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          {displayName}
        </motion.h1>

        {profile.username && (
          <motion.p
            className="profile-handle"
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            @{profile.username}
          </motion.p>
        )}

        {profile.bio ? (
          <motion.p
            className="profile-bio"
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {profile.bio}
          </motion.p>
        ) : null}

        {activeLinks.length > 0 ? (
          <motion.div
            className="profile-links"
            variants={animate ? listVariants : undefined}
            initial={animate ? 'hidden' : false}
            animate="show"
          >
            {activeLinks.map((link) => {
              const platform = platformMeta(link.platform);
              return (
                <motion.a
                  key={link._id}
                  href={destOf(link)}
                  className="plink"
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={animate ? itemVariants : undefined}
                  whileTap={animate ? { scale: 0.975 } : { scale: 0.975 }}
                  onClick={(e) => onLinkClick?.(link, e)}
                >
                  <span className="plink-icon" style={{ background: platform.color, color: '#fff' }}>
                    <platform.Icon />
                  </span>
                  <span className="plink-label">{link.label}</span>
                  {!compact && <FiArrowUpRight className="plink-arrow" />}
                </motion.a>
              );
            })}
          </motion.div>
        ) : (
          <div className="profile-empty">No links are live on this page yet.</div>
        )}

        {showFooter && !compact && (
          <motion.div
            className="profile-footer"
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + activeLinks.length * 0.06 }}
          >
            <span>Made with</span>
            <a href="/" target="_blank" rel="noopener noreferrer">
              LinkInBio Pro
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Theme changes crossfade rather than snap (used by the dashboard preview).
  if (crossfade) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={theme}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {body(theme)}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return body(theme);
};

export default ProfileView;
