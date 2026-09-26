import { forwardRef, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { cn } from '../../lib/utils.js';

/**
 * Labelled form control with inline validation messaging.
 * Errors animate in rather than snapping, and are wired to the input through
 * `aria-describedby` / `aria-invalid`.
 */
const Field = forwardRef(function Field(
  {
    label,
    hint,
    error,
    success,
    counter,
    counterState,
    required,
    children,
    className,
    as = 'input',
    ...rest
  },
  ref
) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint || counter ? `${id}-hint` : undefined;
  const Control = as;

  return (
    <div className={cn('field', className)}>
      {label && (
        <label className="label" htmlFor={id}>
          <span>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
          </span>
          {counter}
        </label>
      )}

      <div className={cn('input-wrap', children && 'has-affix', error && 'input-wrap-error')}>
        <Control
          ref={ref}
          id={id}
          className={cn(as, error && 'input-error', success && 'input-success')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {children}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.span
            key="err"
            className="error-text"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <FiAlertCircle /> {error}
          </motion.span>
        ) : success ? (
          <motion.span
            key="ok"
            className="success-text"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <FiCheckCircle /> {success}
          </motion.span>
        ) : hint || counterState ? (
          <motion.span
            key="hint"
            className={cn('hint', counterState && `counter-${counterState}`)}
            id={describedBy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {hint}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export default Field;
