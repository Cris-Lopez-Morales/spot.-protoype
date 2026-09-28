import {LIMITS} from './config.js';
export function words(text){return (String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>1);}
export function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function uid(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export function normalizeText(text){return String(text).replace(/\u0000/g,'').replace(/\r\n?/g,'\n').trim();}
export function conservativeTokens(messages){return messages.reduce((n,m)=>n+new TextEncoder().encode(m.content||'').length+16,8);}
export function chunkText(text,{size=800,overlap=120}={}) {
 if(!Number.isInteger(size)||size<100||size>4000||overlap<0||overlap>=size)throw Error('Invalid chunk size or overlap.');
 const input=normalizeText(text);const chunks=[];let start=0;
 while(start<input.length){let end=Math.min(start+size,input.length);if(end<input.length){const cut=Math.max(input.lastIndexOf('\n',end),input.lastIndexOf('. ',end),input.lastIndexOf(' ',end));if(cut>start+size*.55)end=cut+1;}
 const value=input.slice(start,end).trim();if(value)chunks.push({text:value,start,end});if(end===input.length)break;start=Math.max(start+1,end-overlap);}
 return chunks;
}
export function cosine(a,b){if(!a||!b||a.length!==b.length)return 0;let sum=0,aa=0,bb=0;for(let i=0;i<a.length;i++){sum+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?sum/Math.sqrt(aa*bb):0;}
export function bm25(query,items){
 const q=[...new Set(words(query))];const docs=items.map(d=>words(d.text));const avg=docs.reduce((a,d)=>a+d.length,0)/Math.max(docs.length,1)||1;
 const dfs=new Map(q.map(w=>[w,docs.filter(d=>d.includes(w)).length]));
 return items.map((item,i)=>{const list=docs[i];const score=q.reduce((total,w)=>{const count=list.filter(t=>t===w).length;const df=dfs.get(w);return total+Math.log(1+(items.length-df+.5)/(df+.5))*count*2.2/(count+1.2*(.25+.75*list.length/avg));},0);return {...item,lexical:score};}).sort((a,b)=>b.lexical-a.lexical);
}
export function hybridSearch(query,items,vector=null,limit=10){
 if(!items.length||!query.trim())return [];
 const lexical=bm25(query,items).filter(r=>r.lexical>0);const vectors=vector?items.filter(d=>d.vector?.length===vector.length).map(d=>({...d,semantic:cosine(vector,d.vector)})).filter(d=>d.semantic>.18).sort((a,b)=>b.semantic-a.semantic):[];
 const scores=new Map();
 [lexical,vectors].forEach(list=>list.slice(0,40).forEach((d,i)=>{const old=scores.get(d.id)||{...d,score:0};scores.set(d.id,{...old,score:old.score+1/(60+i+1)});}));
 // Second-stage diversity reranking: penalize near-identical overlapping chunks.
 const pool=[...scores.values()].sort((a,b)=>b.score-a.score).slice(0,24),selected=[];
 while(pool.length&&selected.length<limit){let best=0,bestScore=-Infinity;pool.forEach((d,i)=>{const set=new Set(words(d.text));const redundancy=selected.reduce((m,s)=>{const sw=new Set(words(s.text));const shared=[...set].filter(x=>sw.has(x)).length;return Math.max(m,shared/Math.max(1,new Set([...set,...sw]).size));},0);const score=d.score*(1-.45*redundancy);if(score>bestScore){bestScore=score;best=i;}});selected.push(pool.splice(best,1)[0]);}
 return selected;
}
export function safeWebURL(raw,base){try{const u=new URL(raw,base);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;return u.href;}catch{return null;}}
export function safeSiteURL(raw,base){const u=safeWebURL(raw,base);if(!u||new URL(u).origin!==new URL(base).origin)throw Error('Import pages from this app’s own origin, or upload a saved HTML file. Cross-site fetching is not enabled.');const p=new URL(u).pathname;if(p.startsWith('/api/')||p.startsWith('/vendor/')||p.startsWith('/models/'))throw Error('That is not a site content page.');return u;}
export function parseTool(text){let value;try{value=JSON.parse(text);}catch{throw Error('The model returned invalid tool JSON. Nothing was executed.');}
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['tool','input'].includes(k))||typeof value.tool!=='string'||typeof value.input!=='string')throw Error('Tool output does not match its schema.');
 if(!['answer','calculator','datetime','convert','site_search','wikipedia','python'].includes(value.tool)||value.input.length>4000)throw Error('Unrecognized tool or oversized input.');return value;
}
export function citationIds(text){return [...new Set([...String(text).matchAll(/\[S(\d+)\]/g)].map(m=>`S${m[1]}`))];}
export function validateImport(data){
 if(!data||data.format!=='local-chat-export'||data.version!==1||!Array.isArray(data.chats)||data.chats.length>LIMITS.chats)throw Error('Not a supported Local Chat export.');
 return data.chats.map(c=>{if(!c||typeof c.title!=='string'||!Array.isArray(c.messages)||c.messages.length>LIMITS.messages)throw Error('Invalid conversation in import.');return {id:uid(),title:c.title.slice(0,120),created:Date.now(),updated:Date.now(),summary:'',summarizedIds:[],messages:c.messages.map(m=>{if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>LIMITS.outputChars)throw Error('Invalid message in import.');return {id:uid(),role:m.role,content:m.content,created:Date.now(),status:'complete',sources:[]};})};});
}
export function validatedMemories(raw,userText){
 let d;try{d=JSON.parse(raw);}catch{return [];}
 if(!Array.isArray(d?.facts))return [];
 return d.facts.filter(f=>f&&typeof f.fact==='string'&&typeof f.evidence==='string'&&['name','preference','project'].includes(f.kind)&&f.fact.length>2&&f.fact.length<=180&&f.evidence.length>=5&&userText.includes(f.evidence)).slice(0,3).map(f=>({fact:f.fact,kind:f.kind,evidence:f.evidence}));
}
export async function fitContext(system,history,count,budget){
 const retained=history.filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content,id:m.id}));let dropped=[];
 while(retained.length&&retained[0].role!=='user')dropped.push(retained.shift());
 while(await count([{role:'system',content:system},...retained])>budget&&retained.filter(m=>m.role==='user').length>1){dropped.push(retained.shift());while(retained.length&&retained[0].role!=='user')dropped.push(retained.shift());}
 const messages=[{role:'system',content:system},...retained.map(({role,content})=>({role,content}))];const tokens=await count(messages);
 if(tokens>budget)throw Error('This message plus instructions exceeds the context budget. Shorten the message or custom prompt, reduce retrieved sources, or choose a larger context. Your message is saved.');
 return {messages,dropped,tokens};
}
