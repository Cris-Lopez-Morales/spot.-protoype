'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../../public/spot/core.js'),M=require('../../public/spot/map-core.js'),seed=require('../fixtures/fixture-seed-v43.json');
const dims={width:390,height:595,centerX:195,centerY:232.5},camera={x:4500,y:4000,zoom:.06};
// v4.6 intentionally changes inventory, placement, and display names. Prior
// fixture assertions remain in the byte-identical v4.5 rollback ZIP.
test('sparse sample contains exactly twenty-four cafes and eight bars/clubs',()=>{assert.equal(C.VENUES.filter(v=>v.category==='cafe').length,24);assert.equal(C.VENUES.filter(v=>v.category==='club').length,8);assert.equal(C.VENUES.length,32);});
test('sample contains twenty Lincoln venues and twelve surrounding-town venues',()=>{const city=new Set(C.MAP.areas.filter(a=>!a.regional).map(a=>a.name));assert.equal(C.VENUES.filter(v=>city.has(v.area)).length,20);assert.equal(C.VENUES.filter(v=>!city.has(v.area)).length,12);});
test('nightlife sample uses four town bars and four city bars/clubs',()=>{const towns=new Set(C.MAP.areas.filter(a=>a.regional).map(a=>a.name));const clubs=C.VENUES.filter(v=>v.category==='club');assert.equal(clubs.filter(v=>towns.has(v.area)).length,4);assert.equal(clubs.filter(v=>!towns.has(v.area)).length,4);});
test('no authored neighborhood or town has more than two venue placeholders',()=>{for(const a of C.MAP.areas)assert.ok(C.VENUES.filter(v=>v.area===a.name).length<=2);});
test('surviving IDs come from the old fixture; revised coordinates still use the map projection',()=>{for(const v of C.VENUES){assert.ok(seed.venues.find(o=>o.id===v.id));const point=C.project(v.lng,v.lat);assert.ok(Math.abs(point.x-v.x)<.02&&Math.abs(point.y-v.y)<.02);}});
test('all named friend IDs remain the same across revisions',()=>assert.deepEqual(C.PEOPLE.map(p=>p.id),seed.people.map(p=>p.id)));
test('friend visits reattach to real surviving fixtures with current venue timestamps',()=>{for(const p of C.PEOPLE)if(p.venueId){const v=C.venueById(p.venueId);assert.ok(v);assert.equal(p.age,v.age);}});
test('only six hundred ten accounts appear at venues, not all five thousand',()=>{assert.equal(C.USERS.filter(u=>u.venueId).length,610);assert.equal(C.USERS.filter(u=>!u.venueId).length,4390);});
test('sample count limits are conservative by category, not real capacity claims',()=>{assert.ok(C.VENUES.filter(v=>v.category==='cafe').every(v=>v.people<=28));assert.ok(C.VENUES.filter(v=>v.category==='club').every(v=>v.people<=90));});
test('removed bookmarks are discarded, retained bookmarks keep identity',()=>{const dropped=seed.venues.find(v=>!C.venueById(v.id));const state=C.initialState({version:4,savedVenues:['juniper',dropped.id],relations:C.DEFAULT_RELATIONS});assert.deepEqual(state.savedVenues,['juniper']);});
test('club category and nightclub search agree with the catalog',()=>{const state=C.initialState(),snap=C.makeSnapshot();state.category='club';assert.equal(C.filteredVenues(state,snap,Date.now()).length,8);state.category='all';state.query='nightclub';assert.equal(C.filteredVenues(state,snap,Date.now()).length,8);});
test('group drill-down centers on member bounds and increases scale',()=>{const members=[{x:5000,y:4000},{x:5100,y:4100}];const n=M.drillDownCamera(members,camera,dims);assert.equal(n.x,5050);assert.equal(n.y,4050);assert.ok(n.zoom>camera.zoom);});
test('drill-down fits a local group inside the usable map, not behind bottom chrome',()=>{const points=[{x:5000,y:4000},{x:5100,y:4100}];const n=M.drillDownCamera(points,camera,dims);for(const v of points){const p=M.project(v,n,dims);assert.ok(p.x>=54&&p.x<=dims.width-54);assert.ok(p.y>=66&&p.y<=dims.height-190);}});
test('repeat group navigation still moves inward but respects maximum zoom',()=>{const points=[{x:5000,y:4000},{x:5001,y:4001}];assert.equal(M.drillDownCamera(points,{...camera,zoom:8},dims).zoom,8);assert.ok(M.drillDownCamera(points,{...camera,zoom:1},dims).zoom>1);});
test('empty or invalid drill-down members are a no-op',()=>{assert.deepEqual(M.drillDownCamera([],camera,dims),camera);assert.deepEqual(M.drillDownCamera([{x:NaN,y:3}],camera,dims),camera);});
test('drill-down does not mutate its input camera or places',()=>{const cc={...camera},pts=[{x:1,y:2},{x:3,y:4}],before=JSON.stringify(pts);M.drillDownCamera(pts,cc,dims);assert.deepEqual(cc,camera);assert.equal(JSON.stringify(pts),before);});
test('drill-down remains finite for compact or landscape map dimensions',()=>{for(const d of [dims,{width:260,height:220,centerX:130,centerY:95},{width:740,height:280,centerX:370,centerY:95}]){const n=M.drillDownCamera([{x:12,y:12},{x:32,y:42}],camera,d);assert.ok(Number.isFinite(n.zoom)&&n.zoom>.025&&n.zoom<=8);}});
test('selected name finds a free nearby slot in a dense mobile group without overlapping pins',()=>{
 const selected={key:'v:juniper',x:105.288,y:223.376,pinWidth:58,width:83,offset:26,priority:0};
 const obstacles=[{x:74.288,y:206.376,w:62,h:38},{x:119.9,y:170.816,w:55,h:34},{x:59.983,y:245.569,w:54,h:34},{x:39.829,y:166.905,w:55,h:34},{x:141.804,y:219.662,w:50,h:34}];
 const labels=M.labelLayout([selected],{x:10,y:62,w:370,h:340},obstacles);
 assert.equal(labels.length,1);assert.equal(labels[0].key,selected.key);
 assert.ok(obstacles.every(o=>!M.intersects(labels[0],o,5)));
 assert.ok(Math.abs(labels[0].y-selected.y)<=90);
});
