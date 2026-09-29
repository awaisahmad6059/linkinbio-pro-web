import { useState } from 'react';
import { FiCheckCircle, FiSend, FiShield } from 'react-icons/fi';
import Button from '../common/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { requestsApi, parseApiError } from '../../lib/api.js';

/**
 * The dashboard banner for an unverified account.
 *
 * Verification is an administrator's decision here, not a code the user redeems:
 * everything on this dashboard already works, only the badge changes. So the
 * single action is "ask the admin", which files a request the admin answers from
 * the Requests screen by marking the account verified (or suspending, deleting,
 * resetting the password).
 */
const EmailVerifyCard = () => {
  const user = useAuthStore((s) => s.user);
  const success = useToastStore((s) => s.success);
  const info = useToastStore((s) => s.info);

  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!user || user.emailVerified) return null;

  const askAdmin = async () => {
    setSending(true);
    try {
      await requestsApi.create({
        email: user.email,
        type: 'verify-email',
        message: 'Please verify my email address.',
      });
      setRequested(true);
      success('Request sent — an administrator will verify your account');
    } catch (err) {
      info(parseApiError(err).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card card-pad verify-card" role="note" data-verify-card>
      <span className="stat-icon" style={{ background: 'var(--warn-50)', color: 'var(--warn)' }}>
        <FiShield />
      </span>
      <div className="grow">
        <div className="small strong">Your email is not verified yet</div>
        <div className="tiny muted" style={{ marginTop: 2 }}>
          Ask an administrator to verify <strong>{user.email}</strong>. Everything on this
          dashboard already works — verification only adds the blue tick to your profile.
        </div>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {requested ? (
          <span className="row" style={{ gap: 6, color: 'var(--ok)', fontWeight: 600 }} data-verify-requested>
            <FiCheckCircle /> Request sent
          </span>
        ) : (
          <Button size="sm" icon={FiSend} onClick={askAdmin} loading={sending}>
            Request verification
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmailVerifyCard;
