/* Minimal demonstration adapter; replace with your own synth. */
const voices=new Set();
function stopVoices(){for(const v of voices){try{v.stop()}catch{}}voices.clear()}
const roll=new PianoRoll('#editor',{
 onNote({midi,time,duration,velocity,context}){
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type=document.querySelector('#wave').value;
  oscillator.frequency.value=440*2**((midi-69)/12);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(velocity*.07,time+.015);
  gain.gain.setValueAtTime(velocity*.07,time+Math.max(.02,duration));gain.gain.exponentialRampToValueAtTime(.0001,time+duration+.2);
  oscillator.connect(gain).connect(context.destination);oscillator.start(time);oscillator.stop(time+duration+.22);
  voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect()};
 },onStop:stopVoices,
 onChange(project){document.querySelector('#status').textContent=project.notes.length+' notes · '+project.bars+' bars'}
});
function example(){const notes=[];[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,55]].forEach((chord,i)=>chord.forEach(midi=>notes.push({midi,start:i*8,length:7.75,velocity:.7})));
 roll.setProject({...roll.getProject(),name:'Evening light',bars:8,loopStart:0,loopEnd:32,notes,chords:[]});roll.fit()}
document.querySelector('#example').onclick=example;document.querySelector('#blank').onclick=()=>roll.setNotes([]);
example();
