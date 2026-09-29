import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiHelpCircle, FiLock, FiMail } from 'react-icons/fi';
import PageTransition from '../common/PageTransition.jsx';
import AuthShell from '../layout/AuthShell.jsx';
import Field from '../common/Field.jsx';
import Button from '../common/Button.jsx';
import SuccessCheck from '../common/SuccessCheck.jsx';
import HelpRequestModal from './HelpRequestModal.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { parseApiError } from '../../lib/api.js';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * One sign-in form, used by both `/login` and `/admin/login`.
 *
 * There is deliberately no admin-specific credential check: both screens post
 * to `POST /api/auth/login` and the server alone decides the role. Keeping a
 * single implementation means a fix to validation, error handling or the
 * success beat can never land on one screen and miss the other.
 *
 * `variant` only changes the words on the page. The redirect rule is shared and
 * role-driven — an admin lands in the admin area, anyone else in their own
 * dashboard — so a valid non-admin is never shown a dead end.
 */
const LoginForm = ({
  variant = 'default',
  title = 'Welcome back',
  subtitle = 'Log in to manage your page, links and analytics.',
  submitLabel = 'Log in',
  successMessage = 'Signed in — taking you to your dashboard',
  note = null,
  footer = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [helpOpen, setHelpOpen] = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setStatus('submitting');
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      setStatus('success');
      // The /admin guard re-checks the role server-side, so sending a non-admin
      // to /admin bounces them to their own dashboard rather than dead-ending.
      const home = user?.role === 'admin' ? '/admin' : '/dashboard';
      // Brief checkmark beat before we move them in.
      setTimeout(() => navigate(location.state?.from || home, { replace: true }), 780);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setStatus('idle');
    }
  };

  return (
    <PageTransition>
      <AuthShell title={title} subtitle={subtitle}>
        {status === 'success' ? (
          <motion.div
            style={{ display: 'grid', placeItems: 'center', padding: '48px 0 24px', gap: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SuccessCheck size={72} />
            <div className="strong">{successMessage}</div>
          </motion.div>
        ) : (
          <motion.form
            className="auth-form"
            onSubmit={onSubmit}
            variants={container}
            initial="hidden"
            animate="show"
            noValidate
            data-login-variant={variant}
          >
            {note && (
              <motion.div variants={item}>
                {note}
              </motion.div>
            )}

            <motion.div variants={item}>
              <Field
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                autoComplete="email"
                autoFocus
              >
                <span className="input-icon">
                  <FiMail />
                </span>
              </Field>
            </motion.div>

            <motion.div variants={item}>
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                autoComplete="current-password"
              >
                <span className="input-icon">
                  <FiLock />
                </span>
              </Field>
            </motion.div>

            {formError && (
              <motion.div
                className="error-text"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--danger-50)', padding: '10px 12px', borderRadius: 10 }}
                role="alert"
              >
                <FiAlertCircle /> {formError}
              </motion.div>
            )}

            <motion.div variants={item}>
              <Button type="submit" size="lg" className="btn-block" loading={status === 'submitting'}>
                {submitLabel}
              </Button>
            </motion.div>

            {variant === 'default' && (
              <motion.div variants={item}>
                <button
                  type="button"
                  className="auth-help-link"
                  onClick={() => setHelpOpen(true)}
                >
                  <FiHelpCircle /> Trouble signing in?
                </button>
              </motion.div>
            )}

            {footer && (
              <motion.p variants={item} className="auth-alt">
                {footer}
              </motion.p>
            )}
          </motion.form>
        )}

        <HelpRequestModal
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          defaultType="password-reset"
          email={form.email}
        />
      </AuthShell>
    </PageTransition>
  );
};

export default LoginForm;
