/* Appearance integration against real round runtime, using isolated storage. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {boot,KEY}=require('./test_tei_saves.cjs');
const R=path.resolve(__dirname,'..'),PREF='rg-uzmini-vardu-appearance-v1',shell=fs.readFileSync(path.join(R,'src/shell.js'),'utf8');
let count=0;const check=(a,b)=>{assert.ok(a,b);count++};
function install(q){q.doc.documentElement={dataset:{}};vm.runInContext(shell,q.context);return q.doc.documentElement.dataset}
const q=boot();q.ids['mode-points'].onclick();q.ids.hint.onclick();q.type('A');
const original=q.store.get(KEY),reads=[],writes=[];
q.context.localStorage={getItem:k=>{reads.push(k);return q.store.get(k)||null},setItem:(k,v)=>{writes.push(k);q.store.set(k,v)}};
const root=install(q);
check(root.theme==='light'&&root.textSize==='normal','default appearance');
check(reads.every(k=>k===PREF)&&writes.length===0,'initial shell reads only scoped preference and never writes round');
for(const size of ['large','xlarge','normal']){
 q.ids['font-increase-btn'].emit('pointerdown');q.ids['font-increase-btn'].emit('click');
 check(root.textSize===size,'all three font cycle states');check(q.store.get(KEY)===original,'font change preserves full round exactly');
 check(q.ids['font-increase-btn'].getAttribute('aria-label').includes('no 3'),'localized font state label');
}
q.ids['sw-theme'].emit('pointerdown');q.ids['sw-theme'].emit('click');
check(root.theme==='dark'&&q.ids['sw-theme'].getAttribute('aria-checked')==='true','dark switch state');
check(q.ids['sw-theme'].getAttribute('aria-label')==='Ieslēgt gaišo režīmu','theme action label');
check(q.store.get(KEY)===original&&writes.every(k=>k===PREF),'theme never writes round');
q.ids['font-increase-btn'].emit('click');
const saved=q.store.get(PREF),again=boot(JSON.parse(original));again.store.set(PREF,saved);const restored=install(again);
check(restored.theme==='dark'&&restored.textSize==='large','appearance reload persistence');
check(again.store.get(KEY)===original,'reload with preferences preserves exact round');
for(const raw of ['{bad',JSON.stringify({theme:'red',textSize:'giant'}),'null']){
 const broken=boot(JSON.parse(original));broken.store.set(PREF,raw);const data=install(broken);check(data.theme==='light'&&data.textSize==='normal','invalid preference safe fallback');check(broken.store.get(KEY)===original,'invalid preference leaves game save intact');
}
const unavailable=boot(JSON.parse(original));unavailable.context.localStorage={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};const fallback=install(unavailable);unavailable.ids['sw-theme'].emit('click');
check(fallback.theme==='dark'&&unavailable.ids['appearance-status'].textContent.includes('nav saglabāti'),'storage failure leaves working controls and announces limitation');
check(unavailable.store.get(KEY)===original,'preference failure preserves game');
const css=fs.readFileSync(path.join(R,'src/shell.css'),'utf8');
function tokens(selector){const body=css.slice(css.indexOf(selector)).match(/\{([^}]+)\}/)[1];return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]))}
function luminance(hex){const a=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
const contrasts=[];
for(const theme of ['light','dark']){const t={...tokens(':root'),...(theme==='dark'?tokens('html[data-theme="dark"]'):{})};for(const [fg,bg] of [['ink','bg'],['ink-muted','panel'],['accent','panel'],['ink','selected'],['success-ink','success-soft'],['success','panel']]){const x=luminance(t[fg]),y=luminance(t[bg]),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);check(ratio>=4.5,theme+' '+fg+'/'+bg+' text contrast');contrasts.push({theme,foreground:fg,background:bg,ratio:Number(ratio.toFixed(2))})}}
const candidate=fs.readFileSync(path.join(R,'dist/rg-shell-candidate.html'),'utf8');check(candidate.includes(shell)&&!candidate.includes('@@icon:'),'actual candidate contains exact shell and resolved icons');
fs.writeFileSync(path.join(R,'tests/shell-results.json'),JSON.stringify({assertions:count,round_preserved:true,separate_preference_key:PREF,contrasts,actual_browser_verified:false},null,2)+'\n');console.log({assertions:count,round_preserved:true,contrasts:contrasts.length});
