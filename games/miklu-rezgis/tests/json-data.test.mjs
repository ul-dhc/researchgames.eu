import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {riddlesFromCsv,updateData} from '../scripts/update-data.mjs';
const require=createRequire(import.meta.url),Model=require('../stats/snapshot-model.js');
const legacy=await readFile(new URL('../apps-script/mīklu-dashboard.gs',import.meta.url),'utf8');
const at=new Date(Date.now()-2*86400000).toISOString();
const sessions=Array.from({length:8},(_,i)=>({session_id:'PRIVATE-'+i,last_updated_at:at,session_finished_at:at,session_started_at:at,game_version:i%2?'10':'daily',participation_type:i%3?'player':'research',age_group:i%2?'35–44':'25–34',session_status:i%2?'completed':'in_progress',planned_riddle_count:10,completed_riddle_count:i%2?10:2,total_points:i*20,total_time_ms:i*1000,game_rating:i%5+1,player_comment:i===0?'Komentārs':'',client_id:'SECRET-DEVICE'}));
const evaluations=sessions.flatMap((s,i)=>Array.from({length:i%3+1},(_,j)=>({session_id:s.session_id,response_id:'PRIVATE-RESPONSE-'+i+'-'+j,played_at:at,riddle_id:'MR-'+j,riddle_text:'Mīkla '+j,answer:'Atbilde '+j,unit_number:'U-'+j,solved:j%2===0,gave_up:j%2===1,heard_before:j%2?'yes':'no',solution_method:j%2?'gave_up':'knew',difficulty_rating:j+1,time_ms:i*200+j*100,hints_used:j,wrong_attempts:i,similar_variant_text:i===0?'Variants':''})));
const questions=sessions.map((s,i)=>({question_id:'PRIVATE-Q-'+i,session_id:s.session_id,submitted_at:at,game_version:s.game_version,participation_type:s.participation_type,question_text:'Jautājums '+i}));
function spreadsheet(){return {setSpreadsheetTimeZone(){},getSheetByName(name){const rows={sessions,evaluations,player_questions:questions}[name];if(!rows)return null;const headers=[...new Set(rows.flatMap(Object.keys))];return {getDataRange:()=>({getValues:()=>[headers,...rows.map(r=>headers.map(k=>r[k]??''))]})};}};}
function format(d,tz,pattern){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(d)).map(p=>[p.type,p.value]));return pattern==='yyyy-MM-dd'?`${p.year}-${p.month}-${p.day}`:`${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;}
const ctx=vm.createContext({SpreadsheetApp:{openById:spreadsheet},PLAYER_QUESTIONS_SHEET:'player_questions',Utilities:{formatDate:format},console});vm.runInContext(legacy,ctx);
function normalize(d){d=JSON.parse(JSON.stringify(d));delete d.generatedAt;for(const k of ['versions','participation','ages','heardBefore','solutionMethods','difficulties'])d[k].sort((a,b)=>String(a.key).localeCompare(String(b.key)));return d;}
test('public model matches existing dashboard for combined filters and contains no source IDs or devices',()=>{
 const model=Model.build(sessions,evaluations,questions);
 const json=JSON.stringify(model);assert.ok(!/PRIVATE|SECRET|session_id|response_id|question_id|client_id/.test(json));
 for(const days of [0,7,30])for(const version of ['', '10','daily'])for(const participation of ['', 'player','research'])for(const heardBefore of ['', 'yes','no'])for(const ageGroup of ['', '25–34']){
  const filters={days,version,participation,heardBefore,ageGroup};ctx.filters=filters;
  assert.deepEqual(normalize(Model.query(model,filters)),normalize(vm.runInContext('getDashboardData(filters)',ctx)),JSON.stringify(filters));
 }
});
test('identical sessions are grouped without losing weighted counts or facet intersections',()=>{
 const rows=[sessions[1],{...sessions[1],session_id:'SECOND'}],es=[evaluations.find(e=>e.session_id===sessions[1].session_id),{...evaluations.find(e=>e.session_id===sessions[1].session_id),session_id:'SECOND'}];
 const model=Model.build(rows,es,[]);assert.equal(model.cohorts.length,1);assert.equal(model.cohorts[0].count,2);assert.equal(Model.query(model,{days:0,heardBefore:'no'}).metrics.sessions,2);assert.equal(Model.query(model,{days:0,heardBefore:'yes'}).metrics.sessions,0);
});
const csv='game_id,mīkla,atminējums,līmenis\n'+Array.from({length:10},(_,i)=>`MR-${i},"Mīkla, ${i}",Atbilde,${i+1}`).join('\n');
test('content export validates levels, duplicates and quoted CSV; unchanged data keeps its timestamp',()=>{
 const data=riddlesFromCsv(csv);assert.equal(data.levels[1][0].q,'Mīkla, 0');assert.equal(riddlesFromCsv(csv,data).generatedAt,data.generatedAt);
 assert.throws(()=>riddlesFromCsv(csv.replace('MR-1,','MR-0,')),/Duplicate/);assert.throws(()=>riddlesFromCsv(csv.replace(',10',',11')),/Invalid/);
});
test('collector retains last valid files after network failure and rejects older snapshots',async()=>{
 const dir=await mkdtemp(tmpdir()+'/riddle-json-');const riddles=riddlesFromCsv(csv),model=Model.build(sessions,evaluations,questions);
 await writeFile(dir+'/riddles.json',JSON.stringify(riddles));await writeFile(dir+'/miklu-dashboard.json',JSON.stringify(model));
 assert.equal(await updateData(dir,async()=>{throw new Error('offline');}),2);
 assert.deepEqual(JSON.parse(await readFile(dir+'/miklu-dashboard.json','utf8')),model);
 const old={...model,generatedAt:'2000-01-01T00:00:00Z'};
 await updateData(dir,async url=>({ok:true,text:async()=>url.includes('output=csv')?csv:JSON.stringify(old)}));
 assert.deepEqual(JSON.parse(await readFile(dir+'/miklu-dashboard.json','utf8')),model);
});
test('generated dashboard and GAS model stay synchronized; website has no live Sheets calls',async()=>{
 assert.equal(await readFile(new URL('../apps-script/SnapshotModel.gs',import.meta.url),'utf8'),await readFile(new URL('../stats/snapshot-model.js',import.meta.url),'utf8'));
 const html=await readFile(new URL('../stats/index.html',import.meta.url),'utf8');assert.ok(!html.includes('google.script.run'));assert.ok(!html.includes('<iframe'));
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');assert.ok(!app.includes('RIDDLES_CSV_URL'));assert.ok(app.includes('RiddleData.load()'));
});

test('game loader uses static JSON and keeps newer saved data when the network fails or returns older data',async()=>{
 const source=await readFile(new URL('../js/riddle-loader.js',import.meta.url),'utf8');
 const data=riddlesFromCsv(csv),stored={...data,generatedAt:'2090-01-01T00:00:00Z'};
 const calls=[];const context=vm.createContext({AbortSignal,localStorage:{getItem:()=>JSON.stringify(stored),setItem(){}},fetch:async url=>{calls.push(url);if(url.startsWith('https:'))throw new Error('offline');return {ok:true,json:async()=>data};}});
 vm.runInContext(source,context);const result=await vm.runInContext('RiddleData.load()',context);
 assert.equal(result.generatedAt,stored.generatedAt);assert.ok(calls.every(url=>!url.includes('google.com')));
 assert.deepEqual(calls,['https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/riddles.json','data/riddles.json']);
});

test('dashboard saved data renders immediately and an older response cannot replace it',async()=>{
 const source=await readFile(new URL('../stats/snapshot-loader.js',import.meta.url),'utf8');
 const current=Model.build(sessions,evaluations,questions,'2090-01-01T00:00:00Z'),old={...current,generatedAt:'2020-01-01T00:00:00Z'};
 let resolve;const network=new Promise(r=>resolve=r);
 const context=vm.createContext({RiddleSnapshot:Model,AbortSignal,localStorage:{getItem:()=>JSON.stringify(current),setItem(){}},fetch:()=>network});
 vm.runInContext(source,context);assert.equal((await vm.runInContext('DashboardSnapshot.load()',context)).generatedAt,current.generatedAt);
 resolve({ok:true,json:async()=>old});assert.equal((await vm.runInContext('DashboardSnapshot.refresh()',context)).generatedAt,current.generatedAt);
});
