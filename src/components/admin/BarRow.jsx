import { motion } from 'framer-motion';
import { getPlatform } from '../../config/platforms.js';
import LinkIcon from '../common/LinkIcon.jsx';
import { formatNumber } from '../../lib/utils.js';

/**
 * A proportional bar used in the platform-usage and per-link breakdowns.
 *
 * The same easing and delay-stagger as the personal analytics list, so the two
 * screens read as the same component.
 */
export const BarRow = ({ label, value, max, platform, link, delay = 0, valueLabel }) => {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  const meta = getPlatform(platform);

  return (
    <div className="bar-row">
      <div className="bar-row-name">
        <LinkIcon
          link={link || { platform, url: '' }}
          size={22}
          tone="brand"
          faviconFallback={false}
          className="bar-row-icon"
        />
        <span className="truncate" title={label}>
          {label}
        </span>
      </div>
      <div className="bar-row-track">
        <motion.div
          className="bar-row-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: `linear-gradient(90deg, ${meta.color} 0%, #a855f7 100%)` }}
        />
      </div>
      <div className="bar-row-value">{valueLabel || formatNumber(value)}</div>
    </div>
  );
};

export default BarRow;
