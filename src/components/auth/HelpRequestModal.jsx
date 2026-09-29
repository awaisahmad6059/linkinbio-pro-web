import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiMail, FiSend, FiShield, FiUserX } from 'react-icons/fi';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Field from '../common/Field.jsx';
import { requestsApi, parseApiError } from '../../lib/api.js';
import { REQUEST_TYPE_LABELS } from '../../lib/constants.js';

/**
 * A verification request is filed from the dashboard, where the account is
 * already signed in, so it is deliberately absent here: this form is for
 * people who cannot sign in at all, and offering it would only earn them a
 * rejection.
 */
const REQUEST_TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS)
  .filter(([value]) => value !== 'verify-email')
  .map(([value, label]) => ({
    value,
    label,
    Icon: {
      'password-reset': FiShield,
      'account-suspend': FiUserX,
      other: FiAlertCircle,
    }[value],
  }));

/**
 * The public "ask the admin for help" form.
 *
 * Used on the login screen by anyone who cannot get in: a forgotten password, a
 * suspension, or something else. It posts to the same `/api/requests` endpoint
 * that answers identically whether or not an email has an account — so this form
 * can never be used to probe the user table.
 */
const HelpRequestModal = ({ open, onClose, email: initialEmail = '', defaultType = 'other' }) => {
  const [form, setForm] = useState({ email: initialEmail, type: defaultType, message: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Each time the modal opens it is fresh: pre-filled with the email/type the
  // opening screen chose, no residual error or "sent" state.
  useEffect(() => {
    if (!open) return;
    setForm({ email: initialEmail, type: defaultType, message: '' });
    setErrors({});
    setFormError('');
    setSent(false);
  }, [open, initialEmail, defaultType]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await requestsApi.create({
        email: form.email.trim(),
        type: form.type,
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setSent(false);
    setFormError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} maxWidth={440} labelledBy="help-request-title">
      <div className="modal-pad">
        {sent ? (
          <div className="empty" style={{ padding: '26px 10px 20px' }}>
            <div className="empty-icon">
              <FiSend />
            </div>
            <div className="strong">Request sent</div>
            <p className="small">
              Your message is with the team. Allow some time for a reply — then check
              your inbox again.
            </p>
            <Button variant="primary" className="btn-block" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <h3 className="card-title" id="help-request-title" style={{ fontSize: 18, marginBottom: 4 }}>
              Get help
            </h3>
            <p className="hint" style={{ marginBottom: 16 }}>
              Tell us what happened and someone will get back to you by email.
            </p>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>
              {formError && (
                <motion.div
                  className="error-text"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--danger-50)', padding: '10px 12px', borderRadius: 10 }}
                >
                  <FiAlertCircle /> {formError}
                </motion.div>
              )}

              <Field
                label="Your email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                autoComplete="email"
              >
                <span className="input-icon"><FiMail /></span>
              </Field>

              <Field label="What do you need?" as="select" value={form.type} onChange={update('type')}>
                {REQUEST_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Field>

              <Field
                label="Message"
                as="textarea"
                rows={3}
                placeholder="Any details that help us help you faster."
                value={form.message}
                onChange={update('message')}
                counter={`${form.message.length}/500`}
              />

              <Button type="submit" className="btn-block" loading={submitting}>
                Send request
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};

export default HelpRequestModal;