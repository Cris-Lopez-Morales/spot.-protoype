# Integration-specific boundary
The parent and child validate exact origin and source window. Only whitelisted public demo venue fields and manually browsed area/selection are sent. The iframe is same-origin CSS/lifecycle isolation, not protection against malicious same-origin JavaScript. Source navigation uses known place/area IDs; it cannot run arbitrary URLs or change privacy. This is a prototype, not production authorization.

# Privacy and security model

This is a single-user/local-first prototype, not an audited multiuser hosting platform.

## Where information goes

| Data or operation | Destination |
|---|---|
| Chats, source text, embeddings, approved memories | Same-origin IndexedDB in this browser; no application database server. |
| Partial answer checkpoint | Same-origin localStorage, cleared after a completed turn or recovery. |
| Browser-mode inference prompts | Browser model worker. The application does not send these to HF/MLC/other inference APIs. |
| Own-server prompts | Your app's fixed proxy, then a loopback Ollama/llama.cpp on the same server. Includes retrieved excerpts and approved memory relevant to that turn. |
| Initial model/library/tokenizer assets | Public package/model hosts at installation/load time, or your own mirrors. Those hosts see asset requests/network metadata, not inference prompts. |
| Wikipedia | Only the explicitly approved public query to Wikipedia through your own server; external feature off by default. |
| Voice | Browser on-device recognition/local-service TTS only; unsupported platforms fail closed. A local language pack may require installation. |
| Python | Code approved by the user, passed to a fresh separate-origin worker with no chat data supplied. |

No analytics, tracking SDK, account system or paid API integration is added.

## Controls independent of model obedience

Strict tool schema, allowlisted names, tool-step budget, duplicate-call prevention, maximum sizes, user approval for Wikipedia/Python, fixed proxy destinations, POST-only external lookup, validated source URLs, loopback backend enforcement, Ollama cloud metadata rejection, local runtime asset serving, DOMPurify sanitization, no remote Markdown images, CSP, origin/Host checks, and iframe separation are implemented in ordinary code.

The system prompt labels retrieved text and summaries as data, not instructions. This is necessary but not sufficient. Small models can still follow malicious prose, misread a source, fabricate a reference or suggest an inappropriate query. The authorization layer must remain the boundary; never let model text toggle settings or approve its own action.

## Own-server caution

Start Ollama with cloud disabled, not just on localhost. The server checks model metadata before forwarding a chat and rejects cloud aliases. It cannot defend against a deliberately malicious replacement process lying about metadata. llama.cpp must be an actual locally run binary using local weights, not a proxy that you rewrote to call a hosted API.

The Node application binds loopback by default and has no login. Do not make it internet-accessible for strangers. A public website deployment needs authentication, per-user authorization, abuse/compute limits, audited HTTPS/proxy headers, sandbox isolation stronger than a browser iframe, and explicit data retention. Those are not silently claimed to exist here.

## Forget does not mean secure erasure

Forgetting a saved memory removes that record from future memory prompts, clears saved summaries and resets browser inference. It does not delete the original user message, already generated answers, exported JSON, browser backups, disk remnants, operating-system swap or an own-server model cache. Delete the relevant conversations/exports and stop the local model server when needed. Browser storage is not encrypted by this app. Use full-disk encryption/OS access controls for shared machines, and do not put secrets into untrusted document collections.

## Python boundaries

A separate port is a different origin. The Python asset server exposes neither app source nor application APIs. Origin+nonce checks restrict message exchange. Each execution has a fresh worker, an initialization deadline, execution timeout and output cap. After local runtime initialization the worker removes ordinary JS network APIs, and the origin's CSP is self-only.

This is defense in depth, not a hardened virtual machine. It has no memory quota, browser vulnerabilities remain relevant, and a large allocation can still crash the tab/browser. Do not run hostile code for untrusted remote users. Leave Python off unless specifically needed.

## Open-source interpretation

The supplied application code is MIT; selected dependencies/models retain their own open-source licenses. Vendor setup copies direct dependency license notices. Review all transitive notices during an actual install and preserve model licenses when mirroring/distributing weights. The install/browser/OS and optional platform speech implementation are not supplied by this repository. Disable platform speech for a strict auditable-open-source-only deployment.

## Remaining release checks

Actual dependency supply chain/install, inference API compatibility, sanitizer behavior with vendor runtime, real IndexedDB transactions/cache recovery, PDF fonts/WASM, embedding output dimensions, schema adherence, PWA offline reopening, platform voice, sandbox execution and physical-device memory need verification in your environment. Current passing unit/UI tests do not certify these integrations.
