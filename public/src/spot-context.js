/* Frame-side boundary: validate, copy whitelisted fields, and retrieve demo data.
 * No global access to the parent's friend records; the bridge sends none. */
const clean=(s,max=150)=>typeof s==='string'?s.slice(0,max):'';
const validTime=n=>Number.isFinite(n)&&n>=0&&n<=8640000000000000;
const validId=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,90}$/.test(s);
const words=s=>clean(s,12000).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function sanitizeContext(raw){
 if(!raw||raw.version!==1||raw.demo!==true||!Array.isArray(raw.venues)||!Array.isArray(raw.areas)||raw.venues.length>100||raw.areas.length>100)return null;
 const venues=raw.venues.filter(v=>v&&validId(v.id)&&['cafe','club'].includes(v.category)).map(v=>({id:v.id,name:clean(v.name),category:v.category,area:clean(v.area),address:clean(v.address,200),count:Number.isInteger(v.count)&&v.count>=1&&v.count<=5000?v.count:null,lastSeen:validTime(v.lastSeen)?v.lastSeen:null}));
 const ids=new Set(venues.map(v=>v.id));
 const areas=raw.areas.filter(a=>a&&validId(a.id)).map(a=>({id:a.id,name:clean(a.name),aliases:Array.isArray(a.aliases)?a.aliases.slice(0,20).map(a=>clean(a)):[],nearbyIds:Array.isArray(a.nearbyIds)?a.nearbyIds.filter(id=>ids.has(id)).slice(0,100):[]}));
 return {version:1,demo:true,capturedAt:validTime(raw.capturedAt)?raw.capturedAt:Date.now(),selectedVenueId:ids.has(raw.selectedVenueId)?raw.selectedVenueId:null,areaId:areas.some(a=>a.id===raw.areaId)?raw.areaId:null,venues,areas};
}
export const SPOT_GUIDE={id:'spot-guide',title:'Spot prototype guide',text:'Spot is a fictional venue-activity prototype for Lincoln, Nebraska and nearby towns. It has 60 fictional places: 50 cafés and 10 clubs, with 5,000 demo accounts and 60 demo friends. Public pins group establishments and show recently detected app-user counts, NOT total attendance, capacity, full/empty status, seat availability, opening hours, or popularity rankings. No real GPS is collected. Users can search real areas such as East Campus, Haymarket, and City Campus to see nearby fictional places. One finger pans; two fingers pinch to zoom; tapping a grouped count focuses that area. Save places with bookmarks; compare two or three. Count contribution and named sharing with selected friends are separate; Pause all sharing stops both. Directions are a preview because businesses are fictional. Activity histories are authored samples. Dark/light mode is in the header. The assistant has only public demo place data and the manually browsed area/selected place, not anyone\'s location, friend identities, contacts, or private settings. It cannot know which seats are available or which friend is at a place. It can offer source-card buttons that open known places on the map only when the user clicks. All counts may expire; missing data means unknown, not empty.'};
function venueSource(v,c){return {id:`spot-${v.id}`,title:`${v.name} · fictional ${v.category==='cafe'?'café':'club'}`,spotVenueId:v.id,text:`${v.name} is a fictional ${v.category==='cafe'?'café':'club'} in ${v.area}. Placeholder address: ${v.address}. ${v.count===null?'No recent app activity; attendance is UNKNOWN, not zero or empty.':`${v.count} recently detected demo app users. Last supporting timestamp: ${new Date(v.lastSeen||c.capturedAt).toISOString()}.`} This is simulated app participation, not total attendance or available seats. Snapshot: ${new Date(c.capturedAt).toISOString()}.`};}
export function spotSources(query,c){
 if(!c)return [{...SPOT_GUIDE}];
 const q=words(query),tokens=q.split(' ').filter(x=>x.length>2);
 let area=c.areas.filter(a=>[a.name,...a.aliases].some(n=>{const t=words(n);return t.length>2&&(` ${q} `).includes(` ${t} `);})).sort((a,b)=>b.name.length-a.name.length)[0];
 if(!area&&/\b(nearby|around here|this area|near here)\b/.test(q))area=c.areas.find(a=>a.id===c.areaId);
 const category=/\b(club|clubs|nightclub|nightclubs)\b/.test(q)?'club':/\b(cafe|cafes|coffee)\b/.test(q)?'cafe':null;
 const named=c.venues.filter(v=>q.includes(words(v.name)));
 let rows=named.length?named:c.venues.filter(v=>(!category||v.category===category)&&(!area||area.nearbyIds.includes(v.id)));
 if(!named.length&&!area&&c.selectedVenueId&&/\b(this place|this spot|here|selected)\b/.test(q))rows=rows.filter(v=>v.id===c.selectedVenueId);
 if(!named.length&&!area&&!category){const ranked=rows.map(v=>({v,score:tokens.reduce((n,t)=>n+Number(words(`${v.name} ${v.area}`).includes(t)),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);rows=ranked.map(x=>x.v);}
 // Geometry order is inherited from the area's deterministic nearby list.
 if(area&&!named.length)rows.sort((a,b)=>area.nearbyIds.indexOf(a.id)-area.nearbyIds.indexOf(b.id));
 const sources=[];
 if(area)sources.push({id:`area-${area.id}`,spotAreaId:area.id,title:`${area.name} · demo map area`,text:`${area.name} is a searchable real area at an approximate center. There are ${rows.length} matching fictional ${category==='cafe'?'cafés':category==='club'?'clubs':'venues'} in its configured search radius${rows.length?': '+rows.map(v=>v.name).join(', '):'. No matching fictional venues, not proof no real businesses exist'}. This is not real business inventory or real-time occupancy.`});
 sources.push(...rows.slice(0,3).map(v=>venueSource(v,c)),{...SPOT_GUIDE});
 return sources;
}
export function createSpotBridge({onTheme,onPause,onShow,onDraft,onContext}){
 const embedded=window.parent!==window&&new URLSearchParams(location.search).get('embed')==='spot';
 let current=null,counter=0;const pending=new Map();const post=data=>{if(embedded)window.parent.postMessage({channel:'spot-assistant-v1',...data},location.origin);};
 window.addEventListener('message',event=>{
  if(!embedded||event.source!==window.parent||event.origin!==location.origin||event.data?.channel!=='spot-assistant-v1')return;
  const m=event.data;
  if(m.type==='context'){const data=sanitizeContext(m.data);if(!data)return;current=data;onContext?.(data);const p=pending.get(m.requestId);if(p){clearTimeout(p.timer);pending.delete(m.requestId);p.resolve(data);}}
  else if(m.type==='theme'&&['light','dark'].includes(m.theme))onTheme?.(m.theme);
  else if(m.type==='pause')onPause?.();
  else if(m.type==='show')onShow?.();
  else if(m.type==='draft'&&typeof m.text==='string'&&m.text.length<=12000)onDraft?.(m.text);
 });
 return {embedded,ready:()=>post({type:'ready'}),get:()=>current,
  fresh:()=>new Promise(resolve=>{if(!embedded){resolve(null);return;}const requestId=++counter;const timer=setTimeout(()=>{pending.delete(requestId);current=null;onContext?.(null);resolve(null);},1500);pending.set(requestId,{resolve,timer});post({type:'request-context',requestId});}),
  navigate:(type,id)=>{if(!validId(id))return;const known=type==='place'?current?.venues.some(v=>v.id===id):type==='area'?current?.areas.some(a=>a.id===id):false;if(known)post({type:'navigate',action:{type,id}});},
  close:()=>post({type:'close'})};
}
