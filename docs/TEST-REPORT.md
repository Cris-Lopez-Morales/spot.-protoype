# Spot + Ask Spot v4.6 validation

Date: 2026-09-28. Node.js 22.16.0. Chromium 144.0.7559.96.

| Executed suite | Passed | Failed | Method |
|---|---:|---:|---|
| Map logic, fixture, clustering and gestures | 193 | 0 | Actual domain/geometry/gesture modules in Node |
| Chat core, public context and HTTP server | 68 | 0 | Actual local logic + local HTTP server; proxy inference is a scripted fixture |
| Embedded assistant UI and bridge | 31 | 0 | Actual interface bundled into offline parent/srcdoc harness; model/storage/network fixtures |
| Updated map layout and mobile gestures | 44 | 0 | Actual map DOM/canvas; Chromium touch input and mobile-sized layouts in offline harness |
| **Total** | **336** | **0** | Not real-model or physical-device validation |

Map coverage includes explicit venue/group labels, 32 unique venues, 24 cafés plus
8 bars/clubs, 610 attributed sample accounts, at least 600 m venue-pin spacing,
expired-data labels, no double counts, 52 px touch targets, fitting text, comparison
and privacy regressions, source-data consistency, and campus footprint rendering.
Mobile checks cover widths 320, 360, 390 and 430 px, selected-card overlap at six
scales, trusted CDP one-finger pan, two-finger pinch, drag vs tap, group zoom,
individual details, nonblocking search, and cluster reuse during repeated pans.

The original gesture engine is byte-identical. The original full integrated ZIP is
preserved with a checksum. Fixture-specific prior assertions were updated to match
the intentional new dataset, while unrelated regressions are retained. An iframe
navigation assertion now waits for the asynchronous close message before checking
visibility rather than racing that message.

Logs:
- artifacts/ai-tests.txt
- artifacts/map-tests.txt
- artifacts/integration-browser.json
- artifacts/map-v46-browser.json

The standalone map-only HTML also has a separate smoke report in
artifacts/standalone-preview-smoke.json. It contains actual map code and an honest
setup explanation instead of a mocked AI chatbot. This supplemental smoke check
is not included in the 336-test regression total.

## Test boundary

Chromium navigation to the local server returned ERR_BLOCKED_BY_ADMINISTRATOR.
The existing offline inline/srcdoc harness was used instead. Only the harness
substitutes wildcard postMessage targets for an opaque test origin; production
code validates the exact origin and source window. Production never imports the
mocked model or storage implementation. The standalone preview uses no test doubles.

Native Node HTTP checks exercise the local server separately. Screenshots show
actual interface/canvas output; no scripted answer is presented as real inference.

## Not verified in this map update

- Dependency installation, vendor build, model downloads or live model generation.
- Physical iPhones/Android phones, mobile Safari, actual mobile speed/battery.
- Real-origin iframe navigation and persistent IndexedDB behavior across upgrades.
- Real GPU/WASM engines, PDF parsing, embeddings/reranking, Pyodide, voice APIs.
- Full PWA installation and offline-cache/crash recovery on a real browser origin.

No new AI runtime version was introduced. The map and public context were updated.
Use the unchanged Start Spot launcher, explicitly load a model, ask about East
Campus, inspect the cited count, and follow Show on map. Use tests/live-server.mjs
with an actual local model backend for inference transport testing; answer quality
still requires the human rubric in docs/EVALUATION.md.
