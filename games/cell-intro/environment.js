// One static, scale-aware environmental system. No entities, dots or animation.
export const environmentForPhase=(phase,organism)=>{
 if(organism==='human'&&['h-context','h-close','h-explore','h-find','h-return','roles'].includes(phase))return'tissue';
 const purposeful=['idle','teaser','world','people','chooser','onion','skin','field','establish','invite','approach','boundary','inside','nucleolus'];
 if(purposeful.includes(phase))return'preserved';
 if(['dna-focus','gene','message','export','protein'].includes(phase))return'molecular';
 if(['h-nucleus','explore','assemble'].includes(phase))return'interior';
 return'external';
};
export function installEnvironment(scene){
 const root=document.createElement('div');root.id='scene-environment';root.setAttribute('aria-hidden','true');
 root.innerHTML='<img class="environment-medium" src="assets/environment-aqueous-v1.webp" alt="" decoding="async"><img class="environment-interior" src="assets/environment-internal-v1.webp" alt="" decoding="async"><img class="environment-external" src="assets/environment-aqueous-v2.webp" alt="" decoding="async"><div class="environment-light"></div>';
 const tissue=document.createElement('div');tissue.className='environment-tissue';
 const cells=[[-8,12,42,-18,9,.4],[32,-8,32,16,7,.3],[78,13,38,-22,6,.36],[110,45,39,13,8,.42],[-4,85,43,19,6,.35],[42,106,40,-12,9,.32],[93,94,43,21,7,.4],[50,29,28,-9,7,.22],[22,53,27,15,9,.22]];
 tissue.innerHTML=cells.map(([x,y,w,a,b,o])=>`<img src="assets/cell-human-alpha-960.webp" alt="" style="--tx:${x}%;--ty:${y}%;--tw:${w}vw;--ta:${a}deg;--tb:${b}px;--to:${o}">`).join('');root.append(tissue);
 scene.prepend(root);scene.dataset.environment=environmentForPhase(scene.dataset.phase||'idle',scene.dataset.organism);
 const update=()=>{scene.dataset.environment=environmentForPhase(scene.dataset.phase||'idle',scene.dataset.organism);};
 new MutationObserver(update).observe(scene,{attributes:true,attributeFilter:['data-phase','data-organism']});
 Promise.allSettled([...root.querySelectorAll('img')].map(img=>img.decode())).then(()=>{root.dataset.ready='true';});
 return root;
}
