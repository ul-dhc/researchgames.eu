import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),Model=require('../stats/snapshot-model.js');
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const extract=(source,name)=>source.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
function option(value){return {dataset:{value},classList:{toggle(name,on){this[name]=on;}},setAttribute(name,value){this[name]=value;}};}
test('a researcher can select hint and grid together, deselect either, and leave other questions single-choice',()=>{
 const state={researchAnswers:{}},buttons=['found_in_grid','used_hint'].map(option);
 const ctx=vm.createContext({state,fieldset:{dataset:{question:'solution_method',multiple:'true'},querySelectorAll:()=>buttons},buttons});
 vm.runInContext(extract(source,'selectResearchOption'),ctx);
 vm.runInContext('selectResearchOption(fieldset,buttons[0]);selectResearchOption(fieldset,buttons[1])',ctx);
 assert.deepEqual([...state.researchAnswers.solution_method],['found_in_grid','used_hint']);
 assert.ok(buttons.every(b=>b['aria-pressed']==='true'&&b.classList.selected));
 vm.runInContext('selectResearchOption(fieldset,buttons[0])',ctx);
 assert.deepEqual([...state.researchAnswers.solution_method],['used_hint']);assert.equal(buttons[0]['aria-pressed'],'false');
 vm.runInContext('selectResearchOption(fieldset,buttons[1])',ctx);assert.equal(state.researchAnswers.solution_method.length,0);
 ctx.fieldset.dataset={question:'heard_before'};
 vm.runInContext('selectResearchOption(fieldset,buttons[0]);selectResearchOption(fieldset,buttons[1])',ctx);
 assert.equal(state.researchAnswers.heard_before,'used_hint');assert.equal(buttons[0]['aria-pressed'],'false');
});
test('both choices are submitted in one evaluation using the existing Sheets text column',()=>{
 let record;
 const state={sessionId:'test',hintLimit:3,hintsLeft:2,livesLeft:3,gameMode:'10',riddleOutcome:'solved'};
 const ctx=vm.createContext({state,MAX_LIVES:3,currentRiddle:()=>({q:'Mīkla',a:'Atbilde'}),currentResponseId:()=> 'response',datasetRiddleId:()=> 'MR-1',datasetUnitNumber:()=>'',queueAnalyticsRecord:r=>record=r,saveProgress(){}});
 vm.runInContext(extract(source,'queueCurrentEvaluation'),ctx);
 vm.runInContext("queueCurrentEvaluation({solution_method:['used_hint','found_in_grid','used_hint']})",ctx);
 assert.equal(record.solution_method,'found_grid|hint');assert.equal(record.knew_answer_before_search,'no');assert.equal(record.hints_used,1);
 const receiver=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
 const rx=vm.createContext({record,headers:['solution_method'],safeCellValue_:v=>v,isTimestampHeader_:()=>false});
 vm.runInContext(extract(receiver,'normalizeRecord_'),rx);
 assert.equal(vm.runInContext('normalizeRecord_(record,headers).solution_method',rx),'found_grid|hint');
 state.evaluationSaved=false;vm.runInContext("queueCurrentEvaluation({solution_method:['knew','used_hint']})",ctx);
 assert.equal(record.knew_answer_before_search,'yes');
});
const at='2026-11-12T10:00:00Z';
const sessions=[{session_id:'test',game_version:'10',participation_type:'research',session_status:'completed',last_updated_at:at,total_points:100}];
const answers=['found_in_grid|used_hint|used_hint','found_grid','hint',''];
const evaluations=answers.map((solution_method,i)=>({session_id:'test',response_id:'r'+i,played_at:at,solution_method,solved:true,riddle_id:'MR-'+i,heard_before:'yes'}));
function checkModel(model){
 const result=Model.query(model,{days:0});
 assert.equal(result.metrics.sessions,1);assert.equal(result.metrics.evaluatedRiddles,4);
 assert.deepEqual(Object.fromEntries(result.solutionMethods.map(r=>[r.key,r.value])),{found_grid:2,hint:2,unknown:1});
 for(const solutionMethod of ['found_grid','hint']){
  const filtered=Model.query(model,{days:0,solutionMethod,heardBefore:'yes'});
  assert.equal(filtered.metrics.sessions,1);assert.equal(filtered.metrics.evaluatedRiddles,2);
 }
 assert.equal(Model.query(model,{days:0,solutionMethod:'knew'}).metrics.sessions,0);
}
test('dashboard counts multiple methods independently without duplicating evaluations or sessions, including old snapshots',()=>{
 const model=Model.build(sessions,evaluations,[],at);checkModel(model);
 // Previously deployed exporter normalizes the entire combined string. The new
 // client must split it too, so no exporter deployment blocks the release.
 model.evaluations[0].solutionMethod='found_in_grid|used_hint|used_hint';checkModel(model);
});
test('Apps Script dashboard source also counts and filters combined choices and historical aliases',()=>{
 const legacy=readFileSync(new URL('../apps-script/mīklu-dashboard.gs',import.meta.url),'utf8');
 const ctx=vm.createContext({rows:evaluations});vm.runInContext(legacy,ctx);
 const counts=vm.runInContext('buildSolutionMethods_(rows)',ctx);
 assert.deepEqual(Object.fromEntries(counts.map(r=>[r.key,r.value])),{found_grid:2,hint:2,unknown:1});
 assert.deepEqual([...vm.runInContext("solutionMethods_('used_hint|found_in_grid|hint')",ctx)],['found_grid','hint']);
});
