(() => {
  const concepts = [
    { key: 'detective', label: 'Detective', icon: 'footprints' },
    { key: 'puzzle', label: 'Puzzle', icon: 'puzzle' },
    { key: 'simulation', label: 'Simulation', icon: 'sliders-horizontal' },
    { key: 'classification', label: 'Classification', icon: 'layout-grid' },
    { key: 'reconstruction', label: 'Reconstruction', icon: 'wrench' },
    { key: 'mapping', label: 'Mapping', icon: 'map-pin' },
    { key: 'strategy', label: 'Strategy', icon: 'network' },
    { key: 'patterns', label: 'Pattern Hunt', icon: 'scan-search' }
  ];
  const isLatvian = document.documentElement.lang.toLowerCase().startsWith('lv');
  const lvLabels = { detective:'Detektīvs', puzzle:'Mīkla', simulation:'Simulācija', classification:'Klasificēšana', reconstruction:'Rekonstruēšana', mapping:'Kartēšana', strategy:'Stratēģija', patterns:'Modeļu meklēšana' };
  if (isLatvian) concepts.forEach(item => { item.label = lvLabels[item.key]; });
  const pairColors = {
    detective: '#B45AA3',
    puzzle: '#7A4DFF',
    simulation: '#357CFF',
    classification: '#3FA7A3',
    reconstruction: '#9B67D6',
    mapping: '#3B8FD8',
    strategy: '#5D72D8',
    patterns: '#4F9EB8'
  };
  const grid = document.querySelector('#memory-grid'), complete = document.querySelector('#game-complete'), shell = document.querySelector('.memory-shell'), note = document.querySelector('#game-note'), livingDots = document.querySelector('#living-dots');
  const movesEl = document.querySelector('#moves'), pairsEl = document.querySelector('#pairs'), timerEl = document.querySelector('#timer'), status = document.querySelector('#game-status');
  let deck, first, second, locked, moves, pairs, seconds, timer, transitionTimer, revealTimer;
  const shuffle = a => { for (let i = a.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const time = n => `${String(Math.floor(n / 60)).padStart(2,'0')}:${String(n % 60).padStart(2,'0')}`;
  function startTimer(){ if (!timer) timer = setInterval(() => { seconds++; timerEl.textContent = time(seconds); }, 1000); }
  function reset(){ clearInterval(timer); clearTimeout(transitionTimer); clearTimeout(revealTimer); timer = transitionTimer = revealTimer = null; first = second = null; locked = false; moves = pairs = seconds = 0; movesEl.textContent='0'; pairsEl.textContent='0 / 8'; timerEl.textContent='00:00'; shell.classList.remove('is-resolving','is-complete','is-skip-reveal'); shell.removeAttribute('aria-busy'); grid.classList.remove('grid-resolving'); livingDots.classList.remove('visible'); livingDots.replaceChildren(); livingDots.removeAttribute('style'); complete.hidden=true; grid.hidden=false; note.hidden=false; deck=shuffle([...concepts,...concepts].map((item,i)=>({...item,id:i}))); render(); }
  function render(){ grid.innerHTML=''; deck.forEach((item,index)=>{ const card=document.createElement('button'); const column=index%4, row=Math.floor(index/4); const dotX=((index*47)%121)-60, dotY=((index*71)%91)-45; card.className='memory-card'; card.type='button'; card.dataset.index=index; card.dataset.pair=item.key; card.style.setProperty('--pair-color',pairColors[item.key]);card.style.setProperty('--skip-delay',`${index*105}ms`);card.style.setProperty('--exit-x',`${(1.5-column)*34}px`);card.style.setProperty('--exit-y',`${(1.5-row)*22}px`);card.style.setProperty('--exit-delay',`${index*22}ms`);card.style.setProperty('--dot-x',`${dotX}px`);card.style.setProperty('--dot-y',`${dotY}px`);card.style.setProperty('--dot-delay',`${(row*4+column)*14}ms`);card.style.setProperty('--dot-color',index%3===0?'#c05be8':index%3===1?'#765cff':'#4f8cff'); card.setAttribute('aria-label',isLatvian?`Paslēpta kartīte ${index+1}`:`Hidden card ${index+1}`); card.innerHTML=`<span class="card-inner"><span class="card-back"><span class="logo-icon" aria-hidden="true"></span></span><span class="card-front"><i data-lucide="${item.icon}" class="game-type-icon" aria-hidden="true"></i><span>${item.label}</span></span></span>`; card.addEventListener('click',()=>flip(card,item)); grid.append(card); }); window.lucide?.createIcons({attrs:{'stroke-width':1.8}}); }
  function flip(card,item){ if(locked || card===first || card.classList.contains('matched')) return; startTimer(); card.classList.add('flipped'); card.setAttribute('aria-label',item.label); if(!first){first=card;return;} second=card; moves++;movesEl.textContent=moves; const match=deck[+first.dataset.index].key===item.key; if(match){ first.classList.add('matched');second.classList.add('matched'); pairs++;pairsEl.textContent=`${pairs} / 8`;status.textContent=isLatvian?`Atrasts pāris: ${item.label}. ${pairs} no 8 pāriem.`:`Pair found: ${item.label}. ${pairs} of 8 pairs.`;first=second=null;if(pairs===8)setTimeout(finish,650); } else { locked=true;status.textContent=isLatvian?'Kartītes nesakrīt.':'Not a match.';setTimeout(()=>{first.classList.remove('flipped');second.classList.remove('flipped');first.setAttribute('aria-label',isLatvian?`Paslēpta kartīte ${+first.dataset.index+1}`:`Hidden card ${+first.dataset.index+1}`);second.setAttribute('aria-label',isLatvian?`Paslēpta kartīte ${+second.dataset.index+1}`:`Hidden card ${+second.dataset.index+1}`);first=second=null;locked=false;},760); } }
  function buildLivingField(){
    const gridBox=grid.getBoundingClientRect(), shellBox=shell.getBoundingClientRect();
    const cards=[...grid.querySelectorAll('.memory-card')];
    livingDots.replaceChildren();
    Object.assign(livingDots.style,{left:`${gridBox.left-shellBox.left}px`,top:`${gridBox.top-shellBox.top}px`,width:`${gridBox.width}px`,height:`${gridBox.height}px`});
    const cols=16, rows=9, particlesPerCard=9;
    for(let i=0;i<cols*rows;i++){
      const cardIndex=i%cards.length, particleIndex=Math.floor(i/cards.length)%particlesPerCard;
      const card=cards[cardIndex], cardBox=card.getBoundingClientRect();
      const sourceCol=particleIndex%3, sourceRow=Math.floor(particleIndex/3);
      const sourceJitterX=((i*17)%9)-4, sourceJitterY=((i*23)%9)-4;
      const sx=cardBox.left-gridBox.left+((sourceCol+.5)/3)*cardBox.width+sourceJitterX;
      const sy=cardBox.top-gridBox.top+((sourceRow+.5)/3)*cardBox.height+sourceJitterY;
      const col=i%cols, row=Math.floor(i/cols);
      const jitterX=((i*37)%19)-9, jitterY=((i*53)%15)-7;
      const tx=((col+.5)/cols)*gridBox.width+jitterX, ty=((row+.5)/rows)*gridBox.height+jitterY;
      const dot=document.createElement('i');
      dot.style.setProperty('--sx',`${sx}px`);dot.style.setProperty('--sy',`${sy}px`);
      dot.style.setProperty('--mx',`${tx-sx}px`);dot.style.setProperty('--my',`${ty-sy}px`);
      dot.style.setProperty('--tx',`${tx}px`);dot.style.setProperty('--ty',`${ty}px`);
      dot.style.setProperty('--delay',`${210+particleIndex*58+cardIndex*13}ms`);
      dot.style.setProperty('--color',card.style.getPropertyValue('--pair-color')||'#725cff');
      dot.style.setProperty('--drift-x',`${((i*29)%23)-11}px`);dot.style.setProperty('--drift-y',`${((i*43)%21)-10}px`);
      dot.style.setProperty('--drift-time',`${14+(i%8)*.72}s`);dot.style.setProperty('--phase',`${-(i%11)*.61}s`);
      const depth=i%8===0?2:i%5===0?1:0;
      const alpha=depth===2?.38:depth===1?.56:.72;
      dot.style.setProperty('--size',`${depth===2?5:depth===1?3.5:2.5+(i%3)*.45}px`);
      dot.style.setProperty('--alpha',alpha);dot.style.setProperty('--alpha-soft',Math.max(.24,alpha-.2));
      dot.style.setProperty('--blur',`${depth===2?1.2:depth===1?.35:0}px`);dot.style.setProperty('--blur-max',`${depth===2?2.4:depth===1?1.1:.65}px`);
      dot.style.setProperty('--focus-time',`${8.5+(i%9)*.63}s`);
      livingDots.append(dot);
    }
    livingDots.classList.add('visible');
    requestAnimationFrame(()=>requestAnimationFrame(()=>livingDots.querySelectorAll('i').forEach(dot=>dot.classList.add('flying'))));
    setTimeout(()=>livingDots.querySelectorAll('i').forEach(dot=>dot.classList.add('settled')),3700);
  }
  function finish(skipped=false){
    if(shell.classList.contains('is-resolving')||!complete.hidden)return;
    clearInterval(timer);timer=null;locked=true;shell.classList.add('is-resolving');shell.setAttribute('aria-busy','true');note.hidden=true;
    if(skipped){shell.classList.add('is-skip-reveal');grid.querySelectorAll('.memory-card').forEach((card,index)=>{card.classList.add('flipped');card.setAttribute('aria-label',deck[index].label);});}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const readingPause=reduced?20:(skipped?3600:850);
    revealTimer=setTimeout(()=>{
      buildLivingField();grid.classList.add('grid-resolving');
      const transitionDelay=reduced?20:3800;
      transitionTimer=setTimeout(()=>{grid.hidden=true;complete.hidden=false;complete.style.minHeight=`${livingDots.offsetHeight}px`;shell.classList.remove('is-resolving');shell.classList.add('is-complete');shell.removeAttribute('aria-busy');status.textContent=isLatvian?`Pabeigts ${moves} gājienos un ${time(seconds)}. ResearchGames.eu ļauj pētījumus izspēlēt.`:`Complete in ${moves} moves and ${time(seconds)}. ResearchGames.eu makes research playable.`;complete.querySelector('button').focus();},transitionDelay);
    },readingPause);
  }
  document.querySelector('#restart-game').addEventListener('click',reset);document.querySelector('#skip-game').addEventListener('click',()=>finish(true));reset();
})();
