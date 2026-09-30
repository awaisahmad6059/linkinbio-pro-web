import { memo } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiEdit2, FiMousePointer, FiSlash, FiTrash2 } from 'react-icons/fi';
import Switch from '../common/Switch.jsx';
import LinkIcon from '../common/LinkIcon.jsx';
import { cn } from '../../lib/utils.js';
import { displayAddress } from '../../lib/linkUrl.js';

/**
 * One row in the dashboard link list.
 *
 * Presentation only — the surrounding list owns the `<li>` and its entry/exit
 * animation. The inner element carries the dnd-kit drag transform so the drag
 * never fights the list's own reflow animation.
 */
const LinkCard = memo(function LinkCard({ link, onEdit, onDelete, onToggle, busy }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link._id });
  // A blocked link is hidden from the public page by an admin. The show/hide
  // switch is not merely disabled for it — leaving it live would invite a
  // pointless "why is my page empty" support request, since flipping it back on
  // changes nothing at all.
  const blocked = !!link.isBlocked;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'link-card',
        !link.isActive && !blocked && 'is-inactive',
        blocked && 'is-blocked',
        isDragging && 'is-dragging'
      )}
    >
      <button
        className="link-handle"
        type="button"
        aria-label={`Reorder ${link.label}`}
        {...attributes}
        {...listeners}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1].map((col) => (
              <circle key={`${row}-${col}`} cx={3.5 + col * 7} cy={3 + row * 4} r="1.5" />
            ))
          )}
        </svg>
      </button>

      <LinkIcon link={link} className="link-icon-badge" size={36} tone="solid" />

      <div className="link-card-body">
        <span className="link-card-title">{link.label}</span>
        <span className="link-card-url">{displayAddress(link)}</span>
        {blocked && (
          <span className="link-blocked-note">
            <FiSlash aria-hidden="true" />
            Blocked by an admin
            {link.blockedReason ? ` — ${link.blockedReason}` : ''}. Only they can bring it back.
          </span>
        )}
      </div>

      <span className="link-stat" title={`${link.clickCount} clicks`}>
        <FiMousePointer /> {link.clickCount}
      </span>

      <div className="link-card-actions">
        <button className="icon-btn" onClick={() => onEdit(link)} aria-label={`Edit ${link.label}`} disabled={busy}>
          <FiEdit2 />
        </button>
        <button
          className="icon-btn icon-btn-danger"
          onClick={() => onDelete(link)}
          aria-label={`Delete ${link.label}`}
          disabled={busy}
        >
          <FiTrash2 />
        </button>
        {blocked ? (
          // Not a disabled switch. A switch that does nothing is worse than no
          // switch: it looks like a control and reads as a bug.
          <span
            className="link-blocked-pill"
            title="An administrator blocked this link. It cannot be shown from your dashboard."
          >
            blocked
          </span>
        ) : (
          <Switch
            checked={!!link.isActive}
            onChange={(next) => onToggle(link, next)}
            disabled={busy}
            label={`${link.isActive ? 'Hide' : 'Show'} ${link.label}`}
          />
        )}
      </div>
    </div>
  );
});

export default LinkCard;

/* Sortable card used for the floating drag preview. */
export const LinkCardOverlay = ({ link }) => {
  return (
    <motion.div
      // Carries the blocked tint too. A drag preview that drops the marker would
      // show a blocked link looking live for the length of the drag, which is
      // exactly the state the marker exists to prevent.
      className={cn('link-card is-overlay', link.isBlocked && 'is-blocked')}
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.03, rotate: -1.2, y: -3 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      style={{ boxShadow: 'var(--sh-lg)', cursor: 'grabbing', width: 420, maxWidth: '100%' }}
    >
      <span className="link-handle" style={{ cursor: 'grabbing' }}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1].map((col) => <circle key={`${row}-${col}`} cx={3.5 + col * 7} cy={3 + row * 4} r="1.5" />)
          )}
        </svg>
      </span>
      <LinkIcon link={link} className="link-icon-badge" size={36} tone="solid" />
      <div className="link-card-body">
        <span className="link-card-title">{link.label}</span>
        <span className="link-card-url">{displayAddress(link)}</span>
        {link.isBlocked && (
          <span className="link-blocked-note">
            <FiSlash aria-hidden="true" />
            Blocked by an admin
          </span>
        )}
      </div>
    </motion.div>
  );
};
