import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Model=require('../stats/snapshot-model.js');
export const CSV_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vSrAe1vIq__WSCT4FUOA2gHDlkL4g7RCm43CJEDAdvKRzbRulSpqHjGwtXBGot0mgWO4yLYUuc7RMJ-/pub?output=csv';
export const DASHBOARD_URL='https://script.google.com/macros/s/AKfycbwzomHmovON2lQiPP2xa40FRCDFXJ38ofD8YDKB63SBrQHBMB2HKaCBDM_bBmgXsLkD/exec?resource=dashboard-snapshot';
export function parseCsv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(c!=='\r')cell+=c;}
 if(quoted)throw new Error('Unclosed CSV quote');
 if(cell||row.length){row.push(cell);rows.push(row);}if(!rows.length)throw new Error('Empty CSV');
 const headers=rows.shift().map(v=>v.replace(/^\uFEFF/,'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));
 for(const required of ['mikla','atminejums','limenis','game_id'])if(!headers.includes(required))throw new Error('Missing CSV column '+required);
 return rows.filter(r=>r.some(v=>v.trim())).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
export function riddlesFromCsv(csv,previous){
 const levels=Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,[]])),bonusPool=[],ids=new Set();
 for(const r of parseCsv(csv)){
  const q=r.mikla.trim(),a=r.atminejums.trim(),level=r.limenis.trim(),id=r.game_id.trim();
  if(!q&&!a&&!level&&!id)continue;
  if(!q||!a||!id||!(level==='Bonuss'||/^(10|[1-9])$/.test(level)))throw new Error('Invalid riddle '+id);
  if(ids.has(id))throw new Error('Duplicate riddle '+id);ids.add(id);
  const entry={id,gameId:id,unitNumber:(r.vienibas_nr||r.vienibas_numurs||'').trim(),q,a,loc:r.vieta||'',teller:r.teicejs||'',recorder:r.pierakstitajs||'',year:r.gads||'',kolekcija:r.kolekcija||'',sourceUrl:r.id||''};
  (level==='Bonuss'?bonusPool:levels[level]).push(entry);
 }
 if(Object.values(levels).some(rows=>!rows.length))throw new Error('Each difficulty must have riddles');
 const content={version:1,levels,bonusPool};
 const unchanged=previous&&JSON.stringify({version:previous.version,levels:previous.levels,bonusPool:previous.bonusPool})===JSON.stringify(content);
 return {...content,generatedAt:unchanged?previous.generatedAt:new Date().toISOString()};
}
async function readJson(path){try{return JSON.parse(await readFile(path,'utf8'));}catch{return null;}}
async function atomic(path,data){await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',JSON.stringify(data)+'\n');await rename(path+'.tmp',path);}
export async function updateData(directory,request=fetch){
 let failed=0;
 for(const [name,url,transform] of [['riddles.json',CSV_URL,(text,old)=>riddlesFromCsv(text,old)],['miklu-dashboard.json',DASHBOARD_URL,text=>Model.validate(JSON.parse(text))]]){
  const path=directory+'/'+name,old=await readJson(path);
  try{
   const response=await request(url,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw new Error('HTTP '+response.status);
   const data=transform(await response.text(),old);
   if(old?.generatedAt&&Date.parse(data.generatedAt)<Date.parse(old.generatedAt))throw new Error('Source returned older data');
   if(name==='miklu-dashboard.json'&&old?.cohorts?.length&&!data.cohorts.length)throw new Error('Unexpected empty dashboard');
   await atomic(path,data);console.log('Updated '+name);
  }catch(error){failed++;console.warn('::warning::'+name+': '+error.message+'; last valid file retained');if(!old)throw error;}
 }
 return failed;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await updateData(process.argv[2]||'games/miklu-rezgis/data');
