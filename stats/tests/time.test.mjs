import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {formatTimestamp} from '../time.js';
test('Riga timestamps cross midnight and use winter/summer offsets',()=>{
 assert.match(formatTimestamp('2026-11-03T23:30:00Z','en'),/04\/11\/2026, 01:30/);
 assert.match(formatTimestamp('2026-07-03T23:30:00Z','en'),/04\/07\/2026, 02:30/);
 assert.match(formatTimestamp('2026-03-29T00:30:00Z','en'),/02:30/);
 assert.match(formatTimestamp('2026-03-29T01:30:00Z','en'),/04:30/);
});
test('the same instant displays identically on computers in different time zones',()=>{
 const moduleUrl=new URL('../time.js',import.meta.url).href;
 const code=`import {formatTimestamp} from ${JSON.stringify(moduleUrl)};process.stdout.write(formatTimestamp('2026-11-03T23:30:00Z','lv'));`;
 const outputs=['UTC','America/Los_Angeles','Pacific/Kiritimati'].map(TZ=>execFileSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ},encoding:'utf8'}));
 assert.equal(new Set(outputs).size,1);assert.match(outputs[0],/04\.11\.26 01:30/);
});
