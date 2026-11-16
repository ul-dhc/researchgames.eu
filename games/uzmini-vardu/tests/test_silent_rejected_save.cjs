const assert=require('node:assert/strict'),{boot,KEY}=require('./test_tei_saves.cjs');
const invalid={schema:1,contentKey:'incompatible',menuTier:'B',active:null,sessions:{}};
const q=boot(invalid),raw=q.store.get(KEY);assert.equal(q.ids['resume-summary'].textContent,'');assert.equal(q.ids['resume-summary'].hidden,true);assert.equal(q.store.get(KEY),raw);
q.ids['mode-points'].onclick();const copies=[...q.store].filter(([k])=>k.startsWith(KEY+'.retained.'));assert.equal(copies.length,1);assert.equal(copies[0][1],raw);assert.notEqual(q.store.get(KEY),raw);
const blocked=boot(invalid),before=blocked.store.get(KEY);blocked.context.localStorage.setItem=()=>{throw Error('quota')};blocked.ids['mode-points'].onclick();assert.equal(blocked.store.get(KEY),before);assert.equal(blocked.store.size,1);assert.match(blocked.ids['resume-summary'].textContent,/nav pārrakstīts/);
console.log({warning_absent:true,rejected_save_unchanged_on_boot:true,backup_verified_before_overwrite:true,backup_failure_preserves_original:true});
