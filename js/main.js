const root=document.documentElement;
const themeButton=document.querySelector('#theme-toggle');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#site-nav');
const header=document.querySelector('#site-header');

function syncTheme(){
  const light=root.dataset.theme==='light';
  themeButton?.setAttribute('aria-pressed',String(light));
  themeButton?.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme');
}

themeButton?.addEventListener('click',()=>{
  root.dataset.theme=root.dataset.theme==='light'?'dark':'light';
  try{localStorage.setItem('researchgames-theme',root.dataset.theme)}catch(e){}
  syncTheme();
});

menuButton?.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.querySelector('.sr-only').textContent=open?'Close menu':'Open menu';
});

nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded','false');
}));

const spotlightGroups=[...document.querySelectorAll('.game-collections')];

function fitSpotlightTags(group){
  const button=group.querySelector('.spotlight-more');
  const tags=[...group.children].filter(item=>item!==button&&item.tagName!=='P');
  if(!button||button.getAttribute('aria-expanded')==='true')return;

  tags.forEach(tag=>{tag.hidden=false});
  button.hidden=true;
  const rows=[...new Set(tags.map(tag=>tag.offsetTop))];
  if(rows.length<=2)return;

  button.hidden=false;
  let hiddenCount=0;
  while(tags.some(tag=>!tag.hidden)){
    button.textContent=`+${hiddenCount} more`;
    const visible=[...tags.filter(tag=>!tag.hidden),button];
    const visibleRows=[...new Set(visible.map(item=>item.offsetTop))];
    if(hiddenCount>0&&visibleRows.length<=2)break;
    const lastVisible=[...tags].reverse().find(tag=>!tag.hidden);
    if(!lastVisible)break;
    lastVisible.hidden=true;
    hiddenCount+=1;
  }
  button.textContent=`+${hiddenCount} more`;
}

spotlightGroups.forEach(group=>{
  const button=group.querySelector('.spotlight-more');
  button?.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    if(expanded){
      fitSpotlightTags(group);
    }else{
      [...group.children].forEach(item=>{if(item!==button&&item.tagName!=='P')item.hidden=false});
      button.hidden=false;
      button.textContent='Show less';
    }
  });
});

let spotlightResizeFrame;
addEventListener('resize',()=>{
  cancelAnimationFrame(spotlightResizeFrame);
  spotlightResizeFrame=requestAnimationFrame(()=>spotlightGroups.forEach(fitSpotlightTags));
},{passive:true});
spotlightGroups.forEach(fitSpotlightTags);

const dnaCanvas=document.querySelector('.dna-liquid-canvas');
if(dnaCanvas){
  const ctx=dnaCanvas.getContext('2d');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dnaWidth=0,dnaHeight=0,dnaFrame,bubbles=[];
  const seeded=index=>{const value=Math.sin(index*9283.31)*43758.54;return value-Math.floor(value)};

  function sizeDnaCanvas(){
    const rect=dnaCanvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,2);
    dnaWidth=rect.width;dnaHeight=rect.height;
    dnaCanvas.width=Math.round(dnaWidth*scale);dnaCanvas.height=Math.round(dnaHeight*scale);
    ctx.setTransform(scale,0,0,scale,0,0);
    bubbles=Array.from({length:27},(_,i)=>({x:seeded(i+2),y:seeded(i+40),r:1.5+seeded(i+70)*6.5,speed:.012+seeded(i+90)*.03,drift:seeded(i+120)*4+1.5,blur:seeded(i+150)*1.1,depth:.58+seeded(i+180)*.42}));
  }

  function glassOrb(x,y,r,teal=true,alpha=1){
    const gradient=ctx.createRadialGradient(x-r*.35,y-r*.38,r*.08,x,y,r);
    gradient.addColorStop(0,`rgba(255,255,255,${.86*alpha})`);
    gradient.addColorStop(.16,teal?`rgba(184,255,246,${.48*alpha})`:`rgba(223,202,255,${.46*alpha})`);
    gradient.addColorStop(.68,teal?`rgba(57,176,189,${.2*alpha})`:`rgba(103,70,196,${.22*alpha})`);
    gradient.addColorStop(1,'rgba(9,17,38,0)');
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=gradient;ctx.fill();
    ctx.strokeStyle=teal?`rgba(188,255,248,${.48*alpha})`:`rgba(225,202,255,${.44*alpha})`;ctx.lineWidth=.8;ctx.stroke();
  }

  function drawBubbles(time){
    bubbles.forEach((bubble,index)=>{
      const y=((bubble.y-time*bubble.speed)%1+1)%1;
      const x=bubble.x+Math.sin(time*.22+index)*bubble.drift/dnaWidth;
      ctx.save();ctx.filter=`blur(${bubble.blur}px)`;ctx.globalAlpha=(.22+(1-y)*.3)*bubble.depth;
      glassOrb(x*dnaWidth,y*dnaHeight,bubble.r*bubble.depth,index%3!==0,1);ctx.restore();
    });
  }

  function drawCaustics(time){
    const x=dnaWidth*(.42+Math.sin(time*.035)*.05),y=dnaHeight*(.38+Math.cos(time*.04)*.04);
    const glow=ctx.createRadialGradient(x,y,5,x,y,dnaWidth*.45);glow.addColorStop(0,'rgba(41,221,214,.045)');glow.addColorStop(.45,'rgba(85,78,207,.028)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,dnaWidth,dnaHeight);
  }

  function renderDna(now=5200){
    if(!dnaWidth||!dnaHeight)sizeDnaCanvas();
    const time=now/1000;
    ctx.clearRect(0,0,dnaWidth,dnaHeight);drawCaustics(time);drawBubbles(time);
    if(!reduceMotion)dnaFrame=requestAnimationFrame(renderDna);
  }

  new ResizeObserver(()=>{sizeDnaCanvas();if(reduceMotion)renderDna()}).observe(dnaCanvas);
  renderDna();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!reduceMotion){cancelAnimationFrame(dnaFrame);dnaFrame=requestAnimationFrame(renderDna)}});
}

addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>18),{passive:true});
syncTheme();
window.lucide?.createIcons({attrs:{'stroke-width':1.8}});
