const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{boot,KEY}=require('./test_tei_saves.cjs');
const q=boot();q.ids['mode-points'].onclick();q.type('A');const before=q.store.get(KEY),count=(q.doc.handlers.click||[]).length;
q.doc.documentElement={getAttribute:n=>n==='data-info-state'?'paused':null};
const screen=q.doc.getElementById('about-screen');screen.hidden=true;
vm.runInContext(fs.readFileSync('src/about.js','utf8'),q.context);
assert.equal((q.doc.handlers.click||[]).length,count);q.ids['header-about'].onclick({preventDefault(){}});
assert.equal(screen.hidden,true);assert.equal(q.store.get(KEY),before);
const reload=boot(q.state());assert.equal(reload.store.get(KEY),before);assert.equal(reload.ids['word-entry'].value,'A');
console.log({info_paused:true,about_handlers_absent:true,partial_save_exact:true,reload_preserved:true});
