import {
  normalizeLinkInput, detectPlatform, repairStoredUrl, displayAddress,
  opensInNewTab, toDestination, schemeProblem, looksLikeEmail,
} from '../src/lib/linkUrl.js';

let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log(`  FAIL ${name}\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`);
  }
};
const section = (s) => console.log(`\n--- ${s} ---`);

/* ============ THE BUG: email stored as a URL ============ */
section('email stored as URL (the reported bug)');
eq('bare email', normalizeLinkInput('awaisahmad6059@gmail.com'),
  { kind: 'email', value: 'mailto:awaisahmad6059@gmail.com', platform: 'email' });
eq('https:// email', normalizeLinkInput('https://awaisahmad6059@gmail.com'),
  { kind: 'email', value: 'mailto:awaisahmad6059@gmail.com', platform: 'email' });
eq('mailto: email', normalizeLinkInput('mailto:awaisahmad6059@gmail.com'),
  { kind: 'email', value: 'mailto:awaisahmad6059@gmail.com', platform: 'email' });
eq('with spaces', normalizeLinkInput('  awaisahmad6059@Gmail.COM  '),
  { kind: 'email', value: 'mailto:awaisahmad6059@gmail.com', platform: 'email' });
eq('all three agree', (() => {
  const a = normalizeLinkInput('awaisahmad6059@gmail.com').value;
  const b = normalizeLinkInput('https://awaisahmad6059@gmail.com').value;
  const c = normalizeLinkInput('mailto:awaisahmad6059@gmail.com').value;
  return a === b && b === c;
})(), true);
eq('local part case preserved', normalizeLinkInput('Awais.Ahmad@Gmail.com').value,
  'mailto:Awais.Ahmad@gmail.com');
eq('looksLikeEmail rejects not-an-email', looksLikeEmail('awais@gmail'), false);
eq('looksLikeEmail rejects url', looksLikeEmail('https://gmail.com'), false);

/* ============ auto-detection ============ */
section('platform auto-detection');
const detect = [
  ['https://www.fiverr.com/awais', 'fiverr'],
  ['https://www.upwork.com/freelancers/~abc', 'upwork'],
  ['github.com/awais', 'github'],
  ['https://awais.behance.net', 'behance'],
  ['https://x.com/a', 'twitter'],
  ['https://twitter.com/a', 'twitter'],
  ['https://youtu.be/abc', 'youtube'],
  ['https://wa.me/923001234567', 'whatsapp'],
  ['https://t.me/a', 'telegram'],
  ['https://discord.gg/a', 'discord'],
  ['https://open.spotify.com/artist/a', 'spotify'],
  ['https://example.org', 'custom'],
  ['https://example.org/some/deep/page?x=1', 'custom'],
  ['', 'custom'],
  ['awaisahmad6059@gmail.com', 'email'],
  ['mailto:a@b.com', 'email'],
  ['tel:+923001234567', 'phone'],
];
for (const [input, want] of detect) eq(`detect ${JSON.stringify(input)}`, detectPlatform(input), want);

/* ============ normal websites ============ */
section('normal websites');
eq('bare domain', normalizeLinkInput('fiverr.com/awais').value, 'https://fiverr.com/awais');
eq('scheme kept', normalizeLinkInput('https://github.com/awais').value, 'https://github.com/awais');
eq('http kept', normalizeLinkInput('http://example.com').value, 'http://example.com');
eq('subpath+query', normalizeLinkInput('example.org/a?b=1#c').value, 'https://example.org/a?b=1#c');
eq('localhost port', normalizeLinkInput('localhost:5173').value, 'https://localhost:5173');

/* ============ phone / whatsapp ============ */
section('phone and whatsapp');
eq('phone -> tel', normalizeLinkInput('+92 300 1234567', 'phone').value, 'tel:+923001234567');
eq('tel: already', normalizeLinkInput('tel:+923001234567').value, 'tel:+923001234567');
eq('wa digits', normalizeLinkInput('+92 300 1234567', 'whatsapp').value, 'https://wa.me/923001234567');
eq('wa link pasted', normalizeLinkInput('https://wa.me/923001234567', 'whatsapp').value,
  'https://wa.me/923001234567');

/* ============ dangerous schemes ============ */
section('scheme allowlist');
eq('javascript: rejected', normalizeLinkInput('javascript:alert(1)').error, 'That kind of link is not allowed');
eq('data: rejected', normalizeLinkInput('data:text/html,<script>').error, 'That kind of link is not allowed');
eq('vbscript: rejected', normalizeLinkInput('vbscript:msgbox(1)').error, 'That kind of link is not allowed');
eq('javascript schemeProblem', schemeProblem('javascript:alert(1)'), 'That kind of link is not allowed');
eq('mailto allowed by schemeProblem', schemeProblem('mailto:a@b.com'), null);
eq('tel allowed by schemeProblem', schemeProblem('tel:+123'), null);
eq('https allowed by schemeProblem', schemeProblem('https://a.com'), null);
eq('ftp rejected by schemeProblem', schemeProblem('ftp://a.com'), 'Links must start with http, https, mailto or tel');
eq('no scheme is fine', schemeProblem('example.com'), null);

/* ============ defensive repair ============ */
section('repair + display');
eq('repair bad https email', repairStoredUrl('https://awaisahmad6059@gmail.com'), 'mailto:awaisahmad6059@gmail.com');
eq('repair keeps real path url', repairStoredUrl('https://github.com/awais/repo'),
  'https://github.com/awais/repo');
eq('repair leaves normal url', repairStoredUrl('https://example.com/a/b'), 'https://example.com/a/b');
eq('repair leaves real website email-ish', repairStoredUrl('https://user@sub.example.com'),
  'mailto:user@sub.example.com');

eq('display email', displayAddress({ url: 'mailto:awaisahmad6059@gmail.com', platform: 'email' }),
  'awaisahmad6059@gmail.com');
eq('display bad email', displayAddress({ url: 'https://awaisahmad6059@gmail.com', platform: 'email' }),
  'awaisahmad6059@gmail.com');
eq('display phone', displayAddress({ url: 'tel:+923001234567', platform: 'phone' }), '+923001234567');
eq('display normal url', displayAddress({ url: 'https://github.com/awais', platform: 'github' }),
  'https://github.com/awais');

/* ============ target handling ============ */
section('new-tab rules');
eq('mailto no new tab', opensInNewTab('mailto:a@b.com'), false);
eq('tel no new tab', opensInNewTab('tel:+123'), false);
eq('https new tab', opensInNewTab('https://a.com'), true);
eq('toDestination bad email', toDestination({ url: 'https://awaisahmad6059@gmail.com', platform: 'email' }),
  'mailto:awaisahmad6059@gmail.com');

console.log(`\n${fail === 0 ? 'ALL PASS' : fail + ' FAILED'}  (${pass} passed)`);
process.exit(fail === 0 ? 0 : 1);
