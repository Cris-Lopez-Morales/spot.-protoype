import {chooseDevice} from './config.js';
export class WorkerRPC {
 constructor(url,{timeout=600000,onCrash=()=>{}}={}){this.url=url;this.timeout=timeout;this.pending=new Map();this.onCrash=onCrash;this.spawn();}
 spawn(){this.worker=new Worker(this.url,{type:'module'});this.worker.onmessage=({data:m})=>{const p=this.pending.get(m.id);if(!p)return;if(m.type==='token')p.onToken?.(m.data);else if(m.type==='progress')p.onProgress?.(m.data);else{clearTimeout(p.timer);this.pending.delete(m.id);if(m.type==='error'){const e=Error(m.data.message);e.name=m.data.name||'Error';p.reject(e);}else p.resolve(m.data);}};this.worker.onerror=e=>{e.preventDefault();this.failAll(Error('A worker stopped unexpectedly. The current draft is preserved. Reload the model or choose a smaller one.'));this.onCrash();};}
 call(method,payload={},events={}){return new Promise((resolve,reject)=>{const id=crypto.randomUUID();const timer=setTimeout(()=>{this.terminate(Error('The operation timed out. Reload the runtime and retry with a smaller model or shorter input.'));this.onCrash();},events.timeout||this.timeout);this.pending.set(id,{resolve,reject,timer,...events});this.worker.postMessage({id,method,payload});});}
 stop(){this.worker.postMessage({method:'stop'});}
 failAll(e){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(e);}this.pending.clear();}
 terminate(e=Error('The runtime was unloaded.')){this.worker.terminate();this.failAll(e);}
}
export async function capabilities(){let adapter=null;try{adapter=await navigator.gpu?.requestAdapter();}catch{}return {gpu:!!adapter,f16:!!adapter?.features.has('shader-f16'),ram:navigator.deviceMemory||null,mobile:matchMedia('(pointer:coarse)').matches&&innerWidth<1000,cores:navigator.hardwareConcurrency||1,isolated:crossOriginIsolated,secure:isSecureContext};}
export class EngineClient{
 constructor(onStatus){this.onStatus=onStatus;this.ready=null;this.rpc=null;}
 async init(settings,caps){this.reset();this.rpc=new WorkerRPC('/workers/model.worker.js',{timeout:1200000,onCrash:()=>{this.ready=null;this.onStatus({message:'Runtime interrupted. Reload to continue.',error:true});}});const selected=chooseDevice(caps,settings);
  if(selected.engine==='gpu'&&!caps.gpu)selected.engine='cpu';
  const attempt=async choice=>this.rpc.call('init',choice,{onProgress:this.onStatus});
  try{this.ready=await attempt(selected);}catch(first){
   if(selected.engine==='gpu'){
    this.onStatus({message:'GPU initialization failed. Trying the smaller CPU model…'});this.rpc.terminate();this.rpc=new WorkerRPC('/workers/model.worker.js');
    try{this.ready=await attempt({...selected,engine:'cpu',size:'small',context:Math.min(selected.context,4096)});}catch(cpu){if(!settings.serverFallback)throw Error(`GPU: ${first.message}\nCPU: ${cpu.message}`);}
   }
   if(!this.ready){if(!settings.serverFallback||selected.engine==='server')throw first;this.onStatus({message:'Using your explicitly enabled local-server fallback…'});this.ready=await attempt({...selected,engine:'server'});}
  }
  return this.ready;
 }
 async complete(messages,settings,events={},schema=null){if(!this.ready)throw Error('Load a model before sending a message.');return this.rpc.call('complete',{messages,temperature:settings.temperature,topP:settings.topP,maxTokens:settings.maxTokens,schema},events);}
 stop(){this.rpc?.stop();}
 reset(){this.rpc?.terminate();this.rpc=null;this.ready=null;}
}
