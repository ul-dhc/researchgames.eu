import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {riddlesFromCsv} from '../scripts/update-data.mjs';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const extract=name=>source.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
function setup(){
 const elements=Object.fromEntries(['typed-answer','typed-answer-form','typed-check-btn','typed-grid-btn','typed-answer-note'].map(id=>[id,{value:'',blur(){}}]));
 const state={gameMode:'typed',typedGrid:false,typedWrongAttempts:0,gameOver:false,hintsLeft:3,riddleScore:100,wordState:{},placedWords:[{cells:[[0,0]]}],foundCells:new Set(),levels:{1:[{q:'Kas?',a:'Āķis'}]},bonusPool:[]};
 let completed=0,grids=0,status='';
 const ctx=vm.createContext({state,document:{getElementById:id=>elements[id],body:{classList:{toggle(){}}}},currentRiddle:()=>({q:'Kas?',a:'Āķis',acceptedAnswers:['Āķītis']}),getWords:s=>s.split(/\s+/),norm:s=>s.toUpperCase(),cellKey:(r,c)=>`${r},${c}`,PENALTY_WRONG:15,renderWordTags(){},renderTopBar(){},renderGrid(){grids++;},scrollToRiddleOnMobile(){},setStatus:s=>status=s,completeRiddle(){completed++;state.gameOver=true;},event:{preventDefault(){}}});
 vm.runInContext(['normalizeTypedAnswer','acceptedTypedAnswers','syncTypedAnswer','resetTypedAnswer','checkTypedAnswer','switchTypedToGrid'].map(extract).join('\n'),ctx);
 return {state,elements,run:s=>vm.runInContext(s,ctx),get completed(){return completed;},get grids(){return grids;},get status(){return status;}};
}
test('typed answer accepts case, surrounding whitespace, punctuation and explicit aliases, preserving Latvian diacritics',()=>{
 for(const answer of ['āķis',' ĀĶIS! ','āķītis']){const c=setup();c.elements['typed-answer'].value=answer;c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);assert.equal(c.state.wordState[0],'found');}
 const c=setup();c.elements['typed-answer'].value='akis';c.run('checkTypedAnswer(event)');assert.equal(c.completed,0);
});
test('incorrect typed answers can be edited repeatedly without ending the riddle; blank submissions cost nothing',()=>{
 const c=setup();c.run('checkTypedAnswer(event)');assert.equal(c.state.riddleScore,100);
 c.elements['typed-answer'].value='nepareizi';for(let i=0;i<5;i++)c.run('checkTypedAnswer(event)');
 assert.equal(c.state.typedWrongAttempts,5);assert.equal(c.state.gameOver,false);assert.equal(c.elements['typed-answer'].value,'nepareizi');assert.equal(c.state.riddleScore,25);
 c.elements['typed-answer'].value='Āķis';c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);
});
test('grid fallback requires all hints and preserves revealed letters, score and the current riddle',()=>{
 const c=setup();c.state.hintedLetters={0:3};c.run('syncTypedAnswer()');assert.equal(c.elements['typed-grid-btn'].hidden,true);c.run('switchTypedToGrid()');assert.equal(c.grids,0);
 c.state.hintsLeft=0;c.run('syncTypedAnswer()');assert.equal(c.elements['typed-grid-btn'].hidden,false);c.run('switchTypedToGrid()');assert.equal(c.state.typedGrid,true);assert.equal(c.grids,1);assert.equal(c.state.hintedLetters[0],3);assert.equal(c.state.riddleScore,100);assert.equal(c.elements['typed-answer-form'].hidden,true);
 c.run('checkTypedAnswer(event)');assert.equal(c.completed,0);
});
test('new riddle clears typed input and restores the input form; solved form cannot be resubmitted',()=>{
 const c=setup();c.elements['typed-answer'].value='Āķis';c.run('checkTypedAnswer(event)');c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);
 c.state.gameOver=false;c.run('resetTypedAnswer()');assert.equal(c.elements['typed-answer'].value,'');assert.equal(c.elements['typed-answer-form'].hidden,false);
});
test('typed mode uses ten levels, three hints at every difficulty and its own analytics version',()=>{
 assert.match(source,/typed: 3335/);assert.match(source,/typed: 1/);assert.match(extract('resetRiddleState'),/gameMode === 'typed' \? MAX_HINTS/);
 assert.match(extract('queueCurrentEvaluation'),/state.typedWrongAttempts/);
 assert.match(extract('parseMode'),/value === 'typed'/);
});
test('CSV optional answer variants are carried into static JSON',()=>{
 const csv='game_id,mikla,atminejums,limenis,atminejuma_varianti\n'+Array.from({length:10},(_,i)=>`MR-${i},Kas?,Āķis,${i+1},Āķītis; āķītis divi`).join('\n');
 assert.deepEqual(riddlesFromCsv(csv).levels[1][0].acceptedAnswers,['Āķītis','āķītis divi']);
});


test('typed analytics plans ten riddles and the public dashboard exposes a separate version filter',async()=>{
 const ctx=vm.createContext({state:{gameMode:'typed'}});vm.runInContext(extract('plannedRiddleCount'),ctx);
 assert.equal(vm.runInContext('plannedRiddleCount()',ctx),10);
 const {createRequire}=await import('node:module');const model=createRequire(import.meta.url)('../stats/snapshot-model.js');
 const result=model.query(model.build([],[],[]),{});
 assert.ok(result.filters.versions.some(v=>v.value==='typed'&&v.label==='Bez režģa'));
});
