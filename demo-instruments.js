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
