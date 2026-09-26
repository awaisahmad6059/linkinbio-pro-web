import { motion } from 'framer-motion';
import { cn, initialsOf } from '../../lib/utils.js';

/**
 * Circular avatar. Falls back to initials on a brand gradient when the user has
 * not uploaded a photo yet.
 */
const Avatar = ({ src, name = '', size = 'md', className, style }) => {
  const dim = { xs: 26, sm: 34, md: 42, lg: 56, xl: 92 }[size] || 42;

  if (src) {
    return (
      <motion.img
        src={src}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        className={cn('avatar', `avatar-${size}`, className)}
        style={{ width: dim, height: dim, ...style }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    );
  }

  return (
    <motion.div
      className={cn('avatar avatar-fallback', `avatar-${size}`, className)}
      style={{ width: dim, height: dim, ...style }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </motion.div>
  );
};

export default Avatar;
