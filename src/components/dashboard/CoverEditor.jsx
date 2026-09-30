import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiImage, FiLoader, FiRefreshCw, FiTrash2, FiUpload } from 'react-icons/fi';
import Button from '../common/Button.jsx';
import { ProfileView } from '../profile/ProfileView.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { authApi, parseApiError } from '../../lib/api.js';
import { resizeCoverToDataUrl } from '../../lib/utils.js';
import {
  COVER_CONTROLS,
  COVER_KEYS,
  COVER_MAX_EDGE,
  COVER_MAX_KB,
  DEFAULT_COVER,
  clampCover,
  coverSizeLabel,
  formatCoverValue,
} from '../../lib/cover.js';

const SAVE_DELAY = 600;

/**
 * Just the knobs, without the photo — what the debounced save sends.
 *
 * Clamped rather than passed through, so this can only ever produce a payload
 * the API accepts. The sliders already stay in range, but this is the one place
 * that writes to the server, and a stray value here would surface as a failed
 * autosave with nothing on screen to explain it.
 */
const pickSettings = (cover) => {
  const c = clampCover(cover);
  return COVER_KEYS.reduce((out, key) => ({ ...out, [key]: c[key] }), {});
};

/**
 * One labelled slider.
 *
 * `<label>` wrapping the whole thing rather than a `for`/`id` pair: the readout
 * is part of the label, so a screen reader announces "Blur, 12 pixels" as one
 * thing instead of a bare "Blur" plus an unexplained number.
 */
const CoverSlider = ({ label, hint, value, display, min, max, step, onChange }) => (
  <label className="cover-ctl">
    <span className="cover-ctl-head">
      <span className="cover-ctl-label">{label}</span>
      <span className="cover-ctl-value">{display}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {hint ? <span className="cover-ctl-hint">{hint}</span> : null}
  </label>
);

/**
 * Background image editor for the `custom` theme.
 *
 * Every adjustment writes straight into the shared cover state, which the live
 * preview and the theme tile are both rendering from — so the photo moves while
 * the slider is still being dragged, with no round trip and nothing to press.
 * Persistence happens behind the scenes, split by cost:
 *
 *   - the photo is saved the moment it is chosen, because it is the expensive
 *     part and there is no point holding a few hundred kilobytes in memory while
 *     the user decides whether they like it;
 *   - the six knobs are saved on a short debounce, so dragging a slider costs
 *     one ~90-byte request rather than one per pixel.
 *
 * The wide stage above the controls is the real `ProfileView`, not a mock-up of
 * it, which is what makes the claim "this is what visitors get" true rather than
 * approximate — the same component, theme and stylesheet draw the published
 * page.
 */
const CoverEditor = ({ cover, setCover, profile, links }) => {
  const setUser = useAuthStore((s) => s.setUser);
  const error = useToastStore((s) => s.error);

  const [saveState, setSaveState] = useState('saved'); // saved | saving | dirty
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const settings = clampCover(cover);
  const hasImage = Boolean(cover?.image);
  const sizeLabel = coverSizeLabel(cover?.image);

  // Serialised copy of what the server already has, so mounting (and StrictMode's
  // double effect invocation) never triggers a pointless save.
  const lastSaved = useRef(JSON.stringify(pickSettings(cover)));

  // Debounced save of the adjustments only.
  useEffect(() => {
    // An upload is in flight and will save the photo on its own; a second
    // request now would race it, and whichever lost would write settings
    // computed from a page state that is about to be replaced anyway.
    if (uploading) return undefined;

    const serialised = JSON.stringify(pickSettings(cover));
    if (serialised === lastSaved.current) return undefined;

    setSaveState('dirty');
    const timer = setTimeout(async () => {
      setSaveState('saving');
      try {
        const updated = await authApi.updateProfile({ coverSettings: pickSettings(cover) });
        lastSaved.current = serialised;
        setUser(updated);
        setSaveState('saved');
      } catch (err) {
        setSaveState('saved');
        error(parseApiError(err).message);
      }
    }, SAVE_DELAY);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover, uploading]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await resizeCoverToDataUrl(file, {
        maxEdge: COVER_MAX_EDGE,
        maxKB: COVER_MAX_KB,
      });
      // The preview updates first, from the data URL that is already in hand.
      setCover((c) => ({ ...c, image: dataUrl }));
      const updated = await authApi.updateProfile({ coverImage: dataUrl });
      setUser(updated);
    } catch (err) {
      error(err.message || 'Could not use that image');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = async () => {
    setCover((c) => ({ ...c, image: '' }));
    try {
      const updated = await authApi.updateProfile({ coverImage: '' });
      setUser(updated);
    } catch (err) {
      error(parseApiError(err).message);
    }
  };

  const resetAdjustments = () => setCover((c) => ({ ...c, ...DEFAULT_COVER }));

  const isDefaulted = COVER_KEYS.every((k) => settings[k] === DEFAULT_COVER[k]);

  return (
    <div className="card card-pad">
      <div className="card-head">
        <div>
          <div className="card-title">Background image</div>
          <div className="hint" style={{ marginTop: 2 }}>
            Your photo fills the whole page — never stretched, never cut off at the edges
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={saveState}
            className="badge"
            style={{
              background: saveState === 'saved' ? 'var(--success-50)' : 'var(--brand-50)',
              color: saveState === 'saved' ? '#047857' : 'var(--brand-700)',
            }}
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.18 }}
          >
            {saveState === 'saved' ? (
              <>
                <FiCheck /> Saved
              </>
            ) : saveState === 'saving' ? (
              <>
                <FiLoader style={{ animation: 'spin 0.8s linear infinite' }} /> Saving
              </>
            ) : (
              'Unsaved'
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* The real page, in a window the size of a screen. */}
      <div className="cover-stage">
        <ProfileView
          theme="custom"
          cover={cover}
          profile={profile}
          links={links}
          animate={false}
          showFooter={false}
        />

        {!hasImage && (
          <div className="cover-stage-empty">
            <div className="cover-stage-empty-icon">
              <FiImage />
            </div>
            <div className="small strong">No photo yet</div>
            <div className="tiny muted" style={{ maxWidth: 260, textAlign: 'center' }}>
              Upload a picture and it becomes the background of your whole page
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onPickFile}
        className="sr-only"
        aria-label="Upload a background image"
      />

      <div className="row gap-8 cover-actions">
        <Button
          variant={hasImage ? 'outline' : 'primary'}
          icon={uploading ? undefined : FiUpload}
          loading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {hasImage ? 'Replace photo' : 'Upload a photo'}
        </Button>

        {hasImage && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={FiRefreshCw}
              disabled={isDefaulted}
              onClick={resetAdjustments}
              title="Put every adjustment back to its default"
            >
              Reset adjustments
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={FiTrash2}
              onClick={removeImage}
              style={{ color: 'var(--danger)' }}
            >
              Remove
            </Button>
          </>
        )}
      </div>

      <div className="tiny muted" style={{ marginTop: 10 }}>
        {hasImage ? (
          <>
            {sizeLabel} stored, and it is scaled to cover your screen on every device — a
            wide photo is cropped from the sides, a tall one from the top and bottom.
          </>
        ) : (
          <>PNG, JPG or WebP. Photos are shrunk in your browser before they are uploaded, so they never leave your device at full size.</>
        )}
      </div>

      {hasImage && (
        <>
          <div className="cover-ctls">
            {COVER_CONTROLS.map((ctl) => (
              <CoverSlider
                key={ctl.key}
                label={ctl.label}
                hint={ctl.hint}
                min={ctl.min}
                max={ctl.max}
                step={ctl.step}
                value={settings[ctl.key]}
                display={formatCoverValue(ctl.key, settings[ctl.key])}
                onChange={(next) => setCover((c) => ({ ...c, [ctl.key]: next }))}
              />
            ))}
          </div>

          <div className="tiny muted" style={{ marginTop: 12 }}>
            Darken is the veil between your photo and the page text. Leave it where it is
            unless your name is hard to read.
          </div>
        </>
      )}
    </div>
  );
};

export default CoverEditor;
