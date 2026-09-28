export async function runPython(code,signal){
 const status=await(await fetch('/api/status')).json();if(!status.sandboxOrigin)throw Error('The isolated local sandbox is not configured.');
 const origin=new URL(status.sandboxOrigin).origin;if(origin===location.origin)throw Error('Python must run on a separate origin.');
 return new Promise((resolve,reject)=>{const frame=document.createElement('iframe');const nonce=crypto.randomUUID();frame.hidden=true;frame.title='Isolated Python execution';frame.sandbox='allow-scripts allow-same-origin';frame.src=`${origin}/?nonce=${nonce}&parent=${encodeURIComponent(location.origin)}`;let ended=false;
 const finish=(error,result)=>{if(ended)return;ended=true;clearTimeout(timer);removeEventListener('message',listener);signal?.removeEventListener('abort',cancel);frame.contentWindow?.postMessage({type:'cancel',nonce},origin);frame.remove();error?reject(error):resolve(result);};
 const cancel=()=>finish(new DOMException('Stopped','AbortError'));
 const listener=e=>{if(e.source!==frame.contentWindow||e.origin!==origin||e.data?.nonce!==nonce)return;if(e.data.type==='sandbox-ready')frame.contentWindow.postMessage({type:'run',nonce,code},origin);if(e.data.type==='sandbox-result'){const result=e.data.result;if(result&&typeof result==='object')finish(null,{output:String(result.output||'').slice(0,20000),error:result.error?String(result.error).slice(0,2000):null});}};
 const timer=setTimeout(()=>finish(Error('The isolated sandbox did not respond. Check the second local port and install the Pyodide assets.')),105000);addEventListener('message',listener);signal?.addEventListener('abort',cancel,{once:true});document.body.append(frame);if(signal?.aborted)cancel();
 });
}
