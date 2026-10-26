/* Example pluggable instrument adapters. Each tracks its own scheduled voices. */
(function(global){
function createDemoInstrument(kind){
 const voices=new Set();
 return {
  name:kind,
  scheduleNote({midi,time,duration,velocity,context}){
   const o=context.createOscillator(),g=context.createGain();
   o.frequency.value=440*2**((midi-69)/12);
   o.type=kind==='Soft synth'?'triangle':kind==='Organ'?'sine':'sawtooth';
   const level=velocity*.06;
   g.gain.setValueAtTime(.0001,time);
   g.gain.exponentialRampToValueAtTime(Math.max(.0001,level),time+.01);
   if(kind==='Plucked synth')g.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.02,duration));
   else g.gain.setValueAtTime(level,time+Math.max(.02,duration));
   g.gain.exponentialRampToValueAtTime(.0001,time+duration+.2);
   o.connect(g).connect(context.destination);o.start(time);o.stop(time+duration+.22);voices.add(o);
   o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect()};
  },
  stop(){for(const o of voices){try{o.stop()}catch{}}voices.clear()}
 };
}
global.createDemoInstrument=createDemoInstrument;
})(globalThis);

/* Small synthesized demo kit. Other drum engines use the same adapter contract. */
function createDemoDrums(){
 const voices=new Set();let noise;
 return {
  initialize({context:c}){noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1},
  scheduleNote({midi,time,velocity,context:c}){
   const tone=(freq,end,duration,level,type='sine')=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(end,time+duration);g.gain.setValueAtTime(Math.max(.0001,level*velocity),time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g).connect(c.destination);o.start(time);o.stop(time+duration+.01);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect()}};
   const hiss=(duration,hz,level)=>{const b=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();b.buffer=noise;f.type='highpass';f.frequency.value=hz;g.gain.setValueAtTime(Math.max(.0001,level*velocity),time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);b.connect(f).connect(g).connect(c.destination);b.start(time);b.stop(time+duration+.01);voices.add(b);b.onended=()=>{voices.delete(b);b.disconnect();f.disconnect();g.disconnect()}};
   if(midi===36)tone(150,42,.45,.55);
   else if(midi===38){tone(180,90,.13,.18);hiss(.19,1400,.35)}
   else if(midi===39)hiss(.14,1100,.4);
   else if(midi===42)hiss(.065,6500,.21);
   else if(midi===46)hiss(.45,6500,.22);
   else if(midi===45)tone(150,65,.35,.4);
   else if(midi===49){hiss(1.2,4500,.26);tone(430,410,.6,.025,'square')}
   else if(midi===51){hiss(.3,7500,.1);tone(1200,1150,.35,.06,'triangle')}
  },
  stop(){for(const v of voices){try{v.stop()}catch{}}voices.clear()}
 };
}
