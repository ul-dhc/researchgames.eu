import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildIcons} from '../scripts/build-icons.mjs';
const root=new URL('../',import.meta.url);
test('main game, child game and dashboard sprites match the pinned official Lucide SVGs',async()=>{
 await buildIcons({check:true});
 const template=await readFile(new URL('apps-script/Dashboard.html',root),'utf8');
 const dashboard=await readFile(new URL('stats/index.html',root),'utf8');
 const sprite=html=>html.match(/<svg\b[^>]*>\s*<defs>[\s\S]*?<\/defs>\s*<\/svg>/)[0];
 assert.equal(sprite(dashboard),sprite(template));
});
test('interface SVGs use the canonical sprites; brand marks and data charts are separate from interface icons',async()=>{
 for(const file of ['index.html','berniem/index.html','apps-script/Dashboard.html','stats/index.html']){
  const html=await readFile(new URL(file,root),'utf8');
  const ids=new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m=>m[1]));
  for(const call of html.matchAll(/\bicon\('([^']+)'\)/g))assert.ok(ids.has('dashboard-icon-'+call[1]),`Unknown dashboard icon ${call[1]}`);
  const content=html.replace(/<svg\b[^>]*>\s*<defs>[\s\S]*?<\/defs>\s*<\/svg>/,'');
  for(const match of content.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)){
   const svg=match[0];
   if(file.includes('Dashboard')||file.startsWith('stats/'))if(svg.includes('viewBox="0 0 64 64"')||svg.includes('researchgames-footer-logo')||svg.includes('class="donut-ring"')||svg.includes('class="bar-svg"'))continue;
   assert.ok(!/<(?:path|circle|line|polyline|polygon|rect)\b/.test(svg),`Custom interface geometry in ${file}`);
   const ref=svg.match(/<use[^>]*href="#([^"]+)"/);assert.ok(ref,`Missing sprite reference in ${file}`);assert.ok(ids.has(ref[1])||ref[1]==="dashboard-icon-' + name + '",`Unknown ${ref[1]} in ${file}`);
  }
 }
});
test('game interface and share text contain no emoji or Unicode icon substitutes',async()=>{
 for(const file of ['index.html','js/app.js','berniem/index.html','berniem/app.js']){
  const source=await readFile(new URL(file,root),'utf8');
  assert.doesNotMatch(source,/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2190-\u21FF]/u,file);
  assert.doesNotMatch(source,/>[×✕]</,file);
 }
});
