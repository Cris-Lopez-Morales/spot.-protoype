/** Build the complete app as one offline HTML file. No bundler dependency. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFile(path.join(root,'public',name),'utf8');
let html=await read('index.html');
for(const [,url] of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]) {
  const css=await read(url.slice(1));
  html=html.replace(`<link rel="stylesheet" href="${url}">`,()=>`<style>\n${css}\n</style>`);
}
html=html.replace(/\s*<link rel="manifest"[^>]*>/g,'');
for(const [,url] of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]) {
  // file:// already has every asset inline; it cannot install a service worker.
  const code=url.endsWith('/pwa.js')?'':await read(url.slice(1));
  const inline=code?`<script>\n${code.replace(/<\/script/gi,'<\\/script')}\n</script>`:'';
  html=html.replace(`<script src="${url}"></script>`,()=>inline);
}
if(/<(?:script|link)[^>]+(?:src|href)="\//.test(html))throw new Error('A runtime asset was not inlined.');
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'preview','spot-v4.7.html');
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,html);console.log(output);
