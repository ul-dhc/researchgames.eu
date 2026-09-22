import { SOURCES } from './config.js?v=20260922-1';
import { fetchSummary, combineSummaries } from './data.js?v=20260922-1';
const copy = {
 lv: {
  skip:'Pāriet uz saturu',home:'Uz sākumlapu',theme:'Gaišs / tumšs',title:'Spēļu analītika',intro:'Kopējais pārskats un katras spēles dati vienuviet.',period:'Periods',all:'Viss periods',month:'Pēdējās 30 dienas',week:'Pēdējās 7 dienas',refresh:'Atjaunot',activity:'Aktivitāte',timeline:'Reģistrētās sesijas pa dienām',activeDays:'Attēlotas dienas ar aktivitāti pievienotajos datos.',details:'Detalizētie dati',games:'Spēļu pārskati',existing:'Atver katras spēles esošo dashboard.',method:'Kā lasīt šo pārskatu',methodText:'Kopsummās iekļautas tikai spēles ar pieejamiem datiem. Sesijas nav unikālie spēlētāji. Spēlēs atšķiras sesijas sākuma un pabeigšanas uzskaite, tāpēc pabeigšanas īpatsvars rādīts katrai spēlei atsevišķi. Datumi un periodi pārņemti no katras spēles esošās uzskaites. Punkti netiek summēti vai vidējoti starp spēlēm.',footer:'Apkopoti spēlēšanas dati. Detalizētie pārskati saglabā savu pašreizējo piekļuvi.',sessions:'Reģistrētās sesijas',completed:'Pabeigtās spēles',connected:'Spēles ar datiem',totalNote:'Pieejamo spēļu summa',coverageNote:'Šajā pārskatā iekļautās spēles',loading:'Ielādē datus…',partial:'Daļējs pārskats',complete:'Visu spēļu pārskats',coverage:'Dati pieejami {n} no {total} spēlēm. Kopsummās: {names}.',none:'Pašlaik kopsavilkuma dati nav pieejami. Spēļu detalizētos pārskatus var atvērt zemāk.',open:'Atvērt spēles dashboard',live:'Dati pieejami',pending:'Dati vēl nav pieslēgti',error:'Datus neizdevās ielādēt',pendingNote:'Šīs spēles dati vēl nav iekļauti kopsummās. Tie apskatāmi esošajā dashboardā.',errorNote:'Šīs spēles dati nav iekļauti pašreizējā pārskatā. Mēģini atjaunot datus vai atver spēles dashboard.',completion:'Pabeigšanas īpatsvars',duration:'Vidējais ilgums',rating:'Vērtējums',updated:'Dati atjaunoti',empty:'Izvēlētajā periodā pievienotajās spēlēs nav reģistrētu sesiju.',noTimeline:'Aktivitātes grafiks būs redzams, kad būs pieejami dati.',durationNote:'Vidējais ilgums aprēķināts pabeigtajām spēlēm.',lu:'LU 107. jubilejas spēle',luDescription:'Jautājumi, kārtas un Latvijas Universitātes atklāšana.',riddle:'Mīklu režģis',riddleDescription:'Mīklas, minējumi un valodas izzināšana.',liv:'Lībiešu vietvārdi',livDescription:'Vietvārdi, kartes un lībiešu kultūrtelpa.',luNote:'Sesija tiek reģistrēta, sākot spēli.',riddleNote:'Sesija tiek reģistrēta pēc pirmās pabeigtās vai izlaistās mīklas.',livNote:'Spēlēšanas sesijas un pabeigtās kārtas.',included:'Iekļauts',outOf:'no'
 },
 en: {
  skip:'Skip to content',home:'Back to home',theme:'Light / dark',title:'Game analytics',intro:'An overview of activity and individual game insights in one place.',period:'Period',all:'All time',month:'Last 30 days',week:'Last 7 days',refresh:'Refresh',activity:'Activity',timeline:'Recorded sessions by day',activeDays:'Shows days with activity in the connected data.',details:'Explore the data',games:'Game dashboards',existing:'Open each game’s existing dashboard.',method:'How to read this overview',methodText:'Totals include only games with available data. Sessions are not unique players. Games record session starts and completion differently, so completion rates are shown separately for each game. Dates and periods follow each game’s existing reporting rules. Scores are not added or averaged across games.',footer:'Aggregated gameplay data. Detailed dashboards retain their existing access settings.',sessions:'Recorded sessions',completed:'Completed games',connected:'Games with data',totalNote:'Sum across available games',coverageNote:'Games included in this overview',loading:'Loading data…',partial:'Partial overview',complete:'All games overview',coverage:'Data available for {n} of {total} games. Totals include: {names}.',none:'Summary data is currently unavailable. You can open the individual game dashboards below.',open:'Open game dashboard',live:'Data available',pending:'Data not yet connected',error:'Could not load data',pendingNote:'This game is not yet included in the totals. Its data is available in the existing dashboard.',errorNote:'This game is not included in the current overview. Refresh the data or open the game dashboard.',completion:'Completion rate',duration:'Average duration',rating:'Rating',updated:'Data updated',empty:'No recorded sessions in the connected games for this period.',noTimeline:'Activity will appear when data is available.',durationNote:'Average duration is calculated for completed games.',lu:'UL 107th anniversary game',luDescription:'Questions, rounds and discoveries at the University of Latvia.',riddle:'Riddle Grid',riddleDescription:'Riddles, guesses and language exploration.',liv:'Livonian place names',livDescription:'Place names, maps and Livonian cultural heritage.',luNote:'A session is recorded when the game starts.',riddleNote:'A session is recorded after the first completed or skipped riddle.',livNote:'Gameplay sessions and completed rounds.',included:'Included',outOf:'of'
 }
};
const games = [
 {id:'lu107',name:'lu',description:'luDescription',note:'luNote',url:'/games/LU107/stats/'},
 {id:'miklu-rezgis',name:'riddle',description:'riddleDescription',note:'riddleNote',url:SOURCES['miklu-rezgis']},
 {id:'libiesu-vietvardi',name:'liv',description:'livDescription',note:'livNote',url:SOURCES['libiesu-vietvardi']}
];
let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'lv';
let state = new Map(), loading = false, controller;
const $ = id => document.getElementById(id);
const t = key => copy[language][key];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (n, digits = 0) => n === null ? '–' : new Intl.NumberFormat(language === 'lv' ? 'lv-LV' : 'en-GB', {maximumFractionDigits:digits}).format(n);
function render() {
 document.documentElement.lang = language;
 document.title = `ResearchGames – ${t('title')}`;
 document.querySelectorAll('[data-text]').forEach(el => {el.textContent = t(el.dataset.text);});
 document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === language)));
 $('home').href = language === 'lv' ? '/lv/' : '/';
 document.querySelector('.brand').href = $('home').href;
 document.querySelector('nav').setAttribute('aria-label', language === 'lv' ? 'Navigācija' : 'Navigation');
 $('totals').setAttribute('aria-label', language === 'lv' ? 'Kopsavilkums' : 'Summary');
 $('refresh').disabled = loading;
 $('refresh').textContent = t(loading ? 'loading' : 'refresh');
 const available = games.filter(g => state.get(g.id)?.data);
 const combined = combineSummaries(available.map(g => state.get(g.id).data));
 $('coverage').textContent = loading ? t('loading') : available.length ? `${t(available.length === games.length ? 'complete' : 'partial')}. ${t('coverage').replace('{n}', available.length).replace('{total}', games.length).replace('{names}', available.map(g => t(g.name)).join(', '))}` : t('none');
 $('totals').innerHTML = [
  [t('sessions'), available.length ? number(combined.sessions) : '–',t('totalNote')],
  [t('completed'),available.length ? number(combined.completed) : '–',t('totalNote')],
  [t('connected'),loading ? '–' : `${available.length} / ${games.length}`,t('coverageNote')]
 ].map(([label,value,note]) => `<article class="metric"><p>${label}</p><strong>${value}</strong><small>${note}</small></article>`).join('');
 const activeDays = combined.timeline.filter(d => d.sessions > 0);
 const max = Math.max(1,...activeDays.map(d => d.sessions));
 $('timeline').innerHTML = activeDays.length ? `<div class="timeline-list">${activeDays.map(d => `<div class="day"><time datetime="${d.date}">${escape(d.date.slice(8)+'.'+d.date.slice(5,7)+'.'+d.date.slice(0,4))}</time><div class="track" aria-hidden="true"><div class="bar" style="width:${d.sessions/max*100}%"></div></div><strong>${number(d.sessions)}</strong></div>`).join('')}</div>` : `<p class="empty">${t(loading ? 'loading' : available.length ? 'empty' : 'noTimeline')}</p>`;
 $('games').innerHTML = games.map(g => {
  const entry = state.get(g.id), data = entry?.data, o = data?.overview;
  const status = data ? 'live' : loading && !entry ? 'loading' : entry?.error ? 'error' : 'pending';
  const metrics = o ? [[t('sessions'),number(o.sessions)],[t('completed'),number(o.completed)],[t('completion'),o.sessions ? `${number(o.completed/o.sessions*100,1)}%` : '–'],[t('duration'),o.completed && o.averageDurationMs !== null ? `${number(o.averageDurationMs/60000,1)} min` : '–']] : [];
  return `<article class="game"><span class="badge ${data ? 'live' : ''}">${t(status)}</span><h3>${t(g.name)}</h3><p class="game-description">${t(g.description)}</p>${o ? `<dl>${metrics.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="note">${t(g.note)} ${t('durationNote')}${o.ratingCount && o.averageRating !== null ? ` ${t('rating')}: ${number(o.averageRating,1)} / 5 (${number(o.ratingCount)}).` : ''}</p>${data.generatedAt ? `<p class="updated">${t('updated')}: ${escape(new Intl.DateTimeFormat(language === 'lv' ? 'lv-LV' : 'en-GB',{dateStyle:'short',timeStyle:'short'}).format(new Date(data.generatedAt)))}</p>` : ''}` : `<p class="note">${t(status === 'loading' ? 'loading' : status === 'error' ? 'errorNote' : 'pendingNote')}</p>`}<a class="open" href="${g.url}" aria-label="${escape(t('open')+' – '+t(g.name))}">${t('open')}</a></article>`;
 }).join('');
}
async function load() {
 controller?.abort();
 const current = new AbortController(); controller = current;
 state = new Map(); loading = true; render();
 const period = $('period').value;
 await Promise.all(games.map(async g => {
  const request = new AbortController();
  const cancel = () => request.abort();
  current.signal.addEventListener('abort',cancel,{once:true});
  const timeout = setTimeout(cancel,90000);
  try {
   const data = await fetchSummary(SOURCES[g.id],period,request.signal);
   if (current === controller) state.set(g.id,{data});
  } catch (error) {
   if (current === controller) console.warn('Summary unavailable:',g.id,error.message);
   if (current === controller) state.set(g.id,{error:true});
  } finally {
   clearTimeout(timeout);current.signal.removeEventListener('abort',cancel);
   if (current === controller) render();
  }
 }));
 if (current === controller) {loading=false;render();}
}
$('period').addEventListener('change',load);
$('refresh').addEventListener('click',load);
document.querySelectorAll('[data-lang]').forEach(el => el.addEventListener('click',()=>{
 language=el.dataset.lang;
 const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);render();
}));
$('theme').addEventListener('click',()=>{
 const theme=document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
 document.documentElement.dataset.theme=theme;
 try {localStorage.setItem('researchgames-theme',theme);}catch{}
});
load();
