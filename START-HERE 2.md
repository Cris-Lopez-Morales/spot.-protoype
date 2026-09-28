# Spot + Ask Spot — start here

The chatbot is now **inside Spot**, not a separate project. Open **Ask Spot** in
the top bar. Your map stays in place; close the panel to return. On a phone, use
the **Ask** button beside the Spot logo.

## Start the combined project

1. Extract `spot-with-ai.zip` fully (do not run files inside the ZIP).
2. Install **Node.js 22.16.0 or newer** if you do not already have it.
3. On Mac, open **Start Spot.command**. On Windows, open **Start Spot.cmd**.
   Alternatively, open a terminal in this folder and run `npm run launch`.
4. The first launch installs the pinned open-source libraries and prepares local
   assets. This needs internet. Keep the terminal window open.
5. The launcher opens `http://localhost:4318`. It opens Spot, not a separate chat page.
6. Click **Ask Spot → Choose model**, pick **Automatic** or **CPU / Small**, then
   approve the first model download. The small model is approximately 0.4–0.6 GB;
   that is a planning estimate, not a measurement on your device.

Models are NOT bundled into the ZIP. No model is downloaded merely by opening the
map or the assistant. There are no API keys, accounts, hosted AI inference calls,
or paid services. Initial library/model downloads use public package/model hosts.

If your operating system does not open the launcher, run `npm run launch` in
Terminal instead. Do not disable browser or operating-system security settings.

## Try these

- “Find demo cafés around East Campus.”
- “Explain Juniper Coffee and what its count means.”
- “How do I keep contributing without showing my name to friends?”
- “Does a count of 12 mean seats are available?”

Expand an answer's source card and choose **Show on map** to open a known place or
area in Spot. This action only happens when you click; model-generated text cannot
change the map, your friends, or your privacy controls by itself.

## What it knows

The assistant receives the public fictional venue directory, public aggregate
sample counts and their timestamps, searchable area names, and the manually
browsed area/selected place. It does **not** receive named friends, contacts,
friend permissions, saved-place lists, or device location. Counts are not total
attendance, seats, opening hours, or actual fullness. All establishments are
fictional. Chat messages and optional imported knowledge use local browser storage.

## Important difference from the earlier HTML prototype

This combined AI version is a local-server project, not a single double-click
HTML app. Do not open `public/index.html` directly. Workers, local model files,
PWA caching, and browser storage use the local server. `npm run launch` handles
preparation and starts it for you.

The previous no-AI, single-file prototype remains unchanged at:
`rollback/spot-lincoln-v4.4.html`.

## Testing disclosure

270 automated checks passed: 173 map logic tests, 66 application/context/server
checks, and 31 browser UI/bridge checks. UI checks use explicit model, worker,
storage and network fixtures. HTTP server checks run against the real local
server, with a scripted inference backend. Real model generation, first-run
package installation, model downloads, real-origin iframe behavior, physical
phones, and offline-cache recovery were not verified in this environment.

See `README.md` and `docs/TEST-REPORT.md` for details.
