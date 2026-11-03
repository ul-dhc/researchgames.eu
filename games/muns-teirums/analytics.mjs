// Aggregate events only: no player IDs, names, answers or free text.
export function createPlantAnalytics(send) {
  let variant, started=false, ended=false;
  const emit=action=>{try{send({path:`rg-plant-v1-muns-teirums-${action}-${variant}`,title:'Muns teirums · '+action,event:true,no_session:true,referrer:''});}catch{/* Tracking must never interrupt play. */}};
  return {
    reset(pairs,settings){variant=`${pairs}-${settings.time?'time':'untimed'}-${settings.points?'points':'unscored'}`;started=false;ended=false;},
    start(){if(!started&&!ended){started=true;emit('start');}},
    complete(){if(started&&!ended){ended=true;emit('complete');}},
    skip(){if(!ended){ended=true;emit('skip');}}
  };
}
