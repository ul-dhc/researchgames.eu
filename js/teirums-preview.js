// Reuse the full game's plant data, deck randomization and matching state machine.
import { plants } from '/games/muns-teirums/plants.js';
import { sampleMeadow, makeDeck, createGame, selectCard, resolveMismatch } from '/games/muns-teirums/game-model.mjs';
const ids = ['matainais-abolins','plavas-plaukskene','tiruma-kosa','gailbiksite'];
const chosenNames = {'matainais-abolins':'kača pauteni','plavas-plaukskene':'cyuku zīpis','tiruma-kosa':'gegiele','gailbiksite':'gaiļa iuzys'};
const pool = ids.map(id => {
 const plant = plants.find(item => item.id === id);
 if (!plant) throw new Error(`Missing preview plant: ${id}`);
 return {...plant, cardName:chosenNames[id], image:`/games/muns-teirums/${plant.image}`};
});
for (const preview of document.querySelectorAll('[data-teirums-preview]')) {
 const lv = preview.dataset.locale === 'lv';
 const grid = preview.querySelector('.memory-grid');
 const status = preview.querySelector('[data-teirums-status]');
 const progress = preview.querySelector('[data-teirums-progress]');
 const gallery=document.createElement('section');gallery.className='teirums-herbarium';gallery.hidden=true;
 gallery.setAttribute('aria-labelledby','teirums-meadow-title');grid.after(gallery);
 let game, meadow, previous = [], mismatchTimer, finishTimer;
 function finish() {
  preview.classList.add('teirums-finishing');
  finishTimer=setTimeout(()=>{
   preview.classList.remove('teirums-finishing');
   const heading=document.createElement('h4');heading.id='teirums-meadow-title';heading.lang='ltg';heading.textContent='Muns teirums';heading.tabIndex=-1;
   const count=document.createElement('p');count.className='teirums-meadow-count';count.lang='ltg';count.textContent=`Munā teirumā aug ${meadow.map(plant=>plant.cardName).join(' un ')}.`;
   const collection=document.createElement('div');collection.className='plant-gallery';
   collection.append(...meadow.map(plant=>{
    const article=document.createElement('article');article.className='gallery-plant';
    const image=document.createElement('img');image.src=plant.image;image.alt=plant.nameLv;
    const title=document.createElement('h5');title.className='plant-names';title.lang='ltg';
    // The full game's ending shows all recorded name variants.
    title.textContent=[plant.cardName,...plant.namesLtg.filter(name=>name!==plant.cardName)].join(' · ');
    article.append(image,title);
    if(plant.scientificName){const latin=document.createElement('p');latin.className='scientific-name';latin.lang='la';const name=document.createElement('i');name.textContent=plant.scientificName;latin.append(name);article.append(latin);}
    const common=document.createElement('p');common.className='lv-name';common.textContent=`${lv?'Latviski':'Latvian'}: ${plant.nameLv}`;article.append(common);
    for(const [lang,label] of [['en','English'],['de','Deutsch'],['pl','Polski']]){
     if(!plant.namesOther?.[lang])continue;
     const row=document.createElement('p');row.className='other-name';row.append(`${label}: `);const name=document.createElement('span');name.lang=lang;name.textContent=plant.namesOther[lang];row.append(name);article.append(row);
    }
    return article;
   }));
   gallery.replaceChildren(heading,count,collection);grid.hidden=true;gallery.hidden=false;
   preview.querySelector('.teirums-help').hidden=true;preview.querySelector('.teirums-mini-foot').hidden=true;
   preview.querySelector('[data-teirums-replay]').textContent=lv?'Spēlēt vēlreiz':'Play again';
   heading.focus({preventScroll:true});
  },matchMedia('(prefers-reduced-motion: reduce)').matches?0:1550);
 }
 const instruction = lv ? 'Atrodi divus pārus.' : 'Find two matching pairs.';
 function setFace(index, open, matched = false) {
  const card = grid.children[index], item = game.deck[index];
  card.classList.toggle('flipped',open);
  card.classList.toggle('matched',matched);
  card.setAttribute('aria-pressed',String(open));
  card.setAttribute('aria-label',open ? `${item.kind === 'image' ? (lv?'Auga zīmējums: ':'Plant illustration: '):''}${item.plant.cardName}${matched ? (lv?', pāris atrasts':', matched'):''}` : `${lv?'Atvērt kartīti':'Turn card'} ${index+1}`);
  if(matched) card.setAttribute('aria-disabled','true');
 }
 function flip(index) {
  const event = selectCard(game,index);
  if(event.type === 'ignored') return;
  setFace(index,true);
  if(event.type === 'first') {status.textContent=lv?'Tagad atver otru kartīti.':'Now turn another card.';return;}
  if(event.type === 'match') {
   event.indices.forEach(i=>setFace(i,true,true));
   progress.textContent=`${game.pairs} / 2`;
   status.textContent=event.complete ? (lv?'Abi pāri atrasti!':'Both pairs found!') : `${event.plant.cardName}: ${event.plant.nameLv}`;
   if(event.complete) finish();
  } else {
   event.indices.forEach(i=>grid.children[i].classList.add('mismatch'));
   status.textContent=lv?'Šīs kartītes nav pāris. Mēģini vēlreiz.':'These cards do not match. Try again.';
   mismatchTimer=setTimeout(()=>{
    resolveMismatch(game).forEach(i=>{setFace(i,false);grid.children[i].classList.remove('mismatch');});
    status.textContent=instruction;
   },900);
  }
 }
 function buildCard(item,index) {
  const card=document.createElement('button');card.type='button';card.className='memory-card';
  card.dataset.plantKey=`${item.plant.id}-${item.kind}`;
  card.setAttribute('aria-pressed','false');card.setAttribute('aria-label',`${lv?'Atvērt kartīti':'Turn card'} ${index+1}`);
  const inner=document.createElement('span');inner.className='card-inner';
  const back=document.createElement('span');back.className='card-back';back.setAttribute('aria-hidden','true');
  const logo=document.createElement('img');logo.src='/games/muns-teirums/assets/rg-violet.svg';logo.alt='';logo.width=62;logo.height=62;back.append(logo);
  const front=document.createElement('span');front.className='card-front';front.setAttribute('aria-hidden','true');
  if(item.kind==='image'){
   const image=document.createElement('img');image.src=item.plant.image;image.alt='';image.draggable=false;front.append(image);
  }else{
   front.classList.add('name-face');
   const name=document.createElement('span');name.className='plant-name';name.lang='ltg';name.textContent=item.plant.cardName;
   if(name.textContent.length>19) name.classList.add('long-name');
   if(name.textContent.split(/\s+/).some(word=>word.length>=9)) name.classList.add('long-word');
   front.append(name);
  }
  const check=document.createElement('span');check.className='match-check';
  check.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  front.append(check);inner.append(back,front);card.append(inner);card.addEventListener('click',()=>flip(index));return card;
 }
 function start() {
  clearTimeout(mismatchTimer);clearTimeout(finishTimer);
  preview.classList.remove('teirums-finishing');gallery.hidden=true;grid.hidden=false;
  preview.querySelector('.teirums-help').hidden=false;preview.querySelector('.teirums-mini-foot').hidden=false;
  const selected=sampleMeadow(pool,2,previous);previous=selected.map(plant=>plant.id);
  meadow=selected;game=createGame(makeDeck(selected));grid.replaceChildren(...game.deck.map(buildCard));
  progress.textContent='0 / 2';status.textContent=instruction;
 }
 preview.querySelector('[data-teirums-replay]').addEventListener('click',start);
 start();
}
