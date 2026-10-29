var DashboardSnapshot = (function () {
  const URL='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/miklu-dashboard.json';
  const KEY='lmg_dashboard_snapshot_v1';
  let model=null,pending=null,lastError=false;
  const newer=(a,b)=>!a||Date.parse(b.generatedAt)>=Date.parse(a.generatedAt)?b:a;
  function saved(){try{return RiddleSnapshot.validate(JSON.parse(localStorage.getItem(KEY)));}catch{return null;}}
  async function request(url,timeout){const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});if(!r.ok)throw new Error('HTTP '+r.status);return RiddleSnapshot.validate(await r.json());}
  async function refresh(){
    if(pending)return pending;
    pending=(async()=>{
      try{model=newer(model,await request(URL,10000));lastError=false;try{localStorage.setItem(KEY,JSON.stringify(model));}catch{}}
      catch(error){lastError=true;if(!model){model=await request('../data/miklu-dashboard.json',4000);}}
      return model;
    })().finally(()=>{pending=null;});
    return pending;
  }
  async function load(onUpdate){if(!model)model=saved();if(model){refresh().then(data=>{if(onUpdate)onUpdate(data);}).catch(()=>{});return model;}return refresh();}
  function stale(){return lastError||!model||Date.now()-Date.parse(model.generatedAt)>20*60000;}
  return {load,refresh,stale};
})();
