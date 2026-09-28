/* Local landmark search. Approximate area centers, not addresses or live venues.
 * Source names: UNL Campus Maps (https://maps.unl.edu/) and the existing Lincoln
 * regional map fixture. Coordinate precision is deliberately limited by the
 * illustrative map. No network, analytics, device location, or query storage.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.SpotCore);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.SpotPlaceSearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){'use strict';
 const id=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 function unproject(x,y){const s=256*2**C.MAP.baseZoom;return{lng:(x+C.MAP.worldOrigin[0])/s*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*(y+C.MAP.worldOrigin[1])/s)))*180/Math.PI};}
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 function queryKey(s){return norm(s).replace(/^(?:take me to|show me|near|around|by)\s+/,'').replace(/\s+(?:in )?(?:lincoln(?: nebraska| ne)?|nebraska|ne)$/,'').trim();}
 const aliases={
  Haymarket:['historic haymarket','hay market','haymarket district'],Downtown:['downtown lincoln','city center','city centre'],
  'University Place':['uni place','wesleyan','nebraska wesleyan','nwu'],Havelock:['havelock neighborhood'],
  'College View':['union college','union adventist university'], 'Capitol Beach':['capital beach','capitol beach lake'],
  'Near South':['near south neighborhood'], 'South Lincoln':['south lincoln'], 'East Lincoln':['east lincoln'],
  'UNL East Campus':['east campus','unl east','eastcampus','nebraska east campus','university of nebraska east campus'],
  'UNL City Campus':['city campus','unl','university of nebraska lincoln','nebraska city campus','unl downtown'],
  'Holmes Lake':['holmes lake park','holmes park'], 'Pioneers Park':['pioneer park','pioneers park nature center'],
  'Antelope Park':['antelope'], 'Wilderness Park':['wilderness'], 'Mahoney Park':['lincoln mahoney park'],
  'Branched Oak Lake':['branched oak','branched oak state recreation area'], 'Pawnee Lake':['pawnee','pawnee state recreation area'],
  'Stagecoach Lake':['stagecoach'], 'Wagon Train Lake':['wagon train'], 'Conestoga Lake':['conestoga']
 };
 const make=(p,kind,radius)=>Object.freeze({id:id(p.name),name:p.name==='UNL East Campus'?'East Campus':p.name==='UNL City Campus'?'City Campus':p.name,
  x:p.x,y:p.y,...unproject(p.x,p.y),kind,radiusMeters:radius,
  subtitle:kind==='campus'?'University of Nebraska–Lincoln':kind==='town'?'Lincoln region, Nebraska':'Lincoln, Nebraska',
  aliases:Object.freeze([p.name,...(aliases[p.name]||[])]),approximate:true});
 const locations=Object.freeze([
  make({name:'Lincoln',x:C.MAP.center[0],y:C.MAP.center[1]},'city',14000),
  ...C.MAP.areas.map(a=>make(a,a.regional?'town':'neighborhood',a.regional?4200:2000)),
  ...C.MAP.parks.map(p=>make(p,p.name.includes('Campus')?'campus':p.water?'lake':'park',p.name.includes('Campus')?1600:2400))
 ]);
 const byId=new Map(locations.map(l=>[l.id,l]));
 const keys=new Map(locations.map(l=>[l.id,[...new Set([l.name,...l.aliases].map(norm))]]));
 function exact(query){const direct=norm(query),q=queryKey(query);if(direct.length<3)return null;
  // Exact names take precedence over aliases; no fuzzy auto-jumps.
  return locations.find(l=>norm(l.name)===direct)||locations.find(l=>keys.get(l.id).includes(direct))||locations.find(l=>norm(l.name)===q)||locations.find(l=>keys.get(l.id).includes(q))||null;
 }
 function oneEdit(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return n+(i<a.length||j<b.length?1:0)<=1;}
 function matches(query,limit=5){const q=queryKey(query);if(!q)return ['unl-east-campus','haymarket','unl-city-campus','waverly'].map(x=>byId.get(x));
  if(q.length<2)return[];
  return locations.map(l=>{let score=0;for(const k of keys.get(l.id)){const words=k.split(' ');score=Math.max(score,k===q?100:k.startsWith(q)?80:q.split(' ').every(t=>words.some(w=>w.startsWith(t)))?60:k.includes(q)?45:q.length>=5&&oneEdit(k,q)?20:0);}return{l,score};}).filter(r=>r.score).sort((a,b)=>b.score-a.score||a.l.name.localeCompare(b.l.name)).slice(0,limit).map(r=>r.l);
 }
 function distance(a,b){const rad=Math.PI/180,dy=(b.lat-a.lat)*rad,dx=(b.lng-a.lng)*rad,h=Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
 function nearby(venues,location){if(!location)return venues;return venues.map(v=>({v,d:distance(v,location)})).filter(r=>r.d<=location.radiusMeters).sort((a,b)=>a.d-b.d||a.v.name.localeCompare(b.v.name)).map(r=>r.v);}
 function distanceLabel(meters){if(!Number.isFinite(meters)||meters<0)return'';return meters<160?'< 0.1 mi':(meters/1609.344).toFixed(1)+' mi';}
 function radiusLabel(l){return(l.radiusMeters/1609.344).toFixed(l.radiusMeters<3200?1:0)+' mi area';}
 function cameraFor(location,dimensions){const metersPerPixel=Math.cos(location.lat*Math.PI/180)*40075016.686/(256*2**C.MAP.baseZoom);
  const worldSpan=location.radiusMeters*1.25/metersPerPixel;
  return{x:location.x,y:location.y,zoom:Math.max(.025,Math.min(2,Math.min(Math.max(80,dimensions.width-200),Math.max(90,dimensions.height-270))/worldSpan)),scope:'area'};
 }
 return Object.freeze({locations,normalize:norm,queryKey,exact,matches,byId:id=>byId.get(id)||null,nearby,distance,distanceLabel,radiusLabel,cameraFor});
});
