"""Independent exactness and unchanged topology checks against the official TEI."""
from pathlib import Path
import argparse,collections,hashlib,json,xml.etree.ElementTree as E
R=Path(__file__).resolve().parent.parent;N={'t':'http://www.tei-c.org/ns/1.0'};X='{http://www.w3.org/XML/1998/namespace}id'
p=argparse.ArgumentParser();p.add_argument('--tei',required=True,type=Path);xml=p.parse_args().tei
bank=json.loads((R/'data/accepted-bank.json').read_text());old=json.loads((R/'data/wordnet-bank-v1.json').read_text());target={r['teiSense']:r for r in bank['records']};matched=collections.Counter();checks=0
with xml.open('rb') as f:
 h=hashlib.sha256()
 for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
assert h.hexdigest()==bank['source']['sha256'];checks+=1
for _,entry in E.iterparse(xml,events=['end']):
 if entry.tag!='{'+N['t']+'}entry':continue
 lemmas={''.join(o.itertext()) for o in entry.findall('t:form/t:orth',N)}
 for sense in entry.findall('.//t:sense',N):
  r=target.get(sense.get(X))
  if not r:continue
  assert entry.get(X)==r['teiEntry'] and r['lemma'] in lemmas;checks+=1
  defs=sense.findall('t:def',N);assert len(defs)==1 and ''.join(defs[0].itertext())==r['clue'];checks+=1
  expected='tezaurs_2026_4__synset_'+r['synset'].split('-')[-1]
  assert any(ref.get('type')=='synset' and expected in [ref.get(X,''),ref.get('target','').lstrip('#')] for ref in sense.findall('t:ref',N));checks+=1
  assert hashlib.sha256(r['clue'].encode()).hexdigest()==r['definitionSHA256'];checks+=1;matched[r['id']]+=1
 entry.clear()
assert len(matched)==327 and set(matched.values())=={1};checks+=1
for a,b in zip(old['records'],bank['records']):
 for key in ['id','lemma','word','tier','alternatives','verdict']:
  assert a[key]==b[key];checks+=1
assert sum(a['clue']!=b['clue'] for a,b in zip(old['records'],bank['records']))==21;checks+=1
for r in bank['records']:
 if r['lemma'] in ['krāns','mājvieta','miers','faktors']:assert r['editorialFlags'];checks+=1
assert hashlib.sha256((R/'data/round-sets.json').read_bytes()).hexdigest()=='8ed4a581e45a5a8e801b7df7da4de7254dc9e10d07e3d9875fa75cb71c78f082';checks+=1
assert (R/'data/tei-quarantine.json').read_text().strip()=='[]';checks+=1
report={'assertions':checks,'records_verified':327,'exact_unchanged':306,'changed':21,'quarantined':0,'grid_bytes_unchanged':True,'source_sha256':h.hexdigest()}
(R/'tests/tei-results.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
