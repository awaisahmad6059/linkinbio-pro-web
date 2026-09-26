import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiLock, FiMail } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import AuthShell from '../components/layout/AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import SuccessCheck from '../components/common/SuccessCheck.jsx';
import { useAuthStore } from '../store/authStore.js';
import { parseApiError } from '../lib/api.js';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success

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
      await login({ email: form.email.trim(), password: form.password });
      setStatus('success');
      // Brief checkmark beat before we move them into the dashboard.
      setTimeout(() => navigate(location.state?.from || '/dashboard', { replace: true }), 780);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setStatus('idle');
    }
  };

  return (
    <PageTransition>
      <AuthShell title="Welcome back" subtitle="Log in to manage your page, links and analytics.">
        {status === 'success' ? (
          <motion.div
            style={{ display: 'grid', placeItems: 'center', padding: '48px 0 24px', gap: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SuccessCheck size={72} />
            <div className="strong">Signed in — taking you to your dashboard</div>
          </motion.div>
        ) : (
          <motion.form className="auth-form" onSubmit={onSubmit} variants={container} initial="hidden" animate="show" noValidate>
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
              >
                <FiAlertCircle /> {formError}
              </motion.div>
            )}

            <motion.div variants={item}>
              <Button type="submit" size="lg" className="btn-block" loading={status === 'submitting'}>
                Log in
              </Button>
            </motion.div>

            <motion.p variants={item} className="auth-alt">
              New to LinkInBio Pro? <Link to="/signup">Create a free page</Link>
            </motion.p>
          </motion.form>
        )}
      </AuthShell>
    </PageTransition>
  );
};

export default LoginPage;
