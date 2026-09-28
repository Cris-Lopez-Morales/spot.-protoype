#!/usr/bin/env node
/** Start the static project without package installation or an internet connection. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major<22 || major===22 && minor<16) { console.error('Use Node.js 22.16.0 or newer, or open the included standalone HTML without Node.'); process.exit(1); }
const server = spawn(process.execPath, ['server.mjs'], { cwd:root, stdio:'inherit', env:process.env });
const scheme = process.env.TLS_CERT && process.env.TLS_KEY ? 'https' : 'http';
const url = process.env.PUBLIC_ORIGIN || `${scheme}://localhost:${process.env.PORT || 4318}`;
let attempts=0,ready=false,timer;
function openBrowser() {
  if(process.env.NO_OPEN==='1')return;
  const command=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open';
  const args=process.platform==='win32'?['/c','start','',url]:[url];
  const child=spawn(command,args,{stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
}
server.on('error',error=>{clearInterval(timer);console.error(error.message);process.exitCode=1;});
server.on('exit',code=>{clearInterval(timer);process.exitCode=code||0;});
timer=setInterval(async()=>{
  if(++attempts>20){clearInterval(timer);console.log(`Open ${url} when ready.`);return;}
  try { const response=await fetch(url+'/health',{signal:AbortSignal.timeout(600)});const status=await response.json();
    if(status.ok&&status.version==='4.7.0'&&!ready){ready=true;clearInterval(timer);openBrowser();console.log('Spot is ready. No dependencies or models to download. Leave this window open; Ctrl+C stops the server.');}
  } catch {}
},500);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));
