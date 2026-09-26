import { cn } from '../../lib/utils.js';

/**
 * Pulsing placeholder block. Used instead of spinners while data loads so the
 * layout never jumps when content arrives.
 */
const Skeleton = ({ width = '100%', height = 14, radius = 6, circle = false, className, style, ...rest }) => (
  <div
    className={cn('skeleton', circle && 'skeleton-circle', className)}
    style={{ width, height, borderRadius: circle ? '50%' : radius, ...style }}
    aria-hidden="true"
    {...rest}
  />
);

/** A stacked skeleton that mirrors the link-card layout. */
export const LinkCardSkeleton = () => (
  <div className="link-card" style={{ pointerEvents: 'none' }}>
    <div className="link-handle" />
    <Skeleton width={36} height={36} radius={10} />
    <div className="link-card-body">
      <Skeleton width="58%" className="skeleton-text" />
      <Skeleton width="82%" height={10} className="skeleton-text" style={{ marginTop: 6 }} />
    </div>
    <Skeleton width={54} height={22} radius={99} />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card" style={{ pointerEvents: 'none' }}>
    <Skeleton width={110} height={13} className="skeleton-text" />
    <Skeleton width={90} height={30} style={{ marginTop: 10 }} />
    <Skeleton width={120} height={11} className="skeleton-text" style={{ marginTop: 8 }} />
  </div>
);

export default Skeleton;
