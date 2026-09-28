export const APP_VERSION = '4.5.0';
export const LIMITS = Object.freeze({input:12000, system:4000, fileBytes:20*1024*1024, textChars:600000, documents:60, chunks:6000, chats:100, messages:500, outputChars:40000, toolSteps:3});
export const DEFAULTS = Object.freeze({theme:'system', engine:'auto', size:'auto', context:4096, maxTokens:640, temperature:0.35, topP:0.9, persona:'spot', system:'', rag:true, embeddings:false, rerank:false, memory:false, tools:true, wikipedia:false, python:false, serverFallback:false, summary:true, speech:false});
export const PERSONAS = Object.freeze({helpful:'Be a helpful, direct assistant. Explain assumptions and uncertainty.', tutor:'Teach clearly. Use a small worked example; ask one check-for-understanding question when useful.', builder:'Be a careful software engineer. Provide runnable code, state version assumptions, and never claim tests ran unless tool results show it.', concise:'Answer in a few clear sentences unless the user requests detail.', spot:'You are Ask Spot, embedded in the Spot map. Use supplied public demo venue excerpts and area lists, not guesses. Every business and count is fictional. No real occupancy, seats, hours, GPS or private friend data is available. Missing activity is unknown, not empty. Mention demo status when recommending a place. Current source excerpts supersede old counts in chat history. Source cards may include user-clicked Show on map buttons; do not claim you moved the map yourself. Keep answers brief.'});
export const MODELS = Object.freeze({
  small:{name:'Qwen 2.5 · 0.5B',family:'Qwen/Qwen2.5-0.5B-Instruct',mlc:'Qwen2.5-0.5B-Instruct',ggufRepo:'Qwen/Qwen2.5-0.5B-Instruct-GGUF',ggufFile:'qwen2.5-0.5b-instruct-q4_k_m.gguf',estimate:'About 0.4–0.6 GB download',memory:'Plan for 1–2 GB free memory',license:'Apache-2.0'},
  balanced:{name:'Qwen 2.5 · 1.5B',family:'Qwen/Qwen2.5-1.5B-Instruct',mlc:'Qwen2.5-1.5B-Instruct',ggufRepo:'Qwen/Qwen2.5-1.5B-Instruct-GGUF',ggufFile:'qwen2.5-1.5b-instruct-q4_k_m.gguf',estimate:'About 1–1.3 GB download',memory:'Plan for 2–3 GB free memory',license:'Apache-2.0'},
  large:{name:'Qwen 2.5 · 7B',family:'Qwen/Qwen2.5-7B-Instruct',mlc:'Qwen2.5-7B-Instruct',ggufRepo:'Qwen/Qwen2.5-7B-Instruct-GGUF',ggufFile:'qwen2.5-7b-instruct-q4_k_m.gguf',estimate:'About 4.5–5 GB download',memory:'Plan for 6–8+ GB free memory',license:'Apache-2.0'}
});
export const EMBED_MODEL='Xenova/all-MiniLM-L6-v2';
export const RERANK_MODEL='Xenova/ms-marco-MiniLM-L-6-v2';
export function normalizeSettings(input={}) {
 const result={...DEFAULTS};
 for(const key of Object.keys(DEFAULTS)) {
  const v=input[key]; if(v===undefined)continue;
  if(typeof DEFAULTS[key]==='boolean')result[key]=v===true;
  else if(typeof DEFAULTS[key]==='string'&&typeof v==='string')result[key]=v;
  else if(typeof DEFAULTS[key]==='number'&&Number.isFinite(v))result[key]=v;
 }
 for(const [key,values] of Object.entries({theme:['light','dark','system'],engine:['auto','gpu','cpu','server'],size:['auto','small','balanced','large'],persona:Object.keys(PERSONAS)}))if(!values.includes(result[key]))result[key]=DEFAULTS[key];
 result.context=Math.round(Math.max(2048,Math.min(8192,result.context)));
 result.maxTokens=Math.round(Math.max(128,Math.min(1536,result.maxTokens)));
 result.temperature=Math.max(0,Math.min(1.5,result.temperature)); result.topP=Math.max(0.1,Math.min(1,result.topP));
 result.system=result.system.slice(0,LIMITS.system); return result;
}
export function chooseDevice(caps,settings) {
 const small=!!caps.mobile||!caps.ram||caps.ram<8;
 let engine=settings.engine==='auto'?(caps.gpu?'gpu':'cpu'):settings.engine;
 const size=settings.size==='auto'? (engine==='gpu'&&!small?'balanced':'small'):settings.size;
 return {engine,size,context:small?Math.min(settings.context,4096):settings.context,f16:!!caps.f16};
}
