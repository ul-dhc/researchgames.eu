import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../apps-script/receiver-sheet.gs',import.meta.url),'utf8');
function run(headers) {
 const writes=[];
 const sheet={getLastRow:()=>2,getLastColumn:()=>headers.length,getRange:(r,c,h,w)=>({getDisplayValues:()=>[headers.slice(c-1,c-1+w)],setValues:values=>writes.push({c,values})})};
 const ctx=vm.createContext({HEADERS:['session_id','date_time','session_status'],SHEET_NAME:'Games',SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>sheet})}});
 vm.runInContext(code,ctx);ctx.getGamesSheet_();return writes;
}
test('extra columns, including blank headers over used cells, do not block ingestion',()=>{
 assert.deepEqual(run(['session_id','date_time','session_status','','notes']),[]);
});
test('wrong game column order still fails without rewriting data',()=>{
 assert.throws(()=>run(['date_time','session_id','session_status']),/does not match/);
});
test('older schemas receive only missing trailing game headers',()=>{
 assert.equal(JSON.stringify(run(['session_id','date_time'])),JSON.stringify([{c:3,values:[['session_status']]}]));
});
