/* Each editor mode keeps its own project while switching. */
const roll=new PianoRoll('#editor',{instrument:createDemoInstrument('Soft synth'),onChange(project){document.querySelector('#status').textContent=project.notes.length+(project.mode==='drums'?' hits':' notes')+' · '+project.bars+' bars'}});
let activeMode='piano',melodicInstrument='Soft synth';const sessions={};
function pianoExample(){const notes=[];[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,55]].forEach((chord,i)=>chord.forEach(midi=>notes.push({midi,start:i*8,length:7.75,velocity:.7})));return {...roll.getProject(),mode:'piano',name:'Evening light',bars:8,bpm:72,loopStart:0,loopEnd:32,notes,chords:[],view:{rowH:18,scrollTop:340}}}
function drumExample(){const notes=[];const hit=(midi,start,velocity)=>notes.push({midi,start,length:.25,velocity});for(let bar=0;bar<2;bar++){const b=bar*4;[0,2,2.75].forEach(x=>hit(36,b+x,.9));[1,3].forEach(x=>hit(38,b+x,.85));for(let x=0;x<4;x+=.5)hit(42,b+x,x%1===0?.6:.4)}hit(46,7.5,.65);return {...roll.getProject(),mode:'drums',name:'Pocket beat',bars:2,bpm:100,loopStart:0,loopEnd:8,notes,chords:[],view:{rowH:32,scrollTop:0}}}
function syncMode(){const drums=activeMode==='drums';document.querySelector('#wave').disabled=drums;document.querySelector('#wave').value=drums?'Drum kit':melodicInstrument;document.querySelector('#example').textContent=drums?'Load starter beat':'Load demo progression';document.querySelector('#modeHelp').textContent=drums?'Draw: click to add or remove a hit. Click a drum name to audition it. Select hits to move them or change velocity.':'Draw melodies or edit chords. Switch to Drums for named lanes and beat editing.'}
document.querySelector('#mode').onchange=e=>{sessions[activeMode]=roll.getProject();activeMode=e.target.value;roll.setInstrument(activeMode==='drums'?createDemoDrums():createDemoInstrument(melodicInstrument));roll.setProject(sessions[activeMode]||(activeMode==='drums'?drumExample():pianoExample()));syncMode();roll.fit()};
document.querySelector('#example').onclick=()=>{roll.setProject(activeMode==='drums'?drumExample():pianoExample());roll.fit()};
document.querySelector('#blank').onclick=()=>roll.setNotes([]);
document.querySelector('#wave').onchange=e=>{melodicInstrument=e.target.value;roll.setInstrument(createDemoInstrument(melodicInstrument))};
roll.setProject(pianoExample());syncMode();roll.fit();

// Imported projects and Undo can change mode; keep the demo instrument in sync.
document.querySelector('#editor').addEventListener('pianoroll:change',e=>{if(e.detail.mode===activeMode)return;activeMode=e.detail.mode;document.querySelector('#mode').value=activeMode;roll.setInstrument(activeMode==='drums'?createDemoDrums():createDemoInstrument(melodicInstrument));syncMode()});
