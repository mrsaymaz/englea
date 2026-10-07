/* Presentation-contract checks with a controllable image loader, scene clock and DOM. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/creature-poses.js'),'utf8');
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
function harness(){
 let time=0,serial=0;const tasks=new Map(),nodes=new Map(),events={},images=[];
 class Element {
  constructor(id='',team='gryffindor',level=4){this.id=id;this.dataset={avatarTeam:team,avatarLevel:String(level)};this.style={};this.children=[];this.isConnected=true;this.className='';this.clientWidth=250;this.clientHeight=200;this.left=0;}
  setAttribute(){} appendChild(c){c.parent=this;this.children.push(c);return c;} remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.isConnected=false;}
  matches(q){return q==='.animated-avatar'&&this.className==='animated-avatar';}
  contains(el){return this===el||this.children.some(c=>c.contains(el));}
  querySelector(q){return this.querySelectorAll(q)[0]||null;}
  querySelectorAll(q){if(q===':scope > .creature-pose-layer')return this.children.filter(c=>c.className==='creature-pose-layer');
   let all=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);if(q==='*')return all;
   if(q.includes('animated-avatar')){all=all.filter(c=>c.className==='animated-avatar');const team=q.match(/data-avatar-team="(.*?)"/);if(team)all=all.filter(c=>c.dataset.avatarTeam===team[1]);return all;}return [];}
  getBoundingClientRect(){return {left:this.left,width:this.clientWidth,height:this.clientHeight};}
 }
 const body=new Element();body.classList={contains:s=>s==='performance-animated'};
 const document={hidden:false,baseURI:'https://example.test/',currentScript:{src:'https://example.test/creature-poses.js'},body,
  getElementById:id=>nodes.get(id),createElement:()=>new Element(),addEventListener:(n,f)=>(events[n]??=[]).push(f)};
 const clock={after(fn,ms){const id=++serial;tasks.set(id,{fn,due:time+ms});return id;},cancel(id){tasks.delete(id);},clear(){tasks.clear();}};
 const c={console,URL,Map,Set,WeakMap,Promise,document,performance:{now:()=>time},setTimeout:clock.after,clearTimeout:clock.cancel,
  SceneRuntime:{now:()=>time,create:()=>clock,paused:false,fastForwarding:false},LeagueScenes:{active:null},LeagueIslandRun:{isOpen:false},
  matchMedia:()=>({matches:false}),addEventListener:(n,f)=>(events[n]??=[]).push(f),
  Image:class {constructor(){images.push(this);this.naturalWidth=960;this.naturalHeight=960;}decode(){return Promise.resolve();}}
 };
 vm.createContext(c);vm.runInContext(source,c);const P=c.CreaturePoses;
 const actor=(hostId,team='gryffindor',level=4)=>{const host=new Element(hostId),el=new Element('',team,level);el.className='animated-avatar';host.appendChild(el);nodes.set(hostId,host);return {host,el};};
 const advance=ms=>{const end=time+ms;let n=0;while(true){const [id,t]=[...tasks].sort((a,b)=>a[1].due-b[1].due)[0]||[];if(!t||t.due>end)break;assert(++n<1000);tasks.delete(id);time=t.due;t.fn();}time=end;};
 const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
 const ready=async()=>{images.filter(x=>!x.done).forEach(x=>{x.done=true;x.onload();});await settle();};
 const fire=n=>(events[n]||[]).forEach(fn=>fn());
 return {P,c,actor,advance,ready,settle,images,tasks,nodes,fire,Element};
}
(async()=>{
await test('All 52 levels (v11.0.0: 0–12), ten bosses and the three Vixar forms resolve to the expected states; invalid IDs cannot form URLs',()=>{
 const {P}=harness();for(const id of ['gryffindor','slytherin','hufflepuff','ravenclaw'])for(let n=0;n<=12;n++){assert.equal(P.pack(id,n).states.length,9);assert.equal(P.pack(id,n).key,id+'-'+n);}
 for(const id of ['veyr','tickthorn','mirrath','rootmaw','vox','kaelis','morrow','noctryn','ferron','astrax'])assert.equal(P.pack(id).states.length,6);
 for(const id of ['vixar','vixar-scarlet','vixar-gilded'])assert.equal(P.pack(id).states.length,9);assert.equal(P.pack('../x'),null);assert.equal(P.pack('gryffindor',999).key,'gryffindor-12');
});
await test('Original art remains until decoding succeeds; a square pose fits a rectangular avatar box',async()=>{
 const h=harness(),{el}=h.actor('mascot-gryffindor');h.P.show(el,'attack');assert.equal(el.children.length,0);assert.equal(el.dataset.creaturePose,undefined);await h.ready();
 assert.equal(el.dataset.creaturePose,'attack');assert.equal(el.children[0].style.width,'200px');assert.equal(el.children[0].style.height,'200px');assert.equal(el.children[0].style.backgroundPosition,'50% 0%');
 h.advance(800);assert.equal(el.children.length,0);assert.equal(h.P.diagnostics().active,0);
});
await test('Failed, stale, disconnected and late image loads cannot hide the fallback or resurrect an expired pose',async()=>{
 for(const kind of ['fail','clear','disconnect','expire']){const h=harness(),{el}=h.actor('mascot-gryffindor');h.P.show(el,'attack');
  if(kind==='fail')h.images[0].onerror();if(kind==='clear')h.P.clear();if(kind==='disconnect')el.isConnected=false;if(kind==='expire')h.advance(900);
  if(kind!=='fail')await h.ready();else await h.settle();assert.equal(el.children.length,0,kind);h.advance(1000);assert.equal(h.P.diagnostics().active,0);}
});
await test('Knockout interrupts attack; revive removes the knockout lock in Arena and Vixar',async()=>{
 for(const scene of ['arena','raid']){const h=harness(),{el}=h.actor((scene==='arena'?'battle-shell-':'vixar-avatar-shell-')+'gryffindor');
  h.P.load('gryffindor',4);await h.ready();h.P[scene]('gryffindor','attack');h.advance(120);assert.equal(el.dataset.creaturePose,'attack');
  h.P[scene]('gryffindor','knockout');assert.equal(el.dataset.creaturePose,'hit');assert.equal(h.P.show(el,'proud'),false);
  h.P[scene]('gryffindor','revive');assert.equal(el.dataset.creaturePose,'proud');h.advance(1200);assert.equal(el.dataset.creaturePose,undefined);
 }
});
await test('Pause, hidden document, scene exit and fast-forward cancel or suppress pending visual work',async()=>{
 for(const event of ['league-scene-change','visibilitychange','league-pause-change','pagehide']){const h=harness(),{el}=h.actor('battle-shell-gryffindor');h.P.load('gryffindor',4);await h.ready();h.P.arena('gryffindor','attack');
  if(event==='visibilitychange')h.c.document.hidden=true;if(event==='league-pause-change')h.c.SceneRuntime.paused=true;h.fire(event);h.advance(1000);assert.equal(el.dataset.creaturePose,undefined,event);assert.equal(h.tasks.size,0,event);}
 const h=harness(),{el}=h.actor('mascot-gryffindor');h.c.SceneRuntime.fastForwarding=true;assert.equal(h.P.show(el,'attack'),false);assert.equal(h.images.length,0);
});
await test('Image cache is bounded (v10.5.1: ten sheets) and only the latest asynchronous request can update an actor',async()=>{
 const h=harness();for(let n=0;n<=10;n++)h.P.load('gryffindor',n);await h.ready();assert.equal(h.P.diagnostics().cached,10);
 const {el}=h.actor('mascot-ravenclaw','ravenclaw',3);h.P.show(el,'attack',{priority:30});h.P.show(el,'guard',{priority:70});await h.ready();assert.equal(el.dataset.creaturePose,'guard');
 h.P.boardLater('ravenclaw','leader',800);h.P.clear();h.advance(1000);assert.equal(el.dataset.creaturePose,undefined);
});
await test('Low-HP bracing triggers only on entry and never overrides a higher-priority hit',async()=>{
 const h=harness(),{el}=h.actor('battle-shell-gryffindor');h.P.load('gryffindor',4);await h.ready();h.P.healthChanged('arena','gryffindor',20,100);assert.equal(el.dataset.creaturePose,'guard');h.advance(1200);
 h.P.healthChanged('arena','gryffindor',19,100);assert.equal(el.dataset.creaturePose,undefined);h.P.healthChanged('arena','gryffindor',80,100);h.P.show(el,'hit');h.P.healthChanged('arena','gryffindor',18,100);assert.equal(el.dataset.creaturePose,'hit');
});
await test('Runner and boss states follow the real question gate, jumps, shots and phase without changing run data',()=>{
 const {P}=harness(),r={phase:'course',time:.65,jumpAge:-1,gate:{},boss:null};const before=JSON.stringify(r);assert.equal(P.runnerState(r),'runA');assert.equal(P.runnerState({...r,gate:null}),'runB');assert.equal(P.runnerState({...r,jumpAge:.2}),'jump');assert.equal(P.runnerState(r,true),'hit');assert.equal(P.runnerState(r,false,.25),'landing');assert.equal(P.runnerState(r,false,0,true),'runA');
 assert.equal(P.runnerState({...r,phase:'boss',boss:{shots:[{age:.1}]}}),'attack');assert.equal(P.runnerState({...r,phase:'boss',boss:{state:'knockout'}}),'hit');assert.equal(P.runnerState({...r,phase:'won'}),'proud');
 for(const [state,want] of Object.entries({arrive:'ready',warn:'ready',strike:'attack',expose:'exposed',counter:'guard',defeated:'defeat'}))assert.equal(P.bossState({state}),want);
 assert.equal(P.bossState({state:'strike'},true),'hit');assert.equal(P.bossState({defeated:true},true),'defeat');assert.equal(JSON.stringify(r),before);
});
await test('Results preserve champion priority, separate tied exchanges, encourage all tied-low teams and handle negative/all-equal scores',()=>{
 const {P}=harness(),rows=[{id:'gryffindor',points:5},{id:'slytherin',points:5},{id:'hufflepuff',points:-10},{id:'ravenclaw',points:-10}],before=JSON.stringify(rows);
 const plan=P.resultPlan(rows,'hufflepuff',['gryffindor','slytherin']);assert.equal(plan[0].kind,'champions');assert.equal(plan[0].ids.length,3);assert.equal(plan.filter(e=>e.kind==='tie').length,2);assert(plan.every((e,i)=>!i||e.at-plan[i-1].at>=2200));assert.equal(plan.at(-1).ids.slice(1).join(','),'hufflepuff,ravenclaw');assert.equal(JSON.stringify(rows),before);
 assert.equal(P.resultPlan(rows.map(r=>({...r,points:0})),'gryffindor',rows.map(r=>r.id)).map(e=>e.kind).join(','),'champions,together');assert.equal(P.resultPlan([],null,[]).length,0);
});
await test('Scheduled result exchanges stop on exit and never change contributor text or score objects',async()=>{
 const h=harness(),host=new h.Element('winner-overlay');h.nodes.set('winner-overlay',host);const rows=['gryffindor','slytherin','hufflepuff','ravenclaw'].map((id,i)=>({id,points:30-i*10}));
 for(const row of rows){const {el}=h.actor('result-'+row.id,row.id,4);host.appendChild(el);h.P.load(row.id,4);}await h.ready();h.c.LeagueScenes.active='results';const before=JSON.stringify(rows);h.P.results(rows,'ravenclaw',['gryffindor']);h.advance(250);assert.equal(host.children[0].dataset.creaturePose,'proud');assert.equal(host.children[3].dataset.creaturePose,'proud');
 h.P.stopResults();h.advance(10000);assert.equal(h.P.diagnostics().active,0);assert.equal(h.P.diagnostics().results,0);assert(host.children.every(el=>el.dataset.creaturePose===undefined));assert.equal(JSON.stringify(rows),before);
});
console.log(`PASS ${checks} creature pose contract groups`);
})().catch(e=>{console.error(e);process.exitCode=1;});
