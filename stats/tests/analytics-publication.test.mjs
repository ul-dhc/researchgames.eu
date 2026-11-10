import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const publisher=fileURLToPath(new URL('../scripts/push-analytics.sh',import.meta.url));
test('independent publishers preserve each other’s files after a rejected stale push',()=>{
 const root=mkdtempSync(join(tmpdir(),'rg-publish-'));
 const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const save=(cwd,file,body)=>{writeFileSync(join(cwd,file),body);git(cwd,'add',file);git(cwd,'commit','-m','test '+file);};
 try{
  const remote=join(root,'remote.git'),first=join(root,'first'),second=join(root,'second');
  git(root,'init','--bare',remote);git(root,'clone',remote,first);
  git(first,'config','user.name','Test');git(first,'config','user.email','test@example.invalid');
  git(first,'switch','-c','analytics-data');save(first,'visits.json','old visits');git(first,'push','origin','HEAD:analytics-data');
  git(root,'clone','--branch','analytics-data',remote,second);
  git(second,'config','user.name','Test');git(second,'config','user.email','test@example.invalid');
  save(first,'visits.json','new visits');
  save(second,'stats.json','new gameplay');
  execFileSync('bash',[publisher],{cwd:first,stdio:'pipe'});
  execFileSync('bash',[publisher],{cwd:second,stdio:'pipe'});
  assert.equal(readFileSync(join(second,'visits.json'),'utf8'),'new visits');
  assert.equal(git(root,'--git-dir='+remote,'show','analytics-data:visits.json'),'new visits');
  assert.equal(git(root,'--git-dir='+remote,'show','analytics-data:stats.json'),'new gameplay');
 }finally{rmSync(root,{recursive:true,force:true});}
});
