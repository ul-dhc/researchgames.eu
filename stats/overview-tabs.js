export function reportView(search,hash=''){
 const view=new URLSearchParams(search).get('view');
 if(view==='visits'||view==='gameplay')return view;
 return ['#visits','#visits-chart'].includes(hash)?'visits':'gameplay';
}
export function initReportTabs(root,onChange=()=>{}){
 const tabs=[...root.querySelectorAll('[role="tab"]')];
 const select=(view,{focus=false,write=true}={})=>{
  for(const tab of tabs){const active=tab.dataset.view===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;if(active&&focus)tab.focus();}
  if(write){const url=new URL(location.href);url.searchParams.set('view',view);if(document.getElementById(url.hash.slice(1))?.closest('[role="tabpanel"]')?.hidden)url.hash='';history.replaceState(null,'',url);}
  if(write&&window.scrollY>root.offsetTop)document.getElementById('panel-'+view)?.scrollIntoView({block:'start'});
  onChange(view);
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.view));
  tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[next].dataset.view,{focus:true});});
 });
 const fromLocation=()=>select(reportView(location.search,location.hash),{write:false});
 window.addEventListener('popstate',fromLocation);
 window.addEventListener('hashchange',()=>{const panel=document.getElementById(location.hash.slice(1))?.closest('[role="tabpanel"]');if(panel)select(panel.id==='panel-visits'?'visits':'gameplay',{write:false});});
 fromLocation();return select;
}
