# Spot · v4.3

An offline, self-contained Lincoln-region venue-activity prototype. This version adds real-area search and an independent indigo/coral visual identity. All venues, accounts, friends, presence and history are still fictional.

## Open

Open `dist/spot-prototype.html` in a modern browser. No installation, API key, network connection or account is required. Alternatively, run `npm start` and open the local URL printed in the terminal. Node 20+ is required for the local server, build script and unit tests.

## What changed

- Real-area search: type **East Campus** to center the map on the campus area and see 17 nearby fictional establishments. Names, casing, common aliases (including `UNL East`) and Lincoln/NE suffixes are recognized.
- The bundled index contains **40** neighborhoods, campuses, parks, lakes and nearby towns, including City Campus, Haymarket, Havelock, Holmes Lake, Waverly and Seward. Partial matches appear as suggestions; choose with touch/click or arrow keys and Enter. Ambiguous partial names do not automatically move the camera.
- Nearby establishments are sorted by straight-line distance from the selected area's approximate center, not from the user's phone. The area radius is displayed. Results respect café/bar, saved and friends filters. Empty nearby sample coverage stays empty; we do not invent visitors or fabricate addresses.
- A selected area has a distinct coral reference marker without an occupancy count. **All areas** leaves that area; Region/Lincoln/Downtown presets clear the geographic query. Text searches still find the fictional venues.
- Search remains accessible with place details open. On mobile, resolving a real area returns from List to Map. An explicit suggestion/Enter selection releases input focus; auto-completion while typing does not forcibly interrupt the keyboard.
- The entire interface now uses cool-white / indigo light mode and midnight-blue / lavender dark mode, with coral highlights. The single-canvas map has matching palettes. Existing appearance preferences continue to work.
- A new **signal-ring** SVG replaces the previous location-pin branding in the app and favicon. The SVG is in `assets/spot-mark.svg`. This is a design proposal, not a trademark clearance.
- The v4.2 decluttered map geometry, stable keyed markers, progressive labels, one-finger pan / two-finger pinch controls, nonblocking details, saved spots, comparison, separate sharing controls, and sample timeline are retained.

## Search data and limitations

This is a **bundled local place-name index, not live geocoding**. It does not resolve arbitrary street addresses, every establishment, the entire state or worldwide locations. Unknown searches never receive guessed coordinates. Some supported areas do not have any sample establishments inside their search radius.

The existing map fixture provides approximate real-area centers and schematic street/park geometry. Campus names were checked against the University of Nebraska–Lincoln directory at https://maps.unl.edu/ and https://maps.unl.edu/NEU. The parks directory reference is https://www.lincoln.ne.gov/City/Departments/Parks-and-Recreation/Parks-Facilities/Parks-A-to-Z . These references establish names/context, not survey accuracy of the inherited map centers. No source map artwork was copied. Area centers are NOT entrances, precise building locations, boundary polygons, or routing destinations.

`place-search.js` is a pure, separately testable gazetteer/search module. It normalizes aliases, ranks suggestions, computes distances and proposes camera targets. It makes **no network requests, geolocation calls or analytics submissions**. Searches are not written to storage. Real-area lookup does not create or update a user's presence.

## Unchanged demo

336 fictional venues; 5,000 demo accounts; 3,500 initially at establishments; 60 friends; 42 initially sharing a venue; 6 friend requests. Each venue has one aggregate public count. Counts are participating app accounts, not verified total occupancy, fullness, or available seats.

No live accounts, server authorization, background detection, actual location collection or working navigation to fictional businesses are implemented. The privacy controls simulate the intended behavior only. Do not ship the client-authoritative demo state as a production authorization system.

## Build and test

```sh
npm run build
npm test
npm run test:ui
npm run test:touch
npm run test:map-polish
npm run test:search
npm run test:performance
```

Node tests have no dependencies beyond Node. Browser tests require Python, Playwright, Pillow, and Chromium. The supplied scripts find `chromium` on PATH; the retained suites also support `CHROMIUM_PATH`. Tests use Chromium's `set_content` and mobile-emulated viewports; touch tests dispatch browser touch events with Chrome DevTools. Native share and clipboard integration branches in the older feature suite are explicitly mocked.

Final results are in `artifacts/v4.3-release.json`. Expected results: 153 unit checks, 98 retained app-interface checks, 28 touch checks, 10 map-polish checks and 32 new search/brand checks. The Haymarket regression expectation now validates a geographic radius rather than the old exact-area text count, and the dark-palette expectation was updated to midnight blue. No tests were removed to hide failures.

A separate direct `file://` launch check was blocked by this environment's Chromium administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). The automated suites load the standalone HTML with `set_content`; direct file opening is not certified by that test.

Limits: no physical iPhone or Android testing, no mobile Safari certification, no OS virtual-keyboard certification, no production location integration, no live geocoder, and no guaranteed frame rate. Performance output measures JavaScript render work only, not full-device interaction latency.

## Reverting

`rollback/spot-lincoln-v4.2.html` is an exact copy of the supplied v4.2 file. It has the original v4.2 palette/icon and no geographic search. Open it to compare or revert. The previous exact v4.1 snapshot is also retained. SHA-256 checksums are in `rollback/manifest.json`.

## Source structure

- `app.js`: interface, camera, search integration, interaction state.
- `core.js` / `lincoln-data.js`: unchanged demo domain logic and fixture.
- `place-search.js`: local real-area lookup, distance ordering and camera target.
- `map-core.js`, `map-renderer.js`, `map-gestures.js`: grouping, original illustrative map and input handling.
- `styles.css`, `brand.css`, `theme.js`: component styles, new palette and appearance preference.
- `scripts/build.cjs`: inlines all styles/scripts into a single HTML file.
- `tests/`: reproducible unit and interface regressions.

There are no fonts, external tile dependencies, analytics SDKs or background network workers bundled into the app.
