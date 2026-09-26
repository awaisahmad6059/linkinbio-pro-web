import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { cn } from '../../lib/utils.js';

/**
 * Centred modal dialog: backdrop fade, spring pop-in, Esc to close,
 * scroll lock, and focus moved to the panel on open.
 */
const Modal = ({ open, onClose, children, labelledBy, className, maxWidth }) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
          <motion.div
            className={cn('modal', className)}
            style={maxWidth ? { maxWidth } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, duration: 0.28 }}
          >
            <button className="icon-btn" style={{ position: 'absolute', top: 14, right: 14 }} onClick={onClose} aria-label="Close dialog">
              <FiX />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
