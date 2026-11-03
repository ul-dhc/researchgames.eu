import {AUDIENCE_DIMENSIONS,normalizeAudience,mergeAudience,distribution} from './audience.js?v=20261103-2';
const copy={
 lv:{skip:'Pāriet uz saturu',overview:'Spēļu analītika',title:'Vietnes auditorija',intro:'Sākumlapa un visas aktīvās spēles vienā kopīgā pārskatā.',period:'Periods',all:'Viss periods',quarter:'Pēdējās 90 dienas',month:'Pēdējās 30 dienas',week:'Pēdējās 7 dienas',refresh:'Atjaunot',refreshing:'Atjauno…',scope:'Kopā: researchgames.eu sākumlapa (LV un EN), Mīklu režģis ar bērnu spēli, Lībiešu vietvārdi, Muns teirums un Pasaule šūnā ar priekšskatījumu. LU jubilejas spēle un statistikas lapas nav iekļautas.',countries:'Valstis',languages:'Valodas',screens:'Ekrāni',technology:'Tehnoloģijas',countriesNote:'Aptuvenā atrašanās valsts pēc interneta savienojuma.',languagesNote:'Pārlūka paziņotā valoda. Tā nav spēlē izvēlētā vai cilvēka dzimtā valoda.',screensNote:'GoatCounter ekrāna platuma grupas. Platums nenosaka ierīces veidu.',technologyNote:'Pārlūku un operētājsistēmu sadalījums.',browsers:'Pārlūki',systems:'Operētājsistēmas',method:'Kā lasīt šos datus',methodText:'Šie ir atsevišķi apkopoti sadalījumi, nevis cilvēku profili vai unikālo cilvēku skaits. Procentus katrā sadaļā aprēķina no tās ierakstu summas, ieskaitot nezināmās vērtības. Sadaļu kopsummas var atšķirties, ja kādi dati nav ievākti. Dati pieejami tikai par laiku, kad uzskaite bija ieslēgta. Sadalījumus nevar savienot, lai noteiktu viena apmeklētāja valsti, valodu un ekrānu.',source:'Par GoatCounter datiem ↗',footer:'Avots: GoatCounter. Publicēti tikai apkopoti dati.',loading:'Ielādē apkopotos datus…',unavailable:'Dati pašlaik nav pieejami. Mēģini atjaunot vēlāk.',loaded:'Kopīgais auditorijas pārskats. Atjaunināšana notiek automātiski.',saved:'Redzami saglabātie dati; gaida atjaunošanu.',partial:'Daļa sadaļu gaida datus; pārējās paliek pieejamas.',empty:'Šajā periodā dati nav reģistrēti vai šī datu veida uzskaite nav ieslēgta.',unknown:'Nav zināms',label:'Sadalījums',count:'Skaits',share:'Īpatsvars',updated:'Atjaunots',range:'Datu periods',allRange:'Viss uzskaites periods līdz',more:'Pārējās vērtības',total:'Sadaļas ieraksti',countryMetric:'Valstis ar datiem',languageMetric:'Pārlūka valodas',knownScreens:'Zināms ekrāna platums',countryNote:'Valstis ar vismaz vienu ierakstu.',languageNote:'Pārlūka paziņotās valodas.',screenNote:'No ekrāna datu sadaļas ierakstiem.',light:'Pārslēgt uz gaišo režīmu',dark:'Pārslēgt uz tumšo režīmu',phone:'Līdz 600 px',tablet:'601–1000 px',desktop:'1001–1920 px',desktophd:'Virs 1920 px'},
 en:{skip:'Skip to content',overview:'Game analytics',title:'Website audience',intro:'The landing page and all active games in one shared report.',period:'Period',all:'All time',quarter:'Last 90 days',month:'Last 30 days',week:'Last 7 days',refresh:'Refresh',refreshing:'Updating…',scope:'Combined: the ResearchGames landing page (LV and EN), Riddle Grid including the children’s game, Livonian place names, Muns teirums, and the cell game including its preview. The UL anniversary game and analytics pages are excluded.',countries:'Countries',languages:'Languages',screens:'Screens',technology:'Technology',countriesNote:'Approximate country based on the internet connection.',languagesNote:'The language reported by the browser. This is not the language chosen in the game or the visitor’s native language.',screensNote:'GoatCounter screen-width groups. Width does not determine device type.',technologyNote:'Browser and operating system distributions.',browsers:'Browsers',systems:'Operating systems',method:'How to read these data',methodText:'These are separate aggregate distributions, not individual profiles or a count of unique people. Each section’s percentages use its own record total, including unknown values. Totals can differ if some data were not collected. Data cover only the period when tracking was enabled. The distributions cannot be joined to establish one visitor’s country, language and screen.',source:'About GoatCounter data ↗',footer:'Source: GoatCounter. Only aggregate data are published.',loading:'Loading aggregate data…',unavailable:'Data are currently unavailable. Please try again later.',loaded:'Shared audience report. Data refresh automatically.',saved:'Showing saved data; awaiting an update.',partial:'Some sections are awaiting data; the others remain available.',empty:'No data were recorded in this period, or collection of this category is disabled.',unknown:'Unknown',label:'Distribution',count:'Count',share:'Share',updated:'Updated',range:'Data period',allRange:'All recorded history through',more:'Remaining values',total:'Section records',countryMetric:'Countries with data',languageMetric:'Browser languages',knownScreens:'Known screen width',countryNote:'Countries with at least one record.',languageNote:'Languages reported by the browser.',screenNote:'Of records in the screen section.',light:'Switch to light theme',dark:'Switch to dark theme',phone:'Up to 600 px',tablet:'601–1000 px',desktop:'1001–1920 px',desktophd:'Over 1920 px'}
};
const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let language=new URLSearchParams(location.search).get('lang')==='en'?'en':'lv',snapshot,loading=false,networkFailed=false;
const t=key=>copy[language][key],locale=()=>language==='lv'?'lv-LV':'en-GB';
const number=(value,digits=0)=>new Intl.NumberFormat(locale(),{maximumFractionDigits:digits}).format(value);
const percent=value=>value>0&&value<.001?'<0,1%'.replace(',',language==='lv'?',':'.'):new Intl.NumberFormat(locale(),{style:'percent',maximumFractionDigits:1}).format(value);
const date=value=>new Intl.DateTimeFormat(locale(),{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Riga'}).format(new Date(value));
const unknown=row=>!row.key||['unknown','(unknown)','zz','xx','und'].includes(row.key.toLowerCase())||!row.name&&row.key==='unknown';
function label(row,dimension){
 if(unknown(row))return t('unknown');
 if(dimension==='sizes'&&copy[language][row.key])return t(row.key);
 if(dimension==='locations'||dimension==='languages'){
  try{
   const names=new Intl.DisplayNames([locale()],{type:dimension==='locations'?'region':'language',fallback:'none'});
   const key=dimension==='locations'?row.key.toUpperCase():row.key.toLowerCase();
   const translated=names.of(key);if(translated)return translated;
  }catch{}
 }
 return row.name||row.key;
}
function table(rows,dimension,caption){
 return `<table><caption>${escape(caption)}</caption><thead><tr><th scope="col">${t('label')}</th><th scope="col">${t('count')}</th><th scope="col">${t('share')}</th></tr></thead><tbody>${rows.map(row=>`<tr><td><span class="row-label">${escape(label(row,dimension))}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${(row.share*100).toFixed(3)}%"></span></span></td><td>${number(row.count)}</td><td>${escape(percent(row.share))}</td></tr>`).join('')}</tbody></table>`;
}
function panel(dimension,entry){
 if(!entry)return `<p class="empty">${t(loading?'loading':'unavailable')}</p>`;
 const rows=distribution(entry.rows),total=entry.rows.reduce((sum,row)=>sum+row.count,0);
 const range=$('period').value==='all'?`${t('allRange')} ${date(entry.end)}`:`${t('range')}: ${date(entry.start)} – ${date(entry.end)}`;
 const status=`<p class="category-status">${entry.failed?escape(t('saved'))+'<br>':''}${t('updated')}: ${date(entry.fetchedAt)}<br>${escape(range)}</p>`;
 if(!total)return status+`<p class="empty">${t('empty')}</p>`;
 const caption=`${t('total')}: ${number(total)}`;
 return status+table(rows.slice(0,10),dimension,caption)+(rows.length>10?`<details><summary>${t('more')} (${number(rows.length-10)})</summary>${table(rows.slice(10),dimension,caption)}</details>`:'');
}
function render(){
 document.documentElement.lang=language;document.title=`ResearchGames – ${t('title')}`;
 document.querySelectorAll('[data-text]').forEach(node=>node.textContent=t(node.dataset.text));
 document.querySelectorAll('[data-lang]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.lang===language)));
 $('overview').href='./?lang='+language;document.querySelector('footer a').href=$('overview').href;
 document.querySelector('.brand').href=language==='lv'?'/lv/':'/';
 $('section-links').setAttribute('aria-label',language==='lv'?'Pārskata sadaļas':'Report sections');
 document.querySelector('header nav').setAttribute('aria-label',language==='lv'?'Navigācija':'Navigation');
 $('totals').setAttribute('aria-label',language==='lv'?'Kopsavilkums':'Summary');
 $('theme').setAttribute('aria-label',t(document.documentElement.dataset.theme==='light'?'dark':'light'));
 $('refresh').disabled=loading;$('refresh').textContent=t(loading?'refreshing':'refresh');
 const data=snapshot?.periods[$('period').value]||{},entries=Object.values(data),available=entries.length;
 const stale=entries.some(entry=>entry.failed||Date.now()-Date.parse(entry.fetchedAt)>30*60000);
 $('status').textContent=t(loading&&!available?'loading':!available?'unavailable':networkFailed||stale?'saved':available<AUDIENCE_DIMENSIONS.length?'partial':'loaded');
 const distinct=dimension=>data[dimension]?number(data[dimension].rows.filter(row=>row.count>0&&!unknown(row)).length):'–';
 const sizes=data.sizes?.rows,total=sizes?.reduce((sum,row)=>sum+row.count,0),known=sizes?.filter(row=>!unknown(row)).reduce((sum,row)=>sum+row.count,0);
 $('totals').innerHTML=[[t('countryMetric'),distinct('locations'),t('countryNote')],[t('languageMetric'),distinct('languages'),t('languageNote')],[t('knownScreens'),total?percent(known/total):'–',t('screenNote')]].map(([name,value,note])=>`<article class="metric"><p>${name}</p><strong>${escape(value)}</strong><small>${escape(note)}</small></article>`).join('');
 for(const dimension of AUDIENCE_DIMENSIONS)$(dimension+'-panel').innerHTML=panel(dimension,data[dimension]);
}
const cacheKey='rg-audience-v1',snapshotUrl='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/audience.json';
try{snapshot=normalizeAudience(JSON.parse(localStorage.getItem(cacheKey)));}catch{}
async function receive(url){
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Audience unavailable');
 const incoming=normalizeAudience(await response.json());snapshot=mergeAudience(snapshot,incoming);
 try{localStorage.setItem(cacheKey,JSON.stringify(snapshot));}catch{}
 render();
}
async function refresh(){
 if(loading)return;loading=true;networkFailed=false;render();
 const url=new URL(snapshotUrl);url.searchParams.set('t',String(Date.now()));
 const results=await Promise.allSettled([receive('./audience.json'),receive(url.href)]);
 networkFailed=results[1].status==='rejected';loading=false;render();
}
$('period').addEventListener('change',render);
$('refresh').addEventListener('click',refresh);
$('theme').addEventListener('click',()=>{const root=document.documentElement;root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('researchgames-theme',root.dataset.theme);}catch{}render();});
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.lang;const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);render();}));
render();refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);
