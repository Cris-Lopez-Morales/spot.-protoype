# Spot + Ask Spot v4.6 — start here

The chatbot is now **inside Spot**, not a separate project. Open **Ask Spot** in
the top bar. Your map stays in place; close the panel to return. On a phone, use
the **Ask** button beside the Spot logo.

## Review the map without setup

Open `preview/spot-v4.6-map-preview.html` in a browser. This is a self-contained
map review, with the new readable labels and 32 more spaced-out fictional venues.
Its Ask button explains how to run the complete project; it does not pretend to
perform AI inference.

## Start the combined project

1. Extract `spot-with-ai-v4.6.zip` fully (do not run files inside the ZIP).
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

The exact prior **AI-integrated** project is retained as
`rollback/spot-with-ai-v4.5.zip`. Extract it to another folder to revert.
The older no-AI single-file prototype is also retained at
`rollback/spot-lincoln-v4.4.html`. These are code backups, not browser-data backups.

Using the same localhost address preserves the existing storage origin. Saved
IDs for removed fictional places are no longer displayed. Existing conversations
are not rewritten. Export important chats before testing either version.

## Testing disclosure

336 automated checks passed: 193 map logic checks, 68 application/context/server
checks, 31 integrated UI/bridge checks, and 44 map layout/touch checks. UI tests
render the actual map in mobile-emulated Chromium using an explicit offline
harness; model, worker, storage and network components are fixtures. The standalone
map preview was also separately opened as inline HTML for a smoke check.

Real model generation, first-run installation/downloads, physical phones, mobile
Safari, real-origin frame navigation and offline-cache recovery were not verified.
This release changes map code and public fixture context, not AI runtime engines.

See `README.md` and `docs/TEST-REPORT.md` for details.
