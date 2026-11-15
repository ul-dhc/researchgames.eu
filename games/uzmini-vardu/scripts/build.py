#!/usr/bin/env python3
"""Compile the local tier engine and atomically assemble one offline HTML."""
import argparse,base64,hashlib,json,os,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def build(require_baseline=False,output=None):
    baseline=json.loads((ROOT/'baseline.json').read_text())
    assert hashlib.sha256((ROOT/baseline['snapshot']).read_bytes()).hexdigest()==baseline['sha256'], 'Original snapshot changed'
    content={'key':(ROOT/'data/content-key.txt').read_text().strip(),'bank':json.loads((ROOT/'data/accepted-bank.json').read_text()),'rounds':json.loads((ROOT/'data/round-sets.json').read_text()),'legacyBank':json.loads((ROOT/'data/wordnet-bank-v1.json').read_text())}
    for record in content['bank']['records']:
        assert record['verdict']=='accept' and hashlib.sha256(record['clue'].encode('utf-8')).hexdigest()==record['definitionSHA256'], 'Bank definition changed'
    expected=hashlib.sha256(json.dumps({'bank':content['bank'],'sets':content['rounds']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    assert expected==(ROOT/'data/tei-content-key.txt').read_text().strip(), 'Bank/grid compatibility identity changed – regenerate and validate deliberately'
    old_expected=hashlib.sha256(json.dumps({'bank':content['legacyBank'],'sets':content['rounds']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    assert old_expected==content['key'], 'Frozen save/grid identity changed'
    wordnet=(ROOT/'data/wordnet-tiers-v1.html').read_bytes()
    assert hashlib.sha256(wordnet).hexdigest()=='c2d81432ca0bf2274a2b2237fe7345eb655477be61051b9e417f31006a6daf51','Historical tier game changed'
    legacy=(ROOT/'data/legacy-rg-v10.html').read_bytes()
    assert hashlib.sha256(legacy).hexdigest()=='ee09dc39ef0c454f4995a9e5ea6294fe21c20e568c35f3445fabbd06ac0332d2','Legacy game changed'
    manifest=json.loads((ROOT/'assets/lucide/manifest.json').read_text());icons={}
    for filename,digest in manifest['sha256'].items():
        svg=(ROOT/'assets/lucide'/filename).read_text()
        assert hashlib.sha256(svg.encode()).hexdigest()==digest, 'Official Lucide asset changed'
        icons[filename[:-4]]=svg.replace('<svg','<svg aria-hidden="true" focusable="false"',1)
    links=json.loads((ROOT/'data/tei-entry-links.json').read_text())
    assert set(links)=={r['id'] for r in content['bank']['records']}
    generated='const ICONS='+json.dumps(icons,separators=(',',':'))+';\nconst ENTRY_LINKS='+json.dumps(links,ensure_ascii=False,separators=(',',':'))+';\nconst WORDNET_DOCUMENT='+json.dumps(base64.b64encode(wordnet).decode())+';\nconst CONTENT='+json.dumps(content,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\nconst LEGACY_DOCUMENT='+json.dumps(base64.b64encode(legacy).decode())+';\n'+(ROOT/'src/display.js').read_text()+'\n'+(ROOT/'src/tier-core.js').read_text()+'\n'+(ROOT/'src/runtime.js').read_text()+'\n'+(ROOT/'src/shell.js').read_text()+'\n'+(ROOT/'src/about.js').read_text()
    (ROOT/'src/game.js').write_text(generated)
    payload=b''.join((ROOT/p['path']).read_bytes() for p in baseline['parts'])
    text=payload.decode().replace('@@about@@',(ROOT/'src/about.html').read_text()).replace('@@footer@@',(ROOT/'src/footer.html').read_text())
    for filename,digest in json.loads((ROOT/'assets/fonts/manifest.json').read_text()).items():
        assert hashlib.sha256((ROOT/'assets/fonts'/filename).read_bytes()).hexdigest()==digest, 'Reference font asset changed'
    for record in json.loads((ROOT/'assets/providers/manifest.json').read_text()):
        assert hashlib.sha256((ROOT/'assets/providers'/record['filename']).read_bytes()).hexdigest()==record['sha256'], 'Official provider SVG changed'
    for record in json.loads((ROOT/'assets/brand/lockups.json').read_text()):
        assert hashlib.sha256((ROOT/'assets/brand'/record['filename']).read_bytes()).hexdigest()==record['sha256'], 'Approved full RG lockup changed'
    fonts=[]
    for filename,family,weight in [('inter-400.ttf','Inter',400),('inter-600.ttf','Inter',600),('manrope-700.ttf','Manrope',700)]:
        raw=(ROOT/'assets/fonts'/filename).read_bytes()
        fonts.append("@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;src:url(data:font/ttf;base64,%s) format('truetype')}"%(family,weight,base64.b64encode(raw).decode()))
    text=text.replace('<style>','<style>'+''.join(fonts),1)
    text=text.replace('</style>',(ROOT/'src/shell.css').read_text()+'\n'+(ROOT/'src/about.css').read_text()+'</style>',1)
    font_license='\n'.join((ROOT/'assets/fonts'/f).read_text() for f in ['inter-OFL.txt','manrope-OFL.txt'])
    text=text.replace('<script>','<!-- Font licences\n'+font_license+'\n--><script>',1)
    text=re.sub(r'@@asset:([^@]+)@@',lambda m:'data:image/svg+xml;base64,'+base64.b64encode((ROOT/m[1]).read_bytes()).decode(),text)
    text=re.sub(r'@@icon:([a-z0-9-]+)@@',lambda m:icons[m[1]],text)
    assert '@@' not in text
    license=(ROOT/'assets/LUCIDE-LICENSE.txt').read_text()
    text=text.replace('<script>','<!-- Lucide license\n'+license+'\n--><script>',1)
    assert license in text and font_license in text, 'Embedded licences missing'
    payload=text.encode()
    if require_baseline and hashlib.sha256(payload).hexdigest()!=baseline['sha256']:raise SystemExit('Tier design intentionally differs from the v10 snapshot')
    target=ROOT/(output or 'index.html');target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_suffix('.tmp');temp.write_bytes(payload);os.replace(str(temp),str(target))
    print('Built {} – {} bytes – SHA-256 {}'.format(target.relative_to(ROOT),len(payload),hashlib.sha256(payload).hexdigest()))
    return target
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output');p.add_argument('--check-baseline',action='store_true');a=p.parse_args();build(a.check_baseline,a.output)
