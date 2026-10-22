const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../piano-roll.js'),'utf8');
// Test the exact bundled pure helpers without exposing them as public globals.
const helpers=source.slice(source.indexOf('const internal={}'),source.indexOf('class PianoRoll'));
const scope={};vm.createContext(scope);vm.runInContext(helpers+';globalThis.helpers=internal',scope);
const E=scope.helpers.PadNoteEditor,N=scope.helpers.PadNavigation;
const a=[{id:'a',midi:36,start:1,length:2,velocity:.4},{id:'b',midi:60,start:4,length:4,velocity:.8},{id:'c',midi:84,start:12,length:1,velocity:1}],ids=new Set(['a','b']);
let moved=E.move(a,ids,-100,-100,16);assert.equal(moved[0].start,0);assert.equal(moved[1].start,3);assert.equal(moved[0].midi,36);assert.equal(a[0].start,1);
let resized=E.resize(a,ids,-100,16);assert.equal(resized[0].length,.125);assert.equal(resized[1].length,2.125);
const clip=E.copy(a,ids);let i=0;const pasted=E.paste(a,clip,8,16,()=>`new${++i}`);assert.equal(pasted.notes.length,5);assert.equal(pasted.notes[4].start,11);assert.equal(pasted.notes[3].velocity,.4);assert(E.paste(a,clip,15,16,()=>0).error);assert(E.paste(Array(512).fill(a[0]),clip,0,16,()=>0).error);
assert.equal(E.box(a,{start:2,end:3,low:35,high:37})[0],'a');assert.equal(N.parseBeat('2:3'),6);assert.equal(N.parseBeat('0:1'),null);assert.equal(N.position(10,0,0,8,true),2);assert.equal(N.loopRange(-1,100,16).end,16);
// Lightweight DOM harness verifies initialization, state changes, instance isolation,
// cleanup and validation; it is not a substitute for real-browser layout testing.
class Element {
 constructor(root){this.nodeType=1;this.root=root||this;this.map=new Map();this.style={setProperty(){}};this.classList={toggle(){},contains(){return false}};this.dataset={};this.children=[];this.value='1';this.clientWidth=1200;this.clientHeight=440;this.scrollLeft=0;this.scrollTop=0;this.listeners=new Map()}
 set innerHTML(v){this.html=v;for(const m of v.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const el=new Element(this.root);el.id=m[1];el.value=m[0].match(/value="([^"]*)"/)?.[1]||'1';this.root.map.set(el.id,el)}}get innerHTML(){return this.html||''}
 attachShadow(){return this.shadowRoot=new Element()}
 getElementById(id){return this.map.get(id)||null}querySelector(s){if(s==='dialog[open]')return null;if(s[0]==='#')return this.root.map.get(s.slice(1));return new Element(this.root)}querySelectorAll(){return []}
 append(el){this.children.push(el);el.root=this.root;if(el.id)this.root.map.set(el.id,el);if(el.html)el.innerHTML=el.html}
 setAttribute(){}addEventListener(t,f){this.listeners.set(t,f)}removeEventListener(t){this.listeners.delete(t)}dispatchEvent(){}focus(){}remove(){}replaceChildren(){this.children=[];this.map.clear()}getBoundingClientRect(){return {left:0,top:0,right:1200,bottom:440}}showModal(){}close(){}
}
const doc=new Element();doc.createElement=()=>new Element();let tid=0;
const context={document:doc,window:new Element(),console,crypto:require('node:crypto').webcrypto,CustomEvent:class{},setTimeout:()=>++tid,clearTimeout(){},clearInterval(){},cancelAnimationFrame(){},requestAnimationFrame:()=>++tid,Blob,URL};vm.createContext(context);vm.runInContext(source,context);
const host=new Element(),r=new context.PianoRoll(host);assert.equal(r.getNotes().length,0);
r.setNotes([{midi:60,start:0,length:1,velocity:.8}]);assert.equal(r.getNotes().length,1);r.undo();assert.equal(r.getNotes().length,0);r.redo();assert.equal(r.getNotes().length,1);
const copy=r.getNotes();copy[0].midi=99;assert.equal(r.getNotes()[0].midi,60);
assert.throws(()=>r.setNotes([{midi:999,start:0,length:1,velocity:.8}]));assert.equal(r.getNotes().length,1);
const r2=new context.PianoRoll(new Element());assert.equal(r2.getNotes().length,0);r.setLoop(4,8);assert.equal(r.getProject().loopStart,4);
host.shadowRoot.getElementById('apply').onclick=host.shadowRoot.getElementById('apply').onclick;host.shadowRoot.getElementById('progression').value='dream';host.shadowRoot.getElementById('apply').onclick();assert(r.getNotes().length>3);
r.destroy();r.destroy();assert.throws(()=>r.setNotes([]));r2.destroy();assert.equal(doc.listeners.size,0);
console.log('PASS: helper boundaries, clipboard, navigation, constructor, API, history, import validation, chord template, isolation, destroy.');
(async()=>{
 context.AudioContext=class{constructor(){this.currentTime=10}async resume(){}close(){this.closed=true}};
 context.setInterval=()=>1;
 let calls=[],stops=0,inits=0;
 const adapter={async initialize({context:ctx}){assert.equal(ctx.currentTime,10);inits++},scheduleNote(event){calls.push(event)},stop(){stops++}};
 const player=new context.PianoRoll(new Element(),{instrument:adapter,notes:[{midi:60,start:0,length:1,velocity:.8}]});
 await player.play();assert.equal(inits,1);assert.equal(calls.length,1);assert.equal(calls[0].midi,60);assert(calls[0].time>=10);assert(calls[0].duration>0);
 player.pause();await player.play();assert.equal(inits,1);
 const before=stops;let otherCalls=0;
 player.setInstrument({scheduleNote(){otherCalls++},stop(){}});assert(stops>before);await player.play();assert.equal(otherCalls,1);
 assert.throws(()=>player.setInstrument({scheduleNote(){}}));player.destroy();
 let finish,scheduled=0;
 const pending=new context.PianoRoll(new Element(),{notes:[{midi:60,start:0,length:1,velocity:.8}],instrument:{initialize(){return new Promise(resolve=>finish=resolve)},scheduleNote(){scheduled++},stop(){}}});
 const start=pending.play();await new Promise(setImmediate);pending.setInstrument(null);finish();await start;assert.equal(scheduled,0);pending.destroy();
 console.log('PASS: instrument initialization, scheduled timing, cached readiness, switching cancellation, validation and pending-load cancellation.');
})().catch(e=>{console.error(e);process.exitCode=1});
