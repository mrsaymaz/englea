/* v9.7.0 dependency-free checks: one Island Run navigator per session, navigator seals (device store, Google
   Sheets tab, Netlify capability check, student award card) and the remote's student controller with a
   Bluetooth keyboard. Browser checks are in board-v97.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));

// ---- A tiny DOM: elements by id, classes, listeners, timers ----
function dom(){
 const nodes=new Map(),listeners={},timers=[],intervals=[];
 class El{constructor(tag){this.tagName=(tag||'div').toUpperCase();this.children=[];this.attrs={};this.dataset={};this.cls=new Set();this.hidden=false;this.disabled=false;this.textContent='';this.style={setProperty(){}};this.listeners={};this.offsetWidth=1;
  this.classList={add:(...c)=>c.forEach(x=>this.cls.add(x)),remove:(...c)=>c.forEach(x=>this.cls.delete(x)),contains:c=>this.cls.has(c),toggle:(c,b)=>{(b??!this.cls.has(c))?this.cls.add(c):this.cls.delete(c);}};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  set className(v){this.cls=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.cls].join(' ');}
  set innerHTML(v){this.children=[];}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
  append(...n){n.forEach(x=>{this.children.push(x);if(x._id)nodes.set(x._id,x);});}
  addEventListener(k,f){(this.listeners[k]??=[]).push(f);}fire(k,e={}){(this.listeners[k]||[]).forEach(f=>f({preventDefault(){},stopPropagation(){},target:this,...e}));}
  focus(){}querySelector(){return null;}getClientRects(){return [{}];}closest(){return null;}
 }
 const document={body:new El('body'),visibilityState:'visible',getElementById:id=>nodes.get(id)||null,createElement:t=>new El(t),
  querySelectorAll:sel=>{const m=sel.match(/^\[data-run-control(?:="(\w+)")?\]$/);if(m)return [...nodes.values()].filter(n=>n.dataset.runControl&&(!m[1]||n.dataset.runControl===m[1]));return [];},
  querySelector:sel=>{const m=sel.match(/^\[data-run-control="(\w+)"\]$/);return m?[...nodes.values()].find(n=>n.dataset.runControl===m[1])||null:null;},
  addEventListener:(k,f)=>{(listeners[k]??=[]).push(f);},dispatchEvent:e=>{(listeners[e.type]||[]).forEach(f=>f(e));},fire(k,e){(listeners[k]||[]).forEach(f=>f(e));}};
 return {El,nodes,document,timers,intervals,make(id,tag){const el=new El(tag);el.id=id;return el;},flush(){while(timers.length)timers.shift()();}};
}

// ---- Navigator seals store ----
function sealsModule(storage=new Map(),d=dom()){
 const window={};const ctx={window,document:d.document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail;}},Image:class{},setTimeout:f=>{d.timers.push(f);return d.timers.length;},setInterval:f=>{d.intervals.push(f);return d.intervals.length;},clearInterval(id){d.intervals[id-1]=()=>{};}};
 vm.createContext(ctx);vm.runInContext(pub('navigator-seals.js'),ctx);return {S:window.LeagueNavigatorSeals,storage,d};
}
const elif={id:'5-A:gryffindor:0',name:'Elif Naz',team:'gryffindor'};

test('A navigator earns each island seal once; seals persist on the device and only ever add up',()=>{
 const {S,storage}=sealsModule();
 let r=S.award('5-A',elif,3,'lesson-1');assert.deepEqual(plain(r),{ok:true,added:true,count:1,name:'Elif Naz'});
 r=S.award('5-A',elif,3,'lesson-2');assert.equal(r.added,false,'the same island twice is one seal');assert.equal(r.count,1);
 S.award('5-A',elif,1,'lesson-2');assert.deepEqual(plain(S.islands('5-A',elif.id)),[1,3]);
 for(const bad of [0,11,2.5,'x'])assert.equal(S.award('5-A',elif,bad,'s').added,false,'island '+bad);
 assert.equal(S.award('9-Z',elif,4,'s').added,false,'unknown class');assert.equal(S.award('5-A',{id:'bad id!',name:'X',team:'gryffindor'},4,'s').ok,false);
 assert.deepEqual(plain(S.islands('5-C',elif.id)),[],'seals belong to their class');
 const again=sealsModule(storage).S;assert.deepEqual(plain(again.islands('5-A',elif.id)),[1,3],'kept after a reload');
 // Rows from Google Sheets merge in; nothing is removed, invalid rows are ignored.
 assert.equal(again.merge('5-A',[{studentId:elif.id,student:'Elif Naz',team:'gryffindor',island:7,sessionId:'lesson-0'},{studentId:'5-A:slytherin:1',student:'Yazan',team:'slytherin',island:2},{studentId:'5-A:x:1',team:'nope',island:2},{island:4}]),true);
 assert.deepEqual(plain(again.islands('5-A',elif.id)),[1,3,7]);assert.deepEqual(plain(again.islands('5-A','5-A:slytherin:1')),[2]);
 assert.equal(again.merge('5-A',[]),false);assert.equal(again.rows('5-A').length,4);
 assert.deepEqual(plain(again.rows('5-A')[0]),{studentId:'5-A:gryffindor:0',student:'Elif Naz',team:'gryffindor',island:1,sessionId:'lesson-2'});
});

test('A new seal is announced with the student’s name once the class is back on the board, not during the run',()=>{
 const d=dom();d.document.body.classList.add('island-run-active');d.document.body.classList.contains=c=>c==='island-run-active'&&d.document.body.cls.has(c);
 const {S}=sealsModule(new Map(),d);S.award('5-A',elif,2,'lesson-1');
 d.intervals[0]();assert.equal(d.nodes.get('passport-seal-toast'),undefined,'still in Island Run');
 d.document.body.cls.delete('island-run-active');d.intervals[0]();
 const toast=d.nodes.get('passport-seal-toast');assert(toast);assert.equal(toast.children[1].children[1].textContent,'Elif Naz · Island 2');
 assert.match(toast.children[1].children[2].textContent,/Gryffindor · Tickthorn defeated · 1 of 10 seals/);
 S.merge('5-A',[{studentId:'5-A:gryffindor:1',student:'Sümeyye',team:'gryffindor',island:5}]);d.flush();
 assert.equal(toast.children[1].children[1].textContent,'Elif Naz · Island 2','loading seals from Google Sheets is not announced');
});

// ---- One navigator per session (board) ----
test('The board picks one random contributor of the Arena champion as navigator for the whole session',()=>{
 const game=pub('game.js'),src=game.slice(game.indexOf('        function chooseSessionNavigator'),game.indexOf('        // Controller side'));
 const rosterCtx={window:{}};vm.createContext(rosterCtx);vm.runInContext(pub('student-rosters.js'),rosterCtx);const L=rosterCtx.window.LeagueStudents;
 const log=[];const ctx={globalThis:null,LeagueStudents:L,window:{crypto:null},Math,sessionId:'lesson-1',selectedClass:'5-A',studentContributions:{},addHistoryLog:m=>log.push(m),scheduleCheckpoint(){},sessionNavigator:null};
 ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src.replace('function chooseSessionNavigator','globalThis.choose=function'),ctx);
 const team=L.members('5-A','gryffindor');L.credit(ctx.studentContributions,team[2],10);L.credit(ctx.studentContributions,team[4],10);
 const winner={id:'gryffindor',name:'Gryffindor'},seen=new Set();
 // The same session always keeps its first choice, for every Island Run opened in it.
 let first=null;for(let i=0;i<20;i++){ctx.sessionNavigator=null;const pick=ctx.choose(winner);seen.add(pick.id);first??=pick;}
 assert.deepEqual([...seen].sort(),[team[2].id,team[4].id].sort(),'only contributors are chosen, at random');
 ctx.sessionNavigator=null;const kept=ctx.choose(winner);for(let i=0;i<10;i++)assert.equal(ctx.choose(winner).id,kept.id);
 ctx.sessionId='lesson-2';const next=ctx.choose(winner);assert.equal(next.sessionId,'lesson-2','a new session chooses again');
 ctx.studentContributions={};ctx.sessionNavigator=null;assert(team.some(p=>p.id===ctx.choose(winner).id),'nobody contributed: anyone from the team');
 ctx.selectedClass=null;ctx.sessionNavigator=null;assert.equal(ctx.choose(winner),null,'no class, no navigator');
 assert.match(log[0],/Island Run navigator for this session: .+ \(Gryffindor\)\./);
 // Kept in the session checkpoint and restored only for the same session.
 assert.match(game,/commandLedger,boardSummaries,vixarDefeatedThisSession,lastVortexTime,sessionNavigator,/);
 assert.match(game,/sessionNavigator=s\.sessionNavigator&&s\.sessionNavigator\.sessionId===s\.sessionId/);
 // The runner uses that navigator for every run; the remote can no longer change it.
 const app=pub('island-runner/app.js');assert.match(app,/const sessionNavigator=typeof H\.context\?\.navigator\?\.name==='string'/);assert.doesNotMatch(app,/navigators\.next|nextNavigator/);
 assert.match(pub('island-run.js'),/nextNavigator:\(\)=>\(\{ok:false,message:'The navigator stays the same for the whole session\.'\}\)/);
 assert.doesNotMatch(pub('index.html'),/mobile-run-next|Another student/);
});

test('Only a completed, non-practice run earns the navigator the island’s seal, through the board bridge',()=>{
 const app=pub('island-runner/app.js'),bridge=pub('island-run.js'),host=pub('island-runner/host-bridge.js');
 assert.match(app,/if\(result\.completed&&!practice&&sessionNavigator\)navigatorSeal=H\.seal\?\.\(activeIsland\)\|\|null;/);
 assert.match(app,/if\(navigatorSeal\?\.added\)badges\.push\(\['seal',`\$\{navigatorSeal\.name\} · seal \$\{navigatorSeal\.count\} of 10`\]\);/);
 assert.match(host,/seal\(island\)\{if\(context\)try\{return bridge\.sealFrom\?\.\(root,context\.token,island\)\|\|null;\}catch\{\}return null;\}/);
 assert.match(bridge,/sealFrom\(child,key,island\)\{\s*if\(!own\(child,key\)\|\|!context\.navigator\)return null;\s*const n=Number\(island\);if\(!Number\.isInteger\(n\)\|\|n<1\|\|n>10\)return null;/);
 assert.match(bridge,/root\.LeagueNavigatorSeals\?\.award\(context\.className,context\.navigator,n,context\.sessionId\)/);
});

// ---- Student award card ----
test('The student award card shows ten seal places (five to a row) instead of the points',()=>{
 const ui=pub('student-ui.js'),css=pub('league-v97.css');
 assert.match(ui,/element\('strong','student-contribution-name',person\.name\),\s*sealGrid\(person\)\);/);assert.doesNotMatch(ui,/'student-contribution-points'/);
 assert.match(ui,/for \(let island = 1; island <= 10; island\+\+\)/);
 assert.match(css,/\.student-seal-grid\{[^}]*grid-template-columns:repeat\(5,var\(--seal\)\)/);
 assert.match(pub('index.html'),/league-v97\.css\?v=9\.7\.0/);assert.match(pub('index.html'),/navigator-seals\.js\?v=9\.7\.0/);
});

// ---- Google Sheets ----
const {makeGas}=require('./roster-gas-harness.cjs');
const seal=(over={})=>({studentId:'5-A:gryffindor:0',student:'Elif Naz',team:'gryffindor',island:1,sessionId:'lesson-9',...over});
const save=(gas,extra={})=>gas.post({type:'FULL_SESSION',pin:'2595',className:'5-A',sessionId:'lesson-9',standings:[{name:'Gryffindor',points:40,level:2}],winner:'Gryffindor',...extra});
test('Apps Script v9.7.0 keeps one Navigator_Seals row per student and island and returns them with Load islands',()=>{
 const gas=makeGas();
 let r=save(gas,{navigatorSeals:[seal(),seal({island:3}),seal({studentId:'5-A:slytherin:1',student:'=HACK()',team:'slytherin',island:2})]});
 assert.equal(r.status,'success',JSON.stringify(r));assert.equal(r.navigatorSealsVersion,1);assert.equal(r.sealsAdded,3);assert.equal(r.navigatorSeals.length,3);
 const sheet=gas.sheets.get('Navigator_Seals');assert.deepEqual(sheet.rows[0],['Date','Class','Team','Student','Student ID','Island','Guardian','Session ID']);
 assert.deepEqual(sheet.rows.slice(1).map(x=>x.slice(1)),[['5-A','Gryffindor','Elif Naz','5-A:gryffindor:0',1,'Veyr','lesson-9'],['5-A','Gryffindor','Elif Naz','5-A:gryffindor:0',3,'Mirrath','lesson-9'],['5-A','Slytherin',"'=HACK()",'5-A:slytherin:1',2,'Tickthorn','lesson-9']]);
 r=save(gas,{sessionId:'lesson-10',navigatorSeals:[seal(),seal({island:3}),seal({island:4,sessionId:'lesson-10'})]});assert.equal(r.sealsAdded,1,'saved seals are not repeated');assert.equal(sheet.getLastRow(),5);
 gas.post({type:'FULL_SESSION',pin:'2595',className:'5-C',sessionId:'lesson-11',standings:[],winner:'-',navigatorSeals:[seal({studentId:'5-C:ravenclaw:0',student:'Burak',team:'ravenclaw',island:1})]});
 const loaded=gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'});assert.equal(loaded.navigatorSealsVersion,1);
 assert.deepEqual(plain(loaded.navigatorSeals.map(x=>[x.studentId,x.island,x.team])),[['5-A:gryffindor:0',1,'gryffindor'],['5-A:gryffindor:0',3,'gryffindor'],['5-A:slytherin:1',2,'slytherin'],['5-A:gryffindor:0',4,'gryffindor']]);
 assert.equal(loaded.navigatorSeals[2].student,'=HACK()','names come back as written');
});
test('An invalid navigator seal writes nothing at all; a save without seals is unchanged',()=>{
 for(const bad of [seal({island:11}),seal({studentId:'bad id'}),seal({team:'houseelf'}),seal({student:''}),seal({sessionId:'bad session!'})]){
  const gas=makeGas(),before=gas.sheets.get('Leaderboard').getLastRow(),r=save(gas,{navigatorSeals:[seal({island:2}),bad]});
  assert.equal(r.status,'error',JSON.stringify(bad));assert.equal(gas.sheets.get('Navigator_Seals'),undefined);assert.equal(gas.sheets.get('Leaderboard').getLastRow(),before,'no half-saved session');
 }
 const gas=makeGas(),r=save(gas);assert.equal(r.status,'success');assert.equal(r.navigatorSeals,undefined);assert.equal(gas.sheets.get('Navigator_Seals'),undefined);
 assert.equal(makeGas().post({type:'ISLAND_GET',pin:'2595',className:'5-A'}).navigatorSeals.length,0);
});

// ---- Remote: student controller and Bluetooth keyboard ----
function remote(){
 const d=dom(),sent=[];
 for(const id of ['mobile-controller','mobile-run-panel','mobile-run-navigator','mobile-run-pad-open','mobile-run-repeat','mobile-run-voice','mobile-run-pad','mobile-run-pad-close','mobile-run-pad-navigator','mobile-run-pad-status','mobile-more-btn','mobile-more-sheet'])d.make(id);
 d.nodes.get('mobile-run-pad').hidden=true;
 for(const action of ['up','down','jump']){const b=d.make('pad-'+action,'button');b.dataset.runControl=action;}
 const wake={requests:0,released:0};
 const ctx={window:{},document:d.document,navigator:{wakeLock:{request:async()=>{wake.requests++;return {release:async()=>{wake.released++;},addEventListener(){}};}}},setTimeout:()=>0,clearTimeout(){}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(pub('run-remote.js'),ctx);
 const R=ctx.LeagueRunRemote;R.configure({send:()=>true,control:a=>{sent.push(a);return true;}});
 const key=(k,extra={})=>{let prevented=false;d.document.fire('keydown',{key:k,repeat:false,target:d.document.body,preventDefault(){prevented=true;},stopPropagation(){},...extra});return prevented;};
 return {d,R,sent,key,wake,pad:()=>d.nodes.get('mobile-run-pad')};
}
const runState={open:true,ready:true,canPause:true,paused:false,navigator:'Elif Naz'};
test('The student controller pops up when a run starts and steers with big buttons',()=>{
 const t=remote();t.R.render({open:true,ready:true,canPause:false,navigator:'Elif Naz'},true);assert.equal(t.pad().hidden,true,'not before a run starts');
 t.R.render(runState,true);assert.equal(t.pad().hidden,false,'pops up at the start of a run');
 assert.equal(t.d.nodes.get('mobile-run-pad-navigator').textContent,'Navigator · Elif Naz');
 t.d.nodes.get('pad-up').fire('pointerdown');t.d.nodes.get('pad-jump').fire('pointerdown');assert.deepEqual(t.sent,['up','jump']);
 t.d.nodes.get('mobile-run-pad-close').fire('click');assert.equal(t.pad().hidden,true);
 t.R.render(runState,true);assert.equal(t.pad().hidden,true,'closed by the teacher: stays closed for this run');
 t.R.render({...runState,canPause:false},true);t.R.render(runState,true);assert.equal(t.pad().hidden,false,'pops up again for the next run');
 t.R.render({...runState,paused:true},true);t.d.nodes.get('pad-down').fire('pointerdown');assert.deepEqual(t.sent,['up','jump'],'paused: no steering');
 assert.equal(t.d.nodes.get('pad-down').disabled,true);
 t.R.render({open:false},true);assert.equal(t.pad().hidden,true,'closes when Island Run closes');
 assert(t.wake.requests>=1,'keeps the phone screen awake during Island Run');
});
test('A Bluetooth keyboard on the phone steers with ↑ ↓ → and Space, without auto-repeat lane changes',()=>{
 const t=remote();t.R.render(runState,true);t.R.closePad(true);
 assert.equal(t.key('ArrowUp'),true);assert.equal(t.key('ArrowDown'),true);assert.equal(t.key('ArrowRight'),true);assert.equal(t.key(' '),true);
 assert.deepEqual(t.sent,['up','down','jump','jump'],'works with the controller closed too');
 t.key('ArrowDown',{repeat:true});t.key(' ',{repeat:true});assert.deepEqual(t.sent.slice(4),['jump'],'a held arrow is one lane change; a held jump repeats');
 assert.equal(t.key('a'),false);assert.equal(t.key('Enter'),false);
 const input=new t.d.El('input');t.key('ArrowUp',{target:input});t.key('ArrowUp',{ctrlKey:true});assert.equal(t.sent.length,5,'typing and shortcuts are left alone');
 const hidden=new t.d.El('input');hidden.getClientRects=()=>[];t.key('ArrowUp',{target:hidden});assert.equal(t.sent.at(-1),'up','a hidden field that kept focus (the Load islands PIN) does not block the keyboard');
 t.R.openPad();t.key('ArrowDown',{target:input});assert.equal(t.sent.at(-1),'down','with the controller open, every arrow steers');
 t.R.render({open:false},true);const before=t.sent.length;assert.equal(t.key('ArrowUp'),false,'no Island Run: the keys do nothing');assert.equal(t.sent.length,before);
 t.R.render(runState,false);assert.equal(t.key('ArrowUp'),false,'disconnected: nothing is sent');
});
test('Board side: steering is a light message bound to the session, applied only to an open, ready Island Run',()=>{
 const game=pub('game.js'),bridge=pub('island-run.js'),app=pub('island-runner/app.js');
 assert.match(game,/return safeRemoteSend\(\{ type:'RUN_CONTROL', protocol:7, sessionId:latestRemoteSessionId, control:action, sequence:\+\+runControlSequence \}\);/);
 assert.match(game,/if\(data\.type==='RUN_CONTROL'&&isHost\)\{\s*if\(!connection\._stateReady\|\|connection\._versionMismatch\|\|data\.protocol!==7\|\|data\.sessionId!==sessionId\)return;\s*LeagueIslandRun\.control\(data\.control\);return;/);
 assert.match(bridge,/control\(action\)\{\s*if\(!visible\|\|!permitted\(\)\|\|!ready\|\|!\['up','down','jump'\]\.includes\(action\)\)return false;/);
 assert.match(app,/function remoteControl\(action\)\{\s*if\(!\['up','down','jump'\]\.includes\(action\)\|\|!run\|\|run\.status!=='running'\|\|document\.querySelector\('dialog\[open\]'\)\)return false;/);
 assert.match(app,/control:remoteControl,/);
});

(async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');
 const call=async(capability,body)=>{const fetcher=async(url,o)=>{const d=JSON.parse(o.body);return {ok:true,json:async()=>d.type==='ISLAND_GET'?capability:{status:'success',islandProgress:{}}};};
  return (await handleSession(new Request('https://x.invalid/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),fetcher)).json();};
 const v96={status:'success',islandProgress:{},passportVersion:1,questionLogVersion:1,contributionsVersion:1};
 const body={type:'FULL_SESSION',pin:'1',className:'5-A',islandProgress:{},navigatorSeals:[seal()]};
 let r=await call(v96,body);assert.equal(r.status,'error');assert.match(r.message,/Navigator seals are kept on this phone\. Update Apps Script using GOOGLE-APPS-SCRIPT-v9\.7\.0\.gs/);
 r=await call(v96,{...body,navigatorSeals:[]});assert.equal(r.status,'success','no seals yet: an older script still saves');
 r=await call({...v96,navigatorSealsVersion:1},body);assert.equal(r.status,'success');
 checks++;console.log('PASS Netlify session function keeps navigator seals on the phone until the Sheet runs the v9.7.0 script');
 console.log(JSON.stringify({checks}));
})().catch(e=>{console.error(e);process.exit(1);});
