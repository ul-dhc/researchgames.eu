import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const main=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const child=readFileSync(new URL('../berniem/app.js',import.meta.url),'utf8');
const extract=(source,name)=>source.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];

test('main game disables all riddle controls on solving and restores shuffling for a new riddle',()=>{
 const buttons=Object.fromEntries(['give-up-btn','hint-btn','shuffle-btn','riddle-text'].map(id=>[id,{disabled:false}]));
 const state={gameMode:10,riddleScore:100,riddleSeconds:1,totalTimeBonus:0,totalScore:0,levelScore:0,foundWords:new Set()};
 const ctx=vm.createContext({state,document:{getElementById:id=>buttons[id]},calculateTimeBonus:()=>15,basePoints:()=>100,renderTopBar(){},setStatus(){},setNextEnabled(){},saveProgress(){},recordCompletedRiddleForSession(){},resetRiddleState(){state.gameOver=false;},currentRiddle:()=>({q:'Mīkla',a:'Muša'}),renderRiddleMetadata(){},resolveGridSize:()=>7,buildGrid:()=>({grid:[],placedWords:[],fillerCells:new Set()}),renderGrid(){},renderWordTags(){},renderPips(){},renderMiklaNum(){}});
 vm.runInContext(extract(main,'completeRiddle')+'\n'+extract(main,'loadRiddle'),ctx);
 vm.runInContext('completeRiddle()',ctx);
 for(const id of ['give-up-btn','hint-btn','shuffle-btn'])assert.equal(buttons[id].disabled,true,id);
 vm.runInContext('loadRiddle()',ctx);assert.equal(buttons['shuffle-btn'].disabled,false);assert.equal(state.gameOver,false);
 const giveUp=extract(main,'giveUp');assert.match(giveUp,/getElementById\('shuffle-btn'\).disabled = true/);
});

function childContext(mobile=true){
 let serial=0,nexts=0,finishes=0,renders=0;const timers=new Map();
 const state={index:0,solved:true,riddles:[{},{}]};
 const ctx=vm.createContext({state,GAME_LENGTH:5,window:{matchMedia:()=>({matches:mobile}),scrollTo(){}},setTimeout:(fn,delay)=>{timers.set(++serial,{fn,delay});return serial;},clearTimeout:id=>timers.delete(id),renderRiddle(){renders++;state.solved=false;},finishGame(){finishes++;}});
 vm.runInContext('let nextRiddleTimer=null;\n'+['clearAutoAdvance','scheduleAutoAdvance','nextRiddle'].map(n=>extract(child,n)).join('\n'),ctx);
 return {state,timers,run:s=>vm.runInContext(s,ctx),get renders(){return renders;},get finishes(){return finishes;}};
}
test('child mobile advances after the celebration and manual next cannot advance twice',()=>{
 const c=childContext();c.run('scheduleAutoAdvance()');const timer=[...c.timers.values()][0];assert.equal(timer.delay,2400);
 c.run('nextRiddle()');assert.equal(c.state.index,1);assert.equal(c.timers.size,0);
 timer.fn();assert.equal(c.state.index,1);assert.equal(c.renders,1);
});
test('child mobile auto advance reaches the final result; desktop stays manual',()=>{
 const c=childContext();c.state.index=4;c.run('scheduleAutoAdvance()');[...c.timers.values()][0].fn();assert.equal(c.finishes,1);
 const desktop=childContext(false);desktop.run('scheduleAutoAdvance()');assert.equal(desktop.timers.size,0);
});
test('stale child timer does not affect a restarted game and surrender does not auto advance',()=>{
 const c=childContext();c.run('scheduleAutoAdvance()');const timer=[...c.timers.values()][0];c.state.riddles=[{}];timer.fn();assert.equal(c.state.index,0);
 assert.match(extract(child,'solveRiddle'),/scheduleAutoAdvance\(\)/);
 assert.doesNotMatch(extract(child,'surrenderRiddle'),/scheduleAutoAdvance/);
});
test('finger-drag selection remains unchanged and no tap-endpoint interaction is introduced',()=>{
 assert.match(main,/gridEl.style.touchAction = 'none'/);
 assert.match(child,/setPointerCapture\(event.pointerId\)/);
 const css=readFileSync(new URL('../berniem/style.css',import.meta.url),'utf8');
 assert.match(css,/\.change-variant, footer \{ display: none; \}/);
 assert.match(css,/\.next-button \{\s*position: fixed/);
});

test('adult next action becomes visible only when ready and preserves research, daily and party routes',()=>{
 const classes=new Set(),button={},state={gameMode:10,participationMode:'player'};
 const ctx=vm.createContext({state,document:{getElementById:()=>button,body:{classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}}}});
 vm.runInContext(extract(main,'setNextEnabled'),ctx);
 for(const [mode,participation,label] of [[10,'player','Nākamā mīkla'],[10,'research','Novērtēt mīklu'],['daily','player','Pabeigt'],['party','party','Turpināt']]){
  state.gameMode=mode;state.participationMode=participation;
  vm.runInContext('setNextEnabled(true)',ctx);
  assert.equal(button.disabled,false);assert.equal(classes.has('next-ready'),true);assert.ok(button.innerHTML.startsWith(label));
  vm.runInContext('setNextEnabled(false)',ctx);assert.equal(button.disabled,true);assert.equal(classes.has('next-ready'),false);
 }
});
