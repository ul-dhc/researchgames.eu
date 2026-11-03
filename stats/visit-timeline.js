import {VISIT_PAGES} from './visits.js?v=20261103-timeline-1';
const DAY=86400000;
// Daily dates come from GoatCounter. Keep its complete first/last reporting days.
export function buildVisitTimeline(entries,period,names,totalName){
 const ids=Object.keys(VISIT_PAGES);
 const histories=ids.map(id=>entries?.[id]).filter(entry=>Array.isArray(entry?.timeline)&&entry.timelineStart&&entry.timelineEnd);
 if(!histories.length)return {dates:[],games:[]};
 const end=histories.map(entry=>entry.timelineEnd).sort().at(-1);
 const eligible=histories.filter(entry=>entry.timelineEnd===end);
 const observed=eligible.flatMap(entry=>entry.timeline.map(day=>day.date)).sort();
 const start=period==='all'?(observed[0]||end):eligible.map(entry=>entry.timelineStart).sort()[0];
 const dates=[];
 for(let time=Date.parse(start+'T00:00:00Z');time<=Date.parse(end+'T00:00:00Z');time+=DAY)dates.push(new Date(time).toISOString().slice(0,10));
 const games=ids.map(id=>{
  const entry=entries?.[id],available=Array.isArray(entry?.timeline)&&entry.timelineEnd===end;
  const counts=new Map(entry?.timeline?.map(day=>[day.date,day.visits])||[]);
  return {id,name:names[id],values:available?dates.map(date=>counts.get(date)||0):null};
 });
 const complete=games.every(game=>game.values!==null);
 const total={id:'total',name:totalName,values:complete?dates.map((_,index)=>games.reduce((sum,game)=>sum+game.values[index],0)):null};
 return {dates,games:[total,...games]};
}
