import {loadPyodide} from '/pyodide/pyodide.mjs';
self.onmessage=async({data})=>{let output='';const append=s=>{output+=(s+'\n');if(output.length>20000)throw Error('Output limit reached.');};try{
 const py=await loadPyodide({indexURL:'/pyodide/',stdout:append,stderr:append});
 // Defense in depth: CSP permits only this dedicated asset origin; then disable direct network APIs.
 self.fetch=()=>Promise.reject(Error('Network disabled during execution.'));self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.EventSource=undefined;self.importScripts=()=>{throw Error('Additional scripts disabled.');};
 postMessage({type:'running'});const value=await py.runPythonAsync(data.code);if(value!==undefined){append(String(value));value?.destroy?.();}postMessage({type:'result',output});
 }catch(e){postMessage({type:'result',output,error:e.message||String(e)});}};
