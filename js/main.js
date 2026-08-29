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

addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>18),{passive:true});
syncTheme();
window.lucide?.createIcons({attrs:{'stroke-width':1.8}});
