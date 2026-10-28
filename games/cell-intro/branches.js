import { cellFacts, DNA_INSTRUCTIONS } from './cell-facts.js?v=oct28-2';
/* Local checkpoint: cell choice, visual continuity and initial inspection only. */
export function createCellBranches(api){
 const {scene,$}=api,host=$('cell-branches');
 const custom=['chooser','plant','human','bacterial'],plantSteps=['onion','scales','skin','field','establish','invite','approach','boundary','inside','nucleolus','model','explore','assemble','dna-focus','gene','message','export','protein','roles'];
 const cells={
  plant:{title:'Plant cell',subtitle:'Onion bulb epidermis',copy:'A firm wall supports this cell. The large vacuole fills most of its interior.',facts:['wall','vacuole','nucleus','p-cytoplasm']},
  human:{title:'Human cheek cell',subtitle:'From the lining inside your cheek',copy:'A flexible boundary surrounds this flattened cell and its nucleus.',facts:['h-membrane','h-nucleus','h-mitochondria','h-cytoplasm']},
  bacterial:{title:'Bacterial cell',subtitle:'Escherichia coli',copy:'A rod-shaped cell with a nucleoid and many small ribosomes.',facts:['b-envelope','b-nucleoid','b-ribosomes','b-cytoplasm']}
 };
 const facts={
 'h-membrane':{name:'Cell membrane',text:'The flexible plasma membrane surrounds this human cell. It helps control which substances enter and leave. There is no plant cell wall.'},
 'h-nucleus':cellFacts.nucleus,
 'h-cytoplasm':cellFacts.cytoplasm,
 'b-cytoplasm':cellFacts.cytoplasm,
 'p-cytoplasm':cellFacts.cytoplasm,
 'h-mitochondria':{name:'Mitochondria',text:'Mitochondria are small structures that help the cell release usable energy from nutrients. Their inner membranes are folded.'},
 'b-envelope':{name:'Cell envelope',text:'E. coli has an inner membrane and an outer membrane, with a thin supporting wall between them. Together these layers form the cell envelope, which protects the cell and helps control what enters and leaves.'},
 'b-nucleoid':{name:'Nucleoid DNA',text:`E. coli has no nucleus. ${DNA_INSTRUCTIONS} Its DNA lies in an area called the nucleoid, with no membrane around it.`},
 'b-ribosomes':cellFacts.ribosomes
 };
 let current='idle',snapshot=null,completed=false,flight=[],flightVersion=0,warm=false,returnFocus='plant';
 const visited={plant:new Set(),human:new Set(),bacterial:new Set()};
 const art=(key,width=960)=>key==='plant'?`assets/onion-cell-detailed-cutout-${width}.webp`:`assets/cell-${key}-alpha-${width}.webp`;
 const srcset=key=>[480,960,1536].map(w=>`${art(key,w)} ${w}w`).join(', ');
 host.innerHTML=`<div id="cell-choices">${Object.entries(cells).map(([key,c])=>{
  const playable=key==='plant',tag=playable?'button':'article';
  return `<${tag} ${playable?'type="button"':'aria-disabled="true" tabindex="0"'} class="cell-choice${playable?'':' is-upcoming'}" data-cell="${key}" ${playable?'aria-label="Explore Plant cell · Playable now"':`aria-labelledby="choice-title-${key}" aria-describedby="upcoming-${key}"`}><img data-card="${key}" alt="" width="1536" height="1024" decoding="async"><span class="choice-copy"><strong id="choice-title-${key}">${c.title}${key==='bacterial'?' <small>(E. coli)</small>':''}</strong><span>${c.subtitle}</span><span class="choice-status" ${playable?'':`id="upcoming-${key}"`} data-status="${key}">${playable?'Playable now':'Upcoming'}</span></span></${tag}>`;
 }).join('')}</div>
 <div id="cell-inspection" hidden><div class="inspection-visual"><img id="inspection-art" alt="" width="1536" height="1024" decoding="async"><svg id="inspection-active-halo" viewBox="0 0 1000 666.667" aria-hidden="true" hidden><ellipse id="inspection-halo-region"/></svg><div id="inspection-hotspots"></div></div><div id="inspection-actions"><p id="inspection-hint">Select a structure to learn about it.</p><div id="inspection-labels"></div><p id="plant-origin-hint" hidden>Let’s see where this cell comes from, then follow its instructions at work.</p><button id="plant-visit" type="button" class="primary" hidden>Visit the onion specimen</button><p id="inspection-progress" aria-live="polite"></p></div></div>`;
 const image=$('inspection-art');
 function loadCards(){if(warm)return;warm=true;for(const img of host.querySelectorAll('[data-card]')){const key=img.dataset.card;img.sizes='(max-width:650px) 36vw, 30vw';img.srcset=srcset(key);img.src=art(key);img.fetchPriority='low';}}
 function stopFlight(){flightVersion++;for(const a of flight)a.cancel();flight=[];document.querySelectorAll('.cell-flight').forEach(n=>n.remove());image.style.visibility='';}
 function drawnRect(img){const r=img.getBoundingClientRect(),ratio=1.5,w=Math.min(r.width,r.height*ratio),h=w/ratio;return {left:r.left+(r.width-w)/2,top:r.top+(r.height-h)/2,width:w,height:h};}
 function open(key){
  if(!cells[key])return;if(key!=='plant'){$('status').textContent=cells[key].title+' journey is upcoming.';return;}
  api.beginSession();returnFocus='plant';stopFlight();visitPlant();
 }

 function returnToCells(){stopFlight();api.setPhase('chooser');api.revealFull();host.querySelector(`[data-cell="${returnFocus}"]`)?.focus({preventScroll:true});}
 function visitPlant(){if(snapshot){const saved=snapshot;api.holdScene(saved.phase);api.restoreSnapshot(saved);}else{api.enterPlant('onion');} }
 host.querySelectorAll('button[data-cell]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.cell)));
 $('return-cells').addEventListener('click',returnToCells);$('plant-visit').addEventListener('click',visitPlant);
 function inspect(key,button){const cell=current;visited[cell].add(key);api.openObjectInfo(key,button);renderProgress();}
 function renderProgress(){if(!cells[current])return;const count=visited[current].size;const t=count?`${count} of ${cells[current].facts.length} structures inspected`:'';if($('inspection-progress').textContent!==t)$('inspection-progress').textContent=t;}
 const points={
  plant:[[.35,.73],[.62,.43],[.14,.485],[.27,.32]],
  human:[[.87,.54],[.44,.47],[.65,.24],[.31,.69]],
  bacterial:[[.67,.18],[.51,.45],[.77,.35],[.28,.32]]
 };
 const regions={
  plant:[[.35,.73,.065,.035],[.62,.44,.23,.19],[.14,.485,.065,.09],[.27,.32,.07,.035]],
  human:[[.87,.54,.035,.055],[.44,.47,.14,.15],[.65,.24,.05,.05],[.31,.69,.075,.06]],
  bacterial:[[.67,.18,.065,.035],[.51,.45,.23,.12],[.77,.35,.055,.045],[.28,.32,.07,.04]]
 };
 function syncActive(){
  const key=api.activeInfo(),index=cells[current]?.facts.indexOf(key)??-1;
  host.querySelectorAll('[data-structure]').forEach(b=>{const active=b.dataset.structure===key;b.setAttribute('aria-pressed',String(active));b.dataset.active=String(active);});
  const halo=$('inspection-active-halo');halo.toggleAttribute('hidden',index<0);halo.style.display=index<0?'none':'';
  if(index>=0){const r=regions[current][index],ellipse=$('inspection-halo-region');ellipse.setAttribute('cx',r[0]*1000);ellipse.setAttribute('cy',r[1]*666.667);ellipse.setAttribute('rx',r[2]*1000);ellipse.setAttribute('ry',r[3]*666.667);const angle=(current==='human'&&key==='h-nucleus')?-25:(current==='bacterial'&&key==='b-nucleoid')?-18:0;ellipse.setAttribute('transform',`rotate(${angle} ${r[0]*1000} ${r[1]*666.667})`);}
 }
 function render(phase){
  const changed=current!==phase;current=phase;const isCustom=custom.includes(phase);host.hidden=!isCustom;host.inert=!isCustom;scene.dataset.cellBranch=isCustom?phase:'plant-lesson';
  if(!isCustom)return;
  $('guide-toggle').hidden=phase==='chooser';$('nucleus-model').hidden=true;$('nucleus-model').inert=true;
  if(!changed&&host.dataset.rendered===phase){renderProgress();syncActive();return;}
  host.dataset.rendered=phase;loadCards();$('cell-choices').hidden=phase!=='chooser';$('cell-inspection').hidden=phase==='chooser';
  if(phase==='chooser'){
   for(const [key,set]of Object.entries(visited))host.querySelector(`[data-status="${key}"]`).textContent=key==='plant'?(completed?'Plant visit complete':snapshot?'Plant visit in progress':'Playable now'):'Upcoming';
   return;
  }
  image.srcset=srcset(phase);image.sizes='(max-width:650px) 100vw, 70vw';image.src=art(phase,1536);image.alt=cells[phase].title+' scientific cutaway';
  $('inspection-labels').replaceChildren();$('inspection-hotspots').replaceChildren();
  cells[phase].facts.forEach((key,i)=>{
   const title=facts[key]?.name||{wall:'Cell wall',vacuole:'Vacuole',nucleus:'Nucleus'}[key];
   const b=document.createElement('button');b.type='button';b.textContent=title;b.className='quiet structure-label';b.dataset.structure=key;b.setAttribute('aria-controls','object-info');b.addEventListener('click',()=>inspect(key,b));$('inspection-labels').append(b);
   const dot=document.createElement('button');dot.type='button';dot.className='inspection-point';dot.dataset.structure=key;dot.style.left=points[phase][i][0]*100+'%';dot.style.top=points[phase][i][1]*100+'%';dot.setAttribute('aria-label','Inspect '+title);dot.setAttribute('aria-controls','object-info');dot.addEventListener('click',()=>inspect(key,dot));$('inspection-hotspots').append(dot);
  });
  $('plant-origin-hint').hidden=phase!=='plant'||Boolean(snapshot);$('plant-visit').hidden=phase!=='plant';$('plant-visit').textContent=snapshot?'Resume plant visit':'Visit the onion specimen';renderProgress();syncActive();
 }
 return {facts,open,render,warmCards:loadCards,isCustom:key=>custom.includes(key),isInspection:key=>['plant','human','bacterial'].includes(key),
 beforePhase(from,to){if(plantSteps.includes(from)&&custom.includes(to)){snapshot=api.getSnapshot();returnFocus='plant';}if(!custom.includes(to))stopFlight();},
 plantReward(value){if(value)completed=true;scene.dataset.plantComplete=String(completed);},
 navigate(phase,direction){if(phase==='chooser'){if(direction<0)api.holdScene('people');return true;}if(['plant','human','bacterial'].includes(phase)){if(direction<0)returnToCells();return true;}if(phase==='onion'&&direction<0){returnToCells();return true;}if(phase==='roles'&&direction>0)return true;return false;},
 guide(phase){return phase==='chooser'?'The plant cell is ready to explore. Human and bacterial cell journeys are upcoming.':cells[phase]?`Select a structure label or a small marker on the illustration to read about it. Return to cells keeps what you have inspected.${phase==='plant'?' Visit the onion specimen to follow the plant learning route.':''}`:'';},
 pause(value){for(const a of flight)value?a.pause():a.play();},reduceMotion(value){if(value)stopFlight();}
 };
}
