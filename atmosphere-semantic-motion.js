/* Atmosphere semantic motion. Replace the old tap-motion IIFE; do not run both. */
(function(){'use strict';
 if(window.AtmosphereMotion?.semanticVersion)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)'),NS='http://www.w3.org/2000/svg';
 const ICONS={"map":"<path d=\"m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z\"/><path d=\"M9 3v15M15 6v15\"/>","compass":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z\"/>","friends":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>","shield":"<path d=\"M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z\"/><path d=\"m9 12 2 2 4-4\"/>","eyeOff":"<path d=\"m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.5 5.3A11 11 0 0 1 12 5c7 0 10 7 10 7a15 15 0 0 1-3.4 4.2M6.1 6.1A16 16 0 0 0 2 12s3 7 10 7a11 11 0 0 0 5.5-1.5\"/>","eye":"<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>","search":"<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 4 4\"/>","coffee":"<path d=\"M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 9h1a3 3 0 0 1 0 6h-1M3 22h16M7 2v2M11 2v2M15 2v2\"/>","glass":"<path d=\"m4 3 8 10 8-10H4ZM12 13v8M7 21h10M6.5 6h11\"/>","pin":"<path d=\"M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>","info":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7h.01\"/>","chevron":"<path d=\"m9 5 7 7-7 7\"/>","arrow":"<path d=\"M4 12h16m-6-6 6 6-6 6\"/>","back":"<path d=\"M20 12H4m6-6-6 6 6 6\"/>","plus":"<path d=\"M12 5v14M5 12h14\"/>","minus":"<path d=\"M5 12h14\"/>","close":"<path d=\"m6 6 12 12M18 6 6 18\"/>","check":"<path d=\"m5 12 4 4L19 6\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>","list":"<path d=\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\"/>","locate":"<circle cx=\"12\" cy=\"12\" r=\"7\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3\"/>","music":"<path d=\"M9 18V5l12-2v13M9 9l12-2\"/><ellipse cx=\"6\" cy=\"18\" rx=\"3\" ry=\"3\"/><ellipse cx=\"18\" cy=\"16\" rx=\"3\" ry=\"3\"/>","more":"<circle cx=\"5\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/>","userPlus":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 7v6M17 10h6\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/>","heart":"<path d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z\"/>","lock":"<rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3M12 14v3\"/>","reset":"<path d=\"M3 11a9 9 0 1 1 2.4 7M3 4v7h7\"/>","person":"<circle cx=\"12\" cy=\"7\" r=\"4\"/><path d=\"M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2\"/>","block":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m6 6 12 12\"/>","trash":"<path d=\"M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7M14 10v7\"/>","spark":"<path d=\"m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z\"/>","bookmark":"<path d=\"M6 4h12v17l-6-4-6 4V4Z\"/>","compare":"<rect x=\"3\" y=\"5\" width=\"7\" height=\"15\" rx=\"2\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"17\" rx=\"2\"/>","directions":"<path d=\"m12 2 10 10-10 10L2 12 10 2Z\"/><path d=\"M8 15v-4h8m-3-3 3 3-3 3\"/>","share":"<path d=\"M12 16V3m-4 4 4-4 4 4M5 13v7h14v-7\"/>","copy":"<rect x=\"8\" y=\"8\" width=\"12\" height=\"13\" rx=\"2\"/><path d=\"M16 8V3H3v13h5\"/>","sliders":"<path d=\"M4 7h7M17 7h3M4 17h3M13 17h7\"/><circle cx=\"14\" cy=\"7\" r=\"3\"/><circle cx=\"10\" cy=\"17\" r=\"3\"/>"},known=new Map(),prepared=new WeakMap(),active=new Set(),pending=new Set();
 const stats={iconPlays:0,mapPlays:0,navPlays:0,effects:{},transfers:0,cancelled:0,suppressed:0,lastKind:null};
 const signature=s=>Array.from(s.children).map(n=>n.tagName.toLowerCase()+':'+Array.from(n.attributes).filter(a=>!['style','class'].includes(a.name)).map(a=>a.name+'='+a.value).sort().join('|')).join(';');
 for(const [name,markup] of Object.entries(ICONS)){const s=document.createElementNS(NS,'svg');s.innerHTML=markup;known.set(signature(s),name);}
 function path(d){const p=document.createElementNS(NS,'path');p.setAttribute('d',d);return p;}
 function split(p,ds){const parts=ds.map(path);p.replaceWith(...parts);return parts;}
 function prepare(svg){if(prepared.has(svg))return prepared.get(svg);
  let name=known.get(signature(svg));const d=svg.querySelector('path')?.getAttribute('d')||'';
  if(svg.classList.contains('venue-glyph'))name=d.startsWith('M5 8.5')?'cafe':'bar';
  if(d==='m12 3 10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6')name='layers';
  let parts=Array.from(svg.children);
  if(name==='coffee'){parts=split(parts[0],['M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z','M17 9h1a3 3 0 0 1 0 6h-1','M3 22h16','M7 2v2','M11 2v2','M15 2v2']);}
  if(name==='cafe'){const tail=split(parts[1],['M15 10h1.4a2.6 2.6 0 0 1 0 5.2H15','M4 19h13','M8 5.5c-1-1.2 1-1.8 0-3','M12 5.5c-1-1.2 1-1.8 0-3']);parts=[parts[0],...tail];}
  if(name==='glass')parts=split(parts[0],['m4 3 8 10 8-10H4Z','M12 13v8','M7 21h10','M6.5 6h11']);
  if(name==='bar'){const tail=split(parts[1],['M12 12.5V19','M8 19h8','M7.2 7.1h9.6']);parts=[parts[0],...tail];}
  if(name==='lock'){const tail=split(parts[1],['M8 10V7a4 4 0 0 1 8 0v3','M12 14v3']);parts=[parts[0],...tail];}
  if(name==='layers')parts=split(parts[0],['m12 3 10 6-10 6L2 9z','M2 13l10 6 10-6','M2 17l10 6 10-6']);
  const out={name:name||'trace',parts};prepared.set(svg,out);return out;
 }
 const easing='cubic-bezier(.25,.65,.25,1)';
 function animate(record,node,frames,delay=0,duration=720){if(!node?.animate)return;
  const a=node.animate(frames,{duration,delay,easing,fill:'none'});a.currentTime=Math.max(0,performance.now()-record.start);record.animations.push(a);
 }
 function move(r,p,x,y,delay=0){animate(r,p,[{transform:'translate(0px,0px)'},{transform:'translate('+x+'px,'+y+'px)',offset:.4},{transform:'translate(0px,0px)'}],delay);}
 function turn(r,p,angle,origin='12px 12px'){animate(r,p,[{transform:'rotate(0deg)',transformOrigin:origin},{transform:'rotate('+angle+'deg)',transformOrigin:origin,offset:.38},{transform:'rotate(0deg)',transformOrigin:origin}]);}
 function draw(r,p,delay=0){if(!p?.getTotalLength)return;const l=p.getTotalLength();if(!l)return;animate(r,p,[{strokeDasharray:l+' '+l,strokeDashoffset:l,opacity:.35},{strokeDasharray:l+' '+l,strokeDashoffset:0,opacity:1,offset:.82},{strokeDasharray:l+' '+l,strokeDashoffset:0,opacity:1}],delay);}
 function ornament(r,host,kind){const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 44 36');svg.setAttribute('aria-hidden','true');svg.classList.add('at-semantic-ornament');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;color:var(--accent,#8569e9);fill:none;stroke:currentColor;stroke-width:1.3';
  const position=host.style.position;if(getComputedStyle(host).position==='static')host.style.position='relative';
  host.append(svg);r.cleanups.push(()=>{svg.remove();host.style.position=position;});
  if(kind==='brand'){const orbit=path('M6 25C-1 17 10 5 24 6S48 20 36 29');svg.append(orbit);draw(r,orbit);const dot=document.createElementNS(NS,'circle');dot.setAttribute('r','1.7');dot.setAttribute('fill','currentColor');svg.append(dot);animate(r,dot,[{cx:'6',cy:'25',opacity:0},{cx:'8',cy:'12',opacity:1,offset:.25},{cx:'29',cy:'7',opacity:1,offset:.55},{cx:'40',cy:'20',opacity:1,offset:.8},{cx:'36',cy:'29',opacity:0}],0,840);}
  else {const line=path('M9 23L22 10 35 23');svg.append(line);draw(r,line);[[9,23],[22,10],[35,23]].forEach(([x,y],i)=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','2');c.setAttribute('fill','var(--surface,#fff)');svg.append(c);move(r,c,i===0?2:i===2?-2:0,i===1?2:-1,i*40);});}
 }
 function render(r,host){r.host=host;r.graphic=host.querySelector(".at-brand-logo,.density-count,svg");r.animations=[];r.cleanups=[];const brand=host.querySelector('.at-brand-logo'),count=host.querySelector('.density-count'),svg=host.querySelector('svg');let name;
  if(brand){name='brand';ornament(r,brand.parentElement,name);}
  else if(count){name='cluster';ornament(r,count.parentElement,name);}
  else if(svg){const info=prepare(svg),p=info.parts;name=info.name;
   switch(name){
    case 'coffee':case 'cafe':p.slice(3).forEach((s,i)=>animate(r,s,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-2.8px)',opacity:.15,offset:.52},{transform:'translateY(0)',opacity:1}],i*65,680));break;
    case 'glass':case 'bar':turn(r,p[0],-9,'12px 13px');draw(r,p[3],60);break;
    case 'compass':turn(r,p[1],62);break;
    case 'friends':case 'userPlus':move(r,p[0],1.3,0);move(r,p[1],1.3,-.6,45);if(p[2])draw(r,p[2],110);break;
    case 'shield':draw(r,p[0]);draw(r,p[1],100);break;
    case 'lock':animate(r,p[1],[{transform:'translate(2px,-2px)',opacity:.55},{transform:'translate(0px,0px)',opacity:1,offset:.6},{transform:'translate(0px,0px)',opacity:1}]);draw(r,p[2],120);break;
    case 'bookmark':case 'heart':draw(r,p[0]);break;
    case 'layers':p.forEach((s,i)=>move(r,s,0,(i-1)*2.5,i*30));break;
    case 'locate':draw(r,p[0]);draw(r,p[2],60);break;
    case 'search':move(r,p[1],1.4,1.4);draw(r,p[0],50);break;
    case 'clock':turn(r,p[1],35);break;
    case 'sliders':move(r,p[1],2,0);move(r,p[2],-2,0,80);break;
    case 'compare':case 'copy':p.forEach((s,i)=>move(r,s,i?-1:1,i?1:-1,i*60));break;
    case 'eye':move(r,p[1],2,0);break;
    case 'music':p.slice(1).forEach((s,i)=>move(r,s,0,-1.8,i*90));break;
    default:p.forEach((s,i)=>draw(r,s,Math.min(i*45,140)));break;
   }
  }else return false;
  if(!r.counted){r.counted=true;stats.iconPlays++;stats.effects[name]=(stats.effects[name]||0)+1;stats.lastKind=name;if(r.map)stats.mapPlays++;if(r.nav)stats.navPlays++;}return true;
 }
 function clear(r){r.animations.forEach(a=>a.cancel());r.cleanups.forEach(f=>f());r.animations=[];r.cleanups=[];}
 function finish(r){clear(r);active.delete(r);}
 function resolver(target){
  const attrs=['data-pin','data-cluster','data-category','data-venue','data-venue-id','data-sd-view','data-profile-open','data-action','data-screen'];
  const attr=attrs.find(k=>target.hasAttribute(k)),value=attr&&target.getAttribute(attr),isNav=target.matches('.nav-item[data-screen]'),isLayer=target.matches('.atlas-layers-button');
  return ()=>{if(target.isConnected)return target;if(isLayer)return document.querySelector('.atlas-layers-button');if(!attr)return null;return Array.from(document.querySelectorAll(isNav?'.nav-item[data-screen]':'button,a,[role="tab"]')).find(n=>n.getAttribute(attr)===value)||null;};
 }
 function start(target){const resolve=resolver(target),r={resolve,start:performance.now(),host:null,animations:[],cleanups:[],map:!!target.closest('#mapPins'),nav:target.matches('.nav-item[data-screen]')};
  pending.add(r);requestAnimationFrame(()=>requestAnimationFrame(()=>{pending.delete(r);if(media.matches||r.cancelled)return;const host=resolve();if(!host)return;for(const other of active)if(other.host===host)finish(other);if(render(r,host)){active.add(r);tick();}}));
 }
 let frame=0;function tick(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;for(const r of active){if(media.matches||performance.now()-r.start>900){finish(r);continue;}const next=r.resolve();if(next&&(next!==r.host||next.querySelector(".at-brand-logo,.density-count,svg")!==r.graphic)){clear(r);stats.transfers++;render(r,next);}}if(active.size)tick();});}
 function click(event){if(media.matches||!(event.target instanceof Element)){if(media.matches)stats.suppressed++;return;}const target=event.target.closest('button,a,[role="tab"]');if(!target||target.disabled||target.getAttribute('aria-disabled')==='true')return;
  // Map gesture controller completes pointer taps with target.click(). Ignore its physical click.
  if(target.closest('#mapPins [data-pin],#mapPins [data-cluster]')&&event.detail>0){stats.suppressed++;return;}start(target);
 }
 document.addEventListener('click',click,true);
 function reduced(){if(!media.matches)return;for(const r of active){stats.cancelled++;finish(r);}for(const r of pending)r.cancelled=true;pending.clear();if(frame){cancelAnimationFrame(frame);frame=0;}}
 media.addEventListener('change',reduced);
 window.AtmosphereMotion=Object.freeze({semanticVersion:1,getStats:()=>({...stats,effects:{...stats.effects},active:active.size,pending:pending.size,reducedMotion:media.matches}),destroy(){document.removeEventListener('click',click,true);media.removeEventListener('change',reduced);for(const r of active)finish(r);for(const r of pending)r.cancelled=true;pending.clear();if(frame)cancelAnimationFrame(frame);delete window.AtmosphereMotion;}});
})();
