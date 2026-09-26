import { motion } from 'framer-motion';
import { formatNumber, useCountUp } from '../../lib/utils.js';

/** Stat number that animates from 0 to its value on mount. */
const AnimatedCounter = ({ value, duration = 1100, format = formatNumber, className }) => {
  const n = useCountUp(value, duration);
  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {format(n)}
    </motion.span>
  );
};

export default AnimatedCounter;
