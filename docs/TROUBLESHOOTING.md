# Troubleshooting and upgrade path

| Symptom | What to check |
|---|---|
| Empty page from a downloaded HTML file | Start `npm start` and use http://localhost:4318. Do not use file://. |
| `/vendor/...` returns 404 | Run `npm install --ignore-scripts`, then `npm run vendor`. It asserts the pinned package structure; retain the exact error if an upstream layout differs. |
| npm version cannot be found | Check network/registry settings and the pinned tagged release. Do not silently swap to an unreviewed major version; installation was not verified in the build environment. |
| WebGPU unsupported | Use CPU / Small, or your own server. Check a current browser and secure context. Do not use flags that disable browser security. |
| WebGPU load failed or out of memory | Close other GPU-heavy tabs/apps, select Small, reduce context. A model size range is only planning guidance. |
| CPU appears stuck | Check download progress, allow initialization time, try a short prompt and turn off unnecessary tool/summary/memory passes. CPU generation is not guaranteed to be fast. |
| Download failed | Check disk space/network and retry Load model. Partial caches depend on the engine; use the mirror script for controlled downloads. Do not clear all site data without exporting conversations. |
| Downloads repeat after reopening | Browser storage may have been evicted, origin/port changed, private browsing is enabled, or a different model variant was selected. Request persistent storage and keep the origin stable. |
| Runtime stop is unresponsive | The app force-unloads the worker after a grace period. Partial text remains. Reload a smaller model. |
| Semantic search says keyword fallback | Confirm embeddings enabled, dependencies prepared, model assets available, and existing documents reindexed. Inspect the visible retrieval trace. |
| Reranker is slow | Turn it off; the default hybrid/diversity ranking still works. |
| PDF has no text | Scanned PDFs require OCR, which this version does not include. Supply a text version. Large documents can exceed the 100-page/20-MB limits. |
| Same-origin site import is rejected | Only this app's origin and allowed content paths are supported; API routes, credentials and external sites are blocked. Upload exported HTML/TXT instead. |
| Own server unavailable | Confirm configured backend/model and loopback port. Pull local Ollama weights, disable cloud and restart. Read `/api/backend-health` for diagnostic JSON. |
| Ollama rejects a cloud alias | Use a locally downloaded model and `OLLAMA_NO_CLOUD=1`. Cloud APIs violate the project constraint even behind localhost. |
| llama.cpp rejects context/schema | Start the pinned server with at least the app context setting and a compatible GGUF/chat template. Review current API error, not a fabricated success message. |
| Dictation unavailable | Browser must support on-device recognition and its local language pack. No remote fallback is permitted. Keep voice off when unavailable. |
| Python sandbox unavailable | The second local port must be running and its HTTPS certificate trusted if using HTTPS. Ensure `public/vendor/pyodide` exists. Check the console/CSP, not a cloud Python service. |
| “Not enough context” | Shorten the current message/custom prompt, use fewer source passages/memories or increase context after memory testing. The app does not silently truncate the newest user message. |
| New version does not appear | Finish current operations, accept the service-worker update notice or reload. Different asset code should use a bumped app/service-worker version. |
| Phone cannot open desktop localhost | Use your own trusted HTTPS origin on the private network with explicit app/sandbox origins. The phone's localhost is not your computer. |

## Upgrade order

1. First run the existing app against real small-model weights and record all ten evaluation results. Fix integration issues before adding features.
2. Verify browser IndexedDB/cache/PWA behavior and physical-device performance. Keep a rollback copy like the Spot workflow.
3. Improve your actual knowledge corpus and retrieval evaluation before simply increasing model size.
4. For better answers, measure 1.5B and then 7B on your own hardware. Larger models raise bandwidth, latency and memory requirements.
5. Add exact tokenizer support for a new own-server model family before calling its counts exact. Keep safety margins.
6. For larger knowledge bases, add an indexed ANN strategy rather than scanning millions of passages. The current 6,000-chunk cap is intentional.
7. For integration into Spot, first define read-only tools for real venue records with consent/authorization. The current guide does not give the assistant map access. Do not let the model claim it knows live crowds.
8. For public/multiuser hosting, design authentication, user-isolated documents, quotas, server sandboxing, retention and security review as a separate project. The local development proxy is not a public AI service.

## Current-version rollback

This is a new folder/project. It does not modify `spot-lincoln-v4.4.html` or earlier Spot versions. Keep the source ZIP and your generated package/model locks before any dependency or UI updates.
