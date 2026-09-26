import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLink, FiPlus, FiX } from 'react-icons/fi';
import Field from '../common/Field.jsx';
import Button from '../common/Button.jsx';
import { PLATFORMS } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

const looksLikeUrl = (value) => {
  const v = value.trim();
  if (!v) return false;
  if (/^mailto:/i.test(v)) return true;
  if (v.includes('@') && !v.includes(' ')) return true; // bare email address
  return /^([a-z][a-z0-9+.-]*:\/\/)?[^\s/$.?#][^\s]*$/i.test(v);
};

/**
 * Add / edit form for a single link.
 * Picking a platform assigns its icon and brand colour automatically.
 */
const LinkForm = ({ initial, submitting, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    label: initial?.label || '',
    url: initial?.url || '',
    platform: initial?.platform || 'instagram',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      label: initial?.label || '',
      url: initial?.url || '',
      platform: initial?.platform || 'instagram',
    });
    setErrors({});
  }, [initial]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.label.trim()) next.label = 'Give your link a title';
    if (!form.url.trim()) next.url = 'Paste a URL';
    else if (!looksLikeUrl(form.url)) next.url = 'That does not look like a valid link';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ ...form, label: form.label.trim(), url: form.url.trim() });
  };

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
          label="URL"
          placeholder="awais.ahmad"
          value={form.url}
          onChange={update('url')}
          error={errors.url}
        />
      </div>

      <div className="field">
        <div className="label">Platform</div>
        <div className="platform-grid" role="radiogroup" aria-label="Link platform">
          {PLATFORMS.map(({ key, short, Icon, color }) => {
            const active = form.platform === key;
            return (
              <motion.button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                className={cn('platform-chip', active && 'is-active')}
                onClick={() => setForm((f) => ({ ...f, platform: key }))}
                whileTap={{ scale: 0.94 }}
              >
                <span className="platform-chip-icon" style={{ color: active ? color : undefined }}>
                  <Icon />
                </span>
                <span className="platform-chip-label">{short}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

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
