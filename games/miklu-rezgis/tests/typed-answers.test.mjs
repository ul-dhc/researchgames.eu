import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {riddlesFromCsv} from '../scripts/update-data.mjs';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const extract=name=>source.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
function setup(){
 const elements=Object.fromEntries(['typed-answer','typed-answer-form','typed-check-btn','typed-match-btn','next-btn'].map(id=>[id,{value:'',blur(){},focus(options){this.focusOptions=options;}}]));
 const state={gameMode:'typed',typedWrongAttempts:0,typedRevealedLetters:{},hintedLetters:{},gameOver:false,hintsLeft:3,riddleScore:100,wordState:{},placedWords:[{cells:[[0,0]]}],foundCells:new Set(),levels:{1:[{q:'Kas?',a:'Āķis'}]},bonusPool:[]};
 let completed=0,grids=0,status='';
 const ctx=vm.createContext({state,document:{getElementById:id=>elements[id],body:{classList:{toggle(){}}}},currentRiddle:()=>({q:'Kas?',a:'Āķis',acceptedAnswers:['Āķītis']}),getWords:s=>s.split(/\s+/),norm:s=>s.toUpperCase(),cellKey:(r,c)=>`${r},${c}`,PENALTY_WRONG:15,PENALTY_HINT:25,TYPED_HINT_COST:10,TYPED_COMMON_LETTER_COST:5,renderPips(){},renderWordTags(){},renderTopBar(){},renderGrid(){grids++;},scrollToRiddleOnMobile(){},setStatus:s=>status=s,completeRiddle(){completed++;state.gameOver=true;},event:{preventDefault(){}}});
 vm.runInContext(['normalizeTypedAnswer','acceptedTypedAnswers','syncTypedAnswer','resetTypedAnswer','remainingTypedLetters','completeTypedAnswer','checkTypedAnswer','matchingTypedLetterPositions','revealMatchingTypedLetters','giveHint'].map(extract).join('\n'),ctx);
 return {state,elements,run:s=>vm.runInContext(s,ctx),get completed(){return completed;},get grids(){return grids;},get status(){return status;}};
}
test('typed answer accepts case, surrounding whitespace, punctuation and explicit aliases, preserving Latvian diacritics',()=>{
 for(const answer of ['āķis',' ĀĶIS! ','āķītis']){const c=setup();c.elements['typed-answer'].value=answer;c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);assert.equal(c.state.wordState[0],'found');}
 const c=setup();c.elements['typed-answer'].value='akis';c.run('checkTypedAnswer(event)');assert.equal(c.completed,0);
});
test('incorrect typed answers can be edited repeatedly without ending the riddle; blank submissions cost nothing',()=>{
 const c=setup();c.run('checkTypedAnswer(event)');assert.equal(c.state.riddleScore,100);
 c.elements['typed-answer'].value='nepareizi';for(let i=0;i<5;i++)c.run('checkTypedAnswer(event)');
 assert.equal(c.state.typedWrongAttempts,5);assert.equal(c.state.gameOver,false);assert.equal(c.elements['typed-answer'].value,'nepareizi');assert.equal(c.state.riddleScore,100);
 c.elements['typed-answer'].value='Āķis';c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);
});
test('typed answer stays available when hints run out and offers no grid fallback',()=>{
 const c=setup();c.state.hintsLeft=0;c.run('syncTypedAnswer()');
 assert.equal(c.elements['typed-answer-form'].hidden,false);
 assert.equal(c.elements['typed-answer'].disabled,false);
 assert.doesNotMatch(source,/switchTypedToGrid|typed-grid-btn/);
});
test('new riddle clears typed input and restores the input form; solved form cannot be resubmitted',()=>{
 const c=setup();c.elements['typed-answer'].value='Āķis';c.run('checkTypedAnswer(event)');c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);
 c.state.gameOver=false;c.run('resetTypedAnswer()');assert.equal(c.elements['typed-answer'].value,'');assert.equal(c.elements['typed-answer-form'].hidden,false);
});
test('typed mode uses ten levels, three hints at every difficulty and its own analytics version',()=>{
 assert.match(source,/typed: 2900/);assert.match(source,/typed: 1/);assert.match(extract('resetRiddleState'),/gameMode === 'typed' \? MAX_HINTS/);
 assert.match(extract('queueCurrentEvaluation'),/state.typedWrongAttempts/);
 assert.match(extract('parseMode'),/value === 'typed'/);
});
test('CSV optional answer variants are carried into static JSON',()=>{
 const csv='game_id,mikla,atminejums,limenis,atminejuma_varianti\n'+Array.from({length:10},(_,i)=>`MR-${i},Kas?,Āķis,${i+1},Āķītis; āķītis divi`).join('\n');
 assert.deepEqual(riddlesFromCsv(csv).levels[1][0].acceptedAnswers,['Āķītis','āķītis divi']);
});


test('typed analytics plans ten riddles and the public dashboard exposes a separate version filter',async()=>{
 const ctx=vm.createContext({state:{gameMode:'typed'}});vm.runInContext(extract('validTypedCount')+'\n'+extract('plannedRiddleCount'),ctx);
 assert.equal(vm.runInContext('plannedRiddleCount()',ctx),10);
 const {createRequire}=await import('node:module');const model=createRequire(import.meta.url)('../stats/snapshot-model.js');
 const result=model.query(model.build([],[],[]),{});
 assert.ok(result.filters.versions.some(v=>v.value==='typed'&&v.label==='Bez režģa'));
});


test('common letters preserve earlier discoveries across edited guesses',()=>{
 const c=setup();c.elements['typed-answer'].value='āzis';c.run('revealMatchingTypedLetters()');
 assert.deepEqual(Array.from(c.state.typedRevealedLetters[0]),[0,2,3]);
 assert.equal(c.state.hintsLeft,3);assert.equal(c.state.riddleScore,85);assert.equal(c.completed,0);
 c.elements['typed-answer'].value='āķe';c.run('revealMatchingTypedLetters()');
 assert.deepEqual(Array.from(c.state.typedRevealedLetters[0]),[0,2,3,1]);
 assert.equal(c.completed,1);c.run('revealMatchingTypedLetters()');assert.equal(c.completed,1);
});
test('hints skip letters already discovered through matching guesses',()=>{
 const c=setup();c.state.typedRevealedLetters={0:[0,2,3]};c.run('giveHint()');
 assert.deepEqual(Array.from(c.state.typedRevealedLetters[0]),[0,2,3,1]);assert.equal(c.state.hintsLeft,2);assert.equal(c.state.riddleScore,90);
 c.run('giveHint()');assert.equal(c.state.hintsLeft,2);
});
test('matching is unavailable for empty input and completed riddles, and accepts a fully correct guess',()=>{
 const c=setup();c.run('syncTypedAnswer()');assert.equal(c.elements['typed-match-btn'].disabled,true);
 c.elements['typed-answer'].value='ĀĶIS';c.run('revealMatchingTypedLetters()');assert.equal(c.completed,1);
 c.state.typedRevealedLetters={};c.run('revealMatchingTypedLetters()');assert.equal(Object.keys(c.state.typedRevealedLetters).length,0);
});
test('starting a new riddle clears matching discoveries',()=>{
 assert.match(extract('resetRiddleState'),/state.typedRevealedLetters = \{\}/);
});


test('common letters ignore order and respect repeated-letter counts in KRĀSNS and SKURSTENIS',()=>{
 const c=setup();
 const positions=c.run("matchingTypedLetterPositions('SKURSTENIS','KRĀSNS')")[0];
 assert.deepEqual(Array.from(positions),[0,1,3,4,7]);
 assert.equal([...'SKURSTENIS'].map((letter,i)=>positions.includes(i)?letter:'_').join(''),'SK_RS__N__');
 assert.deepEqual(Array.from(c.run("matchingTypedLetterPositions('SKURSTENIS','S')")[0]),[0]);
 assert.deepEqual(Array.from(c.run("matchingTypedLetterPositions('SKURSTENIS','SSS')")[0]),[0,4,9]);
});
test('letter counts are shared across answer words and preserve Latvian diacritics',()=>{
 const c=setup();
 const positions=c.run("matchingTypedLetterPositions('SALS UN SNIEGS','SNU')");
 assert.deepEqual(Array.from(positions[0]),[0]);assert.deepEqual(Array.from(positions[1]),[0,1]);assert.deepEqual(Array.from(positions[2]),[]);
 assert.deepEqual(Array.from(c.run("matchingTypedLetterPositions('ĀĶIS','SĀIĶ')")[0]),[0,1,2,3]);
 assert.deepEqual(Array.from(c.run("matchingTypedLetterPositions('ĀĶIS','AKIS')")[0]),[2,3]);
});
test('repeating the same guess cannot reveal extra occurrences of a letter',()=>{
 const c=setup();c.elements['typed-answer'].value='s';c.run('revealMatchingTypedLetters()');
 assert.deepEqual(Array.from(c.state.typedRevealedLetters[0]),[3]);
 c.run('revealMatchingTypedLetters()');assert.deepEqual(Array.from(c.state.typedRevealedLetters[0]),[3]);
 assert.match(c.status,/jaunu kopīgo burtu nav/);
});


test('last missing letter is accepted by both check and common-letter actions',()=>{
 for (const action of ['checkTypedAnswer(event)','revealMatchingTypedLetters()']){
  const c=setup();c.state.typedRevealedLetters={0:[0,1,2]};c.elements['typed-answer'].value='s';
  c.run(action);assert.equal(c.completed,1);assert.equal(c.state.typedWrongAttempts,0);
 }
});
test('only missing letters may complete an answer in order; wrong missing letter remains editable',()=>{
 const c=setup();c.state.typedRevealedLetters={0:[0,2]};c.elements['typed-answer'].value='ķs';c.run('checkTypedAnswer(event)');assert.equal(c.completed,1);
 const wrong=setup();wrong.state.typedRevealedLetters={0:[0,1,2]};wrong.elements['typed-answer'].value='z';wrong.run('checkTypedAnswer(event)');assert.equal(wrong.completed,0);assert.equal(wrong.state.gameOver,false);assert.match(wrong.status,/Šis nav trūkstošais burts/);
});
test('a final hint automatically completes the riddle',()=>{
 const c=setup();c.state.typedRevealedLetters={0:[0,1,2]};c.run('syncTypedAnswer()');
 c.run('giveHint()');assert.equal(c.completed,1);assert.equal(c.state.hintsLeft,2);
});

test('common-letter help charges only new letters and never makes the score negative',()=>{
 const c=setup();c.elements['typed-answer'].value='s';c.run('revealMatchingTypedLetters()');assert.equal(c.state.riddleScore,95);
 c.run('revealMatchingTypedLetters()');assert.equal(c.state.riddleScore,95);
 c.elements['typed-answer'].value='ā';c.run('revealMatchingTypedLetters()');assert.equal(c.state.riddleScore,90);
 const low=setup();low.state.riddleScore=3;low.elements['typed-answer'].value='s';low.run('revealMatchingTypedLetters()');assert.equal(low.state.riddleScore,0);
});
test('typed hint costs ten, regular grid hint still costs twenty-five',()=>{
 const typed=setup();typed.run('giveHint()');assert.equal(typed.state.riddleScore,90);
 const regular=setup();regular.state.gameMode=10;regular.run('giveHint()');assert.equal(regular.state.riddleScore,75);
 const low=setup();low.state.riddleScore=3;low.run('giveHint()');assert.equal(low.state.riddleScore,0);
});
test('typed completion awards the remaining score without a speed bonus; grid scoring retains its bonus',()=>{
 for (const [mode,expected,bonus] of [['typed',70,0],[10,85,15]]) {
  const state={gameMode:mode,participationMode:'player',riddleScore:70,riddleSeconds:1,totalScore:0,levelScore:0,totalTimeBonus:0};
  const ctx=vm.createContext({state,calculateTimeBonus:()=>15,basePoints:()=>100,renderTopBar(){},setStatus(){},setNextEnabled(){},saveProgress(){},recordCompletedRiddleForSession(){},document:{getElementById:()=>({})}});
  vm.runInContext(extract('completeRiddle'),ctx);vm.runInContext('completeRiddle()',ctx);
  assert.equal(state.currentAwardedPoints,expected);assert.equal(state.currentTimeBonus,bonus);assert.equal(state.totalScore,expected);
 }
});


test('correct typed answer moves focus to the next action without scrolling',()=>{
 const c=setup();c.elements['typed-answer'].value='Āķis';c.run('checkTypedAnswer(event)');
 assert.equal(c.completed,1);assert.equal(c.elements['next-btn'].focusOptions.preventScroll,true);
});
test('Enter checks once, ignores held-key repeats and preserves native next-button activation',()=>{
 let checked=0,prevented=0;
 const ctx=vm.createContext({state:{gameMode:'typed'},checkTypedAnswer(){checked++;}});
 vm.runInContext(extract('handleTypedEnter'),ctx);
 const send=(overrides={})=>{ctx.keyEvent={key:'Enter',repeat:false,isComposing:false,currentTarget:{id:'typed-answer'},preventDefault(){prevented++;},...overrides};vm.runInContext('handleTypedEnter(keyEvent)',ctx);};
 send();assert.equal(checked,1);assert.equal(prevented,1);
 send({repeat:true});assert.equal(checked,1);assert.equal(prevented,2);
 send({isComposing:true});assert.equal(checked,1);assert.equal(prevented,2);
 send({currentTarget:{id:'next-btn'}});assert.equal(checked,1);assert.equal(prevented,2);
 send({currentTarget:{id:'next-btn'},repeat:true});assert.equal(prevented,3);
});


test('typed level completion focuses the next-level button and activates the following level',()=>{
 let shown=false,hidden=false,started=0;
 const elements={};
 const ctx=vm.createContext({state:{gameMode:'typed',currentLevel:1,totalScore:100},getLevelRating(){return 1;},getLevelMsg(){return {badge:'IZCILI',msg:''};},document:{getElementById(id){return elements[id] ||= {style:{},classList:{add(){shown=true;}},focus(options){this.focusOptions=options;}};}},hideLevelOverlay(){hidden=true;},startLevel(){started++;}});
 vm.runInContext(extract('showLevelComplete'),ctx);vm.runInContext('showLevelComplete()',ctx);
 assert.equal(shown,true);assert.equal(elements['lo-btn'].focusOptions.preventScroll,true);
 elements['lo-btn'].onclick();assert.equal(hidden,true);assert.equal(ctx.state.currentLevel,2);assert.equal(started,1);
});
