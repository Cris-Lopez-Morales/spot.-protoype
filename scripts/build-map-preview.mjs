/** Build a portable map-only review copy. Full AI stays in the local-server app. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const read = name => readFile(path.join(publicRoot, name), 'utf8');
const escapeScript = source => source.replace(/<\/script/gi, '<\\/script');
let html = await read('index.html');
const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
for (const [, url] of styles) {
  const css = await read(url.slice(1));
  html = html.replace(`<link rel="stylesheet" href="${url}">`, () => `<style>\n${css}\n</style>`);
}
html = html.replace(/\s*<link rel="manifest"[^>]*>/g, '');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)];
for (const [, url] of scripts) {
  const integratedOnly = url.endsWith('/assistant-context.js') || url.endsWith('/assistant-shell.js');
  const replacement = integratedOnly ? '' : `<script>\n${escapeScript(await read(url.slice(1)))}\n</script>`;
  html = html.replace(`<script src="${url}"></script>`, () => replacement);
}
const mark = `data:image/svg+xml,${encodeURIComponent(await read('spot/assets/spot-mark.svg'))}`;
html = html.replace('src="/spot/assets/spot-mark.svg"', `src="${mark}"`);
html = html.replace('<title>spot — Your usuals, and somewhere new.</title>', '<title>Spot v4.6 — map preview</title>');
// This is an explanation, not a mocked model or pretend AI conversation.
html = html.replace('<p class="assistant-loading" role="status">Opening your private assistant…</p>', '<div style="padding:24px;line-height:1.7;color:var(--ink)"><h2 style="font-size:20px;margin:0 0 12px">This file previews the map.</h2><p>Ask Spot is included in the complete <strong>Spot v4.6 project</strong>, where it runs through the local server.</p><p>Extract the project ZIP and open <strong>Start Spot.command</strong> on Mac or <strong>Start Spot.cmd</strong> on Windows. Then select a model in Ask Spot.</p><p style="color:var(--muted)">No model or simulated AI responses are included in this standalone map preview. Your map, friends, saved places, comparisons and theme controls work here with fictional data.</p></div>');
const panelCode = `(() => {
  const button = document.getElementById('askSpot');
  const panel = document.getElementById('spotAssistantPanel');
  const close = document.getElementById('closeSpotAssistant');
  function setOpen(open) {
    panel.hidden = !open; panel.inert = !open;
    button.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('spot-assistant-open', open);
    if (open) close.focus(); else button.focus();
  }
  button.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) setOpen(false); });
})();`;
html = html.replace('</body>', `<script>${panelCode}</script>\n</body>`);
if (/<(?:script|link)[^>]+(?:src|href)="\//.test(html)) throw new Error('Preview retains an external script or stylesheet.');
const dest = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'preview', 'spot-v4.6-map-preview.html');
await mkdir(path.dirname(dest), { recursive: true });
await writeFile(dest, html);
console.log(dest);
