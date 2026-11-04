import {renderFreshness} from './report-meta.js?v=20261104-tabs-1';
import {initReportTabs} from './overview-tabs.js?v=20261104-tabs-2';
import {formatTimestamp} from './time.js?v=20261104-riga-1';
import { buildTimelineSeries, renderTimeline } from './timeline.js?v=20261104-tabs-1';
import { SOURCES } from './config.js?v=20260922-1';
import { combineSummaries, fetchSummary } from './data.js?v=20260922-5';
import { normalizeSnapshot, snapshotState, mergeSnapshots, refreshStaleSources } from './snapshot.js?v=20260928-2';
const copy = {
 lv: {
  visitTotalsTitle:'Apmeklējumu kopsummas',tabGameplay:'Spēļu analītika',tabGameplayNote:'Sesijas un rezultāti',tabVisits:'Lapas apmeklējumi',tabVisitsNote:'Sākumlapa un spēļu lapas',visitDefinition:'Lapas atvēršana tiek uzskaitīta arī tad, ja spēle netiek sākta. Vienā apmeklējumā var izspēlēt vairākas spēles.',gameplayDefinition:'Reģistrētās izspēles un pabeigtās spēles. Vienā lapas apmeklējumā var būt vairākas izspēles; katrai spēlei ir sava sesijas sākuma definīcija.',selectedPeriod:'Izvēlētais periods',periodTotals:'Kopsummas visā periodā',sessionUnit:'Spēlēšanas sesijas',sessionReadout:'Sesijas',
  latgalianTitle:'Mums teirums',latgalianIntro:'Muns teirums: apmeklējumi, spēlēšana, izmēri un režīmi.',
  textSize:'Teksta izmērs',sizeNormal:'Parasts',sizeMedium:'Palielināts',sizeLarge:'Liels',
  audienceTitle:'Vietnes auditorija',audienceIntro:'Valstis, pārlūka valodas, ekrāni un tehnoloģijas — sākumlapai un visām aktīvajām spēlēm kopā.',
  navVisits:'Apmeklējumi',navGameplay:'Spēlēšana',navReports:'Spēļu pārskati',navData:'Par datiem',visitsIntro:'Cik bieži apmeklē ResearchGames.eu sākumlapu un katras spēles lapu.',gameplayIntro:'Reģistrētās sesijas, pabeigtās spēles un aktivitāte laika gaitā.',dataIntro:'Ko nozīmē rādītāji un kā salīdzināt spēļu datus.',
  refreshing:'Atjauno fonā…',cached:'Saglabātie dati',cacheFailed:'Dati gaida atjaunošanu',received:'Dati saņemti',cacheNotice:'Redzami arī iepriekš saglabātie dati; to laiks norādīts pie katras spēles.',skip:'Pāriet uz saturu',home:'Uz sākumlapu',lightTheme:'Pārslēgt uz gaišo režīmu',darkTheme:'Pārslēgt uz tumšo režīmu',title:'Spēļu analītika',intro:'Kopējais pārskats un katras spēles dati vienuviet.',period:'Periods',all:'Viss periods',month:'Pēdējās 30 dienas',week:'Pēdējās 7 dienas',refresh:'Atjaunot',activity:'Aktivitāte',timeline:'Reģistrētās sesijas pa dienām',activeDays:'Katra līnija ir viena spēle. Sesiju skaits pa dienām.',details:'Detalizētie dati',games:'Spēļu pārskati',existing:'Atver katras spēles esošo dashboard.',method:'Kā lasīt šo pārskatu',methodText:'Kopsummās iekļautas tikai spēles ar pieejamiem datiem. Sesijas nav unikālie spēlētāji. Spēlēs atšķiras sesijas sākuma un pabeigšanas uzskaite, tāpēc pabeigšanas īpatsvars rādīts katrai spēlei atsevišķi. Datumi un periodi pārņemti no katras spēles esošās uzskaites. Punkti netiek summēti vai vidējoti starp spēlēm.',footer:'Apkopoti lapu apmeklējumu un spēlēšanas dati. Laiki: Europe/Riga.',sessions:'Reģistrētās sesijas',completed:'Pabeigtās spēles',connected:'Spēles ar datiem',totalNote:'Pieejamo spēļu summa',coverageNote:'Šajā pārskatā iekļautās spēles',loading:'Ielādē datus…',partial:'Daļējs pārskats',complete:'Visu spēļu pārskats',coverage:'Dati pieejami {n} no {total} spēlēm. Kopsummās: {names}.',none:'Pašlaik kopsavilkuma dati nav pieejami. Spēļu detalizētos pārskatus var atvērt zemāk.',open:'Atvērt spēles dashboard',live:'Dati pieejami',pending:'Dati vēl nav pieslēgti',error:'Datus neizdevās ielādēt',pendingNote:'Šīs spēles dati vēl nav iekļauti kopsummās. Tie apskatāmi esošajā dashboardā.',errorNote:'Šīs spēles dati nav iekļauti pašreizējā pārskatā. Mēģini atjaunot datus vai atver spēles dashboard.',completion:'Pabeigšanas īpatsvars',duration:'Vidējais ilgums',rating:'Vērtējums',updated:'Dati atjaunoti',empty:'Izvēlētajā periodā pievienotajās spēlēs nav reģistrētu sesiju.',noTimeline:'Aktivitātes grafiks būs redzams, kad būs pieejami dati.',durationNote:'Vidējais ilgums aprēķināts pabeigtajām spēlēm.',lu:'LU 107. jubilejas spēle',luDescription:'Jautājumi, kārtas un Latvijas Universitātes atklāšana.',riddle:'Mīklu režģis',riddleDescription:'Mīklas, minējumi un valodas izzināšana.',liv:'Lībiešu vietvārdi',livDescription:'Vietvārdi, kartes un lībiešu kultūrtelpa.',luNote:'Sesija tiek reģistrēta, sākot spēli.',riddleNote:'Sesija tiek reģistrēta pēc pirmās pabeigtās vai izlaistās mīklas.',livNote:'Spēlēšanas sesijas un pabeigtās kārtas.',included:'Iekļauts',outOf:'no'
 },
 en: {
  visitTotalsTitle:'Visit totals',tabGameplay:'Game analytics',tabGameplayNote:'Sessions and results',tabVisits:'Page visits',tabVisitsNote:'Landing and game pages',visitDefinition:'A page visit can be recorded without starting a game. One visit can include several games.',gameplayDefinition:'Recorded play sessions and completed games. One page visit can include several sessions; each game defines when a session begins.',selectedPeriod:'Selected period',periodTotals:'Totals for the whole period',sessionUnit:'Gameplay sessions',sessionReadout:'Sessions',
  latgalianTitle:'Mums teirums',latgalianIntro:'Muns teirums: visits, gameplay, sizes and modes.',
  textSize:'Text size',sizeNormal:'Normal',sizeMedium:'Enlarged',sizeLarge:'Large',
  audienceTitle:'Website audience',audienceIntro:'Countries, browser languages, screens and technology across the landing page and all active games.',
  navVisits:'Page visits',navGameplay:'Gameplay',navReports:'Game dashboards',navData:'About the data',visitsIntro:'Visits to the ResearchGames.eu landing page and each game page.',gameplayIntro:'Recorded sessions, completed games and activity over time.',dataIntro:'What the metrics mean and how to compare game data.',
  refreshing:'Updating in background…',cached:'Saved data',cacheFailed:'Awaiting data update',received:'Data received',cacheNotice:'Previously saved data is also shown; its time is listed for each game.',skip:'Skip to content',home:'Back to home',lightTheme:'Switch to light theme',darkTheme:'Switch to dark theme',title:'Game analytics',intro:'An overview of activity and individual game insights in one place.',period:'Period',all:'All time',month:'Last 30 days',week:'Last 7 days',refresh:'Refresh',activity:'Activity',timeline:'Recorded sessions by day',activeDays:'One line per game. Recorded sessions per day.',details:'Explore the data',games:'Game dashboards',existing:'Open each game’s existing dashboard.',method:'How to read this overview',methodText:'Totals include only games with available data. Sessions are not unique players. Games record session starts and completion differently, so completion rates are shown separately for each game. Dates and periods follow each game’s existing reporting rules. Scores are not added or averaged across games.',footer:'Aggregated page visits and gameplay data. Times: Europe/Riga.',sessions:'Recorded sessions',completed:'Completed games',connected:'Games with data',totalNote:'Sum across available games',coverageNote:'Games included in this overview',loading:'Loading data…',partial:'Partial overview',complete:'All games overview',coverage:'Data available for {n} of {total} games. Totals include: {names}.',none:'Summary data is currently unavailable. You can open the individual game dashboards below.',open:'Open game dashboard',live:'Data available',pending:'Data not yet connected',error:'Could not load data',pendingNote:'This game is not yet included in the totals. Its data is available in the existing dashboard.',errorNote:'This game is not included in the current overview. Refresh the data or open the game dashboard.',completion:'Completion rate',duration:'Average duration',rating:'Rating',updated:'Data updated',empty:'No recorded sessions in the connected games for this period.',noTimeline:'Activity will appear when data is available.',durationNote:'Average duration is calculated for completed games.',lu:'UL 107th anniversary game',luDescription:'Questions, rounds and discoveries at the University of Latvia.',riddle:'Riddle Grid',riddleDescription:'Riddles, guesses and language exploration.',liv:'Livonian place names',livDescription:'Place names, maps and Livonian cultural heritage.',luNote:'A session is recorded when the game starts.',riddleNote:'A session is recorded after the first completed or skipped riddle.',livNote:'Gameplay sessions and completed rounds.',included:'Included',outOf:'of'
 }
};
const games = [
 {id:'lu107',name:'lu',description:'luDescription',note:'luNote',url:'/games/LU107/stats/'},
 {id:'miklu-rezgis',name:'riddle',description:'riddleDescription',note:'riddleNote',url:'/games/miklu-rezgis/stats/'},
 {id:'libiesu-vietvardi',name:'liv',description:'livDescription',note:'livNote',url:'/games/libiesu-vietvardi/stats/'}
];
let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'lv';
let state = new Map(), loading = false, controller,activeView="gameplay";
const $ = id => document.getElementById(id);
const t = key => copy[language][key];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (n, digits = 0) => n === null ? '–' : new Intl.NumberFormat(language === 'lv' ? 'lv-LV' : 'en-GB', {maximumFractionDigits:digits}).format(n);
function updateThemeButton() {
 const label = t(document.documentElement.dataset.theme === 'light' ? 'darkTheme' : 'lightTheme');
 $('theme').setAttribute('aria-label', label);
 $('theme').title = label;
}
function updateTextSizeControl(){
 const button=$('text-size-toggle');if(!button)return;
 const size=document.documentElement.dataset.textSize||'normal';
 document.querySelectorAll('input[name="text-size"]').forEach(input=>input.checked=input.value===size);
 const label=t('textSize')+': '+t({normal:'sizeNormal',medium:'sizeMedium',large:'sizeLarge'}[size]||'sizeNormal');
 button.setAttribute('aria-label',label);button.title=label;
}
function positionTextMenu(){
 const menu=$('text-size-menu');if(!menu?.matches(':popover-open'))return;
 const box=$('text-size-toggle').getBoundingClientRect(),inset=12;
 menu.style.left=Math.max(inset,Math.min(box.right-menu.offsetWidth,innerWidth-menu.offsetWidth-inset))+'px';
 menu.style.top=Math.max(inset,Math.min(box.bottom+8,innerHeight-menu.offsetHeight-inset))+'px';
}
function updateRefreshButton(){
 const busy=activeView==='visits'?document.querySelector('[data-rg-visit-timeline="site"]')?.dataset.loading==='true':loading;
 $('refresh').disabled=busy;$('refresh').textContent=t(busy?'refreshing':'refresh');
}
function render() {
 updateThemeButton();
 updateTextSizeControl();
 if(document.documentElement.lang!==language)document.documentElement.lang=language;
 document.title = `ResearchGames.eu – ${t('title')}`;
 document.querySelectorAll('[data-text]').forEach(el => {el.textContent = t(el.dataset.text);});
 document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === language)));
 if($('latgalian-link'))$('latgalian-link').href='/games/muns-teirums/stats/?lang='+language;
 $('audience-link').href = './audience.html?lang='+language;
 $('home').href = language === 'lv' ? '/lv/' : '/';
 document.querySelector('.brand').href = $('home').href;
 document.querySelector('nav').setAttribute('aria-label', language === 'lv' ? 'Navigācija' : 'Navigation');
 $('section-links').setAttribute('aria-label',language==='lv'?'Pārskata sadaļas':'Report sections');
 $('totals').setAttribute('aria-label', language === 'lv' ? 'Kopsavilkums' : 'Summary');
 updateRefreshButton();
 $('report-tabs').setAttribute('aria-label',language==='lv'?'Statistikas veids':'Report type');
 $('gameplay-period').textContent=t('selectedPeriod')+': '+t({all:'all','30d':'month','7d':'week'}[$('period').value])+' · '+t('periodTotals');
 const available = games.filter(g => state.get(g.id)?.data);
 const combined = combineSummaries(available.map(g => state.get(g.id).data));
 $('coverage').textContent = available.length ? `${t(available.length === games.length ? 'complete' : 'partial')}. ${t('coverage').replace('{n}', available.length).replace('{total}', games.length).replace('{names}', available.map(g => t(g.name)).join(', '))}` : t(loading ? 'loading' : 'none');
 if (games.some(g => state.get(g.id)?.cached)) $('coverage').textContent += ` ${t('cacheNotice')}`;
 if (loading && available.length) $('coverage').textContent += ` ${t('refreshing')}`;
 $('totals').innerHTML = [
  [t('sessions'), available.length ? number(combined.sessions) : '–',t('totalNote')],
  [t('completed'),available.length ? number(combined.completed) : '–',t('totalNote')],
  [t('connected'),`${available.length} / ${games.length}`,t('coverageNote')]
 ].map(([label,value,note]) => `<article class="metric"><p>${label}</p><strong>${value}</strong><small>${note}</small></article>`).join('');
 const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 renderTimeline($('timeline'), buildTimelineSeries(games.map(g => ({id:g.id,name:t(g.name),timeline:state.get(g.id)?.data?.timeline,throughDate:state.get(g.id)?.data?.generatedAt?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Riga'}).format(new Date(state.get(g.id).data.generatedAt)):undefined})), $('period').value, today), language,{unit:t('sessionReadout')});
 renderFreshness($('gameplay-freshness'),games.map(g=>({name:t(g.name),updatedAt:state.get(g.id)?.data?.generatedAt,stale:state.get(g.id)?.cached})),language,{loading});
 $('games').innerHTML = games.map(g => {
  const entry = state.get(g.id), data = entry?.data, o = data?.overview;
  const status = data ? (entry.error ? 'cacheFailed' : entry.cached ? 'cached' : 'live') : loading && !entry ? 'loading' : entry?.error ? 'error' : 'pending';
  const metrics = o ? [[t('sessions'),number(o.sessions)],[t('completed'),number(o.completed)],[t('completion'),o.sessions ? `${number(o.completed/o.sessions*100,1)}%` : '–'],[t('duration'),o.completed && o.averageDurationMs !== null ? `${number(o.averageDurationMs/60000,1)} min` : '–']] : [];
  return `<article class="game"><span class="badge ${data ? 'live' : ''}">${t(status)}</span><h3>${t(g.name)}</h3><p class="game-description">${t(g.description)}</p>${o ? `<dl>${metrics.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="note">${t(g.note)} ${t('durationNote')}${o.ratingCount && o.averageRating !== null ? ` ${t('rating')}: ${number(o.averageRating,1)} / 5 (${number(o.ratingCount)}).` : ''}</p>${entry.cached ? `<p class="updated">${t('received')}: ${escape(formatTimestamp(entry.savedAt,language))}</p>` : ''}${data.generatedAt ? `<p class="updated">${t('updated')}: ${escape(formatTimestamp(data.generatedAt,language))}</p>` : ''}` : `<p class="note">${t(status === 'loading' ? 'loading' : status === 'error' ? 'errorNote' : 'pendingNote')}</p>`}<a class="open" href="${g.url}" aria-label="${escape(t('open')+' – '+t(g.name))}">${t('open')}</a></article>`;
 }).join('');
}
let snapshot;
const snapshotKey = 'rg-overview-snapshot-v1';
const snapshotUrl = 'https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/stats.json';
try { snapshot = normalizeSnapshot(JSON.parse(localStorage.getItem(snapshotKey)), games.map(g=>g.id)); } catch {}
function applySnapshot() {
 state = snapshot ? snapshotState(snapshot, $('period').value) : new Map();
 if (!loading) games.forEach(g=>{if (!state.has(g.id)) state.set(g.id,{error:true});});
 render();
}
async function readSnapshot(url, signal) {
 const address=new URL(url,location.href);address.searchParams.set('t',String(Date.now()));
 const response = await fetch(address,{signal,cache:'no-store'});
 if (!response.ok) throw new Error(`Snapshot HTTP ${response.status}`);
 return normalizeSnapshot(await response.json(),games.map(g=>g.id));
}
function rememberSnapshot(incoming){
 snapshot=mergeSnapshots(snapshot,incoming);
 try{localStorage.setItem(snapshotKey,JSON.stringify(snapshot));}catch{}
}
async function load() {
 controller?.abort();
 const current=new AbortController();controller=current;
 loading=true;applySnapshot();
 // A cold visit gets the bundled snapshot promptly while the live request runs.
 // Merge by each source's generation time so a late fallback cannot roll data back.
 const fallback=async()=>{try{const backup=await readSnapshot('./snapshot.json',AbortSignal.any([current.signal,AbortSignal.timeout(3000)]));if(controller===current){rememberSnapshot(backup);applySnapshot();}}catch{}};
 const bootstrap=games.some(g=>!snapshot?.periods[$('period').value]?.[g.id])?fallback():null;
 try{
  const incoming=await readSnapshot(snapshotUrl,AbortSignal.any([current.signal,AbortSignal.timeout(10000)]));
  if(controller===current)rememberSnapshot(incoming);
 }catch{if(!bootstrap&&controller===current&&!current.signal.aborted)await fallback();}
 finally{
  if(bootstrap)await bootstrap;
  if(controller===current){
   applySnapshot();
   const recoveryTimeout=setTimeout(()=>current.abort(),45000);
   try{await refreshStaleSources(snapshot,$('period').value,SOURCES,fetchSummary,current.signal,incoming=>{if(controller!==current)return;rememberSnapshot(incoming);applySnapshot();});}
   finally{clearTimeout(recoveryTimeout);if(controller===current){loading=false;applySnapshot();}}
  }
 }
}
document.querySelectorAll('input[name="text-size"]').forEach(input=>input.addEventListener('change',()=>{
 if(!input.checked)return;
 document.documentElement.dataset.textSize=input.value;
 try{localStorage.setItem('rg-dashboard-text-size',input.value);}catch{}
 updateTextSizeControl();positionTextMenu();
}));
$('text-size-menu')?.addEventListener('toggle',event=>{
 const open=event.newState==='open';$('text-size-toggle').setAttribute('aria-expanded',String(open));
 if(open){positionTextMenu();$('text-size-menu').querySelector('input:checked')?.focus({preventScroll:true});}
});
window.addEventListener('resize',positionTextMenu);
window.addEventListener('scroll',()=>{const menu=$('text-size-menu');if(menu?.matches(':popover-open'))menu.hidePopover();},{passive:true});
$('period').addEventListener('change',load);
$('refresh').addEventListener('click',load);
setInterval(()=>{if (!document.hidden && !loading) load();},5*60000);
document.querySelectorAll('[data-lang]').forEach(el => el.addEventListener('click',()=>{
 language=el.dataset.lang;
 const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);render();
}));
$('theme').addEventListener('click',()=>{
 const theme=document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
 document.documentElement.dataset.theme=theme;
 updateThemeButton();
 try {localStorage.setItem('researchgames-theme',theme);}catch{}
});
document.addEventListener('rg-visits-state',updateRefreshButton);
initReportTabs($('report-tabs'),view=>{activeView=view;updateRefreshButton();});
load();
