# Spot v4.7

A map-first, local venue-activity prototype with no chatbot or AI runtime.

## Run

The complete portable app is `preview/spot-v4.7.html`. Open it directly in a browser.

For the source version:

```bash
node server.mjs
```

Open `http://localhost:4318`. Requires Node.js 22.16.0 or newer. No dependencies
need to be installed. The optional launchers open the browser for you.

## Build and test

```bash
node scripts/build-standalone.mjs
node --test tests/*.test.mjs tests/spot/*.test.cjs
```

The build has no third-party tooling dependencies. `package-lock.json` contains
only the root package because the package has no dependencies.

Browser development tests use Python 3 plus Playwright and a Chromium executable:

```bash
python -m pip install -r tests/requirements.txt
python tests/browser_test.py
```

Set `CHROMIUM_PATH` if Chromium is not installed at `/usr/bin/chromium`. This is
only for development tests, not for running the app.

## Components

- `public/spot/app.js`: existing map, places, friends, saved/comparison UI, privacy.
- `public/spot/venue-cover.js`: pure category-header renderer, with local inline SVG.
- `public/spot/venue-cover.css`: desktop and mobile header styles using the existing
  light/dark brand tokens.
- `public/spot/core.js`, `lincoln-data.js`, `map-core.js`, `map-renderer.js`,
  `map-gestures.js`, `place-search.js`: unchanged from v4.6.
- `public/spot/pwa.js` and `public/sw.js`: optional map-only offline shell for
  localhost or HTTPS. No generic fallback to removed pages.
- `server.mjs`: static files and `/health` only. No upstream proxy or write APIs.
- `scripts/build-standalone.mjs`: inlines the source into the portable HTML file.

The 32-venue dataset remains 24 cafés and 8 bars/clubs. The original 600-meter
minimum spacing, 5,000 accounts, 610 initial venue presences, and 60 friends remain
as authored demo choices. Read `docs/PROTOTYPE-DATA.md` for the data limitations.

## UI changes

The old truncated-name decoration is removed. Place overview headers now use
category artwork and the full venue name below. There is no real business photo
or suggested live capacity embedded in these illustrations. On mobile the compact
header leaves the map interactive, with search and other pins still accessible.

The 48-pixel header is independent from the map controls. Single-finger drag and
two-finger pinch code is byte-identical to the previous release.

## Local serving options

The server defaults to `127.0.0.1:4318`. `PORT` selects another port. For testing a
phone on your own trusted LAN, set `HOST=0.0.0.0` and `PUBLIC_ORIGIN` to the exact
LAN origin you will open, for example `http://192.168.1.10:4318`. Do not expose this
prototype on the public internet. The app itself does not need geolocation.

`TLS_CERT` and `TLS_KEY` can supply a certificate and key you own. A phone needs a
trusted HTTPS origin for service-worker offline installation; ordinary map
browsing is available without that optional feature.

## Storage, offline use, and rollback

The portable file needs no network resources and skips service-worker registration.
Its current-tab features still work if browser storage is denied. Durable file-origin
localStorage varies by browser; it was not verified on physical devices here.

The source version caches only its map shell and replaces obsolete Spot AI shell
caches. It does not delete chat databases, third-party model caches, or unrelated
application storage. The old AI code is not included in this ZIP, even as a hidden
panel or bundled rollback. The prior ZIP remains a separate artifact, identified
by `rollback-manifest.json`.

Stop the prior server before starting this one. Use separate folders for releases.
Map settings use the existing localStorage key; changing server ports or moving
portable files can change the browser's storage scope.

## Validation

See `docs/TEST-REPORT.md` for the exact checks run and limitations. The browser
suite uses the actual portable HTML with no model, network, or storage mocks.
Service-worker behavior is unit-tested with controlled fixtures, not claimed as
an end-to-end installed PWA test. No physical phone, Safari, macOS launcher or
Windows launcher was available in this environment.

## Version assumptions and documentation

Runtime and build: built-in APIs from Node.js 22.16.0, plain JavaScript and CSS.
No AI libraries or third-party runtime version assumptions remain.

References used for the server and optional offline update logic:
- Node 22.16.0 HTTP: https://nodejs.org/download/release/v22.16.0/docs/api/http.html
- Service-worker activation: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
- Client control: https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim

This is not a production multiuser location service. All presence and friend data
are simulations; client-side controls are not a substitute for backend authorization.
