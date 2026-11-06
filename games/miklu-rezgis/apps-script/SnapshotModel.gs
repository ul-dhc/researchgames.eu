/* Shared by Apps Script exporter, static dashboard and collector tests. */
var RiddleSnapshot = (function () {
  'use strict';
  const VERSION = 1;
  const text = v => v == null ? '' : String(v).trim();
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const bool = v => v === true || ['true','yes','jā','1'].includes(text(v).toLowerCase());
  const round = (v,n=0) => Math.round(v*10**n)/10**n;
  const pct = (a,b) => b ? Math.round(a/b*100) : 0;
  const versions = {'10':'Ātrā spēle','50':'Vidējā spēle','100':'Garā spēle',daily:'Dienas mīkla',child:'Bērnu spēle',party:'Ballītes versija',diagnostic:'Diagnostika'};
  const participation = {player:'Spēlētājs',research:'Pētījuma dalībnieks',party:'Ballītes versija',diagnostic:'Diagnostika'};
  const label = (map,key) => map[key] || key || 'Nav norādīts';
  function date(value) { const d=new Date(value); return value && !isNaN(d) ? d : null; }
  function first(row,fields) { for(const f of fields) { const d=date(row[f]); if(d) return d; } return null; }
  function day(value) {
    if (!value) return '';
    if(typeof Utilities!=='undefined')return Utilities.formatDate(value,'Europe/Riga','yyyy-MM-dd');
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
    const get=t=>parts.find(p=>p.type===t).value;
    return get('year')+'-'+get('month')+'-'+get('day');
  }
  function displayDate(value) {
    const d=date(value); if(!d) return '';
    if(typeof Utilities!=='undefined')return Utilities.formatDate(d,'Europe/Riga','dd.MM.yyyy HH:mm');
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    const get=t=>parts.find(p=>p.type===t).value;
    return get('day')+'.'+get('month')+'.'+get('year')+' '+get('hour')+':'+get('minute');
  }
  function normalized(v) {
    const s=text(v).toLowerCase();
    return ({'jā':'yes',ja:'yes','nē':'no',ne:'no',neatceros:'unsure','i do not remember':'unsure','zināju uzreiz':'knew','atminēju mīklu':'solved_riddle','atradu režģī':'found_grid','palīdzēja uzvedne':'hint',used_hint:'hint',padevos:'gave_up'})[s] || s || 'unknown';
  }
  function completed(r) {return text(r.session_status).toLowerCase()==='completed' || (num(r.planned_riddle_count)>0 && num(r.completed_riddle_count)>=num(r.planned_riddle_count));}
  function dimensions(r) { return {outcome:bool(r.solved)?'solved':bool(r.gave_up)?'gave_up':'other',heardBefore:normalized(r.heard_before),solutionMethod:normalized(r.solution_method),difficulty:text(r.difficulty_rating)}; }
  function sum(rows,field) {return rows.reduce((s,r)=>s+num(r[field]),0);}
  // Only aggregate cohorts, riddle statistics and already-public text are returned.
  // Original session/response/question IDs, devices and raw per-session timings never leave this function.
  function build(sessions,evaluations,questions,generatedAt=new Date().toISOString()) {
    const bySession=new Map(), cohorts=[], lookup=new Map(), sessionCohort=new Map(), evalGroups=new Map();
    for(const r of evaluations) {
      const id=text(r.session_id); if(!bySession.has(id)) bySession.set(id,[]);
      bySession.get(id).push(r);
    }
    for(const r of sessions) {
      const id=text(r.session_id); if(!id) continue;
      const info={day:day(first(r,['last_updated_at','session_finished_at','session_started_at'])),version:text(r.game_version),participation:text(r.participation_type),age:text(r.age_group),status:completed(r)?'completed':num(r.completed_riddle_count)>0?'in_progress':'not_started'};
      // Same evaluation facets on the same dates ensure session counts remain exact for combined filters.
      const signature=[...new Set((bySession.get(id)||[]).map(e=>JSON.stringify([day(date(e.played_at)),dimensions(e)])))].sort();
      const key=JSON.stringify([info,signature]);
      let index=lookup.get(key);
      if(index===undefined) {
        index=cohorts.length;lookup.set(key,index);
        cohorts.push({...info,count:0,scoreTotal:0,scoreCount:0,timeTotal:0,timeCount:0,ratings:[0,0,0,0,0]});
      }
      const c=cohorts[index];c.count++;
      if(completed(r)) {
        if(num(r.total_points)>0){c.scoreTotal+=num(r.total_points);c.scoreCount++;}
        if(num(r.total_time_ms)>0){c.timeTotal+=num(r.total_time_ms);c.timeCount++;}
      }
      const rating=num(r.game_rating);if(Number.isInteger(rating)&&rating>=1&&rating<=5)c.ratings[rating-1]++;
      sessionCohort.set(id,index);
    }
    const comments=[],variants=[],publicQuestions=[],seen=new Set();
    for(const r of sessions) {
      const cohort=sessionCohort.get(text(r.session_id));if(cohort===undefined||!text(r.player_comment))continue;
      comments.push({cohort,at:(first(r,['last_updated_at','session_finished_at'])||new Date(0)).toISOString(),rating:num(r.game_rating)||null,version:label(versions,text(r.game_version)),text:text(r.player_comment)});
    }
    for(const r of evaluations) {
      const cohort=sessionCohort.get(text(r.session_id));if(cohort===undefined)continue;
      const info={cohort,day:day(date(r.played_at)),...dimensions(r),riddleId:text(r.riddle_id)||'Bez ID',unitNumber:text(r.unit_number),riddleText:text(r.riddle_text),answer:text(r.answer)};
      const key=JSON.stringify(info);let group=evalGroups.get(key);
      if(!group){group={...info,count:0,timeTotal:0,timeCount:0,hints:0,wrongAttempts:0,difficultyTotal:0,difficultyCount:0};evalGroups.set(key,group);}
      group.count++;const time=num(r.time_ms);if(time>0){group.timeTotal+=time;group.timeCount++;}
      group.hints+=num(r.hints_used);group.wrongAttempts+=num(r.wrong_attempts);
      const diff=num(r.difficulty_rating);if(diff>=1&&diff<=5){group.difficultyTotal+=diff;group.difficultyCount++;}
      if(text(r.similar_variant_text))variants.push({cohort,at:(date(r.played_at)||new Date(0)).toISOString(),riddleId:text(r.riddle_id),riddleText:text(r.riddle_text),text:text(r.similar_variant_text)});
    }
    for(const r of questions) {
      const id=text(r.question_id),cohort=sessionCohort.get(text(r.session_id));
      if(!id||seen.has(id)||cohort===undefined||!text(r.question_text))continue;
      seen.add(id);
      publicQuestions.push({cohort,at:(date(r.submitted_at)||new Date(0)).toISOString(),gameVersion:text(r.game_version),version:label(versions,text(r.game_version)),participationType:text(r.participation_type),participation:label(participation,text(r.participation_type)),text:text(r.question_text)});
    }
    return {version:VERSION,generatedAt,cohorts,evaluations:[...evalGroups.values()],comments,variants,questions:publicQuestions};
  }
  function validate(model) {
    if(!model||model.version!==VERSION||!date(model.generatedAt)||!['cohorts','evaluations','comments','variants','questions'].every(k=>Array.isArray(model[k])))throw new Error('Invalid dashboard snapshot');
    for(const c of model.cohorts)if(!Number.isInteger(c.count)||c.count<1||!Array.isArray(c.ratings)||c.ratings.length!==5)throw new Error('Invalid cohort');
    for(const key of ['evaluations','comments','variants','questions'])for(const r of model[key])if(!Number.isInteger(r.cohort)||!model.cohorts[r.cohort])throw new Error('Invalid cohort reference');
    return model;
  }
  function query(model,filters={},now=Date.now()) {
    validate(model);
    const days=Number.isFinite(Number(filters.days))&&Number(filters.days)>=0?Number(filters.days):30;
    const threshold=days?day(new Date(now-days*86400000)):'';
    const inPeriod=d=>!threshold||d>=threshold;
    const facetNames=['outcome','heardBefore','solutionMethod','difficulty'];
    const hasFacets=facetNames.some(k=>filters[k]);
    const period=model.cohorts.map((c,i)=>({...c,index:i})).filter(c=>inPeriod(c.day));
    let candidates=period.filter(c=>(!filters.version||c.version===filters.version)&&(!filters.participation||c.participation===filters.participation)&&(!filters.sessionStatus||c.status===filters.sessionStatus));
    const ids=new Set(candidates.map(c=>c.index));
    let evaluations=model.evaluations.filter(e=>ids.has(e.cohort)&&inPeriod(e.day)&&facetNames.every(k=>!filters[k]||e[k]===filters[k]));
    if(hasFacets){const matched=new Set(evaluations.map(e=>e.cohort));candidates=candidates.filter(c=>matched.has(c.index));}
    const sessions=candidates.filter(c=>!filters.ageGroup||c.age===filters.ageGroup);
    const selected=new Set(sessions.map(c=>c.index));evaluations=evaluations.filter(e=>selected.has(e.cohort));
    const count=sum(sessions,'count'),done=sum(sessions.filter(c=>c.status==='completed'),'count'),evaluated=sum(evaluations,'count');
    const ratingCounts=[0,1,2,3,4].map(i=>sessions.reduce((s,c)=>s+c.ratings[i],0));
    const ratingCount=ratingCounts.reduce((a,b)=>a+b,0);
    function breakdown(rows,field,labeler=v=>v,weight='count') {
      const counts=new Map();for(const r of rows){const k=r[field]||'Nav norādīts';counts.set(k,(counts.get(k)||0)+num(r[weight]));}
      return [...counts.keys()].sort().map(key=>({key,label:labeler(key),value:counts.get(key)}));
    }
    const sortedText=(rows,limit)=>rows.filter(r=>selected.has(r.cohort)&&inPeriod(day(date(r.at)))).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,limit).map(({cohort,at,...r})=>({date:displayDate(at),...r}));
    const questions=sortedText(model.questions,undefined);
    const riddleGroups=new Map();for(const e of evaluations){let r=riddleGroups.get(e.riddleId);if(!r){r={riddleId:e.riddleId,unitNumber:e.unitNumber,riddleText:e.riddleText,answer:e.answer,plays:0,solved:0,gaveUp:0,timeTotal:0,timeCount:0,hints:0,wrongAttempts:0,difficultyTotal:0,difficultyCount:0};riddleGroups.set(e.riddleId,r);}r.plays+=e.count;if(e.outcome==='solved')r.solved+=e.count;if(e.outcome==='gave_up')r.gaveUp+=e.count;for(const k of ['timeTotal','timeCount','hints','wrongAttempts','difficultyTotal','difficultyCount'])r[k]+=e[k];}
    const riddlePerformance=[...riddleGroups.values()].map(r=>({riddleId:r.riddleId,unitNumber:r.unitNumber,riddleText:r.riddleText,answer:r.answer,plays:r.plays,solved:r.solved,solvedRate:pct(r.solved,r.plays),gaveUp:r.gaveUp,averageTimeMs:r.timeCount?Math.round(r.timeTotal/r.timeCount):0,averageHints:round(r.hints/r.plays,1),averageWrongAttempts:round(r.wrongAttempts/r.plays,1),averageDifficulty:r.difficultyCount?round(r.difficultyTotal/r.difficultyCount,1):0})).sort((a,b)=>a.solvedRate-b.solvedRate||b.plays-a.plays);
    const zeroBreak=(field,labels)=>Object.entries(labels).map(([key,label])=>({key,label,value:sum(evaluations.filter(e=>e[field]===key),'count')}));
    const heard={yes:'Jā',no:'Nē',unsure:'Neatceros',unknown:'Nav atbildes'},methods={knew:'Zināju uzreiz',solved_riddle:'Atminēju mīklu',found_grid:'Atradu režģī',hint:'Palīdzēja uzvedne',gave_up:'Padevos',unknown:'Nav atbildes'};
    return {generatedAt:displayDate(model.generatedAt),filters:{days,...Object.fromEntries(['version','participation','ageGroup','sessionStatus',...facetNames].map(k=>[k,filters[k]||''])),versions:Object.entries(versions).filter(([v])=>v!=='diagnostic').map(([value,label])=>({value,label})),participationTypes:[...new Set(period.map(c=>c.participation).filter(Boolean))].sort().map(value=>({value,label:label(participation,value)}))},
      metrics:{sessions:count,completed:done,completionRate:pct(done,count),averageScore:sum(sessions,'scoreCount')?round(sum(sessions,'scoreTotal')/sum(sessions,'scoreCount')):0,averageTimeMs:sum(sessions,'timeCount')?round(sum(sessions,'timeTotal')/sum(sessions,'timeCount')):0,averageRating:ratingCount?round(ratingCounts.reduce((s,n,i)=>s+n*(i+1),0)/ratingCount,1):0,evaluatedRiddles:evaluated,solvedRate:pct(sum(evaluations.filter(e=>e.outcome==='solved'),'count'),evaluated),researchSessions:sum(sessions.filter(c=>c.participation==='research'),'count'),playerQuestions:questions.length},
      timeline:breakdown(sessions,'day').filter(r=>r.key!=='Nav norādīts').map(r=>({date:r.key,sessions:r.value})),versions:breakdown(sessions,'version',v=>label(versions,v)),participation:breakdown(sessions,'participation',v=>label(participation,v)),completion:[{key:'completed',label:'Pabeigta',value:done},{key:'in_progress',label:'Pārtraukta',value:sum(sessions.filter(c=>c.status==='in_progress'),'count')}],ratings:ratingCounts.map((value,i)=>({rating:i+1,value})),ages:breakdown(candidates,'age'),outcomes:zeroBreak('outcome',{solved:'Atminēta',gave_up:'Padodos',other:'Nav atbildes'}),heardBefore:breakdown(evaluations,'heardBefore',v=>heard[v]||v).sort((a,b)=>b.value-a.value),solutionMethods:breakdown(evaluations,'solutionMethod',v=>methods[v]||v).sort((a,b)=>b.value-a.value),difficulties:breakdown(evaluations,'difficulty',v=>v==='Nav norādīts'?'Nav atbildes':v+' / 5').map(r=>({...r,key:r.key==='Nav norādīts'?'Nav atbildes':r.key})).sort((a,b)=>num(a.key)-num(b.key)),riddlePerformance,comments:sortedText(model.comments,12),playerQuestions:questions,variants:sortedText(model.variants,12)};
  }
  return {build,validate,query};
})();
if(typeof module!=='undefined')module.exports=RiddleSnapshot;
