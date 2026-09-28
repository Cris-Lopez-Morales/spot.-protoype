/* View calculations and near-linear clustering. No browser or location access. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SpotMapCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function zoomLevel(zoom){return Math.round(Math.log2(Math.max(.001,zoom))*4)/4;}
 function cluster(places, zoom, selected=null, pixels=62){
  const scale=2**zoomLevel(zoom),cell=pixels/scale,buckets=new Map(),groups=[];
  for(const v of places){
   if(v.id===selected){groups.push({key:'v:'+v.id,x:v.x,y:v.y,ids:[v.id],selected:true});continue;}
   const ix=Math.floor(v.x/cell),iy=Math.floor(v.y/cell);let match=null;
   for(let x=ix-1;x<=ix+1&&!match;x++)for(let y=iy-1;y<=iy+1&&!match;y++){
    for(const g of buckets.get(x+':'+y)||[]){if(Math.hypot(g.ax-v.x,g.ay-v.y)<cell){match=g;break;}}
   }
   if(match){match.sumX+=v.x;match.sumY+=v.y;match.ids.push(v.id);}
   else{const g={key:'g:'+v.id,ax:v.x,ay:v.y,sumX:v.x,sumY:v.y,ids:[v.id]};groups.push(g);const k=ix+':'+iy;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(g);}
  }
  return groups.map(g=>({key:g.ids.length===1?'v:'+g.ids[0]:g.key,x:g.selected?g.x:g.sumX/g.ids.length,y:g.selected?g.y:g.sumY/g.ids.length,ids:g.ids}));
 }
 function project(point,camera,d){return{x:d.centerX+(point.x-camera.x)*camera.zoom,y:d.centerY+(point.y-camera.y)*camera.zoom};}
 function anchoredZoom(camera,factor,point,d,min=.02,max=8){
  const z=Math.min(max,Math.max(min,camera.zoom*factor));
  return{...camera,zoom:z,x:camera.x+(point.x-d.centerX)*(1/camera.zoom-1/z),y:camera.y+(point.y-d.centerY)*(1/camera.zoom-1/z)};
 }
 return{zoomLevel,cluster,project,anchoredZoom};
});
