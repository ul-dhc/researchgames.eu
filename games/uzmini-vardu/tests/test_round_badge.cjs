const assert=require('node:assert/strict'),{boot,CONTENT,core,KEY}=require('./test_tei_saves.cjs');
const names={B:'Iesācējs',I:'Lietpratējs',E:'Eksperts'};let checks=0;
for(const tier of core.tiers)for(let round=0;round<3;round++){
 const grids=core.hydrate(CONTENT,tier,0),states=grids.map(()=>({values:{},hints:{},active:0}));
 for(let k=0;k<round;k++)for(const w of grids[k].words)core.positions(w).forEach((p,i)=>states[k].values[p]=w.word[i]);
 const s={schema:1,contentKey:CONTENT.key,menuTier:tier,active:{tier,mode:'points'},sessions:{[tier+':points']:{setIndex:0,round,rounds:states,sourceVersion:'tei-2026_4'}}};
 const q=boot(s),before=q.store.get(KEY);assert.equal(q.ids['new-game'],undefined);assert.equal(q.ids['header-difficulty'],undefined);assert.equal(q.ids['level-title'].textContent,`${names[tier]}: ${round+1}. kārta no 3`);assert.equal(q.doc.getElementById('choose-tier').onclick,undefined);assert.equal(q.store.get(KEY),before);checks+=3;
 q.ids['header-home'].onclick({preventDefault(){}});assert.equal(q.state().sessions[tier+':points'].round,round);q.ids['mode-points'].onclick();assert.equal(q.store.get(KEY),before);checks+=2;
}
console.log({round_badge_checks:checks,tiers:3,rounds:3,save_and_remaining_navigation_preserved:true});
