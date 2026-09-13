# Pantry

A personal pantry tracker you can install on an iPhone from Safari. Add what you have, count it down, and see what is expired or running out — without an account.

Data stays on the device (IndexedDB, with a localStorage fallback). After the first load, the app shell works offline.

## What’s in v1

- Add, edit, and delete pantry items
- Name, quantity + unit, optional category, expiry date, and notes
- Search, category filter, and stock filters (all / expiring / out)
- Sort by name, soonest expiry, or recently updated
- Thumb-friendly +/− quantity and “mark empty”
- Expiry highlighting (expired, use soon)
- Light, dark, and system theme
- First-run welcome + empty states
- PWA: manifest, icons, service worker, iOS Add to Home Screen meta tags

Out of scope: accounts, cloud sync, barcodes, recipes, shopping lists, App Store builds.

## Live site (GitHub Pages)

After this repo is merged to `main` and Pages is enabled, the app is at:

**https://vinboy88.github.io/Pantry-tracker-/**

The repository name ends with a hyphen (`Pantry-tracker-`). That hyphen is part of the URL.

### One-time setup (required)

GitHub does not start Pages until a repo admin picks the Actions source:

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Save. The next push to `main` (or **Actions** → **Deploy GitHub Pages** → **Run workflow**) publishes `dist/`.

If the URL 404s after merge, this toggle is usually still set to “Deploy from a branch”.

A GitHub Actions workflow (`.github/workflows/pages.yml`) builds with `GITHUB_PAGES=true` so Vite uses the project base `/Pantry-tracker-/`, then deploys `dist/` with `upload-pages-artifact` + `deploy-pages`. Pull requests run the same production build (no deploy) so the Pages prefix stays green.

Local `npm run dev` and `npm run build` still use `/` and are unchanged.

## Local development

Requires Node 20+ and npm.

```bash
npm install
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). On the same Wi-Fi, the `--host` flag is already enabled so you can open the Network URL from a phone browser. Service workers only register in the production build.

## Production build

```bash
npm run build
npm run preview
```

That local production build uses `base: '/'` (same as `npm run dev`). `dist/` is a static site you can host anywhere that serves HTTPS.

To build the same way GitHub Pages does (prefixed assets):

```bash
npm run build:pages
```

Output then expects to be served under `/Pantry-tracker-/` (for example `http://localhost:4173/Pantry-tracker-/` if you preview that folder with the matching base).

```bash
npm run lint
```

Regenerate PWA icons (optional; PNGs are already committed):

```bash
npm run icons
```

## Put it on an iPhone

Safari can install this as a Home Screen app. **HTTPS is required** (a raw LAN IP does not count).

### Option A — GitHub Pages (no PC after merge)

1. Enable Pages once (see [One-time setup](#one-time-setup-required) above) and wait for the `Deploy GitHub Pages` workflow on `main` to finish.
2. On the iPhone, open **https://vinboy88.github.io/Pantry-tracker-/** in **Safari** (not Chrome).
3. Tap **Share** → **Add to Home Screen**.
4. Keep the name **Pantry**, then tap **Add**.
5. Open it from the Home Screen. It launches full-screen, without Safari chrome.

### Option B — any other static host

Deploy the `dist/` from `npm run build` (root base) to Cloudflare Pages, Netlify, or similar, then use the same Safari Share → Add to Home Screen steps.

### Option C — tunnel from a computer

```bash
npm run build
npm run preview
```

In another terminal, expose port `4173` with a tunnel (`cloudflared`, ngrok, or Tailscale Funnel). Open the HTTPS URL in Safari, then **Share → Add to Home Screen**.

### After install

- Items persist locally and remain available offline after that first visit.
- To refresh after a new deploy, open the Home Screen app once while online.

## Stack

Vite, React, TypeScript. No backend. Persistence is IndexedDB (`pantry-tracker`). Theme and onboarding flags live in `localStorage`.
