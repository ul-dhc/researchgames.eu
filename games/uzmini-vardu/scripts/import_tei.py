#!/usr/bin/env python3
"""Reproduce the direct TEI bank; stop on any ambiguous mapping or answer leakage."""
from pathlib import Path
import argparse,collections,csv,hashlib,json,re,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parent.parent
NS={'t':'http://www.tei-c.org/ns/1.0'}; X='{http://www.w3.org/XML/1998/namespace}id'
SHA='eb4cb16e1412c1462b68f3c3be516c46d9bc07905758e85fe967d475e28afd86'
VERSION='tei-2026_4'
def digest(b):return hashlib.sha256(b).hexdigest()
def render(xml,check=False):
 def emit(name,text):
  path=R/'data'/name
  if check:assert path.read_text()==text,'Reproduction mismatch: '+name
  else:path.write_text(text)
 with xml.open('rb') as f:
  h=hashlib.sha256()
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 assert h.hexdigest()==SHA,'Wrong TEI XML'
 old=json.loads((R/'data/wordnet-bank-v1.json').read_text()); wanted=collections.defaultdict(list)
 for r in old['records']:wanted[r['lemma']].append(r)
 matches=collections.defaultdict(list);extent={}
 for event,e in ET.iterparse(xml,events=('end',)):
  if e.tag=='{'+NS['t']+'}measure' and e.get('unit') in ['entry','lexeme','sense']:extent[e.get('unit')]=int(e.get('quantity'))
  if e.tag!='{'+NS['t']+'}entry':continue
  lemmas={''.join(o.itertext()) for o in e.findall('t:form/t:orth',NS)}
  for lemma in lemmas & wanted.keys():
   for record in wanted[lemma]:
    suffix=record['synset'].split('-')[-1]; expected='tezaurs_2026_4__synset_'+suffix
    for sense in e.findall('.//t:sense',NS):
     refs=sense.findall('t:ref',NS)
     if not any(ref.get('type')=='synset' and any(expected==v.lstrip('#') for v in [ref.get(X,''),ref.get('target','')]) for ref in refs):continue
     defs=[''.join(d.itertext()) for d in sense.findall('t:def',NS)]
     matches[record['id']].append({'entry':e.get(X),'sense':sense.get(X),'definitions':defs})
  e.clear()
 assert extent=={'entry':415514,'lexeme':460398,'sense':540011},extent
 records=[];crosswalk=[];changes=[];blocked=[]
 for oldr in old['records']:
  candidates=matches[oldr['id']]
  if len(candidates)!=1 or len(candidates[0]['definitions'])!=1:
   blocked.append({'id':oldr['id'],'reason':'Mapping/direct definition not unique','candidates':candidates});continue
  m=candidates[0];clue=m['definitions'][0]
  if oldr['lemma'].casefold() in re.findall(r'[^\W\d_]+',clue.casefold(),re.UNICODE):
   blocked.append({'id':oldr['id'],'reason':'Exact answer token in source clue','mapping':m});continue
  flags=[]
  if oldr['lemma'] in ['krāns','mājvieta','miers']:flags.append('provisional short synonym clue – human editorial review pending')
  if oldr['lemma']=='faktors':flags.append('provisional historical/specialist sense – human editorial review pending')
  r=dict(oldr,clue=clue,definitionSHA256=digest(clue.encode()),sourceVersion=VERSION,teiEntry=m['entry'],teiSense=m['sense'],teiDefinitionIndex=0,editorialFlags=flags)
  r['wordnetCrosswalk']={k:oldr[k] for k in ['synset','definitionIndex','definitionSHA256','lexicalEntry','lexicalEntries','members']}
  records.append(r)
  c={'id':r['id'],'lemma':r['lemma'],'tei_entry':m['entry'],'tei_sense':m['sense'],'wordnet_synset':oldr['synset'],'old_sha256':oldr['definitionSHA256'],'tei_sha256':r['definitionSHA256'],'changed':clue!=oldr['clue'],'editorial_flags':'; '.join(flags)}
  crosswalk.append(c)
  if c['changed']:changes.append(dict(c,wordnet_definition=oldr['clue'],tei_definition=clue))
 emit('tei-quarantine.json',json.dumps(blocked,ensure_ascii=False,indent=2)+'\n')
 assert not blocked,'Source concerns quarantined – bank not installed: '+str(blocked)
 assert len(records)==327 and len(changes)==21,(len(records),len(changes))
 source={'file':xml.name,'sha256':SHA,'version':'2026_4','edition':'Tēzaurs.lv 2026 (Autumn Edition)','title':'Dictionary and Thesaurus of Latvian','format':'TEI/XML','issued':'2026-09-23','publisher':'AiLab IMCS UL','license':'CC BY-SA 4.0','url':'https://repository.clarin.lv/repository/xmlui/handle/20.500.12574/162','extent':extent}
 bank={'source':source,'reviewStatus':old['reviewStatus'],'records':records}
 outputs={'accepted-bank.json':bank,'tei-crosswalk.json':crosswalk,'tei-import-report.json':{'version':VERSION,'mapped':327,'unchanged':306,'changed':21,'missing':0,'ambiguous':0,'quarantined':0,'source':source,'answer_grid_tier_ids_unchanged':True}}
 for name,obj in outputs.items():emit(name,json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
 import io
 f=io.StringIO(newline='');writer=csv.DictWriter(f,fieldnames=list(changes[0]));writer.writeheader();writer.writerows(changes)
 if check:assert (R/'data/tei-definition-changes.csv').read_bytes()==f.getvalue().encode(),'CSV reproduction mismatch'
 else:(R/'data/tei-definition-changes.csv').write_bytes(f.getvalue().encode())
 sets=json.loads((R/'data/round-sets.json').read_text())
 emit('tei-content-key.txt',digest(json.dumps({'bank':bank,'sets':sets},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())+'\n')
 print(json.dumps(outputs['tei-import-report.json'],ensure_ascii=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--tei',required=True,type=Path);p.add_argument('--check',action='store_true');a=p.parse_args();render(a.tei,a.check)
