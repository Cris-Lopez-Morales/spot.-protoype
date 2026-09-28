# Spot v4.7 — open the map

## Simplest option: no setup

Open **preview/spot-v4.7.html** in a modern browser. That is the complete map
prototype, not an AI demo. Every runtime asset is included in the HTML.
No server, package installation, account, API key, or initial model download is required.
Keep the file downloaded locally. Some mobile file-preview viewers do not run
JavaScript; use a browser or serve the source version below instead.

## Source project / local server

1. Extract this ZIP into a **new folder**. Do not merge it over the old AI project.
2. Install Node.js 22.16.0 or newer if it is not already on your computer.
3. On macOS, open **Start Spot.command**. On Windows, open **Start Spot.cmd**.
   The launcher uses the files in this folder and does not install packages.
4. Your browser opens the app. Leave the terminal window open while using it.
   Press Ctrl+C to stop the server.

The terminal alternative, from the extracted project folder, is:

```bash
node server.mjs
```

Then open `http://localhost:4318`.

If the operating system blocks a downloaded launcher, use the terminal command
instead; do not disable operating-system security protections.

## What changed

- Ask Spot, its panel, model/knowledge workers, AI libraries, model downloads,
  proxy endpoints, sandbox, and integration bridge are removed from this release.
- Place overviews replace the single-word banner with a category illustration:
  a coffee cup for cafés and a cocktail glass for bars/clubs.
- The full venue name remains directly underneath. Mobile cards use a compact
  48-pixel header and titles can wrap instead of being cut off.
- The v4.6 map, spaced-out 32-venue fixture, counts, friends, search, saving,
  comparison, privacy controls, and touch gestures are retained.

## Switching from the previous integrated version

Stop the old server first, then start this one from its newly extracted folder.
Refresh the browser. The source version installs a map-only service worker and
invalidates this project's obsolete shell caches when the new worker activates.
A failed first load/cache setup may require another online refresh.

This release does not run or reconnect to any previously installed model server.
It does not uninstall Node, Ollama, or files from another folder on your computer.
Old chat data or downloaded model caches are not automatically erased. Keeping
those untouched avoids deleting your personal content without a separate request.

Your previous v4.6 ZIP is preserved as a **separate download** in this conversation;
it is intentionally not bundled inside the new AI-free project. Use that archive
in its own folder to restore the prior version. Its checksum is recorded in
`rollback-manifest.json`.

## A note about the data

The 32 venues, 5,000 accounts, 610 initial venue presences and 60 friends are
fictional. The app does not collect GPS or detect visits. Counts describe sample
app participants, not total occupancy or available seats.
