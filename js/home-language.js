/* Homepage language only. Explicit URLs and manual choices take precedence. */
(()=>{
  const url=new URL(location.href);
  if(!['/','/index.html','/lv/','/lv/index.html'].includes(url.pathname))return;
  const choiceKey='researchgames-language';
  const countryKey='researchgames-country-v1';
  const supported=value=>value==='lv'||value==='en';
  const read=(storage,key)=>{try{return storage.getItem(key)}catch{return null}};
  const write=(storage,key,value)=>{try{storage.setItem(key,value)}catch{}};
  // Accessing storage itself may fail in private or restricted browser contexts.
  let local,session;
  try{local=window.localStorage}catch{}
  try{session=window.sessionStorage}catch{}
  let manual=false;
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('[data-home-language]');
    const language=link?.dataset.homeLanguage;
    if(!supported(language))return;
    manual=true;
    write(local,choiceKey,language);
  });
  const current=url.pathname.startsWith('/lv/')?'lv':'en';
  function go(language){
    if(manual||language===current)return;
    const target=new URL(location.href);
    target.pathname=language==='lv'?'/lv/':'/';
    location.replace(target.href);
  }
  const explicit=url.searchParams.get('lang');
  if(supported(explicit)){
    write(local,choiceKey,explicit);
    go(explicit);
    return;
  }
  // /lv/ is always an explicit Latvian destination, including shared links.
  if(current==='lv')return;
  const saved=read(local,choiceKey);
  if(supported(saved)){go(saved);return}
  const browserLanguage=()=>{
    for(const tag of navigator.languages?.length?navigator.languages:[navigator.language]){
      const language=String(tag).toLowerCase().split('-')[0];
      if(supported(language))return language;
    }
    return 'en';
  };
  const choose=country=>{
    const latest=read(local,choiceKey);
    go(supported(latest)?latest:country==='LV'?'lv':browserLanguage());
  };
  let cache;
  try{cache=JSON.parse(read(session,countryKey))}catch{}
  if(cache&&cache.expires>Date.now()&&(cache.country===null||/^[A-Z]{2}$/.test(cache.country))){choose(cache.country);return}
  // Country-only IP lookup: no coordinates, cookies, referrer, or stored IP.
  // The page renders normally while this bounded request is pending.
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),1200);
  Promise.resolve().then(()=>fetch('https://api.country.is/',{
    signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'
  })).then(response=>{
    if(!response.ok)throw new Error('Country unavailable');
    return response.json();
  }).then(data=>{
    const country=typeof data.country==='string'&&/^[A-Z]{2}$/.test(data.country)?data.country:null;
    write(session,countryKey,JSON.stringify({country,expires:Date.now()+(country?1800000:300000)}));
    choose(country);
  }).catch(()=>{
    write(session,countryKey,JSON.stringify({country:null,expires:Date.now()+300000}));
    choose(null);
  }).finally(()=>clearTimeout(timer));
})();
