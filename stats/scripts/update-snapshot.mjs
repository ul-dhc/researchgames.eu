import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {SOURCES} from '../config.js';
import {fetchSummary} from '../data.js';
import {normalizeSnapshot,PERIODS} from '../snapshot.js';
export async function collectSnapshot(previous, sources=SOURCES, request=fetchSummary) {
 const snapshot={version:1,generatedAt:new Date().toISOString(),periods:Object.fromEntries(PERIODS.map(p=>[p,{}]))};
 let failures=0;
 // Three sources in parallel; periods sequential within each source.
 await Promise.all(Object.entries(sources).map(async([id,url])=>{
  for (const period of PERIODS) {
   try {
    const data=await request(url,period,AbortSignal.timeout(90000));
    snapshot.periods[period][id]={data,fetchedAt:new Date().toISOString(),failed:false};
   } catch(error) {
    failures++;
    const old=previous?.periods?.[period]?.[id];
    if(old) snapshot.periods[period][id]={...old,failed:true};
    console.warn(`${id}/${period}: ${error.message}`);
   }
  }
 }));
 return {snapshot:normalizeSnapshot(snapshot,Object.keys(sources)),failures};
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const path=process.argv[2] || 'stats/snapshot.json';
 let previous;
 try {previous=normalizeSnapshot(JSON.parse(await readFile(path,'utf8')),Object.keys(SOURCES));} catch {}
 const {snapshot,failures}=await collectSnapshot(previous);
 await mkdir(dirname(path),{recursive:true});
 await writeFile(`${path}.tmp`,JSON.stringify(snapshot)+'\n');await rename(`${path}.tmp`,path);
 console.log(`Saved ${path}; ${failures} unavailable source/period pairs`);
 if(failures) console.warn('::warning::Some sources could not refresh. Previous data retained where available.');
}
