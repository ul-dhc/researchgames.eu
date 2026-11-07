import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const extract=name=>source.match(new RegExp('function '+name+'\\([^]*?^}', 'm'))[0];
function setup(queued=true){
 const elements=Object.fromEntries(['feedback-comment','feedback-confirm','open-feedback-btn','feedback-submit-btn'].map(id=>[id,{value:'Mana atsauksme'}]));
 const state={survey:{rating:'5',ageGroup:'35_44'},feedbackSubmitted:false,feedbackDelivered:false,sessionId:'test-session',gameMode:'typed',totalScore:100,timerSeconds:20};
 const records=[];
 const ctx=vm.createContext({state,document:{getElementById:id=>elements[id]},queueAnalyticsRecord(r){records.push(r);return queued;}});
 vm.runInContext(extract('updateGameFeedbackStatus')+'\n'+extract('submitGameFeedback'),ctx);
 return {state,elements,records,run:s=>vm.runInContext(s,ctx)};
}
test('feedback submission keeps its text, queues once, and confirms only acknowledged delivery',()=>{
 const c=setup();c.run('submitGameFeedback()');
 assert.equal(c.records.length,1);assert.equal(c.records[0].player_comment,'Mana atsauksme');
 assert.equal(c.state.feedbackSubmitted,true);assert.equal(c.elements['feedback-submit-btn'].disabled,true);
 assert.match(c.elements['feedback-confirm'].textContent,/saglabāta šajā ierīcē/);
 assert.equal(c.elements['open-feedback-btn'].disabled,false);
 c.run('submitGameFeedback()');assert.equal(c.records.length,1);
 c.state.feedbackDelivered=true;c.run('updateGameFeedbackStatus()');
 assert.match(c.elements['feedback-confirm'].textContent,/ir nosūtīta/);
 assert.equal(c.elements['open-feedback-btn'].disabled,true);
});
test('failed local persistence shows an error, preserves the comment and permits retry',()=>{
 const c=setup(false);c.run('submitGameFeedback()');
 assert.equal(c.state.feedbackSubmitted,false);assert.equal(c.elements['feedback-comment'].value,'Mana atsauksme');
 assert.match(c.elements['feedback-confirm'].textContent,/Neizdevās saglabāt/);
 c.run('submitGameFeedback()');assert.equal(c.records.length,2);
});

test('receiver acknowledgement updates feedback delivery and removes the acknowledged queue item',async()=>{
 const records=[{record_type:'session_feedback',session_id:'test-session'}];
 let queue=JSON.stringify(records),updates=0;
 const state={sessionId:'test-session',feedbackDelivered:false};
 const ctx=vm.createContext({state,ANALYTICS_SCRIPT_URL:'https://example.invalid',ANALYTICS_QUEUE_KEY:'queue',analyticsFlushInProgress:false,analyticsRetryDelayMs:1200,analyticsNextAttemptAt:0,navigator:{onLine:true},localStorage:{getItem(){return queue;},setItem(k,v){queue=v;}},fetch:async()=>({json:async()=>({ok:true})}),updateGameFeedbackStatus(){updates++;},console,setTimeout(){}});
 vm.runInContext(extract('flushAnalyticsQueue'),ctx);vm.runInContext('flushAnalyticsQueue()',ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.feedbackDelivered,true);assert.equal(updates,1);assert.deepEqual(JSON.parse(queue),[]);
});

test('failed delivery retains the queue and backs off instead of retrying every new event',async()=>{
 const queue=JSON.stringify([{record_type:'session_question',session_id:'test-session'}]);
 let requests=0,delay=0;
 const ctx=vm.createContext({state:{},ANALYTICS_SCRIPT_URL:'https://example.invalid',ANALYTICS_QUEUE_KEY:'queue',analyticsFlushInProgress:false,analyticsRetryDelayMs:1200,analyticsNextAttemptAt:0,navigator:{onLine:true},localStorage:{getItem(){return queue;},setItem(){throw Error('must retain records');}},fetch:async()=>{requests++;return {json:async()=>({ok:false,error:'Busy'})};},console:{warn(){}},setTimeout(fn,ms){delay=ms;}});
 vm.runInContext(extract('flushAnalyticsQueue'),ctx);vm.runInContext('flushAnalyticsQueue()',ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(delay,5000);assert.equal(ctx.analyticsFlushInProgress,false);
 vm.runInContext('flushAnalyticsQueue()',ctx);assert.equal(requests,1);
});
