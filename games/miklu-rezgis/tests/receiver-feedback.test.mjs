import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const questions=readFileSync(new URL('../apps-script/PlayerQuestions.gs',import.meta.url),'utf8');
const extract=(s,name)=>s.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
test('receiver skips spreadsheet formatting during normal POST requests',()=>{
 let initialized=0,processed=0,released=false;
 const ctx=vm.createContext({SESSIONS_SHEET:'sessions',EVALUATIONS_SHEET:'evaluations',LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){released=true;}})},getSpreadsheet_:()=>({getSheetByName:()=>({})}),initializeSheets(){initialized++;},parseRequest_:()=>({records:[{}]}),processRecord_(){processed++;return {};},SpreadsheetApp:{flush(){}},jsonResponse_:p=>p,console});
 vm.runInContext(extract(code,'doPost'),ctx);
 const result=vm.runInContext('doPost({})',ctx);
 assert.equal(result.ok,true);assert.equal(initialized,0);assert.equal(processed,1);assert.equal(released,true);
});
test('receiver accepts player questions from all adult game modes including typed',()=>{
 for(const version of ['10','50','100','typed','daily','party']){
  let appended=0;
  const headers=['question_id','session_id','submitted_at','game_version','participation_type','question_text','app_version','data_schema_version'];
  const ctx=vm.createContext({PLAYER_QUESTIONS_SHEET:'player_questions',PLAYER_QUESTION_HEADERS:headers,getSpreadsheet_:()=>({getSheetByName:()=>({getRange:()=>({getValues:()=>[headers]})})}),findRowById_:()=>0,normalizeRecord_:r=>r,appendRecord_(){appended++;},record:{session_id:'test',question_id:'test-question',question_text:'Kas?',game_version:version,participation_type:'player',submitted_at:'2026-11-07T20:00:00Z'}});
  vm.runInContext(extract(questions,'upsertPlayerQuestion_'),ctx);
  assert.equal(vm.runInContext('upsertPlayerQuestion_(record)',ctx).action,'created');assert.equal(appended,1);
 }
});
