// Two preloaded voices of the same approved recording. Visual clocks never own audio time.
export class AmbientMixer {
 constructor(voices,{loopStart=5,loopEnd=142,overlap=8,onState=()=>{},onFinish=()=>{},onError=()=>{}}={}){
  this.voices=voices;this.loopStart=loopStart;this.loopEnd=loopEnd;this.overlap=overlap;this.onState=onState;this.onFinish=onFinish;this.onError=onError;this.master=.65;this.active=0;this.mix=null;this.running=false;this.loopAllowed=true;this.loopFailed=false;this.finished=false;this.generation=0;this.loops=0;
  for(const voice of voices){voice.loop=false;voice.addEventListener('ended',()=>this.ended(voice));voice.addEventListener('error',()=>this.failed(voice));voice.addEventListener('waiting',()=>{if(this.running&&voice===this.voices[this.active])this.onState('loading');});}
  this.applyGains();
 }
 ensureGraph(){
  if(this.graph!==undefined)return;const Context=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;
  if(!Context){this.graph=false;return;}
  const context=new Context(),nodes=this.voices.map(voice=>{const source=context.createMediaElementSource(voice),gain=context.createGain();gain.gain.value=0;source.connect(gain);gain.connect(context.destination);return gain;});
  this.graph={context,nodes};this.applyGains();
 }
 setMaster(value){this.master=Math.max(0,Math.min(1,value));this.applyGains();}
 setLoopAllowed(value){this.loopAllowed=value;}
 applyGains(){
  const gains=[0,0];if(this.mix?.started){const p=Math.max(0,Math.min(1,(this.voices[this.mix.incoming].currentTime-this.mix.start)/this.overlap));gains[this.mix.outgoing]=Math.cos(p*Math.PI/2);gains[this.mix.incoming]=Math.sin(p*Math.PI/2);}else gains[this.active]=1;
  for(let i=0;i<this.voices.length;i++){
   if(this.graph){this.voices[i].volume=1;this.graph.nodes[i].gain.setTargetAtTime(this.master*gains[i],this.graph.context.currentTime,.018);}
   else this.voices[i].volume=this.master*gains[i];
  }this.gains=gains;
 }
 async play(){
  if(this.finished)return;this.running=true;const generation=this.generation,targets=this.mix?[this.mix.outgoing,this.mix.incoming]:[this.active];
  try{
   this.ensureGraph();if(this.graph&&this.graph.context.state==='suspended')await this.graph.context.resume();
   await Promise.all(targets.map(i=>this.voices[i].paused?this.voices[i].play():Promise.resolve()));
   if(generation!==this.generation||!this.running)return;
   if(this.mix)this.mix.started=true;this.applyGains();this.onState('playing');
  }catch(error){
   if(generation!==this.generation||!this.running)return;
   if(this.mix){const failed=this.mix.incoming;this.voices[failed].pause();this.mix=null;this.loopFailed=true;this.applyGains();this.onError('loop',error);}
   else{this.pause();this.onError('initial',error);}
  }
 }
 pause(){this.running=false;for(const voice of this.voices)voice.pause();}
 reset(){this.generation++;this.pause();this.active=0;this.mix=null;this.loopFailed=false;this.finished=false;this.loops=0;for(const voice of this.voices){voice.currentTime=0;voice.loop=false;}this.applyGains();}
 tick(){
  if(!this.running||this.finished)return;
  if(this.mix?.started){
   this.applyGains();const mix=this.mix,p=(this.voices[mix.incoming].currentTime-mix.start)/this.overlap;
   if(p>=1){this.voices[mix.outgoing].pause();this.active=mix.incoming;this.mix=null;this.loops++;this.applyGains();}
   return;
  }
  if(this.mix||!this.loopAllowed||this.loopFailed)return;
  const voice=this.voices[this.active],next=1-this.active;
  if(voice.currentTime<this.loopEnd-this.overlap||this.voices[next].readyState<3)return;
  try{this.voices[next].pause();this.voices[next].currentTime=this.loopStart;this.voices[next].volume=0;this.mix={outgoing:this.active,incoming:next,start:this.loopStart,started:false};void this.play();}
  catch(error){this.mix=null;this.loopFailed=true;this.applyGains();this.onError('loop',error);}
 }
 ended(voice){
  if(voice!==this.voices[this.active]||this.mix)return;
  this.running=false;this.finished=true;for(const other of this.voices)other.pause();this.onFinish(this.loopAllowed);
 }
 failed(voice){
  if(this.mix&&voice===this.voices[this.mix.incoming]){voice.pause();this.mix=null;this.loopFailed=true;this.applyGains();this.onError('loop');}
  else if(this.running&&voice===this.voices[this.active]){this.pause();this.onError('initial');}
 }
 snapshot(){return {active:this.active,overlap:Boolean(this.mix?.started),pending:Boolean(this.mix&&!this.mix.started),gains:[...this.gains],times:this.voices.map(v=>v.currentTime),running:this.running,loops:this.loops,loopAllowed:this.loopAllowed,finished:this.finished};}
}

// Each recording keeps its own two-voice loop; track changes blend those pairs.
export class SoundtrackPlayer {
 constructor(tracks,{selected=0,switchDuration=3,onState=()=>{},onFinish=()=>{},onError=()=>{}}={}){
  this.tracks=tracks;this.activeTrack=selected;this.requested=selected;this.switchDuration=switchDuration;this.onState=onState;this.onFinish=onFinish;this.onError=onError;this.master=.65;this.running=false;this.finished=false;this.loopAllowed=true;this.fade=null;this.generation=0;
  this.mixers=tracks.map((track,index)=>new AmbientMixer(track.voices,{loopStart:track.loopStart,loopEnd:track.loopEnd,overlap:8,onState:state=>{if(this.running&&index===this.activeTrack)this.onState(state);},onFinish:()=>this.finishTrack(index),onError:(kind,error)=>this.trackError(index,kind,error)}));
  this.weights=tracks.map((_,i)=>i===selected?1:0);this.applyMaster();
 }
 get loopFailed(){return this.mixers[this.activeTrack].loopFailed;}
 prepare(index){
  const track=this.tracks[index];if(track.loaded)return;track.loaded=true;
  for(const voice of track.voices){voice.preload='auto';voice.src=track.src;voice.load?.();}
 }
 applyMaster(){this.mixers.forEach((m,i)=>m.setMaster(this.master*this.weights[i]));}
 setMaster(value){this.master=Math.max(0,Math.min(1,value));this.applyMaster();}
 setLoopAllowed(value){this.loopAllowed=value;this.mixers.forEach(m=>m.setLoopAllowed(value));}
 async play(){
  if(this.finished)return;this.running=true;this.prepare(this.activeTrack);
  const targets=this.fade?[this.fade.outgoing,this.fade.incoming]:[this.activeTrack];
  await Promise.all(targets.map(i=>this.mixers[i].play()));
 }
 pause(){this.running=false;this.mixers.forEach(m=>m.pause());}
 reset(){
  this.generation++;this.pause();this.fade=null;this.activeTrack=this.requested;this.finished=false;this.mixers.forEach(m=>m.reset());this.weights=this.tracks.map((_,i)=>i===this.activeTrack?1:0);this.applyMaster();
 }
 async select(index){
  if(!Number.isInteger(index)||!this.tracks[index])return;
  this.requested=index;if(this.fade)return;
  if(index===this.activeTrack)return;
  if(!this.running||this.finished){this.activeTrack=index;this.mixers.forEach(m=>m.reset());this.weights=this.tracks.map((_,i)=>i===index?1:0);this.applyMaster();return;}
  const outgoing=this.activeTrack,incoming=index,generation=this.generation;
  this.fade={outgoing,incoming,started:false,start:0};this.prepare(incoming);this.mixers[incoming].reset();this.mixers[incoming].setLoopAllowed(this.loopAllowed);this.applyMaster();
  await this.mixers[incoming].play();
  if(generation!==this.generation||!this.fade||this.fade.incoming!==incoming){if(!this.running||this.finished)this.mixers[incoming].pause();return;}
  if(this.mixers[incoming].finished)return;
  this.fade.started=true;this.fade.start=this.mixers[incoming].voices[this.mixers[incoming].active].currentTime;
  if(!this.running)this.mixers[incoming].pause();
 }
 tick(){
  if(!this.running||this.finished)return;
  this.mixers.forEach(m=>m.tick());
  if(!this.fade?.started)return;
  const fade=this.fade,voice=this.mixers[fade.incoming].voices[this.mixers[fade.incoming].active],p=Math.max(0,Math.min(1,(voice.currentTime-fade.start)/this.switchDuration));
  this.weights[fade.outgoing]=Math.cos(p*Math.PI/2);this.weights[fade.incoming]=Math.sin(p*Math.PI/2);this.applyMaster();
  if(p===1){this.mixers[fade.outgoing].pause();this.activeTrack=fade.incoming;this.weights=this.tracks.map((_,i)=>i===this.activeTrack?1:0);this.applyMaster();this.fade=null;this.onState('playing');if(this.requested!==this.activeTrack)void this.select(this.requested);}
 }
 finishTrack(index){
  if(this.fade){
   if(index===this.fade.outgoing&&!this.fade.started){this.generation++;this.fade=null;this.running=false;this.finished=true;this.mixers.forEach(m=>m.pause());this.onFinish(this.loopAllowed);return;}
   if(index===this.fade.outgoing&&this.fade.started){this.activeTrack=this.fade.incoming;this.weights=this.tracks.map((_,i)=>i===this.activeTrack?1:0);this.fade=null;this.applyMaster();return;}
   if(index===this.fade.incoming)this.trackError(index,'initial');
   return;
  }
  if(index!==this.activeTrack)return;this.running=false;this.finished=true;this.mixers.forEach(m=>m.pause());this.onFinish(this.loopAllowed);
 }
 trackError(index,kind,error){
  if(this.fade&&index===this.fade.incoming){this.mixers[index].pause();this.fade=null;this.requested=this.activeTrack;this.weights=this.tracks.map((_,i)=>i===this.activeTrack?1:0);this.applyMaster();this.onError('switch',error);return;}
  if(index!==this.activeTrack)return;
  if(kind==='initial'){this.running=false;this.mixers.forEach(m=>m.pause());}this.onError(kind,error);
 }
 snapshot(){
  const current=this.mixers[this.activeTrack].snapshot(),snapshots=this.mixers.map(m=>m.snapshot());
  return {...current,active:this.activeTrack*2+current.active,track:this.tracks[this.activeTrack].id,switching:Boolean(this.fade),gains:snapshots.flatMap((s,i)=>s.gains.map(g=>g*this.weights[i])),times:snapshots.flatMap(s=>s.times),running:this.running,finished:this.finished,loopAllowed:this.loopAllowed};
 }
}
