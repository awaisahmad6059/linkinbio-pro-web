import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import PhoneFrame from '../common/PhoneFrame.jsx';
import { ProfileView } from '../profile/ProfileView.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { publicOrigin } from '../../lib/utils.js';

/**
 * Live preview panel.
 *
 * Renders the *real* `ProfileView` component inside a phone frame, so what the
 * user builds here is exactly what visitors get. Theme changes crossfade and
 * edits appear as they are typed.
 */
const LivePreview = ({ profile, links, theme }) => {
  const info = useToastStore((s) => s.info);
  const user = useAuthStore((s) => s.user);

  const onLinkClick = (link, event) => {
    // The preview is a mock of the public page — never actually navigate.
    event?.preventDefault();
    info(`“${link.label}” opens for real visitors`);
  };

  return (
    <div className="preview-card">
      <div className="card card-pad" style={{ padding: 16 }}>
        <div className="preview-head">
          <div>
            <div className="card-title" style={{ fontSize: 14 }}>
              Live preview
            </div>
            <div className="hint" style={{ marginTop: 2 }}>
              Exactly what visitors see
            </div>
          </div>
          <span className="live-dot">Live</span>
        </div>

        <div style={{ marginTop: 14 }}>
          <PhoneFrame url={`${publicOrigin()}/${profile?.username || user?.username || ''}`} height={520}>
            <ProfileView
              profile={profile}
              links={links}
              theme={theme}
              compact
              animate={false}
              crossfade
              onLinkClick={onLinkClick}
            />
          </PhoneFrame>
        </div>

        {user?.username && (
          <motion.a
            className="btn btn-outline btn-block"
            href={`/${user.username}`}
            target="_blank"
            rel="noreferrer noopener"
            style={{ marginTop: 14 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiExternalLink /> View live page
          </motion.a>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
