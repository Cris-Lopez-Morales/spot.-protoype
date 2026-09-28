import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
const ROOT=path.dirname(fileURLToPath(import.meta.url)),PUBLIC=path.join(ROOT,'public');
const PORT=Number(process.env.PORT||4318),SANDBOX_PORT=Number(process.env.SANDBOX_PORT||PORT+1),HOST=process.env.HOST||'127.0.0.1';
const TLS=process.env.TLS_CERT&&process.env.TLS_KEY?{cert:fs.readFileSync(process.env.TLS_CERT),key:fs.readFileSync(process.env.TLS_KEY)}:null;
const scheme=TLS?'https':'http',PUBLIC_ORIGIN=process.env.PUBLIC_ORIGIN||`${scheme}://localhost:${PORT}`;
const origins=new Set([PUBLIC_ORIGIN,`${scheme}://localhost:${PORT}`,`${scheme}://127.0.0.1:${PORT}`]);
const knownHosts=new Set([...origins].map(o=>new URL(o).host));
const sandboxOrigin=process.env.SANDBOX_ORIGIN||`${scheme}://${new URL(PUBLIC_ORIGIN).hostname}:${SANDBOX_PORT}`;
const BACKEND=process.env.LOCAL_BACKEND||'none',MODEL=process.env.LOCAL_MODEL||'qwen2.5:1.5b';
if(!['none','ollama','llamacpp'].includes(BACKEND))throw Error('LOCAL_BACKEND must be none, ollama, or llamacpp.');
const upstream=new URL(process.env.LOCAL_BACKEND_URL||(BACKEND==='llamacpp'?'http://127.0.0.1:8080':'http://127.0.0.1:11434'));
if(!['localhost','127.0.0.1','[::1]'].includes(upstream.hostname)||!['http:','https:'].includes(upstream.protocol)||upstream.username||upstream.password)throw Error('AI backends must use a loopback URL on your own server, without credentials. Remote/cloud endpoints are not allowed.');
// A loopback endpoint alone does not rule out an Ollama cloud-model alias.
if(BACKEND==='ollama'&&(/(?:^|[:/\-])cloud(?:$|[:/\-])/i.test(MODEL)||MODEL.includes('://')))throw Error('Cloud models are forbidden. Choose a downloaded local model.');
async function verifyLocalOllama(){
 if(BACKEND!=='ollama')return;
 const response=await fetch(new URL('/api/show',upstream),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:MODEL}),redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Object.assign(Error('The configured local model could not be verified. Download it with ollama pull and start Ollama with OLLAMA_NO_CLOUD=1.'),{status:503});
 const meta=await response.json();
 if(meta.remote_host||meta.remote_model)throw Object.assign(Error('Cloud-backed Ollama models are blocked. No chat content was sent. Use local weights and OLLAMA_NO_CLOUD=1.'),{status:403});
 if(!['gguf','safetensors'].includes(meta.details?.format))throw Object.assign(Error('Local model metadata is missing or unrecognized. No chat content was sent.'),{status:503});
}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip','.gguf':'application/octet-stream'};
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
function headers(res,sandbox=false){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Cross-Origin-Resource-Policy',sandbox?'cross-origin':'same-origin');
 const connect=sandbox?"'self'": "'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://cdn-lfs.huggingface.co https://raw.githubusercontent.com";
 res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src ${connect}; worker-src 'self' blob:; child-src 'self' blob:; frame-src ${sandbox?"'none'":"'self' "+sandboxOrigin}; frame-ancestors ${sandbox?[...origins].join(' '):"'self'"}; object-src 'none'; base-uri 'self'; form-action 'none'`);
 res.setHeader('Permissions-Policy',sandbox?'microphone=(), geolocation=(), camera=()':'camera=(), geolocation=(), microphone=(self)');
}
function checkRequest(req){if(!knownHosts.has(req.headers.host))throw Object.assign(Error('Unrecognized Host. Configure PUBLIC_ORIGIN for your own domain.'),{status:403});if(req.headers.origin&&!origins.has(req.headers.origin))throw Object.assign(Error('Cross-origin access denied.'),{status:403});if(req.headers['sec-fetch-site']==='cross-site')throw Object.assign(Error('Cross-site access denied.'),{status:403});}
async function body(req){let n=0,parts=[];for await(const b of req){n+=b.length;if(n>200000)throw Object.assign(Error('Request body too large.'),{status:413});parts.push(b);}try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw Object.assign(Error('Invalid JSON body.'),{status:400});}}
async function staticFile(req,res,root,pathname){let relative;try{relative=decodeURIComponent(pathname);}catch{throw Object.assign(Error('Invalid path.'),{status:400});}if(relative.includes('\0')||relative.includes('\\'))throw Object.assign(Error('Invalid path.'),{status:400});const full=path.resolve(root,'.'+relative);if(full!==root&&!full.startsWith(root+path.sep))throw Object.assign(Error('Forbidden path.'),{status:403});let stat;try{stat=await fsp.stat(full);}catch{return json(res,404,{error:'File not found. Run npm run vendor if a runtime asset is missing.'});}if(!stat.isFile())return json(res,404,{error:'Not a file.'});res.setHeader('Content-Type',MIME[path.extname(full)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control',relative.startsWith('/models/')||relative.startsWith('/vendor/')?'public, max-age=3600':'no-cache');
 let start=0,end=stat.size-1;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}res.setHeader('Content-Length',Math.max(0,end-start+1));if(req.method==='HEAD'||!stat.size){res.end();return;}const stream=fs.createReadStream(full,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
async function shellFiles(){const items=['/','/index.html','/assistant.html','/app.css','/assistant-embed.css','/manifest.webmanifest'];async function walk(dir,prefix){for(const e of await fsp.readdir(dir,{withFileTypes:true})){if(e.isDirectory())await walk(path.join(dir,e.name),`${prefix}/${e.name}`);else if(/\.(js|css|svg|png|md)$/.test(e.name))items.push(`${prefix}/${e.name}`);}}for(const p of ['src','workers','icons','knowledge','spot'])await walk(path.join(PUBLIC,p),'/'+p);return [...new Set(items)];}
const limits=new Map();function rateLimit(req){const key=req.socket.remoteAddress;const now=Date.now();let row=limits.get(key);if(!row||now-row.start>60000)row={start:now,n:0};row.n++;limits.set(key,row);if(limits.size>1000)limits.clear();if(row.n>60)throw Object.assign(Error('Too many requests. Retry in a minute.'),{status:429});}
async function app(req,res){headers(res);try{checkRequest(req);const u=new URL(req.url,PUBLIC_ORIGIN);
 if(!['GET','HEAD','POST'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
 if(u.pathname==='/api/status')return json(res,200,{backend:BACKEND==='none'?null:BACKEND,model:MODEL,sandboxOrigin,vendorReady:fs.existsSync(path.join(PUBLIC,'vendor','mlc.js')),testMode:process.env.LOCAL_CHAT_TEST==='1'});
 if(u.pathname==='/api/backend-health'){if(BACKEND==='none')return json(res,503,{error:'No backend configured.'});await verifyLocalOllama();const r=await fetch(new URL(BACKEND==='ollama'?'/api/tags':'/health',upstream),{redirect:'error',signal:AbortSignal.timeout(4000)});return json(res,r.ok?200:503,{ready:r.ok});}
 if(u.pathname==='/api/generate'){
  rateLimit(req);if(req.method!=='POST')return json(res,405,{error:'POST required.'});if(BACKEND==='none')return json(res,503,{error:'Start a private Ollama or llama.cpp server and set LOCAL_BACKEND.'});const data=await body(req);
  if(!Array.isArray(data.messages)||data.messages.length>100||!data.messages.length||data.messages.some(m=>!m||!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>40000))return json(res,400,{error:'Invalid messages.'});
  const params={messages:data.messages.map(({role,content})=>({role,content})),model:MODEL,stream:true};const temperature=Math.max(0,Math.min(1.5,Number(data.temperature)||0));const top_p=Math.max(.1,Math.min(1,Number(data.top_p)||.9)),max_tokens=Math.max(1,Math.min(1536,Number(data.max_tokens)||640)),context=Math.max(2048,Math.min(8192,Number(data.context)||4096));
  const schema=data.response_format?.json_schema?.schema;if(schema&&JSON.stringify(schema).length>10000)return json(res,400,{error:'Schema too large.'});
  if(BACKEND==='ollama'){params.options={temperature,top_p,num_predict:max_tokens,num_ctx:context};if(schema)params.format=schema;}
  else{Object.assign(params,{temperature,top_p,max_tokens,stream_options:{include_usage:true}});if(schema)params.response_format={type:'json_schema',json_schema:{name:'response',schema,strict:true}};}
  await verifyLocalOllama();
  const abort=new AbortController();res.on('close',()=>abort.abort());const signal=AbortSignal.any([abort.signal,AbortSignal.timeout(600000)]);
  const r=await fetch(new URL(BACKEND==='ollama'?'/api/chat':'/v1/chat/completions',upstream),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params),redirect:'error',signal});
  if(!r.ok)return json(res,r.status,{error:(await r.text()).slice(0,500)});res.writeHead(200,{'Content-Type':BACKEND==='ollama'?'application/x-ndjson':'text/event-stream','X-Stream-Format':BACKEND==='ollama'?'ndjson':'sse','Cache-Control':'no-store','X-Accel-Buffering':'no'});const stream=Readable.fromWeb(r.body);stream.on('error',()=>res.destroy());stream.pipe(res);return;
 }
 if(u.pathname==='/api/wiki'){
  rateLimit(req);if(req.method!=='POST')return json(res,405,{error:'POST required for an approved external lookup.'});const input=await body(req);const q=typeof input.q==='string'?input.q.trim():'';if(!q||q.length>160)return json(res,400,{error:'Invalid Wikipedia query.'});
  const target=new URL('https://en.wikipedia.org/w/api.php');for(const [k,v]of Object.entries({action:'query',format:'json',generator:'search',gsrsearch:q,gsrlimit:'3',prop:'extracts|info',exintro:'1',explaintext:'1',exchars:'1400',inprop:'url'}))target.searchParams.set(k,v);
  const r=await fetch(target,{headers:{'User-Agent':'LocalChat/1.0 (self-hosted educational assistant)'},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)return json(res,502,{error:`Wikipedia returned ${r.status}.`});const d=await r.json();if(d.error)return json(res,502,{error:d.error.info});return json(res,200,{sources:Object.values(d.query?.pages||{}).map(p=>({title:p.title,text:p.extract||'',url:p.fullurl})),retrievedAt:new Date().toISOString()});
 }
 if(u.pathname==='/shell-manifest.json')return json(res,200,{version:'spot-ai-4.5.0',files:await shellFiles()});
 if(u.pathname.startsWith('/api/'))return json(res,404,{error:'Unknown API path.'});
 if(req.method==='POST')return json(res,405,{error:'No writes are accepted on static paths.'});
 return await staticFile(req,res,PUBLIC,u.pathname==='/'?'/index.html':u.pathname);
 }catch(e){if(res.headersSent)res.destroy();else json(res,e.status||502,{error:e.message||'Request failed.'});}}
const create=(handler)=>TLS?https.createServer(TLS,handler):http.createServer(handler);
const main=create(app);main.listen(PORT,HOST,()=>console.log(`Spot + Ask Spot: ${PUBLIC_ORIGIN}\nBackend: ${BACKEND}. No API keys or accounts.\nClose with Ctrl+C.`));
const sandbox=create(async(req,res)=>{headers(res,true);try{const u=new URL(req.url,sandboxOrigin);if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Read-only sandbox.'});const permitted=new Set([new URL(sandboxOrigin).host,`localhost:${SANDBOX_PORT}`,`127.0.0.1:${SANDBOX_PORT}`]);if(!permitted.has(req.headers.host))return json(res,403,{error:'Invalid sandbox Host.'});if(u.pathname.startsWith('/pyodide/'))return await staticFile(req,res,path.join(PUBLIC,'vendor'),u.pathname);const files={'/':'/frame.html','/frame.js':'/frame.js','/python.worker.js':'/python.worker.js'};if(!files[u.pathname])return json(res,404,{error:'Sandbox path unavailable.'});return await staticFile(req,res,path.join(PUBLIC,'sandbox'),files[u.pathname]);}catch(e){if(!res.headersSent)json(res,500,{error:e.message});else res.destroy();}});
sandbox.listen(SANDBOX_PORT,HOST);
for(const server of [main,sandbox])server.on('error',e=>{console.error(e.message);process.exitCode=1;main.close();sandbox.close();});
process.on('SIGTERM',()=>{main.close();sandbox.close();});process.on('SIGINT',()=>{main.close();sandbox.close();process.exit(0);});
