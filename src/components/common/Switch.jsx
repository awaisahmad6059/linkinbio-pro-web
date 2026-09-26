import { motion } from 'framer-motion';
import { cn } from '../../lib/utils.js';

/** iOS-style toggle with a spring-driven knob flip. */
const Switch = ({ checked, onChange, disabled, label, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className={cn('switch')}
    data-on={checked}
    onClick={() => !disabled && onChange?.(!checked)}
  >
    <motion.span
      className="switch-thumb"
      animate={{ x: checked ? 18 : 0 }}
      transition={{ type: 'spring', stiffness: 620, damping: 34 }}
    >
      <motion.svg width="10" height="10" viewBox="0 0 24 24" fill="none" animate={{ opacity: checked ? 1 : 0 }} transition={{ duration: 0.15 }}>
        <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.span>
  </button>
);

export default Switch;
