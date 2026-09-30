/**
 * The `custom` theme's background image.
 *
 * A photo uploaded here sits behind the whole page, so this module owns three
 * things: the knobs the user gets, the range each knob is allowed to travel
 * over, and the translation of both into the CSS custom properties that
 * `.theme-custom` in `styles/themes.css` paints from.
 *
 * The ranges mirror `COVER_CONTROLS` in `server/src/constants.js`, which is what
 * actually decides them. `scripts/verify-cover.mjs` reads both files and fails
 * if they drift, because the failure mode here is silent: the slider would stop
 * at a value the API refuses, or the page would store a background the CSS
 * cannot lay out, and neither would show up until someone used it.
 */

/** Largest image accepted, measured on the decoded bytes. Mirrors the server. */
export const COVER_MAX_KB = 300;

/**
 * Longest edge a cover is re-encoded to in the browser before upload.
 *
 * A public page is a narrow column read on a phone, and the image is normally
 * blurred or dimmed behind a scrim, so anything past this is bytes nobody can
 * see — while 1600 is still sharp on a desktop at full width.
 */
export const COVER_MAX_EDGE = 1600;

/**
 * The adjustment controls, in the order they are shown.
 *
 * `zoom` bottoms out at 1 because 1 is already `background-size: cover`: the
 * point where the photo fills the screen in both directions without stretching
 * or leaving gaps. So the sliders can only ever crop *further in* — which is
 * what makes zoom plus the two position sliders a crop control, rather than
 * needing a separate one.
 *
 * `dim` is the veil between the photo and the page text. It defaults above zero
 * because the page is white text over somebody's photograph, and a photograph
 * can be as light as a sheet of paper.
 */
export const COVER_CONTROLS = [
  {
    key: 'zoom',
    label: 'Zoom',
    min: 1,
    max: 3,
    step: 0.02,
    hint: 'Zoom in to crop into part of the photo',
  },
  { key: 'x', label: 'Position across', min: 0, max: 100, step: 1 },
  { key: 'y', label: 'Position down', min: 0, max: 100, step: 1 },
  { key: 'blur', label: 'Blur', min: 0, max: 24, step: 0.5 },
  { key: 'brightness', label: 'Brightness', min: 0.3, max: 1.8, step: 0.02 },
  { key: 'dim', label: 'Darken', min: 0, max: 0.9, step: 0.01, display: 'pct' },
];

export const COVER_CONTROL_MAP = Object.fromEntries(
  COVER_CONTROLS.map((c) => [c.key, c])
);

export const COVER_KEYS = COVER_CONTROLS.map((c) => c.key);

/**
 * What the page looks like with an uploaded photo and nothing dialled in: the
 * photo exactly as composed, centred, full-bleed, with a scrim over it.
 */
export const DEFAULT_COVER = Object.freeze({
  zoom: 1,
  x: 50,
  y: 50,
  blur: 0,
  brightness: 1,
  dim: 0.45,
});

/**
 * A stand-in photo for the places that render the `custom` theme without one:
 * the theme tile, the landing-page showcase, and the dashboard preview before
 * anything has been uploaded.
 *
 * An inline SVG rather than a bundled image, so the tile costs nothing to load
 * and nothing to keep in step with the theme list. It is our own constant, never
 * user input — which is exactly why it is allowed where an uploaded cover is not:
 * an SVG is a script-bearing document, so the API restricts uploads to raster
 * formats, and `isRenderableImage` below has to make room for this one by name.
 */
export const SAMPLE_COVER = Object.freeze({
  ...DEFAULT_COVER,
  image:
    `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1400" ' +
        'preserveAspectRatio="xMidYMid slice">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#2e1065"/><stop offset=".45" stop-color="#6d28d9"/>' +
        '<stop offset="1" stop-color="#db2777"/></linearGradient></defs>' +
        '<rect width="900" height="1400" fill="url(#g)"/>' +
        '<circle cx="180" cy="300" r="250" fill="#38bdf8" opacity=".38"/>' +
        '<circle cx="740" cy="1020" r="320" fill="#fbbf24" opacity=".3"/>' +
        '<circle cx="760" cy="200" r="140" fill="#ffffff" opacity=".18"/>' +
        '<circle cx="120" cy="1200" r="180" fill="#ffffff" opacity=".12"/>' +
        '</svg>'
    )}`,
});

/** True when this cover is the stand-in rather than something the user uploaded. */
export const isSampleCover = (image) => image === SAMPLE_COVER.image;

/**
 * The photo, as the API accepts it.
 *
 * Guards the string before it is handed to CSS. `url(...)` is interpolated into
 * a style attribute, so anything that is not a data URL we produced — a remote
 * address, a stray quote — never reaches the `url()` at all. Raster formats
 * only, and base64 only, because that is precisely what the upload endpoint
 * will have accepted.
 */
export const isCoverImage = (value) =>
  typeof value === 'string' && /^data:image\/(png|jpe?g|webp);base64,/i.test(value);

/**
 * Anything the renderer is allowed to paint.
 *
 * An uploaded photo, or the built-in sample. The sample is matched by identity
 * rather than by pattern, so widening this to "any inline image" — which would
 * let an SVG in through the front — is not a one-word change.
 */
export const isRenderableImage = (value) => isCoverImage(value) || isSampleCover(value);

/**
 * Forces any object — a request response, a stale localStorage copy, a hand-edited
 * body — into the shape the renderer can lay out.
 *
 * Mirrors `clampCoverSettings` on the server rather than importing it, because
 * this runs in the browser and the server's copy is not shipped. The server's
 * verify script reads both files and fails if they drift.
 *
 * Unknown keys are dropped, out-of-range values are pulled back inside, and a
 * missing or unusable value falls back to the default for that knob alone — so
 * one bad field cannot leave the other five undefined.
 */
export const clampCover = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const { key, min, max } of COVER_CONTROLS) {
    const value = Number(source[key]);
    out[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : DEFAULT_COVER[key];
  }
  return out;
};

/** The cover as one object: the photo plus every knob, already clamped. */
export const normalizeCover = (raw) => ({
  ...clampCover(raw),
  image: isCoverImage(raw?.image) ? raw.image : '',
});

/**
 * Cover state as the inline CSS custom properties `.theme-custom` paints from.
 *
 * Returned even when there is no image, so the rules never have to test for
 * "settings but no photo" — they render the same either way, which is also what
 * makes the empty state predictable rather than a blank screen.
 */
export const coverStyle = (cover) => {
  const c = clampCover(cover);
  return {
    '--pf-cover': isRenderableImage(cover?.image) ? `url("${cover.image}")` : 'none',
    '--pf-cover-zoom': String(c.zoom),
    '--pf-cover-x': `${c.x}%`,
    '--pf-cover-y': `${c.y}%`,
    '--pf-cover-blur': `${c.blur}px`,
    '--pf-cover-bright': String(c.brightness),
    '--pf-cover-dim': String(c.dim),
  };
};

/**
 * How a knob reads next to its slider.
 *
 * Zoom and brightness are multipliers, so they are shown as percentages of their
 * neutral value; the veil is stored as 0-0.9 but read as a percentage too,
 * because "dim 0.45" means nothing to anybody. Position and blur are read in
 * the unit they are actually used in.
 */
export const formatCoverValue = (key, value) => {
  const spec = COVER_CONTROL_MAP[key];
  if (!spec) return String(value);

  if (spec.display === 'pct' || key === 'zoom' || key === 'brightness') {
    return `${Math.round(value * 100)}%`;
  }
  if (key === 'blur') return `${Number(value.toFixed(1))}px`;
  return `${Math.round(value)}%`;
};

/** How much image data is in a cover, for the "how big is this" line. */
export const coverSizeLabel = (image) => {
  if (!isCoverImage(image)) return null;
  const bytes = Math.floor(((image.length - image.indexOf(',') - 1) * 3) / 4);
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
};
