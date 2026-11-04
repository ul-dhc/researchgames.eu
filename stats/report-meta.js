import {formatTimestamp} from './time.js?v=20261104-riga-1';
export function freshnessSummary(sources){
 const available=sources.filter(s=>Number.isFinite(Date.parse(s.updatedAt)));
 return {oldest:available.length?Math.min(...available.map(s=>Date.parse(s.updatedAt))):null,
 newest:available.length?Math.max(...available.map(s=>Date.parse(s.updatedAt))):null,
 missing:sources.length-available.length,stale:available.filter(s=>s.stale).length};
}
export function renderFreshness(root,sources,language,{loading=false}={}){
 if(!root)return;
 const lv=language==='lv',summary=freshnessSummary(sources),append=(tag,text,parent=root)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
 root.replaceChildren();root.classList.add('report-freshness');root.setAttribute('aria-live','polite');
 const date=value=>formatTimestamp(value,language),oldest=summary.oldest===null?null:date(summary.oldest),newest=summary.newest===null?null:date(summary.newest);
 append('p',oldest?`${lv?'Dati atjaunoti':'Data updated'}: ${oldest===newest?oldest:oldest+' – '+newest} · ${lv?'Rīgas laiks':'Riga time'}`:lv?'Datu atjaunošanas laiks vēl nav pieejams.':'Data update time is not yet available.').className='report-updated';
 const notices=[];
 if(loading)notices.push(lv?'Atjauno fonā…':'Updating in the background…');
 if(summary.stale)notices.push(lv?'Daļai avotu redzami saglabātie dati; gaida atjaunošanu.':'Some sources show saved data and await an update.');
 if(summary.missing)notices.push(lv?'Daļai avotu dati nav pieejami.':'Some sources are unavailable.');
 if(notices.length)append('p',notices.join(' ')).className='report-freshness-note';
 if(sources.length>1){
  const details=append('details','');append('summary',lv?'Atjaunošanas laiks katram avotam':'Update time for each source',details);
  const list=append('dl','',details);
  for(const source of sources){const row=append('div','',list);append('dt',source.name,row);append('dd',Number.isFinite(Date.parse(source.updatedAt))?date(source.updatedAt)+(source.stale?(lv?' · saglabātie dati':' · saved data'):''):lv?'Nav pieejams':'Unavailable',row);}
 }
}
