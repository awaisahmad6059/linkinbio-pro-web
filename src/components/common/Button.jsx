import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils.js';

const MotionLink = motion.create(Link);

/**
 * The single button primitive for the whole app.
 * Handles the loading spinner, tactile hover/press feedback, and can render as
 * a react-router `Link` (`to`) or an anchor (`href`).
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size,
    loading = false,
    disabled = false,
    className,
    to,
    href,
    icon: Icon,
    iconRight: IconRight,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = cn('btn', `btn-${variant}`, size && `btn-${size}`, className);
  const isDisabled = disabled || loading;

  const inner = (
    <>
      {loading ? (
        <motion.span
          className="spinner"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
        />
      ) : (
        Icon && <Icon style={{ fontSize: size === 'sm' ? 14 : 16 }} />
      )}
      {children}
      {!loading && IconRight && <IconRight style={{ fontSize: size === 'sm' ? 14 : 16 }} />}
    </>
  );

  const motionProps = {
    whileHover: isDisabled ? undefined : { y: -1 },
    whileTap: isDisabled ? undefined : { scale: 0.975 },
    transition: { type: 'spring', stiffness: 520, damping: 32 },
  };

  if (to) {
    return (
      <MotionLink ref={ref} to={to} className={classes} aria-disabled={isDisabled || undefined} {...motionProps} {...rest}>
        {inner}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <motion.a
        ref={ref}
        href={href}
        className={classes}
        target="_blank"
        rel="noreferrer noopener"
        {...motionProps}
        {...rest}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      {...motionProps}
      {...rest}
    >
      {inner}
    </motion.button>
  );
});

export default Button;
