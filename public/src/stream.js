export async function* readJSONStream(response,format='sse',signal){
 if(!response.ok){let text=await response.text();throw Error(`Server ${response.status}: ${text.slice(0,300)}`);}if(!response.body)throw Error('The server returned no response stream.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',seenDone=false;
 try{while(true){if(signal?.aborted)throw new DOMException('Stopped','AbortError');const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});if(buffer.length>2000000)throw Error('Oversized streaming event.');
  let boundary;while((boundary=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,boundary).replace(/\r$/,'');buffer=buffer.slice(boundary+1);if(!line.trim()||line.startsWith(':'))continue;let data=line;if(format==='sse'){if(!line.startsWith('data:'))continue;data=line.slice(5).trim();}if(data==='[DONE]'){seenDone=true;return;}let event;try{event=JSON.parse(data);}catch{throw Error('The server sent malformed streaming JSON.');}if(event.error)throw Error(typeof event.error==='string'?event.error:JSON.stringify(event.error));if(event.done)seenDone=true;yield event;}
  if(done){if(buffer.trim()){let last=buffer.trim();if(format==='sse'&&last.startsWith('data:'))last=last.slice(5).trim();if(last==='[DONE]')seenDone=true;else{const event=JSON.parse(last);if(event.error)throw Error(String(event.error));if(event.done)seenDone=true;yield event;}}break;}}
 }finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 if(!seenDone)throw Error('The connection ended before a completion marker. The partial answer was preserved.');
}
