from pathlib import Path
import urllib.request,json,re,concurrent.futures,datetime
from html.parser import HTMLParser
import argparse
C=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--cache',required=True,type=Path);p.add_argument('--fetch',action='store_true');args=p.parse_args();cache=args.cache;cache.mkdir(parents=True,exist_ok=True)
class Glosses(HTMLParser):
 def __init__(self):super().__init__();self.div=0;self.span=0;self.senses=[];self.capture=None;self.glosses={};self.sub=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='sub' and self.capture:self.sub+=1;self.capture[2].append('(')
  if tag=='div':
   self.div+=1
   if 'dict_Sense' in a.get('class','').split() and a.get('id'):self.senses.append((self.div,a['id']))
  if tag=='span':
   self.span+=1
   if 'dict_Gloss' in a.get('class','').split() and self.senses and self.capture is None:self.capture=[self.span,self.senses[-1][1],[]]
 def handle_endtag(self,tag):
  if tag=='sub' and self.capture:self.sub-=1;self.capture[2].append(')')
  if tag=='span':
   if self.capture and self.capture[0]==self.span:self.glosses.setdefault(self.capture[1],[]).append(''.join(self.capture[2]));self.capture=None
   self.span-=1
  if tag=='div':
   if self.senses and self.senses[-1][0]==self.div:self.senses.pop()
   self.div-=1
 def handle_data(self,s):
  if self.capture:self.capture[2].append(s)
def norm(s):return re.sub(r'\s*\([0-9]+\)','', ' '.join(s.split()).replace(' – ',' - ')).rstrip('.').casefold()
bank=json.loads((C/'data/accepted-bank.json').read_text())['records'];links=json.loads((C/'data/tei-entry-links.json').read_text())
def verify(r):
 link=links[r['id']];name=r['teiEntry']+'.html';p=cache/name
 if p.exists():payload=p.read_bytes()
 else:
  assert args.fetch,'Missing cached public entry – use --fetch for explicit online verification'
  with urllib.request.urlopen(urllib.request.Request(link['url'],headers={'User-Agent':'ResearchGames-source-link-check'}),timeout=20) as response:payload=response.read();assert response.status==200
  p.write_bytes(payload)
 parser=Glosses();parser.feed(payload.decode());fragment='s'+'.'.join(re.findall(r'__sense_([0-9]+)',r['teiSense']))
 found=parser.glosses.get(fragment,[]);verified=any(norm(t)==norm(r['clue']) for t in found)
 baseurl=link.get('entryUrl',link['url']).split('#')[0];link['entryUrl']=baseurl;link['url']=baseurl;link['senseAnchorVerified']=verified
 if verified:
  link['url']+='#'+fragment;link.pop('anchorLimitation',None);link.pop('liveGlosses',None)
 else:link['anchorLimitation']='No matching live direct gloss verified at candidate fragment';link['liveGlosses']=found
 return r['id'],link
out={};errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 pending={ex.submit(verify,r):r['id'] for r in bank}
 for f in concurrent.futures.as_completed(pending):
  try:k,v=f.result();out[k]=v
  except Exception as e:errors.append({'id':pending[f],'error':str(e)})
assert not errors,errors
out={r['id']:out[r['id']] for r in bank};(C/'data/tei-entry-links.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entries':len(out),'verified_sense_anchors':sum(v['senseAnchorVerified'] for v in out.values()),'entry_only':[v for v in out.values() if not v['senseAnchorVerified']],'method':'Actual mapped TEI entry ID and sense path; public HTML id plus matching direct gloss, ignoring display-only case, final period, dash typography and homonym-reference number formatting; no source text changed'}
(C/'data/tei-entry-link-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
