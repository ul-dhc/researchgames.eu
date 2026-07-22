const root=document.documentElement;
const themeButton=document.querySelector('#theme-toggle');
function syncTheme(){const light=root.dataset.theme==='light';themeButton.setAttribute('aria-pressed',String(light));themeButton.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme')}
themeButton.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('researchgames-theme',root.dataset.theme)}catch(e){}syncTheme()});syncTheme();
