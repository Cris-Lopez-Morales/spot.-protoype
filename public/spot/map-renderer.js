/* v4.6 — continuous, original, illustrative cartography. NOT surveyed GIS, real
 * building footprints, or routing data. Fictional venues use a deliberately sparse
 * authored layout, not a business census. All geometry is compiled once and rendered offline on one canvas.
 * Street/land-use detail is progressive; labels never compete with place pins.
 */
(function(root){'use strict';
 const M=root.SpotCore.MAP, project=root.SpotCore.project, features=[], labels=[];
 const palettes={
  light:{ground:'#e9edf4',field:'#e4e9f2',field2:'#e7ecf4',urban:'#f0f2f8',neighborhood:'#edf0f7',campus:'#e0def5',building:'#cfd7e6',buildingEdge:'#bfc9dc',park:'#d2e2e6',parkLine:'#bcd4dc',water:'#b7d3ee',waterLine:'#9fbedf',road:'#ffffff',edge:'#d9dfec',minor:'#fafbfe',highway:'#ece3f8',highwayEdge:'#d5cde8',river:'#a5c9e3',text:'#596780',sub:'#718198',halo:'#f0f3f9',trail:'#b1cbd6'},
  dark:{ground:'#151a2a',field:'#181f30',field2:'#1b2234',urban:'#1d2437',neighborhood:'#20283b',campus:'#2a2846',building:'#323e59',buildingEdge:'#414e6c',park:'#223947',parkLine:'#2c4a5e',water:'#1d3c5c',waterLine:'#284d6d',road:'#424d68',edge:'#1c2337',minor:'#2b354c',highway:'#636081',highwayEdge:'#32324d',river:'#2c5374',text:'#b3bed8',sub:'#94a3bf',halo:'#1d2437',trail:'#436071'}
 };
 const fillTypes=new Set(['field','field2','urban','neighborhood','campus','building','park','water']);
 let seed=19287;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 function add(points,type,min=0,name='',smooth=false){
  if(points.length<2)return;
  const path=new Path2D(),closed=fillTypes.has(type);
  if(smooth&&closed){
   const prev=points.at(-1),first=points[0];path.moveTo((prev[0]+first[0])/2,(prev[1]+first[1])/2);
   points.forEach((p,i)=>{const n=points[(i+1)%points.length];path.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);});
  }else if(smooth){
   path.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){const p=points[i],n=points[i+1];path.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);}path.lineTo(...points.at(-1));
  }else points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));
  if(closed)path.closePath();
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);features.push({path,type,min,name,b:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]});
 }
 const pt=(lng,lat)=>{const p=project(lng,lat);return[p.x,p.y];};
 function polygon(cx,cy,rx,ry,type,min=0){
  const points=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=.84+rand()*.16;points.push([cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r]);}add(points,type,min,'',true);
 }
 // Restrained land-cover shapes. No checkerboard of pretend building lots.
 for(let i=0;i<45;i++){
  const x=rand()*M.width,y=rand()*M.height;
  polygon(x,y,230+rand()*520,200+rand()*500,i%2?'field':'field2');
 }
 const city=pt(-96.687,40.813);
 const cityOutline=[pt(-96.758,40.888),pt(-96.697,40.902),pt(-96.623,40.892),pt(-96.578,40.858),pt(-96.575,40.781),pt(-96.599,40.714),pt(-96.672,40.713),pt(-96.723,40.731),pt(-96.741,40.789),pt(-96.772,40.82)];
 add(cityOutline,'urban',0,'',true);
 for(const a of M.areas.filter(a=>!a.regional)){
  if(['Haymarket','Downtown','Antelope Valley'].includes(a.name))continue;
  polygon(a.x,a.y,165+rand()*140,170+rand()*145,'neighborhood',.2);
 }
 const inGreen=(x,y,pad=0)=>M.parks.some(p=>Math.abs(x-p.x)<p.width*.62+pad&&Math.abs(y-p.y)<p.height*.62+pad);
 const inCity=(x,y)=>((x-city[0])/1210)**2+((y-city[1])/1380)**2<1;
 // Original secondary street networks derived from the existing demo arterial
 // skeleton. Their varied extents imply neighborhoods, not a single tiled grid.
 const hs=M.roads.filter(r=>r.major&&r.points.length===2&&Math.abs(r.points[0][1]-r.points[1][1])<.01&&r.points[0][0]>3500&&r.points[1][0]<6800).map(r=>r.points[0][1]).sort((a,b)=>a-b);
 const vs=M.roads.filter(r=>r.major&&r.points.length===2&&Math.abs(r.points[0][0]-r.points[1][0])<.01&&r.points[0][0]>4300&&r.points[0][0]<6500).map(r=>r.points[0][0]).sort((a,b)=>a-b);
 for(let yi=0;yi<hs.length-1;yi++)for(let xi=0;xi<vs.length-1;xi++){
  const x0=vs[xi],x1=vs[xi+1],y0=hs[yi],y1=hs[yi+1],cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(!inCity(cx,cy)||inGreen(cx,cy,20))continue;
  // Keep the finer downtown grid separate from residential blocks.
  if(x0<5230&&x1>4770&&y0<4070&&y1>3790)continue;
  const cols=Math.max(1,Math.round((x1-x0)/62)),rows=3;
  for(let c=1;c<cols;c++){
   const x=x0+(x1-x0)*c/cols;
   add([[x,y0],[x,y1]],'local',.64);
  }
  for(let r=1;r<rows;r++){
   const y=y0+(y1-y0)*r/rows;
   add([[x0,y],[x1,y]],'local',.64);
  }
  // Modest, varied high-zoom footprints. These are clearly illustrative lots,
  // and never need to be painted at the city/region zoom levels.
  if(x1-x0>60)for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){
   const cellW=(x1-x0)/cols,cellH=(y1-y0)/rows;
   const bx=x0+c*cellW+10,by=y0+r*cellH+10,w=Math.min(cellW-22,15+rand()*16),h=Math.min(cellH-24,14+rand()*26);
   if(w>4&&h>4&&rand()>.62&&!inGreen(bx,by,10))add([[bx,by],[bx+w,by],[bx+w,by+h*.62],[bx+w*.58,by+h*.62],[bx+w*.58,by+h],[bx,by+h]],'building',.76);
  }
 }
 // The downtown street texture is a compact local grid; buildings relate to
 // the gaps between streets instead of repeating four squares in every block.
 const dx0=4776.85,dx1=5242.88,dy0=3790,dy1=4094;
 const downtownX=[4777,4800,4823,4846,4869,4893,4917,4940,4963,4986,5009,5033,5056,5079,5102,5126,5149,5173,5196,5219,5243];
 const downtownY=[3790,3813,3837,3860,3884,3907,3932,3956,3981,4006,4030,4055,4078,4094];
 for(const x of downtownX){if(x<4990)add([[x,dy0+35],[x,dy1]],'lane',1.0);else add([[x,dy0],[x,dy1]],'lane',1.0);}
 for(const y of downtownY){add([[dx0,y],[dx1,y]],'lane',1.0);}
 for(let i=0;i<downtownX.length-1;i++)for(let j=0;j<downtownY.length-1;j++){
  const x=downtownX[i]+7,y=downtownY[j]+7,w=downtownX[i+1]-x-7,h=downtownY[j+1]-y-7;
  if(inGreen(x,y,4)||w<5||h<5||rand()<.6)continue;
  if(rand()>.55)add([[x,y],[x+w,y],[x+w,y+h*.6],[x+w*.55,y+h*.6],[x+w*.55,y+h],[x,y+h]],'building',.68);
  else add([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'building',.68);
 }
 // Towns have a quiet footprint and a handful of streets, not heavy squares.
 for(const a of M.areas.filter(a=>a.regional)){
  const r=['Seward','Crete','Waverly','Milford'].includes(a.name)?135:95;
  polygon(a.x,a.y,r,r*.95,'urban');
  for(let i=-2;i<=2;i++){
   add([[a.x-r*.85,a.y+i*29],[a.x+r*.85,a.y+i*29]],'local',.45);
   add([[a.x+i*30,a.y-r*.8],[a.x+i*30,a.y+r*.8]],'local',.45);
  }
  for(let col=-2;col<2;col++)for(let row=-2;row<2;row++){
   if(rand()<.48)continue;
   const x=a.x+col*30+6,y=a.y+row*29+6,w=12+rand()*7,h=10+rand()*8;
   add([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'building',.44);
  }
 }
 for(const p of M.parks){
  const campus=p.name.includes('Campus');
  if(p.water){
   polygon(p.x,p.y,p.width*.75,p.height*.72,'park');
   const pts=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=.66+rand()*.34;pts.push([p.x+Math.cos(a)*p.width*.5*r,p.y+Math.sin(a)*p.height*.5*r]);}
   add(pts,'water',0,'',true);
  }else polygon(p.x,p.y,p.width*.58,p.height*.57,campus?'campus':'park');
  labels.push({x:p.x,y:p.y,name:p.name,kind:p.water?'water':'park',min:p.name.includes('Branched')||p.name.includes('Pawnee')?.065:campus?.95:.5});
  // Understated walking-path shapes within the large park footprints only.
  if(!p.water&&!campus&&p.height>130){
   add([[p.x-p.width*.24,p.y+p.height*.35],[p.x+p.width*.1,p.y+p.height*.1],[p.x-p.width*.12,p.y-p.height*.12],[p.x+p.width*.18,p.y-p.height*.37]],'trail',1.3,'',true);
  }
 }
 // Small authored campus courts, never a promise of real building geometry.
 // These used to disappear beneath the campus fill because buildings were
 // painted first. Buildings now paint above land-use areas and below roads.
 for(const p of M.parks.filter(p=>p.name.includes('Campus'))){
  for(let col=-1;col<=1;col++)for(let row=-1;row<=1;row++){
   if(col===0&&row===0)continue;
   const x=p.x+col*p.width*.24-8,y=p.y+row*p.height*.23-7;
   const w=13+rand()*9,h=10+rand()*8;
   add([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'building',.30);
  }
 }
 // Keep a small neighborhood context around ALL fictional venue locations,
 // including places outside the arterial grid. No remote tile loading.
 for(const v of root.SpotCore.VENUES){
  if(!inGreen(v.x,v.y,0)){
   const w=v.category==='club'?24:15,h=v.category==='club'?17:11;
   add([[v.x-w/2,v.y-h/2],[v.x+w/2,v.y-h/2],[v.x+w/2,v.y+h/2],[v.x-w/2,v.y+h/2]],'building',.34);
  }
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3+.4,x=v.x+Math.cos(a)*(55+rand()*40),y=v.y+Math.sin(a)*(55+rand()*40);
   if(inGreen(x,y,4)||features.some(f=>f.type==='building'&&x>f.b[0]-8&&x<f.b[2]+8&&y>f.b[1]-8&&y<f.b[3]+8))continue;
   const w=8+rand()*11,h=9+rand()*13;
   add([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'building',.72);
  }
 }
 const creek=[pt(-96.728,40.57),pt(-96.721,40.65),pt(-96.716,40.71),pt(-96.728,40.77),pt(-96.734,40.81),pt(-96.728,40.85),pt(-96.699,40.89),pt(-96.622,40.925),pt(-96.54,40.953),pt(-96.39,41.03)];
 add(creek,'greenway',0,'',true);add(creek,'river',0,'',true);
 // Additional Antelope Valley corridor is schematic, as is the base map.
 const valley=[pt(-96.67,40.75),pt(-96.672,40.782),pt(-96.683,40.802),pt(-96.687,40.82),pt(-96.685,40.84)];
 add(valley,'greenway',.3,'',true);add(valley,'river',.35,'',true);
 const seen=new Set();for(const r of [...M.roads].reverse()){
  if(seen.has(r.name)&&r.name==='Interstate 80')continue;seen.add(r.name);
  const highway=r.name.includes('Interstate'),arterial=/^(US |NE )/.test(r.name);
  const type=highway?'highway':arterial?'arterial':r.major?'road':'lane';
  add(r.points,type,type==='lane'?1:type==='road'?.17:0,r.name,highway&&r.points.length>2);
  const p0=r.points[0],pn=r.points.at(-1),angle=Math.atan2(pn[1]-p0[1],pn[0]-p0[0]);
  labels.push({x:(p0[0]+pn[0])/2,y:(p0[1]+pn[1])/2,name:r.name.replace('Interstate ','I-'),kind:highway?'highway':'road',min:highway?.09:arterial?.22:r.major?1.35:3.3,angle});
 }
 for(const a of M.areas)labels.push({...a,kind:a.regional?'town':'area',min:a.regional?0:.28,max:a.regional?99:2.8,y:a.y-(a.regional?125:100)});
 labels.push({x:city[0],y:city[1]-320,name:'LINCOLN',kind:'city',min:0,max:.31});
 const priority={city:0,town:1,area:2,water:3,park:4,highway:5,road:6};labels.sort((a,b)=>priority[a.kind]-priority[b.kind]);
 const order=['field','field2','urban','neighborhood','park','campus','greenway','water','river','trail','building','local','lane','road','arterial','highway'];
 let canvas=null,ctx=null,lastDraw=null,lastLabels=[],lastStats={buildings:0,features:0};const index=new Map(),cell=512;
 for(let i=0;i<features.length;i++){const b=features[i].b;for(let x=Math.floor(b[0]/cell);x<=Math.floor(b[2]/cell);x++)for(let y=Math.floor(b[1]/cell);y<=Math.floor(b[3]/cell);y++){const k=x+':'+y;if(!index.has(k))index.set(k,[]);index.get(k).push(i);}}
 function attach(el){canvas=el;ctx=canvas.getContext('2d',{alpha:false});lastDraw=null;}
 function draw(camera,d,obstacles=[]){if(!canvas||!ctx)return;
  const theme=document.documentElement.dataset.theme==='dark'?'dark':'light',palette=palettes[theme];
  const ratio=Math.min(window.devicePixelRatio||1,2),w=Math.round(d.width*ratio),h=Math.round(d.height*ratio);
  const key=[camera.x,camera.y,camera.zoom,w,h,theme,...obstacles.map(b=>`${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.w)},${Math.round(b.h)}`)].join(':');if(key===lastDraw)return;lastDraw=key;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=d.width+'px';canvas.style.height=d.height+'px';}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle=palette.ground;ctx.fillRect(0,0,d.width,d.height);
  const z=camera.zoom,tx=d.centerX-camera.x*z,ty=d.centerY-camera.y*z,view=[-tx/z,-ty/z,(d.width-tx)/z,(d.height-ty)/z],ids=new Set();
  for(let x=Math.floor(view[0]/cell);x<=Math.floor(view[2]/cell);x++)for(let y=Math.floor(view[1]/cell);y<=Math.floor(view[3]/cell);y++)for(const id of index.get(x+':'+y)||[])ids.add(id);
  lastStats={buildings:0,features:0,zoom:z};
  const layers={};for(const id of ids){const f=features[id],b=f.b;if(z<f.min||b[0]>view[2]||b[2]<view[0]||b[1]>view[3]||b[3]<view[1])continue;(layers[f.type]||=[]).push(f);lastStats.features++;}
  ctx.setTransform(ratio*z,0,0,ratio*z,ratio*tx,ratio*ty);ctx.lineJoin='round';ctx.lineCap='round';
  for(const type of order){const fs=layers[type]||[];if(!fs.length)continue;
   if(type==='building'){
    ctx.fillStyle=palette.building;ctx.strokeStyle=palette.buildingEdge;ctx.lineWidth=.5/z;
    for(const f of fs){
     // Fade by scale, never by timers or pointer state. Panning cannot unload
     // detail, and small mobile screens use the exact same geometry as desktop.
     const edge=Math.min(f.b[2]-f.b[0],f.b[3]-f.b[1])*z;
     const opacity=Math.min(1,Math.max(0,(z-f.min)/.4))*Math.min(1,Math.max(0,(edge-1.2)/2.4));
     if(opacity<=.01)continue;
     ctx.globalAlpha=opacity;ctx.fill(f.path);if(z>1.4)ctx.stroke(f.path);lastStats.buildings++;
    }
    ctx.globalAlpha=1;continue;
   }
   if(fillTypes.has(type)){ctx.fillStyle=palette[type];for(const f of fs)ctx.fill(f.path);continue;}
   const base={local:1.55,lane:1.2,road:3.2,arterial:5.5,highway:7,river:2.8,greenway:23,trail:1.2}[type];
   const limits=type==='greenway'?[1.1,27]:type==='trail'?[.5,1.2]:type==='highway'?[1.5,6]:type==='road'?[.7,5]:[.5,type==='arterial'?5:2.4];
   const sw=Math.max(limits[0],Math.min(limits[1],base*z));
   if(['road','highway','arterial'].includes(type)){ctx.strokeStyle=type==='highway'?palette.highwayEdge:palette.edge;ctx.lineWidth=(sw+1.2)/z;for(const f of fs)ctx.stroke(f.path);}
   ctx.strokeStyle=type==='highway'?palette.highway:type==='river'?palette.river:type==='greenway'?palette.park:type==='trail'?palette.trail:['local','lane'].includes(type)?palette.minor:palette.road;
   ctx.lineWidth=sw/z;if(type==='trail')ctx.setLineDash([2.5/z,4/z]);for(const f of fs)ctx.stroke(f.path);ctx.setLineDash([]);
  }
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  const occupied=obstacles.map(b=>({...b}));lastLabels=[];const intersects=root.SpotMapCore.intersects;
  for(const l of labels){
   if(z<l.min||z>(l.max||99))continue;
   const x=tx+l.x*z,y=ty+l.y*z-(l.kind==='town'?18:l.kind==='city'?27:0);
   if(x<25||x>d.width-25||y<65||y>d.height-25)continue;
   const size=l.kind==='city'?22:l.kind==='town'?11:l.kind==='area'?10:9;
   const text=l.kind==='area'?l.name.toUpperCase():l.name;
   ctx.font=`${l.kind==='city'?550:l.kind==='town'?600:500} ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
   const tw=ctx.measureText(text).width+12;let angle=0;
   if(l.kind==='road'&&z>1.2){angle=l.angle;if(angle>Math.PI/2)angle-=Math.PI;if(angle< -Math.PI/2)angle+=Math.PI;}
   const aw=Math.abs(Math.cos(angle))*tw+Math.abs(Math.sin(angle))*16,ah=Math.abs(Math.sin(angle))*tw+Math.abs(Math.cos(angle))*16;
   // Try one alternate position for towns, which matters at regional scale.
   const options=[{x:x-aw/2,y:y-ah/2,w:aw,h:ah}];
   if(l.kind==='city')for(const shift of [-38,-65,42,65])options.push({x:x-aw/2,y:y+shift-ah/2,w:aw,h:ah});
   if(l.kind==='area')for(const shift of [-22,22,-42])options.push({x:x-aw/2,y:y+shift-ah/2,w:aw,h:ah});
   if(l.kind==='town')options.push({x:x-aw/2,y:y+40-ah/2,w:aw,h:ah},{x:x+26,y:y+12-ah/2,w:aw,h:ah});
   const box=options.find(b=>b.x>10&&b.x+b.w<d.width-10&&!occupied.some(o=>intersects(b,o,l.kind==='road'?12:7)));if(!box)continue;
   occupied.push(box);lastLabels.push({...box,name:l.name,kind:l.kind});
   ctx.save();ctx.translate(box.x+box.w/2,box.y+box.h/2);ctx.rotate(angle);
   ctx.lineWidth=3;ctx.strokeStyle=palette.halo;ctx.strokeText(text,0,0);ctx.fillStyle=['road','park','water','highway'].includes(l.kind)?palette.sub:palette.text;ctx.fillText(text,0,0);ctx.restore();
  }
 }
 root.SpotCartography={attach,draw,invalidate(){lastDraw=null;},featureCount:features.length,getLabels:()=>lastLabels.map(b=>({...b})),getStats:()=>({...lastStats}),style:'spaced-activity-v4.6'};
})(window);
