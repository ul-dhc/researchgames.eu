/* Pure crossword rules shared by the browser and local validation. */
(function(root){
'use strict';
const sizes=[5,7,9],tiers=['B','I','E'],modes=['free','points'];
function normalize(raw,spaces=true){return String(raw).normalize('NFC').toLocaleUpperCase('lv').replace(spaces?/[^A-ZĀČĒĢĪĶĻŅŠŪŽ ]/g:/[^A-ZĀČĒĢĪĶĻŅŠŪŽ]/g,'')}
function positions(w){return Array.from(w.word,(_,i)=>`${w.y+(w.dir?i:0)},${w.x+(w.dir?0:i)}`)}
function hydrate(content,tier,setIndex,sourceVersion='tei-2026_4'){const bank=new Map((sourceVersion==='wordnet-v1'&&content.legacyBank?content.legacyBank:content.bank).records.map(r=>[r.id,r]));return content.rounds.sets[tier][setIndex].rounds.map(grid=>{const words=grid.words.map(p=>({...bank.get(p.id),...p})),members={};words.forEach((w,i)=>positions(w).forEach(p=>(members[p]??=[]).push(i)));for(const w of words){const ps=positions(w);w.fitAnswers=w.alternatives.filter(a=>Array.from(a).every((c,j)=>members[ps[j]].length===1||c===w.word[j]));if(!w.fitAnswers.includes(w.word))w.fitAnswers.push(w.word)}return {...grid,words,members}})}
function answer(w,values){const text=positions(w).map(p=>values[p]||' ').join('');if((w.fitAnswers||[w.word]).includes(text))return 'complete';if((w.alternatives||[]).includes(text))return 'ambiguous';return 'incomplete'}
function count(round,values){return round.words.filter(w=>answer(w,values)==='complete').length}
function score(rounds,states){return rounds.reduce((sum,r,k)=>sum+r.words.reduce((n,w,i)=>n+(answer(w,states[k].values)==='complete'?Math.max(0,100-25*(states[k].hints[i]||0)):0),0),0)}
function validState(state,content){
 if(!state||state.schema!==1||state.contentKey!==content.key||!state.sessions||typeof state.sessions!=='object'||Array.isArray(state.sessions)||!tiers.includes(state.menuTier))return false;
 if(state.active&&(!tiers.includes(state.active.tier)||!modes.includes(state.active.mode)))return false;
 for(const [id,s] of Object.entries(state.sessions)){
  const [tier,mode,...rest]=id.split(':');if(rest.length||!tiers.includes(tier)||!modes.includes(mode)||!s||!Number.isInteger(s.setIndex)||!content.rounds.sets[tier][s.setIndex]||!Number.isInteger(s.round)||s.round<0||s.round>2||!Array.isArray(s.rounds)||s.rounds.length!==3)return false;
  if(s.sourceVersion!==undefined&&!['wordnet-v1','tei-2026_4'].includes(s.sourceVersion))return false;
  const rounds=hydrate(content,tier,s.setIndex,s.sourceVersion||'wordnet-v1');
  for(let k=0;k<3;k++){const r=s.rounds[k],grid=rounds[k];if(!r||!r.values||Array.isArray(r.values)||typeof r.values!=='object'||!r.hints||Array.isArray(r.hints)||typeof r.hints!=='object'||!Number.isInteger(r.active)||r.active<0||r.active>=grid.words.length)return false;
   for(const [p,c] of Object.entries(r.values))if(!grid.members[p]||typeof c!=='string'||(c!==''&&(!/^[A-ZĀČĒĢĪĶĻŅŠŪŽ]$/.test(c)||normalize(c,false)!==c)))return false;
   for(const [i,n] of Object.entries(r.hints))if(!/^\d+$/.test(i)||!grid.words[Number(i)]||!Number.isInteger(n)||n<0||n>grid.words[Number(i)].word.length)return false;
   if(k<s.round&&count(grid,r.values)!==grid.words.length)return false;
  }
 }
 return !state.active||!!state.sessions[state.active.tier+':'+state.active.mode];
}
const api={sizes,tiers,modes,normalize,positions,hydrate,answer,count,score,validState};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RGWordCore=api;
})(typeof globalThis==='undefined'?this:globalThis);
