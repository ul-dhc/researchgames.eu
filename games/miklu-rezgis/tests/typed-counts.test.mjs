import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const extract=name=>app.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
const helpers=['validTypedCount','typedRiddlesInLevel','typedMaxScore','plannedRiddleCount','startLevel','modeLabel'];
const levels=()=>Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,Array.from({length:20},(_,j)=>({id:`${i+1}-${j}`}))]));
function setup(count){
 const state={gameMode:'typed',typedRiddleCount:count,levels:levels(),currentLevel:1};
 const ctx=vm.createContext({state,LEVEL_BASE:[0,100,120,140,160,180,200,220,240,260,280,500],BONUS_RIDDLE_POINTS:500,MODE_NAMES:{typed:'Bez režģa'},shuffle:a=>a,loadRiddle(){}});
 vm.runInContext(helpers.map(extract).join('\n'),ctx);
 return {state,ctx,run:s=>vm.runInContext(s,ctx)};
}
test('all four typed lengths play the requested number across ten levels with correct point maxima',()=>{
 for(const [count,maximum] of [[10,2900],[25,5800],[50,10500],[100,20000]]){
  const c=setup(count),played=[];
  for(let level=1;level<=10;level++){c.state.currentLevel=level;c.run('startLevel()');played.push(...c.state.shuffledLevel.map(r=>r.id));}
  assert.equal(played.length,count);assert.equal(new Set(played).size,count);
  assert.equal(c.run('typedMaxScore()'),maximum);assert.equal(c.run('plannedRiddleCount()'),count);
  assert.equal(c.run("modeLabel('typed')"),`Bez režģa (${count} mīklas)`);
 }
 const c=setup(25);assert.deepEqual(Array.from(c.run('Array.from({length:10},(_,i)=>typedRiddlesInLevel(i+1))')),[2,3,2,3,2,3,2,3,2,3]);
});
test('saved research game restores the chosen length, current level allocation and score maximum',()=>{
 const c=setup(25),storage=new Map();
 Object.assign(c.ctx,{STORAGE_KEY:'progress',PROGRESS_MAX_AGE_MS:604800000,MODE_RPL:{typed:1},MODE_MAX:{typed:2900},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},console,showGameScreen(){},setParticipationMode:mode=>c.state.participationMode=mode,resetTimer(){},loadRiddlesFromSheets:fn=>fn(),unlockGame(){},startTimer(){}});
 Object.assign(c.state,{currentLevel:4,riddleIdx:1,participationMode:'research',totalScore:500,levelScore:100,totalTimeBonus:0,isBonus:false});
 vm.runInContext(['saveProgress','readSavedProgress','loadSavedProgress'].map(extract).join('\n'),c.ctx);
 c.run('saveProgress()');assert.equal(JSON.parse(storage.get('progress')).typedRiddleCount,25);
 c.state.typedRiddleCount=10;c.state.currentLevel=1;c.state.participationMode='player';c.run('loadSavedProgress()');
 assert.equal(c.state.typedRiddleCount,25);assert.equal(c.state.currentLevel,4);assert.equal(c.state.riddlesPerLevel,3);assert.equal(c.state.shuffledLevel.length,3);assert.equal(c.state.riddleIdx,1);assert.equal(c.state.maxScore,5800);assert.equal(c.state.participationMode,'research');
});
test('old saves and invalid counts use ten riddles; regular grid level sizes stay unchanged',()=>{
 const c=setup(undefined);for(const value of [undefined,null,0,12,999,'bad']){c.ctx.value=value;assert.equal(c.run('validTypedCount(value)'),10);}
 c.ctx.value='50';assert.equal(c.run('validTypedCount(value)'),50);
 c.state.gameMode=50;c.state.riddlesPerLevel=5;c.run('startLevel()');assert.equal(c.state.shuffledLevel.length,5);
});
