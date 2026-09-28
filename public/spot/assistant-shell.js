/* Lazy embedded local assistant. Keeps Spot's map DOM and gesture engine intact. */
(function(){
 'use strict';
 const trigger=document.getElementById('askSpot');
 const panel=document.getElementById('spotAssistantPanel');
 const host=document.getElementById('spotAssistantBody');
 let frame=null,ready=false,opened=false,timer=null,lastFocus=null,lastContext='',requestId=0;
 const origin=location.origin;
 function send(type,extra={}){if(frame?.contentWindow&&ready)frame.contentWindow.postMessage({channel:'spot-assistant-v1',type,...extra},origin);}
 function context(){return SpotAssistantContext.snapshot(SpotCore,SpotDemo,SpotPlaceSearch);}
 function sync(force=false){if(!opened||!ready)return;const data=context();const hash=JSON.stringify({...data,capturedAt:0});if(force||hash!==lastContext){lastContext=hash;send('context',{data});}send('theme',{theme:document.documentElement.dataset.theme==='dark'?'dark':'light'});}
 function open(){
  if(opened){frame?.contentWindow?.focus();return;}
  lastFocus=document.activeElement;opened=true;panel.hidden=false;panel.inert=false;trigger.setAttribute('aria-expanded','true');document.body.classList.add('spot-assistant-open');
  if(!frame){
   frame=document.createElement('iframe');frame.id='spotAssistantFrame';frame.title='Ask Spot — private local AI assistant';frame.src='/assistant.html?embed=spot';frame.allow='microphone self';
   frame.addEventListener('load',()=>{if(!ready){host.querySelector('.assistant-loading')?.remove();}});
   host.append(frame);
  }
  sync(true);send('show');clearInterval(timer);timer=setInterval(()=>sync(),1500);
  document.getElementById('closeSpotAssistant').focus({preventScroll:true});
 }
 function close(){if(!opened)return;send('pause');opened=false;panel.hidden=true;panel.inert=true;trigger.setAttribute('aria-expanded','false');document.body.classList.remove('spot-assistant-open');clearInterval(timer);const target=lastFocus?.isConnected?lastFocus:trigger;target.focus({preventScroll:true});}
 trigger.addEventListener('click',()=>opened?close():open());document.getElementById('closeSpotAssistant').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();e.stopImmediatePropagation();close();}},true);
 window.addEventListener('spot-theme-change',()=>sync(true));
 window.addEventListener('message',e=>{
  if(e.origin!==origin||e.source!==frame?.contentWindow||e.data?.channel!=='spot-assistant-v1')return;
  const message=e.data;
  if(message.type==='ready'){ready=true;host.querySelector('.assistant-loading')?.remove();sync(true);if(opened)send('show');}
  else if(message.type==='request-context'){const id=message.requestId;if(typeof id!=='number')return;send('context',{data:context(),requestId:id});}
  else if(message.type==='close')close();
  else if(message.type==='navigate'&&opened&&SpotAssistantContext.validAction(message.action,SpotCore,SpotPlaceSearch)){
   const ok=window.SpotAssistantMap?.navigate(message.action);if(ok)close();
  }
 });
 document.addEventListener('spot-ask-place',e=>{open();const id=e.detail?.id;if(SpotCore.venueById(id)){const prompt=`Explain ${SpotCore.venueById(id).name} using the demo data. What can its activity count tell me?`;const wait=setInterval(()=>{if(ready){clearInterval(wait);sync(true);send('draft',{text:prompt});}},100);setTimeout(()=>clearInterval(wait),5000);}});
 window.addEventListener('pagehide',()=>clearInterval(timer));
})();
