var DashboardSnapshot = (function () {
  const URL='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/miklu-dashboard.json';
  const LIVE_URL='https://script.google.com/macros/s/AKfycbwzomHmovON2lQiPP2xa40FRCDFXJ38ofD8YDKB63SBrQHBMB2HKaCBDM_bBmgXsLkD/exec?resource=dashboard-snapshot';
  const FRESH_MS=5*60000;
  const KEY='lmg_dashboard_snapshot_v1';
  let model=null,pending=null,lastError=false,lastLiveAttempt=0;
  const newer=(a,b)=>!a||Date.parse(b.generatedAt)>=Date.parse(a.generatedAt)?b:a;
  function saved(){try{return RiddleSnapshot.validate(JSON.parse(localStorage.getItem(KEY)));}catch{return null;}}
  async function request(url,timeout){const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});if(!r.ok)throw new Error('HTTP '+r.status);return RiddleSnapshot.validate(await r.json());}
  function remember(data){model=newer(model,data);try{localStorage.setItem(KEY,JSON.stringify(model));}catch{}}
  async function refresh(onUpdate){
    if(pending)return pending;
    pending=(async()=>{
      try{remember(await request(URL,10000));lastError=false;}
      catch(error){lastError=true;if(!model){try{remember(await request('../data/miklu-dashboard.json',4000));}catch{}}}
      // Render static data while the slower fallback is being fetched.
      if(model&&onUpdate)onUpdate(model);
      if((!model||Date.now()-Date.parse(model.generatedAt)>FRESH_MS)&&Date.now()-lastLiveAttempt>=FRESH_MS){
        lastLiveAttempt=Date.now();
        try{remember(await request(LIVE_URL,60000));lastError=false;}
        catch(error){lastError=true;}
      }
      if(!model)throw new Error('Dashboard unavailable');
      return model;
    })().finally(()=>{pending=null;});
    return pending;
  }
  async function load(onUpdate){if(!model)model=saved();if(model){refresh().then(data=>{if(onUpdate)onUpdate(data);}).catch(()=>{});return model;}return refresh(onUpdate);}
  function stale(){return lastError||!model||Date.now()-Date.parse(model.generatedAt)>20*60000;}
  return {load,refresh,stale};
})();
