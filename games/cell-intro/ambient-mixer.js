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
  const context=new Context(),nodes=this.voices.map(voice=>{const source=context.createMediaElementSource(voice),gain=context.createGain();source.connect(gain);gain.connect(context.destination);return gain;});
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
