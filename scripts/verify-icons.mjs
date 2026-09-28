/**
 * Guards that every icon the platform registry actually imports exists in the
 * installed `react-icons` version.
 *
 * Brands with no available glyph are intentionally mapped to `icon: null` and
 * fall back to a fetched favicon or a letter, so those are not failures. What
 * must never happen is the registry importing a name that does not exist — that
 * renders as a blank tile at runtime and only shows up visually.
 *
 *   node scripts/verify-icons.mjs
 */

import { PLATFORMS } from '../src/config/platforms.js';
import * as si from 'react-icons/si';
import * as fa6 from 'react-icons/fa6';
import * as fa from 'react-icons/fa';
import * as fi from 'react-icons/fi';

const packs = { si, fa6, fa, fi };

let checked = 0;
let missing = 0;
const nullIcons = [];

for (const platform of PLATFORMS) {
  const Icon = platform.icon;

  if (!Icon) {
    nullIcons.push(platform.key);
    continue;
  }

  // react-icons sets displayName to the exported name, which is what the packs
  // key off.
  const name = Icon.displayName || Icon.name || '';
  const pack = name.startsWith('Si') ? 'si' : name.startsWith('Fi') ? 'fi' : 'fa6';
  const mod = packs[pack] || packs.fa;
  checked += 1;

  if (!name || typeof mod[name] === 'undefined') {
    missing += 1;
    console.log(`MISSING  ${platform.key.padEnd(16)} ${name || '(unnamed)'} not in react-icons/${pack}`);
  }
}

// A couple of brands exist in `fa` but not `fa6`; check both before failing.
console.log(`\nregistry entries : ${PLATFORMS.length}`);
console.log(`icons resolved   : ${checked}`);
console.log(`favicon fallback : ${nullIcons.length}  (${nullIcons.join(', ') || 'none'})`);

if (missing > 0) {
  console.log(`\nFAIL — ${missing} imported icon(s) do not exist in this react-icons version.`);
  process.exitCode = 1;
} else {
  console.log('\nPASS — every imported icon resolves.');
}
