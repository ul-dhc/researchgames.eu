import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('server cache reuses successful summaries per period for five minutes, never errors',()=>{
 const values=new Map();let calls=0,fail=false;
 const output=text=>({getContent:()=>text,setMimeType(){return this;}});
 const context=vm.createContext({console,ContentService:{createTextOutput:output,MimeType:{JSON:'json'}},CacheService:{getScriptCache:()=>({get:key=>values.get(key),put:(key,value,ttl)=>{assert.equal(ttl,300);values.set(key,value);}})},researchGamesUncachedSummary_:period=>{calls++;return output(JSON.stringify({ok:!fail,period}));}});
 vm.runInContext(readFileSync(new URL('../apps-script/SummaryCache.gs',import.meta.url),'utf8'),context);
 context.researchGamesSummary_('all');context.researchGamesSummary_('all');assert.equal(calls,1);
 context.researchGamesSummary_('7d');assert.equal(calls,2);
 fail=true;context.researchGamesSummary_('30d');context.researchGamesSummary_('30d');assert.equal(calls,4);
 values.clear();fail=false;context.researchGamesSummary_('all');assert.equal(calls,5);
});
