/* v9.5.0 · Island Run sound palette. Synthesised with Web Audio: no files, a few oscillators per cue,
   every node stopped and disconnected after it plays. Sound stays off until the teacher turns it on. */
(function(root){
 'use strict';
 const pentatonic=[784,880,988,1175,1319,1568,1760];
 function tone(ctx,out,{type='sine',freq=440,to=null,at=0,dur=.12,gain=.05,attack=.008}){
  const t=ctx.currentTime+at,osc=ctx.createOscillator(),amp=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,t);if(to)osc.frequency.exponentialRampToValueAtTime(to,t+dur);
  amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(gain,t+attack);amp.gain.exponentialRampToValueAtTime(.0001,t+dur);
  osc.connect(amp);amp.connect(out);osc.start(t);osc.stop(t+dur+.03);osc.onended=()=>{osc.disconnect();amp.disconnect();};
 }
 let noiseBuffer=null;
 function noise(ctx,out,{at=0,dur=.12,gain=.04,cutoff=900}){
  if(!noiseBuffer||noiseBuffer.sampleRate!==ctx.sampleRate){noiseBuffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.4),ctx.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const t=ctx.currentTime+at,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
  src.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,t);
  amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(filter);filter.connect(amp);amp.connect(out);src.start(t);src.stop(t+dur+.02);src.onended=()=>{src.disconnect();filter.disconnect();amp.disconnect();};
 }
 const cues={
  coin(ctx,o,{streak=0}={}){const f=pentatonic[Math.min(pentatonic.length-1,Math.floor(streak/3))];tone(ctx,o,{freq:f,to:f*1.25,dur:.07,gain:.04});tone(ctx,o,{freq:f*2,dur:.05,gain:.012,at:.012});},
  jump(ctx,o){tone(ctx,o,{type:'triangle',freq:300,to:540,dur:.13,gain:.035});},
  hit(ctx,o){tone(ctx,o,{type:'triangle',freq:150,to:58,dur:.22,gain:.06});noise(ctx,o,{dur:.14,gain:.035,cutoff:700});},
  answer(ctx,o){[523,659,784].forEach((f,i)=>tone(ctx,o,{freq:f,dur:.16,gain:.045,at:i*.06}));tone(ctx,o,{freq:1568,dur:.25,gain:.018,at:.18});},
  wrong(ctx,o){tone(ctx,o,{freq:330,dur:.16,gain:.035});tone(ctx,o,{freq:262,dur:.24,gain:.035,at:.15});},
  streak(ctx,o){tone(ctx,o,{freq:988,dur:.1,gain:.035});tone(ctx,o,{freq:1319,dur:.16,gain:.035,at:.08});},
  surge(ctx,o){tone(ctx,o,{type:'sawtooth',freq:330,to:1320,dur:.45,gain:.022});[784,988,1175,1568].forEach((f,i)=>tone(ctx,o,{freq:f,dur:.3,gain:.028,at:.18+i*.05}));},
  letter(ctx,o){tone(ctx,o,{freq:1175,to:1400,dur:.06,gain:.03});},
  gate(ctx,o){tone(ctx,o,{type:'triangle',freq:660,dur:.28,gain:.03});tone(ctx,o,{type:'triangle',freq:990,dur:.22,gain:.018,at:.07});},
  bossIntro(ctx,o){tone(ctx,o,{type:'square',freq:82,dur:.9,gain:.02,attack:.25});tone(ctx,o,{type:'sawtooth',freq:110,to:98,dur:.9,gain:.016,attack:.25});noise(ctx,o,{dur:.6,gain:.018,cutoff:300});},
  bossHit(ctx,o,{final=false}={}){tone(ctx,o,{freq:190,to:70,dur:final?.35:.18,gain:.06});noise(ctx,o,{dur:final?.3:.1,gain:final?.05:.03,cutoff:final?1400:900});},
  victory(ctx,o){[523,659,784,1047].forEach((f,i)=>tone(ctx,o,{type:'triangle',freq:f,dur:.22,gain:.04,at:i*.1}));[523,659,784].forEach(f=>tone(ctx,o,{freq:f,dur:.8,gain:.022,at:.42}));},
  perfect(ctx,o){[784,988,1175,1568,1976].forEach((f,i)=>tone(ctx,o,{freq:f,dur:.18,gain:.03,at:i*.07}));},
  finish(ctx,o){[440,554,659].forEach(f=>tone(ctx,o,{freq:f,dur:.5,gain:.025}));}
 };
 let master=null;
 function play(ctx,type,options){
  const cue=cues[type];if(!ctx||!cue)return false;
  if(!master||master.context!==ctx){master=ctx.createGain();master.gain.value=.9;master.connect(ctx.destination);}
  cue(ctx,master,options||{});return true;
 }
 root.RunnerFX=Object.freeze({play,cues:Object.keys(cues)});
})(typeof globalThis!=='undefined'?globalThis:this);
