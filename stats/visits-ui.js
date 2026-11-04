import {visitRefreshOutcome} from './visit-refresh-state.js?v=20261104-refresh-1';
import {renderFreshness} from './report-meta.js?v=20261104-tabs-1';
import {formatTimestamp} from './time.js?v=20261104-riga-1';
import {buildVisitTimeline} from './visit-timeline.js?v=20261103-latgalian-1';
import {renderTimeline} from './timeline.js?v=20261104-tabs-1';
import {normalizeVisits,mergeVisits,VISIT_PAGES,VISIT_PERIODS} from './visits.js?v=20261103-timeline-1';
const SNAPSHOT_URL='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/visits.json';
const KEY='rg-visits-v1';
let model,visitsLoading=false,lastVisitCheck=null;
try {model=normalizeVisits(JSON.parse(localStorage.getItem(KEY)));} catch {}
const names={lv:{'miklu-rezgis':'Mīklu režģis','libiesu-vietvardi':'Lībiešu vietvārdi','muns-teirums':'Muns teirums','cell-intro':'Pasaule šūnā',landing:'ResearchGames.eu sākumlapa'},en:{'miklu-rezgis':'Riddle Grid','libiesu-vietvardi':'Livonian place names','muns-teirums':'Muns teirums','cell-intro':'A world inside a cell',landing:'ResearchGames.eu landing page'}};
const copy={
  lv:{selectedPeriod:'Izvēlētais periods',all:'Viss periods',quarter:'Pēdējās 90 dienas',month:'Pēdējās 30 dienas',week:'Pēdējās 7 dienas',periodTotals:'Apmeklējumu kopsummas visā periodā',unit:'Apmeklējumi',timelineTitle:'Lapas apmeklējumi pa dienām',timelineIntro:'Kopā, sākumlapa un katra spēle. Datumi pēc Rīgas laika (Europe/Riga); šodienas dati vēl papildinās.',total:'Kopā',timelineUnavailable:'Dienu dati pašlaik nav pieejami. Kopsummas redzamas zemāk.',timelinePartial:'Kopējā līkne pieejama, kad ir dienu dati visām lapām.',siteTitle:'Lapas apmeklējumi',gameTitle:'Spēļu lapas',landingNote:'Sākumlapas apmeklējumi latviešu un angļu valodā kopā.',cellNote:'Šūnas spēles un priekšskatījuma lapas kopā.',title:'Spēles lapas apmeklējumi',unavailable:'Apmeklējumu dati pašlaik nav pieejami.',note:'Avots: GoatCounter. Apmeklējumi nav unikālie cilvēki vai spēlēšanas sesijas. Uzskaite aptver tikai periodu, kad lapā darbojas izsekošana.',scope:'Apmeklējumi attiecas uz visu spēles lapu; spēles un dalībnieku filtri tos nemaina.',saved:'Saglabātie dati; gaida atjaunošanu.',updated:'Atjaunots',range:'Datu periods',overview:'LU jubilejas spēle nav iekļauta.',riddle:'Iekļauta galvenā un bērnu spēles lapa.'},
  en:{selectedPeriod:'Selected period',all:'All time',quarter:'Last 90 days',month:'Last 30 days',week:'Last 7 days',periodTotals:'Visit totals for the whole period',unit:'Visits',timelineTitle:'Page visits by day',timelineIntro:'Total, landing page and each game. Dates use Riga time (Europe/Riga); today is still in progress.',total:'Total',timelineUnavailable:'Daily data are currently unavailable. Totals remain available below.',timelinePartial:'The total line is available when every page has daily data.',siteTitle:'Page visits',gameTitle:'Game pages',landingNote:'Combined visits to the Latvian and English landing pages.',cellNote:'Includes the cell game and preview pages.',title:'Game-page visits',unavailable:'Visit data is currently unavailable.',note:'Source: GoatCounter. Visits are not unique people or gameplay sessions. Only the period with tracking enabled is covered.',scope:'Visits cover the whole game page; game and participant filters do not change them.',saved:'Saved data; awaiting an update.',updated:'Updated',range:'Data period',overview:'The UL anniversary game is excluded.',riddle:'Includes the main game and children’s game pages.'}
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
    const headingLevel=root.dataset.headingLevel==='3'?3:2;
    const heading=append('h'+headingLevel,title);heading.className='rg-visits-heading';
    append('p',`${t.selectedPeriod}: ${t[{all:'all','90d':'quarter','30d':'month','7d':'week'}[period]]} · ${t.periodTotals}`).className='rg-visits-period';
    const check=append('p','');check.className='rg-visits-refresh-status';check.setAttribute('role','status');
    const checkCopy=lang==='lv'?{
      loading:'Pārbaudu jaunāko publicēto datu failu…',
      newer:'Saņemti jaunāki apmeklējumu dati.',
      unchanged:'Pārbaude pabeigta. Jaunāki apmeklējumu dati vēl nav publicēti.',
      failed:'Datu failu pašlaik neizdevās pārbaudīt. Redzami pēdējie saglabātie dati.',
      unavailable:'Apmeklējumu dati vēl nav pieejami.',
      explanation:'Poga pārlasa publicētos datus. Jaunu datu ievākšana notiek atsevišķi fonā; piecu minūšu grafiks var kavēties.'
    }:{
      loading:'Checking the latest published data file…',
      newer:'Newer page-visit data received.',
      unchanged:'Check complete. No newer page-visit data has been published yet.',
      failed:'Could not check the data file. Showing the last saved data.',
      unavailable:'Page-visit data is not available yet.',
      explanation:'Refresh reloads published data. Collection runs separately in the background; the five-minute schedule may be delayed.'
    };
    check.textContent=visitsLoading?checkCopy.loading:lastVisitCheck?`${checkCopy[lastVisitCheck.outcome]} ${lang==='lv'?'Pārbaudīts':'Checked'}: ${formatTimestamp(lastVisitCheck.at,lang)}.`:checkCopy.explanation;
    if(lastVisitCheck&&!visitsLoading&&lastVisitCheck.outcome!=='newer')append('p',checkCopy.explanation).className='rg-visits-refresh-note';
    let cards=append('div','');cards.className='rg-visits-cards';
    for(const id of ids){
      if(site && id!=='landing' && ids.indexOf(id)===1){const heading=append('h'+headingLevel,t.gameTitle);heading.className='rg-visits-heading';cards=append('div','');cards.className='rg-visits-cards';}
      const entry=model?.periods[period]?.[id];
      const card=append('article','',cards);
      const cardTitle=append('h'+(headingLevel+1),names[lang][id],card);cardTitle.className='rg-visits-card-title';
      if(id==='landing')card.className='rg-visits-landing';
      append('strong',entry?new Intl.NumberFormat(lang).format(entry.visits):'–',card);
      if(!entry) append('p',t.unavailable,card);
      else {
        const date=value=>formatTimestamp(value,lang);
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
  renderVisitTimelines();
}
function renderVisitTimelines(){
  document.querySelectorAll('[data-rg-visit-timeline]').forEach(root=>{
    const lang=document.documentElement.lang==='en'?'en':'lv',t=copy[lang];
    const selected=document.getElementById(root.dataset.periodControl||'period')?.value||'all';
    const period=selected==='0'?'all':/^\d+$/.test(selected)?selected+'d':selected;
    root.querySelector('#visit-timeline')?._timelineCleanup?.();
    root.replaceChildren();root.setAttribute('aria-label',t.timelineTitle);
    const unit=document.createElement('span');unit.className='metric-kind';unit.textContent=t.unit;root.append(unit);
    const heading=document.createElement(root.dataset.headingLevel==='2'?'h2':'h3');heading.textContent=t.timelineTitle;root.append(heading);
    const note=document.createElement('p');note.className='visit-timeline-note';note.textContent=root.dataset.rgVisitTimeline==='site'?t.timelineIntro:(lang==='lv'?'Spēles lapas apmeklējumi pa dienām. Šodienas dati vēl papildinās.':'Game-page visits by day. Today is still in progress.');root.append(note);
    const scope=document.createElement('p');scope.className='report-scope';scope.textContent=`${t.selectedPeriod}: ${t[{all:'all','90d':'quarter','30d':'month','7d':'week'}[period]]}`;root.append(scope);
    const metadata=document.createElement('div');root.append(metadata);
    const ids=root.dataset.rgVisitTimeline==='site'?Object.keys(VISIT_PAGES):[root.dataset.rgVisitTimeline];
    renderFreshness(metadata,ids.map(id=>({name:names[lang][id],updatedAt:model?.periods[period]?.[id]?.fetchedAt,stale:model?.periods[period]?.[id]?.failed||Date.now()-Date.parse(model?.periods[period]?.[id]?.fetchedAt)>20*60000})),lang,{loading:visitsLoading});
    const chart=document.createElement('div');chart.id='visit-timeline';root.append(chart);
    const entries=model?.periods[period]||{};
    const series=buildVisitTimeline(entries,period,names[lang],t.total,root.dataset.rgVisitTimeline==='site'?undefined:[root.dataset.rgVisitTimeline]);
    if(!series.dates.length){const empty=document.createElement('p');empty.className='empty';empty.textContent=t.timelineUnavailable;chart.append(empty);return;}
    renderTimeline(chart,series,lang,{unit:t.unit});
    chart.querySelector('svg')?.setAttribute('aria-label',lang==='lv'?'Diena lapas apmeklējumu grafikā':'Day on page-visits timeline');
    if(!series.games[0].values){const partial=document.createElement('p');partial.className='visit-timeline-note';partial.textContent=t.timelinePartial;root.append(partial);}
    if(Object.entries(entries).filter(([id])=>root.dataset.rgVisitTimeline==='site'||id===root.dataset.rgVisitTimeline).some(([,entry])=>entry.failed||Date.now()-Date.parse(entry.fetchedAt)>20*60000)){const saved=document.createElement('p');saved.className='visit-timeline-note';saved.textContent=t.saved;root.append(saved);}
  });
}
function remember(incoming){
  model=mergeVisits(model,incoming);
  try{localStorage.setItem(KEY,JSON.stringify(model));}catch{}
}
async function readFallback(){
  try{const response=await fetch(new URL('./visits.json',import.meta.url),{signal:AbortSignal.timeout(3000)});if(response.ok){remember(normalizeVisits(await response.json()));renderVisits();}}catch{}
}
async function refresh(){
  if(document.hidden||visitsLoading)return;
  const previous=model;
  visitsLoading=true;setVisitLoading();renderVisits();
  const needsHistory=document.querySelectorAll('[data-rg-visit-timeline]').length>0;
  const incomplete=()=>VISIT_PERIODS.some(period=>Object.keys(VISIT_PAGES).some(id=>!model?.periods[period]?.[id]||(needsHistory&&!Array.isArray(model?.periods[period]?.[id]?.timeline))));
  // Render bundled daily data immediately on a cold visit while the live snapshot loads.
  const initialFallback=needsHistory&&incomplete()?readFallback():null;
  let failed=false;
  const url=new URL(SNAPSHOT_URL);url.searchParams.set('t',String(Date.now()));
  try{const r=await fetch(url,{signal:AbortSignal.timeout(10000),cache:'no-store'});if(!r.ok)throw new Error();remember(normalizeVisits(await r.json()));}
  catch{failed=true;}
  if(failed||incomplete())await(initialFallback||readFallback());
  else if(initialFallback)await initialFallback;
  lastVisitCheck={at:new Date().toISOString(),outcome:visitRefreshOutcome(previous,model,failed)};
  visitsLoading=false;setVisitLoading();renderVisits();
}
function setVisitLoading(){
 document.querySelectorAll('[data-rg-visit-timeline]').forEach(root=>root.dataset.loading=String(visitsLoading));
 document.dispatchEvent?.(new Event('rg-visits-state'));
}
document.addEventListener('change',event=>{if(event.target.matches('select'))renderVisits();});
// Overview switches language without reloading the page.
new MutationObserver(renderVisits).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
document.addEventListener('visibilitychange',refresh);
document.getElementById('refresh')?.addEventListener('click',refresh);
setInterval(refresh,300000);
renderVisits();refresh();
