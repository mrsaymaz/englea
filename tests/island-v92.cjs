const assert=require('node:assert/strict');
const V=require('../public/island-runner/visual-kit.js'),S=require('../public/island-runner/scenery.js'),M=require('../public/island-runner/spirit-motion.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js');
let checks=0;function test(name,fn){fn();console.log('PASS '+name);checks++;}
test('Ten distinct landmark silhouettes physically repair and retain every class/team restoration stage',()=>{
 assert.equal(new Set(V.landmarks.map(l=>l.base)).size,10);assert.equal(new Set(V.landmarks.map(l=>l.name)).size,10);
 for(let id=1;id<=10;id++){const dark=S.islandSVG('academy',id,{stage:0,teams:[]}),repaired=S.islandSVG('academy',id,{stage:1,teams:['gryffindor']}),complete=S.islandSVG('academy',id,{stage:4,teams:C.houses.map(h=>h.id)});assert(dark.includes(V.get(id).broken));assert(!dark.includes('landmark-light'));assert(repaired.includes(V.get(id).base));assert(repaired.includes('landmark-light'));assert(complete.includes(V.get(id).extra));assert(complete.length<6000);}
});
test('Adaptive decorations step down on sustained slow frames, recover cautiously and respect manual Light',()=>{
 const q=new V.Quality();for(let i=0;i<260;i++)q.sample(.05,30);assert.equal(q.tier,2);assert.equal(q.limits.particles,18);assert.equal(q.limits.strips,6);assert.equal(q.limits.pixels,1000000);
 for(let i=0;i<2400;i++)q.sample(1/60,2);assert.equal(q.tier,0);q.reset(true);for(let i=0;i<2400;i++)q.sample(1/60,2);assert.equal(q.tier,2);
 q.reset();for(let i=0;i<100;i++)q.sample(3,90);assert.equal(q.tier,0,'background stalls do not change quality');for(let i=0;i<130;i++)q.sample(.2,120);assert.equal(q.tier,2,'very weak hardware still steps down');
});
test('Gaits vary smoothly by house and jump orientation follows distance through reading slowdown',()=>{
 const base={time:2,phase:'course',paused:false,speed:80,normalSpeed:280,jumpAge:-1};
 for(const h of C.houses){const a=M.pose(h.id,base,false),b=M.pose(h.id,{...base,time:2+1/60},false);for(const k of ['angle','bob','sx','sy']){assert(Number.isFinite(a[k]));assert(Math.abs(b[k]-a[k])<.02);}const jump=M.pose(h.id,{...base,jumpAge:6,jumpProgress:.2},false),same=M.pose(h.id,{...base,jumpAge:16,jumpProgress:.2},false);assert.equal(jump.angle,same.angle);assert.deepEqual(M.pose(h.id,base,true),{bob:0,angle:0,sx:1,sy:1,wave:0,phase:0});}
});
test('Reading corridors retain all finite coins and single hazards, simplify clusters and ease long prompts',()=>{
 for(const long of [false,true]){const r=new E.Run({bank:C.grades[5][0].bank,seed:5});r.distance=3000;r.questions[0]={...r.questions[0],prompt:long?'A'.repeat(110):'apple'};
  r.objects=[{type:'obstacle',at:3100,lane:0},{type:'obstacle',at:3100,lane:1,cluster:true},{type:'obstacle',at:3650,lane:1},{type:'coin',at:3100,lane:2},{type:'coin',at:3650,lane:0}];const total=r.totalCoins,target=r.requiredCoins;r.beginGate();assert.equal(r.objects.filter(o=>o.type==='coin'&&!o.done).length,2);assert(!r.objects[0].done);assert(r.objects[1].readingSuppressed);assert.equal(Boolean(r.objects[2].done),long);assert.equal(r.totalCoins,total);assert.equal(r.requiredCoins,target);}
});
test('Hazard rhythm contains longer coin breathers while every cluster leaves a safe lane',()=>{
 const r=new E.Run({bank:C.grades[8][9].bank,mode:'hard',island:10,seed:12}),hazards=r.objects.filter(o=>o.type==='obstacle'),ats=[...new Set(hazards.map(o=>o.at))];assert(ats.some((v,i)=>i>0&&v-ats[i-1]>900));for(const at of ats)assert(new Set(hazards.filter(o=>o.at===at).map(o=>o.lane)).size<=2);
});
test('Magnet collection emits a visual trail but cannot mint extra coins or change the coin target',()=>{
 const r=new E.Run({bank:C.grades[5][0].bank,seed:12});r.objects=[{type:'coin',at:5,lane:0}];const total=r.totalCoins,target=r.requiredCoins;r.addFocus(100);r.step(.1);const coins=r.drain().filter(e=>e.type==='coin');assert.equal(coins.length,1);assert.equal(coins[0].magnet,true);assert.equal(r.coins,1);assert.equal(r.totalCoins,total);assert.equal(r.requiredCoins,target);
});
console.log(JSON.stringify({checks}));
