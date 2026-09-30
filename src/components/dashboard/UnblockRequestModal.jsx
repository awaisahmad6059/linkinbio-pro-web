import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiShield, FiSlash } from 'react-icons/fi';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Field from '../common/Field.jsx';
import SuccessCheck from '../common/SuccessCheck.jsx';
import { parseApiError, requestsApi } from '../../lib/api.js';
import { useToastStore } from '../../store/toastStore.js';

/**
 * Asks an admin to lift the block on one link.
 *
 * Without this, a blocked link is a one-way door for its owner: the admin said no,
 * the public page hides it, and there is no way back short of emailing support and
 * hoping. The request is the only route the owner has, so it is worth having even
 * though the decision is not theirs.
 *
 * Only the link id is sent. The server resolves the address itself and refuses
 * anything that is not a blocked link of the caller's, so this cannot be pointed
 * at somebody else's block even by editing the request by hand.
 */
const UnblockRequestModal = ({ open, link, onClose, onSent }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const success = useToastStore((s) => s.success);

  // Fresh every time it opens. A stale message from a previous request would be
  // attributed to the wrong link.
  useEffect(() => {
    if (!open) return;
    setMessage('');
    setError('');
    setSent(false);
  }, [open, link?._id]);

  if (!link) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await requestsApi.requestUnblock(link._id, message.trim());
      setSent(true);
      success('Request sent — an administrator will review your link');
      // Reported up so the card shows "requested" instead of offering the button
      // again. Without it the row would still claim it can ask, and the next
      // attempt would come back with a duplicate-request error.
      onSent?.(link._id);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setSent(false);
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} maxWidth={460} labelledBy="unblock-request-title">
      <div className="modal-pad">
        {sent ? (
          <div className="empty" style={{ padding: '26px 10px 20px' }}>
            <SuccessCheck size={58} />
            <div className="strong" style={{ marginTop: 10 }}>Request sent</div>
            <p className="small">
              An administrator will look at <strong>{link.url}</strong>. You will get a notification either way —
              if it stays blocked, they will say why.
            </p>
            <Button variant="soft" className="btn-block" style={{ marginTop: 10 }} onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <h3 className="card-title" id="unblock-request-title">
              Ask to unblock this link
            </h3>

            {error && (
              <motion.div
                className="error-text"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--danger-50)', padding: '10px 12px', borderRadius: 10 }}
              >
                <FiAlertCircle /> {error}
              </motion.div>
            )}

            <div className="link-blocked-note" style={{ marginBottom: 12 }}>
              <FiSlash aria-hidden="true" />
              {link.blockedReason ? link.blockedReason : 'Blocked by an administrator'}.
            </div>

            <Field
              label="Why should it come back? (optional)"
              as="textarea"
              rows={3}
              placeholder="A sentence about what this link is for helps the admin decide."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              counter={`${message.length}/500`}
              maxLength={500}
            />

            <div className="hint row" style={{ gap: 6, marginTop: -2 }}>
              <FiShield /> Only an administrator can unblock a link. Asking does not lift the block on its own.
            </div>

            <Button type="submit" className="btn-block" loading={submitting}>
              Send request
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default UnblockRequestModal;