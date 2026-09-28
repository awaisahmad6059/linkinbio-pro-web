import { PLATFORMS, PLATFORM_KEYS, matchDomain } from '../src/config/platforms.js';

/* The 12 original keys. Renaming any of these breaks links already in the DB. */
const ORIGINAL_12 = [
  'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube',
  'whatsapp', 'snapchat', 'pinterest', 'threads', 'email', 'custom',
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log('  FAIL: ' + msg);
};

console.log('=== platform registry ===');
console.log(`entries: ${PLATFORMS.length}\n`);

for (const p of PLATFORMS) {
  const problems = [];
  if (!p.key) problems.push('missing key');
  if (p.icon === undefined) problems.push('icon is undefined (must be a component or null)');
  if (p.icon === null && !['canva', 'contra', 'peopleperhour', 'daraz', 'jazzcash', 'easypaisa', 'rozee', 'custom', 'email', 'phone', 'website'].includes(p.key)) {
    problems.push('unexpected null icon');
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(p.color || '')) problems.push(`bad color ${p.color}`);
  if (!p.category) problems.push('missing category');
  if (!Array.isArray(p.domains)) problems.push('domains must be an array');
  if (problems.length) fail(`${p.key}: ${problems.join('; ')}`);
}

// Duplicate keys
const seen = new Set();
for (const p of PLATFORMS) {
  if (seen.has(p.key)) fail(`duplicate key ${p.key}`);
  seen.add(p.key);
}

// Original 12 preserved
for (const k of ORIGINAL_12) {
  if (!PLATFORM_KEYS.includes(k)) fail(`original platform '${k}' is missing`);
}

console.log(`original 12 preserved: ${ORIGINAL_12.every((k) => PLATFORM_KEYS.includes(k)) ? 'yes' : 'NO'}`);

console.log('\n=== domain matching ===');
const cases = [
  ['https://www.fiverr.com/awais', 'fiverr'],
  ['https://www.upwork.com/freelancers/~abc', 'upwork'],
  ['github.com/awais', 'github'],
  ['awais.behance.net', 'behance'],
  ['https://x.com/awais', 'twitter'],
  ['https://twitter.com/awais', 'twitter'],
  ['https://youtu.be/abc', 'youtube'],
  ['https://wa.me/923001234567', 'whatsapp'],
  ['https://t.me/awais', 'telegram'],
  ['https://discord.gg/abc', 'discord'],
  ['https://music.apple.com/us/artist/x', 'applemusic'],
  ['https://example.org', null],
  ['https://a.co/d/xyz', 'amazon'],
  ['https://open.spotify.com/artist/x', 'spotify'],
  ['https://dev.to/awais', 'devto'],
  ['https://stackoverflow.com/users/1/x', 'stackoverflow'],
  ['https://my-shop.myshopify.com', 'shopify'],
  ['https://maps.google.com/?q=x', 'googlemaps'],
];
for (const [input, expected] of cases) {
  const host = input.replace(/^https?:\/\//, '').split('/')[0];
  const got = matchDomain(host);
  if (got !== expected) fail(`matchDomain('${host}') => ${got}, expected ${expected}`);
}
console.log(`domain cases checked: ${cases.length}`);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);
