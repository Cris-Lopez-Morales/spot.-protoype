/* Public, read-only context boundary. No person records, friend identities,
 * sharing permissions, saved lists, raw user locations or chat history cross it. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpotAssistantContext=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function snapshot(core,demo,search){
  const selected=demo.getSelectedVenueId?.()||null;
  const current=demo.getSearchArea();
  return {version:1,demo:true,capturedAt:Date.now(),selectedVenueId:core.venueById(selected)?selected:null,
   areaId:current?.id||null,
   venues:core.VENUES.map(v=>{const a=demo.getActivity(v.id);return {id:v.id,name:v.name,category:v.category,area:v.area,address:v.address||v.street||'',
    count:a?.hasData&&Number.isFinite(a.count)?a.count:null,lastSeen:a?.hasData?a.latest:null};}),
   areas:search.locations.map(a=>({id:a.id,name:a.name,aliases:[...a.aliases],nearbyIds:search.nearby(core.VENUES,a).map(v=>v.id)}))};
 }
 function validAction(action,core,search){if(!action||typeof action!=='object')return false;return action.type==='place'?!!core.venueById(action.id):action.type==='area'?!!search.byId(action.id):false;}
 return Object.freeze({snapshot,validAction});
});
