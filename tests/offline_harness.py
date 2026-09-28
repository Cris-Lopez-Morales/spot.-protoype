"""Network-free UI test harness. Storage, model, tokenizer and fetch are explicit mocks.
This renders and exercises the actual app.js; it does NOT evaluate real inference,
IndexedDB persistence, service workers, vendor libraries, or model-worker integration.
No browser security policy is disabled and no navigation/network is attempted.
"""
from pathlib import Path
import re, base64, json
ROOT=Path(__file__).resolve().parents[1]

def bundle_module(name, source):
    exports=set(re.findall(r'export\s+(?:async\s+)?(?:function|class|const|let)\s+(\w+)',source))
    def imports(m):
        raw,path=m.group(1).strip(),m.group(2)
        dep=Path(path).name
        if raw.startswith('* as '):
            return f"const {raw[5:]}=__mods[{json.dumps(dep)}];"
        if raw.startswith('{'):
            raw=re.sub(r'\b(\w+)\s+as\s+(\w+)',r'\1: \2',raw)
            return f"const {raw}=__mods[{json.dumps(dep)}];"
        raise ValueError('Unsupported harness import '+raw)
    source=re.sub(r"import\s+([^;]+?)\s+from\s+['\"]([^'\"]+)['\"];",imports,source)
    source=re.sub(r'\bexport\s+','',source)
    # Several export declarations deliberately use semicolon-separated exports.
    return f"__mods[{json.dumps(name)}]=(()=>{{\n{source}\nreturn {{{','.join(sorted(exports))}}};\n}})();\n"

DB_STUB='''
const state={chats:[],documents:[],chunks:[],memories:[],settings:[]};window.__testDB=state;
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
export async function openDB(){return true;}
export async function all(s){return clone(state[s]);}
export async function get(s,id){return clone(state[s].find(r=>r.id===id));}
export async function put(s,row){const i=state[s].findIndex(r=>r.id===row.id);if(i<0)state[s].push(clone(row));else state[s][i]=clone(row);return row.id;}
export async function remove(s,id){state[s]=state[s].filter(r=>r.id!==id);}
export async function clear(s){state[s]=[];}
export async function putMany(s,rows){for(const r of rows)await put(s,r);}
export async function replaceDocument(doc,chunks){await put('documents',doc);await putMany('chunks',chunks);}
export async function removeDocument(id){await remove('documents',id);state.chunks=state.chunks.filter(r=>r.documentId!==id);}
'''
CLIENT_STUB='''
export async function capabilities(){return {gpu:false,f16:false,ram:4,mobile:innerWidth<760,cores:4,isolated:false,secure:false};}
export class WorkerRPC{
 constructor(){}stop(){}terminate(){}
 async call(method,p){const c=__mods['core.js'];if(method==='count')return {tokens:Math.ceil(p.messages.reduce((n,m)=>n+m.content.length,0)/4),mode:'TEST tokenizer estimate'};
 if(method==='chunk')return p.pages.flatMap(page=>c.chunkText(page.text).map(row=>({...row,page:page.page})));
 if(method==='search')return {rows:c.hybridSearch(p.query,p.chunks,null,5),warning:''};
 if(method==='index')return p.chunks.map(c=>({...c,vector:[1,0],embeddingModel:'TEST FIXTURE'}));return true;}
}
export class EngineClient{
 constructor(status){this.status=status;this.ready=null;this.cancelled=false;}
 async init(settings){this.cancelled=false;this.status({message:'TEST FIXTURE runtime',value:.5});await new Promise(r=>setTimeout(r,50));this.ready={engine:'server',size:'small',context:4096,model:'TEST FIXTURE'};return this.ready;}
 async complete(messages,settings,events={},schema=null){this.cancelled=false;const query=messages.at(-1).content;let text;
 if(schema?.properties?.tool){const d=JSON.parse(query);text=JSON.stringify(d.request.includes('19*4')&&!d.tool_results.length?{tool:'calculator',input:'19*4'}:{tool:'answer',input:''});}
 else if(schema?.properties?.facts){text=JSON.stringify({facts:query.includes('I prefer short explanations')?[{kind:'preference',fact:'The user prefers short explanations.',evidence:'I prefer short explanations'}]:[]});}
 else if(messages[0].content.startsWith('Summarize older'))text='TEST SUMMARY: The user is discussing a local app.';
 else if(query.includes('19*4'))text='19 × 4 = 76.';
 else if(query.includes('Spot'))text='Spot is a prototype for checking recent venue activity. Its sample counts are fictional and do not establish total occupancy. [S1]';
 else if(query.includes('long'))text='This is a deliberately long scripted fixture answer for testing stop and streaming. '.repeat(14);
 else text='This is a scripted test response. No real model is running in this test harness.';
 const parts=text.match(/.{1,16}/gs)||[];for(const token of parts){if(this.cancelled)throw new DOMException('Stopped','AbortError');events.onToken?.(token);await new Promise(r=>setTimeout(r,schema?1:12));}
 return {text,usage:{prompt_tokens:100,completion_tokens:parts.length},finish:'stop'};}
 stop(){this.cancelled=true;}reset(){this.cancelled=true;this.ready=null;}
}
'''

def offline_html():
    html=(ROOT/'public/index.html').read_text()
    html=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',html)
    html=re.sub(r'<link\b[^>]*>','',html)
    svg=base64.b64encode((ROOT/'public/icons/mark.svg').read_bytes()).decode()
    html=html.replace('/icons/mark.svg','data:image/svg+xml;base64,'+svg)
    return html.replace('</head>','<style>'+(ROOT/'public/app.css').read_text()+'</style></head>')

def offline_script():
    guide=(ROOT/'public/knowledge/spot-guide.md').read_text()
    s='''const __mods={};
const __storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>__storage.get(k)||null,setItem:(k,v)=>__storage.set(k,String(v)),removeItem:k=>__storage.delete(k)}});
Object.defineProperty(navigator,'storage',{value:{estimate:async()=>({usage:0,quota:100000000}),persist:async()=>false}});
Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__testClipboard=text;}}});
window.fetch=async(url,options)=>{if(String(url)==='/api/status')return new Response(JSON.stringify({backend:'fixture',model:'TEST FIXTURE',vendorReady:false,testMode:true}));if(String(url)==='/knowledge/spot-guide.md')return new Response(GUIDE);throw Error('Network is disabled in the offline UI harness.');};
'''.replace('GUIDE',json.dumps(guide))
    for name in ['config.js','core.js','math.js','prompts.js','render.js','voice.js','python.js','ingest.js','tools.js']:
        s+=bundle_module(name,(ROOT/'public/src'/name).read_text())
    s+=bundle_module('db.js',DB_STUB)
    s+=bundle_module('client.js',CLIENT_STUB)
    s+=bundle_module('agent.js',(ROOT/'public/src/agent.js').read_text())
    s+=bundle_module('app.js',(ROOT/'public/src/app.js').read_text())
    return s
