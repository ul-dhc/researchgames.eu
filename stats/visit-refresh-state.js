// A successful download is not evidence that the underlying visit data changed.
export function newestVisitSourceTime(model){
 const times=Object.values(model?.periods||{}).flatMap(period=>Object.values(period||{})).map(entry=>Date.parse(entry?.fetchedAt)).filter(Number.isFinite);
 return times.length?Math.max(...times):null;
}
export function visitRefreshOutcome(previous,incoming,failed=false){
 if(failed)return 'failed';
 const before=newestVisitSourceTime(previous),after=newestVisitSourceTime(incoming);
 if(after===null)return 'unavailable';
 return before===null||after>before?'newer':'unchanged';
}
