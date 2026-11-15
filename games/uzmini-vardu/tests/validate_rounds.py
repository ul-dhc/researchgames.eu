from pathlib import Path
import collections,hashlib,json,re
R=Path(__file__).resolve().parent.parent
bank=json.loads((R/'data/accepted-bank.json').read_text());records={r['id']:r for r in bank['records']};sets=json.loads((R/'data/round-sets.json').read_text());checks=0;used=collections.defaultdict(set)
def check(v,label):
 global checks
 assert v,label
 checks+=1
for tier,sessions in sets['sets'].items():
 check(len(sessions)>=8,'at least eight tested seeds')
 for s in sessions:
  session_words=set();session_synsets=set()
  for round_index,g in enumerate(s['rounds']):
   check(len(g['words'])==[5,7,9][round_index],'exact round size')
   check(g['cols']<=9 and g['rows']<=17,'mobile bounds')
   cells={};owners=collections.defaultdict(list);expected=set()
   for i,p in enumerate(g['words']):
    r=records[p['id']];word=r['word'];used[tier].add(word)
    check(r['tier']==tier and r['verdict']=='accept','tier independent from round size')
    check(word not in session_words and r['synset'] not in session_synsets,'no repeated words or meanings in one session')
    session_words.add(word);session_synsets.add(r['synset'])
    check(hashlib.sha256(r['clue'].encode('utf-8')).hexdigest()==r['definitionSHA256'],'exact original definition checksum')
    ps=[]
    for j,ch in enumerate(word):
     x=p['x']+(j if p['dir']==0 else 0);y=p['y']+(j if p['dir']==1 else 0);check(0<=x<g['cols'] and 0<=y<g['rows'],'letter inside grid')
     if (x,y) in cells:check(cells[x,y]==ch,'crossing letters agree')
     cells[x,y]=ch;owners[x,y].append(i);ps.append((x,y))
    expected.add((p['dir'],tuple(ps)));check(len(ps)==len(word),'exact answer length')
   runs=set()
   for d in [0,1]:
    for x,y in cells:
     before=(x-(d==0),y-(d==1))
     if before in cells:continue
     ps=[];xx,yy=x,y
     while (xx,yy) in cells:ps.append((xx,yy));xx+=d==0;yy+=d==1
     if len(ps)>1:runs.add((d,tuple(ps)))
   check(runs==expected,'no accidental words, touching words or unexplained runs')
   adjacency={i:set() for i in range(len(g['words']))}
   for ids in owners.values():
    check(len(ids)<=2,'no triple overlap')
    if len(ids)==2:
     a,b=ids;check(g['words'][a]['dir']!=g['words'][b]['dir'],'no collinear overlap');adjacency[a].add(b);adjacency[b].add(a)
   seen={0};todo=[0]
   for i in todo:
    for other in adjacency[i]-seen:seen.add(other);todo.append(other)
   check(len(seen)==len(g['words']),'all words connected by legal crossings')
  check(len(session_words)==21,'21 distinct words through 5/7/9')
check(all(used[t]=={r['word'] for r in records.values() if r['tier']==t} for t in sets['sets']),'every accepted answer appears in tested sets')
report={'assertions':checks,'seeds_per_tier':{t:len(s) for t,s in sets['sets'].items()},'grids':sum(len(s)*3 for s in sets['sets'].values()),'sizes':[5,7,9],'bank_counts':dict(collections.Counter(r['tier'] for r in records.values())),'words_used_across_tested_sets':{k:len(v) for k,v in used.items()},'human_review':False,'child_testing':False,'unique_answers_proven':False}
(R/'tests/grid-results.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
