import { motion } from 'framer-motion';

/**
 * Animated success badge: the ring pops, the tick draws itself with
 * `pathLength`, then a soft pulse radiates outwards. Used after a successful
 * signup/login and for the first publish.
 */
const SuccessCheck = ({ size = 64, color = 'var(--brand)', pulse = true }) => {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      {pulse && (
        <motion.span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: color,
            opacity: 0.22,
          }}
          initial={{ scale: 0.6, opacity: 0.35 }}
          animate={{ scale: [0.6, 1.35], opacity: [0.35, 0] }}
          transition={{ duration: 1.1, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.25 }}
        />
      )}

      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `2px solid ${color}`,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      />

      <motion.svg
        width={size * 0.46}
        height={size * 0.46}
        viewBox="0 0 24 24"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.15 }}
      >
        <motion.path
          d="M20 6.5L9.4 17.2 4 11.9"
          style={{ stroke: color.startsWith('#') ? color : 'var(--brand)' }}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.42, delay: 0.16, ease: [0.65, 0, 0.35, 1] }}
        />
      </motion.svg>
    </div>
  );
};

export default SuccessCheck;
