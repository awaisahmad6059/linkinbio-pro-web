import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiHome, FiLink2 } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { ProfileView } from '../components/profile/ProfileView.jsx';
import { publicApi, parseApiError } from '../lib/api.js';

/** Pulsing placeholder that mirrors the public page's shape while loading. */
const ProfileSkeleton = () => (
  <div className="profile is-page" style={{ background: 'var(--bg)' }}>
    <div className="profile-inner">
      <div className="skeleton skeleton-circle" style={{ width: 96, height: 96 }} />
      <div className="skeleton skeleton-text" style={{ width: 168, height: 20, marginTop: 20 }} />
      <div className="skeleton skeleton-text" style={{ width: 120, height: 11, marginTop: 10 }} />
      <div className="skeleton skeleton-text" style={{ width: 240, height: 12, marginTop: 20 }} />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ width: '100%', height: 56, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * The public creator page at `/:username`.
 *
 * No login required. Every visit is counted, and each link tap fires a
 * fire-and-forget beacon while the browser opens the destination immediately.
 */
const PublicProfilePage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const viewFired = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    viewFired.current = false;

    publicApi
      .profile(username)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);

        // Count the view once per mount, after the page is known to exist.
        if (!viewFired.current) {
          viewFired.current = true;
          publicApi.registerView(username).catch(() => {});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(parseApiError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const onLinkClick = (link) => {
    // Fire-and-forget: the anchor already opened the URL in a new tab, so we
    // never await this and never block the visitor.
    publicApi.registerClick(link._id).catch(() => {});
  };

  if (error) {
    // A missing username is still a 404, so reuse the real 404 screen and just
    // offer the "claim this name" path on top of it.
    if (error.status === 404) {
      return (
        <NotFoundPage
          detail={`Nobody has claimed “/${username}” yet. If that is your name, you can grab it before someone else does.`}
        >
          <Button to={`/signup?username=${encodeURIComponent(username)}`} icon={FiLink2}>
            Claim “{username}”
          </Button>
        </NotFoundPage>
      );
    }

    return (
      <PageTransition className="profile is-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="empty" style={{ maxWidth: 420 }}>
          <motion.div
            className="empty-icon"
            style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
          >
            <FiAlertCircle />
          </motion.div>

          <h1 className="card-title" style={{ fontSize: 22 }}>
            Something went wrong
          </h1>
          <p className="small muted" style={{ maxWidth: 340 }}>
            {error.message}
          </p>

          <div className="row gap-8" style={{ marginTop: 14 }}>
            <Button to="/" variant="outline" icon={FiHome}>
              Go home
            </Button>
            <Button to="/signup">Create your page</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!data) return <ProfileSkeleton />;

  return (
    <PageTransition>
      <ProfileView
        isPage
        theme={data.profile.selectedTheme}
        profile={data.profile}
        links={data.links}
        onLinkClick={onLinkClick}
      />
    </PageTransition>
  );
};

export default PublicProfilePage;
