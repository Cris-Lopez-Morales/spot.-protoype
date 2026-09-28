# Spot + Ask Spot · v4.6 map update

A complete combined project: the existing Lincoln-region Spot map with the
previous local-AI chatbot embedded in an on-demand **Ask Spot** panel.

## New in v4.6

Readable, two-line map labels show a place name, category icon and **app users**,
rather than an unexplained number. Groups identify how many spots they combine.
The fictional fixture now uses **32 venues: 24 cafés and 8 bars/clubs** (20 in
Lincoln, 12 in surrounding towns). Pins are at least 600 meters apart in the
authored geography; decorative buildings have more breathing room too. This is
a deliberately sparse design sample, not an inventory of real Lincoln businesses.

The fixture retains 5,000 accounts and 60 friends; 610 accounts initially contribute
to places. Friends, map cards and Ask Spot all use the same new inventory.
The one-finger/pinch gesture module is unchanged.

For a double-click **map-only** review, open `preview/spot-v4.6-map-preview.html`.
It has no model and its Ask button explains how to launch the full project.
To use the actual integrated chatbot, follow the local-server steps below.
An exact copy of the incoming project is at `rollback/spot-with-ai-v4.5.zip`.
See `docs/MAP-UPDATE-v4.6.md` for details.

## Quick start

```sh
npm run launch
```

Requires Node.js 22.16.0+. The Mac/Windows **Start Spot** launchers run the same
command. The first run prepares pinned libraries. Then open the map at
`http://localhost:4318`, click **Ask Spot**, choose a model, and approve its download.
No API keys or accounts. No hosted AI service. Initial asset downloads require
internet unless you prepare local mirrors. Model files are not included in the ZIP.

Manual equivalent:

```sh
npm install --ignore-scripts
npm run vendor
npm start
```

The first successful installation creates `package-lock.json`; retain it and use
`npm ci --ignore-scripts` for repeat installations. Direct dependencies are pinned,
but the transitive tree is not lockfile-verified until installation completes.

## Integration architecture

```text
http://localhost:4318/
  Spot map + original Explore/Friends/Privacy UI
    │
    └─ Ask Spot button → lazy same-origin /assistant.html frame
         ├─ theme synchronization + close/pause + draft preservation
         ├─ validated public demo snapshot → local retrieval → cited excerpts
         ├─ source-card button → allowlisted place/area → existing map navigation
         ├─ chats / knowledge / approved memories → dedicated IndexedDB database
         ├─ model Web Worker → WebLLM GPU or wllama CPU
         └─ optional own-server proxy → loopback Ollama or llama.cpp
```

The iframe isolates UI styles and lifecycle, **not** a security boundary against
malicious same-origin JavaScript. Model output is not executable code. The bounded
tool loop cannot query arbitrary parent-page state. Optional Python runs on the
existing separate sandbox origin, with the limitations documented in SECURITY.md.

### What changed

- Spot remains the root page; the local chatbot lives in a panel opened from the
  top bar. There is no fourth main navigation tab or separate app to launch.
- The panel inherits Spot's indigo/coral light mode and midnight/lavender dark mode.
- The assistant starts with a Spot-specific persona and built-in prototype guide.
- Read-only retrieval uses current **public demo** place data, without names or
  locations of friends, private settings, saved lists, or device GPS.
- Area queries use the existing nearby-venue lists. “East Campus” means the area,
  not only venue names containing those words.
- Cited source cards can open an allowlisted place or area when clicked.
- Context is refreshed at the start of each answer. Missing activity remains null
  and is described as unknown. Existing answer text is a historical snapshot;
  it is not silently rewritten as the map changes.
- Closing pauses active generation while keeping chats and drafts. Reopening
  reuses the panel/runtime within the page rather than reloading it every time.
- The original one-finger/pinch module and public privacy controls are retained.
  v4.6 updates the fixtures, spacing, marker labels and background-building density.
  Rollback copies are provided outside public/.

### Existing chatbot features retained

Streaming; Stop; regenerate; edit/resend; copying; system prompt/personas and
sampling settings; sliding context; bounded summaries; optional approved memory;
local document/PDF text ingestion; BM25 plus optional embeddings/reranking;
calculator/date/unit/local-search tools; explicitly approved Wikipedia/Python;
multiple chats; JSON export/import; sanitized Markdown; optional on-device speech;
workers; local model caches; PWA shell; local-only inference backend proxy.

These are implemented source paths, not a claim that every installed vendor
runtime has been exercised here. See the validation section below.

## Layout

- `public/index.html`: Spot root, launcher, and assistant panel shell.
- `public/spot/`: existing map source plus bridge/shell additions.
- `public/assistant.html`: embedded chat interface.
- `public/src/spot-context.js`: whitelist validation and local place retrieval.
- `public/src/app.js`: chatbot integration and existing chat features.
- `public/workers/`: model inference and knowledge processing.
- `server.mjs`: local host, same-origin embed policy, inference proxy, sandbox host.
- `scripts/start.mjs`: beginner launcher and local vendor preparation.
- `tests/`: local logic, server, integration fixtures, and real-runtime smoke tools.
- `preview/`: self-contained map-only HTML for reviewing this visual update.
- `rollback/`: original integrated project ZIP and earlier HTML files; not served by the app.

## Versions and runtime documentation

This integration preserves the chatbot's existing exact runtime pins rather than
changing AI engines: WebLLM 0.2.85, wllama/compat 3.6.1, Transformers.js 4.3.0,
DOMPurify 3.4.16, marked 18.0.14, highlight.js 11.12.0, PDF.js 6.3.289,
Pyodide 314.0.7, esbuild 0.27.2. `package.json` includes the dependency overrides.

Version references checked September 28, 2026:
- https://raw.githubusercontent.com/mlc-ai/web-llm/v0.2.85/package.json
- https://webllm.mlc.ai/docs/user/basic_usage.html
- https://raw.githubusercontent.com/ngxson/wllama/3.6.1/package.json
- https://raw.githubusercontent.com/huggingface/transformers.js/4.3.0/package.json

The original engine architecture, exact vendor-preparation process, model options,
license notes, and local model mirror instructions are retained in
`docs/LOCAL-ENGINE-REFERENCE.md`. Its earlier standalone-app description is
historical; the integrated layout above is authoritative.

## Own-machine Ollama (optional)

The default uses your browser. To use your own local Ollama instead, install it
separately, disable its cloud mode, and download a local model. No third-party
inference service is needed.

macOS/Linux, in a separate terminal:

```sh
OLLAMA_NO_CLOUD=1 ollama serve
```

Download weights and start Spot with a local backend:

```sh
ollama pull qwen2.5:1.5b
LOCAL_BACKEND=ollama LOCAL_MODEL=qwen2.5:1.5b npm start
```

Windows PowerShell equivalents:

```powershell
$env:OLLAMA_NO_CLOUD="1"
ollama serve
```

In another PowerShell window, in the project folder:

```powershell
ollama pull qwen2.5:1.5b
$env:LOCAL_BACKEND="ollama"
$env:LOCAL_MODEL="qwen2.5:1.5b"
npm start
```

In **Ask Spot → Settings**, choose **Own server**, then approve connection.
Stop an existing Spot server before starting it again with different environment
variables. Loopback does not itself prove a model is local: the proxy also rejects
Ollama metadata identifying a cloud-backed model. Model downloads and a running
server remain necessary. For llama.cpp and HTTPS phone testing, see
`docs/LOCAL-ENGINE-REFERENCE.md` and `docs/TROUBLESHOOTING.md`.

## Validation

```sh
npm test                 # 68 logic/context/HTTP-server checks
npm run test:map         # 193 map logic checks
npm run test:integration # 31 no-network UI/bridge checks; Python Playwright needed
npm run test:map-ui      # 44 map layout, label and touch checks
npm run build:preview    # Rebuild standalone map-only preview
```

Browser fixtures use Playwright 1.57.0 in this environment and Chromium 144.
Run with `CHROMIUM_PATH` set to your Chromium executable. No browser security
settings are disabled by the harness. It renders an opaque-origin srcdoc fixture
because browser navigation is blocked here. Only the test harness uses wildcard
postMessage targets to address that opaque origin; production validates and uses
its exact same origin and source window.

**336 passed, 0 failed.** No real-model inference, installed-vendor execution,
physical-phone run, durable IndexedDB recovery, or full PWA offline test is claimed.
The original project reported blocked dependency/model downloads; those downloads
were not retried for this map-only update. Browser navigation was blocked by
administrator policy, so UI tests use the explicit offline fixture. A real local HTTP server
was separately tested using Node fetch, including CSP/COOP/COEP, frame allowances,
all cached shell paths, byte ranges, and the loopback proxy with a test backend.

Real inference transport smoke after configuring your own backend:

```sh
npm run test:live
```

This rejects scripted fixture backends and records actual timing/output. It does
not substitute for answer-quality evaluation. Use `docs/EVALUATION.md` as well.

## Limits and safety

- All places, crowd data and friend records are demo fixtures. No actual location
  collection, verified occupancy, real user authentication or real venue discovery.
- A tiny local model may hallucinate names/counts or mishandle a question despite
  grounding and citations. Inspect sources. This is not a guarantee of correctness.
- Initial model downloads can be large; CPU generation and multiple agent passes
  may be slow. Browser/OS memory limits can terminate a tab.
- Closing a panel stops current generation, but cached model memory may remain
  allocated until you unload it or close the page.
- The local server is loopback by default. It is not an authenticated public or
  multiuser service. Do not expose it directly to the internet.
- Public context is intentionally available to the assistant without an extra
  prompt. Private friend/permission data is not included. Optional document uploads
  and user chat messages are separate and remain subject to selected backend rules.
- Speech is opt-in and on-device only when available; browser/OS implementations
  themselves may not be open source. Keep it off for a strictly auditable OSS stack.
- Rollback preserves source files, not browser profiles. Standalone file:// and
  localhost are different storage origins, so old saved places/chats do not
  automatically migrate between them.
