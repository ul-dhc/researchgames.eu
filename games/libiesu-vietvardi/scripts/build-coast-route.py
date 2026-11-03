"""Rebuild the cached coastal path from merged OSM API map JSON.

Usage: python3 scripts/build-coast-route.py SOURCE.json [OUTPUT.js]
Source boxes and attribution are retained in the generated file.
"""
import json,math,heapq,collections,sys
from pathlib import Path
R=6371000
rad=math.pi/180
names=['Miķeļtornis','Sīkrags','Mazirbe','Košrags','Pitrags','Saunags','Vaide','Kolka']
game_root=Path(__file__).resolve().parents[1]
text=(game_root/'data.js').read_text()
pairs=json.loads(text.removeprefix('const GAME_DATA = ').removesuffix(';\n').removesuffix(';'))['pairs']
stops=[next(p for p in pairs if p['lv']==name) for name in names]
elements=json.loads(Path(sys.argv[1]).read_text())['elements']
nodes={n['id']:n for n in elements if n['type']=='node'}
ways=[w for w in elements if w['type']=='way']
place_ids=[417803755,400898627,400898626,390252032,400901492,390251951,400901493,264645216]
stops=[dict(p,lat=nodes[n]['lat'],lon=nodes[n]['lon']) for p,n in zip(stops,place_ids)]
def dist(a,b):
 dlat=(b[0]-a[0])*rad;dlon=(b[1]-a[1])*rad
 h=math.sin(dlat/2)**2+math.cos(a[0]*rad)*math.cos(b[0]*rad)*math.sin(dlon/2)**2
 return R*2*math.atan2(math.sqrt(h),math.sqrt(max(0,1-h)))
def pos(n):return [nodes[n]['lat'],nodes[n]['lon']]
coast=[[p['lat'],p['lon']] for p in stops]
def shore_distance(p):
 x=p[1]*math.cos(57.7*rad)*111195;y=p[0]*111195
 best=math.inf
 for a,b in zip(coast,coast[1:]):
  ax=a[1]*math.cos(57.7*rad)*111195;ay=a[0]*111195
  bx=b[1]*math.cos(57.7*rad)*111195;by=b[0]*111195
  dx=bx-ax;dy=by-ay;t=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
  best=min(best,math.hypot(x-ax-t*dx,y-ay-t*dy))
 return best
major={'motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link'}
factors={'track':.8,'path':3,'footway':1.5,'cycleway':.8,'pedestrian':1.2,'residential':1.5,'living_street':1.2,'service':1.3,'unclassified':1.2,'steps':4}
graph=collections.defaultdict(list)
for w in ways:
 t=w.get('tags',{});kind=t.get('highway')
 if kind not in factors and kind not in major:continue
 if kind.startswith(('motorway','trunk')):continue
 if t.get('foot') in {'no','private'}:continue
 if t.get('access') in {'no','private'} and t.get('foot') not in {'yes','designated','permissive'}:continue
 for a,b in zip(w['nodes'],w['nodes'][1:]):
  if a not in nodes or b not in nodes:continue
  blocked=False
  for node_id in [a,b]:
   nt=nodes[node_id].get('tags',{})
   if nt.get('foot') in {'no','private'} or (nt.get('access') in {'no','private'} and nt.get('foot') not in {'yes','designated','permissive'}):blocked=True
  if blocked:continue
  pa,pb=pos(a),pos(b);length=dist(pa,pb)
  if not length:continue
  coast_dist=shore_distance([(pa[0]+pb[0])/2,(pa[1]+pb[1])/2])
  is_main=kind.startswith(('motorway','trunk','primary')) or t.get('ref','').startswith('P')
  if is_main:continue
  factor=factors.get(kind,2.5)
  cost=length*factor*(1+(coast_dist/650)**2)
  edge={'distance':length,'way':w['id'],'highway':kind,'name':t.get('name',''),'mainRoad':is_main}
  graph[a].append((b,cost,edge));graph[b].append((a,cost,edge))
anchors=[min(graph,key=lambda n:dist([p['lat'],p['lon']],pos(n))) for p in stops]
data={'source':'https://www.openstreetmap.org','sourceBboxes':[[21.95,57.565,22.3,57.72],[22.29,57.645,22.63,57.785]],'attribution':'© OpenStreetMap contributors','retrievedOn':'2026-10-29','profile':'coastal_walking','routing':'Connected OSM coastal route; prefer small tracks and village roads over beach paths, penalise P roads and inland detours. No invented shortcuts.','stops':[{'name':name,'coordinate':pos(n),'snapDistanceMetres':round(dist([p['lat'],p['lon']],pos(n)),1),'placeNodeId':place_ids[i]} for i,(name,p,n) in enumerate(zip(names,stops,anchors))],'legs':[]}
print('Graph',len(nodes),'nodes',len(ways),'ways','Anchors',[(n['name'],n['snapDistanceMetres']) for n in data['stops']])
for i,(start,end) in enumerate(zip(anchors,anchors[1:])):
 queue=[(0,start)];costs={start:0};prev={}
 while queue:
  c,n=heapq.heappop(queue)
  if c!=costs[n]:continue
  if n==end:break
  for next,cost,edge in graph[n]:
   new=c+cost
   if new<costs.get(next,math.inf):
    costs[next]=new;prev[next]=(n,edge);heapq.heappush(queue,(new,next))
 if end not in costs:raise ValueError(f'No connected route for {names[i]} to {names[i+1]}')
 path=[end];edges=[];n=end
 while n!=start:
  n,edge=prev[n];path.append(n);edges.append(edge)
 path.reverse();edges.reverse()
 length=sum(e['distance'] for e in edges)
 majorlength=sum(e['distance'] for e in edges if e['mainRoad'])
 print(names[i],names[i+1],round(length),'m, major road',round(majorlength),'m',collections.Counter(e['highway'] for e in edges))
 leg={'from':names[i],'to':names[i+1],'distanceMetres':round(length,1),'majorRoadMetres':round(majorlength,1),'osmWayIds':list(dict.fromkeys(e['way'] for e in edges)),'coordinates':[pos(n) for n in path]}
 data['legs'].append(leg)
data['license']='https://opendatacommons.org/licenses/odbl/1-0/'
output=Path(sys.argv[2]) if len(sys.argv)>2 else game_root/'coast-roads.js'
output.write_text('/* Cached connected OSM coastal tracks and paths; no routing request during play. */\n(function(root){\n  \"use strict\";\n  const data = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n  if (typeof module !== \"undefined\" && module.exports) module.exports = data;\n  else root.LivonianRoads = data;\n})(typeof window === \"undefined\" ? globalThis : window);\n')
