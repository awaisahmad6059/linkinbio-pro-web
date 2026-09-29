import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiMail, FiShield } from 'react-icons/fi';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import Field from '../common/Field.jsx';
import HelpRequestModal from '../auth/HelpRequestModal.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { authApi, parseApiError } from '../../lib/api.js';

/**
 * The dashboard banner for an unverified account (Option A: everything else
 * already works, this is only the badge).
 *
 * Shows the one-time code that was mailed at signup for the user to enter. There
 * is deliberately no "resend" button in here: re-issuing a code from the browser
 * is an open email-bombing socket, so a lost or expired code goes through the
 * admin request flow instead.
 */
const EmailVerifyCard = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const success = useToastStore((s) => s.success);
  const info = useToastStore((s) => s.info);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (verifyOpen) {
      setCode('');
      setFieldError('');
    }
  }, [verifyOpen]);

  if (!user || user.emailVerified) return null;

  const submitCode = async (e) => {
    e.preventDefault();
    setFieldError('');
    const value = code.trim();
    if (!/^\d{6}$/.test(value)) {
      setFieldError('Enter the 6-digit code from your email');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await authApi.verifyOtp(value);
      setUser(updated);
      setVerifyOpen(false);
      success('Email verified — your account badge is now green');
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldError(parsed.message);
      // A burnt-out code (expired/lockout) is spent on the server, so the user
      // needs to know the next step is an admin, not a retyped guess.
      if (/expired|cannot verify|not correct/i.test(parsed.message)) {
        info('Lost the code? Ask the admin for a fresh one');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card card-pad verify-card" role="note" data-verify-card>
        <span className="stat-icon" style={{ background: 'var(--warn-50)', color: 'var(--warn)' }}>
          <FiMail />
        </span>
        <div className="grow">
          <div className="small strong">Your email is not verified yet</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>
            A one-time code was emailed to you at signup. Verifying keeps your page protected —
            everything else on this dashboard already works.
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" icon={FiShield} onClick={() => setVerifyOpen(true)}>
            Verify email
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setHelpOpen(true)}>
            Lost the code?
          </Button>
        </div>
      </div>

      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} maxWidth={420} labelledBy="verify-code-title">
            <div className="modal-pad">
              <h3 className="card-title" id="verify-code-title" style={{ fontSize: 18, marginBottom: 4 }}>
                Enter your code
              </h3>
              <p className="hint" style={{ marginBottom: 16 }}>
                The 6-digit code sent to <strong>{user.email}</strong>. It is valid for 15
                minutes from signup.
              </p>

              <form onSubmit={submitCode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>
                {fieldError && (
                  <motion.div
                    className="error-text"
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'var(--danger-50)', padding: '10px 12px', borderRadius: 10 }}
                  >
                    <FiAlertCircle /> {fieldError}
                  </motion.div>
                )}

                <Field
                  label="Verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="000000"
                  autoFocus
                />

                <Button type="submit" className="btn-block" loading={submitting}>
                  Verify
                </Button>
              </form>
            </div>
      </Modal>

      <HelpRequestModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        email={user.email}
        defaultType="verify-email"
      />
    </>
  );
};

export default EmailVerifyCard;