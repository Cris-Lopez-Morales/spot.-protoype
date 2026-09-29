# Spot v4.7 validation

Executed in this environment on 2026-09-28.

## Final results

| Suite | Passed | Failed | Method |
|---|---:|---:|---|
| Map logic, removal/provenance, category headers, service-worker unit tests and static HTTP server | 237 | 0 | Node.js 22.16.0 `node --test` |
| Desktop/mobile interface and touch regression | 112 | 0 | Actual standalone HTML in Chromium via Playwright `set_content` |
| **Total** | **349** | **0** | Counts are checks executed on the final version, not carried over from a prior report. |

Every runtime/build JavaScript file also passed `node --check`.

## What was checked

- Active project has no assistant iframe/panel/button, map bridge, model/runtime
  libraries, knowledge/model workers, model download scripts, sandbox or inference proxy.
- Package has zero runtime or build dependencies. The launcher does not install packages.
- Removed chat, model, and sandbox routes return 404 from the actual Node server.
  POST is rejected; there is no model generation path.
- Server tests cover metadata/HEAD, content types, path traversal, Host validation,
  and disabled microphone/geolocation permissions.
- Source fingerprints confirm that the fixture, core data, map renderer, map gesture
  engine, area-search engine, and theme palette/code are unchanged from v4.6.
- All 32 venue cards show their full name and correct category header.
- Category-header renderer ignores untrusted name/theme strings and only inserts
  internally defined SVG/category text. It never uses a truncated venue name.
- Mobile widths 320, 360, 390 and 430 pixels: visible compact header, title fit,
  42-pixel close hit target, expanded history, and no horizontal page overflow.
- Saved places, comparison, directions preview and place-share dialogs still work.
- Separate public-count and selected-friend sharing controls still work; pausing
  all sharing disables both. The demo still has 60 accepted friends.
- Real Chromium touch dispatch checks single-finger panning, two-finger zoom in/out,
  dragging from a label without accidental selection, and tapping a group to zoom in.
- East Campus area search, campus buildings, readable marker counts, expired data,
  and cached cluster reuse are retained.
- Zero external requests and zero uncaught JavaScript errors were observed in the
  tested standalone sessions.
- The old v4.6 archive is preserved separately and its checksum was rechecked.

## Boundaries of this testing

The environment blocks browser navigation to the local HTTP server with
`ERR_BLOCKED_BY_ADMINISTRATOR`. We did not disable or bypass that restriction.
The browser tests therefore load the actual generated HTML using `set_content`.
The map/UI code is unmodified for these tests and no application, localStorage,
network, or model-response stubs are injected.

The Node HTTP suite does make real requests to a local server. Service-worker
install/activate/fetch behavior is unit-tested in a controlled worker harness;
an actual installed PWA and upgrade from an already installed v4.6 service worker
were **not** end-to-end verified.

File-origin persistence, browser restart recovery, physical iPhones/Android phones,
mobile Safari, and native macOS/Windows launcher behavior remain unverified.
No timing figures are presented as physical-device performance benchmarks.

Three obsolete historical packaging assertions about bundled v4.2/v4.3 rollback
files were replaced by current v4.6 fingerprint/removal coverage. Those old archives
are not bundled in this release. Earlier temporary failure logs were discarded
rather than included as the final test result.

The prototype remains fictional and does not establish real crowd accuracy.

## Reproduce

```bash
node scripts/build-standalone.mjs
node --test tests/*.test.mjs tests/spot/*.test.cjs
python tests/browser_test.py
```

Python dependencies for the browser tests are pinned in `tests/requirements.txt`.
Set `CHROMIUM_PATH` to a Chromium executable on your machine when necessary.
Raw final results are in `artifacts/unit-tests.txt`, `artifacts/browser-tests.json`
and `artifacts/browser-output.txt`.
