import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function game(mode='typed'){
 const storage=new Map(),elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',disabled:false,classList:{add(){},remove(){},toggle(){}},reset(){},focus(){},blur(){}});return elements.get(id);};
 const ctx=vm.createContext({console,document:{addEventListener(){},getElementById:el,body:{dataset:{},classList:{add(){},remove(){},toggle(){}}}},navigator:{onLine:false},crypto:{randomUUID:()=> 'saved-session'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout(){},clearInterval(){},setInterval(){},requestAnimationFrame:fn=>fn()});
 vm.runInContext(source,ctx);
 vm.runInContext(`
 renderGrid=renderWordTags=renderPips=renderTopBar=renderMiklaNum=renderRiddleMetadata=scrollToRiddleOnMobile=updatePlayerQuestionForm=showGameScreen=unlockGame=startTimer=queueSessionUpdate=()=>{};
 setStatus=()=>{}; setNextEnabled=enabled=>{document.getElementById('next-btn').disabled=!enabled;};
 syncTypedAnswer=()=>{};loadRiddlesFromSheets=fn=>fn();
 resolveGridSize=()=>7;buildGrid=answer=>({grid:[],fillerCells:new Set(),placedWords:getWords(answer).map((word,i)=>({word,cells:[[i,0]]}))});
 shuffle=a=>a;
 state.levels=Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,Array.from({length:10},(_,j)=>({id:(i+1)+'-'+j,q:'Kas?',a:'Āķis'}))]));
 state.bonusPool=[{id:'b1',q:'Kas?',a:'Āķis'},{id:'b2',q:'Kas?',a:'Muša'}];
 state.gameMode=${JSON.stringify(mode)};state.typedRiddleCount=10;state.riddlesPerLevel=1;
 resetForNewGame();startLevel();
 `,ctx);
 return {storage,elements,run:s=>vm.runInContext(s,ctx),get state(){return vm.runInContext('state',ctx);}};
}
test('a solved riddle cannot award points twice, including after repeated save/resume',()=>{
 const g=game();g.run('completeTypedAnswer()');assert.equal(g.state.totalScore,100);
 for(let i=0;i<3;i++){
  g.run('loadSavedProgress();completeRiddle();checkTypedAnswer({preventDefault(){}})');
  assert.equal(g.state.totalScore,100);assert.equal(g.state.gameOver,true);assert.equal(g.state.sessionId,'saved-session');
  assert.equal(g.elements.get('next-btn').disabled,false);
 }
});
test('all typed levels and both bonuses remain exactly 2900 despite reloading each solved riddle',()=>{
 const g=game();
 for(let level=1;level<=10;level++){
  g.run(`state.currentLevel=${level};startLevel();completeTypedAnswer();loadSavedProgress();completeRiddle()`);
 }
 assert.equal(g.state.totalScore,1900);
 g.run('startBonusRound();completeTypedAnswer();loadSavedProgress();completeRiddle()');
 assert.equal(g.state.totalScore,2400);assert.equal(g.state.riddleIdx,0);
 g.run('state.riddleIdx++;loadRiddle();completeTypedAnswer();loadSavedProgress();completeRiddle()');
 assert.equal(g.state.totalScore,2900);assert.equal(g.state.riddleIdx,1);assert.equal(g.state.bonusRiddles[1].id,'b2');
 g.run('startBonusRound()');assert.equal(g.state.totalScore,2900);assert.equal(g.state.riddleIdx,1);
});
test('partial deductions, revealed letters, elapsed time and selected riddle order survive resume',()=>{
 const g=game();g.run("state.shuffledLevel=[state.levels[1][3]];loadRiddle();state.riddleScore=85;state.typedRevealedLetters={0:[0,2,3]};state.hintsLeft=2;state.timerSeconds=97;saveProgress();loadSavedProgress()");
 assert.equal(g.state.shuffledLevel[0].id,'1-3');assert.equal(g.state.riddleScore,85);assert.equal(g.state.hintsLeft,2);assert.equal(g.state.timerSeconds,97);
 assert.deepEqual(Array.from(g.state.typedRevealedLetters[0]),[0,2,3]);assert.equal(g.state.gameOver,false);
 g.run('completeTypedAnswer()');assert.equal(g.state.totalScore,85);
});
test('legacy saves resume their already-scored riddle locked, rather than earning it again',()=>{
 const g=game();g.run('completeTypedAnswer()');
 const data=JSON.parse(g.storage.get('lmg_progress'));delete data.progressVersion;delete data.riddleProgress;delete data.sessionId;
 g.storage.set('lmg_progress',JSON.stringify(data));g.run('loadSavedProgress();completeRiddle()');
 assert.equal(g.state.totalScore,100);assert.equal(g.state.gameOver,true);assert.equal(g.state.evaluationSaved,true);assert.equal(g.state.sessionId,'saved-session');
});
test('grid scoring keeps its speed bonus and is also idempotent after resume',()=>{
 const g=game(10);g.run('completeTypedAnswer()');assert.equal(g.state.totalScore,115);
 g.run('loadSavedProgress();completeRiddle()');assert.equal(g.state.totalScore,115);assert.equal(g.state.totalTimeBonus,15);
});
test('finished sessions never recreate a save after final results clear it',()=>{
 const g=game();g.run("clearProgress();state.sessionFinishedAt=new Date().toISOString();saveProgress()");
 assert.equal(g.storage.has('lmg_progress'),false);
});
