/** Optional real-server transport smoke test. This is not a model-quality or agent evaluation. */
import fs from 'node:fs/promises';
import {readJSONStream} from '../public/src/stream.js';
const base=process.env.TEST_URL||'http://127.0.0.1:4318';
const status=await(await fetch(new URL('/api/status',base))).json();
if(status.testMode)throw Error('Refusing a scripted test fixture. Start the app with a real local backend.');
if(!status.backend)throw Error('Configure LOCAL_BACKEND=ollama or llamacpp first.');
const health=await fetch(new URL('/api/backend-health',base));
if(!health.ok)throw Error((await health.json()).error||'Local model not ready.');
const prompt='Reply with a short explanation of why an app-user count does not establish a venue’s total occupancy.';
const started=performance.now();let firstToken=null,text='',usage=null;
const response=await fetch(new URL('/api/generate',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'system',content:'Be accurate and concise. Do not claim live data access.'},{role:'user',content:prompt}],temperature:0.2,max_tokens:180}),signal:AbortSignal.timeout(180000)});
for await(const row of readJSONStream(response,response.headers.get('x-stream-format')||'sse')){const token=row.message?.content??row.choices?.[0]?.delta?.content??'';if(token){firstToken??=performance.now();text+=token;process.stdout.write(token);}if(row.usage)usage=row.usage;if(row.eval_count!=null)usage={completion_tokens:row.eval_count,prompt_tokens:row.prompt_eval_count};}
if(!text.trim())throw Error('The real model returned no answer.');
const report={kind:'real own-server transport smoke, not quality grading',backend:status.backend,model:status.model,elapsedMs:Math.round(performance.now()-started),firstTokenMs:firstToken?Math.round(firstToken-started):null,usage,prompt,answer:text,quality:'NOT AUTOMATICALLY GRADED. Follow docs/EVALUATION.md.'};
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/live-server-result.json',JSON.stringify(report,null,2));console.log('\n\nSaved artifacts/live-server-result.json.');
