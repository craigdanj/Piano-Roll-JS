/* Minimal demonstration adapter; replace with your own synth. */
const instrument=createDemoInstrument('Soft synth');
const roll=new PianoRoll('#editor',{
 instrument,
 onChange(project){document.querySelector('#status').textContent=project.notes.length+' notes · '+project.bars+' bars'}
});
function example(){const notes=[];[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,55]].forEach((chord,i)=>chord.forEach(midi=>notes.push({midi,start:i*8,length:7.75,velocity:.7})));
 roll.setProject({...roll.getProject(),name:'Evening light',bars:8,loopStart:0,loopEnd:32,notes,chords:[]});roll.fit()}
document.querySelector('#example').onclick=example;document.querySelector('#blank').onclick=()=>roll.setNotes([]);
example();

document.querySelector('#wave').onchange=e=>roll.setInstrument(createDemoInstrument(e.target.value));
