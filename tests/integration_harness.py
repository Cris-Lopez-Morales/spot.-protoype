"""Opaque-origin, network-free integration fixture.
Production source is bundled to exercise its UI. Only in this harness: IndexedDB,
model/knowledge workers, clipboard, fetch, and durable localStorage are fixtures.
PostMessage uses '*' as target ONLY because srcdoc has an opaque origin. The
production origin and source checks are retained and separately unit tested.
No real LLM output, network load, storage durability or worker performance is tested.
"""
from pathlib import Path
import re,json,base64
from offline_harness import bundle_module,DB_STUB,CLIENT_STUB
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'

def inline_html(file,css):
 html=file.read_text()
 html=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',html)
 html=re.sub(r'<link\b[^>]*>','',html)
 for icon in ['/spot/assets/spot-mark.svg','/icons/mark.svg']:
  html=html.replace(icon,'data:image/svg+xml;base64,'+base64.b64encode((PUBLIC/icon[1:]).read_bytes()).decode())
 return html.replace('</head>','<style>'+'\n'.join((PUBLIC/p).read_text() for p in css)+'</style></head>')

def child_script():
 guide=(PUBLIC/'knowledge/spot-guide.md').read_text()
 script='''const __mods={};
const __storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>__storage.get(k)||null,setItem:(k,v)=>__storage.set(k,String(v)),removeItem:k=>__storage.delete(k)}});
Object.defineProperty(navigator,'storage',{value:{estimate:async()=>({usage:0,quota:100000000}),persist:async()=>false}});
Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__testClipboard=text;}}});
window.fetch=async(url)=>{if(String(url)==='/api/status')return new Response(JSON.stringify({backend:'fixture',model:'TEST FIXTURE',vendorReady:false,testMode:true}));if(String(url)==='/knowledge/spot-guide.md')return new Response(GUIDE);throw Error('Network disabled in integration fixture.');};
'''.replace('GUIDE',json.dumps(guide))
 for name in ['config.js','core.js','math.js','prompts.js','render.js','voice.js','python.js','ingest.js','tools.js','spot-context.js']:
  s=(PUBLIC/'src'/name).read_text()
  if name=='spot-context.js':
   s=s.replace("window.parent!==window&&new URLSearchParams(location.search).get('embed')==='spot'","window.parent!==window")
   s=s.replace('},location.origin)',"},'*')")
  script+=bundle_module(name,s)
 script+=bundle_module('db.js',DB_STUB)
 script+=bundle_module('client.js',CLIENT_STUB)
 script+=bundle_module('agent.js',(PUBLIC/'src/agent.js').read_text())
 script+=bundle_module('app.js',(PUBLIC/'src/app.js').read_text())
 return script

def child_html():
 return inline_html(PUBLIC/'assistant.html',['app.css','assistant-embed.css']).replace('</body>','<script>'+child_script().replace('</script','<\\/script')+'</script></body>')

def parent_html():
 return inline_html(PUBLIC/'index.html',['spot/styles.css','spot/brand.css','spot/assistant-shell.css'])

def parent_script():
 s="const fixtureStorage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>fixtureStorage.get(k)||null,setItem:(k,v)=>fixtureStorage.set(k,String(v)),removeItem:k=>fixtureStorage.delete(k)}});\n"
 for name in ['lincoln-data.js','core.js','place-search.js','map-core.js','map-gestures.js','map-renderer.js','theme.js','app.js','assistant-context.js']:
  s+=(PUBLIC/'spot'/name).read_text()+'\n'
 shell=(PUBLIC/'spot/assistant-shell.js').read_text()
 shell=shell.replace("frame.src='/assistant.html?embed=spot';",'frame.srcdoc='+json.dumps(child_html())+';')
 shell=shell.replace('},origin)',"},'*')")
 s+=shell
 return s
