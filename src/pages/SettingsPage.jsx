import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAtSign, FiLock, FiMail, FiTrash2 } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import UsernameField from '../components/auth/UsernameField.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { authApi, parseApiError } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';

/** Account settings: username, email, password and account deletion. */
const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const success = useToastStore((s) => s.success);
  const error = useToastStore((s) => s.error);

  const [username, setUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle' });
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameErrors, setUsernameErrors] = useState({});

  const [email, setEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailErrors, setEmailErrors] = useState({});
  const [savingEmail, setSavingEmail] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveUsername = async (e) => {
    e.preventDefault();
    if (usernameStatus.state !== 'available' && username !== user?.username) {
      setUsernameErrors({ username: 'Pick an available username first' });
      return;
    }
    setSavingUsername(true);
    try {
      const updated = await authApi.updateProfile({ username: username.trim().toLowerCase() });
      setUser(updated);
      setUsernameErrors({});
      success('Your public link has been updated');
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setUsernameErrors(fieldErrors);
      error(message);
    } finally {
      setSavingUsername(false);
    }
  };

  const emailChanged = email.trim().toLowerCase() !== (user?.email || '').toLowerCase();

  const saveEmail = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    } else if (emailChanged && !emailPassword) {
      // Checked here so the field is explained before a round trip, though the
      // server enforces it too.
      next.currentPassword = 'Enter your password to confirm this change';
    }
    setEmailErrors(next);
    if (Object.keys(next).length) return;

    setSavingEmail(true);
    try {
    const updated = await authApi.changeEmail(email.trim(), emailPassword);
    setUser(updated);
    setEmail(updated.email);
    setEmailPassword('');
      setEmailErrors({});
      success('Login email updated');
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setEmailErrors(fieldErrors);
      // A wrong password should not force the user to retype the address.
      if (fieldErrors.currentPassword) setEmailPassword('');
      error(message);
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwords.currentPassword) next.currentPassword = 'Enter your current password';
    if (passwords.newPassword.length < 8) next.newPassword = 'Use at least 8 characters';
    else if (!/[a-zA-Z]/.test(passwords.newPassword) || !/\d/.test(passwords.newPassword)) {
      next.newPassword = 'Include at least one letter and one number';
    }
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setSavingPassword(true);
    try {
      await authApi.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      success('Password changed');
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setPasswordErrors(fieldErrors);
      error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      // Navigate first, tear the session down second — the same ordering
      // AppShell.onLogout uses. Dropping the user while still on this protected
      // route let the guard redirect to /login over the landing page.
      navigate('/', { replace: true });
      logout();
    } catch (err) {
      error(parseApiError(err).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AppShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Account settings</h1>
              <p className="page-sub">Manage your public link, login details and data.</p>
            </div>
          </div>

          <div className="card card-pad settings-block" style={{ marginBottom: 18 }}>
            <div className="row gap-12">
              <Avatar src={user?.profilePhotoUrl} name={user?.displayName || user?.username} size="lg" />
              <div>
                <div className="settings-title">{user?.displayName || user?.username}</div>
                <div className="settings-desc">
                  Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-grid">
            {/* Public username */}
            <motion.form className="card settings-block" onSubmit={saveUsername} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="settings-title">
                <FiAtSign style={{ marginRight: 8, color: 'var(--brand)' }} />
                Public username
              </div>
              <p className="settings-desc">
                This is your page address. Changing it breaks links already shared — old links will
                stop working.
              </p>

              <div className="settings-form">
                <UsernameField
                  value={username}
                  onChange={setUsername}
                  onStatus={setUsernameStatus}
                  error={usernameErrors.username}
                />
                <Button type="submit" loading={savingUsername} disabled={username === user?.username}>
                  Save username
                </Button>
              </div>
            </motion.form>

            {/* Email */}
            <motion.form className="card settings-block" onSubmit={saveEmail} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}>
              <div className="settings-title">
                <FiMail style={{ marginRight: 8, color: 'var(--brand)' }} />
                Login email
              </div>
              <p className="settings-desc">Used to sign in. We never send marketing email.</p>

              <div className="settings-form">
                <Field
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailErrors({});
                  }}
                  error={emailErrors.email}
                  autoComplete="email"
                >
                  <span className="input-icon">
                    <FiMail />
                  </span>
                </Field>

                {/* Only asked for once the address actually changes, so the form
                    is not asking for a password to do nothing. */}
                <AnimatePresence initial={false}>
                  {emailChanged && (
                    <motion.div
                      key="confirm-email"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Field
                        type="password"
                        label="Confirm with your password"
                        placeholder="••••••••"
                        value={emailPassword}
                        onChange={(e) => {
                          setEmailPassword(e.target.value);
                          setEmailErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }}
                        error={emailErrors.currentPassword}
                        autoComplete="current-password"
                      >
                        <span className="input-icon">
                          <FiLock />
                        </span>
                      </Field>
                      <p className="settings-desc" style={{ marginTop: 6 }}>
                        The server checks this before the address changes, so a stolen session
                        cannot redirect your sign-in to someone else.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" loading={savingEmail} disabled={!emailChanged}>
                  Save email
                </Button>
              </div>
            </motion.form>

            {/* Password */}
            <motion.form className="card settings-block" onSubmit={savePassword} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
              <div className="settings-title">
                <FiLock style={{ marginRight: 8, color: 'var(--brand)' }} />
                Password
              </div>
              <p className="settings-desc">
                Stored hashed with bcrypt — we cannot see your password, only verify it.
              </p>

              <div className="settings-form">
                <Field
                  type="password"
                  label="Current password"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  error={passwordErrors.currentPassword}
                  autoComplete="current-password"
                />
                <Field
                  type="password"
                  label="New password"
                  placeholder="At least 8 characters"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  error={passwordErrors.newPassword}
                  hint="At least 8 characters, with a letter and a number."
                  autoComplete="new-password"
                />
                <Button type="submit" loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </motion.form>

            {/* Danger zone */}
            <motion.div className="card settings-block danger-zone" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
              <div className="settings-title" style={{ color: '#b91c1c' }}>
                <FiTrash2 style={{ marginRight: 8 }} />
                Delete account
              </div>
              <p className="settings-desc">
                This permanently removes your page, all {user?.username ? `/${user.username}` : ''} links, and
                every view and click recorded. It cannot be undone.
              </p>
              <Button variant="danger-soft" icon={FiTrash2} onClick={() => setConfirmDelete(true)} style={{ marginTop: 18 }}>
                Delete my account
              </Button>
            </motion.div>
          </div>
        </div>
      </PageTransition>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="Your page, links and all analytics data will be permanently removed. This cannot be undone."
        confirmLabel="Delete everything"
        loading={deleting}
        onConfirm={onDelete}
        onClose={() => setConfirmDelete(false)}
        icon={<FiTrash2 />}
      />
    </AppShell>
  );
};

export default SettingsPage;
