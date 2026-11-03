import {normalizeVisits,mergeVisits,VISIT_PAGES,VISIT_PERIODS} from './visits.js?v=20261103-3';
const SNAPSHOT_URL='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/visits.json';
const KEY='rg-visits-v1';
let model;
try {model=normalizeVisits(JSON.parse(localStorage.getItem(KEY)));} catch {}
const names={lv:{'miklu-rezgis':'Mīklu režģis','libiesu-vietvardi':'Lībiešu vietvārdi','muns-teirums':'Muns teirums','cell-intro':'Pasaule šūnā',landing:'researchgames.eu sākumlapa'},en:{'miklu-rezgis':'Riddle Grid','libiesu-vietvardi':'Livonian place names','muns-teirums':'Muns teirums','cell-intro':'A world inside a cell',landing:'researchgames.eu landing page'}};
const copy={
  lv:{siteTitle:'Lapas apmeklējumi',gameTitle:'Spēļu lapas',landingNote:'Sākumlapas apmeklējumi latviešu un angļu valodā kopā.',cellNote:'Šūnas spēles un priekšskatījuma lapas kopā.',title:'Spēles lapas apmeklējumi',unavailable:'Apmeklējumu dati pašlaik nav pieejami.',note:'Avots: GoatCounter. Apmeklējumi nav unikālie cilvēki vai spēlēšanas sesijas. Uzskaite aptver tikai periodu, kad lapā darbojas izsekošana.',scope:'Apmeklējumi attiecas uz visu spēles lapu; spēles un dalībnieku filtri tos nemaina.',saved:'Saglabātie dati; gaida atjaunošanu.',updated:'Atjaunots',range:'Datu periods',overview:'LU jubilejas spēle nav iekļauta.',riddle:'Iekļauta galvenā un bērnu spēles lapa.'},
  en:{siteTitle:'Page visits',gameTitle:'Game pages',landingNote:'Combined visits to the Latvian and English landing pages.',cellNote:'Includes the cell game and preview pages.',title:'Game-page visits',unavailable:'Visit data is currently unavailable.',note:'Source: GoatCounter. Visits are not unique people or gameplay sessions. Only the period with tracking enabled is covered.',scope:'Visits cover the whole game page; game and participant filters do not change them.',saved:'Saved data; awaiting an update.',updated:'Updated',range:'Data period',overview:'The UL anniversary game is excluded.',riddle:'Includes the main game and children’s game pages.'}
};
export function renderVisits() {
  document.querySelectorAll('[data-rg-visits]').forEach(root=>{
    const lang=document.documentElement.lang==='en'?'en':'lv',t=copy[lang];
    const control=document.getElementById(root.dataset.periodControl||'period');
    const selected=control?.value||'all';
    const period=selected==='0'?'all':/^\d+$/.test(selected)?selected+'d':selected;
    const site=root.dataset.rgVisits==='site';
    const ids=site?Object.keys(VISIT_PAGES):root.dataset.rgVisits==='all'?Object.keys(VISIT_PAGES).filter(id=>id!=='landing'):[root.dataset.rgVisits];
    const title=site?t.siteTitle:t.title;
    root.setAttribute('aria-label',title);
    root.replaceChildren();
    const append=(tag,text,parent=root)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
    append('h2',title);
    let cards=append('div','');cards.className='rg-visits-cards';
    for(const id of ids){
      if(site && id!=='landing' && ids.indexOf(id)===1){append('h2',t.gameTitle);cards=append('div','');cards.className='rg-visits-cards';}
      const entry=model?.periods[period]?.[id];
      const card=append('article','',cards);
      append('h3',names[lang][id],card);
      if(id==='landing')card.className='rg-visits-landing';
      append('strong',entry?new Intl.NumberFormat(lang).format(entry.visits):'–',card);
      if(!entry) append('p',t.unavailable,card);
      else {
        const date=value=>new Intl.DateTimeFormat(lang==='lv'?'lv-LV':'en-GB',{timeZone:'Europe/Riga',dateStyle:'short',timeStyle:'short'}).format(new Date(value));
        if(entry.failed||Date.now()-Date.parse(entry.fetchedAt)>20*60000) append('p',t.saved,card);
        append('p',t.updated+': '+date(entry.fetchedAt),card);
        if(period!=='all') append('p',t.range+': '+date(entry.start)+' – '+date(entry.end),card);
      }
      if(id==='landing')append('p',t.landingNote,card);
      if(id==='cell-intro')append('p',t.cellNote,card);
      if(id==='miklu-rezgis')append('p',t.riddle,card);
    }
    if(ids.length>1) append('p',t.overview);
    if(ids.length===1) append('p',t.scope);
    append('p',t.note);
  });
}
function remember(incoming){
  model=mergeVisits(model,incoming);
  try{localStorage.setItem(KEY,JSON.stringify(model));}catch{}
}
async function refresh(){
  if(document.hidden)return;
  let failed=false;
  const url=new URL(SNAPSHOT_URL);url.searchParams.set('t',String(Date.now()));
  try{const r=await fetch(url,{signal:AbortSignal.timeout(10000),cache:'no-store'});if(!r.ok)throw new Error();remember(normalizeVisits(await r.json()));}
  catch{failed=true;}
  if(failed||VISIT_PERIODS.some(period=>Object.keys(VISIT_PAGES).some(id=>!model?.periods[period]?.[id]))){try{const r=await fetch(new URL('./visits.json',import.meta.url),{signal:AbortSignal.timeout(3000)});if(r.ok)remember(normalizeVisits(await r.json()));}catch{}}
  renderVisits();
}
document.addEventListener('change',event=>{if(event.target.matches('select'))renderVisits();});
// Overview switches language without reloading the page.
new MutationObserver(renderVisits).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
document.addEventListener('visibilitychange',refresh);
setInterval(refresh,300000);
renderVisits();refresh();
