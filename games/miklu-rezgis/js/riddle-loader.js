/* Static JSON only: gameplay never waits for Google Sheets. */
var RiddleData = (function () {
  const LIVE='https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/riddles.json';
  const KEY='lmg_riddles_snapshot_v1';
  function validate(data) {
    if(!data||data.version!==1||!Number.isFinite(Date.parse(data.generatedAt))||!data.levels||!Array.isArray(data.bonusPool))throw new Error('Invalid riddle snapshot');
    const ids=new Set();
    for(let i=1;i<=10;i++)if(!Array.isArray(data.levels[i])||!data.levels[i].length)throw new Error('Missing riddle level');
    for(const r of [...Object.values(data.levels).flat(),...data.bonusPool]){
      if(!r||typeof r.q!=='string'||!r.q.trim()||typeof r.a!=='string'||!r.a.trim()||!r.id||ids.has(r.id))throw new Error('Invalid riddle');ids.add(r.id);
    }
    return data;
  }
  async function request(url,timeout) {
    const response=await fetch(url,{signal:AbortSignal.timeout(timeout)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    return validate(await response.json());
  }
  async function load() {
    let saved;try{saved=validate(JSON.parse(localStorage.getItem(KEY)));}catch{}
    try{
      const live=await request(LIVE,4000);
      const data=saved&&Date.parse(saved.generatedAt)>Date.parse(live.generatedAt)?saved:live;
      try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}
      return data;
    }catch{
      try{
        const bundled=await request('data/riddles.json',3000);
        return saved&&Date.parse(saved.generatedAt)>Date.parse(bundled.generatedAt)?saved:bundled;
      }catch(error){if(saved)return saved;throw error;}
    }
  }
  return {load,validate};
})();
if(typeof module!=='undefined')module.exports=RiddleData;
