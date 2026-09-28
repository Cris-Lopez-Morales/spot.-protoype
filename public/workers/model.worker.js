import {MODELS} from '../src/config.js';
import {readJSONStream} from '../src/stream.js';
let engine=null,kind=null,modelId='',abort=null,currentId=null,selection=null,serverInfo=null;
const send=(id,type,data)=>postMessage({id,type,data});
const progress=(id,message,value=null)=>send(id,'progress',{message,value});
async function optionalManifest(){try{const r=await fetch('/models/manifest.json');return r.ok?await r.json():{models:{}};}catch{return {models:{}};}}
async function init(id,options){
 if(abort)abort.abort();if(engine){try{if(kind==='gpu')await engine.unload();else if(kind==='cpu')await engine.exit();}catch{}}
 engine=null;selection=options;kind=options.engine;const spec=MODELS[options.size];
 progress(id,'Preparing the local runtime…');
 if(kind==='server'){
  const r=await fetch('/api/status',{signal:AbortSignal.timeout(5000)});serverInfo=await r.json();if(!r.ok||!serverInfo.backend)throw Error('No local AI server is configured. Start Ollama or llama.cpp, then restart this app with LOCAL_BACKEND set.');
  const health=await fetch('/api/backend-health',{signal:AbortSignal.timeout(16000)});if(!health.ok){const error=await health.json().catch(()=>({}));throw Error(error.error||'Your local AI server is not responding. Check the model and local-only configuration.');}
  modelId=serverInfo.model;return {engine:kind,model:modelId,size:options.size,context:options.context};
 }
 const manifest=await optionalManifest();
 if(kind==='gpu'){
  const {MLCEngine,prebuiltAppConfig}=await import('/vendor/mlc.js');
  modelId=`${spec.mlc}-${options.f16?'q4f16_1':'q4f32_1'}-MLC`;
  const native=prebuiltAppConfig.model_list.find(m=>m.model_id===modelId);if(!native)throw Error('This model is not supported by the pinned WebLLM build. Choose a different size.');
  const mirror=manifest.models?.[modelId];const appConfig={...prebuiltAppConfig,cacheBackend:'indexeddb',model_list:[mirror?{...native,...mirror,model:new URL(mirror.model,location.origin).href,model_lib:new URL(mirror.model_lib,location.origin).href}:native]};
  engine=new MLCEngine({appConfig,logLevel:'ERROR',initProgressCallback:p=>progress(id,p.text||'Loading model…',p.progress)});
  await engine.reload(modelId,{context_window_size:options.context,sliding_window_size:-1});
 }else if(kind==='cpu'){
  if(options.size==='large')throw Error('The 7B CPU download exceeds the default single-file browser limit. Use the small/balanced CPU model, WebGPU, or your local server.');
  const {Wllama}=await import('/vendor/wllama/esm/index.js');
  engine=new Wllama({default:new URL('/vendor/wllama/esm/wasm/wllama.wasm',location.origin).href},{allowOffline:true,suppressNativeLog:true,logger:{debug(){},log(){},warn(){},error(){}}});
  engine.setCompat({wasm:new URL('/vendor/wllama-compat/wasm/wllama.wasm',location.origin).href,worker:new URL('/vendor/wllama-compat/wasm/wllama.js',location.origin).href},'firefox_safari');
  const mirror=manifest.models?.[`cpu-${options.size}`];
  const params={n_ctx:options.context,n_threads:crossOriginIsolated?Math.max(1,Math.min(4,Math.floor((navigator.hardwareConcurrency||2)/2))):1,n_gpu_layers:0,n_parallel:1,progressCallback:({loaded,total})=>progress(id,total?`Model download: ${Math.round(loaded/1048576)} / ${Math.round(total/1048576)} MB`:'Downloading model…',total?loaded/total:null)};
  if(mirror)await engine.loadModelFromUrl(new URL(mirror.url,location.origin).href,params);else await engine.loadModelFromHF({repo:spec.ggufRepo,file:spec.ggufFile},params);
  modelId=spec.name;
 }else throw Error('Unknown inference engine.');
 return {engine:kind,model:modelId,size:options.size,context:options.context};
}
async function complete(id,p){
 if(currentId)throw Error('Another model request is in progress. Stop it first.');if(!kind||(kind!=='server'&&!engine))throw Error('Load a model first.');
 currentId=id;abort=new AbortController();let full='',usage=null,finish=null;
 try{
  const req={messages:p.messages,temperature:p.temperature??.35,top_p:p.topP??.9,max_tokens:p.maxTokens??640,stream:true};
  let stream;
  if(kind==='gpu'){
   if(p.schema)req.response_format={type:'json_object',schema:JSON.stringify(p.schema)};
   req.stream_options={include_usage:true};stream=await engine.chat.completions.create(req);
  }else if(kind==='cpu'){
   if(p.schema)req.response_format={type:'json_schema',json_schema:{name:'response',schema:p.schema,strict:true}};
   req.abortSignal=abort.signal;stream=await engine.createChatCompletion(req);
  }else{
   if(p.schema)req.response_format={type:'json_schema',json_schema:{name:'response',schema:p.schema,strict:true}};
   const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...req,context:selection.context}),signal:abort.signal});
   stream=readJSONStream(r,r.headers.get('x-stream-format')||'sse',abort.signal);
  }
  for await(const chunk of stream){
   if(abort.signal.aborted)throw new DOMException('Stopped','AbortError');
   const token=chunk.choices?.[0]?.delta?.content??chunk.message?.content??'';
   if(chunk.usage)usage=chunk.usage;if(chunk.eval_count!=null)usage={prompt_tokens:chunk.prompt_eval_count,completion_tokens:chunk.eval_count};
   finish=chunk.choices?.[0]?.finish_reason||chunk.done_reason||finish;
   if(token){full+=token;if(full.length>40000){abort.abort();if(kind==='gpu')engine.interruptGenerate();throw Error('Output length limit reached. The partial response was preserved.');}send(id,'token',token);}
  }
  return {text:full,usage,finish};
 }finally{currentId=null;abort=null;}
}
self.onmessage=async({data})=>{const {id,method,payload}=data;
 if(method==='stop'){abort?.abort();if(kind==='gpu')engine?.interruptGenerate();return;}
 try{const result=method==='init'?await init(id,payload):method==='complete'?await complete(id,payload):method==='unload'?(kind==='gpu'?await engine?.unload():kind==='cpu'?await engine?.exit():null):null;send(id,'result',result);}catch(e){send(id,'error',{message:e.message||String(e),name:e.name});}
};
