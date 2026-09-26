import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useToastStore } from '../../store/toastStore.js';

const ICONS = { success: FiCheckCircle, error: FiAlertCircle, info: FiInfo };

/** Fixed bottom-right stack of transient notifications. */
const Toaster = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone] || FiInfo;
          return (
            <motion.div
              key={toast.id}
              className="toast"
              layout
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={() => dismiss(toast.id)}
            >
              <span className={`toast-icon-${toast.tone}`}>
                <Icon />
              </span>
              <span className="grow">{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;
