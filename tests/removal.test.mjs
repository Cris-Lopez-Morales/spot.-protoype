import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const require=createRequire(import.meta.url), cover=require('../public/spot/venue-cover.js');
const data=require('../public/spot/core.js');

for(const [file,hash] of Object.entries(JSON.parse(read('tests/fixtures/v46-fingerprints.json'))))test(`retained byte-for-byte from v4.6: ${file}`,()=>assert.equal(crypto.createHash('sha256').update(read(file)).digest('hex'),hash));
test('there are zero production or build dependencies',()=>{const p=JSON.parse(read('package.json'));assert.equal(Object.keys(p.dependencies||{}).length,0);assert.equal(Object.keys(p.devDependencies||{}).length,0);assert.equal(p.overrides,undefined);});
test('removed runtime directories are absent, not just disabled',()=>{for(const p of ['public/src','public/models','public/workers','public/sandbox','public/knowledge','public/vendor','rollback'])assert.equal(exists(p),false,p);});
test('removed chat files are absent',()=>{for(const p of ['public/assistant.html','public/app.css','public/assistant-embed.css','public/spot/assistant-context.js','public/spot/assistant-shell.js','public/spot/assistant-shell.css','scripts/prepare-vendor.mjs','scripts/mirror-models.mjs'])assert.equal(exists(p),false,p);});
test('no chat markup or hidden panel remains',()=>assert.doesNotMatch(read('public/index.html'),/askSpot|assistant|iframe|huggingface|model-download/i));
test('no assistant-to-map bridge remains',()=>assert.doesNotMatch(read('public/spot/app.js'),/SpotAssistant|assistant-context|postMessage|model\.worker/));
test('manifest describes only the map',()=>{const m=JSON.parse(read('public/manifest.webmanifest'));assert.doesNotMatch(JSON.stringify(m),/assistant|chatbot|local ai/i);assert.equal(m.short_name,'Spot');});
test('launcher no longer installs packages or downloads assets',()=>assert.doesNotMatch(read('scripts/start.mjs'),/npm|spawnSync|vendor|mirror-model|huggingface/));
test('server has no inference or external search path',()=>assert.doesNotMatch(read('server.mjs'),/ollama|llamacpp|api\/chat|wikipedia|fetch\(/i));
test('Café overview has a distinct locally drawn category icon',()=>{const h=cover.render({category:'cafe',name:'Juniper Coffee'});assert.match(h,/data-cover-category="cafe"/);assert.match(h,/>Café</);assert.match(h,/cover-cup-fill/);assert.doesNotMatch(h,/Juniper|cover-word|<img/);});
test('club overview has a glass symbol, not a coffee cup',()=>{const h=cover.render({category:'club',name:'After Hours'});assert.match(h,/>Bar \/ club</);assert.match(h,/cover-glass-fill/);assert.doesNotMatch(h,/After|cover-cup-fill/);});
test('overview never renders an arbitrary venue-name fragment',()=>{const h=cover.render({category:'cafe',name:'<script>alert(1)</script>',theme:'" onclick="alert(1)'});assert.doesNotMatch(h,/script|onclick|alert\(/);});
test('every venue gets its correct header with an accessible close control',()=>{for(const v of data.VENUES){const h=cover.render(v);assert.match(h,/aria-label="Close place details"/);assert.match(h,v.category==='cafe'?/cover-cup-fill/:/cover-glass-fill/);}});
test('full venue title is retained in the place card',()=>{const s=read('public/spot/app.js');assert.match(s,/<h2 id="detailTitle">\$\{escape\(v.name\)\}<\/h2>/);assert.doesNotMatch(s,/v.name.split\(' '\)\[0\]/);});
test('mobile titles can wrap instead of clipping to one word',()=>assert.match(read('public/spot/venue-cover.css'),/white-space:normal/));
test('new category banner is compact on mobile',()=>assert.match(read('public/spot/venue-cover.css'),/height:48px/));
test('standalone contains all assets and no service worker registration',()=>{const s=read('preview/spot-v4.7.html');assert.doesNotMatch(s,/<(?:script|link)[^>]+(?:src|href)="\//);assert.doesNotMatch(s,/navigator\.serviceWorker\.register|askSpot|SpotAssistant|cover-word/);});

function swHarness(names=['spot-ai-4.6.0-shell','spot-ai-4.6.0-assets','spot-map-4.0.0-shell','unrelated-app-shell']) {
 const events={},deleted=[],cached=[],claimed=[],skipped=[],responses=[];
 const cache={addAll:async xs=>cached.push(...xs),match:async()=>undefined,put:async()=>{}};
 const sandbox={URL,Response,console,self:{location:{origin:'http://localhost:4318'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>skipped.push(true),clients:{claim:async()=>claimed.push(true)}},caches:{open:async()=>cache,keys:async()=>names,delete:async name=>deleted.push(name)},fetch:async()=>new Response('ok')};
 vm.runInNewContext(read('public/sw.js'),sandbox);
 return {events,deleted,cached,claimed,skipped,responses};
}
test('offline cache warms only bundled map resources',async()=>{const h=swHarness();let wait;h.events.install({waitUntil:p=>wait=p});await wait;assert.ok(h.cached.includes('/spot/venue-cover.js'));assert.ok(h.cached.includes('/index.html'));assert.ok(h.cached.every(p=>!/(assistant|models|sandbox|workers|vendor)/.test(p)));assert.equal(h.skipped.length,1);});
test('migration removes prior Spot shells but not unrelated caches',async()=>{const h=swHarness();let wait;h.events.activate({waitUntil:p=>wait=p});await wait;assert.deepEqual(h.deleted,['spot-ai-4.6.0-shell','spot-ai-4.6.0-assets','spot-map-4.0.0-shell']);assert.equal(h.claimed.length,1);});
for(const pathname of ['/assistant.html','/api/chat','/models/a.gguf','/does-not-exist'])test(`offline worker cannot resurrect removed route: ${pathname}`,()=>{const h=swHarness();let intercepted=false;h.events.fetch({request:{url:'http://localhost:4318'+pathname,method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);});
test('offline worker does not intercept external origins',()=>{const h=swHarness();let intercepted=false;h.events.fetch({request:{url:'https://example.com/index.html',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);});
