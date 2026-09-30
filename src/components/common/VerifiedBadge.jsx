import { FiCheck } from 'react-icons/fi';
import { cn } from '../../lib/utils.js';

/**
 * The "confirmed account" mark: a blue disc with a white tick, the way Instagram
 * and WhatsApp show it. `tick` is the bare disc for sitting next to a name; the
 * default wraps that disc in a pill that also spells the word out.
 *
 * `className` is merged onto whichever variant renders, so a caller can place
 * the badge (e.g. beside a public profile handle) without a wrapper element.
 */
const VerifiedBadge = ({
  label = 'verified',
  tick = false,
  title = 'This account is verified',
  className = '',
}) => (
  <span
    className={cn(tick ? 'verified-tick' : 'badge badge-verified', className)}
    title={title}
    data-verified={tick ? 'tick' : 'badge'}
    aria-label={title}
  >
    {tick ? (
      <FiCheck strokeWidth={4} />
    ) : (
      <>
        <span className="verified-tick">
          <FiCheck strokeWidth={4} />
        </span>
        {label}
      </>
    )}
  </span>
);

export default VerifiedBadge;
