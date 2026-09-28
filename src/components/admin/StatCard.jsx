import { motion } from 'framer-motion';
import AnimatedCounter from '../common/AnimatedCounter.jsx';
import { formatNumber } from '../../lib/utils.js';

/**
 * One headline number.
 *
 * Deliberately shaped like the stat tiles on the personal analytics page so the
 * two dashboards feel like the same product, and so a change to the shared look
 * lands on both.
 */
const StatCard = ({ Icon, label, value, hint, format, delay = 0, tone }) => {
  const accent = tone || 'var(--brand)';

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="stat-card-label">
        <span className="stat-icon" style={{ color: accent }}>
          <Icon />
        </span>
        {label}
      </div>
      <div className="stat-card-value">
        <AnimatedCounter value={value} format={format || formatNumber} />
      </div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </motion.div>
  );
};

export default StatCard;
