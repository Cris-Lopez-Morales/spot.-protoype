/* Original, illustrative Lincoln-region cartography. Not surveyed GIS or routing data.
 * Canvas geometry is compiled once; viewport culling and level-of-detail prevent
 * thousands of SVG nodes from being repainted at high zoom. No network requests.
 */
(function(root){'use strict';
 const M=root.SpotCore.MAP, project=root.SpotCore.project, features=[], labels=[];
 const palettes={light:{ground:'#eef0e7',field:'#e7ebdf',field2:'#e9ecdf',urban:'#e3e8dc',block:'#dbe2d4',building:'#cfd9c6',park:'#d0dfbf',parkLine:'#bfd1ab',water:'#bbd8d7',waterLine:'#9cc2c3',road:'#fffefa',edge:'#d9dfd0',minor:'#f7f8f0',highway:'#f7e6b6',highwayEdge:'#e1c995',river:'#b6d4d2',text:'#536751',sub:'#788974',halo:'#f2f4eb',shield:'#fff9e8'},dark:{ground:'#17231c',field:'#1b2a20',field2:'#1d2c22',urban:'#25382b',block:'#2a3e30',building:'#354c39',park:'#2e462f',parkLine:'#40583a',water:'#223d3e',waterLine:'#325251',road:'#49614b',edge:'#1c2b21',minor:'#344a38',highway:'#8a8158',highwayEdge:'#303b27',river:'#315152',text:'#cfdec3',sub:'#9bad95',halo:'#1b2920',shield:'#344633'}};
 let seed=7331;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 function add(points,type,min=0,name=''){
  const path=new Path2D();points.forEach((p,i)=>i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]));
  if(['field','field2','urban','block','building','park','water'].includes(type))path.closePath();
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);features.push({path,type,min,name,b:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]});
 }
 const pt=(lng,lat)=>{const p=project(lng,lat);return[p.x,p.y];};
 // Quiet agricultural patches extend continuously beyond the city.
 for(let y=-400;y<M.height+800;y+=360)for(let x=-400;x<M.width+800;x+=430){
  if(rand()>.62)continue;const gap=14+rand()*22;
  add([[x+gap,y+gap],[x+405,y+gap+rand()*30],[x+412,y+333],[x+gap,y+342]],rand()>.5?'field':'field2');
 }
 const city=pt(-96.69,40.816),rx=1520,ry=1560;
 const shape=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,r=.9+rand()*.1;shape.push([city[0]+Math.cos(a)*rx*r,city[1]+Math.sin(a)*ry*r]);}add(shape,'urban');
 // Original street blocks; kept explicitly illustrative, not individual real buildings.
 const bounds=[...pt(-96.783,40.894),...pt(-96.572,40.708)];
 for(let y=bounds[1];y<bounds[3];y+=65)for(let x=bounds[0];x<bounds[2];x+=61){
  if(((x-city[0])/rx)**2+((y-city[1])/ry)**2>1||rand()<.08)continue;
  if(M.parks.some(p=>Math.abs(x-p.x)<p.width/2+25&&Math.abs(y-p.y)<p.height/2+25))continue;
  add([[x+5,y+5],[x+51,y+5],[x+51,y+54],[x+5,y+54]],'block',.32);
  for(let j=0;j<4;j++){const bx=x+10+(j%2)*22,by=y+11+Math.floor(j/2)*23;add([[bx,by],[bx+13,by],[bx+13,by+16],[bx,by+16]],'building',1.3);}
 }
 // Town footprints and local grid streets are schematic, centered on demo areas.
 for(const a of M.areas.filter(a=>a.regional)){
  const r=['Seward','Crete','Waverly','Milford'].includes(a.name)?130:90;
  add([[a.x-r,a.y-r*.9],[a.x+r,a.y-r],[a.x+r,a.y+r],[a.x-r*.9,a.y+r]],'urban');
  for(let i=-3;i<=3;i++){add([[a.x-r,a.y+i*25],[a.x+r,a.y+i*25]],'local',.15);add([[a.x+i*27,a.y-r],[a.x+i*27,a.y+r]],'local',.15);}
 }
 for(const p of M.parks){
  const pts=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=.76+rand()*.24;pts.push([p.x+Math.cos(a)*p.width*.5*r,p.y+Math.sin(a)*p.height*.5*r]);}
  add(pts,p.water?'water':'park');labels.push({x:p.x,y:p.y,name:p.name,kind:p.water?'water':'park',min:p.name.includes('Branched')||p.name.includes('Pawnee')?.065:.45});
 }
 add([pt(-96.728,40.57),pt(-96.721,40.65),pt(-96.716,40.71),pt(-96.728,40.77),pt(-96.734,40.81),pt(-96.728,40.85),pt(-96.699,40.89),pt(-96.622,40.925),pt(-96.54,40.953),pt(-96.39,41.03)],'river');
 const seen=new Set();for(const r of [...M.roads].reverse()){
  // The expanded regional motorway replaces the shorter legacy segment.
  if(seen.has(r.name)&&r.name==='Interstate 80')continue;seen.add(r.name);
  const type=r.name.includes('Interstate')?'highway':/^(US |NE )/.test(r.name)?'arterial':r.major?'road':'local';
  add(r.points,type,type==='local'?.8:type==='road'?.19:0,r.name);
  const p=r.points[Math.floor(r.points.length/2)],p0=r.points[0],pn=r.points.at(-1);
  labels.push({x:(p0[0]+pn[0])/2,y:(p0[1]+pn[1])/2,name:r.name,kind:'road',min:type==='highway'||type==='arterial'?.13:.8,angle:Math.atan2(pn[1]-p0[1],pn[0]-p0[0])});
 }
 for(const a of M.areas)labels.push({...a,kind:a.regional?'town':'area',min:a.regional?0:.55,y:a.y-(a.regional?145:95)});
 labels.push({x:city[0],y:city[1]-360,name:'LINCOLN',kind:'city',min:0});
 let canvas=null,ctx=null,palette=palettes.light,lastTheme='',lastDraw=null;const index=new Map(),cell=512;
 for(let i=0;i<features.length;i++){const b=features[i].b;for(let x=Math.floor(b[0]/cell);x<=Math.floor(b[2]/cell);x++)for(let y=Math.floor(b[1]/cell);y<=Math.floor(b[3]/cell);y++){const k=x+':'+y;if(!index.has(k))index.set(k,[]);index.get(k).push(i);}}
 const order=['field','field2','urban','block','building','park','water','river','local','road','arterial','highway'];
 function attach(el){canvas=el;ctx=canvas.getContext('2d',{alpha:false});lastDraw=null;}
 function draw(camera,d){if(!canvas||!ctx)return;
  const dark=document.documentElement.dataset.theme==='dark',theme=dark?'dark':'light';palette=palettes[theme];
  const ratio=Math.min(window.devicePixelRatio||1,2),w=Math.round(d.width*ratio),h=Math.round(d.height*ratio);
  const key=[camera.x,camera.y,camera.zoom,w,h,theme].join(':');if(key===lastDraw)return;lastDraw=key;lastTheme=theme;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=d.width+'px';canvas.style.height=d.height+'px';}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle=palette.ground;ctx.fillRect(0,0,d.width,d.height);
  const z=camera.zoom,tx=d.centerX-camera.x*z,ty=d.centerY-camera.y*z;
  const view=[-tx/z,-ty/z,(d.width-tx)/z,(d.height-ty)/z],ids=new Set();
  for(let x=Math.floor(view[0]/cell);x<=Math.floor(view[2]/cell);x++)for(let y=Math.floor(view[1]/cell);y<=Math.floor(view[3]/cell);y++)for(const id of index.get(x+':'+y)||[])ids.add(id);
  const layers={};for(const id of ids){const f=features[id],b=f.b;if(z<f.min||b[0]>view[2]||b[2]<view[0]||b[1]>view[3]||b[3]<view[1])continue;(layers[f.type]||=[]).push(f);}
  ctx.setTransform(ratio*z,0,0,ratio*z,ratio*tx,ratio*ty);ctx.lineJoin='round';ctx.lineCap='round';
  for(const type of order){const fs=layers[type]||[];if(!fs.length)continue;
   if(['local','road','arterial','highway','river'].includes(type)){
    const base={local:2.5,road:7,arterial:10,highway:14,river:5}[type];const sw=Math.max(type==='local'?.5:type==='highway'?1.8:.85,Math.min(type==='highway'?10:7,base*z));
    if(type==='highway'||type==='arterial'){ctx.strokeStyle=type==='highway'?palette.highwayEdge:palette.edge;ctx.lineWidth=(sw+1.5)/z;for(const f of fs)ctx.stroke(f.path);}
    ctx.strokeStyle=type==='highway'?palette.highway:type==='river'?palette.river:type==='local'?palette.minor:palette.road;ctx.lineWidth=sw/z;for(const f of fs)ctx.stroke(f.path);
   }else{ctx.fillStyle=palette[type];for(const f of fs)ctx.fill(f.path);}
  }
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  const taken=[];const priority={city:0,town:1,area:2,water:3,park:4,road:5};
  for(const l of [...labels].sort((a,b)=>priority[a.kind]-priority[b.kind])){
   if(z<l.min||(l.kind==='city'&&z>.7)||(l.kind==='area'&&z>3))continue;
   const x=tx+l.x*z+(l.name==='Hickman'&&z<.2?34:0),y=ty+l.y*z-(l.kind==='town'?34:l.kind==='city'?65:0);if(x<35||x>d.width-35||y<65||y>d.height-24)continue;
   let size=l.kind==='city'?24:l.kind==='town'?12:l.kind==='area'?12:10;const text=l.kind==='area'?l.name.toUpperCase():l.name;
   ctx.font=`${l.kind==='city'?600:l.kind==='town'?600:500} ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
   const tw=ctx.measureText(text).width+10;if(taken.some(b=>Math.abs(b.x-x)<(b.w+tw)/2&&Math.abs(b.y-y)<21))continue;taken.push({x,y,w:tw});
   ctx.save();ctx.translate(x,y);
   if(l.kind==='road'&&z>.65){let a=l.angle;if(a>Math.PI/2)a-=Math.PI;if(a< -Math.PI/2)a+=Math.PI;ctx.rotate(a);}
   ctx.lineWidth=3;ctx.strokeStyle=palette.halo;ctx.strokeText(text,0,0);ctx.fillStyle=l.kind==='road'||l.kind==='park'||l.kind==='water'?palette.sub:palette.text;ctx.fillText(text,0,0);ctx.restore();
  }
 }
 root.SpotCartography={attach,draw,invalidate(){lastDraw=null;},featureCount:features.length};
})(window);
