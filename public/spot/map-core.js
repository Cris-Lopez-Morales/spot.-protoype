/* View calculations and near-linear clustering. No browser or location access. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SpotMapCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function zoomLevel(zoom){return Math.round(Math.log2(Math.max(.001,zoom))*4)/4;}
 function markerSpacing(zoom, mobile=false){
  // Screen-space spacing is deliberately generous in the overview. It only
  // changes with zoom, never on pan, so groups and marker DOM stay stable.
  return zoom<.2?(mobile?94:100):zoom<.65?(mobile?84:90):zoom<2?(mobile?78:82):68;
 }
 function intersects(a,b,gap=0){return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;}
 function labelLayout(items,bounds,obstacles=[],gap=5){
  const occupied=obstacles.map(b=>({...b})),result=[];
  for(const item of [...items].sort((a,b)=>a.priority-b.priority||a.key.localeCompare(b.key))){
   const w=item.width,h=18,dy=item.offset||24;
   const candidates=[{x:item.x-w/2,y:item.y+dy,w,h},{x:item.x+item.pinWidth/2+8,y:item.y-h/2,w,h},{x:item.x-item.pinWidth/2-8-w,y:item.y-h/2,w,h},{x:item.x-w/2,y:item.y-dy-h,w,h}];
   if(item.priority===0){for(const shift of [4,-4,8,-8,12,-12,20,-20,28,-28,36,-36])candidates.push({x:item.x-w/2+shift,y:item.y+dy,w,h},{x:item.x-w/2+shift,y:item.y-dy-h,w,h});}
   // A selected place keeps its label even when a nearby group occupies the
   // first above/below slot. Search close diagonal slots before hiding it.
   if(item.priority===0)for(const offset of [dy+10,dy+20,dy+30,dy+40,dy+50])for(const shift of [0,-24,24,-48,48]){
    candidates.push({x:item.x-w/2+shift,y:item.y+offset,w,h},{x:item.x-w/2+shift,y:item.y-offset-h,w,h});
   }
   const box=candidates.find(b=>b.x>=bounds.x&&b.y>=bounds.y&&b.x+b.w<=bounds.x+bounds.w&&b.y+b.h<=bounds.y+bounds.h&&!occupied.some(o=>intersects(b,o,gap)));
   if(box){occupied.push(box);result.push({key:item.key,...box});}
  }
  return result;
 }
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
  // Centroids can move after adding members. Merge intersecting unselected
  // chips so the initial bucket boundaries don't produce overlapping bubbles.
  let out=groups.map(g=>({key:g.ids.length===1?'v:'+g.ids[0]:g.key,x:g.selected?g.x:g.sumX/g.ids.length,y:g.selected?g.y:g.sumY/g.ids.length,ids:g.ids,selected:!!g.selected}));
  let changed=true,pass=0;
  while(changed&&pass++<12){changed=false;
   const cells=new Map(),next=[];
   for(const g of out){
    if(g.selected){next.push(g);continue;}
    const ix=Math.floor(g.x/cell),iy=Math.floor(g.y/cell);let match=null;
    for(let x=ix-1;x<=ix+1&&!match;x++)for(let y=iy-1;y<=iy+1&&!match;y++)for(const other of cells.get(x+':'+y)||[]){
     if(Math.abs(other.x-g.x)*scale<pixels*.84&&Math.abs(other.y-g.y)*scale<46){match=other;break;}
    }
    if(match){const n=match.ids.length,k=g.ids.length;match.x=(match.x*n+g.x*k)/(n+k);match.y=(match.y*n+g.y*k)/(n+k);match.ids.push(...g.ids);match.key='g:'+match.ids[0];changed=true;}
    else{next.push(g);const key=ix+':'+iy;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(g);}
   }
   out=next;
  }
  return out.map(({selected,...g})=>g);
 }
 function project(point,camera,d){return{x:d.centerX+(point.x-camera.x)*camera.zoom,y:d.centerY+(point.y-camera.y)*camera.zoom};}
 function anchoredZoom(camera,factor,point,d,min=.02,max=8){
  const z=Math.min(max,Math.max(min,camera.zoom*factor));
  return{...camera,zoom:z,x:camera.x+(point.x-d.centerX)*(1/camera.zoom-1/z),y:camera.y+(point.y-d.centerY)*(1/camera.zoom-1/z)};
 }
 // Fit the group's actual bounds into the useful viewport on touch, mouse,
 // or keyboard activation. A single drag still cannot change zoom.
 function drillDownCamera(places,camera,d,min=.025,max=8){
  const valid=places.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!valid.length)return{...camera};
  const xs=valid.map(p=>p.x),ys=valid.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const availableW=Math.max(90,d.width-108),availableH=Math.max(90,Math.min(d.centerY-66,d.height-190-d.centerY)*2);
  const fitted=Math.min(availableW/Math.max(24,x1-x0),availableH/Math.max(24,y1-y0));
  const zoom=Math.max(min,Math.min(max,Math.max(camera.zoom*1.45,fitted)));
  return{...camera,x:(x0+x1)/2,y:(y0+y1)/2,zoom};
 }
 return{drillDownCamera,zoomLevel,cluster,project,anchoredZoom,markerSpacing,intersects,labelLayout};
});
