# Local — a private AI workspace

**Version 1.0.0 · plain HTML/CSS/JavaScript PWA · MIT application code**

A separate chatbot that can run alongside Spot, not a replacement for the Spot prototype. No accounts, no paid inference, no API keys, and no third-party AI inference endpoints. Real inference runs in browser workers or through the optional proxy to a loopback model server on your own machine.

**Read the validation limits:** the supplied implementation has not been run against downloaded model weights in this build environment. Network restrictions prevented npm/model downloads and managed Chromium policy prevented URL navigation. The automated checks separate real logic/server tests from explicitly mocked offline UI tests. This is an engineering handoff for local validation, not a claim of production readiness or the “most advanced” model quality.

## 1. Architecture choice

| Approach | Role in this build | Reason and trade-off |
|---|---|---|
| WebLLM / WebGPU | Preferred browser text generation when a GPU adapter is available | OpenAI-like streaming API, compiled MLC models, JSON-schema output. Requires compatible graphics resources and substantial downloads. |
| Transformers.js | Local tokenizer, MiniLM embeddings, optional cross-encoder reranker | Reuses the same inference library for knowledge work. WASM is the default for these smaller tasks to avoid competing with the generator for GPU memory. Not a second text-generation stack here. |
| wllama / WASM CPU | Browser fallback; small/balanced GGUF models | Works without a GPU on supported browsers. Slower and still needs enough RAM. Local compatibility assets are provided for its supported Safari/Firefox path. |
| Ollama | Optional own-server alternative | Straightforward local model management and NDJSON streaming. Cloud features must be disabled; cloud-backed model metadata is rejected. |
| llama.cpp server | Optional own-server alternative | Direct control of GGUF, context and deployment. Requires model/binary setup and an OpenAI-compatible streaming server. |
| Hybrid | Selected policy | Automatic GPU/CPU selection, conservative sizing when device memory is unknown, and an own-server fallback only after the user enables it. No silent cloud fallback. |

A larger model is not automatically selected simply because the user picked “Automatic.” Mobile/coarse-pointer or unknown-memory devices start small. A nonmobile GPU device reporting at least 8 GB device memory starts at 1.5B. These signals are heuristics, not a measurement of free RAM/VRAM. A user can override the choice. Initialization failures offer the smaller CPU path; server fallback remains opt-in.

### Text architecture diagram

```text
Browser / installed PWA
  UI: chats, editor, settings, source cards, permission dialogs
    |
    +-- IndexedDB: chats / source chunks / vectors / reviewed memories
    +-- crash checkpoint: localStorage (same-origin, not encrypted)
    |
    +-- Agent: prompt budget -> retrieval -> <=3 validated tool steps -> answer
    |      +-- local calculator / units / device time / local site search
    |      +-- Wikipedia: explicit setting + per-query approval -> own proxy
    |      +-- Python: explicit setting + approval -> isolated second origin
    |
    +-- Knowledge worker: chunking / token counts / BM25 / vector search
    |      Transformers.js: MiniLM embeddings + optional cross-encoder
    |
    +-- Model worker
    |      +-- WebLLM (WebGPU) --------> local browser inference
    |      +-- wllama (WASM/CPU) ------> local browser inference
    |      +-- same-origin proxy -----> own loopback Ollama / llama.cpp
    |
    +-- Service worker: app shell + visited vendor assets
           Engine caches: downloaded weights / tokenizer / ONNX assets

Optional own Node server: localhost:4318
  Static assets, CSP, cross-origin isolation headers, narrow approved routes
  Model proxy is loopback-only and fixes the model server-side
Optional Python asset origin: localhost:4319
  New Pyodide worker per execution; no app APIs, chats or storage access
```

### Model resource plan

These are **rough planning ranges**, not downloads or benchmarks measured in this environment. Compiled variants, auxiliary files, context, drivers and shared memory change actual requirements. Download progress uses real events when the runtime is installed.

| Model | Quantization used | Approx. model download | Free-memory planning allowance | Speed expectation / best use |
|---|---|---:|---:|---|
| Qwen2.5 0.5B Instruct | MLC q4f16_1; q4f32_1 without shader-f16; CPU GGUF Q4_K_M | 0.4–0.6 GB | 1–2 GB | Lowest compute cost of these options; brief answers, constrained tasks, mobile experimentation. Weakest answer quality. |
| Qwen2.5 1.5B Instruct | Same MLC variants or GGUF Q4_K_M | 1–1.3 GB | 2–3 GB | Default capable-desktop compromise. CPU may feel slow, especially with planner/summary passes. |
| Qwen2.5 7B Instruct | MLC 4-bit or own-server GGUF | 4.5–5 GB | 6–8+ GB | Desktop GPU/private-server option for more capable answers. Not auto-selected. Browser CPU path intentionally rejects this size. |

WebLLM's prebuilt model config reports VRAM estimates around 945/1,060 MB for 0.5B, 1,630/1,889 MB for 1.5B, and 5,107/5,900 MB for 7B (f16/f32 variants). Those are engine metadata, not a guarantee about peak memory on your device. Extra tokenizer, embeddings, reranker and optional Python assets also use download/storage/RAM.

**No tokens-per-second figures are fabricated.** Measure your device with the evaluation checklist. Quantization decreases footprint; it does not make small models reliable general-purpose agents.

## 2. Exact dependency and version assumptions

Version research date: **2026-09-28**. APIs were checked against the tagged packages and current official documentation listed below. “Latest” is not a floating dependency in this project.

| Dependency | Exact pin |
|---|---|
| @mlc-ai/web-llm | 0.2.85 |
| @wllama/wllama and @wllama/wllama-compat | 3.6.1 each |
| @huggingface/transformers | 4.3.0 |
| DOMPurify | 3.4.16 |
| marked | 18.0.14 |
| highlight.js | 11.12.0 |
| pdfjs-dist | 6.3.289 |
| pyodide | 314.0.7 |
| esbuild | 0.27.2 |
| ONNX runtime override | 1.31.0-dev.20260914-8d85527a0 |
| Other overrides | loglevel 1.9.1; @huggingface/jinja 0.5.10; @huggingface/tokenizers 0.2.0 |

The ONNX prerelease pin follows the dependency used by the selected Transformers.js package; it is not mislabeled as a stable runtime. The optional server instructions assume **Ollama 0.34.4** or **llama.cpp b11225**, a dated upstream daily/pre-release build. These server binaries are not bundled or tested here. Pin the corresponding binaries and retain the model digest in your own deployment records.

Node baseline tested for local logic/server work: **22.16.0**. Actual npm installation was blocked; there is deliberately no fabricated `package-lock.json`. Direct packages/overrides are exact, but full transitive reproducibility requires the first successful `npm install`, reviewing its generated lockfile, then committing it and using `npm ci --ignore-scripts` thereafter.

The optional mirroring script resolves public model repository commits once, records them and asset SHA-256 hashes in `models.lock.json`, and rejects later unexpected changes. That lock is generated from downloaded bytes, not invented. Normal first-time browser model downloads otherwise use the upstream library's configured revision; use mirrors for an immutable deployment.

## 3. Beginner setup

Install Node.js 22.16.0 or newer from https://nodejs.org/. Extract the project and open a terminal **inside `local-chat`**.

```sh
npm install --ignore-scripts
npm run vendor
npm start
```

Open **http://localhost:4318**. Keep the terminal running. On the first page, choose a model, review the estimate, approve and wait. Nothing downloads before you request a model or enable a model-dependent feature. Start with **CPU / Small** when GPU capability is uncertain.

`npm run vendor` bundles/copies local runtime scripts and WASM files into `public/vendor`, checks package versions, and writes a hash manifest. Model files are separate. Do not move `index.html` out of the project or use `file://`.

If your browser reports an unsupported GPU or an out-of-memory error, choose Small. A worker cannot create missing memory or prevent the browser from terminating an overloaded tab.

### Optional: Ollama on the same machine

Install the pinned release from https://github.com/ollama/ollama/releases/tag/v0.34.4. Quit an already-running Ollama tray/service instance before starting one with the environment variable below; otherwise your new setting may not affect the old process.

Terminal A, macOS/Linux:

```sh
OLLAMA_NO_CLOUD=1 ollama serve
```

Terminal B:

```sh
ollama pull qwen2.5:1.5b
LOCAL_BACKEND=ollama LOCAL_MODEL=qwen2.5:1.5b npm start
```

Windows PowerShell, Terminal A:

```powershell
$env:OLLAMA_NO_CLOUD="1"
ollama serve
```

Windows PowerShell, Terminal B:

```powershell
ollama pull qwen2.5:1.5b
$env:LOCAL_BACKEND="ollama"
$env:LOCAL_MODEL="qwen2.5:1.5b"
npm start
```

Select **Own server** in the app and load it. The browser sends context to your app server, and its proxy sends it only to a loopback backend. The proxy checks `/api/show` metadata before every Ollama generation and rejects `remote_host`, `remote_model`, unrecognized local model metadata and obvious cloud aliases. The process itself should still use `OLLAMA_NO_CLOUD=1`. A malicious/replaced server or DNS/browser compromise is outside this protection.

Ollama model tags can change. Record the model digest from your local Ollama model listing; the app does not claim to pin mutable Ollama model tags automatically.

### Optional: llama.cpp on the same machine

Download/build the chosen pinned server release from https://github.com/ggml-org/llama.cpp/releases/tag/b11225. This is a dated upstream build, not a claim of release stability. Mirror the small GGUF first:

```sh
npm run models -- cpu-small
```

Then, in a separate terminal:

```sh
llama-server -m ./public/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF/qwen2.5-0.5b-instruct-q4_k_m.gguf -c 4096 --parallel 1 --host 127.0.0.1 --port 8080
```

Start the app:

```sh
LOCAL_BACKEND=llamacpp LOCAL_MODEL=local-gguf npm start
```

Choose Own server. For Windows set the two environment variables as in the Ollama example. Model size/context settings in the browser do not reload a different file in an already-running llama.cpp process; restart that server for a different file or context.

### Test on a phone

Start with desktop localhost. A phone's `localhost` is the phone, not your computer. LAN HTTP generally does not provide the secure context needed for WebGPU, PWA installation and several browser APIs. Do not disable browser security.

For an actual phone, serve from your own **trusted HTTPS** origin. This server supports `TLS_CERT`, `TLS_KEY`, `HOST`, `PUBLIC_ORIGIN`, `SANDBOX_ORIGIN`, `PORT`, and `SANDBOX_PORT`. Use a certificate your device trusts and a private network. Set both app and sandbox origins explicitly. Do not expose the unauthenticated development server publicly.

## 4. Features and boundaries

### Conversations and generation

Streaming token events cross a worker boundary; Markdown render updates are throttled. Stop interrupts the runtime and preserves partial text, with forced worker unload after an unresponsive stop. Regenerate replaces the last assistant branch; edit-and-resend discards downstream messages after confirmation. Copy works on answers and highlighted code. A plain-text safe renderer is used if vendor rendering fails.

Multiple chats, full-text chat search, rename, delete, capped JSON import/export, custom system prompt, four general personas plus Spot, temperature/top-p/context/output settings, keyboard shortcuts, dialogs, responsive light/dark/system appearance, visible focus, ARIA/live status, and local-only voice controls are wired up.

Generated markdown goes through DOMPurify. Remote images, SVG and unsafe schemes are not rendered. Source references open inspectable text cards. External links require confirmation.

### Context and memory

A sliding context keeps the newest user message intact or rejects a too-large request with a useful error. Qwen tokenizer chat templates are used when available with a 32-token margin; other own-server families and tokenizer failures use a labeled conservative byte-based estimate, not a fake exact count.

Older excluded messages can be summarized in a separate bounded pass. Summaries are lossy and inspectable; the original conversation remains saved. A summary failure falls back to the sliding window. Extremely long older transcripts may themselves be truncated during summarization.

Long-term memory is disabled initially. When enabled, a model proposes only name/preference/project facts grounded in exact quotes from the current user message. No suggestion is saved until the user approves it. Maximum 20 stored facts; at most 12 supplied per turn. These small-model classifications are not a sensitive-data detector guarantee; review candidates before saving.

Forget deletes selected facts, clears summaries/candidates and resets the browser runtime. The original chat text and server-side model caches are separate. Delete the original conversation when needed and stop the own-server model to clear its active cache. IndexedDB and localStorage are not encrypted; this is not secure erasure.

### Knowledge retrieval

Import TXT, Markdown, HTML, PDFs with extractable text, pasted notes, or same-origin pages. PDFs are parsed locally in PDF.js with page citations; scanned images have no OCR in this build. File limit 20 MB, text limit 600,000 characters, PDF limit 100 pages, document limit 60, chunk limit 6,000.

Default chunking is roughly 800 characters with 120-character overlap, respecting nearby boundaries. This is **character-based chunking**, distinct from model context token counting. BM25 works without an embedding download. Enabling semantic search downloads q8 `Xenova/all-MiniLM-L6-v2` locally, stores normalized vectors in IndexedDB and combines keyword/vector ranks using reciprocal-rank fusion plus diversity selection. Embeddings operate in a worker. Enable and run **Reindex knowledge** for existing files.

Optional q8 `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder reranks the shortlist. Failed embeddings/reranking fall back with a visible trace. At this scale vectors are scanned in memory in the worker; this is not an approximate-nearest-neighbor service for millions of chunks.

Documents/tool outputs/memories/summaries are labeled untrusted data. Tool approval, schemas, route constraints, and sanitized rendering are enforced outside the model. These mitigate injection and exfiltration but cannot prove the model will never repeat malicious text or miscite a source. A citation is an inspectable reference, not a verification score.

### Tools

The model requests one strict `{tool,input}` object. Schema-constrained generation is passed to supported runtimes, and the parsed object is independently validated. Unsupported or malformed calls are not executed. At most three tool steps, no repeated identical calls, then a final answer. This is a bounded tool-use loop, not a promise of general autonomous planning or exposure of private chain-of-thought.

Local tools: calculator (bounded parser, no JavaScript eval), date/time with IANA timezone, unit conversion, and search of locally ingested site content. No generic URL-fetch or shell tool exists.

Wikipedia is not an AI API, but **is an external network request**. It stays off until enabled, requires an explicit user request mentioning Wikipedia, and shows the exact proposed query for approval before a POST to the fixed Wikipedia proxy. Keep it off for strict offline operation.

Python is optional and off. It requires an explicit execute/run-Python user request and per-code approval. A separate-origin iframe creates a fresh Pyodide worker with no app endpoints or chat access. The worker disables general network APIs after loading local runtime assets, caps output, times out initialization/execution, and is terminated afterward. It has no OS-level memory quota and is not a hardened container for hostile code. Do not use it for adversarial multitenant execution.

Web Speech recognition is enabled only when the browser supports `processLocally`, local availability checks and approved language-pack installation. It never silently falls back to remote recognition. TTS selects a `localService` voice or reports unavailability. Platform speech components are not bundled and may not themselves be open source; leave voice off for a strictly auditable open-source-only stack.

### Offline and caching

The service worker stores the app shell and visited vendor resources. Inference libraries maintain their own model caches. A PWA icon alone does not make an un-downloaded model work offline. Browser caches may be evicted; a persistent-storage request may be refused. Own-server mode requires the local server and its weights; Wikipedia needs internet; new models/language packs need an initial download.

For models served only from your own machine/origin:

```sh
npm run models -- cpu-small tokenizers embeddings
```

Optional other targets:

```sh
npm run models -- cpu-balanced
npm run models -- gpu-small
npm run models -- gpu-balanced
npm run models -- gpu-large
npm run models -- reranker
```

GPU targets mirror both f16 and f32 variants and compiled libraries, so disk use exceeds the single-model estimate. The command records immutable repository revisions and SHA-256 hashes. Its downloads retry initial HTTP requests up to three times; interrupted body downloads clean their `.part` file and can be retried by running the command again. Keep `models.lock.json` with `public/models`. Model mirroring itself was not executed in this environment.

## 5. Testing

```sh
npm test
```

The Node tests need no npm inference dependencies. They verify core algorithms and a real local HTTP server with an explicitly fake model backend. They do not verify model quality.

Optional UI tests need Python, Playwright and a Chromium executable (not required to run the app):

```sh
python -m pip install playwright
python tests/browser_test.py --offline
```

Set `CHROMIUM_PATH` to your installed browser executable when it is not `/usr/bin/chromium`. Offline harness mode mocks model/tokenizer/database/network interfaces and renders the real UI modules without URL navigation. In a normal unrestricted environment, after npm setup and with the server running:

```sh
python tests/browser_test.py
```

For an installed real local model server:

```sh
npm run test:live
```

That last command writes timing and actual generated text to `artifacts/live-server-result.json`, refuses the scripted server test flag, and does **not** automatically grade answer quality. Use the 10-question evaluation in `docs/EVALUATION.md` for agent/RAG/memory behavior.

Current reported results: 41 Node tests + 27 offline UI checks passed; real inference and physical devices not tested. See `docs/TEST-REPORT.md`.

## 6. Primary references used

- WebLLM docs: https://webllm.mlc.ai/docs/user/basic_usage.html
- WebLLM tagged package/config: https://github.com/mlc-ai/web-llm/tree/v0.2.85
- wllama pinned API: https://github.com/ngxson/wllama/blob/3.6.1/src/wllama.ts
- wllama compatibility assets: https://github.com/ngxson/wllama/tree/3.6.1
- Transformers.js pinned source: https://github.com/huggingface/transformers.js/tree/4.3.0
- Qwen model cards: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF and https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF and https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF
- MiniLM embedding model: https://huggingface.co/Xenova/all-MiniLM-L6-v2
- MiniLM reranker: https://huggingface.co/Xenova/ms-marco-MiniLM-L-6-v2
- Ollama local-only configuration: https://docs.ollama.com/faq
- Ollama chat API: https://docs.ollama.com/api/chat
- llama.cpp server: https://github.com/ggml-org/llama.cpp/tree/b11225/tools/server
- DOMPurify: https://github.com/cure53/DOMPurify
- PDF.js: https://github.com/mozilla/pdf.js
- Pyodide: https://pyodide.org/en/stable/
- On-device speech: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API

## 7. File tree

The complete tree of shipped files is recorded in `FILE-TREE.txt`. All application source files are included. `node_modules`, `public/vendor`, and multi-GB weights are generated/downloaded by the provided setup commands, not incomplete source placeholders. Spot's previous files are unchanged.

```text
local-chat/
├── artifacts/
│   ├── browser-tests.json
│   ├── local-desktop-light.png
│   ├── local-mobile-dark.png
│   ├── local-mobile-settings.png
│   ├── node-tests.txt
│   └── ui-tests.txt
├── docs/
│   ├── EVALUATION.md
│   ├── SECURITY.md
│   ├── TEST-REPORT.md
│   └── TROUBLESHOOTING.md
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── mark.svg
│   ├── knowledge/
│   │   └── spot-guide.md
│   ├── models/
│   │   ├── README.md
│   │   └── manifest.json
│   ├── sandbox/
│   │   ├── frame.html
│   │   ├── frame.js
│   │   └── python.worker.js
│   ├── src/
│   │   ├── agent.js
│   │   ├── app.js
│   │   ├── client.js
│   │   ├── config.js
│   │   ├── core.js
│   │   ├── db.js
│   │   ├── ingest.js
│   │   ├── math.js
│   │   ├── prompts.js
│   │   ├── python.js
│   │   ├── render.js
│   │   ├── stream.js
│   │   ├── theme-boot.js
│   │   ├── tools.js
│   │   └── voice.js
│   ├── workers/
│   │   ├── knowledge.worker.js
│   │   └── model.worker.js
│   ├── app.css
│   ├── index.html
│   ├── manifest.webmanifest
│   └── sw.js
├── scripts/
│   ├── mirror-models.mjs
│   └── prepare-vendor.mjs
├── tests/
│   ├── browser_test.py
│   ├── core.test.mjs
│   ├── live-server.mjs
│   ├── offline_harness.py
│   └── server.test.mjs
├── .gitignore
├── FILE-TREE.txt
├── LICENSE
├── README.md
├── START-HERE.md
├── package.json
└── server.mjs
```
