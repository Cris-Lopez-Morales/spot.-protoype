# Optional same-origin model assets

The included manifest is an empty, valid configuration. No model weights are bundled in the source archive.

After installing dependencies, run:

```sh
npm run models -- cpu-small tokenizers embeddings
```

This downloads public open-model assets to this directory, records immutable Hugging Face repository commits and file SHA-256 hashes in `models.lock.json`, and updates `manifest.json`. GPU targets are also available; `npm run models -- --help` lists all targets.

Copy this directory, the generated vendor directory, and the source to your offline machine. Load the chosen model and documents once, then verify offline behavior before relying on it. Models use significant storage; browsers may evict their own caches.

Initial default browser downloads use upstream model IDs. Use the mirrored, locked configuration for controlled deployment instead of assuming upstream main branches never change. Remote downloads are model assets, not remote inference.
