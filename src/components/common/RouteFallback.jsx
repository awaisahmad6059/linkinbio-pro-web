import { motion } from 'framer-motion';
import { LogoMark } from './Logo.jsx';

/** Shown while the stored session token is being verified. */
const RouteFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg)',
    }}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark />
      </motion.div>
      <div className="skeleton skeleton-text" style={{ width: 120, height: 10 }} />
    </motion.div>
  </div>
);

export default RouteFallback;
