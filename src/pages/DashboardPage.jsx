import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiEye, FiMail, FiShield, FiZap } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import VerifiedBadge from '../components/common/VerifiedBadge.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import ProfileEditor from '../components/dashboard/ProfileEditor.jsx';
import LinkManager from '../components/dashboard/LinkManager.jsx';
import ThemePicker from '../components/dashboard/ThemePicker.jsx';
import CoverEditor from '../components/dashboard/CoverEditor.jsx';
import LivePreview from '../components/dashboard/LivePreview.jsx';
import VerifyRequestModal from '../components/dashboard/VerifyRequestModal.jsx';
import Button from '../components/common/Button.jsx';
import ConfettiBurst from '../components/common/ConfettiBurst.jsx';
import SuccessCheck from '../components/common/SuccessCheck.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';
import { authApi, parseApiError } from '../lib/api.js';
import { getTheme } from '../lib/constants.js';
import { normalizeCover } from '../lib/cover.js';

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const links = useAuthStore((s) => s.links);
  const setUser = useAuthStore((s) => s.setUser);

  const success = useToastStore((s) => s.success);
  const error = useToastStore((s) => s.error);

  const [theme, setTheme] = useState(user?.selectedTheme || 'gradient');
  // The `custom` theme's photo and adjustments, as one object the editor writes
  // into and every preview reads from.
  //
  // Deliberately seeded from the account exactly once and never re-synced after:
  // this is the live draft, and the account in the store is the server's echo of
  // whatever was last saved. Pulling the echo back in would undo whatever the
  // user has dialled in since — the same reason the preview has to stay ahead of
  // the save rather than follow it.
  const [cover, setCover] = useState(() =>
    normalizeCover({ image: user?.coverImage, ...(user?.coverSettings || {}) })
  );
  const [publishing, setPublishing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Keep local theme in sync if the profile loads/changes elsewhere.
  useEffect(() => {
    if (user?.selectedTheme) setTheme(user.selectedTheme);
  }, [user?.selectedTheme]);

  // Theme changes are persisted immediately — the preview updates first.
  const onThemeChange = async (next) => {
    setTheme(next);
    try {
      const updated = await authApi.updateProfile({ selectedTheme: next });
      setUser(updated);
    } catch (err) {
      error(parseApiError(err).message);
    }
  };

  const onPublish = async () => {
    setPublishing(true);
    try {
      const { firstPublish, publishedAt } = await authApi.publish();
      setUser({ ...user, publishedAt });

      if (firstPublish) {
        setCelebrate(true); // confetti burst
        setJustPublished(true);
        success('Your page is live 🎉');
        setTimeout(() => setJustPublished(false), 2600);
      } else {
        success('Saved — your page is up to date');
      }
    } catch (err) {
      error(parseApiError(err).message);
    } finally {
      setPublishing(false);
    }
  };

  const previewProfile = {
    username: user?.username,
    displayName: user?.displayName,
    bio: user?.bio,
    profilePhotoUrl: user?.profilePhotoUrl,
    // Carried so the phone preview draws the same verified tick the public
    // page will. Dropping it here is what made the preview drift from the
    // published page in the first place.
    emailVerified: user?.emailVerified,
  };

  const neverPublished = !user?.publishedAt;

  return (
    <AppShell>
      <PageTransition className="page">
        <div className="container">
          <ConfettiBurst trigger={celebrate} />

          <div className="page-head">
            <div>
              <h1 className="page-title">
                Your page{' '}
                <span className="muted-2" style={{ fontWeight: 500 }}>
                  /{user?.username}
                </span>
                {user?.emailVerified ? (
                  <VerifiedBadge title="Your account is verified" />
                ) : (
                  <span className="badge badge-neutral" title="Your email has not been verified yet">
                    <FiMail /> unverified
                  </span>
                )}
              </h1>
              <p className="page-sub">
                {neverPublished
                  ? 'Publish when you are ready — your page goes live instantly.'
                  : `Live since ${new Date(user.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </p>
            </div>

            <div className="row gap-8" style={{ position: 'relative' }}>
              {/* An unverified account gets one button here instead of a banner
                  of explanatory text across the page. The title beside it still
                  shows the grey "unverified" state. */}
              {!user?.emailVerified && user?.email && (
                <Button variant="outline" icon={FiShield} onClick={() => setVerifyOpen(true)}>
                  Request verification
                </Button>
              )}

              {user?.username && (
                <a className="btn btn-outline" href={`/${user.username}`} target="_blank" rel="noreferrer noopener">
                  <FiEye /> View live page
                </a>
              )}
              <Button onClick={onPublish} loading={publishing} icon={FiZap}>
                {neverPublished ? 'Publish my page' : 'Save & publish'}
              </Button>

              <AnimatePresence>
                {justPublished && (
                  <motion.div
                    style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 20 }}
                    initial={{ opacity: 0, scale: 0.7, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -6 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  >
                    <SuccessCheck size={58} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <VerifyRequestModal open={verifyOpen} onClose={() => setVerifyOpen(false)} user={user} />

          <div className="dash-layout">
            <div className="dash-col">
              <ProfileEditor />
              <LinkManager />
              <ThemePicker value={theme} onChange={onThemeChange} cover={cover} />

              {/* Only for the theme it belongs to. The photo and its adjustments
                  are kept whatever theme is selected, so switching to `dark` for
                  a week and coming back must not cost the user their upload. */}
              {theme === 'custom' && (
                <CoverEditor
                  cover={cover}
                  setCover={setCover}
                  profile={previewProfile}
                  links={links}
                />
              )}

              <div className="card card-pad" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="stat-icon" style={{ background: getTheme(theme).accent.includes('gradient') ? 'var(--brand-50)' : 'var(--line-soft)' }}>
                  <FiCheck />
                </span>
                <div className="grow">
                  <div className="small strong">Autosave is on</div>
                  <div className="tiny muted">
                    Profile, theme, background and link changes are saved as you make them.
                  </div>
                </div>
              </div>
            </div>

            <LivePreview profile={previewProfile} links={links} theme={theme} cover={cover} />
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
};

export default DashboardPage;
