# LinkInBio Pro — Web App

The frontend for **LinkInBio Pro**, a self-hosted Linktree alternative. React 18 + Vite,
deployed as a static SPA.

Public creator pages live at the root of the domain — `/octocat` **is** the product, not a
route behind an app shell. The backend is a separate repository,
[`linkinbio-pro-server`](../server), and the two are versioned independently, which has
consequences described under [Keeping the two repos in sync](#keeping-the-two-repos-in-sync).

---

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Routing](#routing)
- [The profile renderer](#the-profile-renderer)
- [Themes](#themes)
- [The `custom` theme and cover images](#the-custom-theme-and-cover-images)
- [State](#state)
- [API layer](#api-layer)
- [Link URL handling](#link-url-handling)
- [Verification suite](#verification-suite)
- [Deployment](#deployment)
- [Accessibility and motion](#accessibility-and-motion)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Requirements

| Requirement | Version |
| --- | --- |
| Node.js | 18 or newer |
| npm | 9 or newer |

The backend must be running too — this app has no offline mode and no mock data. See
[`server/README.md`](../server/README.md) for its setup.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

There is no `.env` needed locally. `vite.config.js` proxies `/api` to
`http://localhost:5000`, so the browser stays same-origin and CORS never enters the
picture during development.

To check against a production build instead:

```bash
npm run build
npm run preview        # serves dist on 4173, same /api proxy
```

---

## Environment variables

Only needed in production. Copy `.env.example` to `.env` when you have one.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | *(empty)* | Public origin of the deployed API. Empty means same-origin `/api` |
| `VITE_PUBLIC_URL` | `window.location.origin` | Used to build the "copy your link" string in the dashboard |

Leave `VITE_API_URL` empty and the app calls `/api` on whatever origin it is served
from — correct for a same-origin deployment and for local dev via the proxy. Set it only
when the API lives somewhere else, and add that origin to the server's `CLIENT_URL`.

> `VITE_`-prefixed variables are **inlined into the bundle at build time**. Anything in
> this file is public. Never put a secret here — the JWT is issued by the API and only
> ever stored in `localStorage`.

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on 5173 with the `/api` proxy |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve `dist/` on 4173 with the same proxy |
| `npm run lint` | ESLint with `--max-warnings 0` — a warning fails the run |
| `npm run verify` | All four verification scripts |
| `npm run verify:platforms` | Platform registry integrity, including the original twelve keys |
| `npm run verify:linkurl` | URL detection, normalisation, scheme rejection |
| `npm run verify:icons` | Every imported `react-icons` name exists in the installed version |
| `npm run verify:cover` | The cover's CSS contract and theme-list safety |

None of the verification scripts need a running server or a database. They read source
files and assert invariants, so they run in about a second.

---

## Project structure

```
client/
├── public/
│   ├── favicon.svg
│   └── _redirects             # SPA fallback for hosts that read it
├── src/
│   ├── main.jsx               # React root
│   ├── App.jsx                # every route + every guard
│   ├── components/
│   │   ├── common/            # Button, Field, Modal, Switch, Toaster, Avatar, PhoneFrame, Skeleton…
│   │   ├── layout/            # AppShell, AuthShell, MarketingNav, MarketingFooter
│   │   ├── auth/              # LoginForm, UsernameField, HelpRequestModal
│   │   ├── dashboard/         # LinkManager, LinkCard, LinkForm, ProfileEditor,
│   │   │                      # ThemePicker, LivePreview, CoverEditor, NotificationBell,
│   │   │                      # PlatformPicker, IconControls, Unblock/VerifyRequestModal
│   │   ├── profile/           # ProfileView — the single renderer
│   │   ├── landing/           # Hero, Features, ThemeShowcase, AnalyticsShowcase, FinalCta
│   │   └── admin/             # AdminShell, StatCard, BarRow
│   ├── pages/                 # Landing, Login, Signup, Dashboard, Analytics, Settings,
│   │   ├── PublicProfile, NotFound
│   ├── admin/                 # Admin login, overview, users, user detail,
│   │                          # requests, blocks, insights — all lazy-loaded
│   ├── store/                 # Zustand: auth, notifications, toasts
│   ├── lib/                   # api.js, cover.js, linkUrl.js, utils.js, constants.js
│   ├── config/                # platforms.js — the platform registry
│   └── styles/                # global, themes, landing, dashboard, picker, admin
├── scripts/                   # verify-*.mjs
├── .eslintrc.cjs
└── vite.config.js
```

`src/lib/constants.js` is mostly backwards-compatible re-exports. The platform catalogue
now lives in `src/config/platforms.js`, which is the single source of truth for the
picker, URL auto-detection and every rendered icon; `constants.js` keeps the older import
paths working unchanged.

---

## Routing

| Path | Guard | Page |
| --- | --- | --- |
| `/` | — | Landing |
| `/login` | guest | Login |
| `/signup` | guest | Signup |
| `/dashboard` | session | Dashboard |
| `/dashboard/analytics` | session | Analytics |
| `/dashboard/settings` | session | Settings |
| `/admin/login` | admin guest | Admin sign-in |
| `/admin` | admin | Overview |
| `/admin/users` | admin | User list |
| `/admin/users/:id` | admin | User detail and moderation |
| `/admin/requests` | admin | Help desk queue |
| `/admin/blocks` | admin | Address block list |
| `/admin/insights` | admin | Platform and traffic insights |
| `/:username` | — | **Public profile** |
| `*` | — | Not found |

Two ordering facts in `App.jsx` are load-bearing, not stylistic:

**Every `/admin/*` route is declared before `/:username`.** The public route is a
catch-all for a single segment, so `/admin` would otherwise be swallowed and rendered as
a 404 profile page for a user called "admin".

**`loggingOut` suspends the guards rather than letting them race.** Logout navigates first
and clears the session second; React batches both into one render, during which the
location still reads `/dashboard` while `user` is already `null`. Without a flag the
protected guard reads that intermediate state and issues its own `/login` redirect, which
wins over the intended landing page. The flag is released only after the router has
genuinely committed a public route — and on a deferred tick, because during the exit
animation `location.pathname` still reports the outgoing path.

The admin guard reads the role from the cached session. That is a **convenience redirect,
not the security boundary**: it stops a normal user being shown a broken admin shell, but
every admin endpoint re-reads the role from the database before returning anything, so a
hand-edited `localStorage` grants nothing.

The admin pages are `React.lazy`-loaded. They are a small slice of the app that most
visitors never open, and their charts plus the Recharts dependency only download if an
administrator actually goes there.

---

## The profile renderer

`src/components/profile/ProfileView.jsx` is the **only** thing that renders a profile. It
is used by four callers:

1. The public page at `/:username`
2. The dashboard's live preview
3. The theme picker thumbnails
4. The landing page's theme showcase

That is deliberate. The dashboard preview was originally a hand-built mockup, and it
drifted: it rendered an avatar correctly while the public page did not, then the opposite.
Two implementations of the same thing means one of them is always wrong, and nothing in
the build can tell you which.

Because it is one component, a fix for a rendering bug is a fix everywhere. Props:

| Prop | Effect |
| --- | --- |
| `profile`, `links` | The data |
| `theme` | Which `.theme-*` class to apply |
| `cover` | The `custom` theme's photo and knobs, as a separate prop |
| `compact` | Tighter spacing for thumbnails and the showcase |
| `animate` | Entrance animation; off in thumbnails so they settle immediately |
| `isPage` | Marks the full public page rather than an embedded preview |

`cover` is passed separately rather than inside `profile` so the renderer never has to
know which fields are themeable. The public page only builds it when `coverImage` is
truthy, to avoid pushing a few hundred kilobytes of data URL into the style attribute of
themes that ignore it.

---

## Themes

Six, in `src/lib/constants.js`:

| Key | Name | Character |
| --- | --- | --- |
| `minimal` | Minimal Light | Clean white card, Inter, restrained borders |
| `dark` | Dark Mode | Deep charcoal, high-contrast light text |
| `gradient` | Gradient | Animated blobs over a brand gradient, frosted card |
| `bold` | Colorful Bold | Oversized type, saturated accent blocks |
| `nature` | Nature Soft | Warm off-white, Fraunces serif, organic shapes |
| `custom` | Custom Photo | Your own uploaded photo, full screen |

Themes are pure CSS custom properties in `src/styles/themes.css`, driven off a single
`--pf-*` vocabulary each theme redefines. Adding a seventh means writing one class and
one entry in the list — no component changes.

**`selectedTheme` is validated against a server enum.** A theme that exists only in the
stylesheet is one the API will refuse to save, and renaming a key orphans every account
already using it. `npm run verify:cover` asserts the two lists match for exactly this
reason.

---

## The `custom` theme and cover images

The one theme whose background comes from outside the stylesheet.

**Upload-only, raster only.** `png`, `jpeg` or `webp`, base64, ≤300KB decoded. No remote
URL, unlike the avatar which accepts one: a cover is painted behind every visitor on every
load, so a remote URL would turn the profile into a third-party tracking pixel that leaks
that visitor's IP and referrer, and renders as nothing the day the host goes away. No SVG,
because an SVG is a script-bearing document and this string ends up as a background on a
public page. No GIF, because a static cover has no use for animation.

**Resized in the browser before upload.** `resizeCoverToDataUrl` in `lib/utils.js` draws
the image to a canvas scaled to a 1600px long edge, then walks a JPEG quality ladder
(0.82 → 0.42) until it fits the budget, and as a last resort drops to 75% dimensions. A
6MB phone photo is never sent at full size, and a 12-megapixel one usually lands inside
300KB at the first quality it tries.

**Six knobs** in `CoverEditor.jsx`, defined once in `lib/cover.js`:

| Knob | Range | Default |
| --- | --- | --- |
| `zoom` | 1 – 3 | 1 |
| `x`, `y` | 0 – 100 | 50 |
| `blur` | 0 – 24 px | 0 |
| `brightness` | 0.3 – 1.8 | 1 |
| `dim` | 0 – 0.9 | 0.45 |

`zoom` bottoms out at 1 because 1 is already `background-size: cover` — the point at which
the photo fills the screen in both directions with no stretching and no gap. The sliders
can therefore only crop *further in*, which is what makes zoom plus the two position
sliders a crop control without needing a separate one.

`dim` is the darkening veil, and it is a **separate `::after` pseudo-element outside the
`brightness()` filter**, so the brightness slider cannot reach through it. A readable name
is not something a user should be able to talk themselves out of.

`clampCover` mirrors the server's `clampCoverSettings`: it drops unknown keys, pulls
out-of-range values back inside, and treats `null`, `''` and garbage as absent — falling
back per knob, so one bad field cannot leave the other five undefined. That last part
matters because `Number(null)` is `0`, which would slam `brightness` to its minimum.

`coverStyle` returns the knobs as `--pf-cover-*` custom properties on an inline style. They
are applied unconditionally, which is safe because only `.theme-custom` reads them.

`SAMPLE_COVER` is an inline SVG used for the theme tile, the landing showcase, and the
preview before anything has been uploaded. It is our own constant, never user input, so it
is allowed where an uploaded cover is not — and `isRenderableImage` matches it **by
identity**, so widening that to "any inline image" is not a one-word change that lets an
SVG in through the front.

---

## State

Three Zustand stores, deliberately narrow.

**`authStore`** — the user, their links, and the session lifecycle. Its `status` field
(`idle | loading | ready | error`) drives the skeleton screens so the app never flashes a
spinner-less blank frame, and `authChecked` blocks the dashboard until the stored JWT has
actually been verified rather than optimistically trusted.

`justSignedIn` holds for about a second after login so the auth form can play its
success-checkmark animation before the guest guard redirects. `loggingOut` is described
under [Routing](#routing).

**`notificationStore`** — the dashboard bell. Only the *count* is polled, every 15
seconds, and only while `document.visibilityState` is visible; the list is fetched when the
panel opens or the count moves. A tab left open costs one small indexed query every 15
seconds instead of dragging the whole list down each time.

Polling rather than a socket is a deployment consequence: the API runs on Netlify
Functions, where a long-lived SSE or WebSocket is cut off by the platform's execution
limit. `checkUnread` never throws and never blocks a render — a `429`, an offline tab or a
signed-out session keeps the last known count rather than flashing a wrong zero, and the
next poll retries. `startPolling` returns its teardown so a component that unmounts cannot
leave an interval behind. `reset` clears everything on sign-out so the next account never
inherits the last one's badge.

**`toastStore`** — transient notifications.

---

## API layer

`src/lib/api.js` is the only place that talks to the server. One Axios instance with a
20-second timeout, the JWT attached by a request interceptor from `localStorage` under the
key `libpro.token`.

`parseApiError` normalises everything into `{ message, fieldErrors, status }`, so no
component ever inspects Axios internals. A network failure and a timeout get different
messages, and the field errors arrive keyed by field name for inline form display.

The helpers are grouped by domain — `authApi`, `linksApi`, `publicApi`, `analyticsApi`,
`adminApi`, `notificationsApi`, `requestsApi` — and each unwraps the response envelope, so
callers get data directly.

---

## Link URL handling

`src/lib/linkUrl.js` owns everything between raw user input and a storable URL:

- **Scheme allowlist** — `http`, `https`, `mailto`, `tel`. `javascript:`, `data:`,
  `vbscript:`, `file:` and `blob:` are rejected regardless of what the caller claims.
- **Platform detection** — matching the domain tells the picker which tile to select and
  which brand icon and colour to render, so a YouTube paste comes back as a YouTube link.
- **Normalisation** — a bare address gains a scheme, an email becomes `mailto:`, a phone
  number loses its punctuation. Whitespace-only and empty inputs are rejected before
  normalisation, not after, so a value cannot be "fixed" into something the user did not
  type.
- **Repair of stored URLs** — links saved before normalisation existed are read back
  through `repairStoredUrl` on the public page, so old rows keep rendering.

The server re-validates everything rather than trusting this module, because these values
end up as real `href` attributes on a public page. This one is for fast feedback and
better messages; `server/src/utils/validators.js` is the boundary that decides.

---

## Verification suite

```bash
npm run verify              # all four
npm run verify:cover        # fastest, and the one with the most surprising checks
```

No server and no database needed — these read source files and assert invariants.

**`verify:platforms`** — that the original twelve keys are still present verbatim, that
every platform resolves to metadata, and that domain matching is unambiguous. Renaming
any of those twelve breaks every link already stored in the database, which is exactly the
kind of break no build step catches.

**`verify:linkurl`** — detection, normalisation and scheme rejection across a table of
inputs, including the ones that look valid and are not.

**`verify-icons`** — that every name imported from `react-icons` exists in the installed
version. Brands with no available glyph are intentionally `icon: null` and fall back to a
favicon or a letter, so those are not failures; what must never happen is the registry
importing a name that does not exist, because that renders as a blank tile and only shows
up visually.

**`verify:cover`** — that the six theme keys match what the API accepts, that every CSS
custom property `coverStyle` emits is actually *read* by `themes.css`, and vice versa. A
typo in either direction renders a plausible-looking page with one control silently doing
nothing, which is the failure mode that costs the most time to notice.

---

## Deployment

Any static host works — Netlify, Vercel, Cloudflare Pages, GitHub Pages.

```bash
npm run build        # output: dist/
```

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment | `VITE_API_URL=https://api.your-domain.com` |

### The SPA rewrite is required

The app uses real URL paths, so **every unknown path must serve `index.html`**. Without
it, refreshing `/octocat` or `/dashboard` returns the host's 404 page instead of the app —
the page works until you reload it, which is the worst way for it to break.

```text
public/_redirects        # already committed, Netlify reads it automatically
/*    /index.html   200
```

```nginx
# nginx
location / { try_files $uri $uri/ /index.html; }
```

```jsonc
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

If your host ignores `_redirects`, configure the same rule in its dashboard.

### Build configuration

`vite.config.js` splits the heavy vendors into their own cacheable chunks — `react`,
`motion`, `charts`, `dnd` — so a code change does not invalidate Recharts for every
visitor. Sourcemaps are off. Source maps contain the original source, so leave them off
unless you intend to publish them.

---

## Accessibility and motion

- `prefers-reduced-motion` is honoured for CSS animation and transitions (a blanket
  override in `global.css`), for the count-up numbers, and for the confetti burst. The
  Framer Motion transitions are **not** gated on it — if that matters for your
  accessibility requirements, wrap the app in `<MotionConfig reducedMotion="user">`
- Every outbound link carries `rel="noopener noreferrer"`
- A skip-link to the main content exists, so a keyboard user can bypass the nav
- Form labels are wired to their inputs with `htmlFor`, and errors are attached via
  `aria-describedby` + `aria-invalid` and announced with `role="alert"`
- Modals render as `role="dialog" aria-modal="true"`, close on `Escape`, lock body scroll,
  and close on a backdrop click
- Disclosing controls carry `aria-expanded`, and the analytics range switcher is a real
  `role="tablist"`
- Decorative layers (blob backgrounds, logo marks, status dots) are `aria-hidden` so a
  screen reader is not reading them out
- Avatar images fall back to initials on `onError`, so a broken photo URL degrades to a
  letter rather than a broken-image icon
- Self-hosted Inter and Fraunces via `@fontsource` — no third-party font request, which
  also means no visitor IP is handed to a font CDN
- Semantic form labels with inline errors announced alongside their fields

---

## Security notes

What this app does and does not do:

- **The JWT lives in `localStorage`** under `libpro.token`. That is readable by any script
  on the origin, so an XSS bug is a session compromise. There is no `httpOnly` cookie
  option, because the API is a separate origin in the deployed setup. Keep the XSS surface
  small: no `dangerouslySetInnerHTML` anywhere, and image URLs are pattern-checked before
  they reach an `href` or a `url()`.
- **Every validation rule is mirrored from the server.** That is for fast feedback and
  good inline messages only. The server re-validates everything and is the only boundary
  that decides.
- **`VITE_` variables are public.** They are inlined into the bundle at build time.
- **The admin guard is cosmetic.** It hides the UI from non-admins; the server enforces it.

Nothing in this repository holds a credential.

---

## Troubleshooting

**Blank page, or `/:username` 404s on refresh in production**
The SPA rewrite is missing. See [Deployment](#deployment).

**`Cannot reach the server. Is the backend running?`**
`parseApiError`'s network message. Check `curl http://localhost:5000/api/health`. If the
API is up but this still appears, the dev proxy target or `VITE_API_URL` is wrong.

**CORS errors**
The origin is not in the server's `CLIENT_URL`, which is matched exactly including scheme
and port.

**Dashboard edits do not save**
Autosave is debounced — wait for the indicator to read `Saved`. If it stays `Unsaved`, the
API is unreachable or the token has expired.

**A theme saves but the public page shows the old one**
The public response is `no-store`, so this is normally a service worker or a CDN sitting in
front of the API. Check the response headers directly.

**A theme tile renders blank**
`selectedTheme` is validated against a server enum. A theme in the stylesheet but not in
the API's list is one the API refuses to store. `npm run verify:cover` catches this.

**A link icon renders as an empty box**
A platform's icon name does not exist in the installed `react-icons`.
`npm run verify:icons` catches it. It is a blank tile at runtime and only visible by eye,
which is why the check exists.

**`npm run lint` fails on an unused variable**
`--max-warnings 0` means warnings are errors here. Prefix with `_` if it is an unused
argument; the config already ignores unused names in caps.