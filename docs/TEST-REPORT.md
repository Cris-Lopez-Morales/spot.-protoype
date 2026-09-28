# Spot + Ask Spot integration validation

Date: 2026-09-28. Node.js 22.16.0, Chromium 144.0.7559.96.

| Executed suite | Passed | Failed | Method |
|---|---:|---:|---|
| Retained Spot map logic | 173 | 0 | Actual map/domain/gesture modules in Node |
| Chat core, context boundary, HTTP server | 66 | 0 | Actual local logic + real local HTTP server; proxy backend is a scripted fixture |
| Embedded UI and message bridge | 31 | 0 | Actual interface source bundled into network-free parent/srcdoc fixture; model, tokenizer/worker, fetch, storage are mocks |
| **Total** | **270** | **0** | Not real-model quality validation |

Checks include lazy panel loading, draft survival, setup consent, dark-mode sync,
map source navigation, wrong-source message rejection, mobile overflow, preserved
friends/privacy state, public-field whitelisting, unknown vs. zero activity,
East Campus geography, unchanged map gesture/cartography code, and all offline
shell URLs returning successfully over HTTP.

Logs: `artifacts/node-tests.txt`, `artifacts/map-tests.txt`,
`artifacts/integration-browser.json`.

## Not verified here

- npm dependency installation and vendor build: registry DNS resolution failed.
- Actual WebLLM/wllama inference, GPU use, CPU speed and model downloads.
- Real-origin iframe navigation: Chromium returned ERR_BLOCKED_BY_ADMINISTRATOR.
- Real PDF parsing, embeddings, reranking and optional Pyodide execution.
- Real device voice/clipboard/native-share flows.
- IndexedDB durability, browser crashes, offline cache recovery and PWA installation.
- Physical phones or mobile Safari.

The screenshots are UI renders from the test harness, with no model loaded. No
scripted answer is presented as real AI generation. Production files never import
the test model or storage fixtures.

## Local follow-through

Run Start Spot, load the small model by explicit consent, ask about East Campus,
inspect citations, follow a Show on map source link, and return to the panel.
Try Stop and closing during generation. Reload and verify chat persistence. Test
with airplane mode only after the required model/library assets are cached.
Run `npm run test:live` with a real configured local model backend to record
actual inference transport output; use `docs/EVALUATION.md` to judge quality.
