import {EMBED_MODEL,RERANK_MODEL,MODELS} from '../src/config.js';
import {chunkText,hybridSearch,conservativeTokens} from '../src/core.js';
let lib=null,extractor=null,ranker=null,rankTokenizer=null,tokenizer=null,tokenizerFamily='',manifest=null,tokenizerFailed=false;
const emit=(id,type,data)=>postMessage({id,type,data});
async function library(){if(!lib){lib=await import('/vendor/transformers/transformers.web.js');lib.env.allowLocalModels=true;lib.env.localModelPath='/models/';lib.env.useBrowserCache=true;lib.env.backends.onnx.wasm.wasmPaths='/vendor/ort/';lib.env.backends.onnx.wasm.numThreads=1;lib.env.backends.onnx.wasm.proxy=false;}return lib;}
async function locationFor(repo){if(!manifest){try{const r=await fetch('/models/manifest.json');manifest=r.ok?await r.json():{};}catch{manifest={};}}return manifest.repositories?.[repo]||repo;}
async function embeddings(id){const {pipeline}=await library();if(!extractor)extractor=await pipeline('feature-extraction',await locationFor(EMBED_MODEL),{dtype:'q8',device:'wasm',progress_callback:p=>emit(id,'progress',{message:`Embeddings: ${p.file||p.status}`,value:p.progress!=null?p.progress/100:null})});return extractor;}
async function embed(id,text){const fn=await embeddings(id);const result=await fn(text,{pooling:'mean',normalize:true,truncation:true,max_length:256});return Array.from(result.data);}
async function count(id,{messages,size,approximate=false}){
 if(approximate||tokenizerFailed)return {tokens:conservativeTokens(messages),mode:'conservative estimate'};
 try{const family=MODELS[size]?.family||MODELS.small.family;if(tokenizerFamily!==family){const {AutoTokenizer}=await library();tokenizer=await AutoTokenizer.from_pretrained(await locationFor(family));tokenizerFamily=family;}
  const tokens=tokenizer.apply_chat_template(messages,{tokenize:true,add_generation_prompt:true});const n=tokens?.input_ids?.data?.length??tokens?.input_ids?.length??tokens?.data?.length??tokens?.length;if(!Number.isFinite(n))throw Error('Unsupported tokenizer result.');return {tokens:n+32,mode:'model tokenizer + 32-token margin'};
 }catch{tokenizerFailed=true;return {tokens:conservativeTokens(messages),mode:'conservative estimate'};}
}
self.onmessage=async({data:{id,method,payload}})=>{try{let result;
 if(method==='count')result=await count(id,payload);
 else if(method==='chunk')result=payload.pages.flatMap(p=>chunkText(p.text,{size:payload.size||800,overlap:payload.overlap??120}).map(c=>({...c,page:p.page||null})));
 else if(method==='embed')result=await embed(id,payload.text);
 else if(method==='index'){
  const rows=[];for(let i=0;i<payload.chunks.length;i++){const chunk=payload.chunks[i];rows.push({...chunk,vector:await embed(id,chunk.text),embeddingModel:EMBED_MODEL});emit(id,'progress',{message:`Embedding passage ${i+1} of ${payload.chunks.length}`,value:(i+1)/payload.chunks.length});}result=rows;
 }else if(method==='search'){
  let vector=null,warning='';if(payload.embeddings)try{vector=await embed(id,payload.query);}catch(e){warning=`Semantic search unavailable; using keyword retrieval. ${e.message}`;}
  let rows=hybridSearch(payload.query,payload.chunks,vector,payload.rerank?10:5);
  if(payload.rerank&&rows.length){try{const {AutoTokenizer,AutoModelForSequenceClassification}=await library();if(!ranker){const path=await locationFor(RERANK_MODEL);rankTokenizer=await AutoTokenizer.from_pretrained(path);ranker=await AutoModelForSequenceClassification.from_pretrained(path,{dtype:'q8',device:'wasm'});}for(const row of rows){const input=rankTokenizer(payload.query,{text_pair:row.text,truncation:true,max_length:512});const out=await ranker(input);row.rerankScore=Number(out.logits.data[0]);}rows.sort((a,b)=>b.rerankScore-a.rerankScore);}catch(e){warning+=` Cross-encoder unavailable; retaining local hybrid/diversity ranking. ${e.message}`;}}
  result={rows:rows.slice(0,5),warning};
 }else if(method==='reset'){extractor?.dispose?.();ranker?.dispose?.();extractor=null;ranker=null;tokenizer=null;tokenizerFamily='';tokenizerFailed=false;manifest=null;result=true;}
 else throw Error('Unknown knowledge operation.');emit(id,'result',result);
 }catch(e){emit(id,'error',{message:e.message||String(e),name:e.name});}};
