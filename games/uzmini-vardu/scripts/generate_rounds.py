#!/usr/bin/env python3
"""Deterministic, connected crossword sets using only verified accepted records."""
from pathlib import Path
import collections, hashlib, json, random
ROOT=Path(__file__).resolve().parent.parent

def positions(word,x,y,d):return [(x+(0 if d else i),y+(i if d else 0),ch) for i,ch in enumerate(word)]
def bounds(placements):
 cells=[(x,y) for p in placements for x,y,_ in positions(p['word'],p['x'],p['y'],p['dir'])]
 xs,ys=zip(*cells);return min(xs),min(ys),max(xs),max(ys)
def propose(rec,x,y,d,grid,used):
 cells=positions(rec['word'],x,y,d);before=(x-(0 if d else 1),y-(1 if d else 0));after=(x+(0 if d else len(cells)),y+(len(cells) if d else 0))
 if before in grid or after in grid:return None
 crosses=0
 for xx,yy,ch in cells:
  if (xx,yy) in grid:
   if grid[xx,yy]!=ch or d in used[xx,yy] or len(used[xx,yy])>1:return None
   crosses+=1
  else:
   neighbors=[(xx-1,yy),(xx+1,yy)] if d else [(xx,yy-1),(xx,yy+1)]
   if any(p in grid for p in neighbors):return None
 if not crosses:return None
 return crosses

def round_grid(pool,size,rng,covered=None):
 covered=covered or set()
 for attempt in range(70):
  first=rng.choice([r for r in pool if r['id'] not in covered] or pool);placed=[dict(first,x=0,y=0,dir=1)];grid={};used=collections.defaultdict(set)
  for x,y,ch in positions(first['word'],0,0,1):grid[x,y]=ch;used[x,y].add(1)
  picked={first['id']}
  while len(placed)<size:
   choices=[];remaining=[r for r in pool if r['id'] not in picked and all(r['word']!=p['word'] and r['synset']!=p['synset'] for p in placed)]
   rng.shuffle(remaining)
   for rec in remaining:
    for (gx,gy),char in list(grid.items()):
     if len(used[gx,gy])!=1:continue
     d=1-next(iter(used[gx,gy]))
     for i,ch in enumerate(rec['word']):
      if ch!=char:continue
      x=gx-(0 if d else i);y=gy-(i if d else 0);cross=propose(rec,x,y,d,grid,used)
      if cross is None:continue
      p=dict(rec,x=x,y=y,dir=d);left,top,right,bottom=bounds(placed+[p]);cols=right-left+1;rows=bottom-top+1
      if cols>9 or rows>17:continue
      score=cols*rows+abs(rows-cols*1.25)*2-cross*9+rng.random()*5-(250 if rec['id'] not in covered else 0)
      choices.append((score,p))
   if not choices:break
   choices.sort(key=lambda a:a[0]);p=rng.choice(choices[:min(5,len(choices))])[1];placed.append(p);picked.add(p['id'])
   for x,y,ch in positions(p['word'],p['x'],p['y'],p['dir']):grid[x,y]=ch;used[x,y].add(p['dir'])
  if len(placed)==size:
   left,top,right,bottom=bounds(placed)
   for p in placed:p['x']-=left;p['y']-=top
   starts=sorted({(p['y'],p['x']) for p in placed});number={p:i+1 for i,p in enumerate(starts)}
   return {'cols':right-left+1,'rows':bottom-top+1,'words':[{'id':p['id'],'x':p['x'],'y':p['y'],'dir':p['dir'],'n':number[p['y'],p['x']]} for p in sorted(placed,key=lambda p:(number[p['y'],p['x']],p['dir']))]}
 raise RuntimeError('Could not form a compact connected grid of '+str(size))

def generate():
 bank=json.loads((ROOT/'data/accepted-bank.json').read_text());sets={}
 for tier in ['B','I','E']:
  pool=[r for r in bank['records'] if r['tier']==tier]
  sets[tier]=[];covered=set()
  for seed in range(80):
   rng=random.Random('rg-tier-1:'+tier+':'+str(seed));used_words=set();used_synsets=set();rounds=[]
   for count in [5,7,9]:
    available=[r for r in pool if r['word'] not in used_words and r['synset'] not in used_synsets]
    puzzle=round_grid(available,count,rng,covered);lookup={r['id']:r for r in pool}
    for p in puzzle['words']:used_words.add(lookup[p['id']]['word']);used_synsets.add(lookup[p['id']]['synset']);covered.add(p['id'])
    rounds.append(puzzle)
   sets[tier].append({'seed':seed,'rounds':rounds})
   print(tier,seed,'covered',len(covered),'of',len(pool),flush=True)
   if seed>=7 and len(covered)==len(pool):break
  assert len(covered)==len(pool), 'Not every accepted record has a tested playable placement'
 content={'version':'tiers-1','sizes':[5,7,9],'sets':sets}
 (ROOT/'data/round-sets.json').write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
 key=hashlib.sha256(json.dumps({'bank':bank,'sets':content},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 (ROOT/'data/content-key.txt').write_text(key+'\n')
 return content
if __name__=='__main__':generate()
