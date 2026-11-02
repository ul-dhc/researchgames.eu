import {ribosomeRegions,ribosomeRegionCount} from './bacterial-ribosome-regions.js?v=20261102-a13-laptop9';
import {cellFacts,DNA_INSTRUCTIONS} from './cell-facts.js?v=20261102-a13-laptop9';
export const bacterialScenes=[
 {id:'b-orient',title:'One cell, one living organism.'},{id:'b-close',title:'Closer to the same cell.'},{id:'b-explore',title:'A different arrangement.'},{id:'b-find',title:'Find the DNA.'},
 {id:'dna-focus',title:'A closer look at DNA.'},{id:'gene',title:'One gene, one example.'},{id:'message',title:'Copy the instructions.'},{id:'export',title:'Read the message here.'},
 {id:'protein',stage:'build',title:'Build a protein chain.'},{id:'protein',stage:'collect',title:'Four chains, one enzyme.'},{id:'protein',stage:'job',title:'An enzyme meets lactose.'},{id:'roles',title:'Connect the parts.'}
];
export const bacterialCopy={
 'b-orient':['One cell, one living organism.','A bacterium is a whole living organism made of one cell. This E. coli cell is too small to see with your eyes alone.'],
 'b-close':['Closer to the same cell.','E. coli is much smaller than a plant cell. This cutaway reveals its interior: DNA and ribosomes lie in the cytoplasm, with no nucleus around the DNA.'],
 'b-explore':['A different arrangement.','DNA and ribosomes share the cytoplasm. Select a name label to explore the structures around them.'],
 'b-find':['Find the DNA.','Select the folded purple threads inside the cell. They carry this cell’s genetic instructions.'],
 'dna-focus':['A closer look at DNA.',DNA_INSTRUCTIONS+' Let’s follow one section of this cell’s DNA.'],
 gene:['One gene, one example.','This section of DNA is a gene. It holds instructions for one protein chain. We’ll use it to make an enzyme, a protein that helps break down lactose, a sugar.'],
 message:['Copy the instructions.','The cell copies this gene into messenger RNA. The nearby ribosome can read the emerging message here in the same cytoplasm.'],
 export:['Read the message here.','Messenger RNA carries the copied instructions to a ribosome. The ribosome reads the message here in the cytoplasm. There is no nuclear boundary to cross.'],
 roles:['Connect the parts.','Match each familiar part to its job in using DNA instructions to make an enzyme that helps this cell use lactose.']
};
export const bacterialProtein={
 build:['Build an enzyme to use lactose.','Let’s help this E. coli cell use lactose. We’ll make beta-galactosidase, an enzyme that breaks down lactose. This enzyme consists of four matching folded protein chains. The ribosome reads the same message to make each chain, then their folded shapes fit together.'],
 growing:['The chain keeps growing.','The RNA message determines which amino acid comes next. The ribosome keeps reading it and joining amino acids. Parts of the new chain begin to fold as they emerge.'],
 chain:['Our first chain is ready.','Fold and release this chain. Then use the same message and ribosome to make three more. Their matching folded shapes will fit together into one enzyme.'],
 folding:['Fold the first chain.','The chain folds as it leaves the ribosome. One folded chain is one part of this enzyme; the complete enzyme needs four matching chains.'],
 'repeat-growing':['Use the same instructions again.','The ribosome reads the same messenger RNA to build another matching protein chain from amino acids.'],
 'repeat-folding':['Another chain takes shape.','The new protein chain folds and leaves the ribosome, joining the chains you have already made.'],
 'assemble-ready':['Four chains, one enzyme.','You have made four folded protein chains. Their matching surfaces fit together into one lactose-breaking enzyme.'],
 joining:['The chains fit together.','Four matching folded chains join to form one enzyme. The enzyme can now help split lactose.'],
 job:['Our lactose enzyme is ready.','Four folded chains fit together as one enzyme. Bring lactose, a sugar, to the enzyme and watch what happens.'],
 reaction:['An enzyme meets lactose.','The enzyme helps split lactose into glucose and galactose. Watch the two smaller sugars separate and move away.'],
 done:['From instructions to a useful job.','The cell can break down these sugars to release energy, or use them to make materials it needs. You’ve followed DNA to a working lactose enzyme.\n\nLet’s connect the parts and their jobs.']
};
export const bacterialDelivery=['A message the ribosome can read.','The ribosome is reading this message in the same cytoplasm. Now let’s build the protein chain.'];
export const bacterialReward=['Well done!','You’ve matched these four parts to their jobs. Making proteins uses materials and energy. You’re ready to explore the next challenge.'];
export const bacterialRecap='DNA instructions are copied into messenger RNA. A ribosome reads the message and builds a protein chain. Four folded chains work together as an enzyme that helps split lactose into glucose and galactose.';
export const bacterialRoles={
 dna:{image:'assets/dna-organic-card.webp',name:'DNA',job:'Stores genetic instructions',fact:'dna-focus',hint:'DNA keeps the cell’s genetic instructions.'},
 rna:{image:'assets/bacterial-messenger-rna-card.webp',name:'Messenger RNA',job:'Carries copied instructions to a ribosome',fact:'messenger-rna',hint:'Messenger RNA carries a temporary copy of instructions.'},
 ribosome:{image:'assets/bacterial-ribosome-card.webp',name:'Ribosome',job:'Joins amino acids to build a protein chain',fact:'ribosome',hint:'A ribosome reads the message and joins amino acids.'},
 enzyme:{image:'assets/bacterial-folded-chain-card.webp',name:'Lactose enzyme',job:'Helps split lactose into glucose and galactose',fact:'enzyme-protein',hint:'The enzyme helps break lactose into two smaller sugars.'}
};
export function createBacterialRoute(api){
 const{scene,$}=api,ns='http://www.w3.org/2000/svg',early=['b-orient','b-close','b-explore','b-find'];
 const facts={
  'b-membrane':{name:'Cell membrane',text:'The inner cell membrane controls what enters and leaves the cytoplasm. E. coli also has a thin supporting wall and an outer membrane, which help protect the cell. These layers are not separately resolved in this simplified illustration.'},
  'flagella':{name:'Flagella',text:'These long, thin structures can rotate to help E. coli move through its surroundings.'},
  'b-wall':{name:'Cell wall',text:'A thin peptidoglycan wall helps support and protect this E. coli cell. It lies between the inner and outer membranes. These layers together form the cell envelope.'},
  'b-dna':{name:'DNA',text:DNA_INSTRUCTIONS+' This cell’s DNA is concentrated in an area called the nucleoid. There is no membrane around this DNA area and no nucleus.'},
  cytoplasm:cellFacts.cytoplasm,ribosome:cellFacts.ribosomes,'b-ribosomes':cellFacts.ribosomes,
  'dna-focus':{name:'DNA',text:DNA_INSTRUCTIONS+' The same double-helix molecule forms this cell’s long chromosome. Its folded DNA is not enclosed in a nucleus.'},
  gene:{name:'Gene',text:'A gene is a DNA section with instructions for a functional product. This example supplies instructions for one protein chain. Some bacterial messages carry instructions for more than one chain.'},
  'messenger-rna':{name:'Messenger RNA',text:'Messenger RNA, or mRNA, carries a temporary copy of protein-building instructions from DNA to a ribosome. In bacteria, a ribosome can begin reading a message while it is still being copied.'},
  'amino-acids':{name:'Amino acids',text:'Amino acids are the small building blocks of proteins. E. coli can make amino acids and can take some up from its surroundings. A ribosome joins them in the order specified by messenger RNA.'},
  'protein-chain':{name:'Growing protein chain',text:'The ribosome joins amino acids into a protein chain while reading messenger RNA. A chain folds as it emerges and leaves the ribosome. This enzyme needs four matching folded chains.'},
  'enzyme-protein':{name:'Lactose enzyme',text:'Beta-galactosidase is an E. coli enzyme that helps split lactose into glucose and galactose. This enzyme consists of four matching folded protein chains; other proteins can have different numbers of chains. It remains available after releasing the products.'},
  lactose:{name:'Lactose',text:'Lactose is a sugar made from two linked smaller sugars: glucose and galactose. Beta-galactosidase helps break the link. Lactose is also found in milk.'},
  glucose:{name:'Glucose',text:'Glucose is one of the smaller sugars released when lactose is split. E. coli can use it in metabolism, including reactions that release usable energy.'},
  galactose:{name:'Galactose',text:'Galactose is the other smaller sugar released when lactose is split. It is a different sugar from glucose. The cell changes it into forms it can use for energy or to make materials.'}
 };
 const host=document.createElement('section');host.id='bacterial-tour';host.hidden=true;host.setAttribute('aria-label','Explore one E. coli cell');host.innerHTML=`<div id="b-art-frame"><img id="b-cell-art" src="assets/cell-bacterial-alpha-1536.webp" alt="The same sage-green E. coli cell in cutaway, showing purple DNA threads and small ribosomes" width="1536" height="1024"><svg id="b-anatomy-cue" viewBox="0 0 1536 1024" aria-hidden="true"><path id="b-active-region"/><path id="b-active-edge"/></svg><svg id="b-label-leaders" aria-hidden="true"><path id="b-active-leader"/></svg><div id="b-fact-labels"></div><svg id="b-dna-hit-art" viewBox="0 0 1536 1024" aria-label="Find the DNA" hidden><path id="b-dna-target" role="button" tabindex="0" aria-label="Select the folded purple DNA threads"/></svg><p id="b-dna-feedback" role="status" hidden></p></div>`;scene.append(host);
 const labels=[['b-membrane','Cell membrane'],['cytoplasm','Cytoplasm'],['b-dna','DNA'],['ribosome','Ribosomes'],['flagella','Flagella']];
 for(const[key,title]of labels){const b=document.createElement('button');b.type='button';b.className='b-science-label';b.textContent=title;b.dataset.bfact=key;b.setAttribute('aria-controls','object-info');b.setAttribute('aria-haspopup','dialog');b.addEventListener('click',()=>{preview='';api.info(key,b);});for(const type of ['pointerenter','focus'])b.addEventListener(type,()=>{preview=key;api.refresh();});for(const type of ['pointerleave','blur'])b.addEventListener(type,()=>{if(preview===key){preview='';api.refresh();}});$('b-fact-labels').append(b);}
 const action=document.createElement('button');action.id='bacterial-action';action.className='primary';action.hidden=true;$('story-actions').append(action);action.addEventListener('click',()=>api.advance());$('b-dna-target').addEventListener('click',()=>api.advance());$('b-dna-target').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();api.advance();}});$('b-art-frame').addEventListener('click',event=>{if(scene.dataset.phase==='b-find'&&event.target!==$('b-dna-target')){const note=$('b-dna-feedback');note.textContent='Look for the purple threads folded together inside the cell.';note.hidden=false;}});
 const field=document.createElement('div');field.id='bacterial-field';field.setAttribute('aria-hidden','true');field.innerHTML='<img src="assets/cell-bacterial-alpha-1536.webp" alt="" width="1536" height="1024">';scene.prepend(field);
 const group=document.createElementNS(ns,'g');group.id='b-enzyme-units';for(let i=0;i<3;i++){const image=document.createElementNS(ns,'image');image.setAttribute('href','assets/bacterial-folded-chain.webp');image.setAttribute('preserveAspectRatio','xMidYMid meet');group.append(image);}$('protein-chain').append(group);
 const mini=document.createElement('div');mini.id='b-enzyme-card';mini.className='b-complex-icon';mini.setAttribute('aria-hidden','true');mini.innerHTML=Array.from({length:4},()=>'<img src="assets/bacterial-folded-chain-card.webp" alt="" width="128" height="128">').join('');$('role-select-enzyme').prepend(mini);
 let preview='';
 let from=.9,to=.9,zoom=.9;
 let approachStart=null,approachCarry=0,lastApproachElapsed=0,lastApproachProgress=1;
 // Capture painted geometry before entry hides or reflows either camera surface.
 function captureView(){if(!api.active())return null;const sr=scene.getBoundingClientRect();if(!host.hidden){const r=$('b-cell-art').getBoundingClientRect(),w=Math.min(r.width,r.height*1.5),h=w/1.5;return {zoom,left:r.left-sr.left+(r.width-w)/2,top:r.top-sr.top+(r.height-h)/2,width:w,height:h,opacity:1,blur:0,early:true};}if(!field.hidden){const img=field.firstElementChild,r=img.getBoundingClientRect();return {zoom,left:r.left-sr.left,top:r.top-sr.top,width:r.width,height:r.height,opacity:Number(img.style.opacity),approachElapsed:lastApproachElapsed,approachProgress:lastApproachProgress,blur:parseFloat(img.style.filter.match(/[\d.]+/)?.[0])||0,early:false};}return null;}
 // Entry owns the camera start once; rendering never re-enters a scene.
 function enter(key,{view=null,staticEntry=false}={}){preview='';$('b-dna-feedback').hidden=true;from=staticEntry?({'b-orient':.9,'b-close':1.1,'b-explore':1.1,'b-find':1.1}[key]||1.1):(view?.early?view.zoom:({'b-orient':.9,'b-close':1.1,'b-explore':1.1,'b-find':1.1}[key]||1.1));to=key==='b-orient'?.9:key==='b-close'?1.1:from;zoom=from;if(key==='dna-focus'&&!staticEntry){approachStart=view;approachCarry=0;}else if(!staticEntry&&approachStart&&view&&!view.early&&view.approachProgress<1&&['gene','message','export','protein'].includes(key)){approachCarry=view.approachElapsed;}else{approachStart=null;approachCarry=0;}}

 function number(phase,stage){if(early.includes(phase))return early.indexOf(phase)+1;if(phase==='protein')return ['build','growing','chain','purpose'].includes(stage)?9:['folding','collect','repeat-growing','repeat-folding','assemble-ready','joining'].includes(stage)?10:11;return {'dna-focus':5,gene:6,message:7,export:8,roles:12}[phase]||1;}
 function guide(phase,stage){if(phase==='message')return 'Choose Copy instructions beside the highlighted gene. A ribosome can begin reading the emerging message here in the same cytoplasm. Follow the message when the copy is ready.';if(phase==='b-find')return 'Find the folded purple threads inside the cell and select them. You can also use Tab to focus the DNA target and press Enter. The DNA has no enclosing membrane.';if(early.includes(phase))return 'Use the main action to move closer to this same E. coli cell. Hover over or focus a name label to find its structure. Select the label to read about it. This DNA has no enclosing membrane.';if(phase==='export')return 'Select the ribosome to seat the messenger RNA in its channel. You can also drag the RNA to it. Copying and reading happen in the same cytoplasm; there is no pore or nuclear export step. Name labels open information.';if(phase==='protein'&&stage==='done')return 'Choose Match the parts to their jobs to recall how they worked together, or Try another lactose to repeat the reaction. Name labels explain the enzyme and its sugars.';if(phase==='protein')return stage==='job'?'Select lactose to send it to the enzyme. Four folded chains work together in this enzyme. The Lactose, Enzyme, Glucose and Galactose labels explain the biology.':'Select the highlighted amino acid specified by the RNA message, then the ribosome, or drag it there. After three starter joins, watch the chain grow. Fold it, then choose Make the next chain three times to reuse the same ribosome and message. When four folded chains are ready, fit them together into one enzyme. The amino acids shown represent building blocks already in the cytoplasm; only a few are drawn. Lactose becomes available when the enzyme is ready. Guide pauses motion until you close it.';return ''}
 function renderEarly(phase,elapsed,still,info){const visible=api.active()&&early.includes(phase);host.hidden=!visible;action.hidden=!visible||phase==='b-find';scene.dataset.bacterialEarly=String(visible);if(!visible)return;const p=still?1:api.ease(elapsed/2400);zoom=from+(to-from)*p;$('b-cell-art').style.transform=`scale(${zoom})`;$('b-anatomy-cue').style.transform=`scale(${zoom})`;$('b-dna-hit-art').style.transform=`scale(${zoom})`;
  action.textContent=({'b-orient':'Look closer at this cell','b-close':'Explore its structures','b-explore':'Find the DNA','b-find':'Look closer at DNA'})[phase];$('b-fact-labels').hidden=phase!=='b-explore';$('b-dna-hit-art').toggleAttribute('hidden',phase!=='b-find');$('b-anatomy-cue').toggleAttribute('hidden',phase!=='b-explore');$('b-label-leaders').toggleAttribute('hidden',phase!=='b-explore');
  const active=phase==='b-explore'?(info||preview):'',frame=$('b-art-frame'),fw=frame.clientWidth,fh=frame.clientHeight,phone=fw<650,fitW=Math.min(fw,fh*1.5),fitH=fitW/1.5,offsetX=(fw-fitW)/2,offsetY=(fh-fitH)/2;
  const point=(x,y)=>({x:fw*.5+(offsetX+x/1536*fitW-fw*.5)*zoom,y:fh*.45+(offsetY+y/1024*fitH-fh*.45)*zoom});
  const layout=phone?{'b-membrane':[0,0],flagella:[1,0],cytoplasm:[0,1],'b-dna':[1,1],ribosome:[2,1]}:{'b-membrane':[.44,.02],flagella:[.85,.59],cytoplasm:[.27,.76],'b-dna':[.49,.77],ribosome:[.76,.80]};
  for(const label of $('b-fact-labels').children){const key=label.dataset.bfact,pos=layout[key],top=phone&&pos[1]===0,columns=top?2:3;label.style.width='max-content';label.style.maxWidth=phone?(fw-16-(columns-1)*6)/columns+'px':'';const labelWidth=label.offsetWidth;label.style.left=(phone?8+pos[0]*(fw-16)/columns+((fw-16-(columns-1)*6)/columns-labelWidth)/2:fw*pos[0])+'px';label.style.top=(phone?(pos[1]?fh-52:4):fh*pos[1])+'px';label.dataset.active=String(active===key);label.setAttribute('aria-expanded',String(info===key));}

  // Trace the actual cutaway's inner border and its immediately adjacent wall.
  const membrane='M218 543 C190 463 224 404 315 374 L1014 195 C1110 165 1176 209 1198 291 C1228 401 1156 469 1041 505 L433 677 C325 708 240 658 218 543 Z';
  const wall='M205 546 C176 457 215 391 308 359 L1009 181 C1114 148 1191 195 1213 286 C1249 410 1166 482 1045 520 L435 692 C316 727 226 666 205 546 Z';
  const dna='M337 575 C310 539 358 471 409 435 C486 380 538 431 600 408 C681 377 690 341 771 329 C850 314 872 289 950 292 C1018 264 1094 282 1090 339 C1094 390 1037 428 972 455 C893 494 833 502 750 525 C667 552 590 557 527 592 C445 644 361 633 337 575 Z';
  $('b-dna-target').setAttribute('d',dna);const ribosomes=ribosomeRegions;
  const flagella='M232 354 C214 318 142 302 112 250 C82 203 91 148 128 117 C171 78 216 67 266 73 C339 78 412 118 485 142 C579 179 676 160 758 108 M1260 247 C1331 214 1381 230 1424 268 C1484 325 1488 371 1460 436 C1436 498 1390 551 1394 594 C1393 637 1420 667 1460 686 M531 700 C548 741 596 757 663 770 C739 791 763 838 829 874 C895 911 959 887 1030 863 C1107 837 1151 810 1228 812 C1302 814 1358 844 1403 900';
  const edge=({'b-membrane':membrane,'b-wall':wall,ribosome:ribosomes,flagella})[active]||'';
  $('b-active-region').setAttribute('d',active==='cytoplasm'?membrane:active==='b-dna'?dna:active==='ribosome'?ribosomes:'');$('b-active-region').dataset.kind='region';$('b-active-edge').setAttribute('d',edge);$('b-active-edge').dataset.kind=active;
  const anchors={'b-wall':[355,349],'b-membrane':[750,263],flagella:[1428,475],cytoplasm:[435,632],'b-dna':[710,475],ribosome:[1110,402]},anchor=anchors[active],leader=$('b-label-leaders');leader.setAttribute('viewBox',`0 0 ${fw} ${fh}`);
  const label=[...$('b-fact-labels').children].find(el=>el.dataset.bfact===active);let line='';if(label&&anchor){const a=point(...anchor),r=label.getBoundingClientRect(),fr=frame.getBoundingClientRect(),cx=r.left-fr.left+r.width/2,cy=r.top-fr.top+r.height/2,dx=a.x-cx,dy=a.y-cy,scale=Math.max(Math.abs(dx)/(r.width/2),Math.abs(dy)/(r.height/2)),sx=cx+dx/scale,sy=cy+dy/scale;line=`M${sx} ${sy} L${a.x} ${a.y}`;} $('b-active-leader').setAttribute('d',line);scene.dataset.bacterialHighlight=active||'';scene.dataset.bacterialRibosomeRegions=String(ribosomeRegionCount);scene.dataset.bacterialFlagellaPaths='3';
 }
 function clearPreview(){preview='';}
 function resetVisuals(){preview='';approachStart=null;field.hidden=true;host.hidden=true;action.hidden=true;group.style.display='none';scene.dataset.bacterialEarly='false';scene.dataset.bacterialHighlight='';const base=$('folded-protein');base.style.display='';base.removeAttribute('transform');for(const key of ['rotate','width','height'])base.style[key]='';}
 function syncPhase(phase){const active=api.active()&&scene.dataset.organism==='bacterial';scene.dataset.bacterialMolecular=String(active&&['dna-focus','gene','message','export','protein','roles'].includes(phase));field.hidden=!(active&&['dna-focus','gene','message','export','protein','roles'].includes(phase));host.hidden=!(active&&early.includes(phase));if(!active||phase!=='protein')group.style.display='none';if(active&&['dna-focus','gene','message','export','protein','roles'].includes(phase))renderContext(null,{phase});if(!active||!early.includes(phase)){action.hidden=true;scene.dataset.bacterialEarly='false';scene.dataset.bacterialHighlight='';preview='';}}

 function renderContext(g,state){field.hidden=!api.active()||scene.dataset.organism!=='bacterial'||!['dna-focus','gene','message','export','protein','roles'].includes(state.phase);if(field.hidden)return;const sw=scene.clientWidth,sh=scene.clientHeight,img=field.firstElementChild,ih=Math.max(sh*2.2,sw/1.5*2.6)*2.1,iw=ih*1.5,end={width:iw,height:ih,left:sw*.50-iw*.51,top:sh*.50-ih*.43,opacity:.46,blur:1.2},p=approachStart&&!state.staticEntry?api.ease((approachCarry+(state.elapsed||0))/11000):1,start=approachStart||end,at=key=>start[key]+(end[key]-start[key])*p;for(const key of ['width','height','left','top'])img.style[key]=at(key)+'px';img.style.filter=`blur(${at('blur')}px)`;img.style.opacity=String(at('opacity'));scene.style.setProperty('--bacterial-interior-ground',`rgb(${35+17*p} ${31+38*p} ${32+47*p})`);field.dataset.mode='continuous-interior';field.dataset.approach=String(p);if(Number.isFinite(state.elapsed)){lastApproachElapsed=approachCarry+state.elapsed;lastApproachProgress=p;}}

 const cluster=[[-.18,-.17,-19,1],[.20,-.12,28,.93],[-.13,.18,14,.96],[.18,.19,-28,1.02]];
 function renderComplex({centre,home,w,h,completed,stage,fold,detail,progress,currentSurface}){
  if(!api.active())return;
  const base=$('folded-protein'),nodes=[base,...group.children],phone=scene.clientWidth<650,mw=$('nucleus-model').clientWidth;
  const parked=phone?[[mw*.16,48],[mw*.50,48],[mw*.16,130],[mw*.50,130]]:[[mw*.14,85],[mw*.32,85],[mw*.50,85],[mw*.68,85]];
  const assembling=stage==='joining'||['job','reaction','done'].includes(stage),active=stage==='folding'||stage==='repeat-folding',p=api.ease(Math.max(0,Math.min(1,progress))),release=api.ease((fold-.64)/.34),source={mask:base.style.maskImage,opacity:base.style.opacity};
  base.setAttribute('aria-label',assembling?'About the lactose enzyme':'About a folded protein chain');group.setAttribute('aria-label',assembling?'About the lactose enzyme':'About the folded protein chains');
  group.style.display=completed>1||completed>0&&active||assembling?'':'none';
  nodes.forEach((img,i)=>{
   const current=active&&i===completed,visible=i<completed||current||assembling;
   img.toggleAttribute('hidden',!visible);img.style.display=visible?'':'none';if(!visible)return;
   const [cx,cy,angle,scale]=cluster[i],end={x:home.x+cx*w,y:home.y+cy*h},park={x:parked[i][0],y:parked[i][1]},size=phone?82:112;
   let x=park.x,y=park.y,iw=size,ih=size*h/w,rotation=0;
   if(current){x=currentSurface.x;y=currentSurface.y;iw=currentSurface.width;ih=currentSurface.height;}
   if(assembling){x=park.x+(end.x-park.x)*p;y=park.y+(end.y-park.y)*p;iw=size+(w*.63*scale-size)*p;ih=size*h/w+(h*.63*scale-size*h/w)*p;rotation=angle*p;}
   for(const [key,value]of Object.entries({x:x-iw/2,y:y-ih/2,width:iw,height:ih}))img.setAttribute(key,String(value));
   img.setAttribute('transform',`rotate(${rotation} ${x} ${y})`);img.style.width=iw+'px';img.style.height=ih+'px';img.style.rotate='none';img.style.opacity=current?source.opacity:'1';img.style.maskImage=current?source.mask:'none';
  });
  scene.dataset.foldedChains=String(completed);scene.dataset.chainMaking=String(active||stage==='repeat-growing');
 }

 function matching(selectedKey){for(const host of [$('b-enzyme-card')])for(const[ i,img]of [...host.children].entries()){const[x,y,angle,scale]=cluster[i];img.style.left=(50+x*100-31.5*scale)+'%';img.style.top=(50+y*100-31.5*scale)+'%';img.style.width=63*scale+'%';img.style.height=63*scale+'%';img.style.transform=`rotate(${angle}deg)`;}}
 return{early,facts,enter,captureView,clearPreview,resetVisuals,syncPhase,number,guide,renderEarly,renderContext,renderComplex,matching,field};
}
