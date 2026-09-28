/** Pre-stage public open model assets on your own origin. No tokens, accounts or inference APIs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {MODELS,EMBED_MODEL,RERANK_MODEL} from '../public/src/config.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DEST=path.join(ROOT,'public/models');
const LOCK=path.join(ROOT,'models.lock.json');
const known=['cpu-small','cpu-balanced','gpu-small','gpu-balanced','gpu-large','tokenizers','embeddings','reranker'];
const targets=[...new Set(process.argv.slice(2))];
if(!targets.length||targets.includes('--help')){console.log('Usage: npm run models -- cpu-small tokenizers embeddings\nTargets: '+known.join(', ')+'\nGPU targets mirror both f16 and f32 variants. Expect substantial disk usage.\nRevisions resolve once and are recorded in models.lock.json. Commit this lock for repeatability.');process.exit(0);}
if(targets.some(t=>!known.includes(t)))throw Error('Unknown target. Use --help for the supported targets.');
await fs.mkdir(DEST,{recursive:true});
let lock={version:1,repositories:{},files:{}};try{lock=JSON.parse(await fs.readFile(LOCK,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let manifest={version:1,models:{},repositories:{}};try{manifest=JSON.parse(await fs.readFile(path.join(DEST,'manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchRetry(url){let last;for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(url,{signal:AbortSignal.timeout(180000),headers:{'User-Agent':'LocalChat-model-mirror/1.0'}});if(!r.ok)throw Error(`${r.status} ${r.statusText}: ${url}`);return r;}catch(e){last=e;if(attempt<2)await wait(1000*2**attempt);}}throw last;}
async function hashFile(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
function localFile(relative){if(relative.includes('..')||relative.includes('\\')||relative.startsWith('/'))throw Error('Unsafe model asset path.');return path.join(DEST,relative);}
async function saveState(){await fs.writeFile(LOCK,JSON.stringify(lock,null,2));await fs.writeFile(path.join(DEST,'manifest.json'),JSON.stringify(manifest,null,2));}
async function download(url,relative,expectedHash=null){const file=localFile(relative);const key=relative.replaceAll('\\','/');try{const stat=await fs.stat(file);if(stat.size&&lock.files[key]&&await hashFile(file)===lock.files[key].sha256){console.log(`Cached: ${key}`);return;}}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.part';const response=await fetchRetry(url);const total=Number(response.headers.get('content-length'))||0;let bytes=0,lastLog=0;const hash=createHash('sha256');
 const meter=new Transform({transform(chunk,encoding,done){bytes+=chunk.length;hash.update(chunk);if(Date.now()-lastLog>3000){console.log(`${key}: ${(bytes/1048576).toFixed(1)} MB${total?' / '+(total/1048576).toFixed(1)+' MB':''}`);lastLog=Date.now();}done(null,chunk);}});
 try{await pipeline(Readable.fromWeb(response.body),meter,createWriteStream(temp));const sha256=hash.digest('hex');if(total&&bytes!==total)throw Error('Incomplete asset download.');if(expectedHash&&expectedHash!==sha256)throw Error('Model SHA-256 did not match the model host metadata.');if(lock.files[key]?.sha256&&lock.files[key].sha256!==sha256)throw Error('Asset changed relative to models.lock.json. Review the upstream change before updating the lock.');await fs.rename(temp,file);lock.files[key]={url,bytes,sha256};await saveState();}catch(e){await fs.rm(temp,{force:true});throw e;}}
const repoCache=new Map();
async function repository(repo){if(repoCache.has(repo))return repoCache.get(repo);let revision=lock.repositories[repo];if(!revision){const info=await(await fetchRetry(`https://huggingface.co/api/models/${repo}`)).json();if(!/^[a-f0-9]{40}$/.test(info.sha||''))throw Error(`No immutable revision found for ${repo}.`);revision=info.sha;lock.repositories[repo]=revision;await saveState();}
 const files=[];let url=`https://huggingface.co/api/models/${repo}/tree/${revision}?recursive=true&expand=false`;
 while(url){const r=await fetchRetry(url);const entries=await r.json();if(!Array.isArray(entries))throw Error('Unexpected model file listing.');files.push(...entries.filter(e=>e.type==='file'));const next=r.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/);url=next?.[1]||null;if(url&&!url.startsWith('https://huggingface.co/'))throw Error('Unexpected model pagination host.');}
 const result={repo,revision,files};repoCache.set(repo,result);return result;}
async function mirrorRepo(repo,predicate){const info=await repository(repo);const selected=info.files.filter(f=>predicate(f.path));if(!selected.length)throw Error(`No matching files for ${repo}.`);for(const f of selected){const relative=`${repo}/${f.path}`;const url=`https://huggingface.co/${repo}/resolve/${info.revision}/${f.path.split('/').map(encodeURIComponent).join('/')}`;await download(url,relative,f.lfs?.oid||null);}manifest.repositories[repo]=repo;await saveState();return `/models/${repo}/`;}
const metadata=name=>/\.(json|txt|model|tiktoken|jinja|jinja2)$/.test(name)||/^(LICENSE|NOTICE|README)/i.test(name);
for(const target of targets){
 console.log(`\nMirroring ${target}`);
 if(target.startsWith('cpu-')){const size=target.slice(4),m=MODELS[size];const base=await mirrorRepo(m.ggufRepo,name=>name===m.ggufFile||/^(LICENSE|NOTICE|README)/i.test(name));if(!(await repository(m.ggufRepo)).files.some(f=>f.path===m.ggufFile))throw Error(`Expected GGUF ${m.ggufFile} was not present.`);manifest.models[target]={url:base+m.ggufFile};await mirrorRepo(m.family,metadata);}
 else if(target.startsWith('gpu-')){let prebuiltAppConfig;try{({prebuiltAppConfig}=await import('@mlc-ai/web-llm'));}catch{throw Error('Install the pinned npm dependencies before mirroring WebLLM models.');}const size=target.slice(4),m=MODELS[size];for(const quant of ['q4f16_1','q4f32_1']){const id=`${m.mlc}-${quant}-MLC`;const entry=prebuiltAppConfig.model_list.find(e=>e.model_id===id);if(!entry)throw Error(`The pinned engine lacks ${id}.`);const repo=entry.model.match(/^https:\/\/huggingface\.co\/([^/]+\/[^/]+)/)?.[1];if(!repo)throw Error('Unexpected MLC repository URL.');const base=await mirrorRepo(repo,name=>metadata(name)||name.endsWith('.bin'));const lib=`compiled/${id}.wasm`;await download(entry.model_lib,lib);manifest.models[id]={model:base,model_lib:'/models/'+lib};}await mirrorRepo(m.family,metadata);}
 else if(target==='tokenizers'){for(const m of Object.values(MODELS))await mirrorRepo(m.family,metadata);}
 else{const repo=target==='embeddings'?EMBED_MODEL:RERANK_MODEL;await mirrorRepo(repo,name=>metadata(name)||/^onnx\/model_quantized\.onnx(?:_data)?$/.test(name));}
 await saveState();
}
console.log('\nMirrors are ready. Restart the app or reload its workers to read the new manifest. Keep public/models plus models.lock.json together.');
