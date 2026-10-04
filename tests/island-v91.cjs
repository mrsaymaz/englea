const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../public/island-runner/engine.js'),I=require('../public/island-runner/islands.js'),C=require('../public/island-runner/expand-content.js');
const {drive,simulate}=require('./runner-driver.cjs'),{makeGas}=require('./roster-gas-harness.cjs');
const options={bank:C.grades[5][0].bank,seed:93};let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS',name);};
const advance=(r,seconds,fps=60)=>{for(let i=0;i<seconds*fps;i++)r.step(1/fps);};
test('Prompt-first preview keeps route objects alive; choices receive the full reading allowance',()=>{
 const r=new E.Run(options);r.distance=900;r.beginGate();r.objects=[{at:905,lane:1,type:'coin'}];advance(r,1.5);assert.equal(r.coins,1);assert.equal(r.gate.choicesShown,false);assert.equal(r.gate.ratio,0);advance(r,.2);assert(r.gate.choicesShown);assert(r.gate.ratio<.02);assert.equal(r.gate.duration-r.gate.preview,10);assert.equal(r.drain().filter(e=>e.type==='choices').length,1);
});
test('Focus has an exact cap, collects only existing nearby coins, shields one hit, then expires',()=>{
 const r=new E.Run(options),total=r.totalCoins,target=r.requiredCoins;r.addFocus(99);assert.equal(r.focusTime,0);r.addFocus(1);assert(r.focusShield);assert.equal(r.metrics.focusUses,1);r.addFocus(200);assert.equal(r.metrics.focusUses,1);r.takeHit('boss');assert.equal(r.health,5);assert.equal(r.focusShield,false);r.invincible=0;r.takeHit('boss');assert.equal(r.health,4);
 r.objects=[{at:30,lane:0,type:'coin'}];advance(r,.5);assert.equal(r.coins,1);assert.equal(r.totalCoins,total);assert.equal(r.requiredCoins,target);r.objects=[];advance(r,7);assert.equal(r.focusTime,0);assert.equal(r.focusShield,false);
});
test('All ten encounters have distinct rules, preserve coin totals and leave marked escape routes',()=>{
 assert.equal(new Set(I.islands.map(i=>i.rule)).size,10);
 for(let island=1;island<=10;island++){
  const r=new E.Run({...options,island});r.distance=2800;const before=r.objects.filter(o=>o.type==='coin').map(o=>({...o}));r.beginMechanic();assert.deepEqual(r.objects.filter(o=>o.type==='coin'),before);assert(r.mechanic.at-r.distance>=r.normalSpeed*2.5);assert.equal(r.mechanic.rule,I.get(island).rule);
  if(['signal','eclipse'].includes(r.mechanic.rule))assert.equal(r.mechanic.lanes.length,2);
  const desired=r.mechanic.lane;r.lane=r.lanePos=desired;r.distance=r.mechanic.at;r.stepMechanic(.01);assert(r.metrics.mechanics>=1);
 }
});
test('Boss controls remain live; waiting outside the weak lane spends no coins; jumps work in place',()=>{
 const r=new E.Run(options);r.coins=r.requiredCoins;r.beginBoss();r.bossState('expose');r.boss.weakLane=0;r.lane=r.lanePos=2;advance(r,1);assert.equal(r.boss.spent,0);assert(r.jump());const distance=r.distance;advance(r,.4);assert(r.jumpHeight>.8);assert.equal(r.distance,distance);r.setLane(0);advance(r,1);assert(r.boss.spent>0);assert(r.boss.hp<r.boss.maxHP);advance(r,.2);assert.equal(r.jumpAge,-1);
 r.pause();const frozen=JSON.stringify(r);advance(r,4);assert.equal(JSON.stringify(r),frozen);
});
test('Missed firing windows can lose an otherwise fully funded run; no automatic boss victory',()=>{
 const r=new E.Run(options);r.coins=r.totalCoins;r.beginBoss();for(let n=0;n<3600&&r.status==='running';n++){
  if(['warn','strike'].includes(r.boss.state))r.setLane([0,1,2].find(l=>!r.boss.lanes.includes(l)));
  if(r.boss.state==='expose')r.setLane((r.boss.weakLane+1)%3);r.step(1/60);
 }assert.equal(r.status,'ended');assert.equal(r.failureReason,'boss-dodge');assert.equal(r.boss.spent,0);
});
test('Late volleys settle before a counterattack; sufficient coins are never multiplied by Focus',()=>{
 const r=new E.Run(options);r.coins=r.requiredCoins;r.beginBoss();r.focusTime=7;r.focusShield=true;simulate(r);assert.equal(r.status,'completed');assert.equal(r.boss.spent,r.requiredCoins);assert.equal(r.metrics.bossVolleys,4);
 const poor=new E.Run(options);poor.coins=poor.requiredCoins-1;poor.score=999999;poor.addFocus(100);poor.beginBoss();simulate(poor);assert.equal(poor.status,'ended');assert.equal(poor.failureReason,'boss');
});
test('Best passport values merge independently, survive imports and never cross class/team boundaries',()=>{
 const s=E.fresh(),key='5-A|gryffindor';E.record(s.progress,key,1,{completed:true,score:1000,stars:3,coinPercent:87,hardClear:true});E.record(s.progress,key,1,{completed:true,score:1200,stars:1,coinPercent:60});assert.deepEqual(s.progress[key][1],{score:1200,stars:3,coinPercent:87,hardClear:true});assert.deepEqual(E.validateSave(s,C).progress,s.progress);
 assert.equal(s.progress['5-C|gryffindor'],undefined);assert.equal(s.progress['5-A|slytherin'],undefined);s.progress[key][2]={score:100,stars:1};assert.equal(E.validateSave(s,C).progress[key][2].coinPercent,undefined);
});
test('Apps Script extends the six-column sheet without altering old values or other sheets',()=>{
 const g=makeGas(),s=g.ss.insertSheet('Island_Progress');s.rows=[['Class','Team','Island completed','Best score','Stars','Last updated'],['5-A','Gryffindor',1,1400,3,'old-time']];const before=JSON.stringify(g.sheets.get('Leaderboard').rows);
 let out=g.post({pin:'2595',type:'ISLAND_GET',className:'5-A'});assert.equal(out.passportVersion,1);assert.deepEqual(s.rows[1],['5-A','Gryffindor',1,1400,3,'old-time']);assert.equal(out.islandProgress['5-A|gryffindor'][1].coinPercent,undefined);assert.equal(s.rows[0][6],'Best coin percent');assert.equal(JSON.stringify(g.sheets.get('Leaderboard').rows),before);
 const data={pin:'2595',type:'FULL_SESSION',sessionId:'passport-test',className:'5-A',islandProgress:{'5-A|gryffindor':{1:{score:700,stars:1,coinPercent:81,hardClear:true}}}};out=g.post(data);assert.equal(out.status,'success');assert.deepEqual(out.islandProgress['5-A|gryffindor'][1],{score:1400,stars:3,coinPercent:81,hardClear:true});const rows=s.getLastRow();g.post(data);assert.equal(s.getLastRow(),rows);data.islandProgress['5-A|gryffindor'][1]={score:300,stars:1};g.post(data);assert.equal(g.post({pin:'2595',type:'ISLAND_GET',className:'5-A'}).islandProgress['5-A|gryffindor'][1].coinPercent,81);
 for(const bad of [{coinPercent:101},{coinPercent:'80'},{hardClear:'true'}]){data.islandProgress['5-A|gryffindor'][1]={score:10,stars:1,...bad};assert.equal(g.post(data).status,'error');}
 const other=makeGas(),sheet=other.ss.insertSheet('Island_Progress');sheet.rows=[['Class','Team','Island completed','Best score','Stars','Last updated','Custom data'],['5-A','Gryffindor',1,99,1,'old','Do not overwrite']];assert.equal(other.post({pin:'2595',type:'ISLAND_GET',className:'5-A'}).status,'error');assert.equal(sheet.rows[1][6],'Do not overwrite');
});
test('Parent progress merges keep passport details across stale cloud restores',()=>{
 const disk=new Map(),c={console,JSON,Number,Object,Array,Map,Set,CustomEvent:class{},document:{getElementById:()=>null,dispatchEvent(){}},localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../public/island-progress.js'),'utf8'),c);const api=c.LeagueIslandProgress;
 api.merge({'5-A|gryffindor':{1:{score:50,stars:2,coinPercent:91,hardClear:true}}},'5-A');api.merge({'5-A|gryffindor':{1:{score:60,stars:3}}},'5-A');assert.equal(api.snapshot('5-A')['5-A|gryffindor'][1].coinPercent,91);assert.equal(api.snapshot('5-A')['5-A|gryffindor'][1].hardClear,true);
});
let simulations=0;
test('400 additional seed/FPS checks: six answers, a real encounter and a winnable boss at 20 and 60 FPS',()=>{
 for(const mode of ['soft','hard'])for(let island=1;island<=10;island++)for(let seed=0;seed<10;seed++)for(const fps of [20,60]){
  const r=simulate(new E.Run({...options,bank:C.grades[8][island-1].bank,mode,island,seed,readPace:'extra'}),'collector',fps);assert.equal(r.status,'completed',JSON.stringify({mode,island,seed,fps,reason:r.failureReason,coins:r.coins,target:r.requiredCoins}));assert.equal(r.correct,6);assert(r.metrics.mechanics>0);assert.equal(r.boss.spent,r.requiredCoins);simulations++;
 }
});
(async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');let writes=0;
 const req=new Request('https://school.test/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'test',type:'FULL_SESSION',className:'5-A',islandProgress:{'5-A|gryffindor':{1:{score:100,stars:1,coinPercent:90}}}})});
 const old=async(u,o)=>{if(JSON.parse(o.body).type!=='ISLAND_GET')writes++;return new Response(JSON.stringify({status:'success',islandProgress:{}}));};const reply=await(await handleSession(req,old)).json();assert.equal(reply.status,'error');assert.match(reply.message,/9.1.0/);assert.equal(writes,0);console.log('PASS old-script capability check prevents silently dropping passport details');console.log(JSON.stringify({checks:checks+1,simulations}));
})().catch(e=>{console.error(e);process.exitCode=1;});
