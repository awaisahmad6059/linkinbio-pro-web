import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiLock, FiMail, FiUser } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import AuthShell from '../components/layout/AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import UsernameField from '../components/auth/UsernameField.jsx';
import SuccessCheck from '../components/common/SuccessCheck.jsx';
import { useAuthStore } from '../store/authStore.js';
import { parseApiError } from '../lib/api.js';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signup = useAuthStore((s) => s.signup);

  const [form, setForm] = useState({ displayName: '', email: '', password: '', username: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [usernameState, setUsernameState] = useState({ state: 'idle' });

  // Deep link from the 404 page's "Claim this name" CTA: /signup?username=octocat
  // pre-fills the field so the availability probe runs immediately.
  useEffect(() => {
    const preset = (searchParams.get('username') || '').trim().toLowerCase();
    if (!preset) return;
    setForm((f) => (f.username ? f : { ...f, username: preset }));
  }, [searchParams]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const passwordHint = () => {
    const p = form.password;
    if (!p) return 'At least 8 characters, with a letter and a number.';
    const checks = [p.length >= 8, /[a-zA-Z]/.test(p), /\d/.test(p)];
    return `${checks.filter(Boolean).length}/3 requirements met`;
  };

  const validate = () => {
    const next = {};
    if (!form.displayName.trim()) next.displayName = 'What should we call you?';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    else if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = 'Include at least one letter and one number';
    }
    if (!form.username) next.username = 'Pick a username';
    else if (usernameState.state === 'taken') next.username = usernameState.message || 'That username is taken';
    else if (usernameState.state !== 'available') next.username = 'Pick an available username';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setStatus('submitting');
    try {
      await signup({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim().toLowerCase(),
      });
      setStatus('success');
      setTimeout(() => navigate('/dashboard', { replace: true }), 820);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setStatus('idle');
    }
  };

  return (
    <PageTransition>
      <AuthShell title="Create your free page" subtitle="Two minutes from now, you will have a link worth putting in your bio.">
        {status === 'success' ? (
          <motion.div
            style={{ display: 'grid', placeItems: 'center', padding: '48px 0 24px', gap: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SuccessCheck size={76} />
            <div className="strong">Your page is live 🎉</div>
            <div className="muted small">Redirecting you to the dashboard…</div>
          </motion.div>
        ) : (
          <motion.form className="auth-form" onSubmit={onSubmit} variants={container} initial="hidden" animate="show" noValidate>
            <motion.div variants={item}>
              <Field
                label="Display name"
                placeholder="Awais Ahmad"
                value={form.displayName}
                onChange={update('displayName')}
                error={errors.displayName}
                autoComplete="name"
                required
              >
                <span className="input-icon">
                  <FiUser />
                </span>
              </Field>
            </motion.div>

            <motion.div variants={item}>
              <Field
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                autoComplete="email"
                required
              >
                <span className="input-icon">
                  <FiMail />
                </span>
              </Field>
            </motion.div>

            <motion.div variants={item}>
              <UsernameField
                value={form.username}
                onChange={(v) => {
                  setForm((f) => ({ ...f, username: v }));
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                onStatus={setUsernameState}
                error={errors.username}
              />
            </motion.div>

            <motion.div variants={item}>
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                hint={passwordHint()}
                counterState={form.password && form.password.length >= 8 ? 'ok' : undefined}
                autoComplete="new-password"
                required
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
              >
                <FiAlertCircle /> {formError}
              </motion.div>
            )}

            <motion.div variants={item}>
              <Button type="submit" size="lg" className="btn-block" loading={status === 'submitting'}>
                Create my free page
              </Button>
            </motion.div>

            <motion.p variants={item} className="auth-foot">
              By creating an account you agree to keep things friendly. We never sell your data or
              run third-party trackers.
            </motion.p>

            <motion.p variants={item} className="auth-alt">
              Already have an account? <Link to="/login">Log in</Link>
            </motion.p>
          </motion.form>
        )}
      </AuthShell>
    </PageTransition>
  );
};

export default SignupPage;
