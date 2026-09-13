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

`dist/` is a static site. Host it anywhere that serves HTTPS.

```bash
npm run lint
```

Regenerate PWA icons (optional; PNGs are already committed):

```bash
npm run icons
```

## Put it on an iPhone

Safari can install this as a Home Screen app. **HTTPS is required** (localhost on the phone does not count).

### Option A — static hosting (simplest)

1. Deploy the `dist/` folder to [Cloudflare Pages](https://pages.cloudflare.com/), [Netlify](https://www.netlify.com/), [GitHub Pages](https://pages.github.com/), or any static host.
2. On the iPhone, open the HTTPS URL in **Safari** (not Chrome).
3. Tap **Share** → **Add to Home Screen**.
4. Keep the name **Pantry**, then tap **Add**.
5. Open it from the Home Screen. It launches full-screen, without Safari chrome.

### Option B — tunnel from your computer

Useful for trying a local build on a phone:

```bash
npm run build
npm run preview
```

In another terminal, expose the preview server (port `4173`) with a tunnel you already use, for example:

```bash
npx cloudflared tunnel --url http://localhost:4173
```

or ngrok / Tailscale Funnel. Open the HTTPS URL in Safari, then **Share → Add to Home Screen**.

### After install

- Items persist locally and remain available offline after that first visit.
- To refresh after a new deploy, open the Home Screen app once while online.

## Stack

Vite, React, TypeScript. No backend. Persistence is IndexedDB (`pantry-tracker`). Theme and onboarding flags live in `localStorage`.
