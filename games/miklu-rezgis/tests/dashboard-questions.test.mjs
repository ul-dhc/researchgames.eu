import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const dashboard = readFileSync(new URL('../apps-script/mīklu-dashboard.gs', import.meta.url), 'utf8');
const helpers = readFileSync(new URL('../apps-script/PlayerQuestions.gs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../apps-script/Dashboard.html', import.meta.url), 'utf8');
const now = new Date().toISOString();
function context() {
  const data = {
    sessions: [
      {session_id:'player-session',session_started_at:now,last_updated_at:now,session_status:'completed',game_version:'daily',participation_type:'player',completed_riddle_count:1,planned_riddle_count:1},
      {session_id:'research-session',session_started_at:now,last_updated_at:now,session_status:'completed',game_version:'10',participation_type:'research',completed_riddle_count:10,planned_riddle_count:10}
    ],
    evaluations: [],
    player_questions: [
      {question_id:'q1',session_id:'player-session',submitted_at:now,game_version:'daily',participation_type:'player',question_text:'Kāpēc mīklām ir varianti?'},
      {question_id:'q2',session_id:'research-session',submitted_at:now,game_version:'10',participation_type:'research',question_text:'Kad pierakstīta šī mīkla?'},
      {question_id:'old',session_id:'player-session',submitted_at:'2001-01-01T00:00:00Z',game_version:'daily',participation_type:'player',question_text:'Vecs jautājums'},
      {question_id:'orphan',session_id:'no-session',submitted_at:now,question_text:'Orphan'},
      {question_id:'blank',session_id:'player-session',submitted_at:now,question_text:'  '}
    ]
  };
  const spreadsheet = {
    setSpreadsheetTimeZone() {},
    getSheetByName(name) {
      if (!(name in data)) return null;
      const rows = data[name];
      const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
      return {
        getDataRange: () => ({getValues: () => [headers,...rows.map(row=>headers.map(key=>row[key] ?? ''))]}),
        getLastRow: () => rows.length+1,
        getRange: (row,col,count,width) => ({getValues:()=>rows.map(item=>[item.question_id,item.session_id,item.submitted_at].slice(col-1,col-1+width))})
      };
    }
  };
  const ctx = vm.createContext({
    SpreadsheetApp:{openById:()=>spreadsheet},
    Utilities:{formatDate:date=>new Date(date).toISOString()},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:content=>({setMimeType(){return this;},getContent:()=>content})},
    console
  });
  vm.runInContext(helpers+'\n'+dashboard,ctx);
  return {ctx,data,run:code=>vm.runInContext(code,ctx)};
}

test('dashboard shows submitted text and metadata, matching version, participation and period filters',()=>{
  const d=context();
  const all=d.run('getDashboardData({days:7})');
  assert.equal(all.playerQuestions.length,2);
  assert.equal(all.metrics.playerQuestions,2);
  assert.equal(all.playerQuestions[0].text,'Kāpēc mīklām ir varianti?');
  assert.equal(all.playerQuestions[0].version,'Dienas mīkla');
  assert.equal(all.playerQuestions[0].participation,'Spēlētājs');
  assert.equal(d.run("getDashboardData({days:7,participation:'research'}).playerQuestions[0].text"),'Kad pierakstīta šī mīkla?');
  assert.equal(d.run("getDashboardData({days:7,version:'daily'}).playerQuestions.length"),1);
  assert.equal(d.run('getDashboardData({days:0}).playerQuestions.length'),3);
  assert.equal(d.run("getDashboardData({days:7,version:'50'}).playerQuestions.length"),0);
  assert.equal('session_id' in all.playerQuestions[0],false);
});

test('all submitted questions are available newest first, without a hidden twelve-row limit',()=>{
  const d=context();
  d.data.player_questions=Array.from({length:20},(_,i)=>({question_id:'q'+i,session_id:'player-session',submitted_at:new Date(Date.now()-i*1000).toISOString(),game_version:'daily',participation_type:'player',question_text:'Jautājums '+i}));
  const rows=d.run('getDashboardData({days:7}).playerQuestions');
  assert.equal(rows.length,20);
  assert.equal(rows[0].text,'Jautājums 0');
  assert.equal(rows.at(-1).text,'Jautājums 19');
  delete d.data.player_questions;
  assert.equal(d.run('getDashboardData({days:0}).playerQuestions.length'),0);
});

test('public overview JSON keeps its aggregate-only contract',()=>{
  const d=context();
  const json=d.run("researchGamesUncachedSummary_('all').getContent()");
  const result=JSON.parse(json);
  assert.equal(result.ok,true);
  assert.equal(result.overview.sessions,2);
  assert.equal(json.includes('question_text'),false);
  assert.equal(json.includes('Kāpēc'),false);
  assert.equal(json.includes('playerQuestions'),false);
});

test('question renderer escapes markup, preserves line breaks, and translates badges',()=>{
  const render=html.match(/    function renderPlayerQuestion\(item\) \{[\s\S]*?^    \}/m)[0];
  const escape=html.match(/    function esc\(value\) \{[\s\S]*?^    \}/m)[0];
  const ctx=vm.createContext({currentLang:'en',labelEnglish:{daily:'Daily riddle',player:'Player'}});
  vm.runInContext(escape+'\n'+render,ctx);
  ctx.item={date:'29.10.2026',gameVersion:'daily',version:'Dienas mīkla',participationType:'player',participation:'Spēlētājs',text:'<img src=x onerror=alert(1)>\nOtrā rinda & teksts'};
  const result=vm.runInContext('renderPlayerQuestion(item)',ctx);
  assert.equal(result.includes('<img'),false);
  assert.match(result,/&lt;img/);
  assert.match(result,/&amp; teksts/);
  assert.match(result,/Daily riddle/);
  assert.match(result,/Player/);
  assert.match(result,/\nOtrā rinda/);
  new vm.Script(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1]);
});
