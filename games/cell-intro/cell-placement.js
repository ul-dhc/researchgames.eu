// The existing choose/place activity, applied to regions of the same completed cell.
// Cards, feedback marks, keyboard activation and the progress action are shared by all routes.
export function createCellPlacement(api){
 const{$,scene}=api,ns='http://www.w3.org/2000/svg',panel=$('model-activity'),cards=['dna','nucleolus','envelope'].map(k=>$('choice-'+k)),extra=['pores','nucleoplasm'].map(k=>$('choice-'+k));
 const slot=document.createElement('div');slot.className='activity-finish-slot';panel.append(slot);slot.append($('activity-feedback'),$('activity-next'));
 const surface=document.createElementNS(ns,'svg');surface.id='cell-placement-surface';surface.setAttribute('role','group');surface.setAttribute('aria-label','Choose a location in the cell');surface.setAttribute('aria-describedby','activity-question activity-drop-cue');surface.setAttribute('hidden','');
 const cue=$('activity-drop-cue');cue.setAttribute('aria-live','polite');
 let route='',geometryKey='',lastMatch='',feedbackUntil=0;
 const parts={
  plant:[{key:'nucleus',name:'Nucleus',question:"Which part holds most of the cell’s DNA?",area:'Small darker body beside the large central space'},{key:'vacuole',name:'Vacuole',question:'Which part stores water and helps keep the cell firm?',area:'Large central space'},{key:'cytoplasm',name:'Cytoplasm',question:'Where do many activities happen outside the nucleus?',area:'Thin surrounding layer'}],
  human:[{key:'nucleus',name:'Nucleus',question:"Which part holds most of the cell’s DNA?",area:'Large purple body'},{key:'mitochondria',name:'Mitochondria',question:'Which structures help release energy from nutrients?',area:'Small folded structures'},{key:'cytoplasm',name:'Cytoplasm',question:'Where do many activities happen outside the nucleus?',area:'Surrounding material inside the boundary'}],
  bacterial:[{key:'dna',name:'DNA',question:'Which material stores this cell’s genetic instructions?',area:'Folded purple threads'},{key:'ribosomes',name:'Ribosomes',question:'Which structures join amino acids to build proteins?',area:'Small scattered particles'},{key:'membrane',name:'Cell membrane',question:'Which boundary controls exchange with the cytoplasm?',area:'Inner boundary of the cutaway'}]
 };
 function text(node,value){if(node.textContent!==value)node.textContent=value;}
 function active(){return api.phase()==='cell-places';}
 function config(){return api.artworks[api.route()];}
 function state(){return api.getState();}
 function expected(){return parts[api.route()][state().step];}
 function change(patch){api.setState(patch);api.refresh();}
 function choose(key){if(!active()||state().committed)return;const correct=key===expected().key;change({choice:key,feedback:correct?'Yes. Now find its place in the cell.':'Try another part. Think about its job.'});}
 function completeAt(valid){
  const s=state();if(!active()||s.committed)return;
  if(!s.choice){change({feedback:'Choose a part first, then tap its place.'});return;}
  if(s.choice!==expected().key){change({feedback:'Try another part. Think about its job.'});return;}
  if(!valid){change({feedback:'Try another area. Your part is still selected.'});return;}
  lastMatch=s.choice;feedbackUntil=performance.now()+700;const placed=s.placed+1;
  api.setState({placed,step:placed,choice:'',committed:placed===3,feedback:placed===3?'Three parts matched.':'Yes, that’s its place. Find the next part.'});
  if(placed===3)api.earn();api.refresh();$('activity-question').focus({preventScroll:true});
 }
 function pointValid(event){
  const key=expected()?.key,path=surface.querySelector(`[data-place-region="${key}"]`);if(!path)return false;
  const matrix=surface.getScreenCTM();if(!matrix)return false;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()),ctx=document.createElement('canvas').getContext('2d'),shape=new Path2D(path.getAttribute('d'));
  if((config().exclude?.[key]||[]).some(d=>ctx.isPointInPath(new Path2D(d),p.x,p.y)))return false;
  if(key!=='membrane'&&ctx.isPointInPath(shape,p.x,p.y,'evenodd'))return true;
  if(['membrane','mitochondria','ribosomes'].includes(key)){ctx.lineWidth=(key==='membrane'?18:key==='ribosomes'?8:22)/Math.hypot(matrix.a,matrix.b);return ctx.isPointInStroke(shape,p.x,p.y);}
  return false;
 }
 surface.addEventListener('click',event=>{if(event.detail!==0)completeAt(pointValid(event));});
 surface.addEventListener('dragover',event=>{if(active()&&state().choice===expected()?.key){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}});
 surface.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer?.getData('text/plain')!=='cell-part-'+state().choice)return;completeAt(pointValid(event));});
 for(const card of cards){
  card.addEventListener('click',()=>choose(card.dataset.cellPart));
  card.addEventListener('dragstart',event=>{choose(card.dataset.cellPart);if(state().choice!==expected()?.key){event.preventDefault();return;}event.dataTransfer?.setData('text/plain','cell-part-'+card.dataset.cellPart);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';});
 }
 $('activity-next').addEventListener('click',()=>{if(active()&&state().committed)api.advance();});
 function prepare(){
  route=api.route();$('h-feedback').hidden=true;$('b-dna-feedback').hidden=true;const c=config(),definitions=parts[route];geometryKey='';surface.replaceChildren();surface.setAttribute('viewBox',c.view.join(' '));
  cards.forEach((card,i)=>{const part=definitions[i];card.dataset.cellPart=part.key;card.hidden=false;card.setAttribute('aria-label','Select '+part.name);card.querySelector(':scope > span:last-child').textContent=part.name;const svg=card.querySelector(':scope > svg');svg.setAttribute('viewBox',c.crops[part.key].join(' '));svg.innerHTML=`<image href="${c.art}" width="1536" height="${route==='plant'?864:1024}"/>`;});
  for(const card of extra){card.hidden=true;card.disabled=true;}
  for(const part of definitions){const path=document.createElementNS(ns,'path');path.setAttribute('d',c.paths[part.key]);path.setAttribute('fill-rule','evenodd');if(c.masks?.[part.key])path.setAttribute('mask',`url(#${c.masks[part.key]})`);path.dataset.placeRegion=part.key;path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',part.area);path.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();completeAt(state().choice===part.key||part.key==='cytoplasm'&&state().choice==='cytoplasm');}});surface.append(path);}
 }
 function render(){
  const visible=active();scene.dataset.cellPlacementActive=String(visible);surface.toggleAttribute('hidden',!visible);if(!visible){if(cue.dataset.cellPlacement==='true')cue.hidden=true;return;}
  if(route!==api.route())prepare();const s=state(),definitions=parts[route];
  if(!s.started){const order=definitions.map(p=>p.key);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}api.setState({started:true,step:0,placed:0,choice:'',committed:false,feedback:'Choose a part, then tap its place.',order});}
  const current=state(),c=config(),visual=$(api.route()==='plant'?'nucleus-model':api.route()==='human'?'h-art-frame':'b-art-frame'),art=$(api.route()==='plant'?'cell-game-model':api.route()==='human'?'h-cell-art':'b-cell-art');
  if(surface.parentElement!==visual)visual.append(surface);if(cue.parentElement!==visual)visual.append(cue);cue.dataset.cellPlacement='true';cue.hidden=false;
  const visualRoot=$(api.route()==='plant'?'nucleus-model':api.route()==='human'?'human-tour':'bacterial-tour');if(panel.nextSibling!==visualRoot)scene.insertBefore(panel,visualRoot);
  const r=art.getBoundingClientRect(),v=visual.getBoundingClientRect();const dimensions=[r.left-v.left,r.top-v.top,r.width,r.height].map(n=>Math.round(n*100)/100),key=dimensions.join(',');if(key!==geometryKey){geometryKey=key;Object.assign(surface.style,{left:dimensions[0]+'px',top:dimensions[1]+'px',width:dimensions[2]+'px',height:dimensions[3]+'px'});}
  panel.hidden=false;panel.dataset.cellComplete=String(current.committed);if($('activity-next').parentElement!==slot)slot.append($('activity-feedback'),$('activity-next'));$('assembly-bridge-actions').hidden=true;$('place-activity-part').hidden=true;$('activity-next').hidden=!current.committed;$('activity-next').disabled=!current.committed;$('activity-next-label').textContent=api.route()==='bacterial'?'Look closer at DNA':'Explore the nucleus';
  text(panel.querySelector('.activity-framing'),'This cell is already complete.');
  text($('activity-step'),`Find the parts · ${Math.min(current.placed+1,3)} of 3`);text($('activity-question'),current.committed?'Three parts, three places.':expected().question);text($('activity-feedback'),current.feedback);
  $('activity-feedback').dataset.tone=current.choice?(current.choice===expected()?.key?'correct':'retry'):current.placed?'correct':'none';
  for(const part of definitions){const card=cards[definitions.indexOf(part)];card.disabled=current.committed;card.setAttribute('aria-pressed',String(current.choice===part.key));card.dataset.feedback=current.choice===part.key?(part.key===expected()?.key?'correct':'retry'):'none';}
  const order=current.order.length===3?current.order:definitions.map(p=>p.key);if($('activity-choices').dataset.cellOrder!==order.join(',')){for(const key of order){const card=cards[definitions.findIndex(p=>p.key===key)];if(card)$('activity-choices').append(card);}$('activity-choices').dataset.cellOrder=order.join(',');}
  text(cue,current.committed?'The same complete cell. Continue when you’re ready.':current.choice===expected()?.key?`${expected().name} selected. Tap its place.`:expected().question+' Choose a part.');
  for(const path of surface.children){path.dataset.feedback=performance.now()<feedbackUntil&&path.dataset.placeRegion===lastMatch?'correct':'none';path.setAttribute('aria-disabled',String(current.committed));path.tabIndex=current.committed?-1:0;}
  scene.dataset.assemblyComplete=String(current.committed);scene.dataset.cellPlacementCount=String(current.placed);scene.dataset.cellPlacementSelected=current.choice;
  if(!s.started)$('activity-question').focus({preventScroll:true});
 }
 return{render,choose,active};
}
