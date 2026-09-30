/**
 * Guards for the `custom` theme's background image.
 *
 *   node scripts/verify-cover.mjs
 *
 * The theme list is the one thing here that is easy to get wrong in a way that
 * costs an existing user: `selectedTheme` is validated against a server enum, so
 * a theme that only exists in the stylesheet is one the API will refuse, and a
 * renamed key orphans every account already using it.
 *
 * The rest checks the parts that fail silently. A mistyped CSS custom property,
 * or a range the stylesheet and the sliders disagree about, renders a plausible
 * page with a background that quietly does not move — which no amount of manual
 * clicking through one browser would reliably catch.
 *
 * `server/src/scripts/verifyCover.mjs` compares this file's ranges against the
 * API's copy, since the two live in separate repositories.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { THEMES, THEME_MAP } from '../src/lib/constants.js';
import {
  COVER_CONTROLS,
  COVER_CONTROL_MAP,
  COVER_KEYS,
  COVER_MAX_EDGE,
  COVER_MAX_KB,
  DEFAULT_COVER,
  SAMPLE_COVER,
  clampCover,
  coverSizeLabel,
  coverStyle,
  formatCoverValue,
  isCoverImage,
  isRenderableImage,
  isSampleCover,
  normalizeCover,
} from '../src/lib/cover.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFileSync(join(here, '..', relative), 'utf8');

let pass = 0;
let fail = 0;
const failures = [];

const check = (name, actual, expected) => {
  if (Object.is(actual, expected)) {
    pass += 1;
  } else {
    fail += 1;
    failures.push(`${name}\n    expected: ${expected}\n    actual:   ${JSON.stringify(actual)}`);
  }
};

const ok = (name, condition) => check(name, Boolean(condition), true);

/* ------------------------------------------------------------ themes -- */

const ORIGINAL_5 = ['minimal', 'dark', 'gradient', 'bold', 'nature'];

check('there are six themes', THEMES.length, 6);
check('the original five are still first, in order', THEMES.map((t) => t.key).slice(0, 5).join(','), ORIGINAL_5.join(','));
ok('custom is a theme', THEMES.some((t) => t.key === 'custom'));
ok('every theme is in THEME_MAP', THEMES.every((t) => THEME_MAP[t.key] === t));
ok('theme keys are unique', new Set(THEMES.map((t) => t.key)).size === THEMES.length);
ok('every theme has a name and a blurb', THEMES.every((t) => t.name && t.blurb));
ok('every theme has an accent', THEMES.every((t) => typeof t.accent === 'string' && t.accent.length > 0));
/* The dashboard tints its autosave icon from this, so it has to be a string. */
ok('the custom accent is a gradient, since a photo can be any colour', THEME_MAP.custom.accent.includes('gradient'));

/* The default has to stay a theme that exists, or every new account 400s on its
   first profile save. */
ok('gradient is still the theme a fresh account lands on', THEMES.some((t) => t.key === 'gradient'));

/* ------------------------------------------------- the control table -- */

check('six controls', COVER_CONTROLS.length, 6);
check('the keys line up', COVER_CONTROLS.map((c) => c.key).join(','), COVER_KEYS.join(','));
ok('every control has a label', COVER_CONTROLS.every((c) => typeof c.label === 'string' && c.label.length > 0));
ok('every control is in the lookup', COVER_CONTROLS.every((c) => COVER_CONTROL_MAP[c.key] === c));
ok('every control has a usable step', COVER_CONTROLS.every((c) => c.step > 0 && c.step < c.max - c.min));
ok('every default sits inside its own range', COVER_KEYS.every((k) => {
  const c = COVER_CONTROL_MAP[k];
  return DEFAULT_COVER[k] >= c.min && DEFAULT_COVER[k] <= c.max;
}));
/* One step has to land exactly on the default, or "Reset adjustments" would
   quietly shift the background when the user presses it. */
ok('every default sits on a step boundary', COVER_KEYS.every((k) => {
  const c = COVER_CONTROL_MAP[k];
  const steps = (DEFAULT_COVER[k] - c.min) / c.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}));
check('zoom bottoms out at a full-bleed fit', COVER_CONTROL_MAP.zoom.min, 1);
check('zoom starts there', DEFAULT_COVER.zoom, 1);
check('the photo starts centred', DEFAULT_COVER.x, 50);
check('and centred vertically too', DEFAULT_COVER.y, 50);
check('and unblurred', DEFAULT_COVER.blur, 0);
check('and at full brightness', DEFAULT_COVER.brightness, 1);
ok('the veil starts above zero, so white text is never unprotected', DEFAULT_COVER.dim > 0);

/* --------------------------------------------------------- clamping -- */

const blank = clampCover(undefined);
check('an empty cover clamps to the defaults', blank.zoom, DEFAULT_COVER.zoom);
check('even for a null', clampCover(null).dim, DEFAULT_COVER.dim);
check('even for a string', clampCover('nonsense').blur, DEFAULT_COVER.blur);
ok('it returns exactly the known keys', COVER_KEYS.every((k) => k in blank));
ok('and nothing else', Object.keys(blank).length === COVER_KEYS.length);

check('a value in range is kept', clampCover({ blur: 12 }).blur, 12);
check('a fractional value survives', clampCover({ zoom: 1.5 }).zoom, 1.5);
check('a numeric string is coerced', clampCover({ blur: '8' }).blur, 8);
check('above the range pulls back', clampCover({ blur: 999 }).blur, 24);
check('below the range pulls forward', clampCover({ brightness: -2 }).brightness, 0.3);
check('zoom cannot be shrunk below a full-bleed fit', clampCover({ zoom: 0.1 }).zoom, 1);
check('an unusable value falls back to its own default', clampCover({ blur: 'lots' }).blur, DEFAULT_COVER.blur);
ok('one bad knob does not take the others with it', COVER_KEYS.every((k) => {
  const c = clampCover({ [k]: 'rubbish' });
  return c[k] === DEFAULT_COVER[k] && COVER_KEYS.filter((j) => j !== k).every((j) => c[j] === DEFAULT_COVER[j]);
}));

/* -------------------------------------------------------- the image -- */

const photo = 'data:image/jpeg;base64,AAAA';
ok('an uploaded jpeg counts', isCoverImage(photo));
ok('a png counts', isCoverImage('data:image/png;base64,AAAA'));
ok('a webp counts', isCoverImage('data:image/webp;base64,AAAA'));
ok('the built-in sample counts as renderable', isRenderableImage(SAMPLE_COVER.image));
ok('and the sample is recognised as the sample', isSampleCover(SAMPLE_COVER.image));
ok('but an upload is not the sample', isSampleCover(photo) === false);
/* Each of these would be a value that reaches a CSS url() on a public page. */
ok('a remote address never does', isRenderableImage('https://evil.example/bg.jpg') === false);
ok('a javascript: value never does', isRenderableImage('javascript:alert(1)') === false);
ok('an arbitrary svg never does', isRenderableImage('data:image/svg+xml,%3Csvg%3E') === false);
ok('a quote-breaking attempt never does', isRenderableImage('" onload="alert(1)') === false);
ok('a bare string never does', isRenderableImage('not-an-image') === false);

check('a normalised cover drops an unusable photo', normalizeCover({ image: 'https://x/y.jpg' }).image, '');
check('and keeps a real one', normalizeCover({ image: photo }).image, photo);
check('while still clamping the knobs', normalizeCover({ image: photo, zoom: 99 }).zoom, 3);

/* ------------------------------------------------------- the css vars -- */

const css = read('src/styles/themes.css');
const style = coverStyle({ image: photo, zoom: 2, x: 10, y: 90, blur: 6, brightness: 1.4, dim: 0.7 });

check('seven properties are emitted', Object.keys(style).length, 7);
check('the photo becomes a quoted url', style['--pf-cover'], `url("${photo}")`);
check('zoom passes through', style['--pf-cover-zoom'], '2');
check('position across becomes a percentage', style['--pf-cover-x'], '10%');
check('position down becomes a percentage', style['--pf-cover-y'], '90%');
check('blur carries its unit', style['--pf-cover-blur'], '6px');
check('brightness is a plain multiplier', style['--pf-cover-bright'], '1.4');
check('the veil is a plain fraction', style['--pf-cover-dim'], '0.7');
check('no photo means no url', coverStyle({ image: '' })['--pf-cover'], 'none');
check('the sample still becomes a url', coverStyle(SAMPLE_COVER)['--pf-cover'], `url("${SAMPLE_COVER.image}")`);

/*
 * The most valuable check in this file.
 *
 * `coverStyle` writes these names inline and `themes.css` reads them back, with
 * nothing in between but a typo. A mismatch is invisible: the page renders, the
 * background is simply `none`, and the slider appears to do nothing. So every
 * variable emitted here has to be read by the stylesheet, and every variable the
 * theme reads has to be emitted.
 */
const EMITTED = Object.keys(style);
const block = css.slice(css.indexOf('.theme-custom {'), css.indexOf('.theme-custom::before'));
const DECLARED = [...block.matchAll(/--pf-cover[\w-]*\s*:/g)].map((m) =>
  m[0].replace(/\s*:\s*$/, '')
);
ok('every emitted variable is declared by .theme-custom', EMITTED.every((v) => DECLARED.includes(v)));
ok('every declared variable is emitted', [...new Set(DECLARED)].every((v) => EMITTED.includes(v)));
ok('the pseudo-elements read the photo', /\.theme-custom::before[^}]*background-image:\s*var\(--pf-cover\)/s.test(css));
ok('and cover it without distorting', /\.theme-custom::before[^}]*background-size:\s*cover/s.test(css));
ok('and place it where the position sliders say', /\.theme-custom::before[^}]*background-position:\s*var\(--pf-cover-x\)\s*var\(--pf-cover-y\)/s.test(css));
ok('and blur it', /\.theme-custom::before[^}]*filter:[^}]*blur\(var\(--pf-cover-blur\)\)/s.test(css));
ok('and brighten it', /\.theme-custom::before[^}]*brightness\(var\(--pf-cover-bright\)\)/s.test(css));
ok('and crop into it', /\.theme-custom::before[^}]*scale\(var\(--pf-cover-zoom\)\)/s.test(css));
/* The veil is the guarantee that white text stays readable over a photograph the
   user picked, so it has to be a separate layer the brightness slider cannot
   reach through. */
ok('the veil is its own layer', /\.theme-custom::after[^}]*background:/.test(css));
ok('the veil uses the dim value', /\.theme-custom::after[^}]*var\(--pf-cover-dim\)/s.test(css));
ok('the veil is not inside the brightness filter', !/\.theme-custom::after[^}]*brightness\(/s.test(css));
/* A blur that bleeds to the very edge of the box would show a soft border where
   the photo stops, which is the one artefact that gives the effect away. */
ok('the photo bleeds past the edges in proportion to the blur', /\.theme-custom::before[^}]*inset:\s*calc\(var\(--pf-cover-blur\)\s*\*\s*-/s.test(css));

/* The stylesheet's own defaults have to agree with `DEFAULT_COVER`, or a profile
   with no cover yet would lay out differently from the moment the user sets one
   slider — the first drag would appear to move the background even at its
   default. */
for (const [key, variable] of [
  ['zoom', '--pf-cover-zoom'],
  ['x', '--pf-cover-x'],
  ['y', '--pf-cover-y'],
  ['blur', '--pf-cover-blur'],
  ['brightness', '--pf-cover-bright'],
  ['dim', '--pf-cover-dim'],
]) {
  const declared = new RegExp(`${variable}:\\s*([^;]+);`).exec(block)?.[1]?.trim();
  const expect = `${DEFAULT_COVER[key]}${key === 'blur' ? 'px' : key === 'x' || key === 'y' ? '%' : ''}`;
  check(`the stylesheet's ${variable} default matches DEFAULT_COVER.${key}`, declared, expect);
}

/* -------------------------------------------------------- readouts -- */

check('zoom reads as a percentage', formatCoverValue('zoom', 1.5), '150%');
check('blur reads in pixels', formatCoverValue('blur', 12.5), '12.5px');
check('a whole blur drops its decimal', formatCoverValue('blur', 8), '8px');
check('the veil reads as a percentage', formatCoverValue('dim', 0.45), '45%');
check('position reads as a percentage', formatCoverValue('x', 30), '30%');
check('brightness reads as a percentage', formatCoverValue('brightness', 1.8), '180%');
ok('an unknown key does not throw', typeof formatCoverValue('nope', 1) === 'string');

check('a 4KB photo says so', coverSizeLabel('data:image/png;base64,' + 'A'.repeat(5461)), '4KB');
check('nothing in, nothing out', coverSizeLabel(''), null);
check('not a photo, nothing out', coverSizeLabel(SAMPLE_COVER.image), null);

/* ----------------------------------------------------------- budget -- */

/* Stated, not derived, so changing either number is a deliberate edit here.
   `verifyCover.mjs` on the API side asserts the same value. */
check('the upload cap matches the API', COVER_MAX_KB, 300);
check('the long edge is desktop-sharp', COVER_MAX_EDGE, 1600);

/* ------------------------------------------------------- reporting -- */

console.log('themes    :', THEMES.map((t) => t.key).join(', '));
console.log('controls  :', COVER_KEYS.join(', '));
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exitCode = 1;
}
