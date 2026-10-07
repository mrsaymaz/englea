/* Dependency-free checks: node source/test-engine.cjs */
const assert=require('node:assert/strict');
const E=require('../../public/island-runner/engine.js'),C=require('../../public/island-runner/expand-content.js'),B=require('../../public/island-runner/bosses.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS',name);}
const options={bank:C.grades[5][0].bank,seed:42};
const advance=(r,seconds)=>{for(let t=0;t<seconds;t+=1/60)r.step(1/60);};
const {drive,simulate}=require('../runner-driver.cjs');
test('40 banks contain 4,640 valid variations (v10.4.2: ten translations each) with stable unique IDs and all three types',()=>{
 let total=0;for(const units of Object.values(C.grades)){assert.equal(units.length,10);for(const u of units){assert.equal(u.bank.length,116);assert(u.bank.every(E.validateQuestion));assert.equal(new Set(u.bank.map(q=>q.id)).size,116);assert.deepEqual(new Set(u.bank.map(q=>q.kind)),new Set(['word','gap','question']));total+=u.bank.length;}}assert.equal(total,4640);assert.equal(B.bosses.length,10);
});
test('Question types, question IDs and answer lanes shuffle without corrupting the answer',()=>{
 const lanes=new Set(),orders=new Set(),first=new Set();for(let seed=0;seed<90;seed++){
 const r=new E.Run({...options,seed});assert.equal(new Set(r.questions.map(q=>q.id)).size,6);orders.add(r.questions.map(q=>q.kind).join(','));first.add(r.questions[0].id);
 for(const kind of ['word','gap','question'])assert.equal(r.questions.filter(q=>q.kind===kind).length,2);
 for(const q of r.questions){const orig=options.bank.find(b=>b.id===q.id);assert.equal(q.choices[q.answer],orig.choices[orig.answer]);lanes.add(q.answer);}}
 assert.equal(lanes.size,3);assert(orders.size>10);assert(first.size>20);
});
test('Saved class history avoids exact repeats until each type pool is exhausted',()=>{
 const h={};for(let turn=0;turn<45;turn++){const qs=E.selectQuestions(options.bank,E.random(turn),6,h);for(const q of qs){const pool=options.bank.filter(b=>b.kind===q.kind);if(h[q.kind]?.includes(q.id))assert.equal(h[q.kind].length,pool.length);E.markSeen(h,options.bank,q);}}
 const s=E.fresh();s.seen['5-A|5-1']=h;const saved=E.validateSave(JSON.parse(JSON.stringify(s)),C);assert.deepEqual(E.validateSave(saved,C),saved);assert.deepEqual(saved.seen['5-A|5-1'].recent,h.recent);
 assert.equal(Object.keys(s.seen).length,1,'shared key contains class and island, not team');
});
test('A tiny custom bank remains playable and does not mutate its questions',()=>{
 const bank=[options.bank[0]],before=JSON.stringify(bank);assert.equal(E.selectQuestions(bank,E.random(1)).length,6);assert.equal(JSON.stringify(bank),before);
});
test('Three lanes, swipe controls and single jump obey pause and arena restrictions',()=>{
 const r=new E.Run(options);r.move(-1);r.move(-1);assert.equal(r.lane,0);r.move(1);r.move(1);r.move(1);assert.equal(r.lane,2);assert(r.jump());assert(!r.jump());
 for(const [x,y,expected] of [[5,-70,'up'],[2,70,'down'],[80,3,'jump'],[-70,3,null],[5,7,null],[45,45,null]])assert.equal(E.swipe(x,y),expected);
 r.pause();assert(!r.move(-1));assert(!r.jump());r.pause(false);r.beginBoss();assert(r.setLane(0));assert(r.jump());
});
test('Coins and hazards remain interactive during questions; a jump still chooses by lane',()=>{
 const r=new E.Run(options);r.distance=1000;r.safeUntil=0;r.beginGate();r.lane=r.lanePos=r.gate.q.answer;r.objects=[{at:1003,lane:r.lane,type:'coin',done:false},{at:1010,lane:r.lane,type:'obstacle',width:36,done:false}];r.step(.1);assert.equal(r.coins,1);assert.equal(r.health,4);assert(r.gate);r.objects=[];r.gate.age=r.gate.duration-.05;r.jump();r.step(.1);assert.equal(r.correct,1);assert.equal(r.review.length,1);assert.equal(r.gate,null);
});
test('Each obstacle has a distinct shape, clusters leave a safe lane, speed rises smoothly',()=>{
 for(const mode of ['soft','hard']){const r=new E.Run({...options,mode});assert.deepEqual(new Set(r.objects.filter(o=>o.type==='obstacle').map(o=>o.shape)),new Set(E.obstacleShapes));const groups={};for(const o of r.objects.filter(o=>o.type==='obstacle'))(groups[o.at]??=[]).push(o.lane);assert(Object.values(groups).every(l=>new Set(l).size<=2));const base=r.normalSpeed;r.distance=r.bossAt/2;assert(Math.abs(r.normalSpeed/base-1.175)<1e-9);r.distance=r.bossAt;assert(Math.abs(r.normalSpeed/base-1.35)<1e-9);r.beginGate();assert(Math.abs(r.targetSpeed-r.normalSpeed*.32*r.readSeconds/(r.readSeconds+1.6))<1e-9);}
});
test('Reading transitions ease speed changes instead of abruptly changing jump timing',()=>{
 const r=new E.Run(options);r.distance=4000;r.objects=[];r.travelSpeed=r.normalSpeed;const before=r.speed;r.beginGate();assert.equal(r.speed,before);r.step(.05);assert(r.speed<before&&r.speed>before*.9);advance(r,2);const slow=r.speed;r.gate.age=r.gate.duration-.01;r.step(.02);r.step(.05);assert(r.speed>slow&&r.speed<r.normalSpeed*.5);
});
test('Wide collision interval catches grounded hits once; jumping clears the full obstacle',()=>{
 const r=new E.Run(options);r.mechanicAt=Infinity;r.distance=800;r.safeUntil=0;r.objects=[{at:850,lane:1,type:'obstacle',width:36,done:false}];advance(r,.5);assert.equal(r.health,4);
 const j=new E.Run(options);j.mechanicAt=Infinity;j.distance=800;j.safeUntil=0;j.objects=[{at:910,lane:1,type:'obstacle',width:36,done:false}];j.jump();advance(j,.7);assert.equal(j.health,5);
});
test('Pause freezes course, gate, boss shots and boss counterattack',()=>{
 const r=new E.Run(options);r.beginGate();r.jump();advance(r,.5);r.pause();const before=JSON.stringify(r);advance(r,5);assert.equal(JSON.stringify(r),before);r.pause(false);r.step(.05);assert(r.distance>0);
 r.coins=15;r.beginBoss();advance(r,2);r.pause();const b=JSON.stringify(r);advance(r,5);assert.equal(JSON.stringify(r),b);r.pause(false);simulate(r);assert.equal(r.failureReason,'boss');
});
test('Boss threshold: enough coins wins, one short or zero loses; bonus score cannot buy damage',()=>{
 for(const mode of ['soft','hard'])for(let island=1;island<=10;island++)for(const delta of [-999,-1,0,15]){
 const r=new E.Run({...options,island,mode});r.coins=Math.max(0,r.requiredCoins+delta);r.score=99999;r.beginBoss();for(let t=0;t<40;t+=1/60){drive(r);r.step(1/60);}
 assert.equal(r.status,delta>=0?'completed':'ended');assert.equal(r.result().bossDefeated,delta>=0);assert.equal(r.result().coinsSpent,Math.min(r.coins,r.requiredCoins));assert.equal(r.coins,Math.max(0,r.requiredCoins+delta),'collected total is retained');assert.equal(r.result().stars,delta>=0?1:0);assert.equal(r.drain().filter(e=>e.type==='finish').length,1);
 if(delta<0){assert.equal(r.health,0);assert.equal(r.failureReason,'boss');}
 }
});
test('Boss appears before the finish; unfinished or knocked-out runs never unlock',()=>{
 const r=new E.Run(options);r.distance=r.bossAt;r.nextGate=6;r.objects=[];r.step(.05);assert.equal(r.phase,'boss');assert.equal(r.status,'running');const p={};E.record(p,'5-A|gryffindor',1,r.result());assert.deepEqual(p,{});advance(r,10);E.record(p,'5-A|gryffindor',1,r.result());assert.deepEqual(p,{});
 const f=new E.Run(options);f.mechanicAt=Infinity;f.health=1;f.distance=800;f.safeUntil=0;f.objects=[{at:805,lane:1,type:'obstacle',done:false}];f.step(.1);assert.equal(f.failureReason,'obstacles');
});
test('Version 1 migration preserves progress, teacher edits and deletions while adding new items once',()=>{
 const old={...E.fresh(),version:1};delete old.contentRevision;delete old.seen;
 old.overrides['5-1']=C.grades[5][0].bank.filter(q=>C.grades[5][0].legacyIds.includes(q.id)).slice(1).map(E.cleanQuestion);old.overrides['5-1'][0].prompt='Teacher’s updated prompt';old.progress['5-A|gryffindor']={1:{score:500,stars:2}};
 const next=E.validateSave(old,C);assert.equal(next.version,3);assert.equal(next.overrides['5-1'].length,115);assert(!next.overrides['5-1'].some(q=>q.id===options.bank[0].id));assert.equal(next.overrides['5-1'][0].prompt,'Teacher’s updated prompt');assert.deepEqual(next.progress,old.progress);assert.deepEqual(E.validateSave(next,C),next);
 next.overrides['5-1'].pop();assert.equal(E.validateSave(next,C).overrides['5-1'].length,114);
});
test('Backups preserve Turkish text and history and reject malformed question banks',()=>{
 const s=E.fresh();s.overrides['5-1']=options.bank.map(E.cleanQuestion);s.seen['5-A|5-1']={word:[options.bank[0].id]};const migrated=E.validateSave(JSON.parse(JSON.stringify(s)),C);assert.deepEqual(migrated.overrides,s.overrides);assert(migrated.seen['5-A|5-1'].word.includes(options.bank[0].id));assert.deepEqual(E.validateSave(migrated,C),migrated);
 assert.throws(()=>E.validateSave({schema:'wrong',version:2},C));for(const q of [{...options.bank[0],choices:['x','x','z']},{...options.bank[0],answer:7}]){s.overrides['5-1']=[q];assert.throws(()=>E.validateSave(s,C));}s.overrides['5-1']=[];assert.throws(()=>E.validateSave(s,C));
});
test('Class/team progress stays separate, unlocks sequentially and keeps best scores',()=>{
 const p={};assert(E.unlocked({},1));assert(!E.unlocked({},2));E.record(p,'5-A|gryffindor',1,{completed:true,score:800,stars:3});assert(E.unlocked(p['5-A|gryffindor'],2));assert(!E.unlocked(p['5-A|gryffindor'],3));assert(!E.unlocked(p['5-C|gryffindor']||{},2));assert(!E.unlocked(p['5-A|slytherin']||{},2));E.record(p,'5-A|gryffindor',1,{completed:true,score:100,stars:1});assert.deepEqual(p['5-A|gryffindor'][1],{score:800,stars:3});assert(!E.unlocked({9:{score:1,stars:1}},10));
});
test('All houses use identical gameplay rules; seeds reproduce the trail and questions',()=>{
 const a=new E.Run(options);for(const house of C.houses){const b=new E.Run({...options,house:house.id});assert.deepEqual(a.objects,b.objects);assert.deepEqual(a.questions,b.questions);assert.equal(a.requiredCoins,b.requiredCoins);assert.equal(a.speed,b.speed);}
});
test('Every percentage uses all finite route coins and rounds up, for 100 generated routes',()=>{
 for(const mode of ['soft','hard'])for(let island=1;island<=10;island++)for(let seed=0;seed<5;seed++){
  const r=new E.Run({...options,mode,island,seed}),coins=r.objects.filter(o=>o.type==='coin');
  assert.equal(r.totalCoins,coins.length);assert(coins.every(o=>o.at<r.bossAt));
  assert.equal(r.requiredPercent,(mode==='hard'?70:50)+2*(island-1));assert.equal(r.requiredCoins,Math.ceil(coins.length*r.requiredPercent/100));
 }
});
test('Recent vocabulary concepts are not recycled via translation or definition in the first six runs',()=>{
 for(const units of Object.values(C.grades))for(const u of units){const h={},families=new Set();
  for(let turn=0;turn<6;turn++)for(const q of E.selectQuestions(u.bank,E.random(turn),6,h)){
   if(q.kind==='word'){assert(!families.has(q.concept));families.add(q.concept);}
   if(q.kind==='question')assert(!q.id.endsWith('-meaning'));
   E.markSeen(h,u.bank,q);
  }assert.equal(families.size,12);
 }
});
test('Correct answer lanes are balanced each run and avoid an immediate boundary-lane repeat',()=>{
 const h={};for(let seed=0;seed<100;seed++){const qs=E.selectQuestions(options.bank,E.random(seed),6,h);
  if(h.lastLane!==undefined)assert.notEqual(qs[0].answer,h.lastLane);
  for(let i=0;i<3;i++)assert.equal(qs.filter(q=>q.answer===i).length,2);
  for(const q of qs)E.markSeen(h,options.bank,q);
 }
});
test('Distance-based jumps clear hazards through slowing, slow and accelerating reading sections at 60 and 20 FPS',()=>{
 for(const mode of ['soft','hard'])for(const fps of [60,20])for(const phase of ['normal','slow','slowing','accelerating'])for(const offset of [70,110,150,190]){
  const r=new E.Run({...options,mode});r.mechanicAt=Infinity;r.distance=3000;r.safeUntil=0;r.travelSpeed=r.normalSpeed;
  if(phase!=='normal')r.beginGate();if(['slow','accelerating'].includes(phase))r.travelSpeed=r.normalSpeed*.32;
  if(phase==='accelerating')r.gate.age=r.gate.duration-.1;
  r.objects=[{at:r.distance+offset,lane:1,type:'obstacle',width:36,done:false}];r.jump();
  let old=r.runnerDistance,maxHeight=0,maxForward=0;
  for(let t=0;t<6;t+=1/fps){r.step(1/fps);assert(r.runnerDistance>=old-1e-7);old=r.runnerDistance;maxHeight=Math.max(maxHeight,r.jumpHeight);maxForward=Math.max(maxForward,r.jumpForward);}
  assert.equal(r.health,r.maxHealth,JSON.stringify({mode,fps,phase,offset}));assert(maxHeight>.99);assert(maxForward>55);
 }
});
test('Forward jump collects at the actual runner position, once, before the camera reaches the coin',()=>{
 const r=new E.Run(options);r.distance=1000;r.objects=[{at:1060,lane:1,type:'coin',done:false}];r.beginGate();r.travelSpeed=r.normalSpeed*.32;r.jump();
 while(r.runnerDistance<1060)r.step(1/60);assert(r.distance<1060);assert.equal(r.coins,1);advance(r,5);assert.equal(r.coins,1);
});
test('Version 2 migration preserves teacher changes and deletions, updates untouched definitions and adds new items once',()=>{
 const u=C.grades[5][0],old={...E.fresh(),version:2,contentRevision:2};old.overrides['5-1']=u.revision2Bank.slice(1).map(E.cleanQuestion);old.overrides['5-1'][0].prompt='Teacher custom wording';
 const definition=u.revision2Bank.find(q=>q.id.endsWith('-meaning'));old.seen['5-A|5-1']={question:[definition.id]};
 const next=E.validateSave(old,C);assert.equal(next.overrides['5-1'].length,115);assert.equal(next.overrides['5-1'][0].prompt,'Teacher custom wording');assert(!next.overrides['5-1'].some(q=>q.id===u.revision2Bank[0].id));assert.equal(next.overrides['5-1'].find(q=>q.id===definition.id).kind,'word');assert(next.seen['5-A|5-1'].word.includes(definition.id));assert.deepEqual(E.validateSave(next,C),next);
 const edited=JSON.parse(JSON.stringify(old));edited.overrides['5-1'].find(q=>q.id===definition.id).prompt='A teacher-authored definition';assert.equal(E.validateSave(edited,C).overrides['5-1'].find(q=>q.id===definition.id).kind,'question');
});
let simulated=0,minTime=Infinity,maxTime=0,minCoins=Infinity,maxCoins=0,failures=[];
test('240 full runs: every grade/island/mode/reading pace can complete all six questions and the boss',()=>{
 for(const [g,units] of Object.entries(C.grades))for(const u of units)for(const mode of ['soft','hard'])for(const readPace of ['quick','calm','extra']){
 const r=simulate(new E.Run({bank:u.bank,mode,island:u.id,readPace,seed:+g*100+u.id}),'collector');
 if(r.status!=='completed'||r.correct!==6)failures.push({g,island:u.id,mode,readPace,status:r.status,reason:r.failureReason,health:r.health,coins:r.coins,correct:r.correct,distance:r.distance});
 assert(r.length-600-r.bossAt<r.normalSpeed/60+1,'all six gates finish before the fixed boss boundary');
 minTime=Math.min(minTime,r.time);maxTime=Math.max(maxTime,r.time);minCoins=Math.min(minCoins,r.coins);maxCoins=Math.max(maxCoins,r.coins);simulated++;
 }assert.deepEqual(failures,[]);
});
console.log(JSON.stringify({checks,simulatedRuns:simulated,questionVariants:4640,runSeconds:[Math.round(minTime),Math.round(maxTime)],collectedCoins:[minCoins,maxCoins]}));
module.exports={drive,simulate};
