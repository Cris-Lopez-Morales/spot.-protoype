import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'public','vendor');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
let build;try{({build}=await import('esbuild'));}catch{throw Error('Install the exact dependencies first: npm install --ignore-scripts');}
await fs.mkdir(out,{recursive:true});
for(const [name,version]of Object.entries({...pkg.dependencies,...pkg.devDependencies})){const file=path.join(root,'node_modules',name,'package.json');const actual=JSON.parse(await fs.readFile(file,'utf8')).version;if(actual!==version)throw Error(`${name}: expected ${version}, installed ${actual}. Run npm install --ignore-scripts.`);}
await build({entryPoints:[path.join(root,'node_modules/@mlc-ai/web-llm/lib/index.js')],bundle:true,format:'esm',platform:'browser',outfile:path.join(out,'mlc.js'),minify:true,target:'es2022',legalComments:'eof'});
await build({stdin:{contents:`import DOMPurify from 'dompurify'; import {marked} from 'marked'; import hljs from 'highlight.js/lib/common'; export {DOMPurify,marked,hljs};`,resolveDir:root},bundle:true,format:'esm',platform:'browser',outfile:path.join(out,'render.js'),minify:true,target:'es2022',legalComments:'eof'});
for(const [from,to]of [
 ['@wllama/wllama/esm','wllama/esm'],['@wllama/wllama-compat/wasm','wllama-compat/wasm'],
 ['@huggingface/transformers/dist','transformers'],['onnxruntime-web/dist','ort'],
 ['pdfjs-dist/build','pdf'],['pdfjs-dist/cmaps','pdf/cmaps'],['pdfjs-dist/standard_fonts','pdf/standard_fonts'],['pdfjs-dist/wasm','pdf/wasm'],['pyodide','pyodide']
])await fs.cp(path.join(root,'node_modules',from),path.join(out,to),{recursive:true,filter:source=>!source.endsWith('.map')});
for(const file of ['mlc.js','render.js','wllama/esm/index.js','wllama/esm/wasm/wllama.wasm','wllama-compat/wasm/wllama.js','transformers/transformers.web.js','pdf/pdf.mjs','pdf/pdf.worker.mjs','pyodide/pyodide.mjs'])await fs.access(path.join(out,file));
const licenses=[];for(const name of Object.keys(pkg.dependencies)){const dir=path.join(root,'node_modules',name);const names=await fs.readdir(dir);for(const filename of names.filter(n=>/^licen[cs]e|^notice/i.test(n))){const stat=await fs.stat(path.join(dir,filename));if(stat.isFile()){const dest=path.join(out,'licenses',name.replaceAll('/','_')+'-'+filename);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(dir,filename),dest);licenses.push(dest.slice(out.length+1));}}}
const assets=[];async function walk(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())await walk(p);else{const data=await fs.readFile(p);assets.push({path:'/vendor/'+path.relative(out,p).replaceAll('\\','/'),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});}}}await walk(out);
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({version:pkg.version,libraries:pkg.dependencies,assets,licenses},null,2));console.log(`Prepared ${assets.length} locally hosted vendor assets. npm start will serve them; no runtime CDN scripts are used.`);
