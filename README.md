# Spot · Lincoln & beyond — v0.4

An offline, interactive browser prototype. This version adds saved spots, a two- or three-place comparison, separate sharing permissions, safe place sharing, a directions preview, and explicitly fictional activity history. It deliberately does **not** add an “Open to company” status.

## Try it

Open `dist/spot-prototype.html` in a browser. No build step, API key, installation, external map assets, or real account is required. All CSS, JavaScript, map artwork, and fixtures are bundled in that one file.

Alternatively, from this folder:

```sh
npm start
```

The server prints its local address. Source changes can be tested through `index.html`; build a new standalone copy with:

```sh
npm run build
```

Node 20 or later is required for the development scripts; the browser version does not require Node. No npm dependencies need to be installed.

## What to try

### Your usuals

Bookmark a place from the list or its detail card. Select **Saved** beside the category filters to show your bookmarks on the same map. Saved works together with search, category, and friends filters. No favorites are preselected. Bookmarks stay in this browser when local storage is available; saving a place never enables sharing.

### Compare without leaving the map

Use a place's Compare button or the comparison icon beside its list entry. A shortlist appears after the first choice; the Compare button becomes available after the second. Choose up to three places. Comparison shows recent sample app-user counts, friends sharing with you, and freshness. It does not rank venues by crowding or infer seat availability.

The comparison is a **non-modal** panel. Search and map controls remain usable. Open another spot directly, or start another search; the shortlist stays until cleared. If a comparison target is excluded by the current map filters, opening it clears those filters so the place is visible. Selections survive navigation within the session but are not restored after reloading.

### Two independent sharing choices

Both start off.

* **Contribute to activity counts:** adds one existing demo account—your fictional presence—to Juniper Coffee's public aggregate. It does not enable named friend sharing.
* **Share my venue with friends:** requires explicitly selecting accepted friends. It does not turn on the public count contribution. A new friendship never automatically grants permission.

Privacy includes a preview of what each choice would show. Turning one switch off leaves the other unchanged. **Pause all sharing** removes both forms of your simulated presence immediately. Removing or blocking a selected friend revokes that friend's named permission; an empty audience disables named sharing. The chosen audience can be retained while its sharing switch is off, but it is not active until explicitly enabled again.

Incoming presence from the fictional friend fixtures is separate from your outgoing audience choices. No real person receives anything, and client-side simulation is not production access control.

### Share the place, not the people

A place's Share action previews public venue information. Clipboard copying and a supported device share menu are available only after your action. Payloads exclude friend names, counts, personal coordinates, and personal visit history. Clipboard failure provides selected text for manual copying; canceling a share does not claim success.

The standalone/local version shares plain text, **not a local file path or a fake public link**. When deliberately deployed on an eligible public HTTPS origin, the same code can generate a place-only `#place/<id>` link; it strips the current query string. Known-place deep links open the place and do not grant recipient access to any sender data. No hosted site is supplied with this download.

### Directions preview

Directions is deliberately a preview. Every venue is fictional, so the prototype does not send users to made-up businesses, open an external route, or request the user's location. It shows the intended destination and explains why navigation is not active. Connect verified real venue data before implementing actual routing.

### Activity timeline

Detail cards include an authored, deterministic 30-minute example at five-minute intervals. Each chart is labeled **Sample history** and provides an accessible description of its values. The latest point is anchored to the fixture's timestamp, not continually rewritten as “now.” Missing sample data produces no chart. Expiration does not append a false zero or pretend visitors departed. The graph is not measured telemetry, an occupancy estimate, or a prediction.

## Retained from v3

The illustrated Lincoln-region map, surrounding towns, light/dark/device appearance, existing friendship controls, search, regional extent controls, clustering, and nonblocking detail cards are retained. The canvas renderer still coalesces rapid input, caches clusters and geometry, reuses map pin elements, and skips offscreen map detail. The new tools do not rebuild the place list for each map pan/zoom frame.

The fictional scenario has 5,000 accounts, 336 venues, 60 accepted friends, six incoming requests, and 3,500 initial count-contributing accounts. Initially 42 friends share a venue with the viewer. Enabling the viewer's anonymous contribution moves one of the existing accounts into the map count: it does not create a 5,001st account. Records expire rather than refreshing themselves without evidence. Activity can be reset through Privacy or the About testing controls.

## Data and privacy boundaries

This is a local UX and logic prototype, not a production tracking app. It has no GPS, real accounts, background detection, sensors, analytics, backend authorization, verified venue information, seat estimates, or reservations. The map is original illustrated geography, not a surveyed street/building inventory or navigation map.

Public pins remain **one per establishment**, with aggregates or clusters; there are no personal public pins. Counts are participation, not total visitors or fullness. Unknown activity is not empty activity.

Preferences use the existing `spot-prototype-lincoln-v2` storage key for migration compatibility, with an internal version-4 schema. Old version-2 anonymous contribution/friend choices can migrate; named sharing remains off until explicitly granted. Saved preferences contain no observation timestamps, coordinates, history, or comparison session data. Appearance uses the existing separate key. Reset clears Spot preferences and restores the fixtures while keeping the chosen appearance.

The demonstration JavaScript necessarily contains all fictional people and test hooks. **Do not replace the fixtures with real personal data and treat client-side filtering as authorization.** A real system must enforce access and revocation on a backend and obtain appropriate location consent.

## Tests

```sh
npm test
npm run test:ui
npm run test:performance
```

**Release result: 186 passed, 0 failed (88 logic/map checks + 98 browser-interface checks).**

The first command uses Node's built-in test runner. Browser tests additionally require Python, Playwright, Pillow, and Chromium. Set `CHROMIUM_PATH` when the executable is not on `PATH`.

`artifacts/v4-core-results.txt`, `artifacts/v4-ui-results.json`, and `artifacts/v4-ui-output.txt` contain the actual release results. `tests/capture.py` creates preview screenshots; `tests/performance.py` records a limited map-render benchmark. Test previews use real UI actions on fictional data.

Browser tests load HTML through Playwright's `set_content` because direct file/URL navigation was blocked by the execution environment. These tests cover desktop/mobile-sized layouts, not physical mobile devices, durable browser-origin storage, iOS/Android background behavior, or operating-system sharing end-to-end. Clipboard and native-share success/failure branches use explicit mocks; pure state persistence and migration are round-trip tested separately. Performance timings cover JavaScript rendering work, not whole-frame latency or a guaranteed frame rate.

## Source layout

`app.js`: interface and interaction state. `core.js`: pure demo logic, permission transitions, persistence, safe share payloads, sample history. `lincoln-data.js`: fixtures and illustrated geography. `map-core.js`/`map-renderer.js`: canvas map and clustering. `theme.js`: appearance. `styles.css`: responsive light/dark presentation. `tests/`: core, map, browser, capture, and performance checks. `scripts/`: deterministic build, server, and fixture generator.

## API references consulted

Native-share and clipboard fallbacks were checked against the official Web API documentation:

- MDN, `Navigator.share`: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- MDN, `Clipboard.writeText`: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- Google Maps URL documentation (future real-venue routing reference only): https://developers.google.com/maps/documentation/urls/get-started
