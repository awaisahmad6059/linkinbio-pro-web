import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCamera, FiCheck, FiLoader } from 'react-icons/fi';
import Field from '../common/Field.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { authApi, parseApiError } from '../../lib/api.js';
import { BIO_MAX } from '../../lib/constants.js';
import { readImageAsDataUrl } from '../../lib/utils.js';

const SAVE_DELAY = 700;

/**
 * Profile editor: photo, display name and bio.
 *
 * Changes auto-save (debounced) and a small status chip confirms the save —
 * there is no "save profile" button to forget to press.
 */
const ProfileEditor = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const error = useToastStore((s) => s.error);

  const [draft, setDraft] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
  });
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState('saved'); // saved | saving | dirty
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  // Serialised copy of what the server already has, so mounting (and
  // StrictMode's double effect invocation) never triggers a pointless save.
  const lastSaved = useRef(JSON.stringify({ displayName: user?.displayName || '', bio: user?.bio || '' }));

  // Debounced auto-save whenever the draft actually changes.
  useEffect(() => {
    const payload = { displayName: draft.displayName, bio: draft.bio };
    const serialised = JSON.stringify(payload);
    if (serialised === lastSaved.current) return undefined;

    setSaveState('dirty');
    const timer = setTimeout(async () => {
      setSaveState('saving');
      try {
        const updated = await authApi.updateProfile(payload);
        lastSaved.current = serialised;
        setUser(updated);
        setErrors({});
        setSaveState('saved');
      } catch (err) {
        const { message, fieldErrors } = parseApiError(err);
        setErrors(fieldErrors);
        setSaveState('saved');
        error(message);
      }
    }, SAVE_DELAY);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await readImageAsDataUrl(file, 320);
      const updated = await authApi.updateProfile({ profilePhotoUrl: dataUrl });
      setUser(updated);
    } catch (err) {
      error(err.message || 'Could not upload that photo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    const updated = await authApi.updateProfile({ profilePhotoUrl: '' });
    setUser(updated);
  };

  const bioCount = draft.bio.length;

  return (
    <div className="card card-pad">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="card-title">Your profile</div>
          <div className="hint" style={{ marginTop: 2 }}>
            This is what visitors see at the top of your page
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={saveState}
            className="badge"
            style={{
              background: saveState === 'saving' ? 'var(--brand-50)' : 'var(--success-50)',
              color: saveState === 'saving' ? 'var(--brand-700)' : '#047857',
            }}
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.18 }}
          >
            {saveState === 'saving' ? (
              <>
                <FiLoader style={{ animation: 'spin 0.8s linear infinite' }} /> Saving
              </>
            ) : saveState === 'dirty' ? (
              'Unsaved'
            ) : (
              <>
                <FiCheck /> Saved
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="profile-editor">
        <div className="avatar-picker">
          <Avatar src={user?.profilePhotoUrl} name={draft.displayName || user?.username} size="xl" />
          <button className="avatar-picker-overlay" onClick={() => fileRef.current?.click()} type="button">
            {uploading ? <FiLoader style={{ animation: 'spin 0.8s linear infinite' }} /> : <FiCamera size={18} />}
            Change
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onPickPhoto}
            className="sr-only"
            aria-label="Upload profile photo"
          />
        </div>

        <div className="profile-editor-fields">
          <Field
            label="Display name"
            value={draft.displayName}
            maxLength={60}
              placeholder="Awais Ahmad"
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
            error={errors.displayName}
            counter={<span className="counter">{draft.displayName.length}/60</span>}
          />

          <Field
            as="textarea"
            label="Bio"
            value={draft.bio}
            maxLength={BIO_MAX}
            rows={2}
            placeholder="Full-stack developer · Building in public · Pakistan → Remote"
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            error={errors.bio}
            counter={
              <span
                className={`counter${bioCount > BIO_MAX - 20 ? ' counter-warn' : ''}${bioCount > BIO_MAX ? ' counter-over' : ''}`}
              >
                {bioCount}/{BIO_MAX}
              </span>
            }
            hint={!draft.bio ? 'A one-liner about you or your work' : undefined}
          />

          {user?.profilePhotoUrl && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={removePhoto}
              type="button"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
