import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiX } from 'react-icons/fi';
import Field from '../common/Field.jsx';
import Button from '../common/Button.jsx';
import PlatformPicker from './PlatformPicker.jsx';
import IconControls from './IconControls.jsx';
import { getPlatform } from '../../config/platforms.js';
import {
  detectPlatform, displayAddress, hostOfValue, looksLikeEmail, normalizeLinkInput,
  placeholderFor, schemeProblem, urlFieldLabel,
} from '../../lib/linkUrl.js';

const blankForm = (initial) => ({
  label: initial?.label || '',
  // The form always edits the friendly form of the address, so an email link
  // shows `you@example.com` and never `mailto:you@example.com`.
  url: initial ? displayAddress(initial) : '',
  platform: initial?.platform || 'custom',
  iconType: initial?.iconType || 'auto',
  iconValue: initial?.iconValue || '',
  iconColor: initial?.iconColor || '',
});

/**
 * Add / edit form for a single link.
 *
 * The platform is auto-detected from whatever the user pastes, but a manual
 * pick sticks until the hostname actually changes — so a mis-detected tile can
 * be corrected without the form fighting back.
 */
const LinkForm = ({ initial, submitting, onSubmit, onClose }) => {
  const [form, setForm] = useState(() => blankForm(initial));
  const [errors, setErrors] = useState({});

  // The hostname as it stood when the user last chose a tile by hand.
  const manualHost = useRef(null);
  const lastDetected = useRef(null);
  // The title the form suggested for itself, so a later tile change can keep
  // following the platform. A title the user typed is left alone.
  const autoLabel = useRef(null);
  // Mirrors form.label so the platform handler can read it without taking a
  // dependency on the whole form object.
  const labelRef = useRef(initial?.label || '');

  useEffect(() => {
    setForm(blankForm(initial));
    setErrors({});
    manualHost.current = null;
    lastDetected.current = null;
    // A link opened for editing already carries a title its author wrote, so
    // it counts as manual from the start.
    autoLabel.current = null;
    labelRef.current = initial?.label || '';
  }, [initial]);

  const update = (key) => (e) => {
    if (key === 'label') labelRef.current = e.target.value;
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const applyPlatform = useCallback((key) => {
    // Keep the title in step with the tile, but only while the title is still
    // the one we suggested — or empty. Once the user types their own, that
    // title is theirs and no tile click may overwrite it.
    const current = labelRef.current.trim();
    if (!current || current === autoLabel.current) {
      const suggested = getPlatform(key).label;
      autoLabel.current = suggested;
      labelRef.current = suggested;
    }

    setForm((f) => {
      const patch = { platform: key };
      if (labelRef.current !== f.label) patch.label = labelRef.current;
      if (key !== 'custom') {
        // Icon customisations belong to the custom tile.
        patch.iconType = 'auto';
        patch.iconValue = '';
      }
      return { ...f, ...patch };
    });
  }, []);

  const choosePlatform = (key) => {
    // Remember the host the user picked a tile for, so auto-detection does not
    // immediately override the manual choice for the same URL.
    manualHost.current = hostOfValue(form.url);
    lastDetected.current = null;
    applyPlatform(key);
  };

  // Auto-detect, debounced so it does not fight the user mid-typing.
  useEffect(() => {
    const raw = form.url.trim();
    if (!raw) return undefined;

    const timer = setTimeout(() => {
      const host = hostOfValue(raw);

      // The user picked a tile for this exact host: leave their choice alone.
      if (manualHost.current && host && host === manualHost.current) return;

      const detected = normalizeLinkInput(raw, form.platform);
      const key = detected.kind === 'email' ? 'email' : detectPlatform(detected.value);

      if (!key) return;
      if (lastDetected.current === `${key}|${host}`) return;
      lastDetected.current = `${key}|${host}`;
      applyPlatform(key);
    }, 300);

    return () => clearTimeout(timer);
    // `form.platform` is intentionally excluded: it must not restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.url, applyPlatform]);

  const submit = (e) => {
    e.preventDefault();
    const next = {};

    const raw = form.url.trim();
    const schemeError = schemeProblem(raw);
    if (!raw) next.url = 'Paste a URL';
    else if (schemeError) next.url = schemeError;
    else {
      const normalized = normalizeLinkInput(raw, form.platform);

      if (normalized.error) {
        next.url = normalized.error;
      } else if (form.platform === 'email' && !looksLikeEmail(normalized.value.replace(/^mailto:/i, ''))) {
        // A friendly nudge rather than a red block — people paste all kinds of
        // things into this field.
        next.url = 'Enter a valid email like name@example.com';
      } else if (form.platform === 'phone' && !/^tel:\+?\d{7,15}$/.test(normalized.value)) {
        next.url = 'Enter a phone number like +923001234567';
      } else if (!normalized.value) {
        next.url = 'Paste a URL';
      }
    }

    if (!form.label.trim()) next.label = 'Give your link a title';

    setErrors(next);
    if (Object.keys(next).length) return;

    const normalized = normalizeLinkInput(form.url, form.platform);
    onSubmit({
      ...form,
      label: form.label.trim(),
      url: normalized.value,
    });
  };
  const fieldLabel = urlFieldLabel(form.platform);
  const placeholder = form.platform === 'whatsapp' ? '+92 300 1234567' : placeholderFor(form.platform);
  const isCustom = form.platform === 'custom';

  return (
    <motion.form
      className="link-form"
      onSubmit={submit}
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      noValidate
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="card-title">{initial ? 'Edit link' : 'Add a new link'}</div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close form">
          <FiX />
        </button>
      </div>

      <div className="link-form-grid">
        <Field
          label="Title"
          placeholder="My portfolio"
          value={form.label}
          onChange={update('label')}
          error={errors.label}
          maxLength={60}
          autoFocus
        />
        <Field
          label={fieldLabel}
          placeholder={placeholder}
          value={form.url}
          onChange={update('url')}
          error={errors.url}
          inputMode={form.platform === 'phone' || form.platform === 'whatsapp' ? 'tel' : 'url'}
        />
      </div>

      <PlatformPicker value={form.platform} url={form.url} onChange={choosePlatform} />

      {isCustom && <IconControls form={form} onChange={setForm} error={errors.icon} />}

      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} type="button" disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" icon={initial ? undefined : FiPlus} loading={submitting}>
          {initial ? 'Save changes' : 'Add link'}
        </Button>
      </div>
    </motion.form>
  );
};

export default LinkForm;
