import {calculate,convert,dateTime} from './math.js';
export async function executeTool(call,{settings,query,search,approve,python,signal}){
 if(signal?.aborted)throw new DOMException('Stopped','AbortError');
 if(call.tool==='calculator')return calculate(call.input);
 if(call.tool==='datetime')return dateTime(call.input);
 if(call.tool==='convert'){let args;try{args=JSON.parse(call.input);}catch{throw Error('Conversion arguments are not valid JSON.');}if(!args||Object.keys(args).some(k=>!['value','from','to'].includes(k)))throw Error('Invalid conversion arguments.');return convert(args);}
 if(call.tool==='site_search')return await search(call.input);
 if(call.tool==='wikipedia'){
  if(!settings.wikipedia||!(/\bwikipedia\b/i.test(query)))throw Error('Wikipedia is off or was not explicitly requested by the user.');
  const q=call.input.trim();if(!q||q.length>160)throw Error('Wikipedia query must be between 1 and 160 characters.');
  if(!await approve({title:'Send this public query to Wikipedia?',body:q,detail:'Wikipedia will receive this query and your server’s network address. No other chat content is included.'}))return {cancelled:true};
  const r=await fetch('/api/wiki',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q}),signal});const d=await r.json();if(!r.ok)throw Error(d.error||'Wikipedia lookup failed.');return d;
 }
 if(call.tool==='python'){
  if(!settings.python||!(/\b(run|execute)\b[\s\S]{0,80}\bpython\b|\bpython\b[\s\S]{0,80}\b(run|execute)\b/i.test(query)))throw Error('Python is off or the user did not explicitly request execution.');
  if(!await approve({title:'Run this Python in the isolated local sandbox?',body:call.input,detail:'No chat/database access is supplied. Network access is restricted. Heavy code may still consume memory; each run is terminated after its time limit.'}))return {cancelled:true};
  return python(call.input,signal);
 }
 throw Error('This tool is not executable.');
}
