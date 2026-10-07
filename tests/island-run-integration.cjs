/* Dependency-free integration checks. This is a DOM harness, not a native browser layout test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../public'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
class ClassList{constructor(){this.s=new Set();}add(...x){x.forEach(v=>this.s.add(v));}remove(...x){x.forEach(v=>this.s.delete(v));}contains(v){return this.s.has(v);}toggle(v,b=!this.s.has(v)){b?this.s.add(v):this.s.delete(v);return b;}}
class Node{
 constructor(tag='div',doc=null){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.dataset={};this.attrs={};this.events={};this.style={setProperty(k,v){this[k]=v;}};this.classList=new ClassList();this.hidden=false;this.open=false;this.disabled=false;this.value='';this.textContent='';this.parentNode=null;if(tag==='iframe')this.contentWindow={};}
 get parentElement(){return this.parentNode;}
 set className(v){this.classList.s=new Set(v.split(/\s+/).filter(Boolean));}get className(){return [...this.classList.s].join(' ');}
 set innerHTML(v){this.html=v;this.children=[];}get innerHTML(){return this.html||'';}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id'){this.id=v;this.ownerDocument?.nodes.set(v,this);}}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,f){(this.events[k]??=[]).push(f);}dispatchEvent(e){for(const f of this.events[e.type]||[])f(e);return true;}
 append(...ns){for(const n of ns){this.children.push(n);n.parentNode=this;if(n.id)this.ownerDocument?.nodes.set(n.id,n);}}appendChild(n){this.append(n);return n;}replaceChildren(...ns){this.children=[];this.append(...ns);}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);if(this.id)this.ownerDocument?.nodes.delete(this.id);this.parentNode=null;}
 focus(){if(this.ownerDocument)this.ownerDocument.activeElement=this;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return {width:1100,height:320};}
 querySelector(q){if(q==='span'||q==='details'){let node=this.children.find(c=>c.tagName===q.toUpperCase());if(!node){node=new Node(q,this.ownerDocument);this.append(node);}return node;}return this.children.find(c=>q.startsWith('.')&&c.classList.contains(q.slice(1)))||null;}
 querySelectorAll(q){return this.children.filter(n=>q==='button'&&n.tagName==='BUTTON');}click(){if(!this.disabled)this.onclick?.({preventDefault(){},detail:0});}reset(){}
}
class Doc{
 constructor(html,uri){this.nodes=new Map();this.events={};this.baseURI=uri;this.hidden=false;this.body=new Node('body',this);this.documentElement=new Node('html',this);this.activeElement=this.body;
  for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){const n=new Node(m[1],this);n.id=m[3];n.hidden=/\bhidden\b/.test(m[2]);n.className=m[2].match(/class="([^"]*)"/)?.[1]||'';this.nodes.set(n.id,n);}
 }
 getElementById(id){return this.nodes.get(id)||null;}createElement(tag){return new Node(tag,this);}addEventListener(k,f){(this.events[k]??=[]).push(f);}dispatchEvent(e){for(const f of this.events[e.type]||[])f(e);}
 querySelectorAll(q){if(q==='dialog')return [...this.nodes.values()].filter(n=>n.tagName==='DIALOG');if(q==='[data-tab]')return [];if(q==='[data-close]')return [];if(q==='#questionList button')return this.getElementById('questionList').children;return [];}
 querySelector(q){if(q==='dialog[open]')return this.querySelectorAll('dialog').find(n=>n.open)||null;return null;}
}
function environment(html,uri,w={}){
 const document=new Doc(html,uri),events={},timers=new Map(),rafs=new Map();let seq=0,time=0;
 Object.assign(w,{document,console,Blob,URL,Uint32Array,Math,Date,JSON,Promise,Set,Map,Number,String,Object,Array,Error,Boolean,Intl,
  performance:{now:()=>time},crypto:{getRandomValues(v){v[0]=42;return v;}},devicePixelRatio:1,
  addEventListener(k,f){(events[k]??=[]).push(f);},dispatchEvent(e){for(const f of events[e.type]||[])f(e);},
  setTimeout(f){timers.set(++seq,f);return seq;},clearTimeout(id){timers.delete(id);},
  requestAnimationFrame(f){rafs.set(++seq,f);return seq;},cancelAnimationFrame(id){rafs.delete(id);},
  matchMedia:()=>({matches:false}),confirm:()=>true,CustomEvent:class{constructor(type,opts={}){this.type=type;Object.assign(this,opts);}},
  Image:class extends Node{constructor(){super('img',document);this.complete=true;this.naturalWidth=384;}},Option:class extends Node{constructor(text,value){super('option',document);this.textContent=text;this.value=value;}}
 });w.window=w;const context=vm.createContext(w);
 return {w,view:vm.runInContext('window',context),document,events,timers,rafs,eval(file){vm.runInContext(read(file),context,{filename:file});},tick(dt=1/60){time+=dt*1000;const list=[...rafs.values()];rafs.clear();list.forEach(f=>f(time));},emit(type){w.dispatchEvent({type});}};
}
const board=environment(read('index.html'),'https://tally.invalid/');let eligible=false,uid=0,notifications=0;
board.w.LeagueAccess={granted:true};board.w.LeagueRecovery={uid:()=>`launch-${++uid}`};
let winner={sessionId:'session-7',className:'7-A',house:'ravenclaw',name:'Ravenclaw',level:8,avatarMarkup:'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path fill="blue" d="M0 0h20v20Z"/></svg>'};
board.w.localStorage={getItem:()=>null,setItem(){}};board.eval('island-progress.js');board.eval('island-run.js');const parent=board.w.LeagueIslandRun;
parent.configure({eligible:()=>eligible,context:()=>winner,changed:()=>notifications++});
assert(board.document.getElementById('island-run-launch').hidden);assert.equal(parent.open().ok,false);
eligible=true;parent.refresh();assert(!board.document.getElementById('island-run-launch').hidden);assert.match(board.document.getElementById('island-run-launch').getAttribute('aria-label'),/Ravenclaw/);
assert.equal(parent.open().ok,true);const frame=board.document.getElementById('island-run-frame');assert(frame);assert.equal(parent.connect({}),null);
const supplied=parent.connect(frame.contentWindow);assert.equal(supplied.className,'7-A');assert.equal(supplied.house,'ravenclaw');assert.equal(supplied.level,8);assert(supplied.avatar.startsWith('blob:'));
assert.equal(parent.report({},supplied.token,{ready:true}),false);assert.equal(parent.report(frame.contentWindow,'stale',{ready:true}),false);
// Boot the real child scripts and UI with a prior save for a DIFFERENT class/team.
const child=environment(read('island-runner/index.html'),'https://tally.invalid/island-runner/index.html',frame.contentWindow);frame.contentWindow=child.view;child.w.parent=board.view;
const storage=new Map(),C=require('../public/island-runner/expand-content.js'),E=require('../public/island-runner/engine.js');
const saved=E.fresh();Object.assign(saved.settings,{grade:5,className:'5-C',house:'gryffindor'});saved.progress['7-A|ravenclaw']={1:{score:900,stars:3}};saved.progress['5-C|gryffindor']={1:{score:300,stars:1}};
storage.set(E.storageKey,JSON.stringify(saved));child.w.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
for(const file of ['host-bridge.js','content.js',...Array.from({length:4},(_,i)=>`questions-grade${i+5}.js`),...Array.from({length:4},(_,i)=>`variety-grade${i+5}.js`),...Array.from({length:4},(_,i)=>`translate-grade${i+5}.js`),'expand-content.js','islands.js','engine.js','pictures.js','formats.js','bosses.js'])child.eval('island-runner/'+file);
child.w.RunnerScenery={islandSVG:()=>'<svg></svg>',Renderer:class{constructor(){child.renderer=this;}resize(){}setup(...args){this.args=args;}burst(){}render(run){this.lastRun=run;}}};
new Node('span',child.document).append(child.document.getElementById('coinCount'));
const gates=child.document.getElementById('answerGates');for(let i=0;i<3;i++)gates.append(new Node('div',child.document));
child.eval('teaching-model.js');child.eval('adventure.js');
child.w.RunnerHost.context.teaching;
child.eval('island-runner/app.js');assert(child.w.IslandRunner,'embedded runner booted');assert(parent.state.ready);assert.equal(parent.state.canPause,false);
let snap=child.w.IslandRunner.getSnapshot();assert.equal(snap.settings.className,'7-A');assert.equal(snap.settings.grade,7);assert.equal(snap.settings.house,'ravenclaw');assert.equal(snap.selectedIsland,2);assert(child.document.getElementById('gradeSelect').disabled);assert(child.document.getElementById('classSelect').disabled);assert(child.document.getElementById('housePicker').hidden);assert.equal(child.document.getElementById('heroImage').src,supplied.avatar);
const custom={schema:1,grade:7,units:{'7-2':{version:1,content:{objective:'Teacher objective',bank:[{id:'v9-test',kind:'word',prompt:'elma',choices:['apple','pear','grape'],answer:0}]}}}};
child.w.IslandRunner.applyTeaching(custom);assert.equal(child.document.getElementById('selectedObjective').textContent,'Teacher objective');
child.document.getElementById('startButton').click();child.tick();assert(parent.state.canPause);
assert(child.renderer.lastRun.questions.every(q=>q.prompt==='elma'));
const edited=structuredClone(custom);edited.units['7-2'].version=2;edited.units['7-2'].content.bank[0].prompt='apple';edited.units['7-2'].content.bank[0].choices=['elma','armut','üzüm'];child.w.IslandRunner.applyTeaching(edited);assert(child.renderer.lastRun.questions.every(q=>q.prompt==='elma'),'published edit does not change active run');assert.equal(child.renderer.args[1].src,supplied.avatar);
assert.equal(parent.togglePause().ok,true);assert(parent.state.paused);assert(child.document.getElementById('pauseDialog').open);parent.togglePause();assert(!parent.state.paused);
const current=child.renderer.lastRun;child.tick();const distance=current.distance;
assert.equal(parent.close().ok,true);assert(current.paused);assert.equal(child.rafs.size,0);assert.equal(board.document.getElementById('winner-overlay').inert,false);
parent.open();assert.equal(board.document.getElementById('island-run-frame'),frame,'reopening reuses the same paused run');assert.equal(current.distance,distance);assert(current.paused);assert.equal(child.rafs.size,1);parent.togglePause();assert(!current.paused);
// Complete a real run through the embedded UI and verify persistent, correctly scoped progress.
const {drive}=require('./runner-driver.cjs');
for(let t=0;t<18000&&current.status==='running';t++){drive(current);child.tick();}
assert(!child.document.getElementById('restorationScene').hidden);assert(!child.document.getElementById('resultDialog').open,'restoration is unobstructed');
child.tick();assert.match(child.document.getElementById('restorationArt').innerHTML,/landmark-before/);assert.match(child.document.getElementById('restorationArt').innerHTML,/landmark-after/);assert.equal(child.document.getElementById('restorationSeal').children[0].tagName,'IMG');
for(let t=0;t<310;t++)child.tick();
assert.equal(current.status,'completed');assert.equal(current.correct,6);assert(child.document.getElementById('resultDialog').open);const after=JSON.parse(storage.get(E.storageKey));assert(after.progress['7-A|ravenclaw'][2]);assert.deepEqual(after.progress['5-C|gryffindor'],saved.progress['5-C|gryffindor']);assert(!parent.state.canPause);
child.document.getElementById('resultChampions').click();assert(!parent.isOpen);parent.open();assert.equal(child.w.IslandRunner.getSnapshot().status,'completed');
// Import restores edits/progress, but cannot turn the champion into another class/team.
child.document.getElementById('resultMap').click();child.document.getElementById('passportButton').click();const passport=child.document.getElementById('passportGrid');assert(passport.children[1].classList.contains('fresh-stamp'));assert.equal(passport.children[1].children[0].children[0].tagName,'IMG');child.document.getElementById('passportDialog').close();child.document.getElementById('passportButton').click();assert(!passport.children[1].classList.contains('fresh-stamp'),'earned animation is consumed once');child.document.getElementById('passportDialog').close();
child.document.getElementById('runSettingsButton').click();const graphics=child.document.getElementById('graphicsQuality');graphics.value='light';graphics.onchange();assert.equal(storage.get('island-run-graphics'),'light');child.document.getElementById('teacherDialog').close();
child.document.getElementById('resultReplay').click();child.tick();assert.equal(child.renderer.args[6],true,'light preference reaches renderer');assert(child.renderer.lastRun.questions.every(q=>q.prompt==='apple'),'next run uses publication');
child.document.getElementById('resultMap').click();const restore=E.fresh();restore.settings.className='8-B';restore.settings.grade=8;restore.settings.house='slytherin';restore.overrides['7-1']=[{id:'teacher-one',kind:'word',prompt:'Teacher edit',choices:['yes','no','maybe'],answer:0}];
(async()=>{
 const importFile=child.document.getElementById('importFile');importFile.files=[{size:500,text:async()=>JSON.stringify(restore)}];await importFile.onchange();child.document.getElementById('confirmImport').click();snap=child.w.IslandRunner.getSnapshot();assert.equal(snap.settings.className,'7-A');assert.equal(snap.settings.house,'ravenclaw');assert.equal(JSON.parse(storage.get(E.storageKey)).overrides['7-1'][0].prompt,'Teacher edit');
 // Session exit clears the child; the old child's messages cannot affect a later result.
 const oldChild=frame.contentWindow,oldToken=supplied.token;eligible=false;board.document.dispatchEvent({type:'league-scene-change'});assert(!parent.isOpen);assert(!board.document.getElementById('island-run-frame'));assert.equal(parent.report(oldChild,oldToken,{ready:true}),false);
 // No chosen tally class: explicitly choose one for this adventure only.
 eligible=true;winner={...winner,sessionId:'next-session',className:null,house:'hufflepuff',name:'Hufflepuff',level:3,avatarMarkup:'<span class="animated-avatar"></span>'};parent.open();assert(!board.document.getElementById('island-run-class-picker').hidden);assert.equal(board.document.getElementById('island-run-classes').children.length,5);board.document.getElementById('island-run-classes').children[1].click();const f2=board.document.getElementById('island-run-frame'),c2=parent.connect(f2.contentWindow);assert.equal(c2.className,'5-C');assert.equal(c2.house,'hufflepuff');assert.match(c2.avatar,/hufflepuff-3.webp$/);assert.equal(winner.className,null);
 // Closing while loading destroys the half-loaded frame, so it cannot start out of view.
 parent.close();assert(!board.document.getElementById('island-run-frame'));parent.open();board.document.getElementById('island-run-classes').children[0].click();for(const f of [...board.timers.values()])f();assert(!board.document.getElementById('island-run-retry').hidden);board.document.getElementById('island-run-retry').click();assert(board.document.getElementById('island-run-frame'));
 board.w.LeagueAccess.granted=false;board.emit('storage');assert(!parent.isOpen);assert.equal(parent.open().ok,false);
 // A direct child-page visit never boots the embedded game.
 const direct=environment(read('island-runner/index.html'),'https://tally.invalid/island-runner/index.html');direct.w.parent=direct.view;direct.eval('island-runner/host-bridge.js');direct.eval('island-runner/app.js');assert.equal(direct.w.RunnerHost.context,null);assert.equal(direct.w.IslandRunner,undefined);
 console.log('PASS champion/class/current-avatar launch, lazy load, authenticated exact-child binding, paused return/reopen, real completed UI run and scoped progress, teacher-backup import, session cleanup, missing-class picker, load retry and direct-entry guard.');
})().catch(e=>{console.error(e);process.exitCode=1;});
