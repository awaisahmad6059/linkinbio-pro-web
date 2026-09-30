import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiMail, FiShield, FiUser } from 'react-icons/fi';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Field from '../common/Field.jsx';
import SuccessCheck from '../common/SuccessCheck.jsx';
import { requestsApi, parseApiError } from '../../lib/api.js';
import { useToastStore } from '../../store/toastStore.js';

/**
 * The verification request form, opened from the dashboard.
 *
 * Replaces the old always-visible banner: instead of a permanent card of
 * explanatory text, an unverified account gets one button in the page header
 * that opens this. The modal spring-animates in, the fields stagger up, and the
 * first name is required because this person is signed in and choosing to fill
 * the form in — unlike the login screen's stranded-user form, which asks for as
 * little as possible.
 *
 * The email is shown read-only on purpose. The server ignores the submitted
 * address for this request type and files it against the session's account
 * (see requestController.createRequest), so an editable field would only ever
 * be ignored while looking like it mattered.
 */
const VerifyRequestModal = ({ open, onClose, user }) => {
  const success = useToastStore((s) => s.success);

  const [form, setForm] = useState({ firstName: '', lastName: '', message: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fresh every time it opens — no leftover error, name or "sent" state.
  // The display name is offered as a starting guess, split on the first space,
  // so a user who has already typed their name is not asked to type it again.
  useEffect(() => {
    if (!open) return;
    const [maybeFirst, ...rest] = String(user?.displayName || '').trim().split(/\s+/);
    const hasFullName = maybeFirst && rest.length > 0;
    setForm({
      firstName: hasFullName ? maybeFirst : '',
      lastName: hasFullName ? rest.join(' ') : '',
      message: '',
    });
    setErrors({});
    setFormError('');
    setSent(false);
  }, [open, user?.displayName]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const next = {};
    if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name';
    if (form.lastName.trim().length > 60) next.lastName = 'Under 60 characters';
    if (form.message.trim().length > 500) next.message = 'Keep this under 500 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await requestsApi.create({
        email: user.email,
        type: 'verify-email',
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      success('Request sent — an administrator will verify your account');
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Once submitted, the only way out is Done. Closing early would leave the user
  // unsure whether their request actually went through.
  const close = () => {
    setSent(false);
    setFormError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} maxWidth={460} labelledBy="verify-request-title">
      <div className="modal-pad">
        {sent ? (
          <div className="empty" style={{ padding: '26px 10px 20px' }}>
            <SuccessCheck size={58} />
            <div className="strong" style={{ marginTop: 10 }}>Request sent</div>
            <p className="small">
              An administrator will review your account and mark it verified. Your page stays
              live either way — the blue tick just appears once they do.
            </p>
            <Button variant="primary" className="btn-block" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <h3 className="card-title" id="verify-request-title" style={{ fontSize: 18, marginBottom: 4 }}>
              Request verification
            </h3>
            <p className="hint" style={{ marginBottom: 16 }}>
              Tell us who you are and an administrator will confirm your account.
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

              {/* Read-only, not disabled: a disabled input drops out of the form
                  and is skipped by screen readers, whereas this is genuinely
                  part of what the admin sees. */}
              <Field label="Email to verify" value={user.email} readOnly tabIndex={-1}>
                <span className="input-icon"><FiMail /></span>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field
                  label="First name"
                  required
                  placeholder="Awais"
                  value={form.firstName}
                  onChange={update('firstName')}
                  error={errors.firstName}
                  autoComplete="given-name"
                  maxLength={60}
                >
                  <span className="input-icon"><FiUser /></span>
                </Field>

                <Field
                  label="Last name"
                  placeholder="Ahmad"
                  value={form.lastName}
                  onChange={update('lastName')}
                  error={errors.lastName}
                  autoComplete="family-name"
                  maxLength={60}
                />
              </div>

              <Field
                label="Anything else? (optional)"
                as="textarea"
                rows={3}
                placeholder="A sentence about your page helps us confirm it's really yours."
                value={form.message}
                onChange={update('message')}
                error={errors.message}
                counter={`${form.message.length}/500`}
                maxLength={500}
              />

              <div className="hint row" style={{ gap: 6, marginTop: -2 }}>
                <FiShield /> Verification is a manual check by an administrator — not an email code.
              </div>

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

export default VerifyRequestModal;
