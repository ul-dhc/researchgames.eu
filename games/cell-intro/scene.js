import { updateIcons } from './icons.js?v=click-transport-46';
import { AmbientMixer } from './ambient-mixer.js?v=1';
const $=id=>document.getElementById(id);
const scene=$('scene'),world=$('world'),cell=$('cell'),cue=$('cue'),nucleus=$('nucleus');
const physical=$('physical'),chooseCell=$('choose-cell');
const begin=$('begin'),pause=$('pause'),sound=$('sound'),ambient=$('ambient');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const centre={x:.265,y:.478},hit={x:.17,y:.36,w:.19,h:.23};
const captions={
 idle:['A world inside a cell','Explore a cell and discover how its instructions help it work.'],
 teaser:['Life, at its smallest.','Every living organism is made of one or more cells.'],
 world:['The living world.','Most cells are too small to see with our eyes alone. A microscope lets us look closer.'],
 people:['You are made of cells, too.','Your body is made of cells. So is the frog resting on this hand.'],
 flowers:['Many forms of life.','Cells build very different forms of life.'],
 onion:['Our specimen.','Let’s explore the cellular world inside an onion bulb.'],
 scales:['Inside the bulb.','We now use a representative cutaway. Inside an onion bulb are fleshy layers called scales.'],
 skin:['The inner skin.','We follow the thin skin on the concave inner face of one fleshy onion scale – the face toward the bulb’s centre.'],
 field:['Under the microscope.','This illustrative microscope-style view represents the onion’s inner skin. Select the outlined cell.'],
 establish:['You found one cell.','This scientific reconstruction reveals the cell’s large vacuole, thin surrounding cytoplasm and nucleus.'],
 introduce:['The nucleus.','The nucleus holds most of this cell’s DNA – the instructions that help the cell work.'],
 invite:['A closer look.','Select the highlighted nucleus to explore it.'],
 approach:['Beside the nucleus.','The cell wall and large vacuole remain beside us.'],
 boundary:['At the nuclear boundary.','A double membrane surrounds the nucleus. A cutaway reconstruction lets us look inside.'],
 inside:['Inside the nucleus.','Inside this onion cell’s nucleus, long DNA molecules are folded together with proteins.'],
 nucleolus:['The nucleolus.','The darker region is the nucleolus. DNA stores information the cell uses to make proteins.'],
 model:['An onion cell model.','The large vacuole stores water and helps keep the cell firm. A thin layer of cytoplasm surrounds it. Select the word labels to discover what the cytoplasm, nucleus and vacuole do.'],
 explore:['Explore the nucleus.','This cutaway model reveals the envelope and the structures inside the nucleus from our onion cell.'],
 assemble:['Complete the nucleus model.','We can use a simplified model to connect each part with its job.'],
 'dna-focus':['A closer look at DNA.','Inside the nucleus, DNA is folded and packed together with proteins. Let’s look more closely at the DNA.'],
 gene:['One section, one example.','A gene is a DNA section with instructions for something the cell uses. This one contains instructions for a protein – a molecule that does a job in the cell.'],
 message:['Copy the instructions.','This section of DNA contains instructions for making one protein. The cell makes an RNA copy of these instructions – a little like copying information on a computer.'],
 export:['Through a nuclear pore.','The prepared message can pass through a nuclear pore into the cytoplasm – the part of the cell outside the nucleus. A ribosome there reads it to help build a protein.'],
 protein:['A protein with a job.','Proteins do useful jobs. In this example, we’ll build an enzyme that helps split a sugar called sucrose. Amino acids are the building blocks; they are already in the cytoplasm.'],
};
let phase='idle',approach=0,cellEntry=1600,paused=false,still=reduced.matches,soundOn=readAudioPreference().soundOn,last=0,revealTime=0,revealed=true,raf=0,audioState='ready',audioAttempt=0,hasBegun=false,narrationSpeed=1,transitioning=false,transitionTime=0,phaseHold=0,phaseElapsed=0,settingsWasPaused=false,settingsReturning=false,navigationHold=false,musicFinished=false,skinFocus=null,skinMatch=null,nuclearMatch=null,outgoingMotion=null,transitionStatic=false,incomingDecoded=true,visualLoadToken=0,nuclearTime=0,titleTime=0,modelReady=false,modelEntryStatic=false,modelSelected=false,liftStart=null,selectedPart='',infoKey='',infoTrigger=null,guideOpen=false,guideSeen=false,activityStarted=false,activityStep=0,activityPlaced=0,activityChoice='',activityCommitted=false,activityFeedback='',activityOrder=[],bridgeClock=0,learningClock=0,geneSelected=false,copyAt=-1,rnaMade=false,rnaSelected=false,rnaTravelAt=-1,rnaArrived=false,rnaExported=false,rnaTravelStage='',rnaDrag=null,rnaDragPosition=null,rnaStageStart=null,rnaTransportHint='',rnaDragEnded=0,learningGeometry=null,proteinCount=0,proteinCompletionReached=false,chromatinStart=null,controlsAwake=1200,copyExplained=false,proteinStage='purpose',aminoSelected=0,aminoUsed=[],proteinFoldAt=-1,sugarAt=-1,proteinFocusAt=-1,proteinEntryTop=null,proteinGrowAt=-1,proteinAddAt=-1,proteinGrowReadyAt=-1,proteinFoldReadyAt=-1,proteinReactionReadyAt=-1,rnaDeliveryExplained=false,rnaArrivalAt=-1,exploreInvited=false,exploreReadClock=0;
const physicalSources={idle:'assets/elodea-leaf-opening.png',teaser:'assets/elodea-leaf-opening.png',world:'assets/forest-mushroom.jpg',people:'assets/frog-on-hand.png',flowers:'assets/garden-flowers.jpg',onion:'assets/onion-bulbs.jpg',scales:'assets/onion-yellow-cutaway.png',skin:'assets/onion-yellow-cutaway.png'};
const photoPhases=['idle','world','people','flowers','onion'];
const learningPhases=['dna-focus','gene','message','export','protein'];
const nuclearPhases=['inside','nucleolus','model','explore','assemble',...learningPhases];
const lookInside=$('look-inside');
const sceneOrder=Object.keys(captions);
const sequence=Object.fromEntries(sceneOrder.flatMap((key,i)=>!['idle','field','invite','boundary','model','explore','assemble',...learningPhases].includes(key)?[[key,sceneOrder[i+1]]]:[]));
const previousScene=$('previous-scene'),nextScene=$('next-scene');
let masterVolume=readAudioPreference().volume;
const musicMixer=new AmbientMixer([ambient,$('ambient-alt')],{onState:state=>{if(canPlayAudio()){audioState=state;syncSound();}},onFinish:()=>{if(phase==='protein'&&proteinCompletionReached){musicFinished=true;audioState='finished';}else audioState='error';syncSound();},onError:kind=>{audioState='error';if(kind==='initial')soundOn=false;syncSound();$('status').textContent='Ambient sound could not continue. Toggle Sound off and on in Settings to retry.';}});
musicMixer.setMaster(masterVolume);$('volume').value=String(Math.round(masterVolume*100));
function syncControls(){
 const active=phase!=='idle'||!still,controlPaused=paused&&!(phase==='assemble'&&navigationHold);
 pause.disabled=!active;buttonContent(pause,controlPaused?'Resume':'Pause',controlPaused?'play':'pause');pause.setAttribute('aria-label',controlPaused?'Resume exploration':'Pause exploration');pause.setAttribute('title',controlPaused?'Resume exploration':'Pause exploration');
 previousScene.disabled=phase==='idle';nextScene.disabled=phase==='idle'||phase==='protein';
 nucleus.hidden=phase!=='invite'||transitioning;nucleus.disabled=!revealed||transitioning;chooseCell.hidden=phase!=='field'||!revealed||transitioning;$('cell-outline').hidden=!['field','establish'].includes(phase);
 lookInside.hidden=phase!=='boundary'||transitioning;renderControlsVisibility();
}
function renderControlsVisibility(){
 scene.dataset.controlsQuiet=String(phase!=='idle'&&!proteinCompletionReached&&!paused&&!navigationHold&&!$('settings').open&&controlsAwake===0);
}
function wakeControls(){controlsAwake=1200;renderControlsVisibility();}
for(const event of ['pointermove','pointerdown','keydown'])document.addEventListener(event,eventInfo=>{if(eventInfo.target?.closest?.('nav'))wakeControls();},{passive:true});
function revealFull(){revealed=true;revealTime=Infinity;$('detail-visual').textContent=currentCopy()[1];syncControls();}
function setPhase(key){
 proteinCompletionReached=false;
 proteinEntryTop=key==='protein'&&phase==='export'&&Number.isFinite($('nucleus-model').offsetTop)?$('nucleus-model').offsetTop:null;
 if(key==='explore'){exploreInvited=still||paused;exploreReadClock=0;}
 if(key!=='assemble')bridgeClock=0;
 if(key==='dna-focus'){const panel=$('nucleus-model'),object=$('nucleus-object');const pr=panel.getBoundingClientRect(),sr=scene.getBoundingClientRect();chromatinStart={x:parseFloat(object.style.left)/panel.clientWidth,y:parseFloat(object.style.top)/panel.clientHeight,w:parseFloat(object.style.width)/panel.clientWidth,absoluteX:pr.left-sr.left+parseFloat(object.style.left),absoluteY:pr.top-sr.top+parseFloat(object.style.top),absoluteWidth:parseFloat(object.style.width)};}
 rnaDrag=null;rnaDragPosition=null;rnaStageStart=null;rnaTransportHint='';if(learningPhases.includes(key)){learningClock=0;if(key==='gene')geneSelected=false;if(key==='message'){copyAt=-1;rnaMade=false;copyExplained=false;}if(key==='export'){rnaMade=true;rnaSelected=false;rnaTravelAt=-1;rnaArrived=false;rnaExported=false;rnaTravelStage='';rnaDeliveryExplained=false;rnaArrivalAt=-1;}if(key==='protein'){rnaMade=true;rnaArrived=true;rnaExported=true;proteinCount=0;proteinStage='build';aminoSelected=0;aminoUsed=[];proteinFoldAt=-1;sugarAt=-1;proteinFocusAt=0;proteinGrowAt=-1;proteinAddAt=-1;}}
 if(key==='model'){liftStart=null;activityStarted=false;}if(key==='assemble'&&!activityStarted){activityStarted=true;activityStep=0;activityPlaced=0;activityChoice='';activityCommitted=false;activityFeedback='Choose the part by its job. Then place your choice in the model.';shuffleActivityChoices();}scene.dataset.liftReduced=String(key==='explore'&&still);
 closeObjectInfo(false);closeGuide(false);
 if(['model','explore','assemble',...learningPhases].includes(key)){modelEntryStatic=still||paused;modelReady=modelEntryStatic;if(key==='model'){modelSelected=false;selectedPart='';}}else modelReady=false;
 const wasNuclear=nuclearPhases.includes(phase);startShotTransition(key);phase=key;if(nuclearPhases.includes(key)&&!wasNuclear)nuclearTime=0;phaseHold=0;phaseElapsed=0;scene.dataset.phase=key;scene.dataset.hold=String(navigationHold);
 const isPhysical=key in physicalSources;scene.dataset.photo=String(photoPhases.includes(key));scene.dataset.view=isPhysical?'physical':key==='teaser'?'teaser':key==='field'?'field':nuclearPhases.includes(key)?'nuclear':'cell';
 if(key==='skin')document.querySelector?.('.physical-camera')?.style.setProperty('transform','none');
 prepareVisual(key);renderPhysicalMotion();renderNuclear();
 $('skin-cue').hidden=key!=='skin';$('skin-patch').hidden=key!=='skin';if(key!=='skin'){for(const prop of ['left','top','width','height','transform'])$('specimen-view').style[prop]='';}$('teaser-description').hidden=key!=='teaser';
 document.querySelector?.('header')?.toggleAttribute('hidden',false);$('scene-number').textContent='Scene '+(sceneOrder.indexOf(key)+1);
 $('image-notice').textContent=key==='idle'?'Illustrative Elodea leaf cells':photoPhases.includes(key)?'':key==='teaser'?'Illustrative cell reconstruction':isPhysical?'Illustrative cutaway':key==='boundary'?'Scientific cutaway reconstruction':nuclearPhases.includes(key)?'Representative nuclear interior':key==='teaser'?'Illustrative cell reconstruction':key==='field'?'Illustrative microscope-style view':'Scientific reconstruction';
 $('location').textContent=key==='idle'?'':photoPhases.includes(key)?'':key==='teaser'?'':isPhysical?'Representative onion / inner skin':key==='field'?'Inner skin / adjoining cells':nuclearPhases.includes(key)?'Same onion cell / inside the nucleus':'One onion cell / nucleus';
 renderTeaser();geometry();renderCellEntry();
 const copy=currentCopy();$('caption').textContent=copy[0];$('caption').hidden=!copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];
 begin.hidden=key!=='idle';$('skip-introduction').hidden=key!=='idle';$('review-navigation').hidden=key!=='idle';
 cue.hidden=!['introduce','approach','boundary'].includes(key);
 revealTime=0;revealed=still||paused||key==='idle';$('detail-visual').textContent=revealed?copy[1]:'';
 $('narration-live').textContent=key==='idle'?'':copy.join(' ');
 renderModel();syncControls();if(scene.clientWidth<650)scene.scrollIntoView?.({block:'start',behavior:'auto'});
 musicMixer.setLoopAllowed(true);if(musicFinished){musicFinished=false;musicMixer.reset();}
 if((skinMatch||nuclearMatch)&&!transitionStatic)renderFocusTransition(0);
 if(transitionStatic&&incomingDecoded){cancelShotTransition();syncControls();}
}
function montageHold(speed=narrationSpeed){return Math.max(1600,Math.min(3600,2400/speed));}
function montageTotal(){return 2*montageHold()+1600;}
function renderTeaser(){
 const p=phase==='teaser'&&!still?Math.min(1,Math.max(0,(phaseElapsed-montageHold())/1600)):0;
 const blend=p*p*(3-2*p);$('teaser-purple').style.opacity=String(blend);$('title-atmosphere').style.opacity=String(1-blend);
 scene.dataset.montageShot=blend===1?'purple':'green';
}
function physicalDuration(key){return Math.max(9000,captions[key][1].length*25/narrationSpeed+readingDwell(key));}
function physicalTransform(key,elapsed,duration){
 if(still)return 'none';
 const t=elapsed/1000;
 if(key==='people'){const p=Math.min(1,Math.max(0,elapsed/duration));return `translate3d(0,${-.6*p}px,0) scale(1)`;}
 if(key==='idle'||key==='teaser')return 'none';
 const progress=elapsed/duration;return `translate3d(0,${-3*progress}px,0) scale(${1+.028*progress})`;
}
function renderOpeningLife(){
 const layer=$('opening-life');layer.hidden=!['idle','teaser'].includes(phase);if(layer.hidden)return;
 layer.style.opacity=phase==='teaser'?$('title-atmosphere').style.opacity||'1':'1';
 const time=still?0:titleTime/1000,xPositions=[.40,.46,.53,.59,.64,.43,.56,.67],startY=[540,370,220,700,850,90,490,610];
 // Soft optical ambience, rather than circulating cell contents or rising intracellular gas.
 for(let i=0;i<8;i++){const y=981-((981-startY[i]+time*(23+i*1.1))%1020),fade=Math.min(1,Math.max(0,(y+25)/65),Math.max(0,(980-y)/65)),speck=$('opening-speck-'+i);speck.setAttribute('transform',`translate(${1672*xPositions[i]} ${y})`);speck.style.opacity=String(.72*fade);}
}
function renderPhysicalMotion(){
 if(!(phase in physicalSources)||phase==='skin')return;
 const camera=document.querySelector?.('.physical-camera');if(camera)camera.style.transform=physicalTransform(phase,['idle','teaser'].includes(phase)?titleTime:phaseElapsed,physicalDuration(phase));
 if(['idle','teaser'].includes(phase))renderOpeningLife();
}
function renderNuclear(){
 // One inward move, shared across nuclear scenes. It settles once and never loops.
 const progress=Math.min(1,nuclearTime/30000),zoom=1+.08*progress*progress*(3-2*progress);
 $('nuclear-world').style.transform=`scale(${zoom})`;
 $('chromatin-drift').style.transform='none';
}
const nucleusParts={
 envelope:{name:'Nuclear envelope.',text:'The layered boundary is the nuclear envelope. Its two membranes surround the nucleus.',point:[.24,.20],label:[.15,.15],halo:[.24,.20,.11,.045]},
 pores:{name:'Nuclear pores.',text:'Nuclear pores are regulated passages through the envelope. They help control which molecules enter and leave the nucleus.',point:[.96,.48],label:[.94,.24],halo:[.96,.48,.045,.06]},
 nucleolus:{name:'Nucleolus.',text:'The darker region is the nucleolus. It helps assemble ribosome parts. Ribosomes help the cell make proteins.',point:[.70,.34],label:[.66,.47],halo:[.70,.34,.14,.17]},
 dna:{name:'DNA + proteins.',text:'These folded threads contain long DNA molecules packed with proteins. Together, they are called chromatin. DNA stores genetic information.',point:[.40,.67],label:[.20,.73],halo:[.40,.67,.17,.14]},
 nucleoplasm:{name:'Nucleoplasm.',text:'Nucleoplasm is the fluid-like material inside the nucleus. This fluid environment surrounds chromatin (DNA with proteins) and the nucleolus.',point:[.81,.63],label:[.81,.86],halo:[.81,.63,.08,.09]}
};
const cellParts={
 vacuole:{name:'Vacuole',text:'This large, fluid-filled compartment stores water and other substances. Water inside it helps keep the plant cell firm.'},
 nucleus:{name:'Nucleus',text:'The nucleus holds most of this cell’s DNA, which stores genetic information.'},
 wall:{name:'Cell wall',text:'The firm outer wall supports and protects the plant cell. Neighbouring cells share a closely joined boundary.'},
 membrane:{name:'Cell membrane',text:'This thin boundary lies just inside the wall. It helps control which substances enter and leave the cell.'}
};
const proteinIntroText='The enzyme we’re going to build is a protein that helps a chemical reaction happen. The ribosome joins amino acids in the cytoplasm. The cell makes these building blocks or recycles them from old proteins.';
function currentCopy(){
 if(phase==='explore'&&exploreInvited)return ['Now it’s your turn.','Your first challenge is to complete the nucleus model, using what you’ve discovered.'];
 if(phase==='message'&&copyExplained)return ['A message to carry.','This temporary copy is called messenger RNA, or mRNA. It carries these instructions to a ribosome.'];
 if(phase==='export'&&rnaDeliveryExplained)return ['Message delivered!','Now let’s use its instructions to build a protein.'];
 if(phase==='protein'){
  if(proteinStage==='build')return ['Build a protein.',proteinIntroText];
  if(proteinStage==='growing')return ['The chain keeps growing.','The ribosome keeps following the messenger RNA and joining more amino acids. Parts of the growing chain begin to fold as they emerge.'];
  if(proteinStage==='chain')return ['Ready to become a working protein.','The ribosome has continued building the chain. Now we can finish folding it and release the protein.'];
  if(proteinStage==='folding')return ['Taking shape.','The chain folds beside the ribosome. When it is ready, the folded protein is released.'];
  if(proteinStage==='job')return ['We’ve made our enzyme protein.','Now let’s put it to work! Here is sucrose, a sugar. Bring it to the enzyme and watch what happens.'];
  if(proteinStage==='reaction')return ['The enzyme meets sucrose.','The enzyme helps split sucrose into two smaller sugars. Watch them separate and move away.'];
  if(proteinStage==='done')return ['From instructions to a useful job.','The cell can break down these smaller sugars to release energy, or use them to build materials it needs. You’ve followed DNA’s instructions to a working protein.'];
 }
if(phase==='assemble'&&activityPlaced===3)return ['Well done!','Now let’s take a closer look at DNA – and discover how its instructions help the cell make proteins.'];return captions[phase];}
function openObjectInfo(key,trigger){
 const part=nucleusParts[key]||cellParts[key]||learningFacts[key];if(!part)return;closeGuide(false);
 if(infoTrigger)infoTrigger.setAttribute('aria-expanded','false');infoKey=key;infoTrigger=trigger;trigger?.setAttribute('aria-expanded','true');$('object-info-title').textContent=part.name.replace(/\.$/,'');$('object-info-text').textContent=part.text;
 $('object-info').hidden=false;scene.dataset.infoOpen='true';renderModel();$('close-object-info').focus({preventScroll:true});if(scene.clientWidth<650)$('object-info').scrollIntoView?.({block:'nearest',behavior:still?'auto':'smooth'});
}
function closeObjectInfo(restore=true){
 $('object-info').hidden=true;scene.dataset.infoOpen='false';infoKey='';selectedPart='';infoTrigger?.setAttribute('aria-expanded','false');
 if(restore){renderModel();infoTrigger?.focus({preventScroll:true});}infoTrigger=null;
}
function closeGuide(restore=true){guideOpen=false;$('interaction-guide').hidden=true;$('guide-toggle').setAttribute('aria-expanded','false');scene.dataset.guideOpen='false';if(restore){renderModel();$('guide-toggle').focus({preventScroll:true});}}
function proteinGuide(){return {build:'Drag an amino acid to the ribosome, or select one and then select the ribosome. After three joins, the ribosome continues building the chain. Select a biological label to learn about it.',growing:'Close Guide to watch the ribosome continue joining amino acids. When the chain is ready, choose Fold and release the protein.',chain:'Choose Fold and release the protein to watch the chain take shape and leave the ribosome.',folding:'Close Guide to watch the same chain finish folding and release. Then you can put the enzyme to work.',job:'Select the sucrose molecule to send it to the enzyme. Select the Sucrose or Enzyme protein label to learn about it.',reaction:'Close Guide to watch sucrose meet the enzyme and split into two smaller sugars.',done:'You’ve completed this activity. Try another sucrose repeats the reaction. Select Glucose, Fructose or Enzyme protein to learn about them.'}[proteinStage]||learningGuide.protein;}
function openGuide(){
 closeObjectInfo(false);guideOpen=true;guideSeen=true;scene.dataset.guideSeen='true';scene.dataset.guideOpen='true';
 $('guide-text').textContent=phase==='model'?'Select the Cytoplasm, Nucleus or Vacuole word labels to learn about them. To explore the nucleus, select it and choose “Lift out the nucleus”, or drag it to the inspection area.':learningPhases.includes(phase)?(phase==='protein'?proteinGuide():learningGuide[phase]):phase==='assemble'?'Choose the part that matches the job. Tap it, then tap “Place selected part”, or drag it into the model. Each correct placement opens the next question immediately. After the last part, read the narrator’s bridge and choose “Continue”.':phase==='explore'?'Select any labelled part to learn about it. Another selection replaces the information window. When you’re ready, choose “Complete the nucleus model” for the first challenge. “Back to cell model” returns to the cell.':'Choose “Back to cell model” to explore again, or use Previous scene to revisit the nucleus.';
 $('interaction-guide').hidden=false;$('guide-toggle').setAttribute('aria-expanded','true');renderModel();$('close-guide').focus({preventScroll:true});
}
function liftSpring(p){if(p<=0)return 0;if(p>=1)return 1;let value=1-Math.exp(-9*p)*(Math.cos(7*p)+9/7*Math.sin(7*p));if(p>.85)value+=(1-value)*ease((p-.85)/.15);return value;}
const ease=p=>{const q=Math.min(1,Math.max(0,p));return q*q*(3-2*q);};
function renderModel(){
 const visible=['model','explore','assemble',...learningPhases].includes(phase),inspecting=['explore','assemble',...learningPhases].includes(phase),panel=$('nucleus-model');panel.hidden=!visible;panel.inert=!visible;$('guide-toggle').hidden=!visible;
 const blend=!visible?0:phase!=='model'||modelEntryStatic||still?1:ease((phaseElapsed-300)/3600),lift=!inspecting?0:modelEntryStatic||still||phase==='assemble'||learningPhases.includes(phase)?1:liftSpring(phaseElapsed/1800);
 panel.style.opacity=String(blend);panel.style.translate=`0 ${12*(1-blend)}px`;
 const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.filter=visible?`blur(${3*blend}px) brightness(${1-.28*blend}) saturate(${1-.12*blend})`:'none';
 if(visible&&(modelEntryStatic||still||phaseElapsed>=(phase==='model'?3600:1800)))modelReady=true;
 scene.dataset.modelVisible=String(visible);scene.dataset.modelBlend=String(blend);scene.dataset.modelReady=String(visible&&modelReady);scene.dataset.nucleusLift=String(lift);scene.dataset.nucleusSelected=String(modelSelected);scene.dataset.envelopeActive=String(selectedPart==='envelope');scene.dataset.activePart=selectedPart;$('envelope-outline').style.display=phase==='explore'?'':'none';
 const entryFocus=proteinFocusProgress(),entryPortrait=scene.clientWidth<650,viewportHeight=typeof innerHeight==='number'?innerHeight:scene.clientHeight;if(phase==='protein'){panel.style.transition='none';panel.style.height=`${entryPortrait?350+50*entryFocus:Math.min(viewportHeight*.44,400)+(330-Math.min(viewportHeight*.44,400))*entryFocus}px`;panel.style.top=entryPortrait?'auto':`${(viewportHeight<=700?260:255)+(280-(viewportHeight<=700?260:255))*entryFocus}px`;}else{panel.style.height='';panel.style.top='';panel.style.transition='';}
 const mw=panel.clientWidth,mh=panel.clientHeight,portrait=scene.clientWidth<650,ratio=1.25;
 const cw=Math.min(mw*(portrait?.98:.68),mh*(portrait?.62:.96)*1100/600),ch=cw*600/1100,cx=0,cy=portrait?0:(mh-ch)/2;
 const cellModel=$('cell-game-model');cellModel.style.width=`${cw}px`;cellModel.style.height=`${ch}px`;cellModel.style.left=`${cx}px`;cellModel.style.top=`${cy}px`;cellModel.style.opacity=String(1-.68*lift);cellModel.style.transform=`scale(${1-.45*lift})`;
 const ox=cx+cw*220/1100,oy=cy+ch*322/600,ow=cw*.13,oh=ow/ratio;
 const nw=Math.min(mw*(portrait?.98:.43),mh*ratio*.98),nh=nw/ratio,nx=(mw*(portrait?1:.75)-nw)/2,ny=(mh-nh)/2;
 const sx=liftStart?mw*liftStart.x-ow/2:ox-ow/2,sy=liftStart?mh*liftStart.y-oh/2:oy-oh/2;
 let w=ow+(nw-ow)*lift,h=oh+(nh-oh)*lift,x=sx+(nx-sx)*lift,y=sy+(ny-sy)*lift;
 if(['dna-focus','gene','message'].includes(phase)){const zoom=1+.08*(phase==='dna-focus'&&!modelEntryStatic&&!still?ease(learningClock/1600):1);x-=w*.4*(zoom-1);y-=h*.67*(zoom-1);w*=zoom;h*=zoom;}
 if(['export','protein'].includes(phase)&&portrait){const p=phase==='protein'||modelEntryStatic||still?1:ease(learningClock/1600);x-=mw*.40*p;}
 if(portrait){w=Math.min(w,mw*.99);h=w/ratio;if(!['export','protein'].includes(phase))x=Math.max(0,Math.min(mw-w,x));y=Math.max(0,Math.min(mh-h,y));}
 const object=$('nucleus-object');object.style.left=`${x}px`;object.style.top=`${y}px`;object.style.width=`${w}px`;object.style.height=`${h}px`;
 const cyto=$('cytoplasm-intro');cyto.hidden=phase!=='model';cyto.style.left=`${cw*.24}px`;cyto.style.top=`${cy+ch*.10}px`;cyto.setAttribute('aria-pressed',String(infoKey==='cytoplasm'));$('cell-game-model').dataset.cytoplasmActive=String(infoKey==='cytoplasm');
 const pick=$('select-model-nucleus');pick.hidden=phase!=='model';pick.disabled=!modelReady;pick.setAttribute('aria-pressed',String(modelSelected));
 const place=$('place-nucleus');place.hidden=phase!=='model';place.setAttribute('aria-disabled',String(!modelSelected));place.tabIndex=modelSelected?0:-1;place.style.left=`${mw*(portrait?.57:.76)}px`;place.style.top=`${mh*(portrait?.58:.17)}px`;place.style.width=`${mw*(portrait?.41:.23)}px`;place.style.height=`${mh*(portrait?.39:.66)}px`;
 $('vacuole-label').hidden=phase!=='model';$('vacuole-label').disabled=!modelReady||phase!=='model';$('vacuole-label').setAttribute('aria-pressed',String(infoKey==='vacuole'));$('vacuole-shape').setAttribute('stroke',infoKey==='vacuole'?'#f1cf7f':'#ac9aa9');$('vacuole-shape').setAttribute('stroke-width',infoKey==='vacuole'?'6':'2');
 $('cell-wall-shape').setAttribute('stroke',infoKey==='wall'?'#f1cf7f':'#8c7b78');$('cell-wall-shape').setAttribute('stroke-width',infoKey==='wall'?'9':'5');$('cell-membrane-shape').setAttribute('stroke',infoKey==='membrane'?'#f1cf7f':'#8b7c90');$('cell-membrane-shape').setAttribute('stroke-width',infoKey==='membrane'?'7':'3');
 $('cell-wall-info').disabled=!modelReady||phase!=='model';$('cell-membrane-info').disabled=!modelReady||phase!=='model';
 $('lift-now').hidden=phase!=='model'||!modelSelected;$('return-cell').hidden=!['explore','assemble'].includes(phase);$('start-activity').hidden=phase!=='explore'||!modelReady||!exploreInvited||!revealed;$('exploration-next').hidden=phase!=='explore';$('exploration-secondary').hidden=phase!=='explore';const backHost=phase==='explore'?$('exploration-secondary'):$('story-actions');if($('return-cell').parentElement!==backHost)backHost.append($('return-cell'));
 const active=phase==='explore'&&modelReady,labels=$('part-labels');labels.hidden=phase!=='explore'||!modelReady;const leaders=$('part-leaders');leaders.hidden=phase!=='explore'||!modelReady;leaders.style.display=phase==='explore'&&modelReady?'':'none';leaders.setAttribute('viewBox',`0 0 ${mw||1} ${mh||1}`);let lines='',activeLine='',activePoint=null;
 for(const [key,part] of Object.entries(nucleusParts)){
  const target=$('part-'+key),hit=$('hit-'+key),px=x+w*part.point[0],py=y+h*part.point[1];
  const labelWidth=portrait?(key==='dna'||key==='nucleoplasm'?119:100):145;
  const lx=portrait?Math.min(mw-labelWidth-2,Math.max(2,x+w*part.label[0]-labelWidth/2)):(key==='envelope'||key==='dna'?x-166:x+w+20);
  const ly=portrait?y+h*part.label[1]-22:y+h*({envelope:.13,pores:.22,nucleolus:.49,dna:.70,nucleoplasm:.84}[key])-22;
  target.style.left=`${lx}px`;target.style.top=`${ly}px`;target.style.width=`${labelWidth}px`;target.disabled=!active;target.setAttribute('aria-pressed',String(selectedPart===key));
  hit.style.left=`${part.point[0]*100}%`;hit.style.top=`${part.point[1]*100}%`;hit.hidden=!active;hit.dataset.active=String(selectedPart===key);
  lines+=`M${lx+labelWidth/2} ${ly+22} L${px} ${py} `;if(selectedPart===key){activeLine=`M${lx+labelWidth/2} ${ly+22} L${px} ${py}`;activePoint={x:px,y:py};}
 }
 $('part-leader-lines').setAttribute('d',lines);$('active-part-link').style.display=activeLine&&phase==='explore'?'':'none';for(const id of ['active-part-link-under','active-part-link-line'])$(id).setAttribute('d',activeLine);if(activePoint){$('active-part-link-point').setAttribute('cx',String(activePoint.x));$('active-part-link-point').setAttribute('cy',String(activePoint.y));}$('part-highlights').hidden=!inspecting||!selectedPart||selectedPart==='envelope';$('part-highlights').style.display=inspecting&&selectedPart&&selectedPart!=='envelope'?'':'none';
 if(selectedPart){const halo=nucleusParts[selectedPart].halo;for(const [attr,value] of Object.entries({cx:halo[0]*1000,cy:halo[1]*800,rx:halo[2]*1000,ry:halo[3]*800}))for(const id of ['selected-part-halo-under','selected-part-halo'])$(id).setAttribute(attr,String(value));}
 renderActivity();renderLearning({mw,mh,x,y,w,h,portrait});
 if(visible){$('image-notice').textContent='Reconstruction + inspection model';$('location').textContent=['export','protein'].includes(phase)?'Same onion cell · cytoplasm':inspecting?'Nucleus from the same onion cell':'Onion bulb cell';}
}
const activitySteps=[
 {key:'dna',question:'Which part contains the genetic instructions that help the cell work?',placed:'These folded DNA molecules are packed with proteins. Together, this material is called chromatin. DNA stores genetic instructions.'},
 {key:'nucleolus',question:'Which part helps make the small structures that build proteins?',placed:'The nucleolus helps make ribosome subunits. These small parts later join to form ribosomes. Ribosomes build proteins.'},
 {key:'envelope',question:'Which boundary separates the inside of the nucleus from the rest of the cell?',placed:'Well done! Now let’s take a closer look at DNA – and discover how its instructions help the cell make proteins.'}
];
function shuffleActivityChoices(){
 const order=['dna','nucleolus','envelope','pores','nucleoplasm'];for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 if(order.every((key,i)=>key===activityOrder[i]))order.push(order.shift());activityOrder=order;$('activity-choices').append(...order.map(key=>$('choice-'+key)));
}
function renderActivity(){
 const active=phase==='assemble',complete=active&&activityPlaced===3;$('model-activity').hidden=!active||complete;$('assembly-bridge-actions').hidden=!complete;scene.dataset.assemblyComplete=String(complete);const progress=$('activity-next'),host=complete?$('assembly-bridge-actions'):$('model-activity');if(progress.parentElement!==host)host.append(progress);
 const drawing=$('activity-nucleus');drawing.style.display=active?'':'none';
 const fade=active?(modelEntryStatic||still?1:ease(phaseElapsed/300)):0;
 drawing.style.opacity=String(active&&activityPlaced===3?0:fade);$('nucleus-cutaway').style.opacity=String(active&&activityPlaced<3?1-fade:1);
 for(const [i,key] of ['dna','nucleolus','envelope'].entries())$('activity-piece-'+key).style.opacity=String(activityPlaced>i?1:0);
 const target=$('place-activity-part');target.hidden=!active||activityCommitted;$('activity-drop-cue').hidden=!active||activityCommitted;target.setAttribute('aria-disabled',String(!active||activityCommitted||activityChoice!==activitySteps[activityStep].key));
 if(!active)return;
 $('activity-step').textContent=`Model activity · ${activityStep+1} of 3`;$('activity-question').textContent=activitySteps[activityStep].question;
 if($('activity-feedback').textContent!==activityFeedback)$('activity-feedback').textContent=activityFeedback;
 for(const key of ['dna','nucleolus','envelope','pores','nucleoplasm']){const choice=$('choice-'+key);choice.disabled=activityCommitted;choice.setAttribute('aria-pressed',String(activityChoice===key));const feedback=activityChoice===key?(key===activitySteps[activityStep].key?'correct':'retry'):'none';choice.dataset.feedback=feedback;choice.setAttribute('aria-description',feedback==='correct'?'Correct choice':feedback==='retry'?'Try again':'');}
 $('activity-next').hidden=!complete;$('activity-next').disabled=complete&&!bridgeReady();$('activity-next-label').textContent='Continue';$('activity-next').setAttribute('aria-label','Continue: look closer at DNA');
}
function chooseActivityPart(key){
 if(phase!=='assemble'||activityCommitted)return;activityChoice=key;
 if(key===activitySteps[activityStep].key)activityFeedback='Yes – that part matches the job. Place it in the model.';
 else {const role={dna:'DNA with proteins stores genetic instructions.',nucleolus:'The nucleolus helps make ribosome parts.',envelope:'The envelope is the whole boundary around the nucleus.',pores:'Pores are regulated passages through the envelope, rather than the whole boundary.',nucleoplasm:'Nucleoplasm is the fluid-like material around chromatin and the nucleolus.'};const hint=['Look for the folded material that stores information.','Look for the darker region that helps make ribosome parts.','Look for the boundary with pores.'][activityStep];activityFeedback='Try again. '+role[key]+' '+hint;}
 renderActivity();
}
function bridgeReady(){return phase==='assemble'&&activityPlaced===3&&revealed&&bridgeClock>=(modelEntryStatic||still?3000:currentCopy()[1].length*25/narrationSpeed+1600);}
function placeActivityPart(){
 if(phase!=='assemble'||activityCommitted||activityChoice!==activitySteps[activityStep].key)return;
 const placed=activityStep;activityPlaced=placed+1;
 if(placed<2){activityFeedback='Added '+(placed===0?'DNA + proteins. ':'the nucleolus. ')+activitySteps[placed].placed;activityStep++;activityChoice='';shuffleActivityChoices();renderActivity();$('activity-question').focus({preventScroll:true});return;}
 activityCommitted=true;activityFeedback='';bridgeClock=0;const copy=currentCopy();$('caption').hidden=false;$('caption').textContent=copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];$('narration-live').textContent=copy.join(' ');revealTime=0;revealed=still||paused;$('detail-visual').textContent=revealed?copy[1]:'';renderModel();syncControls();if(scene.clientWidth<650){$('caption').tabIndex=-1;$('caption').focus({preventScroll:true});scene.scrollIntoView?.({block:'start',behavior:still?'auto':'smooth'});}
}
function resumeInteractiveMotion(){if(navigationHold){navigationHold=false;paused=false;scene.dataset.hold='false';scene.dataset.paused='false';last=0;syncControls();reconcileAudio();}}
function nextActivityStep(){if(bridgeReady()){resumeInteractiveMotion();setPhase('dna-focus');pause.focus({preventScroll:true});}}
const learningGuide={
 'dna-focus':'Follow the DNA double helix, then choose Explore a gene to examine one section.',
 gene:'Select the highlighted DNA section after reading about genes. Then choose Follow these instructions to copy them into messenger RNA.',
 message:'The highlighted DNA section contains the instructions to copy. Choose Copy instructions beside it, then Follow the message to take the separate messenger RNA through a pore.',
 export:'Select the highlighted nuclear pore. After messenger RNA passes through, select the ribosome to deliver it. Use the small information labels to learn about the message, cytoplasm or ribosome.',
 protein:'Drag an amino acid to the ribosome or select a building block and then the ribosome. After the chain forms, fold and release it, then bring sucrose to the enzyme.'
};
const learningFacts={
 'enzyme-protein':{name:'Enzyme protein',text:'Our enzyme is a protein that helps split sucrose into two smaller sugars. It stays unchanged by this reaction and can be used again.'},
 glucose:{name:'Glucose',text:'Glucose is one of the two smaller sugars released when sucrose splits. The cell can break it down to release energy or use it to build materials it needs.'},
 fructose:{name:'Fructose',text:'Fructose is the other smaller sugar released when sucrose splits. The cell can use it in reactions that release energy or make materials it needs.'},
 sucrose:{name:'Sucrose',text:'Sucrose is a sugar made from two linked smaller sugars: glucose and fructose. Our enzyme helps split it into those two sugars.'},
 'protein-chain':{name:'Growing protein chain',text:'A protein begins as a chain of amino acids. The ribosome joins them in the order given by messenger RNA. Parts of the chain can start folding as it grows.'},
 'amino-acids':{name:'Amino acids',text:'Amino acids are small building blocks used to make proteins. Plant cells make amino acids from other molecules. Breaking down old proteins also releases amino acids that can be used again. Available amino acids in the cytoplasm can be brought to a ribosome, which joins them following messenger RNA instructions.'},
 'messenger-rna':{name:'Messenger RNA',text:'Messenger RNA is a kind of RNA molecule carrying a copy of this gene’s instructions from the nucleus to a ribosome. RNA stands for ribonucleic acid. Other kinds of RNA have other jobs.'},
 cytoplasm:{name:'Cytoplasm',text:'Cytoplasm is the part of this cell outside the nucleus but inside the cell membrane. Many cell activities happen here.'},
 ribosome:{name:'Ribosome',text:'This ribosome in the cytoplasm uses the messenger RNA instructions to join small building blocks, called amino acids, into a separate protein chain.'},
 gene:{name:'Gene',text:'A gene is a DNA section containing instructions for a functional product – something the cell uses. This example holds instructions for a protein. Other genes have other products.'},
 message:{name:'Messenger RNA',text:'RNA stands for ribonucleic acid, a type of molecule. Messenger RNA, or mRNA, is one form of RNA that carries a temporary copy of instructions from DNA. Other forms of RNA have other jobs. The DNA stays in the nucleus.'},
 export:{name:'Nuclear pore',text:'A nuclear pore is a regulated passage through the nuclear envelope. Prepared messenger RNA can pass through it into the cytoplasm.'},
 protein:{name:'An enzyme’s job',text:'Invertase is an enzyme that splits sucrose into glucose and fructose. Plant cells can use these smaller sugars. This is a representative plant-cell example, not an identified gene from this onion. The building blocks shown stand for a much longer protein chain; helper molecules used in real protein synthesis are omitted.'},
 'dna-focus':{name:'DNA',text:'DNA has two strands twisted into a double helix. Inside the nucleus DNA is packed with proteins; this material is called chromatin.'}
};
function renderChromatinEnvironment(g,progress){
 const holder=$('chromatin-environment'),image=$('chromatin-environment-image');holder.hidden=progress<=0&&!['dna-focus','gene','message','export'].includes(phase);holder.style.opacity=String(phase==='dna-focus'?1:Math.min(1,progress*1.8));
 const panel=$('nucleus-model'),pr=panel.getBoundingClientRect?.()||{left:0,top:0},sr=scene.getBoundingClientRect?.()||{left:0,top:0},start=chromatinStart||{x:g.x/g.mw,y:g.y/g.mh,w:g.w/g.mw};
 const sw=start.absoluteWidth||start.w*g.mw,sh=sw/1.25,sx=start.absoluteX??(pr.left-sr.left+start.x*g.mw),sy=start.absoluteY??(pr.top-sr.top+start.y*g.mh);
 const width=sw*(1+7*progress),height=width/1.25,ax=sx+sw*.4+(scene.clientWidth*.5-(sx+sw*.4))*progress,ay=sy+sh*.67+(scene.clientHeight*.45-(sy+sh*.67))*progress;
 image.style.left=`${ax-width*.4}px`;image.style.top=`${ay-height*.67}px`;image.style.width=`${width}px`;image.style.height=`${height}px`;image.style.filter=`blur(${2*progress}px) brightness(${1-.42*progress}) saturate(.9)`;
 const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.opacity=String(1-Math.min(1,progress*1.8));
}
function learningFeedback(text){if($('learning-feedback').textContent!==text)$('learning-feedback').textContent=text;}
function showLearningLayer(id,visible){const element=$(id);element.hidden=!visible;element.toggleAttribute?.('hidden',!visible);element.inert=!visible;if(element.tagName==='svg'||id==='protein-chain')element.style.display=visible?'':'none';}
function refreshNarrator(){const copy=currentCopy();$('caption').textContent=copy[0];$('caption').hidden=!copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];$('narration-live').textContent=copy.join(' ');revealTime=0;revealed=still||paused;$('detail-visual').textContent=revealed?copy[1]:'';if(scene.clientWidth<650)scene.scrollIntoView?.({block:'start',behavior:still?'auto':'smooth'});}
function renderSurroundingCell(g,progress){
 const holder=$('cell-surroundings');showLearningLayer('cell-surroundings',progress>0);if(!progress)return;
 const cw=g.mw*(g.portrait?10:5.5),ch=g.mh*(g.portrait?3:2.6),centerX=g.x+g.w*.5,centerY=g.y+g.h*.5;
 const focus=proteinFocusProgress(),camera=cellContextCamera(g,focus);holder.style.transformOrigin=`${camera.x-(centerX-cw*190/1100)}px ${camera.y-(centerY-ch*322/600)}px`;holder.style.transform=camera.transform;
 holder.style.left=`${centerX-cw*190/1100}px`;holder.style.top=`${centerY-ch*322/600}px`;holder.style.width=`${cw}px`;holder.style.height=`${ch}px`;holder.style.opacity=String(progress*.94);
}
function porePassagePoint(start,pore,exit,progress){
 // One clock and one easing curve: pass through the pore without a second start.
 const t=ease(progress),u=1-t,c1={x:start.x+(pore.x-start.x)*.45,y:start.y},c2={x:pore.x-(exit.x-pore.x)*.7,y:pore.y};
 return {x:u*u*u*start.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*exit.x,y:u*u*u*start.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*exit.y};
}
const proteinModelUnits=14,proteinGrowDuration=4300,proteinFoldDuration=4000,proteinReactionDuration=4300;
function proteinFocusProgress(){return phase==='protein'&&proteinFocusAt>=0?(still||modelEntryStatic?1:ease((learningClock-proteinFocusAt)/1800)):0;}
function cellContextCamera(g,focus){const x=g.mw*(g.portrait?.79:.70),y=g.mh*(g.portrait?.56:.55),dx=g.mw*((g.portrait?.55:.65)-(g.portrait?.79:.70))*focus,dy=g.mh*((g.portrait?.52:.60)-(g.portrait?.56:.55))*focus,scale=1+((g.portrait?200:270)/132-1)*focus;return {x,y,transform:phase==='protein'?`translate(${dx}px,${dy}px) scale(${scale})`:'none'};}
function proteinInputReady(){return phase==='protein'&&proteinStage==='build'&&revealed&&proteinFocusProgress()===1&&(still||proteinAddAt<0||learningClock-proteinAddAt>=360);}
function advanceProteinProcess(){
 if(phase!=='protein')return;
 if(proteinStage==='build'&&proteinCount===3&&(still||learningClock-proteinAddAt>=360)){proteinStage='growing';proteinGrowReadyAt=-1;proteinGrowAt=still?learningClock-proteinGrowDuration:learningClock;refreshNarrator();}
 if(proteinStage==='growing'&&revealed&&proteinGrowReadyAt<0)proteinGrowReadyAt=learningClock;
 if(proteinStage==='growing'&&learningClock-proteinGrowAt>=proteinGrowDuration&&revealed&&(still||learningClock-proteinGrowReadyAt>=750)){proteinStage='chain';refreshNarrator();}
 if(proteinStage==='folding'&&revealed&&proteinFoldReadyAt<0)proteinFoldReadyAt=learningClock;
 if(proteinStage==='folding'&&revealed&&(still||learningClock-proteinFoldAt>=proteinFoldDuration&&learningClock-proteinFoldReadyAt>=350)){proteinStage='job';refreshNarrator();}
 if(proteinStage==='reaction'&&revealed&&proteinReactionReadyAt<0)proteinReactionReadyAt=learningClock;
 if(proteinStage==='reaction'&&revealed&&(still||learningClock-sugarAt>=proteinReactionDuration&&learningClock-proteinReactionReadyAt>=350)){proteinStage='done';proteinCompletionReached=true;musicMixer.setLoopAllowed(false);$('status').textContent='Activity complete. The enzyme is ready to work again.';refreshNarrator();syncControls();}
}
const proteinCoil=[[.33,.16],[.19,.29],[.32,.49],[.57,.36],[.72,.18],[.83,.40],[.67,.64],[.42,.83],[.18,.65],[.29,.44],[.52,.57],[.78,.76],[.74,.49],[.51,.27]];
function proteinChainPoint(exit,t,extension=0){return {x:exit.x+(25+9*extension)*Math.sin(t*Math.PI*2)-20*t,y:exit.y-(125+50*extension)*t+8*Math.sin(t*Math.PI*2)};}
function proteinRibbonPath(points){if(!points.length)return '';let path=`M${points[0].x} ${points[0].y}`;for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];path+=` C${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6} ${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6} ${p2.x} ${p2.y}`;}return path;}
function renderProteinWork(g,work,action,next){
 const {mw,mh,portrait}=g,{rx,ry,rw,rh,focus}=work,exit={x:rx+rw*.23,y:ry-rh*.23},foldCentre={x:exit.x+(portrait?-4:10),y:exit.y-78},jobCentre={x:mw*(portrait?.68:.43),y:portrait?54:90},enzymeW=portrait?148:190,enzymeH=portrait?123:157;
 const poolX=mw*(portrait?.03:.22),poolY=portrait?0:20,bar=$('protein-workbar'),controls=$('protein-work-controls'),footer=$('dna-learning'),isWorking=proteinStage!=='purpose';
 bar.hidden=false;bar.dataset.active=String(isWorking&&focus>0);bar.inert=!isWorking;action.className=proteinStage==='done'?'quiet':'primary';
 for(const button of [action,next]){const host=isWorking?controls:footer;if(button.parentElement!==host)host.append(button);}
 if(isWorking){const order=proteinStage==='done'?[next,action]:[action,next];if(controls.children[0]!==order[0])controls.append(...order);}
 const feedInfo=$('amino-feed-info-label');showLearningLayer('amino-feed-info-label',false);feedInfo.style.left=`${poolX+12}px`;feedInfo.style.top=`${poolY-6}px`;
 const pool=$('amino-pool');pool.style.left=`${poolX}px`;pool.style.top=`${poolY}px`;pool.style.width='170px';pool.style.opacity=String(ease((focus-.1)/.7));pool.style.translate=`${-15*(1-focus)}px ${20*(1-focus)}px`;
 const ready=proteinInputReady(),joining=proteinStage==='build'&&!still&&proteinAddAt>=0&&learningClock-proteinAddAt<360;
 for(let i=1;i<=3;i++){const aa=$('amino-'+i);aa.hidden=aminoUsed.includes(i);aa.disabled=!ready;aa.setAttribute('aria-pressed',String(aminoSelected===i));}
 showLearningLayer('amino-pool',proteinStage==='build');showLearningLayer('amino-feedstock',false);
 const growth=proteinStage==='growing'?Math.min(1,(learningClock-proteinGrowAt)/proteinGrowDuration):['chain','folding','job','reaction','done'].includes(proteinStage)?1:0;
 const add=still?1:proteinAddAt<0?0:ease((learningClock-proteinAddAt)/360);
 let length=proteinStage==='build'?Math.max(0,proteinCount-1+add):proteinStage==='purpose'?0:3+(proteinModelUnits-3)*growth;
 const sequence=[...aminoUsed,...Array.from({length:11},(_,i)=>i%3+1)],fold=proteinStage==='folding'?(still?1:Math.min(1,(learningClock-proteinFoldAt)/proteinFoldDuration)):['job','reaction','done'].includes(proteinStage)?1:0,folding=ease(Math.min(1,fold/.80)),release=ease((fold-.64)/.34),detail=ease((fold-.48)/.50);
 const compact={x:foldCentre.x+(jobCentre.x-foldCentre.x)*release+8*Math.sin(Math.PI*release),y:foldCentre.y+(jobCentre.y-foldCentre.y)*release-18*Math.sin(Math.PI*release)};
 const chain=$('protein-chain');showLearningLayer('protein-chain',proteinStage!=='purpose'&&proteinCount>0);
 chain.setAttribute('viewBox',`0 0 ${mw} ${mh}`);chain.style.left='0px';chain.style.top='0px';chain.style.width=`${mw}px`;chain.style.height=`${mh}px`;chain.style.transform='none';chain.style.translate='none';chain.style.scale='1';chain.style.opacity='1';chain.setAttribute('aria-label',fold===1?'Enzyme protein':fold>0?'The same protein chain folding into an enzyme':'Growing protein chain');
 const points=[];
 for(let i=1;i<=proteinModelUnits;i++){
  const visible=i<=Math.ceil(length),t=Math.max(0,(length-i+1)/(proteinModelUnits+1)),point=proteinChainPoint(exit,t,growth),coil=proteinCoil[i-1],delay=(i-1)/(proteinModelUnits-1)*.16,bend=ease((fold/.80-delay)/(1-delay)),coiled={x:foldCentre.x+(coil[0]-.5)*enzymeW,y:foldCentre.y+(coil[1]-.5)*enzymeH};
  const px=point.x+(coiled.x-point.x)*bend+(compact.x-foldCentre.x),py=point.y+(coiled.y-point.y)*bend+(compact.y-foldCentre.y),bead=$('protein-bead-'+i);
  bead.style.opacity=String(visible?Math.min(1,Math.max(0,length-i+1))*(1-.95*folding):0);bead.setAttribute('cx',String(px));bead.setAttribute('cy',String(py));bead.setAttribute('r',String((portrait?5.7:6.3)+growth*2+folding*1));bead.setAttribute('fill',`url(#amino-shade-${sequence[i-1]||1})`);if(visible)points.push({x:px,y:py});
 }
 // Newest amino acid remains closest to the exit; the first placed one moves outwards.
 const ordered=[...points].reverse(),attached=fold<.68,path=proteinRibbonPath(ordered),ribbonWidth=3.5+growth*2+folding*(portrait?6:7.5);
 $('protein-bonds').setAttribute('d',path);$('protein-bonds').style.strokeWidth=String(ribbonWidth);$('protein-bonds').style.stroke='url(#protein-ribbon)';$('protein-bonds').style.strokeDasharray='none';
 $('protein-chain-depth').setAttribute('d',path);$('protein-chain-depth').style.strokeWidth=String(ribbonWidth+2.5);$('protein-chain-depth').style.opacity=String(growth*.45+folding*.2);
 $('protein-ribbon-light').setAttribute('d',path);$('protein-ribbon-light').style.strokeWidth=String(1+folding*.8);$('protein-ribbon-light').style.opacity=String(growth*.3+folding*.3);$('protein-ribbon-light').style.transform='translate(-1px,-1px)';
 $('protein-tether').setAttribute('d',attached&&ordered.length?`M${exit.x} ${exit.y} L${ordered[0].x} ${ordered[0].y}`:'');$('protein-tether').style.opacity=String(1-ease((fold-.56)/.12));
 $('protein-surface-mask-path').setAttribute('d',path);$('protein-surface-mask-path').setAttribute('stroke-width',String(Math.sqrt(detail)*(ribbonWidth+enzymeW*.42)));$('protein-surface-mask-path').setAttribute('stroke-dasharray','none');
 // After the starter joins, new units emerge quietly at the exit as this attached chain extends.
 const folded=['folding','job','reaction','done'].includes(proteinStage),enzyme=$('folded-protein');showLearningLayer('folded-protein',folded);
 // Texture belongs to this very ribbon: one persistent SVG and one shared path mask.
 enzyme.style.position='static';enzyme.style.left=`${compact.x-enzymeW/2}px`;enzyme.style.top=`${compact.y-enzymeH/2}px`;enzyme.style.width=`${enzymeW}px`;enzyme.style.height=`${enzymeH}px`;enzyme.style.opacity=String(detail);enzyme.style.transform='none';enzyme.style.maskImage='url(#protein-surface-mask)';
 for(const [key,value] of Object.entries({x:compact.x-enzymeW/2,y:compact.y-enzymeH/2,width:enzymeW,height:enzymeH}))enzyme.setAttribute(key,String(value));
 const label=$('protein-label');label.hidden=proteinStage==='purpose'||proteinCount===0||proteinStage==='folding';label.textContent=folded?'Enzyme protein':'Growing protein chain';label.style.left=`${folded?jobCentre.x-60:Math.min(mw-134,exit.x+25)}px`;label.style.top=`${folded?jobCentre.y+enzymeH/2+6:Math.max(0,exit.y-length/(proteinModelUnits+1)*(125+50*growth)-54)}px`;
 const sugar=$('sugar-substrate'),sugarX=mw*(portrait?.15:.18),sugarY=portrait?18:60,binding={x:jobCentre.x+enzymeW*.34,y:jobCentre.y},elapsed=sugarAt<0?0:(proteinStage==='done'||still?proteinReactionDuration:Math.max(0,learningClock-sugarAt)),approach=ease(elapsed/1100),split=ease((elapsed-1750)/650),depart=ease((elapsed-2400)/1700),departBProgress=ease((elapsed-2520)/1580);
 const approachArc=Math.sin(Math.PI*approach),sx=(binding.x-(sugarX+60))*approach-6*approachArc,sy=(binding.y-(sugarY+32))*approach-22*approachArc;
 showLearningLayer('sugar-substrate',['job','reaction','done'].includes(proteinStage));sugar.style.left=`${sugarX}px`;sugar.style.top=`${sugarY}px`;sugar.style.width='120px';sugar.style.height='85px';sugar.style.transform=`translate(${sx}px,${sy}px)`;
 sugar.disabled=proteinStage!=='job'||!revealed;sugar.tabIndex=sugar.disabled?-1:0;sugar.setAttribute('aria-label',proteinStage==='done'?'Glucose and fructose released':'Send sucrose to the enzyme');
 $('sugar-bond').setAttribute('d',`M${35-7*split} 32 L${60-6*split} 32 M${60+6*split} 32 L${85+7*split} 32`);$('sugar-bond').style.opacity=String(1-split*split);$('sucrose-label').style.opacity='0';
 const departA={x:(portrait?-105:-130)*depart-16*Math.sin(Math.PI*depart),y:(portrait?-40:-65)*depart-12*Math.sin(Math.PI*depart)},departB={x:(portrait?2:85)*departBProgress+11*Math.sin(Math.PI*departBProgress),y:(portrait?78:-28)*departBProgress+9*Math.sin(Math.PI*departBProgress)};
 $('sugar-half-a').setAttribute('transform',`translate(${-7*split+departA.x} ${departA.y})`);$('sugar-half-b').setAttribute('transform',`translate(${7*split+departB.x} ${departB.y})`);
 for(const id of ['glucose-name','fructose-name'])$(id).style.opacity='0';
 const sucroseInfo=$('sucrose-info-label');showLearningLayer('sucrose-info-label',proteinStage==='job'||proteinStage==='reaction'&&split<1);sucroseInfo.style.left=`${sugarX+60+sx}px`;sucroseInfo.style.top=`${sugarY+48+sy}px`;sucroseInfo.style.opacity=String(1-split);
 for(const [id,dx,offset] of [['glucose',-25-7*split,departA],['fructose',25+7*split,departB]]){const button=$(id+'-info-label');showLearningLayer(id+'-info-label',proteinStage==='done'||proteinStage==='reaction'&&elapsed>=2400);button.style.left=`${sugarX+60+sx+dx+offset.x}px`;button.style.top=`${sugarY+32+sy+19+offset.y}px`;button.style.opacity=String(Math.min(1,depart*2));}
 const contact=$('enzyme-contact-detail'),engagement=ease((elapsed-850)/350)*(1-ease((elapsed-2200)/550));showLearningLayer('enzyme-contact-detail',proteinStage==='reaction'&&engagement>0);contact.style.left=`${jobCentre.x-enzymeW/2}px`;contact.style.top=`${jobCentre.y-enzymeH/2}px`;contact.style.width=`${enzymeW}px`;contact.style.height=`${enzymeH}px`;contact.style.opacity=String(engagement*.7);contact.style.transform=`translate(${-engagement}px,${engagement*.4}px)`;
 let instruction='',feedback='';action.hidden=true;next.hidden=true;

 if(proteinStage==='build')instruction=focus<1?'Moving closer to where the ribosome works…':joining?'Joining this amino acid to the chain…':!revealed?'The ribosome is ready. Read its story, then bring a building block.':aminoSelected?'Select the ribosome to join this building block.':'Drag an amino acid to the ribosome, or select one and then the ribosome.';
 if(proteinStage==='growing')instruction='The ribosome keeps adding amino acids, following the messenger RNA.';
 if(proteinStage==='chain'){instruction='The chain is ready to finish folding.';action.hidden=!revealed;action.disabled=false;$('learning-action-label').textContent='Fold and release the protein';}
 if(proteinStage==='folding')instruction=paused?'Folding is paused. Resume exploration to continue.':fold<.70?'The attached chain folds beside the ribosome…':release<.96?'The protein is lifting free of the ribosome…':'The folded protein is released.';
 if(proteinStage==='job')instruction='Select sucrose to send it to the enzyme.';
 if(proteinStage==='reaction')instruction=elapsed<1100?'Sucrose is approaching the enzyme…':elapsed<1750?'Sucrose meets the enzyme…':elapsed<2400?'The bond between its two parts is being split…':'Glucose and fructose move apart…';
 if(proteinStage==='done'){instruction='Two sugars released. The enzyme is ready to work again.';feedback='Sucrose split into glucose and fructose.';next.hidden=true;next.disabled=true;action.hidden=!revealed;action.disabled=false;$('learning-action-label').textContent='Try another sucrose';}
 $('protein-work-cue').textContent=instruction;$('protein-work-cue').hidden=!instruction;
 return {instruction:'',feedback,nextText:''};
}

function renderLearning(g){
 advanceProteinProcess();
 const active=learningPhases.includes(phase),outside=['export','protein'].includes(phase),inset=['dna-focus','gene','message'].includes(phase);learningGeometry=g;scene.dataset.learningInfo=active?infoKey:'';scene.dataset.learning=String(active);scene.dataset.proteinStage=phase==='protein'?proteinStage:'';$('dna-learning').hidden=!active;
 for(const id of ['sucrose-info-label','glucose-info-label','fructose-info-label','amino-feed-info-label','enzyme-contact-detail'])showLearningLayer(id,phase==='protein'&&!$(id).hidden);
 const owners={'dna-lens':inset,'rna-message':active&&(phase==='message'&&(copyAt>=0||rnaMade)||outside),'ribosome-target':outside,'ribosome-info-label':outside,'cytoplasm-location':outside,'cytoplasm-region':outside,'pore-target':phase==='export'&&!rnaExported&&rnaTravelAt<0,'transport-hint':false,'protein-chain':false,'protein-label':phase==='protein'&&proteinStage!=='purpose'&&proteinCount>0,'amino-pool':phase==='protein'&&proteinStage==='build','amino-feedstock':false,'folded-protein':phase==='protein'&&['folding','job','done'].includes(proteinStage),'sugar-substrate':phase==='protein'&&['job','reaction','done'].includes(proteinStage)};
 for(const [id,visible] of Object.entries(owners))showLearningLayer(id,Boolean(active&&visible));
 showLearningLayer('select-gene',['gene','message'].includes(phase));showLearningLayer('copy-instructions',phase==='message');
 const poreControl=$('pore-target');poreControl.disabled=phase!=='export'||!revealed||rnaExported||rnaTravelAt>=0;poreControl.tabIndex=poreControl.disabled?-1:0;
 if(!active){$('protein-workbar').hidden=true;$('nucleus-model').style.translate='none';$('nucleus-object').style.transform='none';$('nucleus-object').style.transformOrigin='50% 50%';$('nucleus-object').style.filter='none';showLearningLayer('cell-surroundings',false);$('chromatin-environment').hidden=true;const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.opacity='';$('nucleus-object').style.opacity='1';return;}
 const {mw,mh,x,y,w,h,portrait}=g,lens=$('dna-lens'),lw=Math.min(mw*(portrait?.96:.67),720),lh=lw*.40,lx=portrait?(mw-lw)/2:(mw-lw)/2,ly=(mh-lh)/2;
 const show=phase==='dna-focus'&&!modelEntryStatic&&!still?ease((learningClock-3300)/1900):1;
 lens.style.left=`${lx}px`;lens.style.top=`${ly}px`;lens.style.width=`${lw}px`;lens.style.height=`${lh}px`;lens.style.opacity=String(inset?show:0);
 const zoomProgress=phase==='dna-focus'?(modelEntryStatic||still?1:ease(learningClock/5200)):['gene','message'].includes(phase)?1:phase==='export'?(modelEntryStatic||still?0:1-ease(learningClock/1600)):0;
 const focus=proteinFocusProgress();$('nucleus-model').style.translate=portrait&&phase==='protein'&&proteinEntryTop!==null?`0px ${(proteinEntryTop-$('nucleus-model').offsetTop)*(1-focus)}px`:'none';scene.dataset.proteinWorking=String(phase==='protein'&&focus>0);renderChromatinEnvironment(g,zoomProgress);renderSurroundingCell(g,outside?1-zoomProgress:0);$('cell-surroundings').style.opacity=String((1-zoomProgress)*.94*(1-.82*focus));$('cell-surroundings').style.filter=`blur(${1.5*focus}px)`;
 $('nucleus-object').style.opacity=String(inset?0:phase==='protein'?.5-.4*focus:1-zoomProgress);const contextCamera=cellContextCamera(g,focus);$('nucleus-object').style.transformOrigin=`${contextCamera.x-x}px ${contextCamera.y-y}px`;$('nucleus-object').style.transform=contextCamera.transform;$('nucleus-object').style.filter=`blur(${2*focus}px)`;
 $('cell-game-model').style.opacity='0';
 const gene=$('select-gene');gene.disabled=phase!=='gene'||!revealed||geneSelected;gene.setAttribute('aria-pressed',String(geneSelected));
 const action=$('learning-action'),next=$('learning-next');action.hidden=true;next.hidden=true;action.disabled=!revealed;next.disabled=!revealed;
 $('learning-title').textContent={'dna-focus':'DNA',gene:'A gene',message:'Copy the instructions',export:'Carry the message',protein:'Build a useful protein'}[phase];
 let instruction='',feedback='',nextText='Continue';
 if(phase==='dna-focus'){next.hidden=!revealed||(!modelEntryStatic&&!still&&learningClock<5200);nextText='Explore a gene';}
 if(phase==='gene'){instruction=geneSelected?'Gene selected.':'Select the marked DNA section.';next.hidden=!geneSelected;nextText='Follow these instructions';}
 let copyProgress=1;
 if(phase==='message'){
  copyProgress=rnaMade?1:copyAt<0?0:ease((learningClock-copyAt)/1600);
  if(copyProgress===1&&!rnaMade){rnaMade=true;copyExplained=true;refreshNarrator();}
  if(rnaMade&&!copyExplained){copyExplained=true;refreshNarrator();}
  $('copy-instructions').disabled=!revealed||copyAt>=0||rnaMade;$('copy-instructions').dataset.success=String(rnaMade);$('copy-instructions-label').textContent=rnaMade?'Instructions copied':copyAt>=0?'Copying…':'Copy instructions';
  $('rna-strand').style.clipPath=`inset(0 ${100*(1-copyProgress)}% 0 0)`;$('rna-message').dataset.forming=String(!rnaMade);next.hidden=!rnaMade||!revealed;nextText='Follow the message';feedback=rnaMade?'Instructions copied. The original DNA stays intact.':'';
 }
 const rx=mw*((portrait?.79:.70)+((portrait?.55:.65)-(portrait?.79:.70))*focus),ry=mh*((portrait?.56:.55)+((portrait?.52:.60)-(portrait?.56:.55))*focus),rw=132+((portrait?200:270)-132)*focus,rh=106+((portrait?160:216)-106)*focus,ribosome=$('ribosome-target');
 ribosome.style.left=`${rx-rw/2}px`;ribosome.style.top=`${ry-rh/2}px`;ribosome.style.width=`${rw}px`;ribosome.style.height=`${rh}px`;ribosome.disabled=phase==='export'?(!revealed||!rnaExported||rnaArrived||rnaTravelAt>=0):phase==='protein'&&(!proteinInputReady()||!aminoSelected);
 ribosome.dataset.destination=String(phase==='export'&&rnaExported&&!rnaArrived&&rnaTravelAt<0||phase==='protein'&&proteinStage==='build'&&aminoSelected>0);
 ribosome.setAttribute('aria-label',phase==='export'?'Deliver messenger RNA to the ribosome':phase==='protein'&&proteinStage==='build'?'Join the selected amino acid at the ribosome':'Ribosome');
 $('ribosome-info-label').style.left=`${rx-60}px`;$('ribosome-info-label').style.top=`${ry+rh/2+1}px`;
 $('cytoplasm-location').style.left=`${portrait?(phase==='protein'?mw-95:mw*.52):(phase==='protein'?mw*.39:mw*.82)}px`;$('cytoplasm-location').style.top=`${portrait?(phase==='protein'?mh*.82:mh*.02):(phase==='protein'?mh*.85:mh*.12)}px`;
 $('cytoplasm-region').style.left=`${rx-70}px`;$('cytoplasm-region').style.top=`${ry-75}px`;$('cytoplasm-region').dataset.active=String(infoKey==='cytoplasm');
 let qx=lx+lw*(.62+.24*copyProgress),qy=ly+lh*(.22+.58*copyProgress),dock=outside&&rnaArrived?1:0;
 const rna=$('rna-message');rna.disabled=false;rna.setAttribute('aria-label','About messenger RNA');rna.dataset.forming=String(phase==='message'&&!rnaMade);
 if(outside){
  $('rna-strand').style.clipPath='none';const start={x:x+w*.54,y:y+h*.67},pore={x:x+w*.96,y:y+h*.48},exit={x:pore.x+22,y:pore.y},groove={x:rx-12-8*focus,y:ry+11+7*focus};
  let point=rnaExported?exit:start;if(phase==='protein'||rnaArrived)point=groove;
  else if(rnaTravelAt>=0){const duration=rnaTravelStage==='pore'?1200:900,progress=Math.min(1,(learningClock-rnaTravelAt)/duration),e=ease(progress),from=rnaStageStart||point;
   if(rnaTravelStage==='pore'){point=porePassagePoint(from,pore,exit,progress);if(progress===1){rnaExported=true;rnaTravelAt=-1;point=exit;}}
   else{dock=e;point={x:from.x+(groove.x-from.x)*e,y:from.y+(groove.y-from.y)*e};if(progress===1){rnaArrived=true;rnaArrivalAt=learningClock;rnaTravelAt=-1;point=groove;}}
  }
  qx=point.x;qy=point.y;poreControl.style.left=`${pore.x-25}px`;poreControl.style.top=`${pore.y-25}px`;
 }
 const dockWidth=112+((portrait?144:172)-112)*focus,dockHeight=28+10*focus,rnaWidth=124+(dockWidth-124)*dock,rnaHeight=48+(dockHeight-48)*dock;rna.style.width=`${rnaWidth}px`;rna.style.height=`${rnaHeight}px`;rna.style.left=`${qx-rnaWidth/2}px`;rna.style.top=`${qy-rnaHeight/2}px`;rna.style.setProperty?.('--rna-label-lift',`${5+55*dock}px`);rna.dataset.reading=String(dock===1);const reception=still?0:Math.sin(Math.PI*ease(Math.max(0,(dock-.55)/.45)));ribosome.style.setProperty?.('--receive',String(reception));ribosome.dataset.engaged=String(dock===1);$('ribosome-small-subunit').style.transform=`translate(${1.8*reception}px,${1.2*reception}px) rotate(${1.4*reception}deg)`;$('rna-strand').style.transform=`translateX(${-8*reception}px)`;$('rna-strand').style.maskImage=dock>0?`linear-gradient(90deg,#000 0%,#000 38%,rgba(0,0,0,${1-.6*dock}) 47%,rgba(0,0,0,${1-.6*dock}) 60%,#000 69%,#000 100%)`:'none';rna.style.setProperty?.('--rna-info-opacity','1');rna.style.setProperty?.('--rna-work-label-top',`${rh/2+55}px`);
 if(phase==='export'){
  if(rnaArrived&&!rnaDeliveryExplained){rnaDeliveryExplained=true;rnaArrivalAt=learningClock;refreshNarrator();}
  instruction=rnaArrived?'Messenger RNA has reached the ribosome.':rnaTravelAt>=0?(rnaTravelStage==='pore'?'The message passes through this pore.':'The message enters the ribosome’s channel.'):rnaExported?'Select the ribosome to deliver the message.':'Select the marked nuclear pore.';
  next.hidden=!rnaArrived||!revealed||!still&&!paused&&learningClock-rnaArrivalAt<650;nextText='Build a protein';feedback=rnaArrived?'Message delivered.':rnaExported?'Message passed through the pore.':'';
 }
 if(phase==='protein'){const result=renderProteinWork(g,{rx,ry,rw,rh,focus},action,next);instruction=result.instruction;feedback=result.feedback;nextText=result.nextText;}
 else{for(const id of ['sucrose-info-label','glucose-info-label','fructose-info-label','amino-feed-info-label','enzyme-contact-detail'])showLearningLayer(id,false);$('protein-workbar').hidden=true;for(const button of [action,next])if(button.parentElement!==$('dna-learning'))$('dna-learning').append(button);}
 $('learning-instruction').textContent=instruction;$('learning-instruction').hidden=!instruction;$('learning-next-label').textContent=nextText;next.setAttribute('aria-label',nextText);$('learning-feedback').dataset.success=String(Boolean(feedback));learningFeedback(feedback);
}

function selectGene(){if(phase!=='gene'||!revealed)return;geneSelected=true;renderModel();$('learning-next').focus({preventScroll:true});}
function selectRna(){if(phase!=='export'||!revealed||rnaTravelAt>=0)return;rnaSelected=true;renderModel();}
function beginRnaStage(stage){if(phase!=='export'||!revealed||rnaTravelAt>=0||rnaArrived||stage==='pore'&&rnaExported||stage==='ribosome'&&!rnaExported)return;resumeInteractiveMotion();rnaTravelStage=stage;rnaTravelAt=learningClock;rnaStageStart=rnaDragPosition;rnaDragPosition=null;rnaTransportHint='';if(still||paused){if(stage==='pore')rnaExported=true;else rnaArrived=true;rnaTravelAt=-1;}renderModel();}
function sendRna(){beginRnaStage(rnaExported?'ribosome':'pore');}
function makeRnaCopy(){if(phase!=='message'||!revealed||copyAt>=0||rnaMade)return;resumeInteractiveMotion();copyAt=learningClock;if(still||paused)rnaMade=true;renderModel();if(rnaMade)$('learning-next').focus({preventScroll:true});}
function learningAction(){
 if(!revealed||phase!=='protein')return;resumeInteractiveMotion();
 if(proteinStage==='chain'){proteinStage='folding';proteinFoldAt=learningClock;proteinFoldReadyAt=-1;$('status').textContent='Folding and releasing the protein.';refreshNarrator();}
 else if(proteinStage==='done'){proteinStage='job';sugarAt=-1;refreshNarrator();}
 renderModel();
}
function chooseAminoAcid(index){if(!proteinInputReady()||aminoUsed.includes(index))return;aminoSelected=index;renderModel();}
function joinAminoAcid(){if(!proteinInputReady()||!aminoSelected)return;resumeInteractiveMotion();aminoUsed.push(aminoSelected);proteinCount++;aminoSelected=0;proteinAddAt=still?learningClock-360:learningClock;$('status').textContent='Amino acid joined to the growing chain.';renderModel();}
function useEnzyme(){if(phase!=='protein'||proteinStage!=='job'||!revealed)return;resumeInteractiveMotion();sugarAt=learningClock;proteinReactionReadyAt=-1;proteinStage='reaction';$('status').textContent='Sending sucrose to the enzyme.';refreshNarrator();renderModel();}
function nextLearning(){if(!revealed)return;const next={'dna-focus':'gene',gene:geneSelected?'message':'',message:rnaMade?'export':'',export:rnaArrived?'protein':''}[phase];if(next){setPhase(next);pause.focus({preventScroll:true});}}
function selectModelNucleus(showInfo=true){if(phase!=='model'||!modelReady)return;modelSelected=true;if(showInfo)openObjectInfo('nucleus',$('select-model-nucleus'));renderModel();}
function liftModelNucleus(event){if(phase!=='model'||!modelSelected)return;liftStart=null;
 if(event?.type==='drop'&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)){const panel=$('nucleus-model'),rect=panel.getBoundingClientRect?.(),w=parseFloat($('nucleus-object').style.width),h=parseFloat($('nucleus-object').style.height);if(rect)liftStart={x:Math.max(w/2,Math.min(panel.clientWidth-w/2,event.clientX-rect.left-40+w/2))/panel.clientWidth,y:Math.max(h/2,Math.min(panel.clientHeight-h/2,event.clientY-rect.top-35+h/2))/panel.clientHeight};}
 setPhase('explore');$('status').textContent='Lifting the nucleus out in the inspection model. The cell stays behind as a location guide.';pause.focus({preventScroll:true});}
function exploreNucleusPart(key){if(phase!=='explore'||!modelReady)return;selectedPart=key;openObjectInfo(key,$('part-'+key));}
function prepareVisual(key){
 const token=++visualLoadToken,isNuclear=nuclearPhases.includes(key),target=key in physicalSources?physical:isNuclear?$('nuclear-interior'):null;
 incomingDecoded=true;
 if(!target)return;
 const src=isNuclear?'assets/onion-nuclear-interior.jpg':physicalSources[key];
 if(target.dataset.source!==src){target.dataset.source=src;target.src=src;if(!isNuclear)$('physical-backdrop').src=src;}
 if(typeof target.decode!=='function')return;
 incomingDecoded=false;
 target.decode().then(()=>{if(token!==visualLoadToken)return;incomingDecoded=true;last=0;if(transitionStatic){cancelShotTransition();syncControls();}}).catch(()=>{if(token!==visualLoadToken)return;incomingDecoded=true;last=0;if(transitionStatic){cancelShotTransition();syncControls();}});
}
function renderFocusTransition(e){
 const focus=nuclearMatch||skinMatch;if(!focus)return;
 const camera=document.querySelector(nuclearMatch?'.nuclear-camera':'.camera');
 const rx=focus.width/2+(scene.clientWidth*1.7-focus.width/2)*e,ry=focus.height/2+(scene.clientHeight*1.7-focus.height/2)*e;
 camera.style.zIndex='1';camera.style.maskImage=`radial-gradient(ellipse ${rx}px ${ry}px at ${focus.x}px ${focus.y}px, #000 72%, transparent 100%)`;
 camera.style.opacity=String(.08+.92*Math.min(1,e*2));$('outgoing').style.opacity='1';
 if(skinMatch)scene.dataset.skinMatchStage=e>.35?'expanding':'patch';
}
function renderSkin(){
 const w=scene.clientWidth,h=scene.clientHeight,portrait=w<650&&h>w,ratio=1672/941;
 const p=still?0:Math.min(1,Math.max(0,(phaseElapsed-1200)/6500)),e=p*p*(3-2*p),zoom=1+.6*e;
 const iw=w*(portrait?1.5:1),ih=iw/ratio,startX=(w-iw)/2,startY=portrait?40:0;
 const tx=w*.52,ty=portrait?h*.16+.42*w/ratio:h*.42;
 const left=startX+(tx-.65*iw*zoom-startX)*e,top=startY+(ty-.5*ih*zoom-startY)*e;
 const specimen=$('specimen-view');specimen.style.width=`${iw}px`;specimen.style.height=`${ih}px`;specimen.style.left=`${left}px`;specimen.style.top=`${top}px`;specimen.style.transform=`scale(${zoom})`;
 skinFocus={x:left+.65*iw*zoom,y:top+.5*ih*zoom,width:.14*iw*zoom,height:.14*ih*zoom};scene.dataset.skinStage=p===1?'close':'context';
}
function renderCellEntry(){
 const p=phase==='field'?0:phase==='establish'?Math.min(1,cellEntry/1600):1,e=p*p*(3-2*p);
 cell.style.opacity=String(p===0&&phase==='field'?0:.15+.85*e);
 cell.style.maskImage=p===1?'none':`radial-gradient(ellipse ${8+142*e}% ${12+138*e}% at 26.5% 47.8%, #000 65%, transparent 100%)`;
 $('cell-outline').style.opacity=phase==='field'?'1':String(1-.7*e);
 scene.dataset.cellReveal=phase==='field'?'closed':p===1?'open':'opening';
}
function geometry(){
 if(phase==='skin')renderSkin();
 const w=scene.clientWidth,h=scene.clientHeight,ratio=cell.naturalWidth&&cell.naturalHeight?cell.naturalWidth/cell.naturalHeight:16/9;
 const portrait=w<650&&h>w;
 const s=Math.max(w/(ratio*1000),h/1000)*(portrait?1.12:1);let bw=ratio*1000*s,bh=1000*s;
 const p=still?0:Math.min(1,approach/8000),ease=p*p*(3-2*p),z=1+(w<650?.25:.48)*ease;
 const tx=w*(w<650?.44:(.265+.13*ease)),ty=h*((w<650&&h>w?.38:.478)-.045*ease);
 let left=Math.min(0,Math.max(w-bw*z,tx-centre.x*bw*z)),top=Math.min(0,Math.max(h-bh*z,ty-centre.y*bh*z));
 if(portrait&&(['field','teaser'].includes(phase)||(phase==='establish'&&cellEntry<1600))){const q=['field','teaser'].includes(phase)?0:cellEntry/1600,f=q*q*(3-2*q);bw=w+(bw-w)*f;bh=w/ratio+(bh-w/ratio)*f;left*=f;top=h*.16*(1-f)+top*f;}
 world.style.width=`${bw}px`;world.style.height=`${bh}px`;world.style.transform=`translate3d(${left}px,${top}px,0) scale(${z})`;
 chooseCell.style.width=`${bw}px`;chooseCell.style.height=`${bh}px`;chooseCell.style.transform=`translate3d(${left}px,${top}px,0) scale(${z})`;
 nucleus.style.left=`${left+hit.x*bw*z}px`;nucleus.style.top=`${top+hit.y*bh*z}px`;nucleus.style.width=`${hit.w*bw*z}px`;nucleus.style.height=`${hit.h*bh*z}px`;
}
function readAudioPreference(){
 try{const saved=JSON.parse(localStorage.getItem('cell-intro-audio')||'{}');return {soundOn:saved.soundOn!==false,volume:typeof saved.volume==='number'&&saved.volume>=0&&saved.volume<=1?saved.volume:.65};}catch{return {soundOn:true,volume:.65};}
}
function saveAudioPreference(){try{localStorage.setItem('cell-intro-audio',JSON.stringify({soundOn,volume:masterVolume}));}catch{}}
function canPlayAudio(){return soundOn&&hasBegun&&!musicFinished&&!document.hidden&&($('settings').open||((!paused||navigationHold)&&phase!=='idle'));}
function syncSound(){
 sound.textContent=soundOn?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(soundOn));
 const states={off:'Off',ready:'',loading:'Loading audio…',playing:masterVolume===0?'Playing · volume at zero':$('settings').open?'Playing · sound preview':'Playing',paused:'Paused',finished:'Music finished',error:'Audio unavailable · toggle Sound on to retry'};
 $('audio-state').textContent=states[audioState]??audioState;$('audio-state').hidden=!$('audio-state').textContent;
}
function stopAudio(state='paused'){audioAttempt++;musicMixer.pause();audioState=soundOn?state:'off';syncSound();}
async function playAudio(){
 if(!canPlayAudio())return;const attempt=++audioAttempt;audioState=musicMixer.running?'playing':'loading';syncSound();await musicMixer.play();if(attempt!==audioAttempt)return;if(audioState!=='error')audioState=musicFinished?'finished':musicMixer.running?'playing':'paused';syncSound();
}
function reconcileAudio(){if(canPlayAudio())playAudio();else stopAudio(!hasBegun?'ready':musicFinished?'finished':'paused');}
function toggleSound(){soundOn=!soundOn;if(soundOn&&musicMixer.loopFailed&&!proteinCompletionReached){musicMixer.reset();musicFinished=false;}saveAudioPreference();reconcileAudio();}
function updateMotion(){scene.dataset.still=String(still);if(still){cancelShotTransition();cellEntry=1600;scene.dataset.entry='false';if(!revealed)revealFull();syncControls();}renderCellEntry();renderTeaser();renderPhysicalMotion();renderNuclear();renderModel();geometry();}
function setPaused(value){paused=value;wakeControls();if(!value){navigationHold=false;scene.dataset.hold='false';}scene.dataset.paused=String(paused);last=0;syncControls();reconcileAudio();$('status').textContent=paused?'Exploration paused.':'Exploration resumed.';}
function tick(now){
 const dt=last?Math.min(now-last,100):0;last=now;musicMixer.tick();const musicState=musicMixer.snapshot();scene.dataset.musicVoice=String(musicState.active);scene.dataset.musicOverlap=String(musicState.overlap);scene.dataset.musicLoops=String(musicState.loops);scene.dataset.musicGainA=String(musicState.gains[0]);scene.dataset.musicGainB=String(musicState.gains[1]);controlsAwake=Math.max(0,controlsAwake-dt);renderControlsVisibility();
 if(phase==='assemble'&&activityPlaced===3&&incomingDecoded&&(!paused||navigationHold)&&!infoKey&&!guideOpen){bridgeClock+=dt;renderActivity();}
 if(!paused&&incomingDecoded){
  if(phase==='explore'&&revealed&&!exploreInvited&&!infoKey&&!guideOpen){exploreReadClock+=dt;if(exploreReadClock>=1600){exploreInvited=true;refreshNarrator();}}
  phaseElapsed+=dt;if(['idle','teaser'].includes(phase))titleTime+=dt;if(phase==='teaser')renderTeaser();if(phase==='skin')renderSkin();renderPhysicalMotion();if(nuclearPhases.includes(phase)){if(!still&&!infoKey&&!guideOpen)nuclearTime=Math.min(30000,nuclearTime+dt);renderNuclear();}if(learningPhases.includes(phase)&&!infoKey&&!guideOpen)learningClock+=dt;renderModel();
  if(transitioning&&!transitionStatic){
   transitionTime=Math.min(1600,transitionTime+dt);const p=transitionTime/1600,e=p*p*(3-2*p);
   if(outgoingMotion)outgoingMotion.node.style.transform=physicalTransform(outgoingMotion.key,outgoingMotion.elapsed+transitionTime,outgoingMotion.duration);
   if(skinMatch||nuclearMatch)renderFocusTransition(e);else $('outgoing').style.opacity=String(1-e);
   if(p===1){cancelShotTransition();syncControls();}
  }
  if(phase==='establish'&&cellEntry<1600){cellEntry=Math.min(1600,cellEntry+dt);geometry();renderCellEntry();if(cellEntry===1600){scene.dataset.entry='false';syncControls();}}
  if(!revealed&&!(phase==='dna-focus'&&!modelEntryStatic&&!still&&learningClock<3200)){revealTime+=dt*narrationSpeed;const count=Math.floor(revealTime/25);$('detail-visual').textContent=currentCopy()[1].slice(0,count);if(count>=currentCopy()[1].length)revealFull();}
  if(phase==='approach'&&approach<8000){approach=Math.min(8000,approach+dt);geometry();if(approach===8000)syncControls();}
  if(!still&&revealed&&!transitioning&&sequence[phase]){phaseHold+=dt;const cameraReady=phase!=='approach'||approach===8000;const entryReady=phase!=='establish'||cellEntry===1600;const skinReady=phase!=='skin'||phaseElapsed>=7700,montageReady=phase!=='teaser'||phaseElapsed>=montageTotal();if(cameraReady&&entryReady&&skinReady&&montageReady&&phaseHold>=(phase==='teaser'?0:phase==='model'?Math.max(6000,captions.model[1].length*25/narrationSpeed+2400/narrationSpeed):readingDwell()))setPhase(sequence[phase]);}
 }
 raf=requestAnimationFrame(tick);
}
function start(startPhase){const destination=startPhase==='model'?'model':'teaser';wakeControls();hasBegun=true;musicFinished=false;navigationHold=false;cancelShotTransition();approach=0;cellEntry=1600;scene.dataset.entry='false';paused=false;scene.dataset.paused='false';last=0;musicMixer.reset();$('status').textContent='Exploration started.';setPhase(destination);if(destination==='model'){cancelShotTransition();modelEntryStatic=true;modelReady=true;revealFull();renderModel();}geometry();playAudio();if(!raf)raf=requestAnimationFrame(tick);}
function navigateScene(direction){
 const target=sceneOrder[sceneOrder.indexOf(phase)+direction];
 if(!target||phase==='idle')return;
 if(target==='idle'){returnToBeginning();return;}
 holdScene(target);
}
function holdScene(target){
 cancelShotTransition();navigationHold=true;paused=true;scene.dataset.paused='true';last=0;
 approach=['approach','boundary','inside','nucleolus','model','explore','assemble',...learningPhases].includes(target)?8000:0;cellEntry=1600;scene.dataset.entry='false';
 setPhase(target);revealFull();geometry();reconcileAudio();
 $('status').textContent='Scene selected. Exploration paused; Play resumes.';
}
function selectNucleus(){if(phase==='invite'&&revealed){if(paused){holdScene('approach');return;}approach=0;setPhase('approach');$('status').textContent=still?'Nucleus selected.':'Nucleus selected. Moving closer.';pause.focus({preventScroll:true});}}
$('skip-introduction').addEventListener('click',()=>start('model'));begin.addEventListener('click',start);nucleus.addEventListener('click',selectNucleus);chooseCell.addEventListener('click',()=>{if(phase==='field'&&revealed){cellEntry=still||paused?1600:0;scene.dataset.entry=String(cellEntry<1600);setPhase('establish');$('status').textContent=cellEntry===1600?'Cell interior revealed.':'Cell selected. Revealing the reconstructed interior.';pause.focus({preventScroll:true});}});
lookInside.addEventListener('click',()=>{if(phase!=='boundary')return;setPhase('inside');$('status').textContent='Nuclear cutaway opened. Chromatin is now visible.';pause.focus({preventScroll:true});});
$('select-model-nucleus').addEventListener('click',()=>selectModelNucleus());
$('place-nucleus').addEventListener('click',liftModelNucleus);$('lift-now').addEventListener('click',liftModelNucleus);
$('copy-instructions').addEventListener('click',makeRnaCopy);$('learning-action').addEventListener('click',learningAction);$('learning-next').addEventListener('click',nextLearning);$('select-gene').addEventListener('click',selectGene);$('rna-message').addEventListener('click',()=>{if(['message','export','protein'].includes(phase))openObjectInfo('messenger-rna',$('rna-message'));});$('ribosome-target').addEventListener('click',()=>{if(phase==='export')beginRnaStage('ribosome');else if(phase==='protein')joinAminoAcid();});$('ribosome-info-label').addEventListener('click',()=>openObjectInfo('ribosome',$('ribosome-info-label')));$('cytoplasm-location').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-location')));$('cytoplasm-region').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-location')));$('pore-target').addEventListener('click',()=>beginRnaStage('pore'));$('learning-info').addEventListener('click',()=>{if(learningPhases.includes(phase))openObjectInfo(phase,$('learning-info'));});
$('start-activity').addEventListener('click',()=>{if(phase==='explore'&&modelReady){setPhase('assemble');$('activity-question').focus({preventScroll:true});}});
$('activity-next').addEventListener('click',nextActivityStep);$('place-activity-part').addEventListener('click',placeActivityPart);
for(const key of ['dna','nucleolus','envelope','pores','nucleoplasm']){const choice=$('choice-'+key);choice.addEventListener('click',()=>chooseActivityPart(key));choice.addEventListener('dragstart',event=>{chooseActivityPart(key);if(phase!=='assemble'||activityCommitted||key!==activitySteps[activityStep].key){event.preventDefault();return;}event.dataTransfer?.setData('text/plain','nucleus-part-'+key);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';});}
for(const id of ['place-activity-part','nucleus-object']){
 $(id).addEventListener('dragover',event=>{if(phase==='assemble'&&!activityCommitted&&activityChoice===activitySteps[activityStep].key){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
 $(id).addEventListener('drop',event=>{if(phase==='assemble'){event.preventDefault();placeActivityPart();}});
}
$('return-cell').addEventListener('click',()=>holdScene('model'));
$('select-model-nucleus').addEventListener('dragstart',event=>{if(phase!=='model'||!modelReady){event.preventDefault();return;}scene.dataset.draggingNucleus='true';selectModelNucleus(false);event.dataTransfer?.setData('text/plain','onion-model-nucleus');if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setDragImage?.($('nucleus-cutaway'),40,35);}});
$('select-model-nucleus').addEventListener('dragend',()=>{scene.dataset.draggingNucleus='false';$('place-nucleus').dataset.over='false';renderModel();});
$('place-nucleus').addEventListener('dragover',event=>{if(phase==='model'&&modelSelected){event.preventDefault();$('place-nucleus').dataset.over='true';if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
$('place-nucleus').addEventListener('dragleave',()=>{$('place-nucleus').dataset.over='false';});
$('place-nucleus').addEventListener('drop',event=>{event.preventDefault();scene.dataset.draggingNucleus='false';$('place-nucleus').dataset.over='false';liftModelNucleus(event);});
for(const key of Object.keys(nucleusParts)){for(const prefix of ['part-','hit-'])$(prefix+key).addEventListener('click',()=>exploreNucleusPart(key));}
document.addEventListener('pointerdown',event=>{
 const within=selector=>Boolean(event.target?.closest?.(selector));let changed=false;if($('review-navigation').open&&!within('#review-navigation'))$('review-navigation').open=false;
 if(guideOpen&&!within('#interaction-guide,#guide-toggle')){closeGuide(false);changed=true;}
 if(infoKey&&!within('#object-info,[aria-controls="object-info"],#vacuole-shape,.part-hit')){closeObjectInfo(false);changed=true;}
 if(changed)renderModel();
});
$('guide-toggle').addEventListener('click',()=>guideOpen?closeGuide():openGuide());$('close-guide').addEventListener('click',()=>closeGuide());
$('close-object-info').addEventListener('click',()=>closeObjectInfo());
for(const [id,key] of [['vacuole-label','vacuole'],['vacuole-shape','vacuole'],['cell-wall-info','wall'],['cell-membrane-info','membrane']])$(id).addEventListener('click',()=>{if(phase==='model'&&modelReady)openObjectInfo(key,key==='vacuole'?$('vacuole-label'):$(id));});
previousScene.addEventListener('click',()=>navigateScene(-1));nextScene.addEventListener('click',()=>navigateScene(1));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('review-navigation').open){event.preventDefault();$('review-navigation').open=false;$('review-toggle').focus({preventScroll:true});return;}if(event.key==='Escape'&&guideOpen){event.preventDefault();closeGuide();return;}if(event.key==='Escape'&&infoKey){event.preventDefault();closeObjectInfo();return;}if(event.target?.closest?.('#object-info,#interaction-guide,#model-activity,#dna-learning'))return;if(event.altKey||event.ctrlKey||event.metaKey||$('settings').open||event.target?.matches?.('input,select,textarea,[contenteditable=true]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();navigateScene(event.key==='ArrowLeft'?-1:1);}});
pause.addEventListener('click',()=>{if(pause.disabled)return;if(phase==='assemble'&&navigationHold){navigationHold=false;scene.dataset.hold='false';setPaused(true);}else setPaused(!paused);});sound.addEventListener('click',toggleSound);
$('volume').addEventListener('input',()=>{masterVolume=Number($('volume').value)/100;musicMixer.setMaster(masterVolume);saveAudioPreference();if($('settings').open&&canPlayAudio()&&!musicMixer.running)playAudio();else syncSound();});
reduced.addEventListener('change',e=>{still=e.matches;updateMotion();});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){navigationHold=false;scene.dataset.hold='false';if(phase!=='idle')setPaused(true);stopAudio('paused');}});
new ResizeObserver(()=>{geometry();renderModel();}).observe(scene);
function loaded(){begin.disabled=false;$('skip-introduction').disabled=false;buttonContent(begin,'Begin exploration','arrow-right',true);geometry();}
cell.addEventListener('load',loaded,{once:true});cell.addEventListener('load',geometry);cell.addEventListener('error',()=>{$('detail-visual').textContent='The cell image could not load. Please reload.';begin.textContent='Image unavailable';});
if(cell.complete&&cell.naturalWidth)loaded();


function cancelShotTransition(){
 skinMatch=null;nuclearMatch=null;outgoingMotion=null;transitionStatic=false;scene.dataset.skinMatch='false';scene.dataset.skinMatchStage='none';
 for(const selector of ['.camera','.nuclear-camera']){const camera=document.querySelector?.(selector);if(camera){camera.style.maskImage='none';camera.style.zIndex='';camera.style.opacity='';}}
 transitioning=false;transitionTime=0;$('outgoing').replaceChildren();$('outgoing').style.opacity='0';$('outgoing').style.transform='none';
}
function startShotTransition(key){
 const oldSource=physicalSources[phase],newSource=physicalSources[key];
 const oldView=oldSource?'physical':phase==='teaser'?'teaser':nuclearPhases.includes(phase)?'nuclear':'cell';
 const newView=newSource?'physical':key==='teaser'?'teaser':nuclearPhases.includes(key)?'nuclear':'cell';
 const changes=oldSource!==newSource&&(oldSource||newSource)||oldView!==newView;
 if(key==='idle'||!changes||typeof getComputedStyle!=='function')return;
 const oldKey=phase,oldElapsed=['idle','teaser'].includes(phase)?titleTime:phaseElapsed,duration=oldSource?physicalDuration(phase):0;
 const matched=phase==='skin'&&key==='field'&&skinFocus?{...skinFocus}:null;
 const nuclearFocus=phase==='boundary'&&newView==='nuclear'?{x:parseFloat(nucleus.style.left)+parseFloat(nucleus.style.width)/2,y:parseFloat(nucleus.style.top)+parseFloat(nucleus.style.height)/2,width:parseFloat(nucleus.style.width),height:parseFloat(nucleus.style.height)}:null;
 const source=document.querySelector(oldView==='physical'?'.physical-camera':oldView==='teaser'?'.teaser-camera':oldView==='nuclear'?'.nuclear-camera':'.camera');
 // Snapshot before any incoming framing or cleanup can touch the visible source.
 const clone=source.cloneNode(true),sources=[source,...source.querySelectorAll('*')],clones=[clone,...clone.querySelectorAll('*')];
 const properties=['position','inset','top','right','bottom','left','width','height','display','opacity','transform','transform-origin','object-fit','object-position','filter','mask-image','mask-composite','background','border','border-radius','box-shadow','color','fill','stroke','stroke-width','overflow','font-size','line-height','padding'];
 sources.forEach((node,i)=>{const css=getComputedStyle(node),copy=clones[i];properties.forEach(name=>copy.style.setProperty(name,css.getPropertyValue(name)));copy.removeAttribute('id');copy.style.transition='none';copy.style.animation='none';if(node.id==='skin-cue')copy.style.visibility='hidden';});
 const before=getComputedStyle(source,'::before');if(before.content!=='none'&&parseFloat(before.opacity)>0){const layer=document.createElement('div');properties.forEach(name=>layer.style.setProperty(name,before.getPropertyValue(name)));clone.prepend(layer);}
 const initialTransform=getComputedStyle(source).transform;
 cancelShotTransition();skinMatch=matched;nuclearMatch=nuclearFocus;transitionStatic=still||paused;scene.dataset.skinMatch=String(Boolean(matched));
 if(oldSource&&oldKey!=='skin')outgoingMotion={node:clone,key:oldKey,elapsed:oldElapsed,duration};
 scene.dataset.handoffSource=initialTransform;scene.dataset.handoffClone=clone.style.transform;
 $('outgoing').replaceChildren(clone);$('outgoing').style.opacity='1';transitioning=true;transitionTime=0;
}

function buttonContent(button,label,icon,trailing=false){
 button.innerHTML=trailing?`<span>${label}</span><i data-icon="${icon}"></i>`:`<i data-icon="${icon}"></i><span>${label}</span>`;
 updateIcons(button);
}
function updateSpeed(){
 const oldHold=montageHold(),oldSegments=[oldHold,1600,oldHold];let remaining=phaseElapsed,index=0;while(index<2&&remaining>oldSegments[index])remaining-=oldSegments[index++];const fraction=remaining/oldSegments[index];
 narrationSpeed=Number($('speed').value);if(phase==='teaser'){const hold=montageHold(),segments=[hold,1600,hold];phaseElapsed=segments.slice(0,index).reduce((a,b)=>a+b,0)+fraction*segments[index];renderTeaser();}
 $('speed-value').textContent=`${narrationSpeed}×`;
 $('speed').setAttribute('aria-valuetext',`${narrationSpeed} times text reveal speed, ${Math.round(40*narrationSpeed)} characters per second`);
}
function returnToBeginning(){
 hasBegun=false;musicFinished=false;navigationHold=false;scene.dataset.hold='false';cancelShotTransition();
 if($('settings').open){settingsReturning=true;$('settings').close();}
 approach=0;cellEntry=1600;titleTime=0;modelReady=false;modelSelected=false;selectedPart='';scene.dataset.entry='false';paused=false;scene.dataset.paused='false';last=0;
 stopAudio(soundOn?'ready':'off');musicMixer.reset();setPhase('idle');cancelShotTransition();syncControls();geometry();
 $('status').textContent='Returned to opening.';begin.focus({preventScroll:true});
}

function readingDwell(key=phase){return Math.max(5500,captions[key][1].trim().split(/\s+/).length*300/narrationSpeed+1500);}
function openSettings(){settingsWasPaused=paused;paused=true;scene.dataset.paused='true';last=0;syncControls();$('settings-toggle').setAttribute('aria-expanded','true');$('settings').showModal();if(canPlayAudio()){if(!musicMixer.running)playAudio();else {audioState='playing';syncSound();}}else reconcileAudio();$('speed').focus({preventScroll:true});}
$('settings-toggle').addEventListener('click',openSettings);
$('close-settings').addEventListener('click',()=>$('settings').close());
$('settings').addEventListener('close',()=>{$('settings-toggle').setAttribute('aria-expanded','false');if(settingsReturning){settingsReturning=false;begin.focus({preventScroll:true});return;}setPaused(settingsWasPaused);$('settings-toggle').focus({preventScroll:true});});
$('settings').addEventListener('click',event=>{if(event.target===$('settings')){const rect=$('settings').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('settings').close();}});
buttonContent($('settings-toggle'),'Settings','settings');
buttonContent($('close-settings'),'Close settings','x');

$('speed').addEventListener('input',updateSpeed);
$('start-over').addEventListener('click',returnToBeginning);
buttonContent($('start-over'),'Start over','rotate-ccw');
buttonContent(previousScene,'Previous scene','chevron-left');buttonContent(nextScene,'Next scene','chevron-right');
updateSpeed();

const preloadedImages=[];
for(const src of new Set([...Object.values(physicalSources),'assets/onion-field.png','assets/onion-cell-clean.png','assets/teaser-human-epithelium.jpg','assets/onion-nuclear-interior.jpg','assets/illustrated-nucleus-cutaway.png'])){const image=new Image();image.src=src;if(typeof image.decode==='function')image.decode().catch(()=>{});preloadedImages.push(image);}
setPhase('idle');updateMotion();syncSound();geometry();if(!raf)raf=requestAnimationFrame(tick);


$('cytoplasm-intro').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-intro')));
for(let i=1;i<=3;i++){
 const aa=$('amino-'+i);aa.addEventListener('click',()=>chooseAminoAcid(i));
 aa.addEventListener('dragstart',event=>{chooseAminoAcid(i);if(!aminoSelected){event.preventDefault();return;}if(event.dataTransfer)event.dataTransfer.setData('text/plain','amino-acid');});
}
$('ribosome-target').addEventListener('dragover',event=>{if(phase==='protein'&&proteinStage==='build'&&aminoSelected){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
$('ribosome-target').addEventListener('drop',event=>{event.preventDefault();joinAminoAcid();});
$('sugar-substrate').addEventListener('click',useEnzyme);
for(const [i,key] of sceneOrder.entries()){const option=document.createElement('option');option.value=key;option.textContent=`${i+1} · ${captions[key][0]||'Back in the cell'}`;$('review-scene').append(option);}
function jumpToReviewScene(key){
 if(!sceneOrder.includes(key))return;if(key==='idle'){returnToBeginning();return;}
 start('model');if(key!=='model'){
  if(['explore','assemble',...learningPhases].includes(key)){holdScene('explore');modelReady=true;renderModel();}
  if(learningPhases.includes(key)&&key!=='dna-focus'){holdScene('dna-focus');geneSelected=key!=='gene';}
  holdScene(key);
 }
 $('review-navigation').open=false;
}
$('review-go').addEventListener('click',()=>jumpToReviewScene($('review-scene').value));

$('amino-info-label').addEventListener('click',()=>openObjectInfo('amino-acids',$('amino-info-label')));

$('exploration-next').append($('start-activity'));buttonContent($('start-activity'),'Complete the nucleus model','arrow-right',true);

for(const [id,key] of [['sucrose-info-label','sucrose'],['glucose-info-label','glucose'],['fructose-info-label','fructose'],['amino-feed-info-label','amino-acids']])$(id).addEventListener('click',()=>openObjectInfo(key,$(id)));
$('protein-label').addEventListener('click',()=>openObjectInfo(['job','reaction','done'].includes(proteinStage)?'enzyme-protein':'protein-chain',$('protein-label')));

$('protein-copy-reserve').textContent=proteinIntroText;
