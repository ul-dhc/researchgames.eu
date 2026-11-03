import {createBacterialRoute,bacterialScenes,bacterialCopy,bacterialProtein,bacterialDelivery,bacterialReward,bacterialRecap,bacterialRoles} from './bacterial.js?v=20261103-action-nav12';
import { createCellBranches } from './branches.js?v=20261103-action-nav12';
import { updateIcons } from './icons.js?v=20261103-action-nav12';
import { SoundtrackPlayer } from './ambient-mixer.js?v=20261103-action-nav12';
import {DNA_INSTRUCTIONS, CHROMATIN_DEFINITION, NUCLEOLUS_FUNCTION} from './cell-facts.js?v=20261103-action-nav12';
const $=id=>document.getElementById(id);
const scene=$('scene'),world=$('world'),cell=$('cell'),cue=$('cue'),nucleus=$('nucleus');
const physical=$('physical'),chooseCell=$('choose-cell');
chooseCell.classList.add('primary');$('story-actions').prepend(chooseCell);
const begin=$('begin'),pause=$('pause'),sound=$('sound'),ambient=$('ambient');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const centre={x:.265,y:.478},hit={x:.17,y:.36,w:.19,h:.23};
const captions={
 idle:['A world inside a cell','A short introduction to the world behind our molecular biology and microbiology games. Meet the cell, its key parts, and the instructions that help it work.'],
 teaser:['Life, at its smallest.','Every living organism is made of one or more cells. Cells are the basic units of life.'],
 world:['The living world.','Trees, mushrooms and other living things are made of cells. Most cells are too small to see with our eyes alone.'],
 people:['You are made of cells, too.','Your body is made of cells. So is the frog resting on this hand. Humans and other animals are made of many cells. Some living organisms are microscopic and consist of just one cell.'],
 chooser:['Which cell shall we explore?','Cells share some important features, but they are not all organised in the same way. Let’s look inside plant and bacterial cells.'],
 plant:['Inside a plant cell.','This onion bulb cell has a firm outer wall and a large central vacuole. Its nucleus sits in the thin surrounding cytoplasm.'],
 onion:['Our specimen.','Let’s explore the cellular world inside an onion bulb.'],
 scales:['Inside the bulb.','We now use a representative cutaway. Inside an onion bulb are fleshy layers called scales.'],
 skin:['The inner skin.','We follow the thin skin on the concave inner face of one fleshy onion scale – the face toward the bulb’s centre.'],
 field:['Under the microscope.','This illustrative microscope-style view represents the onion’s inner skin. Reveal the cell interior to look inside.'],
 establish:['You found one cell.','This representation reveals the cell’s large vacuole, thin surrounding cytoplasm and nucleus. The nucleus holds most of this cell’s DNA – the instructions that help the cell work.'],
 invite:['Meet the nucleus.','Select the small, darker nucleus beside the large pale vacuole to look closer.'],
 approach:['Beside the nucleus.','The cell wall and large vacuole remain beside us.'],
 boundary:['At the nuclear boundary.','A double membrane surrounds the nucleus. A cutaway reconstruction lets us look inside.'],
 inside:['Inside the nucleus.','Inside this onion cell’s nucleus, long DNA molecules are folded together with proteins.'],
 nucleolus:['The nucleolus.',NUCLEOLUS_FUNCTION],
 model:['An onion cell model.','The large vacuole stores water and helps keep the cell firm. A thin layer of cytoplasm surrounds it. Select the word labels to discover what the cytoplasm, nucleus and vacuole do.'],
 explore:['Explore the nucleus.','This cutaway model reveals the nuclear envelope and the structures inside the nucleus from our onion cell.'],
 assemble:['Complete the nucleus model.','We can use a simplified model to connect each part with its job.'],
 'dna-focus':['A closer look at DNA.','Inside the nucleus, DNA is folded and packed together with proteins. Let’s look more closely at the DNA.'],
 gene:['One section, one example.','A gene is a DNA section with instructions for something the cell uses. This shortened drawing represents part of a much longer gene for a protein – a molecule that does a job in the cell.'],
 message:['Copy the instructions.','This section of DNA contains instructions for making one protein. The cell makes an RNA copy of these instructions – a little like copying information on a computer.'],
 export:['Through a nuclear pore.','The prepared message can pass through a nuclear pore into the cytoplasm – the part of the cell outside the nucleus. A ribosome there reads it to help build a protein.'],
 protein:['A protein with a job.','Proteins do useful jobs. In this example, we’ll build an enzyme that helps split a sugar called sucrose. Amino acids are the building blocks; they are already in the cytoplasm.'],
 human:['Inside a human cheek cell.','This flattened cell lines the inside of your cheek. A flexible membrane surrounds its contents, including a nucleus and many smaller working structures.'],
 bacterial:['Inside E. coli.','This rod-shaped bacterium has no nucleus. Its DNA, which stores instructions, lies in an area called the nucleoid. Small structures called ribosomes make proteins that do jobs in the cell.'],
 roles:['Who does what?','You’ve met these four parts. Match each familiar illustration to the job it does.'],
};
let transcriptionHome=null,reviewMode=false,resettingVisit=false,aminoDrag=null;
const visitStates=new Map(),earnedTasks={plant:new Set(),bacterial:new Set()};
function earn(task){if(!reviewMode)earnedTasks[organism].add(task);}
function visitKey(key=phase){return (reviewMode?'review:':'learn:')+organism+':'+sceneName(key);}
function saveVisit(){if(resettingVisit)return;if(!['idle','teaser','world','people','chooser'].includes(phase))visitStates.set(visitKey(),plantSnapshot());}

let chooserInstant=true,chooserReadAt=-1,hoverCell='',hoverPart='',modelGeometry=null,modelEntryZoom=1;
let roleInitialized=false,roleSelected='',roleMatched=[],roleOrder=[],roleCardOrder=[],roleWrong='';
let phase='idle',approach=0,cellEntry=1600,paused=false,still=reduced.matches,soundOn=readAudioPreference().soundOn,last=0,revealTime=0,revealed=true,raf=0,audioState='ready',audioAttempt=0,hasBegun=false,narrationSpeed=1,transitioning=false,transitionTime=0,transitionDuration=1600,phaseHold=0,phaseElapsed=0,settingsWasPaused=false,settingsReturning=false,navigationHold=false,manualSceneHold=false,musicFinished=false,skinFocus=null,approachFrame=null,skinFrame=null,skinMatch=null,nuclearMatch=null,outgoingMotion=null,transitionStatic=false,incomingDecoded=true,visualLoadToken=0,nuclearTime=0,titleTime=0,modelReady=false,modelEntryStatic=false,modelSelected=false,liftStart=null,selectedPart='',infoKey='',infoTrigger=null,guideOpen=false,guideSeen=false,activityStarted=false,activityStep=0,activityPlaced=0,activityChoice='',activityCommitted=false,activityFeedback='',activityOrder=[],bridgeClock=0,learningClock=0,geneSelected=false,copyAt=-1,rnaMade=false,rnaSelected=false,rnaTravelAt=-1,rnaArrived=false,rnaExported=false,rnaTravelStage='',rnaDrag=null,rnaDragPosition=null,rnaStageStart=null,rnaTransportHint='',rnaDragEnded=0,learningGeometry=null,proteinCount=0,proteinCompletionReached=false,chromatinStart=null,controlsAwake=1200,copyExplained=false,proteinStage='purpose',aminoSelected=0,aminoUsed=[],proteinFoldAt=-1,sugarAt=-1,proteinFocusAt=-1,proteinEntryTop=null,proteinEntryHeight=null,proteinGrowAt=-1,proteinAddAt=-1,proteinGrowReadyAt=-1,proteinFoldReadyAt=-1,proteinReactionReadyAt=-1,rnaDeliveryExplained=false,rnaArrivalAt=-1,exploreInvited=false,exploreReadClock=0;
const physicalSources={idle:'assets/elodea-leaf-opening.webp',teaser:'assets/elodea-leaf-opening.webp',world:'assets/forest-mushroom-photo-1920.webp',people:'assets/frog-on-hand.webp',onion:'assets/onion-bulbs.webp',scales:'assets/onion-yellow-cutaway.webp',skin:'assets/onion-yellow-cutaway.webp'};
const photoPhases=['idle','world','people','onion'];
const learningPhases=['dna-focus','gene','message','export','protein'];
const nuclearPhases=['inside','nucleolus','model','explore','assemble','roles',...learningPhases];
const lookInside=$('look-inside');
const sceneOrder=Object.keys(captions).filter(k=>!['plant','human','bacterial'].includes(k));
const introSceneCount=sceneOrder.indexOf('chooser')+1;
// Presentation names only: phase keys and route snapshots remain stable.
function sceneName(key,route=organism,stage=proteinStage){
 const index=sceneOrder.indexOf(key);
 if(index>=0&&index<introSceneCount)return 'Intro '+(index+1);
 if(route==='bacterial')return 'C'+bacteria.number(key,stage);
 return 'A'+(index-introSceneCount+1);
}
const sequence=Object.fromEntries(sceneOrder.flatMap((key,i)=>!['idle','chooser','plant','human','bacterial','field','invite','boundary','model','explore','assemble','roles',...learningPhases].includes(key)?[[key,sceneOrder[i+1]]]:[]));
const previousScene=$('previous-scene'),nextScene=$('next-scene');
const navHint=document.createElement('p');navHint.id='navigation-feedback';navHint.hidden=true;navHint.setAttribute('role','status');$('story').append(navHint);
const reviewContext=document.createElement('p');reviewContext.id='review-context';reviewContext.hidden=true;$('story').prepend(reviewContext);
let organism='plant';
const isBacterial=()=>organism==='bacterial';
const bacteria=createBacterialRoute({scene,$,info:openObjectInfo,active:isBacterial,refresh:()=>renderModel(),activeInfo:()=>infoKey,ease:p=>Math.min(1,Math.max(0,p))**2*(3-2*Math.min(1,Math.max(0,p))),advance:()=>{resumeInteractiveMotion();setPhase(bacterialScenes[bacteria.number(phase,proteinStage)].id);}});
const branches=createCellBranches({scene,$,setPhase,holdScene,navigateTo:key=>holdScene(key,{preservePlayback:true}),revealFull,openObjectInfo,still:()=>still,paused:()=>paused,activeInfo:()=>infoKey,enterPlant:enterPlantRoute,organism:()=>organism,isReview:()=>reviewMode,selectOrganism,resetRoute:resetRouteState,enterBacterial:()=>enterPlantRoute('b-orient'),getSnapshot:plantSnapshot,restoreSnapshot:restorePlantSnapshot,beginSession:()=>{hasBegun=true;reconcileAudio();}});

for(const element of document.querySelectorAll('.part-label,.molecule-info-label,.structure-label,.b-science-label,.role-info,#vacuole-label,#cytoplasm-intro,#cytoplasm-location,#protein-label,#amino-info-label,#cell-wall-info,#cell-membrane-info,#ribosome-info-label,#rna-message>span'))element.classList.add('information-label');

let masterVolume=readAudioPreference().volume,currentTrack=readAudioPreference().track;
const soundtrackTracks=[
 {id:'tech-soft',src:'assets/pixabay-tech-soft-246307.mp3',voices:[ambient,$('ambient-alt')],loopStart:5,loopEnd:127},
 {id:'sci-fi',src:'assets/pixabay-sci-fi-ambient-589945.mp3',voices:[$('ambient-track2'),$('ambient-track2-alt')],loopStart:5,loopEnd:142}
];
const musicMixer=new SoundtrackPlayer(soundtrackTracks,{selected:currentTrack==='sci-fi'?1:0,onState:state=>{if(canPlayAudio()){audioState=state;syncSound();}},onFinish:()=>{if(phase==='roles'||phase==='protein'&&proteinCompletionReached){musicFinished=true;audioState='finished';}else audioState='error';syncSound();},onError:kind=>{audioState='error';if(kind==='initial')soundOn=false;if(kind==='switch'){currentTrack=soundtrackTracks[musicMixer.activeTrack].id;$('music-track').value=currentTrack;saveAudioPreference();}syncSound();$('status').textContent=kind==='switch'?'The selected track could not start. The previous music is still playing.':'Ambient sound could not continue. Toggle Sound off and on in Settings to retry.';}});
musicMixer.setMaster(masterVolume);$('volume').value=String(Math.round(masterVolume*100));$('music-track').value=currentTrack;
function syncControls(){
 const active=phase!=='idle'||!still,controlPaused=paused&&!(phase==='assemble'&&navigationHold);
 pause.disabled=!active;buttonContent(pause,controlPaused?'Resume':'Pause',controlPaused?'play':'pause');pause.setAttribute('aria-label',controlPaused?'Resume exploration':'Pause exploration');pause.setAttribute('title',controlPaused?'Resume exploration':'Pause exploration');
 previousScene.disabled=phase==='idle';nextScene.disabled=['idle','chooser','plant','human','bacterial','roles'].includes(phase);
 nucleus.hidden=!(phase==='invite'||phase==='approach'&&scene.dataset.nucleusReaction==='true');nucleus.disabled=phase!=='invite';nucleus.tabIndex=-1;nucleus.setAttribute('aria-hidden','true');$('guess-surface').hidden=phase!=='invite';$('guess-alternative').hidden=phase!=='invite';chooseCell.hidden=phase!=='field';$('cell-outline').hidden=true;
 lookInside.hidden=phase!=='boundary';renderControlsVisibility();
}
function renderControlsVisibility(){
 scene.dataset.controlsQuiet=String(!['idle','roles'].includes(phase)&&!proteinCompletionReached&&!paused&&!navigationHold&&!$('settings').open&&controlsAwake===0);
}
function wakeControls(){controlsAwake=1200;renderControlsVisibility();}
for(const event of ['pointermove','pointerdown','keydown'])document.addEventListener(event,eventInfo=>{if(eventInfo.target?.closest?.('nav'))wakeControls();},{passive:true});
function revealFull(){revealed=true;revealTime=Infinity;paintNarration(currentCopy()[1].length);syncControls();}
function setPhase(key,{staticEntry=false}={}){
 if(typeof aminoDrag!=='undefined')cancelAminoDrag();
 saveVisit();navHint.hidden=true;reviewContext.hidden=!reviewMode;reviewContext.textContent='Review scene · earlier activities are not marked complete.';scene.dataset.review=String(reviewMode);
 const bacterialView=isBacterial()?bacteria.captureView():null;
 hoverCell='';hoverPart='';
 if(key==='skin'){const r=$('specimen-view').getBoundingClientRect(),sr=scene.getBoundingClientRect();skinFrame=phase==='scales'?{x:r.left-sr.left,y:r.top-sr.top,width:r.width,height:r.height}:null;}
 if(!['invite','approach'].includes(key)){$('guess-feedback').hidden=true;$('guess-feedback').textContent='';}
 if(key!=='approach'){scene.dataset.nucleusReaction='false';}if(key==='invite'){$('guess-feedback').hidden=true;$('guess-alternative').open=false;}
 if(key==='chooser'){chooserInstant=still||paused||phase!=='people';chooserReadAt=-1;}
 if(['human','bacterial'].includes(key))key='chooser';
 branches.beforePhase(phase,key);
 scene.dataset.organism=['idle','teaser','world','people','chooser'].includes(key)?'common':organism;
 bacteria.syncPhase(key);hydratePhase(key);

 if(['model','explore','assemble','dna-focus','gene','message','export','protein','roles'].includes(key))warmRoleArtwork();
 const resumeProtein=key==='protein'&&phase==='roles'&&proteinStage==='done';
 proteinCompletionReached=resumeProtein||key==='roles'&&proteinStage==='done';
 if(key==='roles'&&!roleInitialized)resetRoleMatch();
 proteinEntryHeight=key==='protein'&&phase==='export'?$('nucleus-model').clientHeight:null;
 proteinEntryTop=key==='protein'&&phase==='export'&&Number.isFinite($('nucleus-model').offsetTop)?$('nucleus-model').offsetTop:null;
 if(key==='explore'){exploreInvited=true;exploreReadClock=0;}
 if(key!=='assemble')bridgeClock=0;
 if(key==='dna-focus'&&!isBacterial()){const panel=$('nucleus-model'),object=$('nucleus-object'),source=object.getBoundingClientRect(),sr=scene.getBoundingClientRect();chromatinStart={x:parseFloat(object.style.left)/panel.clientWidth,y:parseFloat(object.style.top)/panel.clientHeight,w:parseFloat(object.style.width)/panel.clientWidth,absoluteX:source.left-sr.left,absoluteY:source.top-(scene.clientWidth<650?0:sr.top),absoluteWidth:source.width};}
 rnaDrag=null;rnaDragPosition=null;rnaStageStart=null;rnaTransportHint='';if(learningPhases.includes(key)){if(!resumeProtein)learningClock=0;if(key==='gene')geneSelected=false;if(key==='message'){transcriptionHome=null;copyAt=-1;rnaMade=false;copyExplained=false;}if(key==='export'){rnaMade=true;rnaSelected=false;rnaTravelAt=-1;rnaArrived=false;rnaExported=isBacterial();rnaTravelStage='';rnaDeliveryExplained=false;rnaArrivalAt=-1;}if(key==='protein'&&!resumeProtein){bacterialChains=0;bacterialRepeatAt=-1;bacterialJoinAt=-1;rnaMade=true;rnaArrived=true;rnaExported=true;proteinCount=0;proteinStage='build';aminoSelected=0;aminoUsed=[];proteinFoldAt=-1;sugarAt=-1;proteinFocusAt=0;proteinGrowAt=-1;proteinAddAt=-1;}}
 if(key==='model'){modelEntryZoom=Number($('nuclear-world').style.transform.match(/scale\(([^)]+)\)/)?.[1])||1;liftStart=null;activityStarted=false;}if(key==='assemble'&&!activityStarted){activityStarted=true;activityStep=0;activityPlaced=0;activityChoice='';activityCommitted=false;activityFeedback='Choose the part by its job. Then place your choice in the model.';shuffleActivityChoices();}scene.dataset.liftReduced=String(key==='explore'&&still);
 closeObjectInfo(false);closeGuide(false);
 if(['model','explore','assemble',...learningPhases].includes(key)){modelEntryStatic=still||paused;modelReady=modelEntryStatic;if(key==='model'){modelSelected=false;selectedPart='';}}else modelReady=false;
 const wasNuclear=nuclearPhases.includes(phase);startShotTransition(key);phase=key;if(nuclearPhases.includes(key)&&!wasNuclear)nuclearTime=0;phaseHold=0;phaseElapsed=0;scene.dataset.phase=key;scene.dataset.hold=String(navigationHold);bacteria.enter(key,{view:bacterialView,staticEntry:staticEntry||still});
 if(isBacterial()&&key==='dna-focus')modelEntryStatic=staticEntry||still;
 const isPhysical=key in physicalSources;scene.dataset.photo=String(photoPhases.includes(key));scene.dataset.view=isPhysical?'physical':key==='teaser'?'teaser':key==='field'?'field':nuclearPhases.includes(key)?'nuclear':'cell';
 if(key==='skin')document.querySelector?.('.physical-camera')?.style.setProperty('transform','none');
 prepareVisual(key);renderPhysicalMotion();renderNuclear();
 $('skin-cue').hidden=key!=='skin';$('skin-patch').hidden=true;if(key!=='skin'){for(const prop of ['left','top','width','height','transform'])$('specimen-view').style[prop]='';}$('teaser-description').hidden=key!=='teaser';
 document.querySelector?.('header')?.toggleAttribute('hidden',false);$('scene-number').textContent=sceneName(key);
 $('image-notice').textContent=key==='idle'?'Illustrative Elodea leaf cells':photoPhases.includes(key)?'':key==='teaser'?'Illustrative cell reconstruction':isPhysical?'Illustrative cutaway':key==='boundary'?'Illustrative cutaway reconstruction':nuclearPhases.includes(key)?'Representative nuclear interior':key==='teaser'?'Illustrative cell reconstruction':key==='field'?'Illustrative microscope-style view':'Artistic reconstruction';
 $('location').textContent=key==='idle'?'':photoPhases.includes(key)?'':key==='teaser'?'':isPhysical?'Representative onion / inner skin':key==='field'?'Inner skin / adjoining cells':nuclearPhases.includes(key)?'Same onion cell / inside the nucleus':'One onion cell / nucleus';
 renderTeaser();geometry();renderCellEntry();
 const copy=currentCopy();$('caption').textContent=copy[0];$('caption').hidden=!copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];reserveSceneNarration(key);
 begin.hidden=key!=='idle';$('skip-introduction').hidden=key!=='idle';$('review-navigation').hidden=key!=='idle';if(key!=='idle'){$('review-navigation').open=false;$('review-toggle').setAttribute('aria-expanded','false');}$('return-cells').hidden=['idle','teaser','world','people','chooser'].includes(key);
 cue.hidden=true;
 revealTime=0;revealed=still||paused||key==='idle';paintNarration(revealed?copy[1].length:0);
 $('narration-live').textContent=key==='idle'?'':copy.join(' ');
 renderModel();if(branches.isInspection(key)||key==='chooser'&&chooserInstant)revealFull();renderChooserReveal();syncControls();if(scene.clientWidth<650)scene.scrollIntoView?.({block:'start',behavior:'auto'});
 musicMixer.setLoopAllowed(key!=='roles'&&!resumeProtein);if(musicFinished&&key!=='roles'&&!resumeProtein){musicFinished=false;musicMixer.reset();}
 if((skinMatch||nuclearMatch)&&!transitionStatic)renderFocusTransition(0);
 if(transitionStatic&&incomingDecoded){cancelShotTransition();syncControls();}
}
function montageHold(speed=narrationSpeed){return Math.max(1600,Math.min(3600,2400/speed));}
function montageTotal(){return 2*montageHold()+1600;}
function renderTeaser(){
 const p=phase==='teaser'&&!still?Math.min(1,Math.max(0,(phaseElapsed-montageHold())/1600)):0;
 const blend=p*p*(3-2*p);$('teaser-purple').style.opacity=String(blend);
 scene.dataset.montageShot=blend===1?'purple':'green';
}
function physicalDuration(key){return Math.max(9000,captions[key][1].length*25/narrationSpeed+readingDwell(key));}
function physicalTransform(key,elapsed,duration){
 if(still)return 'none';
 const t=Math.max(0,elapsed)/1000;
 if(key==='people'){const p=Math.min(1,Math.max(0,elapsed/duration));return `translate3d(0,${-.6*p}px,0) scale(1)`;}
 if(key==='idle'||key==='teaser'){
  // Different drift rates keep the framing continuous without a repeating loop.
  // Bounds leave overscan on every edge, however long the opening stays onscreen.
  const x=2*Math.cos(t/20+.55)+.6*Math.sin(t/20*Math.SQRT2+2.1);
  const y=.65*Math.sin(t/32+.2)+.25*Math.sin(t/32*Math.sqrt(3)+1.2);
  const zoom=1.075+.012*Math.sin(t/20+.55)+.002*Math.sin(t/20*Math.sqrt(3)+.3);
  return `translate3d(${x}%,${y}%,0) scale(${zoom})`;
 }
 const progress=elapsed/duration;return `translate3d(0,${-3*progress}px,0) scale(${1+.028*progress})`;
}
function renderPhysicalMotion(){
 if(!(phase in physicalSources)||phase==='skin')return;
 const camera=document.querySelector?.('.physical-camera');if(camera){camera.style.transformOrigin=phase==='onion'?'48% 80%':'center 45%';camera.style.transform=physicalTransform(phase,['idle','teaser'].includes(phase)?titleTime:phaseElapsed,physicalDuration(phase));}
}
function renderNuclear(){
 // One inward move, shared across nuclear scenes. It settles once and never loops.
 const progress=Math.min(1,nuclearTime/30000),zoom=phase==='model'&&!modelEntryStatic&&!still?modelEntryZoom+(1-modelEntryZoom)*ease(phaseElapsed/1800):1+.08*progress*progress*(3-2*progress);
 $('nuclear-world').style.transform=`scale(${zoom})`;
 $('chromatin-drift').style.transform='none';
}
const dnaDefinition=DNA_INSTRUCTIONS;
const nucleusParts={
 envelope:{name:'Nuclear envelope.',text:'Two membranes form the nuclear envelope, enclosing the nucleus and separating its DNA from the cytoplasm. Nuclear pores regulate exchange across this boundary.',point:[.52,.065],label:[.52,0],halo:[.24,.20,.11,.045]},
 pores:{name:'Nuclear pores.',text:'Nuclear pores are regulated passages through the envelope. They help control which molecules enter and leave the nucleus.',point:[.96,.48],label:[.94,.24],halo:[.96,.48,.045,.06]},
 nucleolus:{name:'Nucleolus.',text:NUCLEOLUS_FUNCTION+' Ribosomal RNA (rRNA) forms part of ribosomes. Ribosome parts leave the nucleus and enter the cytoplasm.',point:[.70,.34],label:[.66,.47],halo:[.70,.34,.14,.17]},
 dna:{name:'DNA + proteins.',text:CHROMATIN_DEFINITION,point:[.40,.67],label:[.20,.73],halo:[.40,.67,.17,.14]},
 nucleoplasm:{name:'Nucleoplasm.',text:'Nucleoplasm is the fluid-like material inside the nucleus. This fluid environment surrounds chromatin (DNA with proteins) and the nucleolus.',point:[.81,.63],label:[.81,.86],halo:[.81,.63,.08,.09]}
};
const cellParts={
 vacuole:{name:'Vacuole',text:'This large, fluid-filled compartment stores water and other substances. Water inside it helps keep the plant cell firm.'},
 nucleus:{name:'Nucleus',text:'The nucleus holds most of this cell’s DNA – the molecule that stores its genetic instructions.'},
 wall:{name:'Cell wall',text:'The firm outer wall supports and protects the plant cell. Neighbouring cells share a closely joined boundary.'},
 membrane:{name:'Cell membrane',text:'This thin boundary lies just inside the wall. It helps control which substances enter and leave the cell.'}
};
const proteinIntroText='The enzyme we’re going to build is a protein that helps a chemical reaction happen. The ribosome joins amino acids in the cytoplasm. The RNA message determines which amino acid comes next. The cell makes these building blocks or recycles them from old proteins.';
const proteinNarratives={
 build:['Build a protein.',proteinIntroText],
 growing:['The chain keeps growing.','The ribosome keeps following the messenger RNA and joining more amino acids. Parts of the growing chain begin to fold as they emerge.'],
 chain:['Ready to become a working protein.','The ribosome has continued building the chain. Now we can finish folding it and release the protein.'],
 folding:['Taking shape.','The chain folds beside the ribosome. When it is ready, the folded protein is released.'],
 job:['This protein is an enzyme.','Now let’s put it to work! Here is sucrose, a sugar. Bring it to the enzyme and watch what happens.'],
 reaction:['The enzyme meets sucrose.','The enzyme helps split sucrose into two smaller sugars. Watch them separate and move away.'],
 done:['From instructions to a useful job.','The cell can break down these smaller sugars to release energy, or use them to build materials it needs. You’ve followed the instructions from DNA to a working protein.\n\nLet’s see how the parts worked together.'],
};
const deliveryNarrative=['A message the ribosome can read.','Now let’s use its instructions to build a protein.'];
function currentCopy(){
 if(reviewMode&&phase==='protein'&&proteinStage==='done')return ['A protein doing its job.','This enzyme splits a sugar into smaller sugars. DNA instructions can be copied into RNA, which a ribosome reads to build a protein.'];
 if(phase==='establish'&&!earnedTasks.plant.has('cell'))return ['One onion cell.',captions.establish[1]];
 if(isBacterial()&&!['idle','teaser','world','people','chooser'].includes(phase)){if(phase==='roles'&&roleMatched.length===4)return bacterialReward;if(phase==='protein'){if(proteinStage==='collect')return [bacterialChains===1?'One chain is not enough.':'Make four matching chains.',`${bacterialChains} of the 4 protein chains ${bacterialChains===1?'is':'are'} ready. Use the same message and ribosome to make the next matching chain.`];return bacterialProtein[proteinStage]||bacterialProtein.build;}if(phase==='export'&&rnaDeliveryExplained)return bacterialDelivery;if(phase==='message'&&copyExplained)return ['A message to read.','This copy is messenger RNA, or mRNA. Ribosomes read its instructions to build protein chains.'];return bacterialCopy[phase]||captions[phase];}
 if(phase==='roles'&&roleMatched.length===4)return ['Well done!','You’ve matched these four parts to their jobs. You’re ready to explore the next challenge.'];
 if(phase==='message'&&copyExplained)return ['A message to carry.','This temporary copy is called messenger RNA, or mRNA. It carries these instructions to a ribosome.'];
 if(phase==='export'&&rnaDeliveryExplained)return deliveryNarrative;
 if(phase==='protein')return proteinNarratives[proteinStage]||proteinNarratives.build;
if(phase==='assemble'&&activityPlaced===3)return ['Well done!','Now let’s take a closer look at DNA – and discover how its instructions help the cell make proteins.'];return captions[phase];}
function openObjectInfo(key,trigger){
 if(isBacterial())key=({sucrose:'lactose',fructose:'galactose'})[key]||key;
 const part=(isBacterial()&&bacteria.facts[key])||branches.facts[key]||nucleusParts[key]||cellParts[key]||learningFacts[key];if(!part)return;closeGuide(false);
 if(infoTrigger)infoTrigger.setAttribute('aria-expanded','false');infoKey=key;infoTrigger=trigger;trigger?.setAttribute('aria-expanded','true');$('object-info-title').textContent=part.name.replace(/\.$/,'');$('object-info-text').textContent=part.text;
 $('object-info').hidden=false;scene.dataset.infoOpen='true';renderModel();$('close-object-info').focus({preventScroll:true});if(scene.clientWidth<650){if(isBacterial()&&bacteria.early.includes(phase)){const bottom=$('object-info').getBoundingClientRect().bottom;if(bottom>innerHeight-100)window.scrollBy({top:bottom-(innerHeight-100),behavior:still?'auto':'smooth'});}else $('object-info').scrollIntoView?.({block:'nearest',behavior:still?'auto':'smooth'});}
}
function closeObjectInfo(restore=true){
 $('object-info').hidden=true;scene.dataset.infoOpen='false';infoKey='';if(isBacterial())bacteria.clearPreview();selectedPart='';infoTrigger?.setAttribute('aria-expanded','false');
 if(restore){renderModel();infoTrigger?.focus({preventScroll:true});}infoTrigger=null;
}
function closeGuide(restore=true){guideOpen=false;$('interaction-guide').hidden=true;$('guide-toggle').setAttribute('aria-expanded','false');scene.dataset.guideOpen='false';if(restore){renderModel();$('guide-toggle').focus({preventScroll:true});}}
function proteinGuide(){return {build:'The amino acids shown represent building blocks already in the cytoplasm; only a few are drawn. The RNA message determines which amino acid comes next. Drag its highlighted amino acid to the ribosome, or select it and then select the ribosome. After three illustrative joins, the ribosome continues building a much longer chain. Only a few building blocks are drawn. Select a biological label to learn about it.',growing:'Close Guide to watch the ribosome continue joining amino acids. When the chain is ready, choose Fold and release the protein.',chain:'Choose Fold and release the protein to watch the chain take shape and leave the ribosome.',folding:'Close Guide to watch the same chain finish folding and release. Then you can put the enzyme to work.',job:'Select the sucrose molecule to send it to the enzyme. Select the Sucrose or Protein label to learn about it.',reaction:'Close Guide to watch sucrose meet the enzyme and split into two smaller sugars.',done:'You’ve completed this activity. Choose Match the parts to their jobs to recall how they worked together. Try another sucrose repeats the reaction. Select Glucose, Fructose or Protein to learn about them.'}[proteinStage]||learningGuide.protein;}
function openGuide(){
 closeObjectInfo(false);guideOpen=true;guideSeen=true;scene.dataset.guideSeen='true';scene.dataset.guideOpen='true';
 $('guide-text').textContent=(isBacterial()&&bacteria.guide(phase,proteinStage))||branches.guide(phase)||(phase==='roles'?'Select an illustration, then the job that matches it. You can use Tab and Enter or Space. A correct pair stays together; a different choice keeps your matches and gives a hint. About labels explain the biology. Match all four to follow how the instructions are used, or choose Match again to replay.':phase==='model'?'Select a name label to learn about a structure. Choose “Lift out the nucleus” to explore it, or select the nucleus and place it in the inspection area. You can also drag it there.':learningPhases.includes(phase)?(phase==='protein'?proteinGuide():learningGuide[phase]):phase==='assemble'?'Choose the part that matches the job. Tap it, then tap “Place selected part”, or drag it into the model. Each correct placement opens the next question immediately. After the last part, read the narrator’s bridge and choose “Continue”.':phase==='explore'?'Select any labelled part to learn about it. Another selection replaces the information window. When you’re ready, choose “Complete the nucleus model” for the first challenge. “Back to cell model” returns to the cell.':'Use Next or Previous scene to follow this illustrative view of the same onion nucleus.');
 if(['protein','roles'].includes(phase))$('guide-text').textContent+=' This example protein is an enzyme. Other proteins act as signals, receptors, transporters or structural supports.';
 $('guide-text').textContent+=' The detailed cell and nucleus views are artistic scientific reconstructions with illustrative colours and simplified structures, not microscope photographs.';if(['inside','nucleolus','explore','assemble'].includes(phase))$('guide-text').textContent+=' Ribosomal RNA (rRNA) forms part of ribosomes. The nucleolus makes rRNA and assembles ribosome parts, which leave for the cytoplasm.';
 $('interaction-guide').hidden=false;$('guide-toggle').setAttribute('aria-expanded','true');renderModel();$('close-guide').focus({preventScroll:true});
}
const ease=p=>{const q=Math.min(1,Math.max(0,p));return q*q*(3-2*q);};
function renderModel(){
 bacteria.syncPhase(phase);
 const modelFocus=$('nucleus-model').contains(document.activeElement)?document.activeElement:null;
 if(phase==='protein'){$('protein-workbar').hidden=false;$('protein-work-cue').hidden=false;}
 // Measure the story so the model follows its real height, including changing process copy.
 renderReturnPlacement();
 const story=$('story');
 const storyEnd=story.offsetTop+story.offsetHeight+(phase==='protein'?16:28);
 if(Number.isFinite(storyEnd)&&scene.dataset.storyEnd!==String(storyEnd)){scene.dataset.storyEnd=String(storyEnd);scene.style.setProperty('--story-end',`${storyEnd}px`);}
 renderRoleMatch();
 const visualPart=phase==='explore'?(hoverPart||selectedPart):'';
 const visible=['model','explore','assemble',...learningPhases].includes(phase),inspecting=['explore','assemble',...learningPhases].includes(phase),panel=$('nucleus-model');panel.hidden=!visible;panel.inert=!visible;panel.dataset.infoSurface=!isBacterial()&&['model','explore','export'].includes(phase)?'light':'dark';$('guide-toggle').hidden=!visible&&!['roles','inside','nucleolus'].includes(phase);
 const blend=!visible?0:phase!=='model'||modelEntryStatic||still?1:ease(phaseElapsed/1800),lift=!inspecting?0:modelEntryStatic||still||phase==='assemble'||learningPhases.includes(phase)?1:ease((phaseElapsed-(liftStart?.landed?160:0))/1500);
 panel.style.opacity=String(blend);panel.style.translate='none';
 const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.filter=visible?`blur(${3*blend}px) brightness(${1-.60*blend}) saturate(${1-.12*blend})`:'none';
 if(visible&&(modelEntryStatic||still||phaseElapsed>=(phase==='model'?1800:1660)))modelReady=true;
 scene.dataset.modelVisible=String(visible);scene.dataset.modelBlend=String(blend);scene.dataset.modelReady=String(visible&&modelReady);scene.dataset.nucleusLift=String(lift);scene.dataset.nucleusSelected=String(modelSelected);scene.dataset.envelopeActive=String(visualPart==='envelope');scene.dataset.activePart=visualPart;$('envelope-outline').style.display=phase==='explore'?'':'none';
 const entryFocus=proteinFocusProgress(),entryPortrait=scene.clientWidth<650,viewportHeight=typeof innerHeight==='number'?innerHeight:scene.clientHeight;if(phase==='protein'){panel.style.transition='none';const compact=entryPortrait||scene.clientWidth<1100,base=proteinEntryHeight??(compact?350:Math.max(300,Math.min(580,viewportHeight-(Number.isFinite(storyEnd)?storyEnd:255)-155))),end=compact?500:Math.max(300,Math.min(580,viewportHeight-(Number.isFinite(storyEnd)?storyEnd:255)-155))-25;panel.style.height=`${base+(end-base)*entryFocus}px`;panel.style.top=entryPortrait?'auto':`${(Number.isFinite(storyEnd)?storyEnd:255)+8*entryFocus}px`;}else{panel.style.height='';panel.style.top='';panel.style.transition='';}
 if(isBacterial()&&phase==='protein'&&!entryPortrait){const top=storyEnd+6;panel.style.top=top+'px';panel.style.height=Math.max(330,viewportHeight-top-65)+'px';}
 const mw=panel.clientWidth,mh=panel.clientHeight,portrait=scene.clientWidth<650,ratio=1.25;
 const cw=Math.min(mw*(portrait?.98:.68),mh*(portrait?.62:.96)*1100/600),ch=cw*600/1100,cx=0,cy=portrait?0:(mh-ch)/2;
 const cellModel=$('cell-game-model');cellModel.style.width=`${cw}px`;cellModel.style.height=`${ch}px`;cellModel.style.left=`${cx}px`;cellModel.style.top=`${cy}px`;cellModel.style.opacity=String(1-.86*lift);cellModel.style.transform=`scale(${1-.45*lift})`;
 const ox=cx+cw*220/1100,oy=cy+ch*322/600,ow=cw*.13,oh=ow/ratio;
 const labelLane=portrait&&phase==='explore'?70:0;
 const nw=Math.min(mw*(portrait?.98:phase==='assemble'?.75:.43),(mh-labelLane)*ratio*.98),nh=nw/ratio,nx=(mw*(portrait||phase==='assemble'?1:.75)-nw)/2,ny=labelLane+(mh-labelLane-nh)/2;
 const pr=panel.getBoundingClientRect(),sr=scene.getBoundingClientRect();
 const sx=liftStart?liftStart.sceneX-(pr.left-sr.left):ox-ow/2,sy=liftStart?liftStart.sceneY-(pr.top-sr.top):oy-oh/2;
 const startW=liftStart?.width||ow,startH=liftStart?.height||oh;
 let w=startW+(nw-startW)*lift,h=startH+(nh-startH)*lift,x=sx+(nx-sx)*lift,y=sy+(ny-sy)*lift;
 if(['dna-focus','gene','message'].includes(phase)){const zoom=1+.08*(phase==='dna-focus'&&!modelEntryStatic&&!still?ease(learningClock/2200):1);x-=w*.4*(zoom-1);y-=h*.67*(zoom-1);w*=zoom;h*=zoom;}
 if(['export','protein'].includes(phase)&&portrait){const p=phase==='protein'||modelEntryStatic||still?1:ease(learningClock/1600);x-=mw*.40*p;}
 if(portrait){w=Math.min(w,mw*.99);h=w/ratio;if(!['export','protein'].includes(phase))x=Math.max(0,Math.min(mw-w,x));y=Math.max(0,Math.min(mh-h,y));}
 if(phase==='explore'&&!portrait)x=Math.max(166,Math.min(mw-w-165,x));
 if(phase==='explore'){const ghost=cellModel.getBoundingClientRect(),labelLeft=pr.left+x+w*.52-(portrait?100:145)/2,shift=Math.max(0,ghost.right-labelLeft+16);cellModel.style.left=`${cx-shift}px`;}
 const object=$('nucleus-object');object.style.left=`${x}px`;object.style.top=`${y}px`;object.style.width=`${w}px`;object.style.height=`${h}px`;
 const cyto=$('cytoplasm-intro');cyto.hidden=phase!=='model';cyto.style.left=`${cw*.24+12}px`;cyto.style.top=`${cy+ch*.10}px`;cyto.disabled=false;cyto.setAttribute('aria-pressed',String(infoKey==='cytoplasm'));$('cell-game-model').dataset.cytoplasmActive=String(infoKey==='cytoplasm');
 const pick=$('select-model-nucleus');pick.hidden=phase!=='model';pick.disabled=false;pick.setAttribute('aria-pressed',String(modelSelected));pick.querySelector('span').textContent=modelSelected?'Nucleus selected':'Select nucleus';
 const nucleusInfo=$('model-nucleus-info');if(nucleusInfo.parentElement!==panel)panel.append(nucleusInfo);nucleusInfo.hidden=phase!=='model';nucleusInfo.style.left=`${Math.max(2,cx+cw*.24-80)}px`;nucleusInfo.style.top=`${cy+ch*.10}px`;
 const place=$('place-nucleus');place.hidden=phase!=='model';place.setAttribute('aria-disabled',String(!modelSelected));place.tabIndex=modelSelected?0:-1;place.style.left=`${mw*(portrait?.57:.76)}px`;place.style.top=`${mh*(portrait?.58:.17)}px`;place.style.width=`${mw*(portrait?.41:.23)}px`;place.style.height=`${mh*(portrait?.39:.66)}px`;
 $('vacuole-label').hidden=phase!=='model';$('vacuole-label').disabled=phase!=='model';$('vacuole-label').setAttribute('aria-pressed',String(infoKey==='vacuole'));$('vacuole-shape').setAttribute('stroke',infoKey==='vacuole'?'#f1cf7f':'#ac9aa9');$('vacuole-shape').setAttribute('stroke-width',infoKey==='vacuole'?'6':'2');
 $('cell-wall-shape').setAttribute('stroke',infoKey==='wall'?'#f1cf7f':'#8c7b78');$('cell-wall-shape').setAttribute('stroke-width',infoKey==='wall'?'9':'5');$('cell-membrane-shape').setAttribute('stroke',infoKey==='membrane'?'#f1cf7f':'#8b7c90');$('cell-membrane-shape').setAttribute('stroke-width',infoKey==='membrane'?'7':'3');
 $('cell-wall-info').disabled=!modelReady||phase!=='model';$('cell-membrane-info').disabled=!modelReady||phase!=='model';$('cell-boundary-key').hidden=true;
 $('return-cell').hidden=!['explore','assemble'].includes(phase);$('start-activity').hidden=phase!=='explore';$('exploration-next').hidden=phase!=='explore';$('exploration-secondary').hidden=phase!=='explore';const backHost=phase==='explore'?$('exploration-secondary'):$('story-actions');if($('return-cell').parentElement!==backHost)backHost.append($('return-cell'));
 modelGeometry={mw,mh,x,y,w,h,portrait};renderNucleusCues(modelGeometry);

 renderCellCues({mw,mh,cw,ch,cx,cy});
 renderActivity();renderLearning({mw,mh,x,y,w,h,portrait});
 branches.render(phase);bacteria.renderEarly(phase,phaseElapsed,still,infoKey);bacteria.matching(roleSelected);$('scene-number').textContent=sceneName(phase);if(isBacterial()&&!['idle','teaser','world','people','chooser'].includes(phase)){$('location').textContent='Same E. coli cell · cytoplasm';$('image-notice').textContent='E. coli cutaway';if(bacteria.early.includes(phase))$('guide-toggle').hidden=false;}
 if(visible&&!isBacterial()){$('image-notice').textContent='Reconstruction + inspection model';$('location').textContent=['export','protein'].includes(phase)?'Same onion cell · cytoplasm':inspecting?'Nucleus from the same onion cell':'Onion bulb cell';}
 if(modelFocus&&document.activeElement===document.body&&modelFocus.checkVisibility({visibilityProperty:true})&&!modelFocus.disabled&&!modelFocus.closest('[inert]'))modelFocus.focus({preventScroll:true});
}
const activitySteps=[
 {key:'dna',question:'Which part contains the genetic instructions that help the cell work?',placed:'These folded DNA molecules are packed with proteins. Together, this material is called chromatin. DNA stores genetic instructions.'},
 {key:'nucleolus',question:'Which part helps make the small structures that build proteins?',placed:'The nucleolus makes ribosomal RNA and assembles ribosome parts. These parts leave the nucleus for the cytoplasm, where ribosomes build proteins.'},
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
 $('activity-next').hidden=!complete;$('activity-next').disabled=complete&&!bridgeReady();$('activity-next-label').textContent='Look closer at DNA';$('activity-next').setAttribute('aria-label','Continue: look closer at DNA');
}
function chooseActivityPart(key){
 if(phase!=='assemble'||activityCommitted)return;activityChoice=key;
 if(key===activitySteps[activityStep].key)activityFeedback='Yes – that part matches the job. Place it in the model.';
 else {const role={dna:'DNA with proteins stores genetic instructions.',nucleolus:'The nucleolus makes ribosomal RNA and assembles ribosome parts.',envelope:'The nuclear envelope is the two-membrane boundary around the nucleus.',pores:'Pores are regulated passages through the nuclear envelope, rather than the whole boundary.',nucleoplasm:'Nucleoplasm is the fluid-like material around chromatin and the nucleolus.'};const hint=['Look for the folded material that stores information.','Look for the darker region that helps make ribosome parts.','Look for the boundary with pores.'][activityStep];activityFeedback='Try again. '+role[key]+' '+hint;}
 renderActivity();
}
function bridgeReady(){return phase==='assemble'&&activityPlaced===3;}
function placeActivityPart(){
 if(phase!=='assemble'||activityCommitted||activityChoice!==activitySteps[activityStep].key)return;
 const placed=activityStep;activityPlaced=placed+1;
 if(placed<2){activityFeedback='Added '+(placed===0?'DNA + proteins. ':'the nucleolus. ')+activitySteps[placed].placed;activityStep++;activityChoice='';shuffleActivityChoices();renderActivity();$('activity-question').focus({preventScroll:true});return;}
 activityCommitted=true;activityFeedback='';bridgeClock=0;const copy=currentCopy();$('caption').hidden=false;$('caption').textContent=copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];$('narration-live').textContent=copy.join(' ');revealTime=0;revealed=still||paused;paintNarration(revealed?copy[1].length:0);renderModel();syncControls();if(scene.clientWidth<650){$('caption').tabIndex=-1;$('caption').focus({preventScroll:true});scene.scrollIntoView?.({block:'start',behavior:still?'auto':'smooth'});}
}
function resumeInteractiveMotion(){manualSceneHold=false;if(navigationHold){navigationHold=false;paused=false;scene.dataset.hold='false';scene.dataset.paused='false';last=0;syncControls();reconcileAudio();}}
function nextActivityStep(){if(bridgeReady()){resumeInteractiveMotion();setPhase('dna-focus');pause.focus({preventScroll:true});}}
const learningGuide={
 'dna-focus':'Follow the DNA double helix, then choose Explore a gene to examine one section.',
 gene:'Select the highlighted DNA section after reading about genes. Then choose Follow these instructions to copy them into messenger RNA.',
 message:'The broad highlighted region represents part of a much longer gene; the few drawn rungs are not a whole literal gene. The RNA drawing is also shortened. The highlighted DNA section contains the instructions to copy. Choose Copy instructions beside it, then Follow the message to take the separate messenger RNA through a pore.',
 export:'Select the highlighted nuclear pore. After messenger RNA passes through, select the ribosome to deliver it. Use the small information labels to learn about the message, cytoplasm or ribosome.',
 protein:'Drag the amino acid specified by the message to the ribosome or select a building block and then the ribosome. After the chain forms, fold and release it, then bring sucrose to the enzyme.'
};
const learningFacts={
 'enzyme-protein':{name:'Protein',text:'This protein is an enzyme: it helps a chemical reaction happen. In our example it splits sucrose into glucose and fructose. It is not used up by the reaction. Other proteins act as signals, receptors, transporters or structural supports; not all proteins are enzymes.'},
 glucose:{name:'Glucose',text:'Glucose is one of the two smaller sugars released when sucrose splits. The cell can break it down to release energy or use it to build materials it needs.'},
 fructose:{name:'Fructose',text:'Fructose is the other smaller sugar released when sucrose splits. The cell can use it in reactions that release energy or make materials it needs.'},
 sucrose:{name:'Sucrose',text:'Sucrose is a sugar made from two linked smaller sugars: glucose and fructose. Our enzyme helps split it into those two sugars.'},
 'protein-chain':{name:'Growing protein chain',text:'A protein begins as a chain of amino acids. The ribosome joins them in the order given by messenger RNA. Parts of the chain can start folding as it grows.'},
 'amino-acids':{name:'Amino acids',text:'Amino acids are small building blocks used to make proteins. Plant cells make amino acids from other molecules. Breaking down old proteins also releases amino acids that can be used again. Available amino acids in the cytoplasm can be brought to a ribosome, which joins them following messenger RNA instructions.'},
 'messenger-rna':{name:'Messenger RNA',text:'Messenger RNA, or mRNA, carries a temporary copy of a gene’s instructions from DNA to a ribosome, which uses them to build a protein. RNA stands for ribonucleic acid. Other kinds of RNA have other jobs. The DNA stays in the nucleus.'},
 cytoplasm:{name:'Cytoplasm',text:'Cytoplasm is the part of this cell outside the nucleus but inside the cell membrane. Many essential activities, including making proteins, happen here. In this view, a thin layer surrounds the large vacuole.'},
 ribosome:{name:'Ribosome',text:'This ribosome in the cytoplasm uses the messenger RNA instructions to join small building blocks, called amino acids, into a separate protein chain.'},
 gene:{name:'Gene',text:'A gene is a DNA section containing instructions for a functional product – something the cell uses. This example holds instructions for a protein. Other genes have other products.'},

 export:{name:'Nuclear pore',text:'A nuclear pore is a regulated passage through the nuclear envelope. Prepared messenger RNA can pass through it into the cytoplasm.'},

 'dna-focus':{name:'DNA',text:CHROMATIN_DEFINITION+' DNA’s two strands twist into a double helix.'}
};
// Reuse the same definitions wherever these structures can be explored.
learningFacts.message=learningFacts['messenger-rna'];
learningFacts.protein=learningFacts['enzyme-protein'];
function renderChromatinEnvironment(g,progress){
 const holder=$('chromatin-environment'),image=$('chromatin-environment-image');holder.hidden=progress<=0&&!['dna-focus','gene','message','export'].includes(phase);holder.style.opacity=String(phase==='dna-focus'?1:Math.min(1,progress*1.8));
 if(['export','protein'].includes(phase)&&!isBacterial()){holder.hidden=false;holder.style.opacity='.85';image.style.left='-10%';image.style.top='-10%';image.style.width='120%';image.style.height='120%';image.style.objectFit='cover';image.style.filter='blur(20px) brightness(.24) saturate(.65)';const camera=document.querySelector('.nuclear-camera');if(camera)camera.style.opacity='0';return;}
 const panel=$('nucleus-model'),pr=panel.getBoundingClientRect?.()||{left:0,top:0},sr=scene.getBoundingClientRect?.()||{left:0,top:0},start=chromatinStart||{x:g.x/g.mw,y:g.y/g.mh,w:g.w/g.mw};
 const sw=start.absoluteWidth||start.w*g.mw,sh=sw/1.25,sx=start.absoluteX??(pr.left-sr.left+start.x*g.mw),sy=start.absoluteY??(pr.top-sr.top+start.y*g.mh);
 const width=sw*(1+7*progress),height=width/1.25,ax=sx+sw*.4+(scene.clientWidth*.5-(sx+sw*.4))*progress,ay=sy+sh*.67+(scene.clientHeight*.45-(sy+sh*.67))*progress;
 image.style.left=`${ax-width*.4}px`;image.style.top=`${ay-height*.67}px`;image.style.width=`${width}px`;image.style.height=`${height}px`;image.style.filter=`blur(${2*progress}px) brightness(${1-.60*progress}) saturate(.9)`;
 const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.opacity=String(1-Math.min(1,progress*1.8));
}
function learningFeedback(text){if($('learning-feedback').textContent!==text)$('learning-feedback').textContent=text;}
function showLearningLayer(id,visible){const element=$(id);element.hidden=!visible;element.toggleAttribute?.('hidden',!visible);element.inert=!visible;if(element.namespaceURI==='http://www.w3.org/2000/svg'||id==='protein-chain')element.style.display=visible?'':'none';}
function refreshNarrator(allowScroll=false){const copy=currentCopy();$('caption').textContent=copy[0];$('caption').hidden=!copy[0];$('detail-space').textContent=copy[1];$('detail-accessible').textContent=copy[1];$('narration-live').textContent=copy.join(' ');revealTime=0;revealed=still||paused;paintNarration(revealed?copy[1].length:0);if(allowScroll&&scene.clientWidth<650)scene.scrollIntoView?.({block:'start',behavior:still?'auto':'smooth'});}
function porePassagePoint(start,pore,exit,progress){
 // One clock and one easing curve: pass through the pore without a second start.
 const t=ease(progress),u=1-t,c1={x:start.x+(pore.x-start.x)*.45,y:start.y},c2={x:pore.x-(exit.x-pore.x)*.7,y:pore.y};
 return {x:u*u*u*start.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*exit.x,y:u*u*u*start.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*exit.y};
}
const copySignal=document.createElement('div');copySignal.id='dna-copy-signal';copySignal.setAttribute('aria-hidden','true');$('dna-lens').append(copySignal);
function placeCytoplasmLabel(){
 const label=$('cytoplasm-location');if(isBacterial()||phase!=='export'||rnaArrived){label.hidden=true;return;}
 const panel=$('nucleus-model'),pr=panel.getBoundingClientRect(),width=label.offsetWidth||90,height=44;
 const obstacles=[...panel.querySelectorAll('.information-label,#nucleus-object,#pore-target,#pore-target>span,#rna-message,#ribosome-target')].filter(e=>e!==label&&e.checkVisibility({visibilityProperty:true})).map(e=>e.getBoundingClientRect());
 let chosen=null;
 for(let y=12;y+height<panel.clientHeight-12&&!chosen;y+=16)for(let x=12;x+width<panel.clientWidth-12;x+=20){const l=pr.left+x,t=pr.top+y;if(!obstacles.some(r=>l<r.right+12&&l+width>r.left-12&&t<r.bottom+12&&t+height>r.top-12)){chosen={x,y};break;}}
 label.hidden=!chosen;if(chosen){label.style.left=chosen.x+'px';label.style.top=chosen.y+'px';}
}
const readingSignal=document.createElement('div');readingSignal.id='rna-reading-signal';readingSignal.setAttribute('aria-hidden','true');$('rna-message').append(readingSignal);
const readingStatus=document.createElement('p');readingStatus.id='ribosome-reading-status';readingStatus.hidden=true;$('nucleus-model').append(readingStatus);
// Keep the former text inset in layout, without a decorative background or padding box.
function layoutPlainNote(note,left,top,width){note.style.left=(left+10)+'px';note.style.top=(top+8)+'px';note.style.width=Math.max(36,width-20)+'px';}
function renderReading({eligible,rx,ry,rw,rh,mw}){
 const running=eligible&&!paused&&!guideOpen&&!infoKey,cycle=still?.5:(learningClock%2400)/2400;
 readingSignal.style.maskImage=`url('${$('rna-strand').getAttribute('src')}')`;readingSignal.style.opacity=running?'.65':'0';readingSignal.style.backgroundPosition=`${-45+190*cycle}% 0`;
 const ribosome=$('ribosome-target');ribosome.dataset.translating=String(running);ribosome.style.setProperty('--reading-brightness',String(running&&!still?1+.025*Math.sin(cycle*Math.PI)**2:1));
 readingStatus.hidden=!eligible;readingStatus.dataset.instructionSurface='dark';
 if(eligible){const count=isBacterial()&&phase==='protein'?` · Chain ${Math.min(4,bacterialChains+1)}/4`:'';const text=(paused?'Reading paused.':'Reading the message…')+count;if(readingStatus.textContent!==text)readingStatus.textContent=text;const right=mw-(rx+rw/2+12),width=right>=110?Math.min(150,right):Math.max(76,rx-rw/2-12);layoutPlainNote(readingStatus,right>=110?rx+rw/2+12:0,ry-25,width);
  const object=$('nucleus-object'),panelRect=$('nucleus-model').getBoundingClientRect(),or=object.getBoundingClientRect(),sr=readingStatus.getBoundingClientRect();
  if(object.checkVisibility({visibilityProperty:true})&&Number(getComputedStyle(object).opacity)>.25&&sr.left<or.right+10&&sr.right>or.left-10&&sr.top<or.bottom+10&&sr.bottom>or.top-10){
   const belowWidth=Math.min(220,mw-16),belowLeft=Math.max(8,Math.min(mw-belowWidth-8,rx-belowWidth/2));
   let below=ry+rh/2+12;for(const el of [$('ribosome-info-label'),$('rna-message').querySelector('span')])if(el.checkVisibility({visibilityProperty:true}))below=Math.max(below,el.getBoundingClientRect().bottom-panelRect.top+12);layoutPlainNote(readingStatus,belowLeft,below,belowWidth);
  }
 }
}
const learningWorkCue=document.createElement('div');learningWorkCue.id='learning-work-cue';learningWorkCue.hidden=true;$('nucleus-model').append(learningWorkCue);learningWorkCue.append($('learning-instruction'),$('learning-feedback'));
function placeSubjectHandoff(anchorId){
 const panel=$('nucleus-model'),footer=$('dna-learning'),pr=panel.getBoundingClientRect(),sr=scene.getBoundingClientRect(),anchor=$(anchorId),ar=anchor.getBoundingClientRect();
 if(learningWorkCue.parentElement!==footer)footer.prepend(learningWorkCue);
 footer.dataset.handoffSubject=anchorId;learningWorkCue.dataset.layout='flow';learningWorkCue.dataset.instructionSurface='dark';
 for(const prop of ['left','top','width'])learningWorkCue.style.removeProperty(prop);
 for(const prop of ['left','right','width'])footer.style.removeProperty(prop);
 const labels=[...panel.querySelectorAll('.information-label,#ribosome-reading-status')].filter(e=>e.checkVisibility({visibilityProperty:true}));
 if(scene.clientWidth<650){
  const bottom=Math.max(pr.bottom,ar.bottom,...labels.map(e=>e.getBoundingClientRect().bottom));panel.style.marginBottom=Math.max(14,bottom-pr.bottom+16)+'px';footer.style.removeProperty('top');
  footer.dataset.messageSide=ar.left+ar.width/2<sr.left+sr.width/2?'left':'right';
 }else{
  const gutter=parseFloat(getComputedStyle(scene).getPropertyValue('--gutter'))||24,width=Math.min(learningWorkCue.hidden?Math.max(180,$('learning-next').offsetWidth):340,scene.clientWidth-2*gutter),left=Math.max(sr.left+gutter,Math.min(sr.right-gutter-width,ar.left+ar.width/2-width/2));
  footer.style.left=(left-sr.left)+'px';footer.style.right='auto';footer.style.width=width+'px';
  const blocks=labels.map(e=>e.getBoundingClientRect());
  for(const id of ['dna-lens','rna-message','ribosome-target','nucleus-object']){const el=$(id);if(el.checkVisibility({visibilityProperty:true})&&Number(getComputedStyle(el).opacity)>.25)blocks.push(el.getBoundingClientRect());}
  let top=ar.bottom+16;footer.style.top=(top-sr.top)+'px';const height=footer.getBoundingClientRect().height;
  for(let i=0;i<=blocks.length;i++){const hit=blocks.find(r=>left<r.right+12&&left+width>r.left-12&&top<r.bottom+12&&top+height>r.top-12);if(!hit)break;top=hit.bottom+16;}
  footer.style.top=(top-sr.top)+'px';scene.style.setProperty('--message-scene-height',(footer.offsetTop+footer.offsetHeight+105)+'px');
 }
}
function placeMessageCue(){
 if(phase==='message'&&rnaMade){placeSubjectHandoff('rna-message');return;}
 const panel=$('nucleus-model'),footer=$('dna-learning'),pr=panel.getBoundingClientRect(),sr=scene.getBoundingClientRect();
 delete footer.dataset.handoffSubject;if(learningWorkCue.parentElement!==footer)footer.prepend(learningWorkCue);
 learningWorkCue.dataset.layout='flow';learningWorkCue.dataset.instructionSurface='dark';
 for(const prop of ['left','top','width'])learningWorkCue.style.removeProperty(prop);
 for(const prop of ['left','right','width'])footer.style.removeProperty(prop);
 const labels=[...panel.querySelectorAll('.information-label,#copy-instructions')].filter(e=>e.checkVisibility({visibilityProperty:true}));
 const bottom=Math.max(phase==='gene'?$('dna-lens').getBoundingClientRect().bottom:pr.bottom,...labels.map(e=>e.getBoundingClientRect().bottom));
 if(scene.clientWidth<650){panel.style.marginBottom=Math.max(14,bottom-pr.bottom+16)+'px';footer.style.removeProperty('top');}
 else{if(phase==='gene')footer.style.left=($('dna-lens').getBoundingClientRect().left-sr.left)+'px';footer.style.top=(bottom-sr.top+16)+'px';scene.style.setProperty('--message-scene-height',(footer.offsetTop+footer.offsetHeight+105)+'px');}
}
function placeLearningCue(anchorId){
 if(learningWorkCue.parentElement!==$('nucleus-model'))$('nucleus-model').append(learningWorkCue);learningWorkCue.dataset.layout='local';
 const cue=learningWorkCue,panel=$('nucleus-model'),anchor=$(anchorId),pr=panel.getBoundingClientRect(),ar=anchor.getBoundingClientRect(),width=Math.min(240,panel.clientWidth-16);
 cue.style.width=width+'px';const height=cue.getBoundingClientRect().height;
 const box=r=>({x:r.left-pr.left,y:r.top-pr.top,w:r.width,h:r.height}),a=box(ar),clamp=x=>Math.max(8,Math.min(panel.clientWidth-width-8,x));
 const blocks=[...panel.querySelectorAll('.information-label,#select-gene>span,#pore-target>span,#pore-target,#ribosome-target,#rna-message,#copy-instructions,#dna-lens')].filter(e=>e!==anchor&&!e.contains(anchor)&&e.checkVisibility({visibilityProperty:true})).map(e=>box(e.getBoundingClientRect()));
 blocks.push(a);
 const candidates=[{x:clamp(a.x+(a.w-width)/2),y:a.y-height-14},{x:clamp(a.x+(a.w-width)/2),y:a.y+a.h+14},{x:panel.clientWidth-width-8,y:a.y+a.h+14},{x:8,y:a.y+a.h+14},{x:clamp(a.x-width-14),y:Math.max(8,a.y+(a.h-height)/2)},{x:clamp(a.x+a.w+14),y:Math.max(8,a.y+(a.h-height)/2)}];
 const overlaps=(c,b)=>c.x<b.x+b.w+10&&c.x+width>b.x-10&&c.y<b.y+b.h+10&&c.y+height>b.y-10;
 const foreground=$('nucleus-object');if(phase==='export'&&foreground.checkVisibility({visibilityProperty:true})&&Number(getComputedStyle(foreground).opacity)>.25)blocks.push(box(foreground.getBoundingClientRect()));
 const chosen=candidates.find(c=>c.y>=8&&c.y+height<=panel.clientHeight-8&&!blocks.some(b=>overlaps(c,b)))||{x:clamp(a.x+(a.w-width)/2),y:panel.clientHeight+12};
 cue.dataset.instructionSurface='dark';
 cue.style.left=chosen.x+'px';cue.style.top=chosen.y+'px';cue.dataset.anchor=anchorId;
}
const proteinModelUnits=14,proteinGrowDuration=4300,proteinFoldDuration=4000,proteinReactionDuration=5200;
function proteinFocusProgress(){return phase==='protein'&&proteinFocusAt>=0?(still||modelEntryStatic?1:ease((learningClock-proteinFocusAt)/1800)):0;}
function cellContextCamera(g,focus){const x=g.mw*(g.portrait?.79:.70),y=g.mh*(g.portrait?.56:.55),dx=g.mw*((g.portrait?.55:.75)-(g.portrait?.79:.70))*focus,dy=g.mh*((g.portrait?.60:.60)-(g.portrait?.56:.55))*focus,scale=1+((g.portrait?200:270)/132-1)*focus;return {x,y,transform:phase==='protein'?`translate(${dx}px,${dy}px) scale(${scale})`:'none'};}
function expectedAminoAcid(){return [1,2,3][proteinCount%3];}
function proteinInputReady(){return phase==='protein'&&proteinStage==='build'&&proteinFocusProgress()===1&&(still||proteinAddAt<0||learningClock-proteinAddAt>=360);}
function advanceProteinProcess(){
 if(phase!=='protein')return;
 const previousNumber=isBacterial()?bacteria.number(phase,proteinStage):0,previousState=isBacterial()?plantSnapshot():null;
 if(isBacterial()){
  if(proteinStage==='folding'&&(still||learningClock-proteinFoldAt>=proteinFoldDuration)){bacterialChains=1;proteinStage='collect';refreshNarrator();revealFull();}
  if(proteinStage==='repeat-growing'&&(still||learningClock-bacterialRepeatAt>=3200)){proteinStage='repeat-folding';proteinFoldAt=learningClock;refreshNarrator();revealFull();}
  if(proteinStage==='repeat-folding'&&(still||learningClock-proteinFoldAt>=proteinFoldDuration)){bacterialChains++;proteinStage=bacterialChains===4?'assemble-ready':'collect';refreshNarrator();revealFull();}
  if(proteinStage==='joining'&&(still||learningClock-bacterialJoinAt>=2200)){proteinStage='job';refreshNarrator();revealFull();}
 }
 if(proteinStage==='build'&&proteinCount===3&&(still||learningClock-proteinAddAt>=360)){proteinStage='growing';proteinGrowReadyAt=-1;proteinGrowAt=still?learningClock-proteinGrowDuration:learningClock;refreshNarrator();revealFull();}
 if(proteinStage==='growing'&&revealed&&learningClock-proteinGrowAt>=proteinGrowDuration&&proteinGrowReadyAt<0)proteinGrowReadyAt=learningClock;
 if(proteinStage==='growing'&&learningClock-proteinGrowAt>=proteinGrowDuration&&revealed&&(still||proteinGrowReadyAt>=0&&learningClock-proteinGrowReadyAt>=narrationDwell())){proteinStage='chain';refreshNarrator();}
 if(!isBacterial()&&proteinStage==='folding'&&revealed&&learningClock-proteinFoldAt>=proteinFoldDuration+(isBacterial()?2200:0)&&proteinFoldReadyAt<0)proteinFoldReadyAt=learningClock;
 if(!isBacterial()&&proteinStage==='folding'&&revealed&&(still||learningClock-proteinFoldAt>=proteinFoldDuration+(isBacterial()?2200:0)&&(isBacterial()||proteinFoldReadyAt>=0&&learningClock-proteinFoldReadyAt>=narrationDwell()))){proteinStage='job';refreshNarrator();}
 if(proteinStage==='reaction'&&revealed&&learningClock-sugarAt>=proteinReactionDuration&&proteinReactionReadyAt<0)proteinReactionReadyAt=learningClock;
 if(proteinStage==='reaction'&&revealed&&(still||learningClock-sugarAt>=proteinReactionDuration&&proteinReactionReadyAt>=0&&learningClock-proteinReactionReadyAt>=narrationDwell())){proteinStage='done';proteinCompletionReached=true;earn('reaction');musicMixer.setLoopAllowed(false);$('status').textContent='Activity complete. The enzyme is ready to work again.';refreshNarrator();syncControls();}
 if(isBacterial()&&previousNumber!==bacteria.number(phase,proteinStage))visitStates.set((reviewMode?'review:':'learn:')+organism+':C'+previousNumber,previousState);
}
const proteinCoil=[[.33,.16],[.19,.29],[.32,.49],[.57,.36],[.72,.18],[.83,.40],[.67,.64],[.42,.83],[.18,.65],[.29,.44],[.52,.57],[.78,.76],[.74,.49],[.51,.27]];
function proteinChainPoint(exit,t,extension=0){return {x:exit.x+(25+9*extension)*Math.sin(t*Math.PI*2)-20*t,y:exit.y-(125+50*extension)*t+8*Math.sin(t*Math.PI*2)};}
function proteinRibbonPath(points){if(!points.length)return '';let path=`M${points[0].x} ${points[0].y}`;for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];path+=` C${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6} ${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6} ${p2.x} ${p2.y}`;}return path;}
function renderProteinWork(g,work,action,next){
 const actualStage=proteinStage,stage=isBacterial()?({'repeat-growing':'growing','repeat-folding':'folding',collect:'job','assemble-ready':'job',joining:'job'}[actualStage]||actualStage):actualStage,assembled=['job','reaction','done'].includes(actualStage);
 if(!isBacterial()){$('b-enzyme-units').style.display='none';$('folded-protein').style.rotate='none';}
 const {mw,mh,portrait}=g,{rx,ry,rw,rh,focus}=work,exit={x:rx+rw*.23,y:ry-rh*.23},foldCentre={x:exit.x+(portrait?-4:10),y:exit.y-78},jobCentre={x:mw*(portrait?.68:.35),y:portrait?(isBacterial()?40:54):90},enzymeW=portrait?148:190,enzymeH=portrait?123:157;
 const poolX=mw*(portrait?.03:.22),poolY=portrait?0:20,bar=$('protein-workbar'),controls=$('protein-work-controls'),footer=$('dna-learning'),isWorking=stage!=='purpose';
 const foldReady=actualStage==='chain'||actualStage==='growing'&&learningClock-proteinGrowAt>=proteinGrowDuration,substrateReady=assembled&&actualStage==='job',localAction=foldReady||substrateReady;
 bar.hidden=false;bar.dataset.active=String(isWorking&&focus>0);bar.inert=!isWorking;action.className=stage==='done'?'quiet':'primary';
 for(const button of [action,next]){const host=button===action&&localAction?$('nucleus-model'):isWorking?controls:footer;if(button.parentElement!==host)host.append(button);}
 if(isWorking&&!localAction){const order=stage==='done'?[next,action]:[action,next];if(controls.children[0]!==order[0])controls.append(...order);}
 action.dataset.subject=foldReady?'ready-chain':substrateReady?'substrate':'';
 if(!localAction)for(const prop of ['position','left','top','width','max-width','white-space','z-index'])action.style.removeProperty(prop);
 const feedInfo=$('amino-feed-info-label');showLearningLayer('amino-feed-info-label',false);feedInfo.style.left=`${poolX+12}px`;feedInfo.style.top=`${poolY-6}px`;
 const pool=$('amino-pool');pool.style.left=`${poolX}px`;pool.style.top=`${poolY}px`;pool.style.width='190px';pool.style.opacity=String(ease((focus-.1)/.7));pool.style.translate=`${-15*(1-focus)}px ${20*(1-focus)}px`;
 const ready=proteinInputReady(),joining=stage==='build'&&!still&&proteinAddAt>=0&&learningClock-proteinAddAt<360;
 for(let i=1;i<=3;i++){const aa=$('amino-'+i);aa.hidden=false;aa.disabled=!ready||i!==expectedAminoAcid();aa.style.opacity=joining&&aminoUsed.at(-1)===i?String(.38+.62*(still?1:ease((learningClock-proteinAddAt)/360))):'1';aa.dataset.next=String(ready&&i===expectedAminoAcid());aa.setAttribute('aria-label','Amino acid '+i+(i===expectedAminoAcid()?' — next in the RNA message':''));aa.setAttribute('aria-pressed',String(aminoSelected===i));}
 showLearningLayer('amino-pool',stage==='build');showLearningLayer('amino-feedstock',false);
 const growth=stage==='growing'?Math.min(1,(learningClock-proteinGrowAt)/(actualStage==='repeat-growing'?3200:proteinGrowDuration)):['chain','folding','job','reaction','done'].includes(stage)?1:0;
 const add=still?1:proteinAddAt<0?0:ease((learningClock-proteinAddAt)/360);
 let length=stage==='build'?Math.max(0,proteinCount-1+add):stage==='purpose'?0:3+(proteinModelUnits-3)*growth;
 const sequence=[...aminoUsed,...Array.from({length:11},(_,i)=>i%3+1)],fold=stage==='folding'?(still?1:Math.min(1,(learningClock-proteinFoldAt)/proteinFoldDuration)):['job','reaction','done'].includes(stage)?1:0,folding=ease(Math.min(1,fold/.72)),release=ease((fold-.74)/.26),detail=ease((fold-.10)/.52);
 const activeFold=isBacterial()&&stage==='folding',parkedSize=portrait?82:112,parked=portrait?[[mw*.16,48],[mw*.50,48],[mw*.16,130],[mw*.50,130]]:[[mw*.14,85],[mw*.32,85],[mw*.50,85],[mw*.68,85]],foldDestination=activeFold?{x:parked[bacterialChains][0],y:parked[bacterialChains][1]}:jobCentre,surfaceW=activeFold?enzymeW+(parkedSize-enzymeW)*release:enzymeW,surfaceH=activeFold?enzymeH+(parkedSize*enzymeH/enzymeW-enzymeH)*release:enzymeH;
 // The ribbon, reveal mask and surface share this pose; release waits for opaque material.
 const compact={x:foldCentre.x+(foldDestination.x-foldCentre.x)*release,y:foldCentre.y+(foldDestination.y-foldCentre.y)*release};
 const chain=$('protein-chain');showLearningLayer('protein-chain',stage!=='purpose'&&proteinCount>0);
 chain.setAttribute('viewBox',`0 0 ${mw} ${mh}`);chain.style.left='0px';chain.style.top='0px';chain.style.width=`${mw}px`;chain.style.height=`${mh}px`;chain.style.transform='none';chain.style.translate='none';chain.style.scale='1';chain.style.opacity='1';chain.setAttribute('aria-label',fold===1?(assembled?'Working enzyme':'Folded protein chain'):fold>0?'The same protein chain folding':'Growing protein chain');
 const points=[];
 for(let i=1;i<=proteinModelUnits;i++){
  const visible=i<=Math.ceil(length),t=Math.max(0,(length-i+1)/(proteinModelUnits+1)),point=proteinChainPoint(exit,t,growth),coil=proteinCoil[i-1],delay=(i-1)/(proteinModelUnits-1)*.16,bend=ease((fold/.72-delay)/(1-delay)),coiled={x:foldCentre.x+(coil[0]-.5)*surfaceW,y:foldCentre.y+(coil[1]-.5)*surfaceH};
  const px=point.x+(coiled.x-point.x)*bend+(compact.x-foldCentre.x),py=point.y+(coiled.y-point.y)*bend+(compact.y-foldCentre.y),bead=$('protein-bead-'+i);
  bead.style.opacity=String(visible?Math.min(1,Math.max(0,length-i+1))*(1-.95*folding):0);bead.setAttribute('cx',String(px));bead.setAttribute('cy',String(py));bead.setAttribute('r',String((portrait?5.7:6.3)+growth*2+folding*1));bead.setAttribute('fill',`url(#amino-shade-${sequence[i-1]||1})`);if(visible)points.push({x:px,y:py});
 }
 // Newest amino acid remains closest to the exit; the first placed one moves outwards.
 const ordered=[...points].reverse(),attached=fold<.68,path=proteinRibbonPath(ordered),ribbonWidth=3.5+growth*2+folding*(portrait?6:7.5);
 $('protein-bonds').setAttribute('d',path);$('protein-bonds').style.strokeWidth=String(ribbonWidth);$('protein-bonds').style.stroke='url(#protein-ribbon)';$('protein-bonds').style.strokeDasharray='none';
 $('protein-chain-depth').setAttribute('d',path);$('protein-chain-depth').style.strokeWidth=String(ribbonWidth+2.5);$('protein-chain-depth').style.opacity=String(growth*.45+folding*.2);
 $('protein-ribbon-light').setAttribute('d',path);$('protein-ribbon-light').style.strokeWidth=String(1+folding*.8);$('protein-ribbon-light').style.opacity=String(growth*.3+folding*.3);$('protein-ribbon-light').style.transform='translate(-1px,-1px)';
 $('protein-tether').setAttribute('d',attached&&ordered.length?`M${exit.x} ${exit.y} L${ordered[0].x} ${ordered[0].y}`:'');$('protein-tether').style.opacity=String(1-ease((fold-.56)/.12));
 $('protein-surface-mask-path').setAttribute('d',path);$('protein-surface-mask-path').setAttribute('stroke-width',String(detail*(ribbonWidth+surfaceW*1.6)));$('protein-surface-mask-path').setAttribute('stroke-dasharray','none');
 // After the starter joins, new units emerge quietly at the exit as this attached chain extends.
 const folded=['folding','job','reaction','done'].includes(stage),enzyme=$('folded-protein');showLearningLayer('folded-protein',folded);
 // Texture belongs to this very ribbon: one persistent SVG and one shared path mask.
 enzyme.style.position='static';enzyme.style.left=`${compact.x-surfaceW/2}px`;enzyme.style.top=`${compact.y-surfaceH/2}px`;enzyme.style.width=`${surfaceW}px`;enzyme.style.height=`${surfaceH}px`;enzyme.style.opacity=String(detail);enzyme.style.transform='none';enzyme.style.maskImage=fold>=.66?'none':'url(#protein-surface-mask)';
 const ribbonFade=1-ease((fold-.42)/.24);$('protein-bonds').style.opacity=String(ribbonFade);{$('protein-chain-depth').style.opacity=String((growth*.45+folding*.2)*ribbonFade);$('protein-ribbon-light').style.opacity=String((growth*.3+folding*.3)*ribbonFade);}
 for(const [key,value] of Object.entries({x:compact.x-surfaceW/2,y:compact.y-surfaceH/2,width:surfaceW,height:surfaceH}))enzyme.setAttribute(key,String(value));
 bacteria.renderComplex({centre:compact,home:jobCentre,w:enzymeW,h:enzymeH,completed:bacterialChains,stage:actualStage,fold,detail,currentSurface:{x:compact.x,y:compact.y,width:surfaceW,height:surfaceH},progress:actualStage==='joining'?(still?1:(learningClock-bacterialJoinAt)/2200):assembled?1:0});
 const assemblyReady=assembled;
 const label=$('protein-label');label.hidden=stage==='purpose'||proteinCount===0||stage==='folding';label.textContent=folded?(isBacterial()?(assembled?'Lactose enzyme':portrait?'Folded chains':'Folded protein chains'):'Protein'):'Growing protein chain';label.style.left=`${folded?jobCentre.x:Math.min(mw-160,exit.x+25)}px`;label.style.top=`${folded?jobCentre.y+enzymeH/2+6:Math.max(0,exit.y-length/(proteinModelUnits+1)*(125+50*growth)-54)}px`;label.style.transform=folded?'translateX(-50%)':'none';
 const sugar=$('sugar-substrate'),sugarX=mw*(portrait?.15:.18),sugarY=portrait?(isBacterial()?60:18):60,binding={x:jobCentre.x+enzymeW*.34,y:jobCentre.y},elapsed=sugarAt<0?0:(stage==='done'||still?proteinReactionDuration:Math.max(0,learningClock-sugarAt)),approach=ease(elapsed/1400),split=ease((elapsed-2400)/700),depart=ease((elapsed-3100)/1900),departBProgress=ease((elapsed-3200)/1800);
 const sx=(binding.x-(sugarX+60))*approach,sy=(binding.y-(sugarY+32))*approach;
 showLearningLayer('sugar-substrate',assembled&&(['job','reaction','done'].includes(stage)||stage==='folding'&&fold===1&&assemblyReady));sugar.style.left=`${sugarX}px`;sugar.style.top=`${sugarY}px`;sugar.style.width='120px';sugar.style.height='85px';sugar.style.transform=`translate(${sx}px,${sy}px)`;
 sugar.disabled=stage!=='job'&&!(stage==='folding'&&fold===1&&assemblyReady);sugar.tabIndex=sugar.disabled?-1:0;sugar.setAttribute('aria-label',stage==='done'?'Glucose and fructose released':'Send sucrose to the enzyme');
 $('sugar-bond').setAttribute('d',`M${35-7*split} 32 L${60-6*split} 32 M${60+6*split} 32 L${85+7*split} 32`);$('sugar-bond').style.opacity=String(1-split*split);$('sucrose-label').style.opacity='0';
 const departA={x:(portrait?-105:-130)*depart,y:(portrait?-40:-65)*depart},departB={x:(portrait?2:85)*departBProgress,y:(portrait?78:-28)*departBProgress};
 $('sugar-half-a').setAttribute('transform',`translate(${-7*split+departA.x} ${departA.y})`);$('sugar-half-b').setAttribute('transform',`translate(${7*split+departB.x} ${departB.y})`);
 for(const id of ['glucose-name','fructose-name'])$(id).style.opacity='0';
 const sucroseInfo=$('sucrose-info-label');sucroseInfo.textContent=isBacterial()?'Lactose':'Sucrose';showLearningLayer('sucrose-info-label',assembled&&(stage==='job'||stage==='folding'&&fold===1&&assemblyReady||stage==='reaction'&&split<1));sucroseInfo.style.left=`${sugarX+60+sx}px`;sucroseInfo.style.top=`${sugarY+70+sy}px`;sucroseInfo.style.opacity=String(1-split);
 for(const [id,dx,offset] of [['glucose',-25-7*split,departA],['fructose',25+7*split,departB]]){const button=$(id+'-info-label');showLearningLayer(id+'-info-label',stage==='done'||stage==='reaction'&&elapsed>=3100);button.style.left=`${Math.max(45,Math.min(mw-45,sugarX+60+sx+dx+offset.x-(id==='glucose'?46:0)))}px`;button.style.top=`${sugarY+32+sy+19+offset.y+(portrait&&id==='fructose'?22:0)}px`;button.style.opacity=String(Math.min(1,depart*2));}
 const engagement=ease((elapsed-1100)/350)*(1-ease((elapsed-2800)/600));
 showLearningLayer('enzyme-contact-detail',false);
 enzyme.style.transformBox='fill-box';enzyme.style.transformOrigin='72% 50%';enzyme.style.transform=`scale(${1+.012*engagement},${1-.012*engagement}) rotate(${.35*engagement}deg)`;

 let instruction='',feedback='';action.hidden=true;next.hidden=true;

 if(stage==='build')instruction=focus<1?'Moving closer to the ribosome…':joining?'Joining this amino acid…':aminoSelected?'Choose the ribosome to join it.':'Select the highlighted amino acid specified by the message, then the ribosome.';
 if(stage==='growing'){instruction=paused&&growth<1?'Building is paused. Resume exploration to continue.':growth<1?'The ribosome keeps adding amino acids, following the messenger RNA.':'The chain is ready to finish folding.';if(growth===1){action.hidden=false;action.disabled=false;$('learning-action-label').textContent='Fold and release the protein';}}
 if(stage==='chain'){instruction='The chain is ready to finish folding.';action.hidden=false;action.disabled=false;$('learning-action-label').textContent='Fold and release the protein';}
 if(stage==='folding')instruction=paused?'Folding is paused. Resume exploration to continue.':'The chain folds, then the protein is released.';
 if(foldReady)instruction='Ready to fold.';
 if(stage==='job'){instruction='Send sucrose to the protein, or select the molecule.';if(substrateReady){action.hidden=false;action.disabled=false;$('learning-action-label').textContent=isBacterial()?'Send lactose to the protein':'Send sucrose to the protein';}}
 if(stage==='reaction'){instruction=elapsed<proteinReactionDuration?'Watch sucrose bind, separate and leave the enzyme ready.':'Two sugars released. The enzyme is ready to work again.';}
 if(stage==='done'){instruction='Two sugars released. The enzyme is ready to work again.';feedback='Sucrose split into glucose and fructose.';next.hidden=!revealed;next.disabled=false;action.hidden=false;action.disabled=false;$('learning-action-label').textContent='Try another sucrose';}
 if(isBacterial()){instruction=instruction.replaceAll('sucrose','lactose');feedback=feedback.replace('Sucrose split into glucose and fructose.','Lactose split into glucose and galactose.');if(stage==='done')$('learning-action-label').textContent='Try another lactose';if(stage==='folding')instruction=paused?'Folding is paused. Resume exploration to continue.':'The chain folds and leaves the ribosome.';$('sugar-substrate').setAttribute('aria-label',stage==='done'?'Glucose and galactose released':'Send lactose to the enzyme');}
 if(isBacterial()){
  if(actualStage==='collect'){instruction=`${bacterialChains}/4 chains folded.`;action.hidden=false;action.disabled=false;$('learning-action-label').textContent='Make the next chain';}
  if(actualStage==='repeat-growing'){instruction=paused?'Building is paused. Resume exploration to continue.':`Making chain ${bacterialChains+1} of 4 from the same message.`;action.hidden=true;}
  if(actualStage==='repeat-folding'){instruction=paused?'Folding is paused. Resume exploration to continue.':`Chain ${bacterialChains+1} of 4 is folding.`;action.hidden=true;}
  if(actualStage==='assemble-ready'){instruction='4/4 chains ready to fit.';action.hidden=false;action.disabled=false;$('learning-action-label').textContent='Fit the four chains together';}
  if(actualStage==='joining'){instruction=paused?'Assembly is paused. Resume exploration to continue.':'Four matching chains fit into one enzyme.';action.hidden=true;}
  if(!assembled&&['collect','assemble-ready','joining'].includes(actualStage)){label.style.left=`${portrait?Math.max(72,mw*.16):mw*(.14+.09*(Math.max(1,bacterialChains)-1))}px`;label.style.top=portrait?'164px':'154px';label.style.transform='translateX(-50%)';}

  pool.querySelector('#amino-info-label').textContent='Amino acids';
  if(actualStage==='repeat-growing'){showLearningLayer('amino-pool',true);for(let i=1;i<=3;i++)$('amino-'+i).hidden=false;}
 }
 if(assembled)for(const id of ['ribosome-target','ribosome-info-label','rna-message'])showLearningLayer(id,false);
 const trayVisible=!foldReady&&(stage==='build'||stage==='growing'||stage==='chain'||stage==='folding'&&fold<.10);showLearningLayer('amino-pool',trayVisible);pool.style.opacity=String(ease((focus-.1)/.7)*(stage==='folding'?Math.max(0,1-fold/.10):1));
 const cue=$('protein-work-cue');if(cue.parentElement!==$('nucleus-model'))$('nucleus-model').append(cue);
 cue.dataset.zone=stage==='build'||stage==='growing'||stage==='chain'?'supply':assembled?'reaction':'folding';
 cue.style.position='absolute';cue.style.left=(cue.dataset.zone==='supply'?poolX:assembled&&!portrait?Math.max(0,jobCentre.x-enzymeW*.8):0)+'px';
 cue.style.width=(portrait?(stage==='build'?mw-poolX:assembled?mw:Math.max(86,rx-rw*.42-16)):assembled?Math.min(440,mw):260)+'px';cue.style.maxWidth=cue.style.width;
 const panelRect=$('nucleus-model').getBoundingClientRect(),poolRect=pool.getBoundingClientRect();
 const labelBottom=label.hidden?0:label.getBoundingClientRect().bottom-panelRect.top;
 let cueY=cue.dataset.zone==='supply'?poolRect.bottom-panelRect.top+12:assembled?0:Math.max(portrait?216:190,labelBottom+16);
 if(assembled){for(const id of ['protein-label','sucrose-info-label','glucose-info-label','fructose-info-label']){const el=$(id);if(!el.hidden)cueY=Math.max(cueY,el.getBoundingClientRect().bottom-panelRect.top+16);}}
 cue.style.top=cueY+'px';cue.dataset.instructionSurface='dark';if(!foldReady)layoutPlainNote(cue,parseFloat(cue.style.left),cueY,parseFloat(cue.style.width));
 if(fold===1)for(let i=1;i<=proteinModelUnits;i++)$('protein-bead-'+i).style.opacity='0';
 feedback='';
 $('protein-work-cue').dataset.passive=String(['growing','folding','reaction','done'].includes(stage));$('protein-work-status').textContent=instruction;$('protein-work-cue').hidden=!instruction;
 if(localAction){
  action.style.position='absolute';action.style.zIndex='7';action.style.whiteSpace='normal';
  if(foldReady&&points.length){
   const bounds={left:Math.min(...points.map(p=>p.x))-10,top:Math.min(...points.map(p=>p.y))-10};
   const width=Math.max(120,Math.min(260,bounds.left-24)),left=Math.max(8,bounds.left-width-18),labelLeft=label.getBoundingClientRect().left-panelRect.left;
   cue.style.left=left+'px';cue.style.width=Math.max(100,Math.min(width,labelLeft-left-16))+'px';cue.style.maxWidth=cue.style.width;
   action.style.left=left+'px';action.style.width=width+'px';action.style.maxWidth=width+'px';
   const ribosomeTop=$('ribosome-target').getBoundingClientRect().top-panelRect.top,actionTop=Math.min(bounds.top+48,ribosomeTop-action.offsetHeight-16),cueHeight=cue.getBoundingClientRect().height;
   action.style.top=actionTop+'px';const cueTop=actionTop-cueHeight-12;
   const belowWidth=Math.min(width,$('ribosome-target').getBoundingClientRect().left-panelRect.left-left-16);
   if(cueTop>=0)cue.style.top=cueTop+'px';
   else if(belowWidth>=100){cue.style.width=belowWidth+'px';cue.style.maxWidth=cue.style.width;cue.style.top=(actionTop+action.offsetHeight+12)+'px';}
   else{cue.style.left=poolX+'px';cue.style.width=Math.min(260,Math.max(100,left-poolX-16))+'px';cue.style.maxWidth=cue.style.width;cue.style.top='0px';}
  }else{
   const width=Math.min(320,mw-16),centre=(sugarX+60+jobCentre.x)/2;action.style.width=width+'px';action.style.maxWidth=width+'px';action.style.left=Math.max(8,Math.min(mw-width-8,centre-width/2))+'px';action.style.top=(parseFloat(cue.style.top)+cue.getBoundingClientRect().height+12)+'px';
   // Fixed playback buttons can cross this subject-anchored action on short
   // screens or after a viewport change. Use their actual hit areas, leaving
   // the empty centre of the playback bar available to the reaction action.
   const gap=12,rect=action.getBoundingClientRect(),controls=[...scene.querySelectorAll('nav[aria-label="Playback and reading controls"] button')].filter(e=>e.checkVisibility({visibilityProperty:true})).map(e=>e.getBoundingClientRect());
   const intersects=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
   if(controls.some(r=>intersects(rect,r))){
    const obstacles=[...controls,...[cue,sugar,label,$('sucrose-info-label'),$('glucose-info-label'),$('fructose-info-label')].filter(e=>e.checkVisibility({visibilityProperty:true})).map(e=>e.getBoundingClientRect())];
    const xs=[rect.left,...controls.flatMap(r=>[r.right+gap,r.left-rect.width-gap])],ys=[rect.top,...controls.map(r=>r.top-rect.height-gap)];
    const candidates=ys.flatMap(top=>xs.map(left=>({left,top,right:left+rect.width,bottom:top+rect.height}))).filter(r=>r.left>=panelRect.left+8&&r.right<=panelRect.left+mw-8&&r.top>=panelRect.top&&r.bottom<=innerHeight-8&&!obstacles.some(o=>intersects(r,o)));
    candidates.sort((a,b)=>(a.left-rect.left)**2+4*(a.top-rect.top)**2-((b.left-rect.left)**2+4*(b.top-rect.top)**2));
    if(candidates.length){action.style.left=(candidates[0].left-panelRect.left)+'px';action.style.top=(candidates[0].top-panelRect.top)+'px';}
   }
  }
 }

 return {instruction:'',feedback,nextText:stage==='done'&&revealed?'Match the parts to their jobs':''};
}

function renderLearning(g){
 advanceProteinProcess();
 if(!['gene','message'].includes(phase)&&!(phase==='export'&&rnaArrived)){$('nucleus-model').style.removeProperty('margin-bottom');$('dna-learning').style.removeProperty('top');$('dna-learning').style.removeProperty('left');$('dna-learning').style.removeProperty('right');$('dna-learning').style.removeProperty('width');delete $('dna-learning').dataset.handoffSubject;scene.style.removeProperty('--message-scene-height');}
 const active=learningPhases.includes(phase),outside=['export','protein'].includes(phase),inset=['dna-focus','gene','message'].includes(phase);learningGeometry=g;scene.dataset.learningInfo=active?infoKey:'';scene.dataset.learning=String(active);scene.dataset.proteinStage=phase==='protein'?proteinStage:'';scene.dataset.proteinCount=String(proteinCount);scene.dataset.earnedTasks=[...earnedTasks[organism]].join(' ');$('dna-learning').hidden=!active;
 for(const id of ['sucrose-info-label','glucose-info-label','fructose-info-label','amino-feed-info-label','enzyme-contact-detail'])showLearningLayer(id,phase==='protein'&&!$(id).hidden);
 learningWorkCue.hidden=!active||phase==='protein';
 const owners={'dna-lens':inset||isBacterial()&&phase==='export','rna-message':active&&(phase==='message'&&(copyAt>=0||rnaMade)||outside),'ribosome-target':outside||isBacterial()&&phase==='message','ribosome-info-label':outside||isBacterial()&&phase==='message','cytoplasm-location':outside&&!isBacterial(),'cytoplasm-region':false,'pore-target':phase==='export'&&!rnaExported&&rnaTravelAt<0,'pore-info-label':phase==='export'&&!rnaExported&&rnaTravelAt<0,'transport-hint':false,'protein-chain':false,'protein-label':phase==='protein'&&proteinStage!=='purpose'&&proteinCount>0,'amino-pool':phase==='protein'&&proteinStage==='build','amino-feedstock':false,'folded-protein':phase==='protein'&&['folding','job','done'].includes(proteinStage),'sugar-substrate':phase==='protein'&&['job','reaction','done'].includes(proteinStage)};
 for(const [id,visible] of Object.entries(owners))showLearningLayer(id,Boolean(active&&visible));
 showLearningLayer('select-gene',['gene','message'].includes(phase));showLearningLayer('copy-instructions',phase==='message');
 const poreControl=$('pore-target');poreControl.disabled=phase!=='export'||rnaExported||rnaTravelAt>=0;poreControl.tabIndex=poreControl.disabled?-1:0;
 if(!active){readingStatus.hidden=true;readingSignal.style.opacity='0';$('protein-workbar').hidden=true;$('protein-work-cue').hidden=true;$('nucleus-model').style.translate='none';$('nucleus-object').style.transform='none';$('nucleus-object').style.transformOrigin='50% 50%';$('nucleus-object').style.filter='none';showLearningLayer('cell-surroundings',false);$('chromatin-environment').hidden=true;const camera=document.querySelector?.('.nuclear-camera');if(camera)camera.style.opacity='';$('nucleus-object').style.opacity='1';return;}
 const {mw,mh,x,y,w,h,portrait}=g,lens=$('dna-lens'),bCopy=isBacterial()&&['message','export'].includes(phase),lw=bCopy&&!portrait?Math.min(mw*.55,580):Math.min(mw*(portrait?.96:.67),720),lh=lw*(bCopy&&!portrait?.30:.40),lx=portrait?(mw-lw)/2:(mw-lw)/2,ly=bCopy?12:!isBacterial()&&phase==='message'&&portrait?24:(mh-lh)/2;
 const show=phase==='dna-focus'&&!modelEntryStatic&&!still?ease((learningClock-(isBacterial()?2600:4400))/(isBacterial()?1800:2400)):1;
 lens.style.left=`${lx}px`;lens.style.top=`${ly}px`;lens.style.width=`${lw}px`;lens.style.height=`${lh}px`;lens.style.opacity=String(inset||bCopy?show:0);
 const zoomProgress=phase==='dna-focus'?(modelEntryStatic||still?1:ease(learningClock/6800)):['gene','message'].includes(phase)?1:phase==='export'?(modelEntryStatic||still?0:1-ease(learningClock/1600)):0;
 bacteria.renderContext(g,{phase,zoom:zoomProgress,elapsed:learningClock,staticEntry:modelEntryStatic||still});
 const focus=proteinFocusProgress();$('nucleus-model').style.translate=portrait&&phase==='protein'&&proteinEntryTop!==null?`0px ${(proteinEntryTop-$('nucleus-model').offsetTop)*(1-focus)}px`:'none';scene.dataset.proteinWorking=String(phase==='protein'&&focus>0);renderChromatinEnvironment(g,zoomProgress);showLearningLayer('cell-surroundings',false);
 $('nucleus-object').style.opacity=String(inset?0:phase==='protein'?.5-.4*focus:1-zoomProgress);const contextCamera=cellContextCamera(g,focus);$('nucleus-object').style.transformOrigin=`${contextCamera.x-x}px ${contextCamera.y-y}px`;$('nucleus-object').style.transform=contextCamera.transform;$('nucleus-object').style.filter=`blur(${2*focus}px)`;
 $('cell-game-model').style.opacity='0';
 const gene=$('select-gene');gene.disabled=phase!=='gene'||geneSelected;gene.setAttribute('aria-pressed',String(geneSelected));gene.querySelector('span').textContent=geneSelected?'Gene selected':'Select this gene';gene.setAttribute('aria-label',geneSelected?'Gene selected':'Select the highlighted section of DNA');
 const action=$('learning-action'),next=$('learning-next');action.hidden=true;next.hidden=true;action.disabled=false;next.disabled=false;
 $('learning-title').textContent={'dna-focus':'DNA',gene:'A gene',message:'Copy the instructions',export:'Carry the message',protein:'Build a useful protein'}[phase];
 let instruction='',feedback='',nextText='Continue';
 if(phase==='dna-focus'){next.hidden=false;nextText='Explore a gene';}
 if(phase==='gene'){instruction=geneSelected?'':'Select the marked DNA section.';next.hidden=!geneSelected;nextText='Follow these instructions';}
 let copyProgress=1,copyTravel=1;copySignal.style.opacity='0';
 if(phase==='message'){
  const elapsed=copyAt<0?0:Math.max(0,learningClock-copyAt),copyDuration=isBacterial()?1600:2800,travelDuration=isBacterial()?0:1900;
  copyProgress=rnaMade?1:copyAt<0?0:Math.min(1,elapsed/copyDuration);copyTravel=rnaMade||still?1:Math.max(0,Math.min(1,(elapsed-copyDuration)/Math.max(1,travelDuration)));
  if(!isBacterial()&&copyAt>=0&&!rnaMade){instruction='Copying this DNA section…';copySignal.style.setProperty('--copy-front',(10+80*copyProgress)+'%');copySignal.style.opacity=String(paused||copyProgress>=1?0:Math.min(1,elapsed/240,(copyDuration-elapsed)/240)*.7);}
  if(copyProgress===1&&copyTravel===1&&!rnaMade){rnaMade=true;copyExplained=true;refreshNarrator();}
  if(rnaMade&&!copyExplained){copyExplained=true;refreshNarrator();}
  $('copy-instructions').disabled=copyAt>=0||rnaMade;$('copy-instructions').hidden=rnaMade||!isBacterial()&&copyAt>=0;$('copy-instructions').dataset.success=String(rnaMade);$('copy-instructions-label').textContent=rnaMade?'Instructions copied':copyAt>=0?'Copying…':'Copy instructions';
  $('rna-strand').style.clipPath=`inset(0 ${100*(1-copyProgress)}% 0 0)`;$('rna-message').dataset.forming=String(!rnaMade);next.hidden=!rnaMade||!revealed;nextText='Follow the message';feedback=rnaMade?'Instructions copied. The original DNA stays intact.':'';
 }
 let rx=mw*((portrait?.79:.70)+((portrait?.55:.75)-(portrait?.79:.70))*focus),ry=mh*((portrait?.56:.55)+((portrait?.60:.60)-(portrait?.56:.55))*focus),rw=132+((portrait?200:270)-132)*focus,rh=106+((portrait?160:216)-106)*focus;const ribosome=$('ribosome-target');if(bCopy){rx=mw*(portrait?.75:.78);ry=portrait?mh-95:mh*.66;rx=mw*(portrait?.75:.85);}if(isBacterial()&&phase==='protein')ry=mh*(portrait?.55:.43);
 ribosome.style.left=`${rx-rw/2}px`;ribosome.style.top=`${ry-rh/2}px`;ribosome.style.width=`${rw}px`;ribosome.style.height=`${rh}px`;ribosome.disabled=false;
 ribosome.dataset.destination=String(phase==='export'&&rnaExported&&!rnaArrived&&rnaTravelAt<0||phase==='protein'&&proteinStage==='build'&&aminoSelected>0);
 $('ribosome-task-cue').textContent=phase==='export'?'Deliver message':'Join amino acid';
 ribosome.setAttribute('aria-label',phase==='export'&&rnaExported&&!rnaArrived?'Deliver messenger RNA to the ribosome':phase==='protein'&&proteinStage==='build'&&aminoSelected?'Join the selected amino acid at the ribosome':'About the ribosome');
 $('ribosome-info-label').style.left=`${rx}px`;$('ribosome-info-label').style.top=`${ry+rh/2+1}px`;
 $('cytoplasm-location').style.left=`${portrait?(phase==='protein'?3:mw*.52):(phase==='protein'?mw*.39:mw*.82)}px`;$('cytoplasm-location').style.top=`${portrait?(phase==='protein'?(isBacterial()?mh-46:mh*.98):mh*.02):(phase==='protein'?mh*.85:mh*.12)}px`;
 $('cytoplasm-region').style.left=`${rx-70}px`;$('cytoplasm-region').style.top=`${ry-75}px`;$('cytoplasm-region').dataset.active=String(infoKey==='cytoplasm');
 let qx=bCopy?mw*(portrait?.29:.48):lx+lw*(.62+.24*copyProgress),qy=bCopy?ly+lh+(portrait?75:55):ly+lh*(.22+.58*copyProgress),dock=outside&&rnaArrived?1:0;
 if(!isBacterial()&&phase==='message'){
  const origin={x:lx+lw*.10+62,y:ly+lh*.90+14},outgoing=portrait?{x:mw*.68,y:ly+lh+98}:{x:mw-85,y:Math.max(70,ly+lh*.60)},travel=ease(copyTravel);
  qx=origin.x+(outgoing.x-origin.x)*travel;qy=origin.y+(outgoing.y-origin.y)*travel;
  if(rnaMade)transcriptionHome={u:outgoing.x/mw,v:outgoing.y/mh};
 }
 const rna=$('rna-message');rna.disabled=false;rna.draggable=isBacterial()&&phase==='export'&&!rnaArrived&&rnaTravelAt<0;rna.setAttribute('aria-label','About messenger RNA');rna.dataset.forming=String(phase==='message'&&!rnaMade);
 if(outside){
  $('rna-strand').style.clipPath='none';const start={x:x+w*.54,y:y+h*.67},pore={x:x+w*.96,y:y+h*.48},exit=isBacterial()?{x:mw*(portrait?.29:.48),y:ly+lh+(portrait?75:55)}:{x:pore.x+22,y:pore.y},groove={x:rx-12-8*focus,y:isBacterial()?ry+rh*.18:ry+11+7*focus};
  let point=rnaExported?exit:start;if(!isBacterial()&&phase==='export'&&!rnaExported&&rnaTravelAt<0&&transcriptionHome&&!modelEntryStatic&&!still){const p=ease(learningClock/1600);point={x:mw*transcriptionHome.u+(start.x-mw*transcriptionHome.u)*p,y:mh*transcriptionHome.v+(start.y-mh*transcriptionHome.v)*p};}if(phase==='protein'||rnaArrived)point=groove;
  else if(rnaTravelAt>=0){const duration=rnaTravelStage==='pore'?1200:900,progress=Math.min(1,(learningClock-rnaTravelAt)/duration),e=ease(progress),from=rnaStageStart||point;
   if(rnaTravelStage==='pore'){point=porePassagePoint(from,pore,exit,progress);if(progress===1){rnaExported=true;rnaTravelAt=-1;point=exit;}}
   else{dock=e;point={x:from.x+(groove.x-from.x)*e,y:from.y+(groove.y-from.y)*e};if(progress===1){rnaArrived=true;earn('delivery');rnaArrivalAt=learningClock;rnaTravelAt=-1;point=groove;}}
  }
  qx=point.x;qy=point.y;poreControl.style.left=`${pore.x-25}px`;poreControl.style.top=`${pore.y-25}px`;$('pore-info-label').style.left=`${Math.max(34,Math.min(mw-34,pore.x-46))}px`;$('pore-info-label').style.top=`${pore.y+32}px`;poreControl.querySelector('span').style.left=`${Math.max(4,Math.min(mw-144,pore.x-72))-(pore.x-25)}px`;
 }
 const dockWidth=(isBacterial()?144:112)+((portrait?160:192)-(isBacterial()?144:112))*focus,dockHeight=(isBacterial()?42:28)+10*focus,rnaWidth=124+(dockWidth-124)*dock,rnaHeight=48+(dockHeight-48)*dock;rna.style.width=`${rnaWidth}px`;rna.style.height=`${rnaHeight}px`;rna.style.left=`${qx-rnaWidth/2}px`;rna.style.top=`${qy-rnaHeight/2}px`;rna.style.setProperty?.('--rna-label-lift',`${bCopy&&!dock?-75:5+55*dock}px`);rna.dataset.reading=String(dock===1);const reception=still?0:Math.sin(Math.PI*ease(Math.max(0,(dock-.55)/.45)));ribosome.style.setProperty?.('--receive',String(reception));ribosome.dataset.engaged=String(dock===1);$('ribosome-small-subunit').style.transform='none';$('rna-strand').style.transform=`translateX(${-8*reception}px)`;$('rna-strand').style.maskImage=dock>0&&!isBacterial()?`linear-gradient(90deg,#000 0%,#000 38%,rgba(0,0,0,${1-.6*dock}) 47%,rgba(0,0,0,${1-.6*dock}) 60%,#000 69%,#000 100%)`:'none';rna.style.setProperty?.('--rna-info-opacity','1');rna.style.setProperty?.('--rna-work-label-top',`${isBacterial()&&phase==='protein'?rh/2+48-(rh*.18-rnaHeight/2):rh/2+55}px`);
 if(!isBacterial()&&phase==='message'){
  const name=rna.querySelector('span');name.style.bottom='auto';name.style.top='calc(100% + 12px)';name.style.left='50%';
 }else{const name=rna.querySelector('span');name.style.removeProperty('bottom');name.style.removeProperty('top');name.style.removeProperty('left');}
 if(phase==='export'){
  if(rnaArrived&&!rnaDeliveryExplained){rnaDeliveryExplained=true;rnaArrivalAt=learningClock;refreshNarrator();}
  instruction=rnaArrived?'':rnaTravelAt>=0?(rnaTravelStage==='pore'?'The message passes through this pore.':'The message settles into the ribosome’s channel.'):rnaExported?'Select the ribosome to deliver the message.':'Select the marked nuclear pore.';
  next.hidden=!rnaArrived||!revealed;nextText='Build a protein';feedback=rnaArrived?'':rnaExported&&!isBacterial()?'Message passed through the pore.':'';
 }
 if(phase==='protein'){const result=renderProteinWork(g,{rx,ry,rw,rh,focus},action,next);instruction=result.instruction;feedback=result.feedback;nextText=result.nextText;}
 else{$('protein-work-cue').hidden=true;for(const id of ['sucrose-info-label','glucose-info-label','fructose-info-label','amino-feed-info-label','enzyme-contact-detail'])showLearningLayer(id,false);$('protein-workbar').hidden=true;for(const button of [action,next])if(button.parentElement!==$('dna-learning'))$('dna-learning').append(button);}

 placeCytoplasmLabel();
 renderReading({eligible:phase==='export'&&rnaArrived||phase==='protein'&&['build','growing','repeat-growing'].includes(proteinStage),rx,ry,rw,rh,mw});
 action.classList.toggle('quiet',phase==='protein'&&proteinStage==='done');action.classList.toggle('primary',!(phase==='protein'&&proteinStage==='done'));
 $('sugar-task-cue').hidden=true;
 if(phase==='protein')$('dna-learning').hidden=true;
 $('learning-instruction').textContent=instruction;$('learning-instruction').hidden=!instruction;$('learning-next-label').textContent=nextText;next.setAttribute('aria-label',nextText);$('learning-feedback').dataset.success=String(Boolean(feedback));learningFeedback(feedback);learningWorkCue.hidden=!active||phase==='protein'||!instruction&&!feedback;if(['gene','message'].includes(phase))placeMessageCue();else if(phase==='export'&&rnaArrived)placeSubjectHandoff('ribosome-target');else if(!learningWorkCue.hidden)placeLearningCue(phase==='gene'?'dna-lens':phase==='message'?'rna-message':phase==='export'&&!rnaExported?'pore-target':'ribosome-target');
}


const roleLearningRecap='DNA instructions are copied into messenger RNA. A ribosome reads the message to build a protein. In this example, the protein is an enzyme that helps split sucrose into smaller sugars.';
const roleParts={
 dna:{image:'assets/dna-organic-card.webp',name:'DNA',job:'Stores genetic instructions',fact:'dna-focus',hint:'DNA keeps the genetic instructions.'},
 rna:{image:'assets/messenger-rna-teal-card.webp',name:'Messenger RNA',job:'Carries a copy of instructions to a ribosome',fact:'messenger-rna',hint:'Messenger RNA carries a copy of instructions to a ribosome.'},
 ribosome:{image:'assets/ribosome-contrast-card.webp',name:'Ribosome',job:'Joins amino acids to build a protein',fact:'ribosome',hint:'A ribosome joins amino acids, following the message.'},
 enzyme:{image:'assets/folded-enzyme-card.webp',name:'Protein',job:'Helps split sucrose into smaller sugars',fact:'enzyme-protein',hint:'This protein is an enzyme that helps split sucrose.'}
};
function shuffledRoleKeys(previous=[],avoid=[]){
 const keys=Object.keys(roleParts),bad=new Set([previous.join(','),avoid.join(',')]);
 for(let attempt=0;attempt<12;attempt++){const next=[...keys];for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}if(!bad.has(next.join(',')))return next;}
 for(let offset=0;offset<keys.length;offset++){const next=keys.slice(offset).concat(keys.slice(0,offset));if(!bad.has(next.join(',')))return next;}
 return keys;
}
function resetRoleMatch(){
 const previousCards=[...$('role-parts').children].map(e=>e.id.replace('role-card-',''));
 roleCardOrder=shuffledRoleKeys(previousCards);roleOrder=shuffledRoleKeys(roleOrder,roleCardOrder);
 roleInitialized=true;roleSelected='';roleMatched=[];roleWrong='';
 for(const key of roleOrder){const button=$('role-job-'+key);button.textContent=roleParts[key].job;$('role-jobs').append(button);}
 $('role-feedback').textContent='Select an illustration, then its job.';renderRoleMatch();
}

function renderRoleMatch(){
 const active=phase==='roles',complete=roleMatched.length===4;$('role-match').hidden=!active;scene.dataset.roleComplete=String(active&&complete);if(!active)return;
 $('role-match').dataset.complete=String(complete);$('role-feedback').dataset.success=String(!roleSelected&&!roleWrong&&roleMatched.length>0);
 const cardOrder=complete?Object.keys(roleParts):roleCardOrder,orderKey=cardOrder.join(',');if($('role-parts').dataset.order!==orderKey){for(const key of cardOrder)$('role-parts').append($('role-card-'+key));$('role-parts').dataset.order=orderKey;}


 $('role-selected-cue').dataset.selected=String(Boolean(roleSelected));$('role-selected-cue').hidden=false;
 $('role-prompt').hidden=true;
 for(const [key,part] of Object.entries(roleParts)){
  const matched=roleMatched.includes(key),selected=roleSelected===key,card=$('role-card-'+key),choice=$('role-select-'+key),job=$('role-job-'+key),paired=$('role-paired-'+key);
  card.dataset.matched=String(matched);card.dataset.selected=String(selected);choice.disabled=matched;choice.setAttribute('aria-pressed',String(selected));
  paired.hidden=!matched;paired.textContent=matched?part.job:'';job.hidden=complete||matched;job.disabled=matched||!roleSelected;job.dataset.matched=String(matched);job.dataset.wrong=String(roleWrong===key);job.style.order=String(roleOrder.indexOf(key));
 }
 branches.plantReward(active&&complete);
 $('role-recap').hidden=!complete;$('role-recap').textContent=isBacterial()?bacterialRecap:roleLearningRecap;
 $('role-jobs').hidden=complete;$('role-replay').hidden=!complete;
}
function selectRole(key){
 if(phase!=='roles'||roleMatched.includes(key))return;roleSelected=key;roleWrong='';$('role-feedback').textContent='Choose the job for '+roleParts[key].name+'.';renderRoleMatch();
}
function matchRole(key,keyboard=false){
 if(phase!=='roles'||!roleSelected||roleMatched.includes(key))return;
 if(key!==roleSelected){roleWrong=key;$('role-feedback').textContent='Try a different job. '+roleParts[roleSelected].hint;renderRoleMatch();return;}
 const name=roleParts[key].name;roleMatched.push(key);roleSelected='';roleWrong='';$('role-feedback').textContent=name+' matched. '+roleMatched.length+' of 4 pairs connected.';renderRoleMatch();
 if(roleMatched.length===4){$('role-feedback').textContent='All four matched.';refreshNarrator(false);renderModel();$('caption').tabIndex=-1;$('caption').focus({preventScroll:true});scene.scrollIntoView({block:'start',behavior:still?'auto':'smooth'});}
 else if(keyboard)$('role-select-'+Object.keys(roleParts).find(k=>!roleMatched.includes(k))).focus({preventScroll:true});
}
for(const [key,part] of Object.entries(roleParts)){
 $('role-select-'+key).addEventListener('click',()=>selectRole(key));
 $('role-job-'+key).addEventListener('click',event=>matchRole(key,event.detail===0));
 $('role-info-'+key).addEventListener('click',()=>openObjectInfo(part.fact,$('role-info-'+key)));
}
$('role-replay').addEventListener('click',()=>{if(phase!=='roles')return;resetRoleMatch();refreshNarrator();renderModel();$('role-select-dna').focus({preventScroll:true});});

function selectGene(){if(phase!=='gene')return;finishNarration();geneSelected=true;renderModel();$('learning-next').focus({preventScroll:true});}
function selectRna(){if(phase!=='export'||rnaTravelAt>=0)return;rnaSelected=true;renderModel();}
function beginRnaStage(stage){if(phase!=='export'||rnaTravelAt>=0||rnaArrived||stage==='pore'&&rnaExported||stage==='ribosome'&&!rnaExported)return;finishNarration();resumeInteractiveMotion();rnaTravelStage=stage;rnaTravelAt=learningClock;rnaStageStart=rnaDragPosition;rnaDragPosition=null;rnaTransportHint='';if(still||paused){if(stage==='pore')rnaExported=true;else{rnaArrived=true;earn('delivery');}rnaTravelAt=-1;}renderModel();}
function sendRna(){beginRnaStage(rnaExported?'ribosome':'pore');}
function makeRnaCopy(){if(phase!=='message'||copyAt>=0||rnaMade)return;finishNarration();resumeInteractiveMotion();copyAt=learningClock;if(still||paused)rnaMade=true;renderModel();if(rnaMade)$('learning-next').focus({preventScroll:true});}
function learningAction(){
 if(phase!=='protein')return;finishNarration();resumeInteractiveMotion();
 if(isBacterial()&&proteinStage==='collect'){proteinStage='repeat-growing';bacterialRepeatAt=learningClock;proteinGrowAt=learningClock;proteinFoldAt=-1;refreshNarrator();revealFull();}
 else if(isBacterial()&&proteinStage==='assemble-ready'){proteinStage='joining';bacterialJoinAt=learningClock;refreshNarrator();revealFull();}
 else if(proteinStage==='chain'||proteinStage==='growing'&&learningClock-proteinGrowAt>=proteinGrowDuration){saveVisit();proteinStage='folding';proteinFoldAt=learningClock;proteinFoldReadyAt=-1;$('status').textContent='Folding and releasing the protein.';refreshNarrator();revealFull();}
 else if(proteinStage==='job'){useEnzyme();return;}
 else if(proteinStage==='done'){proteinStage='job';sugarAt=-1;refreshNarrator();}
 renderModel();
}
function chooseAminoAcid(index){if(!proteinInputReady())return;finishNarration();if(index!==expectedAminoAcid()){aminoSelected=0;$('status').textContent='The RNA message specifies the highlighted amino acid next.';renderModel();return;}aminoSelected=index;renderModel();}
function joinAminoAcid(){if(!proteinInputReady()||aminoSelected!==expectedAminoAcid())return;resumeInteractiveMotion();aminoUsed.push(aminoSelected);proteinCount++;aminoSelected=0;proteinAddAt=still||paused?learningClock-360:learningClock;$('status').textContent='Amino acid joined to the growing chain.';renderModel();}
function useEnzyme(){if(phase!=='protein'||!(proteinStage==='job'||proteinStage==='folding'&&learningClock-proteinFoldAt>=proteinFoldDuration+(isBacterial()?2200:0)))return;finishNarration();resumeInteractiveMotion();sugarAt=learningClock;proteinReactionReadyAt=-1;proteinStage='reaction';$('status').textContent=isBacterial()?'Sending lactose to the enzyme.':'Sending sucrose to the enzyme.';refreshNarrator();revealFull();renderModel();}
function proteinHandoffReady(){return proteinStage==='done'&&revealed;}
function nextLearning(){if(phase==='protein'&&!proteinHandoffReady())return;finishNarration();resumeInteractiveMotion();const next={'dna-focus':'gene',gene:geneSelected?'message':'',message:rnaMade?'export':'',export:rnaArrived?'protein':'',protein:proteinHandoffReady()?'roles':''}[phase];if(next){if(next==='roles'&&phase==='protein'){proteinStage='done';proteinCompletionReached=true;}setPhase(next);pause.focus({preventScroll:true});}}
function selectModelNucleus(showInfo=false){if(phase!=='model'||!modelReady)return;modelSelected=true;if(showInfo)openObjectInfo('nucleus',$('select-model-nucleus'));renderModel();}
function liftModelNucleus(event){
 if(phase!=='model')return;earn('lift');modelSelected=true;finishNarration();resumeInteractiveMotion();
 const origin=$('nucleus-object').getBoundingClientRect(),sr=scene.getBoundingClientRect(),target=$('place-nucleus').getBoundingClientRect(),landed=event?.type==='drop'||event?.currentTarget?.id==='place-nucleus';
 liftStart={sceneX:(landed?target.left+(target.width-origin.width)/2:origin.left)-sr.left,sceneY:(landed?target.top+(target.height-origin.height)/2:origin.top)-sr.top,width:origin.width,height:origin.height,landed};
 setPhase('explore');$('status').textContent=landed?'Nucleus placed. Opening the same cutaway.':'Opening the nucleus cutaway.';pause.focus({preventScroll:true});
}
function exploreNucleusPart(key){if(phase!=='explore'||!modelReady)return;selectedPart=key;openObjectInfo(key,$('part-'+key));}
function prepareVisual(key){
 const token=++visualLoadToken,isNuclear=nuclearPhases.includes(key),target=key in physicalSources?physical:isNuclear?$('nuclear-interior'):null;
 incomingDecoded=true;
 if(!target)return;
 const src=isNuclear?'assets/onion-nuclear-interior.webp':physicalSources[key];
 if(!isNuclear){target.alt=key==='world'?'A broad red mushroom cap among grass, moss and forest plants.':'';target.srcset=key==='world'?'assets/forest-mushroom-photo-960.webp 960w, assets/forest-mushroom-photo-1920.webp 1920w, assets/forest-mushroom-photo-3456.webp 2091w':'';target.sizes=key==='world'?'(max-width: 650px) calc(100vw - 40px), 66vw':'';}
 if(target.dataset.source===src&&target.complete&&target.naturalWidth)return;
 if(target.dataset.source!==src){target.dataset.source=src;target.src=src;if(!isNuclear)$('physical-backdrop').src=key==='world'&&innerWidth<=650?'assets/forest-mushroom-photo-960.webp':src;}
 if(typeof target.decode!=='function')return;
 incomingDecoded=false;
 target.decode().then(()=>{if(token!==visualLoadToken)return;incomingDecoded=true;last=0;if(transitionStatic){cancelShotTransition();syncControls();}}).catch(()=>{if(token!==visualLoadToken)return;incomingDecoded=true;last=0;if(transitionStatic){cancelShotTransition();syncControls();}});
}
function renderFocusTransition(e){
 const focus=nuclearMatch||skinMatch;if(!focus)return;
 const camera=document.querySelector(nuclearMatch?'.nuclear-camera':'.camera');
 const rx=focus.width/2+(scene.clientWidth*1.7-focus.width/2)*e,ry=focus.height/2+(scene.clientHeight*1.7-focus.height/2)*e;
 camera.style.zIndex='1';camera.style.maskImage=`radial-gradient(ellipse ${rx}px ${ry}px at ${focus.x}px ${focus.y}px, #000 72%, transparent 100%)`;
 camera.style.opacity=String(nuclearMatch?ease((e-.06)/.94):.08+.92*Math.min(1,e*2));$('outgoing').style.opacity='1';
 if(nuclearMatch){$('outgoing').style.transformOrigin=`${focus.x}px ${focus.y}px`;$('outgoing').style.transform=`translate(${(scene.clientWidth*.5-focus.x)*e*.4}px,${(scene.clientHeight*.45-focus.y)*e*.4}px) scale(${1+1.5*e})`;}
 if(skinMatch)scene.dataset.skinMatchStage=e>.35?'expanding':'patch';
}
function renderSkin(){
 const w=scene.clientWidth,h=scene.clientHeight,portrait=w<650&&h>w,ratio=1672/941;
 const p=still?0:Math.min(1,Math.max(0,(phaseElapsed-400)/6800)),e=p*p*(3-2*p),zoom=1+.6*e;
 const iw=skinFrame?.width||w*(portrait?1.5:1),ih=skinFrame?.height||iw/ratio,startX=skinFrame?.x??(w-iw)/2,startY=skinFrame?.y??(portrait?40:0);
 const left=startX-(zoom-1)*iw*.56,top=startY-(zoom-1)*ih*.44;
 const specimen=$('specimen-view');specimen.style.width=`${iw}px`;specimen.style.height=`${ih}px`;specimen.style.left=`${left}px`;specimen.style.top=`${top}px`;specimen.style.transformOrigin='0 0';specimen.style.transform=`scale(${zoom})`;
 skinFocus={x:startX+.56*iw,y:startY+.44*ih,width:.14*iw*zoom,height:.14*ih*zoom};scene.dataset.skinStage=p===1?'close':'context';
}

function renderCellEntry(){
 const p=phase==='field'?0:phase==='establish'?Math.min(1,cellEntry/1600):1,e=p*p*(3-2*p);
 cell.style.opacity=String(p===0&&phase==='field'?0:.28+.72*e);
 cell.style.maskImage=p===1?'none':`radial-gradient(ellipse ${16+134*e}% ${22+128*e}% at 26.5% 47.8%, #000 65%, transparent 100%)`;
 $('cell-outline').style.opacity=phase==='field'?'1':String(1-.7*e);
 scene.dataset.cellReveal=phase==='field'?'closed':p===1?'open':'opening';
}
function geometry(){
 if(phase==='skin')renderSkin();
 const w=scene.clientWidth,h=scene.clientHeight,ratio=cell.naturalWidth&&cell.naturalHeight?cell.naturalWidth/cell.naturalHeight:1672/941;
 const portrait=w<650&&h>w;
 const s=Math.max(w/(ratio*1000),h/1000)*(portrait?1.12:1);let bw=ratio*1000*s,bh=1000*s;
 const p=still?0:Math.min(1,approach/8000),ease=p*p*(3-2*p);let z=1+(w<650?.25:.48)*ease;
 const tx=w*(w<650?.44:(.265+.13*ease)),ty=h*((w<650&&h>w?.38:.478)-.045*ease);
 let left=Math.min(0,Math.max(w-bw*z,tx-centre.x*bw*z)),top=Math.min(0,Math.max(h-bh*z,ty-centre.y*bh*z));
 if(portrait&&(['field','teaser'].includes(phase)||(phase==='establish'&&cellEntry<1600))){const q=['field','teaser'].includes(phase)?0:cellEntry/1600,f=q*q*(3-2*q);bw=w+(bw-w)*f;bh=w/ratio+(bh-w/ratio)*f;left*=f;top=h*.16*(1-f)+top*f;}
 if(portrait&&['field','establish','invite'].includes(phase)){bw=w;bh=w/ratio;left=0;top=h*.16;z=1;}
 if(portrait&&phase==='approach'&&approachFrame&&!still){const fw=bw*1.25,fh=bh*1.25,fx=Math.min(0,Math.max(w-fw,w*.44-centre.x*fw)),fy=Math.min(0,Math.max(h-fh,h*.335-centre.y*fh));bw=approachFrame.w+(fw-approachFrame.w)*ease;bh=approachFrame.h+(fh-approachFrame.h)*ease;left=approachFrame.x+(fx-approachFrame.x)*ease;top=approachFrame.y+(fy-approachFrame.y)*ease;z=1;}
 const guess=$('guess-surface');guess.style.width=`${bw}px`;guess.style.height=`${bh}px`;guess.style.transform=`translate3d(${left}px,${top}px,0) scale(${z})`;
 world.style.width=`${bw}px`;world.style.height=`${bh}px`;world.style.transform=`translate3d(${left}px,${top}px,0) scale(${z})`;

 nucleus.style.left=`${left+hit.x*bw*z}px`;nucleus.style.top=`${top+hit.y*bh*z}px`;nucleus.style.width=`${hit.w*bw*z}px`;nucleus.style.height=`${hit.h*bh*z}px`;
}
function readAudioPreference(){
 try{const saved=JSON.parse(localStorage.getItem('three-cell-prototype-audio')||'{}');return {soundOn:saved.soundOn!==false,volume:typeof saved.volume==='number'&&saved.volume>=0&&saved.volume<=1?saved.volume:.65,track:saved.track==='sci-fi'?'sci-fi':'tech-soft'};}catch{return {soundOn:true,volume:.65,track:'tech-soft'};}
}
function saveAudioPreference(){try{localStorage.setItem('three-cell-prototype-audio',JSON.stringify({soundOn,volume:masterVolume,track:currentTrack}));}catch{}}
function canPlayAudio(){return soundOn&&hasBegun&&!musicFinished&&!document.hidden&&($('settings').open||((!paused||navigationHold)&&phase!=='idle'));}
function syncSound(){
 syncTrackChoices();
 const soundLabel=soundOn?'Sound on':'Sound off';buttonContent(sound,soundLabel,soundOn?'volume-2':'volume-x');sound.setAttribute('aria-label',soundLabel);sound.setAttribute('title',soundOn?'Mute sound':'Turn sound on');sound.setAttribute('aria-pressed',String(soundOn));
 const states={off:'Off',ready:'',loading:'Loading audio…',playing:masterVolume===0?'Playing · volume at zero':$('settings').open?'Playing · sound preview':'Playing',paused:'Paused',finished:'Music finished',error:'Audio unavailable · toggle Sound on to retry'};
 $('audio-state').textContent=states[audioState]??audioState;$('audio-state').hidden=!$('audio-state').textContent;
}
function stopAudio(state='paused'){audioAttempt++;musicMixer.pause();audioState=soundOn?state:'off';syncSound();}
async function playAudio(){
 if(!canPlayAudio())return;const attempt=++audioAttempt;audioState=musicMixer.running?'playing':'loading';syncSound();await musicMixer.play();if(attempt!==audioAttempt)return;if(audioState!=='error')audioState=musicFinished?'finished':musicMixer.running?'playing':'paused';syncSound();
}
function reconcileAudio(){if(canPlayAudio())playAudio();else stopAudio(!hasBegun?'ready':musicFinished?'finished':'paused');}
function toggleSound(){soundOn=!soundOn;if(soundOn&&musicMixer.loopFailed&&!proteinCompletionReached){musicMixer.reset();musicFinished=false;}saveAudioPreference();reconcileAudio();}
function updateMotion(){if(still&&phase==='chooser')chooserInstant=true;branches.reduceMotion(still);scene.dataset.still=String(still);if(still){cancelShotTransition();cellEntry=1600;scene.dataset.entry='false';if(!revealed)revealFull();syncControls();}renderCellEntry();renderTeaser();renderPhysicalMotion();renderNuclear();renderModel();geometry();renderChooserReveal();}
function settlePresentation(){
 cancelShotTransition();revealFull();
 if(phase==='chooser')chooserInstant=true;
 if(phase==='dna-focus'){modelEntryStatic=true;modelReady=true;}
 if(phase==='protein'&&proteinFocusProgress()<1){modelEntryStatic=true;proteinFocusAt=0;}
 renderModel();geometry();renderChooserReveal();
}
function setPaused(value){paused=value;branches.pause(value);wakeControls();manualSceneHold=false;navigationHold=false;scene.dataset.hold='false';scene.dataset.paused=String(paused);last=0;if(value)settlePresentation();syncControls();reconcileAudio();$('status').textContent=paused?'Exploration paused.':'Exploration resumed.';}
function tick(now){
 const dt=last?Math.min(now-last,100):0;last=now;musicMixer.tick();const musicState=musicMixer.snapshot();scene.dataset.musicVoice=String(musicState.active);scene.dataset.musicOverlap=String(musicState.overlap);scene.dataset.musicLoops=String(musicState.loops);scene.dataset.musicGainA=String(musicState.gains[0]);scene.dataset.musicGainB=String(musicState.gains[1]);scene.dataset.musicGainC=String(musicState.gains[2]);scene.dataset.musicGainD=String(musicState.gains[3]);scene.dataset.musicTrack=musicState.track;scene.dataset.musicSwitching=String(musicState.switching);controlsAwake=Math.max(0,controlsAwake-dt);renderControlsVisibility();
 if(phase==='assemble'&&activityPlaced===3&&incomingDecoded&&(!paused||navigationHold)&&!infoKey&&!guideOpen){bridgeClock+=dt;renderActivity();}
 if(!paused&&incomingDecoded){
  if(!isBacterial()||!infoKey&&!guideOpen)phaseElapsed+=dt;if(phase==='approach'&&scene.dataset.nucleusReaction==='true'&&phaseElapsed>=650){scene.dataset.nucleusReaction='false';syncControls();}if(phase==='chooser')renderChooserReveal();if(['idle','teaser'].includes(phase)&&!still)titleTime+=dt;if(phase==='teaser')renderTeaser();if(phase==='skin')renderSkin();renderPhysicalMotion();if(nuclearPhases.includes(phase)){if(!still&&!infoKey&&!guideOpen)nuclearTime=Math.min(30000,nuclearTime+dt);renderNuclear();}if(learningPhases.includes(phase)&&!infoKey&&!guideOpen)learningClock+=dt;renderModel();
  if(transitioning&&!transitionStatic){
   transitionTime=Math.min(transitionDuration,transitionTime+dt);const p=transitionTime/transitionDuration,e=p*p*(3-2*p);if(scene.dataset.introTransition==='true')scene.style.setProperty('--intro-reveal',String(e));
   if(outgoingMotion){outgoingMotion.node.style.transform=physicalTransform(outgoingMotion.key,outgoingMotion.elapsed+transitionTime,outgoingMotion.duration);if(outgoingMotion.key==='onion'&&phase==='scales'){outgoingMotion.node.style.transformOrigin='48% 80%';outgoingMotion.node.style.transform+=` scale(${1+.22*e})`;}}
   if(skinMatch||nuclearMatch)renderFocusTransition(e);else $('outgoing').style.opacity=String(1-e);
   if(p===1){cancelShotTransition();syncControls();}
  }
  if(phase==='establish'&&cellEntry<1600){cellEntry=Math.min(1600,cellEntry+dt);geometry();renderCellEntry();if(cellEntry===1600){scene.dataset.entry='false';syncControls();}}
  if(!revealed&&!infoKey&&!guideOpen&&!(nuclearMatch&&transitioning)&&!(phase==='dna-focus'&&!modelEntryStatic&&!still&&learningClock<4200)){revealTime+=dt*narrationSpeed;const count=narrationVisibleCount();paintNarration(count);if(count>=currentCopy()[1].length)revealFull();}
  if(phase==='approach'&&approach<8000){approach=Math.min(8000,approach+dt);geometry();if(approach===8000)syncControls();}
  if(!navigationHold&&!still&&revealed&&!infoKey&&!guideOpen&&!transitioning&&sequence[phase]){phaseHold+=dt;const cameraReady=phase!=='approach'||approach===8000;const entryReady=phase!=='establish'||cellEntry===1600;const skinReady=phase!=='skin'||phaseElapsed>=7700,montageReady=phase!=='teaser'||phaseElapsed>=montageTotal();if(cameraReady&&entryReady&&skinReady&&montageReady&&phaseHold>=(phase==='teaser'?0:phase==='model'?Math.max(6000,captions.model[1].length*25/narrationSpeed+2400/narrationSpeed):['world','people'].includes(phase)?openingHold(phase):readingDwell()))setPhase(sequence[phase]);}
 }
 if(manualSceneHold&&!paused&&revealed&&!transitioning&&incomingDecoded&&(phase!=='model'||modelReady)&&(phase!=='skin'||phaseElapsed>=7200)&&(phase!=='approach'||approach>=8000)&&(phase!=='dna-focus'||learningClock>=6800)){manualSceneHold=false;paused=true;scene.dataset.paused='true';syncControls();reconcileAudio();$('status').textContent='Scene ready. Exploration paused; Play resumes.';}
 raf=requestAnimationFrame(tick);
}
function start(startPhase){reviewMode=false;const preference=startPhase==='chooser'?paused:false,destination=startPhase==='chooser'?'chooser':startPhase==='model'?'model':'teaser';wakeControls();hasBegun=true;musicFinished=false;navigationHold=false;cancelShotTransition();approach=0;cellEntry=1600;scene.dataset.entry='false';paused=preference;scene.dataset.paused=String(paused);last=0;musicMixer.reset();$('status').textContent='Exploration started.';setPhase(destination);if(destination==='model'){cancelShotTransition();modelEntryStatic=true;modelReady=true;revealFull();renderModel();}geometry();playAudio();if(!raf)raf=requestAnimationFrame(tick);}
function requiredTask(){
 if(reviewMode)return '';
 if(phase==='field'&&!earnedTasks.plant.has('cell'))return 'Select the outlined cell in the microscope view to continue.';
 if(phase==='invite'&&!earnedTasks.plant.has('nucleus'))return 'Select the small darker nucleus beside the vacuole to continue.';
 if(phase==='boundary')return 'Choose Look inside the nucleus to open the cutaway.';
 if(phase==='model'&&!earnedTasks.plant.has('lift'))return 'Choose Lift out the nucleus, or select it and place it in the inspection area.';
 if(phase==='assemble'&&activityPlaced<3)return 'Complete the three placements in the nucleus model to continue.';
 if(phase==='b-find')return 'Select the folded purple DNA threads to continue.';
 if(phase==='gene'&&!geneSelected)return 'Select the highlighted DNA section to continue.';
 if(phase==='message'&&!rnaMade)return copyAt<0?'Choose Copy instructions to make the RNA message.':paused?'Copying is paused. Resume exploration to continue.':'Let the RNA copy finish before following the message.';
 if(phase==='export'&&!rnaArrived)return !rnaExported?'Pass the message through the marked nuclear pore, then deliver it to the ribosome.':'Deliver the RNA message to the ribosome to continue.';
 if(phase==='protein'&&!proteinHandoffReady())return $('protein-work-status').textContent||'Build, fold and use the protein before continuing.';
 return '';
}
function navigateScene(direction){
 const nextPhase=sceneOrder[sceneOrder.indexOf(phase)+1],forwardName=isBacterial()&&!['idle','teaser','world','people','chooser'].includes(phase)?'C'+(bacteria.number(phase,proteinStage)+1):nextPhase?sceneName(nextPhase):'';
 const returningForward=visitStates.has((reviewMode?'review:':'learn:')+organism+':'+forwardName);
 if(direction>0&&!returningForward){const reason=requiredTask();if(reason){navHint.textContent=reason;navHint.hidden=false;wakeControls();return;}}
 saveVisit();
 if(isBacterial()&&!['idle','teaser','world','people','chooser'].includes(phase)){
  const n=bacteria.number(phase,proteinStage)-1+direction;if(n<0){setPhase('chooser');return;}
  if(n<bacterialScenes.length){const entry=bacterialScenes[n],saved=visitStates.get((reviewMode?'review:':'learn:')+organism+':C'+(n+1));
   if(saved){holdScene(saved.phase,{preservePlayback:true});restorePlantSnapshot(saved);return;}
   // Protein stages advance through the real controls, never fabricated chain counts.
   if(entry.id==='protein'&&phase==='protein'){navHint.textContent='Use the local build, fold and enzyme controls to continue.';navHint.hidden=false;return;}
   holdScene(entry.id,{preservePlayback:true});}return;
 }
 if(branches.navigate(phase,direction))return;
 const target=sceneOrder[sceneOrder.indexOf(phase)+direction];if(!target||phase==='idle')return;
 if(target==='idle'){const preference=paused;returnToBeginning();paused=preference;scene.dataset.paused=String(paused);syncControls();return;}
 const saved=visitStates.get(visitKey(target));holdScene(target,{preservePlayback:true});if(saved)restorePlantSnapshot(saved);
}

function holdScene(target,{animate=false,preservePlayback=false}={}){
 if(['human','bacterial'].includes(target)){branches.open(target,{animate:false});return;}

 cancelShotTransition();navigationHold=!preservePlayback;manualSceneHold=!preservePlayback&&animate&&!still;if(!preservePlayback)paused=!manualSceneHold;scene.dataset.paused=String(paused);last=0;
 approach=['approach','boundary','inside','nucleolus','model','explore','assemble',...learningPhases].includes(target)?8000:0;cellEntry=1600;scene.dataset.entry='false';
 setPhase(target,{staticEntry:preservePlayback?paused||still:!manualSceneHold});if(paused||still)revealFull();geometry();reconcileAudio();
 $('status').textContent=manualSceneHold?'Moving to the selected scene. It will pause for reading.':(paused?'Scene selected. Exploration paused; Play resumes.':'Scene selected. Exploration continues.');
}
function guessNucleus(part){
 if(phase!=='invite')return;finishNarration();const note=$('guess-feedback');note.hidden=false;
 if(part==='nucleus'){scene.dataset.nucleusReaction='true';note.textContent='Yes, that’s the nucleus. Let’s move closer.';note.dataset.tone='correct';selectNucleus();return;}
 note.dataset.tone='retry';note.textContent=part==='vacuole'?'That large pale space is the vacuole. Try the smaller, darker body beside it.':part==='cytoplasm'?'That thin, textured layer is cytoplasm. Look for the darker body within it.':'Try inside the long cell in the centre. Look for the small purple body.';
}
function pointInPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [ax,ay]=points[i],[bx,by]=points[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;}return inside;}
$('guess-surface').addEventListener('click',event=>{
 if(phase!=='invite')return;if(event.detail===0){$('guess-alternative').open=true;$('guess-alternative').querySelector('button').focus({preventScroll:true});return;}
 const r=$('guess-surface').getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
 const nucleusCore=((x-.265)/.10)**2+((y-.485)/.12)**2<=1;
 const vacuole=pointInPolygon(x,y,[[.42,.34],[.73,.25],[.84,.27],[.84,.48],[.67,.55],[.44,.56]]);
 const cytoplasm=pointInPolygon(x,y,[[.38,.59],[.63,.59],[.65,.625],[.40,.645]]);
 guessNucleus(nucleusCore?'nucleus':vacuole?'vacuole':cytoplasm?'cytoplasm':'other');
});
for(const button of document.querySelectorAll('[data-guess]'))button.addEventListener('click',()=>guessNucleus(button.dataset.guess));
function selectNucleus(){if(phase==='invite'){earn('nucleus');finishNarration();resumeInteractiveMotion();const r=world.getBoundingClientRect(),sr=scene.getBoundingClientRect();approachFrame={x:r.left-sr.left,y:r.top-sr.top,w:r.width,h:r.height};approach=0;setPhase('approach');$('status').textContent=still?'Nucleus selected.':'Nucleus selected. Moving closer.';pause.focus({preventScroll:true});}}
$('skip-introduction').addEventListener('click',()=>start('chooser'));begin.addEventListener('click',start);nucleus.addEventListener('click',()=>guessNucleus('nucleus'));chooseCell.addEventListener('click',()=>{if(phase==='field'){earn('cell');finishNarration();resumeInteractiveMotion();cellEntry=still||paused?1600:0;scene.dataset.entry=String(cellEntry<1600);setPhase('establish');$('status').textContent=cellEntry===1600?'Cell interior revealed.':'Cell selected. Revealing the reconstructed interior.';pause.focus({preventScroll:true});}});
lookInside.addEventListener('click',()=>{if(phase!=='boundary')return;finishNarration();resumeInteractiveMotion();setPhase('inside');$('status').textContent='Nuclear cutaway opened. Chromatin is now visible.';pause.focus({preventScroll:true});});
$('select-model-nucleus').addEventListener('click',()=>selectModelNucleus());
$('model-nucleus-info').addEventListener('click',()=>openObjectInfo('nucleus',$('model-nucleus-info')));
$('pore-info-label').addEventListener('click',()=>openObjectInfo('export',$('pore-info-label')));
$('place-nucleus').addEventListener('click',liftModelNucleus);
$('copy-instructions').addEventListener('click',makeRnaCopy);$('learning-action').addEventListener('click',learningAction);$('learning-next').addEventListener('click',nextLearning);$('select-gene').addEventListener('click',selectGene);$('rna-message').addEventListener('click',()=>{if(performance.now()-rnaDragEnded>400&&['message','export','protein'].includes(phase))openObjectInfo('messenger-rna',$('rna-message'));});$('ribosome-target').addEventListener('click',()=>{if(phase==='export'&&rnaExported&&!rnaArrived)beginRnaStage('ribosome');else if(phase==='protein'&&proteinInputReady()&&aminoSelected)joinAminoAcid();else if(['message','export','protein'].includes(phase))openObjectInfo('ribosome',$('ribosome-target'));});$('ribosome-info-label').addEventListener('click',()=>openObjectInfo('ribosome',$('ribosome-info-label')));$('cytoplasm-location').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-location')));$('cytoplasm-region').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-location')));$('pore-target').addEventListener('click',()=>beginRnaStage('pore'));$('dna-info-label').addEventListener('click',()=>openObjectInfo('dna-focus',$('dna-info-label')));
$('start-activity').addEventListener('click',()=>{if(phase==='explore'){finishNarration();resumeInteractiveMotion();setPhase('assemble');$('activity-question').focus({preventScroll:true});}});
$('activity-next').addEventListener('click',nextActivityStep);$('place-activity-part').addEventListener('click',placeActivityPart);
for(const key of ['dna','nucleolus','envelope','pores','nucleoplasm']){const choice=$('choice-'+key);choice.addEventListener('click',()=>chooseActivityPart(key));choice.addEventListener('dragstart',event=>{chooseActivityPart(key);if(phase!=='assemble'||activityCommitted||key!==activitySteps[activityStep].key){event.preventDefault();return;}event.dataTransfer?.setData('text/plain','nucleus-part-'+key);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';});}
for(const id of ['place-activity-part','nucleus-object']){
 $(id).addEventListener('dragover',event=>{if(phase==='assemble'&&!activityCommitted&&activityChoice===activitySteps[activityStep].key){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
 $(id).addEventListener('drop',event=>{if(phase==='assemble'){event.preventDefault();placeActivityPart();}});
}
$('return-cell').addEventListener('click',()=>holdScene('model'));
$('select-model-nucleus').addEventListener('dragstart',event=>{if(phase!=='model'||!modelReady){event.preventDefault();return;}scene.dataset.draggingNucleus='true';closeObjectInfo(false);selectModelNucleus(false);event.dataTransfer?.setData('text/plain','onion-model-nucleus');if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setDragImage?.($('nucleus-cutaway'),40,35);}});
$('select-model-nucleus').addEventListener('dragend',()=>{const landed=phase==='model'&&modelSelected&&$('place-nucleus').dataset.over==='true';scene.dataset.draggingNucleus='false';$('place-nucleus').dataset.over='false';if(landed)liftModelNucleus({type:'drop'});else renderModel();});
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
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('review-navigation').open){event.preventDefault();$('review-navigation').open=false;$('review-toggle').focus({preventScroll:true});return;}if(event.key==='Escape'&&guideOpen){event.preventDefault();closeGuide();return;}if(event.key==='Escape'&&infoKey){event.preventDefault();closeObjectInfo();return;}if(event.target?.closest?.('#object-info,#interaction-guide,#model-activity,#dna-learning,#role-match'))return;if(event.altKey||event.ctrlKey||event.metaKey||$('settings').open||event.target?.matches?.('input,select,textarea,[contenteditable=true]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();navigateScene(event.key==='ArrowLeft'?-1:1);}});
pause.addEventListener('click',()=>{if(pause.disabled)return;if(phase==='assemble'&&navigationHold){navigationHold=false;scene.dataset.hold='false';setPaused(true);}else setPaused(!paused);});sound.addEventListener('click',toggleSound);
function syncTrackChoices(){for(const key of ['tech-soft','sci-fi'])$('track-'+key).checked=$('music-track').value===key;}
async function chooseMusicTrack(key){currentTrack=key;$('music-track').value=key;syncTrackChoices();saveAudioPreference();await musicMixer.select(currentTrack==='sci-fi'?1:0);if(canPlayAudio()&&!musicMixer.running)playAudio();}
$('music-track').addEventListener('change',()=>chooseMusicTrack($('music-track').value));
for(const key of ['tech-soft','sci-fi'])$('track-'+key).addEventListener('change',()=>{if($('track-'+key).checked)return chooseMusicTrack(key);});
$('volume').addEventListener('input',()=>{masterVolume=Number($('volume').value)/100;musicMixer.setMaster(masterVolume);saveAudioPreference();if($('settings').open&&canPlayAudio()&&!musicMixer.running)playAudio();else syncSound();});
reduced.addEventListener('change',e=>{still=e.matches;updateMotion();});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){navigationHold=false;scene.dataset.hold='false';if(phase!=='idle')setPaused(true);stopAudio('paused');}});
new ResizeObserver(()=>{reserveSceneNarration(phase);geometry();renderModel();paintNarration(revealed?currentCopy()[1].length:narrationVisibleCount());}).observe(scene);
function loaded(){begin.disabled=false;$('skip-introduction').disabled=false;buttonContent(begin,'Begin exploration','arrow-right',true);geometry();}
physical.addEventListener('load',loaded,{once:true});cell.addEventListener('load',geometry);physical.addEventListener('error',()=>{begin.textContent='Reload to load the opening image';});
if(physical.complete&&physical.naturalWidth)loaded();


function cancelShotTransition(){
 scene.dataset.introTransition='false';scene.dataset.specimenTransition='false';scene.style.setProperty('--intro-reveal','1');transitionDuration=1600;

 skinMatch=null;nuclearMatch=null;outgoingMotion=null;transitionStatic=false;scene.dataset.skinMatch='false';scene.dataset.skinMatchStage='none';
 for(const selector of ['.camera','.nuclear-camera']){const camera=document.querySelector?.(selector);if(camera){camera.style.maskImage='none';camera.style.zIndex='';camera.style.opacity='';}}
 transitioning=false;transitionTime=0;$('outgoing').replaceChildren();$('outgoing').style.opacity='0';$('outgoing').style.transform='none';
}
function startShotTransition(key){
 if(isBacterial()){cancelShotTransition();return;}
 if(branches.isCustom(key)&&!(key==='chooser'&&phase==='people')||branches.isCustom(phase)){cancelShotTransition();return;}

 const oldSource=physicalSources[phase],newSource=physicalSources[key];
 const oldView=oldSource?'physical':phase==='teaser'?'teaser':nuclearPhases.includes(phase)?'nuclear':'cell';
 const newView=newSource?'physical':key==='teaser'?'teaser':nuclearPhases.includes(key)?'nuclear':'cell';
 const changes=oldSource!==newSource&&(oldSource||newSource)||oldView!==newView;
 if(key==='idle'||!changes||typeof getComputedStyle!=='function'){cancelShotTransition();return;}
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
 if(oldView==='physical'){const r=source.querySelector('[id=specimen-view]')?.getBoundingClientRect();if(r)scene.dataset.handoffSpecimenRect=JSON.stringify({x:r.x,y:r.y,width:r.width,height:r.height});}
 if(oldView==='physical'){Object.assign(clone.style,{position:'absolute',left:source.offsetLeft+'px',top:source.offsetTop+'px',right:'auto',bottom:'auto',width:source.offsetWidth+'px',height:source.offsetHeight+'px',margin:'0'});}
 cancelShotTransition();skinMatch=matched;nuclearMatch=nuclearFocus;transitionStatic=still||paused;scene.dataset.skinMatch=String(Boolean(matched));
 if(oldSource&&oldKey!=='skin')outgoingMotion={node:clone,key:oldKey,elapsed:oldElapsed,duration};
 scene.dataset.handoffSource=initialTransform;scene.dataset.handoffClone=clone.style.transform;
 if(nuclearFocus)transitionDuration=2800;else if(oldKey==='onion'&&key==='scales')transitionDuration=1200;else if(!matched)transitionDuration=700;
 if(key==='chooser'){scene.dataset.introTransition='true';scene.style.setProperty('--intro-reveal','0');transitionDuration=1000;}
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
 resettingVisit=true;reviewMode=false;visitStates.clear();earnedTasks.plant.clear();earnedTasks.bacterial.clear();branches.resetVisits();
 hasBegun=false;musicFinished=false;navigationHold=false;scene.dataset.hold='false';cancelShotTransition();
 if($('settings').open){settingsReturning=true;$('settings').close();}
 approach=0;cellEntry=1600;titleTime=0;modelReady=false;modelSelected=false;selectedPart='';scene.dataset.entry='false';paused=false;scene.dataset.paused='false';last=0;
 stopAudio(soundOn?'ready':'off');musicMixer.reset();setPhase('idle');resettingVisit=false;cancelShotTransition();syncControls();geometry();
 $('status').textContent='Returned to opening.';begin.focus({preventScroll:true});
}

function readingDwell(key=phase){if(key==='onion')return 1800/narrationSpeed;if(key==='establish')return Math.max(2500,Math.min(6500,captions[key][1].trim().split(/\s+/).length*180/narrationSpeed+800));return Math.max(5500,captions[key][1].trim().split(/\s+/).length*300/narrationSpeed+1500);}
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

const preloadedImages=[],warmedVisualSources=new Set();let preloadQueued=false;
let roleArtworkQueued=false;
function warmRoleArtwork(){
 if(roleArtworkQueued)return;roleArtworkQueued=true;
 for(const part of Object.values(roleParts)){const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=part.image;if(typeof image.decode==='function')image.decode().catch(()=>{});preloadedImages.push(image);}
}
function scheduleLaterImages(){
 if(preloadQueued)return;preloadQueued=true;
 const warm=()=>{for(const src of ['assets/teaser-human-epithelium.webp','assets/forest-mushroom-photo-1920.webp','assets/frog-on-hand.webp']){const image=new Image();image.fetchPriority='low';image.decoding='async';image.src=src.includes('forest-mushroom-photo')&&innerWidth<=650?'assets/forest-mushroom-photo-960.webp':src;preloadedImages.push(image);}};
 if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:1500});else requestAnimationFrame(warm);
}
physical.addEventListener('load',scheduleLaterImages,{once:true});if(physical.complete&&physical.naturalWidth)scheduleLaterImages();
installExplorationCues();
setPhase('idle');updateMotion();syncSound();geometry();if(!raf)raf=requestAnimationFrame(tick);


$('cytoplasm-intro').addEventListener('click',()=>openObjectInfo('cytoplasm',$('cytoplasm-intro')));
function cancelAminoDrag(){if(aminoDrag?.ghost)aminoDrag.ghost.remove();aminoDrag=null;}
for(let i=1;i<=3;i++){
 const aa=$('amino-'+i);aa.draggable=false;
 aa.addEventListener('pointerdown',event=>{if(event.button!==0||!proteinInputReady()||i!==expectedAminoAcid())return;chooseAminoAcid(i);aminoDrag={id:event.pointerId,index:i,x:event.clientX,y:event.clientY,moving:false,ghost:null};aa.setPointerCapture?.(event.pointerId);});
}
document.addEventListener('pointermove',event=>{const drag=aminoDrag;if(!drag||event.pointerId!==drag.id)return;if(!drag.moving&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;drag.moving=true;event.preventDefault();if(!drag.ghost){const ghost=$('amino-'+drag.index).querySelector('span').cloneNode(true);ghost.id='amino-drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.style.background=getComputedStyle($('amino-'+drag.index).querySelector('span')).background;document.body.append(ghost);drag.ghost=ghost;}drag.ghost.style.left=(event.clientX-14)+'px';drag.ghost.style.top=(event.clientY-14)+'px';},{passive:false});
document.addEventListener('pointerup',event=>{const drag=aminoDrag;if(!drag||event.pointerId!==drag.id)return;const r=$('ribosome-target').getBoundingClientRect(),landed=drag.moving&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;cancelAminoDrag();if(landed){event.preventDefault();joinAminoAcid();}});
document.addEventListener('pointercancel',cancelAminoDrag);
for(let i=1;i<=3;i++){
 const aa=$('amino-'+i);aa.addEventListener('click',()=>chooseAminoAcid(i));
 aa.addEventListener('dragstart',event=>{chooseAminoAcid(i);if(!aminoSelected){event.preventDefault();return;}if(event.dataTransfer)event.dataTransfer.setData('text/plain','amino-acid');});
}
$('rna-message').addEventListener('dragstart',event=>{if(!isBacterial()||phase!=='export'||rnaArrived){event.preventDefault();return;}rnaSelected=true;event.dataTransfer?.setData('text/plain','messenger-rna');});
$('rna-message').addEventListener('dragend',()=>{rnaDragEnded=performance.now();});
$('ribosome-target').addEventListener('dragover',event=>{if(isBacterial()&&phase==='export'&&rnaSelected||phase==='protein'&&proteinStage==='build'&&aminoSelected){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
$('ribosome-target').addEventListener('drop',event=>{event.preventDefault();if(isBacterial()&&phase==='export')beginRnaStage('ribosome');else joinAminoAcid();});
$('sugar-substrate').addEventListener('click',useEnzyme);
const sceneMenuItems=[];const introGroup=document.createElement('div');introGroup.className='scene-group-title';introGroup.textContent='Shared introduction';$('scene-menu').append(introGroup);
for(const [i,key] of sceneOrder.entries()){
 if(i===introSceneCount){const plantGroup=document.createElement('div');plantGroup.className='scene-group-title';plantGroup.textContent='A · Onion journey';$('scene-menu').append(plantGroup);}
 const option=document.createElement('option');option.value=key;option.textContent=`${sceneName(key,'plant')} · ${captions[key][0]||'Back in the cell'}`;$('review-scene').append(option);
 const item=document.createElement('button');item.type='button';item.className='scene-option';item.setAttribute('role','menuitem');item.tabIndex=i===0?0:-1;
 const number=document.createElement('span');number.className='scene-option-number';number.textContent=sceneName(key,'plant');const title=document.createElement('span');title.textContent=captions[key][0]||'Back in the cell';item.append(number,title);$('scene-menu').append(item);sceneMenuItems.push(item);
 item.addEventListener('click',()=>{$('review-navigation').open=false;jumpToReviewScene(key);(key==='idle'?$('review-toggle'):pause).focus({preventScroll:true});});
 item.addEventListener('keydown',event=>{const next=event.key==='ArrowDown'?(i+1)%sceneMenuItems.length:event.key==='ArrowUp'?(i+sceneMenuItems.length-1)%sceneMenuItems.length:event.key==='Home'?0:event.key==='End'?sceneMenuItems.length-1:-1;if(next<0)return;event.preventDefault();for(const [j,button] of sceneMenuItems.entries())button.tabIndex=j===next?0:-1;sceneMenuItems[next].focus({preventScroll:true});sceneMenuItems[next].scrollIntoView?.({block:'nearest'});});
}
const bGroup=document.createElement('div');bGroup.className='scene-group-title';bGroup.textContent='C · E. coli journey';$('scene-menu').append(bGroup);
for(const [n,entry]of bacterialScenes.entries()){const item=document.createElement('button');item.type='button';item.className='scene-option';item.setAttribute('role','menuitem');item.tabIndex=-1;item.innerHTML=`<span class="scene-option-number">C${n+1}</span><span>${entry.title}</span>`;const i=sceneMenuItems.length;sceneMenuItems.push(item);$('scene-menu').append(item);item.addEventListener('click',()=>{jumpBacterial(n);$('review-navigation').open=false;pause.focus({preventScroll:true});});item.addEventListener('keydown',event=>{const next=event.key==='ArrowDown'?(i+1)%sceneMenuItems.length:event.key==='ArrowUp'?(i+sceneMenuItems.length-1)%sceneMenuItems.length:event.key==='Home'?0:event.key==='End'?sceneMenuItems.length-1:-1;if(next<0)return;event.preventDefault();sceneMenuItems[next].focus();});}
$('review-navigation').addEventListener('toggle',()=>{
 const open=$('review-navigation').open;$('review-toggle').setAttribute('aria-expanded',String(open));
 if(open){const current=sceneOrder.indexOf(phase);for(const [i,item] of sceneMenuItems.entries()){item.tabIndex=i===current?0:-1;item.setAttribute('aria-current',i===current?'true':'false');}sceneMenuItems[current].focus({preventScroll:true});sceneMenuItems[current].scrollIntoView?.({block:'nearest'});}
 else if(phase==='idle'&&($('scene-menu').contains?.(document.activeElement)||document.activeElement===document.body))$('review-toggle').focus({preventScroll:true});
});
$('review-navigation').addEventListener('focusout',event=>{if(event.relatedTarget&&!$('review-navigation').contains?.(event.relatedTarget))$('review-navigation').open=false;});
function jumpToReviewScene(key){
 reviewMode=true;
 if(isBacterial())resetRouteState();selectOrganism('plant');
 if(!sceneOrder.includes(key))return;if(key==='roles')roleInitialized=false;if(key==='idle'){returnToBeginning();return;}
 if(['teaser','world','people','chooser','plant','human','bacterial','onion','scales','skin','field'].includes(key)){hasBegun=true;holdScene(key);return;}
 hasBegun=true;holdScene('model');if(key!=='model'){
  if(['explore','assemble',...learningPhases].includes(key)){holdScene('explore');modelReady=true;renderModel();}
  if(learningPhases.includes(key)&&key!=='dna-focus'){holdScene('dna-focus');}
  holdScene(key);
 }
 $('review-navigation').open=false;
}
$('review-go').addEventListener('click',()=>jumpToReviewScene($('review-scene').value));

$('amino-info-label').addEventListener('click',()=>openObjectInfo('amino-acids',$('amino-info-label')));

$('exploration-next').append($('start-activity'));buttonContent($('start-activity'),'Complete the nucleus model','arrow-right',true);

for(const [id,key] of [['sucrose-info-label','sucrose'],['glucose-info-label','glucose'],['fructose-info-label','fructose'],['amino-feed-info-label','amino-acids']])$(id).addEventListener('click',()=>openObjectInfo(key,$(id)));
for(const id of ['folded-protein','b-enzyme-units']){const el=$(id);el.setAttribute('role','button');el.removeAttribute('aria-hidden');el.setAttribute('tabindex','0');el.setAttribute('aria-label','About the protein');el.setAttribute('aria-controls','object-info');el.addEventListener('click',()=>openObjectInfo(isBacterial()&&!['job','reaction','done'].includes(proteinStage)?'protein-chain':'enzyme-protein',el));el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openObjectInfo(isBacterial()&&!['job','reaction','done'].includes(proteinStage)?'protein-chain':'enzyme-protein',el);}});}
$('protein-label').addEventListener('click',()=>openObjectInfo(['job','reaction','done'].includes(proteinStage)?'enzyme-protein':'protein-chain',$('protein-label')));



function warmNextVisuals(key){
 const next={chooser:['assets/onion-bulbs.webp','assets/onion-yellow-cutaway.webp'],onion:['assets/onion-yellow-cutaway.webp','assets/onion-field.webp','assets/onion-cell-clean.webp'],scales:['assets/onion-field.webp','assets/onion-nuclear-interior.webp','assets/organic-nucleus-warm.webp'],people:['assets/onion-bulbs.webp']};
 for(const src of next[key]||[]){if(warmedVisualSources.has(src))continue;warmedVisualSources.add(src);const img=new Image();img.decoding='async';img.fetchPriority='low';img.src=src;img.decode?.().catch(()=>{});preloadedImages.push(img);}
}
function hydratePhase(key){
 warmNextVisuals(key);
 const common=['teaser','world','people'].includes(key)?['teaser-purple']:[];
 const plant=['onion','scales','skin','field','establish','invite','approach','boundary'].includes(key);
 const model=['inside','nucleolus','model','explore','assemble',...learningPhases,'roles'].includes(key);
 for(const element of document.querySelectorAll('[data-src],[data-href]')){
  if(common.includes(element.id)||plant&&['field-image','cell'].includes(element.id)||model){
   if(element.dataset.src){element.src=element.dataset.src;element.removeAttribute('data-src');}
   if(element.dataset.href){element.setAttribute('href',element.dataset.href);element.removeAttribute('data-href');}
  }
 }
 if(key==='people')branches.warmCards();
}
const moleculeGradientIds=['amino-shade-1','amino-shade-2','amino-shade-3','protein-ribbon'];
let bacterialChains=0,bacterialRepeatAt=-1,bacterialJoinAt=-1;
const originalMoleculeGradients=Object.fromEntries(moleculeGradientIds.map(id=>[id,[...$(id).querySelectorAll('stop')].map(e=>e.getAttribute('stop-color'))]));
function applyMoleculeArt(value){const b=value==='bacterial',images={'rna-strand':b?'bacterial-messenger-rna.webp':'messenger-rna-teal.webp','ribosome-large-subunit':b?'bacterial-ribosome.webp':'ribosome-contrast.webp','ribosome-small-subunit':b?'bacterial-ribosome.webp':'ribosome-contrast.webp','enzyme-contact-detail':b?'bacterial-folded-chain.webp':'folded-enzyme.webp'};for(const[id,file]of Object.entries(images)){$(id).src='assets/'+file;$(id).removeAttribute('data-src');}$('rna-strand').alt=b?'Single-stranded blue messenger RNA':'Single-stranded teal messenger RNA';const folded=$('folded-protein');folded.setAttribute('href','assets/'+(b?'bacterial-folded-chain.webp':'folded-enzyme.webp'));folded.removeAttribute('data-href');const palette={'amino-shade-1':['#f5e3aa','#d4ad63','#8d673e'],'amino-shade-2':['#f2c8b5','#d18d83','#8e5664'],'amino-shade-3':['#e2d7f4','#b19dd8','#6a609b'],'protein-ribbon':['#d9e5e6','#7f9caf','#c8d8ce']};for(const id of moleculeGradientIds)[...$(id).querySelectorAll('stop')].forEach((e,i)=>e.setAttribute('stop-color',(b?palette[id]:originalMoleculeGradients[id])[i]));for(let i=1;i<=14;i++)$('protein-bead-'+i).setAttribute('stroke',b?'#dde9e8':'#f0e2ce');$('protein-chain-depth').setAttribute('stroke',b?'#3c5369':'#514253');$('protein-ribbon-light').setAttribute('stroke',b?'#e3eeeb':'#f0dec7');}
const plantRoles=structuredClone(roleParts);
function selectOrganism(value){bacteria.resetVisuals();organism=value;applyMoleculeArt(value);scene.dataset.organism=['idle','teaser','world','people','chooser'].includes(phase)?'common':value;Object.assign(roleParts,structuredClone(value==='bacterial'?bacterialRoles:plantRoles));$('nucleus-model').setAttribute('aria-label',isBacterial()?'E. coli DNA and protein-building workspace':'Onion cell and nucleus inspection models');for(const[key,part]of Object.entries(roleParts)){const b=$('role-select-'+key);b.setAttribute('aria-label','Select '+part.name);$('role-info-'+key).setAttribute('aria-label','About '+part.name);const cardImage=b.querySelector(':scope > img');if(cardImage){cardImage.src=part.image;cardImage.removeAttribute('data-src');}const name=b.querySelector(':scope > span');if(name)name.textContent=part.name;}$('sucrose-info-label').textContent=isBacterial()?'Lactose':'Sucrose';$('fructose-info-label').textContent=isBacterial()?'Galactose':'Fructose';const stops=$('fructose-shade').querySelectorAll('stop');stops[0].setAttribute('stop-color',isBacterial()?'#d8e0c7':'#e5d8ed');stops[1].setAttribute('stop-color',isBacterial()?'#879b7d':'#9880a1');$('sugar-half-b').querySelector('circle').setAttribute('stroke',isBacterial()?'#b7c5a2':'#c6afcc');}
function resetRouteState(){transcriptionHome=null;bacterialChains=0;bacterialRepeatAt=-1;bacterialJoinAt=-1;roleInitialized=false;roleSelected='';roleMatched=[];roleOrder=[];roleCardOrder=[];proteinStage='build';proteinCompletionReached=false;proteinCount=0;aminoSelected=0;aminoUsed=[];}
function jumpBacterial(n,fresh=true){if(fresh){reviewMode=true;resetRouteState();}if(fresh||!isBacterial())selectOrganism('bacterial');hasBegun=true;const entry=bacterialScenes[n];if(fresh)holdScene(entry.id);else{navigationHold=false;manualSceneHold=false;setPhase(entry.id,{staticEntry:paused||still});if(paused)revealFull();reconcileAudio();}if(entry.id==='protein'&&entry.stage!=='build'){$('review-context').textContent='Review selected C'+(n+1)+'. Build a chain first to explore its folding and enzyme activity; earlier tasks are not completed.';}}

function plantSnapshot(){return {phase,reviewMode,transcriptionHome,bacterialChains,bacterialRepeatAt,bacterialJoinAt,roleInitialized,roleSelected,roleMatched:[...roleMatched],roleOrder:[...roleOrder],roleCardOrder:[...roleCardOrder],roleWrong,activityStarted,activityStep,activityPlaced,activityChoice,activityCommitted,activityFeedback,activityOrder:[...activityOrder],bridgeClock,learningClock,geneSelected,copyAt,rnaMade,rnaSelected,rnaTravelAt,rnaArrived,rnaExported,rnaTravelStage,proteinCount,proteinCompletionReached,copyExplained,proteinStage,aminoSelected,aminoUsed:[...aminoUsed],proteinFoldAt,sugarAt,proteinFocusAt,proteinGrowAt,proteinAddAt,proteinGrowReadyAt,proteinFoldReadyAt,proteinReactionReadyAt,rnaDeliveryExplained,rnaArrivalAt,exploreInvited,exploreReadClock,modelSelected};}
function restorePlantSnapshot(s){
 ({reviewMode=false,transcriptionHome=null,bacterialChains=0,bacterialRepeatAt=-1,bacterialJoinAt=-1,roleInitialized,roleSelected,roleMatched,roleOrder,roleCardOrder=Object.keys(roleParts),roleWrong,activityStarted,activityStep,activityPlaced,activityChoice,activityCommitted,activityFeedback,activityOrder,bridgeClock,learningClock,geneSelected,copyAt,rnaMade,rnaSelected,rnaTravelAt,rnaArrived,rnaExported,rnaTravelStage,proteinCount,proteinCompletionReached,copyExplained,proteinStage,aminoSelected,aminoUsed,proteinFoldAt,sugarAt,proteinFocusAt,proteinGrowAt,proteinAddAt,proteinGrowReadyAt,proteinFoldReadyAt,proteinReactionReadyAt,rnaDeliveryExplained,rnaArrivalAt,exploreInvited,exploreReadClock,modelSelected}=s);
 reviewContext.hidden=!reviewMode;scene.dataset.review=String(reviewMode);modelReady=true;modelEntryStatic=true;refreshNarrator(false);revealFull();renderModel();syncControls();
}

function enterPlantRoute(key){
 reviewMode=false;
 if(still||paused){holdScene(key);$('status').textContent=isBacterial()?'Opening the E. coli journey.':'Opening the onion specimen journey.';return;}
 navigationHold=false;scene.dataset.hold='false';setPhase(key);last=0;reconcileAudio();
 $('status').textContent=isBacterial()?'Opening the E. coli journey.':'Opening the onion specimen journey.';
}

function renderChooserReveal(){
 if(phase!=='chooser'){$('caption').style.opacity='';$('caption').removeAttribute('aria-hidden');return;}
 if(revealed&&chooserReadAt<0)chooserReadAt=phaseElapsed;
 const elapsed=chooserInstant?100000:chooserReadAt<0?-100000:phaseElapsed-chooserReadAt;
 const question=chooserInstant?1:ease((elapsed-450)/650);$('caption').style.opacity=String(question);$('caption').setAttribute('aria-hidden',String(question<1));
 for(const [i,key]of ['plant','human','bacterial'].entries()){
  const progress=chooserInstant?1:ease((elapsed-1250-i*220)/900),card=document.querySelector(`[data-cell="${key}"]`);
  card.style.setProperty('--choice-reveal',String(progress));card.setAttribute('aria-hidden',String(progress===0));if(key!=='human')card.disabled=progress<1;
 }
 scene.dataset.choiceReveal=elapsed<1250?'narrating':elapsed<2590?'revealing':'ready';
}

function installExplorationCues(){
 const targets=[['cytoplasm-intro','cytoplasm'],['vacuole-label','vacuole'],['select-model-nucleus','nucleus'],['model-nucleus-info','nucleus']];
 const preview=()=>{const hovered=targets.find(([id])=>$(id).matches(':hover')),focused=targets.find(([id])=>$(id)===document.activeElement);hoverCell=phase==='model'?(hovered?.[1]||focused?.[1]||''):'';renderCellCues();};
 for(const [id]of targets)for(const event of ['mouseenter','mouseleave','focus','blur'])$(id).addEventListener(event,preview);
 const svg=$('cell-game-model').querySelector('svg'),ns='http://www.w3.org/2000/svg';
 const outer=svg.querySelectorAll(':scope > path')[1],vacuole=$('vacuole-shape');
 const mask=document.createElementNS(ns,'mask');mask.id='cytoplasm-region-mask';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1100');mask.setAttribute('height','600');
 for(const [source,color]of [[outer,'white'],[vacuole,'black']]){const path=document.createElementNS(ns,'path');path.setAttribute('d',source.getAttribute('d'));path.setAttribute('fill',color);mask.append(path);}
 const nucleusHole=document.createElementNS(ns,'ellipse');for(const [key,value]of Object.entries({cx:220,cy:322,rx:72,ry:58,fill:'black'}))nucleusHole.setAttribute(key,value);mask.append(nucleusHole);svg.querySelector('defs').append(mask);
 const region=document.createElementNS(ns,'path');region.id='cell-cytoplasm-region';region.setAttribute('d',outer.getAttribute('d'));region.setAttribute('mask','url(#cytoplasm-region-mask)');svg.append(region);

 for(const key of Object.keys(nucleusParts))for(const prefix of ['part-','hit-']){
  const button=$(prefix+key);for(const event of ['mouseenter','focus'])button.addEventListener(event,()=>{if(phase==='explore'){hoverPart=key;renderNucleusCues(modelGeometry);}});
  for(const event of ['mouseleave','blur'])button.addEventListener(event,()=>{if(hoverPart===key){hoverPart='';renderNucleusCues(modelGeometry);}});
 }
}
function renderCellCues(){
 const key=phase==='model'?(hoverCell||(['nucleus','vacuole','cytoplasm'].includes(infoKey)?infoKey:'')):'';
 for(const [id,part]of [['cytoplasm-intro','cytoplasm'],['vacuole-label','vacuole'],['select-model-nucleus','nucleus'],['model-nucleus-info','nucleus']])$(id).dataset.cueActive=String(key===part);
 $('cell-game-model').dataset.structurePreview=key;
 $('cell-cytoplasm-region').style.display=key==='cytoplasm'?'':'none';
}

// New shared-opening pacing applies only to the mushroom and frog scenes.
function openingHold(key){return Math.max(2800,Math.min(10000,captions[key][1].trim().split(/\s+/).length*210/narrationSpeed+1100));}

// Lay out the complete paragraph once. Reveal its existing glyphs instead of
// rebalancing a growing substring (text-wrap:pretty moved previously read words).
function paintNarration(count){
 const node=$('detail-visual'),text=currentCopy()[1];count=Math.min(text.length,Math.max(0,count));
 if(node.textContent!==text)node.textContent=text;
 node.dataset.visibleCopy=text.slice(0,count);node.dataset.visibleCharacters=String(count);
 const bounds=node.getBoundingClientRect(),key=[text,count,bounds.width,bounds.height].join('|');
 if(node._paintKey===key)return;node._paintKey=key;
 if(count===text.length){node.style.clipPath='none';return;}
 if(!count){node.style.clipPath='inset(0 100% 0 0)';return;}
 const range=document.createRange();range.setStart(node.firstChild,0);range.setEnd(node.firstChild,count);
 const path=Array.from(range.getClientRects(),r=>{const x=r.left-bounds.left-1,y=r.top-bounds.top-1,w=r.width+2,h=r.height+2;return `M${x} ${y}h${w}v${h}h${-w}Z`;}).join('');
 node.style.clipPath=`path('${path}')`;
}

function refreshNarrationMetrics(){reserveSceneNarration(phase);const node=$('detail-visual');node._paintKey='';paintNarration(revealed?currentCopy()[1].length:narrationVisibleCount());}
document.fonts?.ready.then(refreshNarrationMetrics);
document.fonts?.addEventListener('loadingdone',refreshNarrationMetrics);

function renderNucleusCues(g){
 if(!g)return;const {mw,mh,x,y,w,h,portrait}=g,inspecting=phase==='explore',visualPart=phase==='explore'?(hoverPart||selectedPart):'';
 scene.dataset.activePart=visualPart;scene.dataset.envelopeActive=String(visualPart==='envelope');
 const active=phase==='explore'&&modelReady,labels=$('part-labels');labels.hidden=!active;const leaders=$('part-leaders');leaders.hidden=!active;leaders.style.display=phase==='explore'&&modelReady?'':'none';leaders.setAttribute('viewBox',`0 0 ${mw||1} ${mh||1}`);let lines='',activeLine='',activePoint=null;
 for(const [key,part] of Object.entries(nucleusParts)){
  const target=$('part-'+key),hit=$('hit-'+key),px=x+w*part.point[0],py=y+h*part.point[1];
  target.style.width='max-content';const labelWidth=Math.ceil(target.getBoundingClientRect().width)||(portrait?119:145);
  const lx=portrait?Math.min(mw-labelWidth-2,Math.max(2,key==='envelope'?x+w*.52-labelWidth/2:x+w*part.label[0]-labelWidth/2)):(key==='envelope'?x+w*.52-labelWidth/2:key==='dna'?x-166:x+w+20);
  const ly=key==='envelope'?y-56:portrait?y+h*part.label[1]-22:y+h*({envelope:0,pores:.22,nucleolus:.49,dna:.70,nucleoplasm:.84}[key])-22;
  target.style.left=`${lx}px`;target.style.top=`${ly}px`;target.style.width='max-content';target.disabled=!active;target.setAttribute('aria-pressed',String(selectedPart===key));target.dataset.previewActive=String(visualPart===key);
  hit.style.left=`${part.point[0]*100}%`;hit.style.top=`${part.point[1]*100}%`;hit.hidden=!active;hit.dataset.active=String(visualPart===key);
  const leaderY=ly+(key==='envelope'?44:22);lines+=`M${lx+labelWidth/2} ${leaderY} L${px} ${py} `;if(visualPart===key){activeLine=`M${lx+labelWidth/2} ${leaderY} L${px} ${py}`;activePoint={x:px,y:py};}
 }
 $('part-leader-lines').setAttribute('d','');$('active-part-link').style.display=activeLine&&phase==='explore'?'':'none';for(const id of ['active-part-link-under','active-part-link-line'])$(id).setAttribute('d',activeLine);if(activePoint){$('active-part-link-point').setAttribute('cx',String(activePoint.x));$('active-part-link-point').setAttribute('cy',String(activePoint.y));}$('part-highlights').hidden=!inspecting||!visualPart||visualPart==='envelope';$('part-highlights').style.display=inspecting&&visualPart&&visualPart!=='envelope'?'':'none';
 if(visualPart){const halo=nucleusParts[visualPart].halo;for(const [attr,value] of Object.entries({cx:halo[0]*1000,cy:halo[1]*800,rx:halo[2]*1000,ry:halo[3]*800}))for(const id of ['selected-part-halo-under','selected-part-halo'])$(id).setAttribute(attr,String(value));}
}

function narrationVisibleCount(){const at=currentCopy()[1].indexOf('\n\n');let time=revealTime;if(at>=0&&time>at*25)time=Math.max(at*25,time-700);return Math.floor(time/25);}
function finishNarration(){if(!revealed)revealFull();}
function narrationDwell(){return Math.max(2200,Math.min(6500,currentCopy()[1].trim().split(/\s+/).length*220))/narrationSpeed;}
function prepareExplicitAction(event){
 const button=event.target?.closest?.('button');if(!button||button.disabled||['pause','settings-toggle','close-settings','sound'].includes(button.id))return;
 if(!['next-scene','previous-scene'].includes(button.id))navHint.hidden=true;
 if(button.id==='next-scene'&&phase==='protein'&&proteinStage==='done'&&!revealed)return;
 let changed=!revealed;finishNarration();
 if(['model','explore'].includes(phase)&&!modelReady){modelReady=true;modelEntryStatic=true;changed=true;}
 if(changed){renderModel();syncControls();}
}
document.addEventListener('click',prepareExplicitAction,true);
document.addEventListener('dragstart',prepareExplicitAction,true);
function renderReturnPlacement(){
 const button=$('return-cells'),roles=phase==='roles',complete=roles&&roleMatched.length===4,host=roles?$('role-actions'):document.querySelector('header');
 if(button.parentElement!==host)host.append(button);
 button.classList.toggle('journey-return',!roles);button.classList.toggle('primary',complete);button.classList.toggle('quiet',!complete);
 button.textContent=roles?'Back to the three cells':'Return to cells';button.setAttribute('aria-label',button.textContent);
}


function reserveSceneNarration(key){
 const rows=isBacterial()&&bacteria.early.includes(key)?bacteria.early.map(k=>bacterialCopy[k]):isBacterial()&&['message','export'].includes(key)?[bacterialCopy.message,bacterialCopy.export,bacterialDelivery,['A message to read.','This copy is messenger RNA, or mRNA. Ribosomes read its instructions to build protein chains.']]:key==='protein'?Object.values(isBacterial()?bacterialProtein:proteinNarratives):key==='export'?[captions.export,deliveryNarrative]:[],reserve=$('process-copy-reserve'),caption=$('caption');
 if(reserve.dataset.phase!==organism+':'+key){reserve.dataset.phase=organism+':'+key;reserve.replaceChildren(...rows.map(([,text])=>{const span=document.createElement('span');span.textContent=text;span.style.gridArea='1 / 1';return span;}));}
 if(!rows.length){caption.style.minHeight='';return;}
 const width=caption.getBoundingClientRect().width;if(!width)return;
 const css=getComputedStyle(caption),probe=document.createElement('div');Object.assign(probe.style,{position:'fixed',left:'-10000px',top:'0',width:width+'px',visibility:'hidden',pointerEvents:'none',fontFamily:css.fontFamily,fontSize:css.fontSize,fontWeight:css.fontWeight,lineHeight:css.lineHeight,letterSpacing:css.letterSpacing,textWrap:css.textWrap,padding:'0',margin:'0',border:'0'});document.body.append(probe);
 let height=0;for(const [title]of rows){probe.textContent=title;height=Math.max(height,probe.getBoundingClientRect().height);}probe.remove();
 if(caption.style.minHeight!==height+'px')caption.style.minHeight=height+'px';
}
