// Paths fit the approved onion reconstruction in its native 1536 × 864 coordinates.
// The viewBox trims transparent margins only; it never stretches or redraws the cell.
export const onionModel={
 view:{x:80,y:70,width:1420,height:560},
 nucleusBox:{x:250,y:315,width:305,height:200},
 face:'M169 358 C385 276 620 237 821 207 C1028 180 1227 127 1334 129 C1391 132 1398 194 1407 252 L1431 410 Q1443 460 1379 477 C1116 543 824 567 533 582 C346 592 210 594 139 565 Q124 545 135 492 L155 392 Q158 369 169 358Z',
 vacuole:'M551 325 C594 285 697 263 826 237 C1004 205 1205 162 1314 172 C1356 180 1371 222 1376 283 C1385 350 1360 402 1297 430 C1145 487 973 508 810 518 C708 525 607 507 568 474 C549 456 557 429 548 403 C537 376 531 346 551 325Z',
 nucleus:'M260 390 C280 355 327 325 385 321 C442 315 489 337 522 365 C546 387 553 432 545 469 C540 495 511 505 470 507 C413 511 365 499 322 476 C289 460 257 435 257 410 Q254 399 260 390Z',
 edge:'M154 344 C402 250 646 212 849 184 C1066 151 1241 106 1344 110 Q1393 111 1410 156 L1455 407 Q1475 475 1403 495 C1115 564 810 588 530 603 C343 614 181 615 116 580 Q96 567 105 518 L128 387 Q134 359 154 344Z'
};
export function installOnionModel($){
 const svg=$('cell-game-model').querySelector('svg'),v=onionModel.view;
 svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.width} ${v.height}`);
 svg.innerHTML=`<defs><mask id="cytoplasm-region-mask" maskUnits="userSpaceOnUse" x="80" y="70" width="1420" height="560"><path d="${onionModel.face}" fill="white"/><path d="${onionModel.vacuole}" fill="black"/><path d="${onionModel.nucleus}" fill="black"/></mask></defs><image id="onion-model-art" href="assets/onion-cell-detailed-cutout-1536.webp" width="1536" height="864"/><g id="onion-model-overlays"><path id="cell-wall-shape" d="${onionModel.edge}"/><path id="cell-membrane-shape" d="${onionModel.face}"/><path id="cell-cytoplasm-region" d="${onionModel.face}" mask="url(#cytoplasm-region-mask)"/><path id="vacuole-shape" d="${onionModel.vacuole}"/><path id="onion-nucleus-region" d="${onionModel.nucleus}"/></g>`;
 $('cell-game-model').parentElement.append($('vacuole-label'));
 // Native drag feedback is the selected nucleus from the same reconstruction.
 const drag=document.createElement('canvas');drag.id='onion-nucleus-dragimage';drag.width=153;drag.height=100;drag.setAttribute('aria-hidden','true');drag.style.cssText='position:fixed;left:-1000px;top:0;pointer-events:none';document.body.append(drag);
 const source=new Image();source.onload=()=>{const ctx=drag.getContext('2d'),b=onionModel.nucleusBox;ctx.scale(drag.width/b.width,drag.height/b.height);ctx.translate(-b.x,-b.y);ctx.clip(new Path2D(onionModel.nucleus));ctx.drawImage(source,0,0);drag.dataset.ready='true';};source.src='assets/onion-cell-detailed-cutout-1536.webp';
 const ns='http://www.w3.org/2000/svg',leaders=document.createElementNS(ns,'svg');leaders.id='onion-cell-leaders';leaders.setAttribute('aria-hidden','true');leaders.innerHTML='<path id="onion-cytoplasm-leader" class="structure-leader"/><path id="onion-vacuole-leader" class="structure-leader"/>';$('cell-game-model').parentElement.append(leaders);
}
export function renderOnionModel($,g,{phase,active}){
 const {cw,ch,cx,cy,mw,mh,portrait,lift}=g,model=$('cell-game-model'),leaders=$('onion-cell-leaders'),v=onionModel.view,point=(x,y)=>({x:cx+(x-v.x)/v.width*cw,y:cy+(y-v.y)/v.height*ch});
 leaders.style.display=phase==='model'?'':'none';leaders.setAttribute('viewBox',`0 0 ${mw} ${mh}`);
 const labels=[['cytoplasm-intro',portrait?cx+cw*.38:cx+cw*.37,Math.max(0,cy-46),[856,548],'cytoplasm'],['vacuole-label',cx+cw*.84,Math.max(0,cy-46),[1045,334],'vacuole']];
 for(const[id,x,y,anchor,key]of labels){const label=$(id);label.style.width='max-content';const width=label.offsetWidth;label.style.left=Math.max(4,Math.min(mw-width-4,x-width/2))+'px';label.style.top=y+'px';const a=point(...anchor),r=label.getBoundingClientRect(),p=model.parentElement.getBoundingClientRect(),sx=r.left-p.left+r.width/2,sy=r.top-p.top+r.height,line=$('onion-'+key+'-leader');line.setAttribute('d',`M${sx} ${sy} L${a.x} ${a.y}`);line.dataset.active=String(active===key);}
 $('model-nucleus-info').hidden=true;
 // The cell stays still while its actual nucleus opens into the shared cutaway.
 model.style.transform='none';model.style.opacity=String(phase==='model'?1:phase==='explore'?1-lift:0);
 if(['model','explore'].includes(phase))$('nucleus-cutaway').style.opacity=phase==='model'?'0':String(lift);
}
