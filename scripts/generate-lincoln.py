"""Deterministic fictional demo fixtures; approximate venue coordinates, not real listings.
Basemap scaffold is an original schematic based on Lincoln's main-road orientation.
Never describe the schematic or synthetic building rectangles as surveyed geometry.
"""
import json, math, random
from pathlib import Path
R=Path(__file__).resolve().parents[1]
rng=random.Random(20260927)
Z=14;S=256*2**Z
west,east,south,north=-97.13,-96.37,40.55,41.07

def world(lng,lat):
 return [(lng+180)/360*S,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*S]
origin=world(west,north)
def xy(lng,lat):
 x,y=world(lng,lat);return [round(x-origin[0],2),round(y-origin[1],2)]
W,H=xy(east,south)
areas=[
('Haymarket',40.8152,-96.7113,28,.006,.0048),
('Downtown',40.8100,-96.7000,32,.007,.006),
('Near South',40.790,-96.703,14,.009,.011),
('Belmont',40.858,-96.703,16,.011,.014),
('University Place',40.839,-96.652,18,.009,.012),
('Havelock',40.858,-96.628,18,.009,.010),
('Bethany',40.819,-96.625,16,.009,.010),
('College View',40.772,-96.650,18,.009,.012),
('South Lincoln',40.735,-96.678,20,.012,.018),
('East Lincoln',40.790,-96.603,18,.014,.014),
('West Lincoln',40.835,-96.770,12,.015,.013),
('Country Club',40.774,-96.690,14,.008,.010),
('Capitol Beach',40.821,-96.747,8,.006,.006),
('Antelope Valley',40.824,-96.682,8,.009,.008),
('Waverly',40.917,-96.529,12,.007,.009),
('Seward',40.907,-97.098,12,.007,.008),
('Hickman',40.621,-96.630,10,.005,.006),
('Roca',40.656,-96.662,6,.003,.004),
('Bennet',40.680,-96.506,8,.004,.005),
('Eagle',40.818,-96.432,8,.004,.005),
('Denton',40.737,-96.844,6,.003,.004),
('Malcolm',40.908,-96.866,6,.003,.004),
('Raymond',40.956,-96.783,6,.003,.004),
('Walton',40.786,-96.566,6,.003,.004),
('Crete',40.627,-96.961,8,.006,.007),
('Milford',40.771,-97.051,8,.005,.006)]
assert sum(a[3] for a in areas)==336
names_cafe=['Juniper Coffee','Common Ground','Daybreak','Sunday Café','Cedar & Steam','Little Lantern','Velvet Bean','Paper Moon Café','Golden Hour Coffee','Meadow & Mug','Morning Chapter','Honeycomb Coffee','Fern & Filter','Pocket Coffee','Slow Sunday','Good Company Coffee','Sunroom Café','The Reading Room','Clover Coffee','Moss & Milk','Bluebird Brew','The Daily Pour','Cloud Nine Coffee','Quiet Corner','Kindred Coffee','Hazel & Oak','Foundry Coffee','Little Acre','The Coffee Loft','Gather & Grind']
names_bar=['After Hours','The Willow','Copper Lantern','The Green Room','Night Orchard','The Lowlight','Velvet Rabbit','The Lucky Finch','Cinder & Rye','Moonlit Social','The Side Door','The Quiet Fox','Last Chapter','The Little Current','Evening Standard','The Amber Room','Sundown Social','The Brass Key','Half Moon Bar','The Long Weekend','The Nook','Paper Tiger','The Friendly Ghost','The Hearth','Local Standard','The Tenth Note']
themes=['sage','peach','lavender','yellow','rose','blue']
# Retain recognizable first-version fixtures, but use approximate Lincoln locations.
base=[('juniper','Juniper Coffee','cafe','Haymarket',40.8144,-96.7115,58),('common','Common Ground','cafe','Downtown',40.8114,-96.7011,26),('after','After Hours','bar','Haymarket',40.8171,-96.7101,94),('daybreak','Daybreak','cafe','University Place',40.8405,-96.6509,17),('willow','The Willow','bar','Havelock',40.8584,-96.6315,63),('sunday','Sunday Café','cafe','College View',40.7750,-96.6492,0)]
venues=[]
for i,(vid,name,cat,area,lat,lng,count) in enumerate(base):
 x,y=xy(lng,lat)
 venues.append(dict(id=vid,name=name,category=cat,area=area,lat=lat,lng=lng,x=x,y=y,people=count,age=None if not count else 1+i%4,theme=themes[i],mark=['j.','cg','ah','d.','w.','s.'][i]))
used={v['name'] for v in venues}; idx=0
for area,lat0,lng0,n,dy,dx in areas:
 n-=sum(v['area']==area for v in venues)
 for j in range(n):
  for attempt in range(500):
   lat=lat0+rng.uniform(-dy,dy);lng=lng0+rng.uniform(-dx,dx)
   # Keep distinct placeholders far enough apart to navigate after zooming.
   if all(((lat-v['lat'])*111000)**2+((lng-v['lng'])*84000)**2>100**2 for v in venues):break
  cat='cafe' if rng.random()<.59 else 'bar'
  pool=names_cafe if cat=='cafe' else names_bar
  stem=pool[(idx*7+j)%len(pool)]
  name=stem
  if name in used:name=f'{stem} · {area}'
  suffix=2
  while name in used:
   name=f'{stem} · {area} {suffix}';suffix+=1
  used.add(name);vid=f'spot-{len(venues)+1:03}'
  x,y=xy(lng,lat)
  venues.append(dict(id=vid,name=name,category=cat,area=area,lat=round(lat,6),lng=round(lng,6),x=x,y=y,people=0,age=1+rng.randrange(7),theme=themes[len(venues)%6],mark=''.join(w[0] for w in stem.split() if w[0].isalpha())[:2].lower()))
  idx+=1
for v in venues:
 v['street']=v['area']
 v['address']=v['area']+(' area, Lincoln, NE' if v['area'] in {a[0] for a in areas[:14]} else ', NE')
 v['description']='A fictional '+('café' if v['category']=='cafe' else 'bar')+' in the '+v['area']+' area. A placeholder to explore the experience.'
# 3,500 participating other users; the viewer is already one of the 5,000 accounts.
unknown={v['id'] for v in venues[210:240] if int(v['id'].split('-')[-1])%2==0}|{'sunday'}
weights=[]
for v in venues[6:]:
 weights.append(0 if v['id'] in unknown else (.4+rng.random()**2*3)*(1.8 if v['category']=='bar' else .8))
remaining=3500-sum(v['people'] for v in venues[:6]);total=sum(weights)
counts=[int(remaining*w/total) for w in weights]
for i in sorted(range(len(counts)),key=lambda i:(remaining*weights[i]/total)%1,reverse=True)[:remaining-sum(counts)]:counts[i]+=1
for v,c in zip(venues[6:],counts):v['people']=c;v['age']=v['age'] if c else None
assert sum(v['people'] for v in venues)==3500
# A compact named directory; unnamed accounts have no exposed names.
people=[dict(id='maya',name='Maya Chen',handle='maya.chen',color='peach',venueId='juniper'),dict(id='elliot',name='Elliot Park',handle='elliot.p',color='blue',venueId='juniper'),dict(id='noah',name='Noah Hayes',handle='noah.h',color='lavender',venueId='after'),dict(id='sam',name='Sam Rivera',handle='sam.r',color='sage',venueId=None),dict(id='alex',name='Alex Morgan',handle='alex.m',color='yellow',venueId='common'),dict(id='jordan',name='Jordan Lee',handle='jordan.lee',color='rose',venueId='willow'),dict(id='casey',name='Casey Reed',handle='casey.r',color='sage',venueId=None)]
first=['Olivia','Liam','Ava','Elijah','Sofia','Lucas','Amelia','Mason','Isabella','Ethan','Harper','James','Evelyn','Aiden','Aria','Henry','Chloe','Leo','Grace','Jack','Nora','Owen','Lily','Daniel','Zoey','Mateo','Riley','Sebastian','Layla','Wyatt','Ellie','Julian','Stella','Isaac','Hazel','Caleb','Violet','Nathan','Aurora','Adrian','Savannah','Miles','Audrey','Theo','Brooklyn','Asher','Bella','Ezra','Claire','Carter','Lucy','Xavier','Hannah','Luca','Paisley','Finn','Sophie','Jasper','Quinn','Elias','Natalie','Kai','Naomi','Cole','Leah','Dylan','Elena','Micah','Sarah','Amir','Ivy','Nolan','Alice','Rowan','Sadie','Josiah','Ruby','Felix','Eva','Devin','Clara','Tobias','Mila','Simon','Jade','Reed','Rose','Gavin','Tessa','Oscar','June','Wesley','Freya']
last=['Bennett','Patel','Brooks','Nguyen','Reyes','Walker','Foster','Kim','Turner','Diaz','Mitchell','Taylor','Anderson','Hughes','Thompson','Singh','Cooper','Allen','Parker','Santos','Reed','Wright','Lopez','Hill','Baker','Wilson','Campbell','Flores','Price','Russell','Reed']
active=[v for v in venues if v['people']>=4]
for i in range(93):
 name=first[i]+' '+last[(i*7+3)%len(last)]
 # Of 56 added accepted friends, 39 are present: together with the first 3 = 42.
 present=(i<39) if i<56 else (i%4!=0)
 v=active[(i*7+9)%len(active)] if present else None
 if i<4:v=next(v for v in venues if v['id']=='juniper')
 people.append(dict(id=f'person-{i+8:03}',name=name,handle=name.lower().replace(' ','.'),color=themes[i%6],venueId=v['id'] if v else None))
lookup={v['id']:v for v in venues}
for p in people:
 p['initials']=''.join(s[0] for s in p['name'].split());p['shares']=bool(p['venueId']);p['age']=lookup[p['venueId']]['age'] if p['venueId'] else None
relations={p['id']:'accepted' for p in people[:4]+people[7:63]}
relations['alex']='incoming'
for p in people[63:68]:relations[p['id']]='incoming'
assert sum(s=='accepted' for s in relations.values())==60
assert sum(p['shares'] and relations.get(p['id'])=='accepted' for p in people)==42
# Build 5,000 unique accounts. Named people are part of counts, never extra dots.
users=[];allocated={v['id']:0 for v in venues}
for p in people:
 users.append(dict(id=p['id'],venueId=p['venueId']))
 if p['venueId']:allocated[p['venueId']]+=1
for v in venues:
 assert allocated[v['id']]<=v['people']
 for _ in range(v['people']-allocated[v['id']]):users.append(dict(id=f'user-{len(users)+1:04}',venueId=v['id']))
while len(users)<4999:users.append(dict(id=f'user-{len(users)+1:04}',venueId=None))
users.append(dict(id='you',venueId=None))
assert len({u['id'] for u in users})==len(users)==5000
# Geographic context uses approximate original polylines, not an imported GIS survey.
roads=[]
def road(name,points,major=True):roads.append(dict(name=name,points=[xy(lon,lat) for lon,lat in points],major=major))
for lat,name in [(40.915,'West Alvo Road'),(40.900,'Fletcher Avenue'),(40.884,'Superior Street'),(40.871,'Folkways Boulevard'),(40.856,'Havelock Avenue'),(40.842,'Adams Street'),(40.828,'Holdrege Street'),(40.8135,'O Street'),(40.799,'A Street'),(40.7845,'South Street'),(40.770,'Van Dorn Street'),(40.7555,'Pioneers Boulevard'),(40.741,'Old Cheney Road'),(40.7265,'Pine Lake Road'),(40.712,'Yankee Hill Road')]:
 road(name,[(-96.82,lat),(-96.556,lat)])
for lon,name in [(-96.753,'NW 12th Street'),(-96.724,'North 1st Street'),(-96.717,'North 6th Street'),(-96.708,'9th Street'),(-96.704,'13th Street'),(-96.696,'17th Street'),(-96.686,'27th Street'),(-96.667,'40th Street'),(-96.653,'48th Street'),(-96.638,'56th Street'),(-96.622,'70th Street'),(-96.598,'84th Street'),(-96.574,'98th Street')]:
 road(name,[(lon,40.705),(lon,40.932)])
road('Cornhusker Highway',[(-96.733,40.841),(-96.700,40.85),(-96.669,40.864),(-96.631,40.880),(-96.57,40.91)])
road('Interstate 80',[(-96.84,40.881),(-96.791,40.898),(-96.740,40.912),(-96.69,40.922),(-96.625,40.933),(-96.55,40.94)])
road('Interstate 180',[(-96.714,40.821),(-96.72,40.855),(-96.717,40.91)])
for lat,name in [(40.8151,'P Street'),(40.8167,'Q Street'),(40.8182,'R Street'),(40.8119,'N Street'),(40.8103,'M Street'),(40.8087,'L Street'),(40.8071,'K Street')]:road(name,[(-96.72,lat),(-96.68,lat)],False)

road('Interstate 80',[(-97.13,40.82),(-97.08,40.83),(-97.02,40.84),(-96.94,40.85),(-96.88,40.87),(-96.84,40.881),(-96.791,40.898),(-96.740,40.912),(-96.69,40.922),(-96.625,40.933),(-96.55,40.94),(-96.48,40.97),(-96.37,41.01)])
road('US 34',[(-97.13,40.907),(-97.098,40.907),(-97.0,40.910),(-96.90,40.909),(-96.81,40.908),(-96.76,40.881),(-96.74,40.850)])
road('US 77',[(-96.711,40.55),(-96.708,40.65),(-96.72,40.73),(-96.75,40.77),(-96.75,40.82),(-96.735,40.88),(-96.72,40.96),(-96.719,41.07)])
road('NE 2',[(-96.73,40.76),(-96.68,40.75),(-96.62,40.738),(-96.55,40.705),(-96.505,40.677),(-96.37,40.60)])
road('US 6',[(-96.57,40.910),(-96.53,40.917),(-96.48,40.930),(-96.40,40.970)])
road('O Street / US 34',[(-96.556,40.814),(-96.43,40.816),(-96.37,40.816)])
road('NE 33',[(-97.13,40.63),(-96.96,40.628),(-96.90,40.63),(-96.84,40.66),(-96.71,40.675)])
road('NE 103',[(-97.05,40.55),(-97.05,40.772),(-97.05,40.907)])
road('West Denton Road',[(-97.05,40.738),(-96.844,40.738),(-96.747,40.755)])
road('Hickman Road',[(-96.71,40.621),(-96.63,40.621),(-96.505,40.621)])
road('Roca Road',[(-96.71,40.656),(-96.662,40.656),(-96.50,40.656)])
road('Raymond Road',[(-96.92,40.956),(-96.783,40.956),(-96.715,40.956)])
road('Malcolm Road',[(-96.866,40.85),(-96.866,40.908),(-96.866,40.99)])

# City-scale canvas landmarks, deliberately schematic outlines.
parks=[('Branched Oak Lake',-96.865,40.978,.038,.024),('Pawnee Lake',-96.877,40.858,.028,.016),('Wagon Train Lake',-96.584,40.637,.015,.012),('Stagecoach Lake',-96.678,40.606,.015,.010),('Conestoga Lake',-96.85,40.77,.016,.009),('Pioneers Park',-96.767,40.770,.017,.015),('Holmes Lake',-96.626,40.778,.013,.009),('Antelope Park',-96.681,40.785,.007,.011),('Wilderness Park',-96.718,40.741,.010,.03),('Mahoney Park',-96.603,40.834,.008,.008),('Oak Lake',-96.72,40.831,.008,.005),('UNL City Campus',-96.7,40.821,.008,.005),('UNL East Campus',-96.665,40.835,.011,.009)]
geo=dict(baseZoom=Z,worldOrigin=origin,width=W,height=H,bounds=dict(west=west,east=east,south=south,north=north),center=xy(-96.690,40.811),downtown=xy(-96.706,40.814),roads=roads,areas=[dict(name=a[0],x=xy(a[2],a[1])[0],y=xy(a[2],a[1])[1],regional=i>=14) for i,a in enumerate(areas)],parks=[dict(name=n,x=xy(lon,lat)[0],y=xy(lon,lat)[1],width=dx*S/360,height=abs(xy(lon,lat+dy)[1]-xy(lon,lat)[1]),water='Lake' in n) for n,lon,lat,dx,dy in parks])
data=dict(population=5000,venues=venues,people=people,users=users,relations=relations,map=geo)
text=json.dumps(data,separators=(',',':'),ensure_ascii=False)
(R/'lincoln-data.js').write_text('/* All venues, accounts and activity below are fictional demo fixtures. */\n(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.SpotData=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+text+';});\n')
(R/'data'/'fixture-summary.json').write_text(json.dumps(dict(totalUsers=5000,participating=3500,venues=len(venues),friends=60,friendsPresent=42,requests=6,unmappedUsers=1500,geography='Approximate Lincoln and surrounding towns with original schematic offline map; not surveyed geometry or real building inventory'),indent=2))
print('Generated',len(venues),'venues,',len(users),'users,',len(people),'named demo profiles; 60 friends, 42 present.')
