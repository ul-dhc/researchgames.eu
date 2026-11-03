import {PLANT_GAMES,normalizePlants,selectPlants} from './latgalian-model.js';
import {buildTimelineSeries,renderTimeline} from './timeline.js?v=20261103-visits-1';
const copy={
 lv:{title:'Latgaliešu spēles',intro:'Augu nosaukumu spēļu sērija. Šobrīd: Muns teirums.',home:'Visi dashboardi',skip:'Pāriet uz saturu',period:'Periods',all:'Viss periods',month:'Pēdējās 30 dienas',week:'Pēdējās 7 dienas',refresh:'Atjaunot',loading:'Atjauno…',textSize:'Teksta izmērs',sizeNormal:'Parasts',sizeMedium:'Palielināts',sizeLarge:'Liels',lightTheme:'Pārslēgt uz gaišo režīmu',darkTheme:'Pārslēgt uz tumšo režīmu',navVisits:'Apmeklējumi',navGameplay:'Spēlēšana',navBreakdown:'Izmēri un režīmi',navData:'Par datiem',visitsIntro:'Spēles lapas apmeklējumi, neatkarīgi no spēles uzsākšanas.',gameplayIntro:'Sāktās, pabeigtās un izlaistās spēles.',game:'Spēle',allGames:'Visas sērijas spēles',pairs:'Augu pāri',allSizes:'Visi izmēri',mode:'Režīms',allModes:'Visi režīmi',timePoints:'Laiks un punkti',timeOnly:'Tikai laiks',pointsOnly:'Tikai punkti',relaxed:'Bez laika un punktiem',start:'Sāktās spēles',complete:'Pabeigtās spēles',skipAction:'Izlaistās spēles',startNote:'Pirmā atvērtā kārts',completeNote:'Atrasti visi augu pāri',skipNote:'Pāreja uz augu galeriju',timeline:'Spēlēšana pa dienām',timelineNote:'Notikumi reģistrēti to norises dienā.',breakdownIntro:'Izvēlētā perioda un filtru dati. Režīmi netiek sajaukti vienā punktu vidējā.',series:'Latgaliešu augu nosaukumu sērija',description:'Atmiņas spēle: savieno augu attēlus ar to nosaukumiem latgaliski. 37 augu kopums, 6, 8 vai 10 pāru spēles.',openGame:'Atvērt spēli',dataIntro:'Ko uzskaitām un kā lasīt rezultātus.',method:'Uzskaites robežas',
methodText:'Spēlēšanas uzskaite ieviesta 2026. gada 3. novembrī; iepriekšējās izspēles nav atjaunojamas. Sākums ir pirmā atvērtā kārts. Pabeigšana ir pēdējais atrastais pāris. Izlaišana ir pogas “Izlaist spēli” izmantošana, arī bez iepriekš atvērtas kārts. Lapas apmeklējumi ir atsevišķs rādītājs, un spēlēšanas filtri tos nemaina.',
limits:'Notikumi ir apkopoti skaitītāji, nevis unikāli cilvēki vai savstarpēji sasaistītas sesijas. Pabeigšana var būt citā dienā nekā sākums; tāpēc nerēķinām pabeigšanas procentu vai nepabeigtās spēles kā starpību. Punkti, ilgums un atsevišķu augu kļūdas šajā uzskaitē netiek vākti. Bloķēta analītika vai pārtraukts savienojums var samazināt skaitu.',
privacy:'Dashboard saņem tikai apkopotus notikumu skaitus pa dienām, spēles izmēriem un režīmiem. Spēlētāju identifikatori, atbildes un brīvais teksts netiek pievienoti. Datumi seko GoatCounter dienu grupējumam. Šodienas dati vēl papildinās.',audienceTitle:'Vietnes auditorija',audienceIntro:'Valstis, valodas un ekrāni visām spēlēm un sākumlapai kopā.',footer:'Apkopoti dati no GoatCounter. Automātiska atjaunošana ik pēc 5 minūtēm.',unavailable:'Spēlēšanas dati vēl nav pieejami. Uzskaite sākas ar šīs versijas publicēšanu.',empty:'Izvēlētajā periodā un filtros vēl nav reģistrētu spēlēšanas notikumu.',updated:'Dati atjaunoti',saved:'Saglabātie dati; gaida atjaunošanu.',startedShort:'Sāktas',completedShort:'Pabeigtas',skippedShort:'Izlaistas'},
 en:{title:'Latgalian games',intro:'The plant-name game series. Currently: Muns teirums.',home:'All dashboards',skip:'Skip to content',period:'Period',all:'All time',month:'Last 30 days',week:'Last 7 days',refresh:'Refresh',loading:'Refreshing…',textSize:'Text size',sizeNormal:'Normal',sizeMedium:'Enlarged',sizeLarge:'Large',lightTheme:'Switch to light theme',darkTheme:'Switch to dark theme',navVisits:'Page visits',navGameplay:'Gameplay',navBreakdown:'Sizes and modes',navData:'About the data',visitsIntro:'Game-page visits, whether or not a game is started.',gameplayIntro:'Games started, completed and skipped.',game:'Game',allGames:'All games in the series',pairs:'Plant pairs',allSizes:'All sizes',mode:'Mode',allModes:'All modes',timePoints:'Time and points',timeOnly:'Time only',pointsOnly:'Points only',relaxed:'Without time or points',start:'Games started',complete:'Games completed',skipAction:'Games skipped',startNote:'First card turned over',completeNote:'All plant pairs matched',skipNote:'Skip to the plant gallery',timeline:'Gameplay by day',timelineNote:'Events counted on the day they occur.',breakdownIntro:'Selected period and filters. Scores from different modes are not averaged together.',series:'Latgalian plant-name series',description:'A memory game: match plants with their Latgalian names. A collection of 37 plants, with 6, 8 or 10 pairs per game.',openGame:'Open game',dataIntro:'What is counted and how to read the results.',method:'Coverage and definitions',
methodText:'Gameplay tracking was introduced on 3 November 2026; earlier games cannot be recovered. A start is the first card turned over. Completion is the final pair matched. A skip is use of the skip-game button, including before any card is turned over. Page visits are separate and are unaffected by gameplay filters.',
limits:'Events are aggregate counters, not unique people or linked sessions. A game may finish on a different day from its start, so we do not calculate a completion rate or unfinished games by subtraction. Scores, durations and individual plant mistakes are not collected. Blocked analytics or connection failures can reduce counts.',
privacy:'The dashboard receives only aggregate daily event counts by game size and mode. No player identifiers, answers or free text are added. Dates follow GoatCounter’s daily grouping. Today is still in progress.',audienceTitle:'Website audience',audienceIntro:'Countries, languages and screens across all games and the landing page.',footer:'Aggregated GoatCounter data. Automatically refreshed every 5 minutes.',unavailable:'Gameplay data is not yet available. Tracking begins when this version is published.',empty:'No gameplay events recorded for the selected period and filters yet.',updated:'Data updated',saved:'Saved data; awaiting an update.',startedShort:'Started',completedShort:'Completed',skippedShort:'Skipped'}
};
let language=new URLSearchParams(location.search).get('lang')==='en'?'en':'lv',model,loading=false;
const $=id=>document.getElementById(id),t=key=>copy[language][key];
const number=value=>value===null?'–':new Intl.NumberFormat(language==='lv'?'lv-LV':'en-GB').format(value);
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

function render(){
 document.documentElement.lang=language;document.title=`${t('title')} – ResearchGames.eu`;
 document.querySelectorAll('[data-text]').forEach(el=>el.textContent=t(el.dataset.text));
 document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===language)));
 $('home').href='/stats/?lang='+language;$('audience-link').href='/stats/audience.html?lang='+language;
 document.querySelector('.brand').href=language==='lv'?'/lv/':'/';
 updateThemeButton();updateTextSizeControl();
 $('totals').setAttribute('aria-label',language==='lv'?'Kopsavilkums':'Summary');
 $('section-links').setAttribute('aria-label',language==='lv'?'Pārskata sadaļas':'Report sections');
 $('refresh').disabled=loading;$('refresh').textContent=t(loading?'loading':'refresh');
 const entry=model?.periods[$('period').value];
 const filters={game:$('plant-game').value,pairs:$('plant-pairs').value,mode:$('plant-mode').value};
 const selected=selectPlants(entry,filters);
 const actions=['start','complete','skip'];
 $('totals').innerHTML=actions.map((action,i)=>`<article class="metric"><p>${t(action==='skip'?'skipAction':action)}</p><strong>${number(selected?.counts[action]??null)}</strong><small>${t(['startNote','completeNote','skipNote'][i])}</small></article>`).join('');
 const date=value=>new Intl.DateTimeFormat(language==='lv'?'lv-LV':'en-GB',{timeZone:'Europe/Riga',dateStyle:'short',timeStyle:'short'}).format(new Date(value));
 $('coverage').textContent=entry?`${entry.failed||Date.now()-Date.parse(entry.fetchedAt)>20*60000?t('saved')+' ':''}${t('updated')}: ${date(entry.fetchedAt)}. ${actions.every(a=>!selected.counts[a])?t('empty'):''}`:t('unavailable');
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Riga'}).format(new Date());
 renderTimeline($('timeline'),buildTimelineSeries(actions.map(action=>({name:t(action==='skip'?'skipAction':action),timeline:selected?.timeline[action]})),$('period').value,today),language);
 const table=(title,rows)=>`<div class="panel"><h3>${title}</h3><div class="table-scroll"><table><thead><tr><th scope="col">${title}</th><th scope="col">${t('startedShort')}</th><th scope="col">${t('completedShort')}</th><th scope="col">${t('skippedShort')}</th></tr></thead><tbody>${rows.map(([label,counts])=>`<tr><th scope="row">${label}</th>${actions.map(action=>`<td>${number(counts?.[action]??null)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
 $('breakdown-tables').innerHTML=table(t('pairs'),[6,8,10].filter(p=>filters.pairs==='all'||p===Number(filters.pairs)).map(p=>[p,selectPlants(entry,{...filters,pairs:String(p)})?.counts]))+table(t('mode'),[['time-points','timePoints'],['time-unscored','timeOnly'],['untimed-points','pointsOnly'],['untimed-unscored','relaxed']].filter(([mode])=>filters.mode==='all'||mode===filters.mode).map(([mode,label])=>[t(label),selectPlants(entry,{...filters,mode})?.counts]));
}
function accept(raw){const incoming=normalizePlants(raw);if(!model){model=incoming;return;}for(const [period,entry]of Object.entries(incoming.periods)){if(!model.periods[period]||Date.parse(entry.fetchedAt)>=Date.parse(model.periods[period].fetchedAt))model.periods[period]=entry;}}
async function load(){
 if(loading)return;loading=true;render();
 const paths=['https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/latgalian.json?t='+Date.now(),new URL('./latgalian.json',import.meta.url)];
 await Promise.allSettled(paths.map(async url=>{const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();accept(await response.json());render();}));
 loading=false;render();
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

document.querySelectorAll('select').forEach(el=>el.addEventListener('change',render));
$('refresh').addEventListener('click',load);
document.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>{language=el.dataset.lang;const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);render();}));
$('theme').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('researchgames-theme',theme);}catch{}updateThemeButton();});
setInterval(()=>{if(!document.hidden)load();},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
render();load();
