// Three visual previews only. No route entry, inspection or saved journey state.
export function createCellBranches({scene,$,holdScene}){
 const host=$('cell-branches');
 const cells={plant:['Plant cell','Onion bulb epidermis'],human:['Human cheek cell','From the lining inside your cheek'],bacterial:['Bacterial cell','Escherichia coli']};
 const art=(key,w)=>`assets/${key==='plant'?'onion-cell-detailed-cutout':'cell-'+key+'-alpha'}-${w}.webp`;
 host.innerHTML=`<div id="cell-choices">${Object.entries(cells).map(([key,[title,subtitle]])=>`<article class="cell-choice preview-cell" data-cell="${key}" aria-labelledby="choice-title-${key}" aria-describedby="development-${key}"><img data-card="${key}" alt="" width="1536" height="1024" decoding="async"><span class="choice-copy"><strong id="choice-title-${key}">${title}${key==='bacterial'?' <small>(E. coli)</small>':''}</strong><span>${subtitle}</span><span class="choice-status" id="development-${key}">In development</span></span></article>`).join('')}</div>`;
 let warm=false;
 function loadCards(){if(warm)return;warm=true;for(const img of host.querySelectorAll('[data-card]')){const key=img.dataset.card;img.sizes='(max-width:650px) 36vw, 30vw';img.srcset=[480,960,1536].map(w=>`${art(key,w)} ${w}w`).join(', ');img.src=art(key,960);img.fetchPriority='low';}}
 return {facts:{},open(){},beforePhase(){},plantReward(){},guide(){return '';},pause(){},reduceMotion(){},isInspection(){return false;},isCustom:key=>key==='chooser',warmCards:loadCards,
 navigate(phase,direction){if(phase!=='chooser')return false;if(direction<0)holdScene('people');return true;},
 render(phase){const visible=phase==='chooser';host.hidden=!visible;host.inert=!visible;scene.dataset.cellBranch=visible?'chooser':'plant-lesson';if(visible){loadCards();$('guide-toggle').hidden=true;$('nucleus-model').hidden=true;$('nucleus-model').inert=true;}}
 };
}
