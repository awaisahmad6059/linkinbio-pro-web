import Button from './Button.jsx';
import Modal from './Modal.jsx';

/** Destructive-action confirmation used for delete link / delete account. */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  tone = 'danger',
  onConfirm,
  onClose,
  icon = null,
  children,
}) => (
  <Modal open={open} onClose={loading ? () => {} : onClose} maxWidth={430} labelledBy="confirm-title">
    <div className={`modal-icon modal-icon-${tone === 'danger' ? 'danger' : 'brand'}`}>{icon}</div>
    <h3 className="card-title" id="confirm-title" style={{ fontSize: 18, marginTop: 16 }}>
      {title}
    </h3>
    <p className="confirm-text">{message}</p>
    {children}
    <div className="modal-actions">
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
