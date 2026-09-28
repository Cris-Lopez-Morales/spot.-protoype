const params=new URL(location.href).searchParams,nonce=params.get('nonce'),parentOrigin=params.get('parent');let worker=null,timer=null;
// Different port = different origin and storage. The parent sets an exact expected origin.
if(parentOrigin&&nonce)parent.postMessage({type:'sandbox-ready',nonce},parentOrigin);
addEventListener('message',e=>{if(e.source!==parent||e.origin!==parentOrigin||e.data?.nonce!==nonce)return;
 if(e.data.type==='cancel'){worker?.terminate();clearTimeout(timer);worker=null;return;}
 if(e.data.type!=='run'||typeof e.data.code!=='string'||e.data.code.length>4000)return;
 worker?.terminate();worker=new Worker('/python.worker.js',{type:'module'});let settled=false;
 const done=(result)=>{if(settled)return;settled=true;clearTimeout(timer);worker?.terminate();worker=null;parent.postMessage({type:'sandbox-result',nonce,result},parentOrigin);};
 timer=setTimeout(()=>done({error:'Python runtime initialization timed out.'}),90000);
 worker.onmessage=({data})=>{if(data.type==='running'){clearTimeout(timer);timer=setTimeout(()=>done({error:'Execution stopped after 8 seconds.'}),8000);}else if(data.type==='result')done({output:String(data.output||'').slice(0,20000),error:data.error?String(data.error).slice(0,2000):null});};
 worker.onerror=e=>done({error:e.message||'Sandbox worker failed.'});worker.postMessage({code:e.data.code});
});
