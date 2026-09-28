#!/usr/bin/env node
/** First-run local launcher. Never downloads a model or sends chat content. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<16)){console.error('Spot requires Node.js 22.16.0 or newer. Install it, then open Start Spot again.');process.exit(1);}
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(args){const r=spawnSync(npm,args,{cwd:root,stdio:'inherit',shell:process.platform==='win32'});if(r.error||r.status!==0){console.error('\nSetup did not finish. Check your connection, then run Start Spot again. No model was downloaded.');process.exit(r.status||1);}}
const fingerprint=crypto.createHash('sha256').update(fs.readFileSync('package.json')).digest('hex');
const stamp=path.join(root,'public/vendor/spot-package.sha256');
if(!fs.existsSync(stamp)||fs.readFileSync(stamp,'utf8').trim()!==fingerprint){
 console.log('Preparing Spot and its local-AI libraries. This first setup needs internet. Models download only after your approval inside Ask Spot.');
 run(fs.existsSync('package-lock.json')?['ci','--ignore-scripts']:['install','--ignore-scripts']);run(['run','vendor']);
 fs.writeFileSync(stamp,fingerprint+'\n');
}
const server=spawn(process.execPath,['server.mjs'],{cwd:root,stdio:'inherit',env:process.env});
const url=process.env.PUBLIC_ORIGIN||`http://localhost:${process.env.PORT||4318}`;
let timer;server.on('exit',code=>{clearInterval(timer);process.exitCode=code||0;});
function openBrowser(){const command=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open';const args=process.platform==='win32'?['/c','start','',url]:[url];const child=spawn(command,args,{stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();}
let tries=0;timer=setInterval(async()=>{if(++tries>20){clearInterval(timer);console.log(`Open ${url} when the server is ready.`);return;}try{const r=await fetch(url+'/api/status',{signal:AbortSignal.timeout(700)});if(r.ok){clearInterval(timer);openBrowser();console.log('\nSpot is ready. Click Ask Spot in the top bar. Leave this window open; Ctrl+C stops the server.');}}catch{}},800);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));
