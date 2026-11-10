// A successful download is not evidence that the underlying visit data changed.
export function newestVisitSourceTime(model){
 const times=Object.values(model?.periods||{}).flatMap(period=>Object.values(period||{})).map(entry=>Date.parse(entry?.fetchedAt)).filter(Number.isFinite);
 return times.length?Math.max(...times):null;
}
export function visitRefreshOutcome(previous,incoming,failed=false,period,ids){
 if(failed)return 'failed';
 const periods=period?[period]:Object.keys(incoming?.periods||{});
 let available=false,newer=false;
 for(const key of periods){
  for(const [id,entry] of Object.entries(incoming?.periods?.[key]||{})){
   if(ids&&!ids.includes(id))continue;
   const after=Date.parse(entry?.fetchedAt),before=Date.parse(previous?.periods?.[key]?.[id]?.fetchedAt);
   if(!Number.isFinite(after))continue;
   available=true;
   if(!Number.isFinite(before)||after>before)newer=true;
  }
 }
 return !available?'unavailable':newer?'newer':'unchanged';
}
