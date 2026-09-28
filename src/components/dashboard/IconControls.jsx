import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiUpload } from 'react-icons/fi';
import { getPlatform } from '../../config/platforms.js';
import LinkIcon from '../common/LinkIcon.jsx';
import { resizeImageToDataUrl } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

/** A small, hand-picked grid — enough to cover the common cases without noise. */
export const EMOJI_CHOICES = [
  '⭐', '🔥', '💡', '🎯', '🚀', '🎨', '📸', '🎥',
  '🎧', '🎮', '📚', '✍️', '💻', '🛠️', '🌱', '🏆',
  '💰', '🛒', '🍕', '☕', '✈️', '🏡', '🐶', '🌍',
  '❤️', '💜', '💯', '✅', '⚡', '🔔', '📌', '🎁',
  '🤝', '🧠', '🗣️', '👋', '🧩', '🏆', '🥇', '✨',
];

const SWATCHES = [
  '#E1306C', '#1877F2', '#0A66C2', '#14A800', '#1DBF73', '#FF9F0A',
  '#FF5E5B', '#AF52DE', '#FF2D55', '#0EA5E9', '#14B8A6', '#6366F1',
  '#6B6780', '#111111', '#F4F4F5', 'transparent',
];

/**
 * The icon controls shown only when the Custom platform is selected.
 *
 * Four modes: let the app work it out from the domain, drop in an emoji, or
 * upload a small square image. Plus a badge colour override.
 */
const IconControls = ({ form, onChange, error }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');

  const iconType = form.iconType || 'auto';
  const platform = getPlatform(form.platform);

  const set = (patch) => onChange({ ...form, ...patch });

  const pickEmoji = (emoji) => {
    set({ iconType: 'emoji', iconValue: emoji, iconColor: form.iconColor || '' });
    setLocalError('');
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLocalError('');
    try {
      const dataUrl = await resizeImageToDataUrl(file, { size: 128, maxKB: 100 });
      set({ iconType: 'image', iconValue: dataUrl });
    } catch (err) {
      setLocalError(err.message || 'Could not use that image');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const useAuto = () => {
    set({ iconType: 'auto', iconValue: '' });
    setLocalError('');
  };

  const mode = (value) =>
    cn('icon-mode', iconType === value && 'is-active') +
    (iconType === 'auto' ? ' is-auto' : '');

  return (
    <div className="icon-controls">
      <div className="row gap-8" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="label" style={{ margin: 0 }}>Icon</span>
        <LinkIcon
          link={{ ...form, platform: form.platform || 'custom' }}
          size={34}
          tone="solid"
          className="icon-controls-preview"
        />
      </div>

      <div className="icon-modes" role="radiogroup" aria-label="Icon style">
        <button
          type="button"
          role="radio"
          aria-checked={iconType === 'auto'}
          className={mode('auto')}
          onClick={useAuto}
        >
          Auto
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={iconType === 'emoji'}
          className={mode('emoji')}
          onClick={() => set({ iconType: 'emoji', iconValue: form.iconValue || '⭐' })}
        >
          Emoji
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={iconType === 'image'}
          className={mode('image')}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Resizing…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={pickFile}
          className="sr-only"
          aria-label="Upload a custom icon"
        />
      </div>

      <p className="icon-controls-hint">
        <FiUpload aria-hidden="true" /> PNG, JPG or WebP — resized to 128×128 automatically.
      </p>

      {iconType === 'emoji' && (
        <div className="emoji-grid" role="listbox" aria-label="Choose an emoji">
          {EMOJI_CHOICES.map((emoji) => (
            <motion.button
              key={emoji}
              type="button"
              role="option"
              aria-selected={form.iconValue === emoji}
              aria-label={emoji}
              className={cn('emoji-cell', form.iconValue === emoji && 'is-active')}
              onClick={() => pickEmoji(emoji)}
              whileTap={{ scale: 0.88 }}
            >
              {emoji}
              {form.iconValue === emoji && <FiCheck className="emoji-cell-check" />}
            </motion.button>
          ))}
        </div>
      )}

      {iconType === 'image' && form.iconValue && (
        <button type="button" className="icon-clear" onClick={useAuto}>
          Remove uploaded icon
        </button>
      )}

      <div className="row gap-8" style={{ marginTop: 12, alignItems: 'center' }}>
        <span className="label" style={{ margin: 0 }}>Badge colour</span>
        <div className="swatch-row">
          {SWATCHES.map((color) => (
            <motion.button
              key={color}
              type="button"
              aria-label={`Badge colour ${color}`}
              aria-pressed={form.iconColor === color}
              className={cn('swatch', color === 'transparent' && 'is-none', form.iconColor === color && 'is-active')}
              style={color === 'transparent' ? undefined : { background: color }}
              onClick={() => set({ iconColor: form.iconColor === color ? '' : color })}
              whileTap={{ scale: 0.85 }}
            />
          ))}
        </div>
      </div>

      {form.iconColor === 'transparent' && (
        <p className="icon-controls-hint">Transparent badge — the icon shows in its brand colour.</p>
      )}

      {(localError || error) && <p className="field-error">{localError || error}</p>}

      {iconType === 'auto' && !form.iconValue && (
        <p className="icon-controls-hint">
          {platform.icon
            ? `Uses the ${platform.label} logo.`
            : "We'll use the link's own favicon, or its first letter."}
        </p>
      )}
    </div>
  );
};

export default IconControls;
