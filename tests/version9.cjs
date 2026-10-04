const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {makeGas}=require('./roster-gas-harness.cjs'),M=require('../public/teaching-model.js'),A=require('../public/adventure.js'),Motion=require('../public/island-runner/spirit-motion.js'),S=require('../public/island-runner/scenery.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js');
const q={id:'teacher-1',kind:'word',prompt:'apple',choices:['elma','armut','üzüm'],answer:0};
assert.equal(M.bulk('apple | elma\npear | armut\ngrape | üzüm','import').length,6);
assert.equal(M.bulk('gap | She ___ here. | is | are | am','import')[0].answer,0);
for(const bad of [{...q,choices:['same','same','different']},{...q,id:'=IMPORTXML()'},{...q,kind:'gap'}])assert.throws(()=>M.question(bad));
for(const units of Object.values(C.grades))for(const u of units)assert(M.clean({objective:u.objective,bank:u.bank}));
const g=makeGas(),post=x=>g.post({pin:'2595',...x});
assert.equal(post({type:'TEACHING_GET',unit:'5-1',pin:'bad'}).status,'unauthorized');assert(!g.sheets.has('Teaching_Content'));
const first=post({type:'TEACHING_GET',unit:'5-1'});assert.equal(first.version,0);assert.equal(first.content.bank,null);
const data={type:'TEACHING_SAVE',unit:'5-1',revision:first.revision,content:{objective:'Use food words.',bank:[q]}};
const saved=post(data);assert.equal(saved.status,'success');assert.equal(saved.version,1);assert.equal(post(data).version,1,'retry idempotent');
assert.equal(post({...data,content:{objective:'stale edit',bank:[q]}}).status,'conflict');
const second=post({type:'TEACHING_GET',unit:'6-1'});assert.equal(second.version,0);
post({type:'TEACHING_SAVE',unit:'6-1',revision:second.revision,content:{objective:'=literal teacher text',bank:[{...q,id:'six'}]}});
assert.equal(post({type:'TEACHING_GET',unit:'5-1'}).content.bank[0].prompt,'apple');
assert.equal(post({type:'ISLAND_GET',className:'5-C'}).teaching.units['5-1'].version,1);
assert.equal(post({type:'ISLAND_GET',className:'7-A'}).teaching.units['5-1'],undefined);
const rows=g.sheets.get('Teaching_Content').rows;assert(rows.some(r=>r[2]==='"=literal teacher text"'));
const reduced=post({...data,revision:saved.revision,content:{objective:'Defaults restored',bank:null}});assert.equal(reduced.version,2);assert.equal(post({type:'TEACHING_GET',unit:'5-1'}).content.bank,null);
// Grow beyond a new spreadsheet's initial 1,000-row grid.
for(const unit of ['8-1','8-2','8-3']){const base=post({type:'TEACHING_GET',unit});assert.equal(post({type:'TEACHING_SAVE',unit,revision:base.revision,content:{objective:'Large bank',bank:Array.from({length:400},(_,i)=>({...q,id:'row-'+i}))}}).status,'success');}
assert(g.sheets.get('Teaching_Content').getMaxRows()>1000);assert.equal(post({type:'TEACHING_GET',unit:'8-1'}).content.bank.length,400);
g.lock(true);assert.equal(post(data).status,'error');g.lock(false);
function cache(){const events=[],storage=new Map(),c={console,TeachingModel:M,crypto,CustomEvent:class{constructor(type,v){this.type=type;this.detail=v.detail;}},document:{dispatchEvent:e=>events.push(e)},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../public/teaching.js'),'utf8'),c);return {api:c.LeagueTeaching,events};}
const one=cache(),two=cache(),catalog=post({type:'ISLAND_GET',className:'8-B'}).teaching;one.api.accept(catalog);assert.equal(one.events.length,1);
const chunks=[];one.api.send(v=>{chunks.push(v);return true;},'session',8);assert(chunks.length>2);for(const packet of chunks.reverse())two.api.receive(packet);assert.equal(two.api.unit('8-1').content.bank.length,400);assert.equal(two.events.length,1);assert.equal(two.api.accept(catalog),false);assert.throws(()=>two.api.receive({id:'bad',total:900,index:0,chunk:'x'}));
const old=structuredClone(catalog);old.units['8-1'].version=0;old.units['8-1'].content.objective='old';two.api.accept(old);assert.equal(two.api.unit('8-1').content.objective,'Large bank');
const progress={'5-A|gryffindor':{1:{score:40,stars:1}},'5-A|ravenclaw':{1:{score:60,stars:2}},'5-C|hufflepuff':{1:{score:60,stars:2}}};
assert.equal(A.restoration(progress,'5-A',1).stage,2);assert.equal(A.summary(progress,'5-A').restored,1);assert.equal(A.summary(progress,'5-A').today,2);assert.equal(A.summary(progress,'5-A',progress).today,0);assert.equal(A.nextIsland(progress,'5-C','gryffindor'),1);
for(const realm of Object.keys(S.palettes)){const stages=Array.from({length:5},(_,stage)=>S.islandSVG(realm,1,{stage,teams:A.teams.slice(0,stage)}));assert.equal(new Set(stages).size,5);}
const run={time:1,jumpAge:-1,phase:'course',paused:false};for(const team of A.teams){let draws=0;const ctx={drawImage(){draws++;}};Motion.draw(ctx,{naturalWidth:384,naturalHeight:384},120,Motion.pose(team,run,false),team);assert(draws<=16);const still=Motion.pose(team,run,true);assert.equal(still.wave,0);assert.equal(still.angle,0);const a=Motion.pose(team,run,false),b=Motion.pose(team,{...run,time:1.001},false);assert(Math.abs(a.angle-b.angle)<.002,'continuous movement');}
const local=E.fresh();local.seen['5-A|5-1']={word:['teacher-1'],gap:[],question:[],recent:[]};assert(E.validateSave(local,C,{'5-1':[q]}).seen['5-A|5-1'].word.includes('teacher-1'));
(async()=>{const {handleSession}=await import('../netlify/functions/session.mjs');const req=data=>new Request('https://school.test/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'2595',...data})});const res=await handleSession(req({type:'TEACHING_GET',unit:'5-1'}),async(url,opts)=>new Response(JSON.stringify(g.post(JSON.parse(opts.body)))));assert.equal((await res.json()).version,2);console.log('PASS v9 teaching validation, 40 default banks, imports, PIN, conflicts, idempotence, grade isolation, formula-safe storage, sheet growth, locks, proxy, chunked sync, stale versions, restoration, bounded motion and cloud question history.');})().catch(e=>{console.error(e);process.exitCode=1;});
