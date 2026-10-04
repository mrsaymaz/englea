/* v9.5.0: Spirit Surge, Perfect Run, boss hit damage, bounded presentation layers and the sound palette. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.RunnerSpiritMotion=require('../public/island-runner/spirit-motion.js');
const E=require('../public/island-runner/engine.js'),S=require('../public/island-runner/scenery.js'),C=require('../public/island-runner/expand-content.js'),B=require('../public/island-runner/bosses.js'),I=require('../public/island-runner/islands.js');
const {drive,simulate}=require('./runner-driver.cjs');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const bank=C.grades[5][0].bank;

// Answer a gate exactly as a player would: move to a lane, then let the gate resolve.
function answer(r,correct){
 r.distance=r.gateAt[r.nextGate];r.feedback=0;r.mechanic=null;r.beginGate();
 const lane=correct?r.gate.q.answer:(r.gate.q.answer+1)%3;r.lane=lane;r.lanePos=lane;r.resolveGate();return r.drain();
}

test('Spirit Surge: every third correct answer in a row fills Elemental Focus; a miss resets the streak',()=>{
 const r=new E.Run({bank,island:1,seed:11});
 let events=answer(r,true);assert.equal(r.combo,1);assert(!events.some(e=>e.type==='surge'));
 events=answer(r,true);assert(events.some(e=>e.type==='streak'&&e.streak===2));
 r.focus=0;events=answer(r,true);
 const surge=events.find(e=>e.type==='surge');assert(surge&&surge.streak===3&&surge.focus===true);
 assert(r.focusTime>0&&r.focusShield,'Focus is active after a surge');assert.equal(r.metrics.surges,1);
 events=answer(r,false);assert.equal(r.combo,0);assert(!events.some(e=>e.type==='surge'||e.type==='streak'));
 const row=r.review.at(-1);assert.equal(row.streak,0);assert.equal(r.review[2].streak,3);
});

test('A surge never mints coins or changes the coin target, and an active Focus is not reset by a surge',()=>{
 const r=new E.Run({bank,island:2,seed:5}),target=r.requiredCoins,total=r.totalCoins,coins=r.coins;
 answer(r,true);answer(r,true);r.focusTime=3;r.focusShield=false;const events=answer(r,true);
 const surge=events.find(e=>e.type==='surge');assert(surge&&surge.focus===false,'Focus already running: no second activation');
 assert.equal(r.focusTime,3);assert.equal(r.requiredCoins,target);assert.equal(r.totalCoins,total);assert.equal(r.coins,coins);
});

test('Perfect Run: six of six adds 300 points once; coins, stars and the result shape stay compatible',()=>{
 for(const seed of [3,9,21]){
  const perfect=new E.Run({bank,island:1,seed});simulate(perfect);
  assert.equal(perfect.status,'completed');const res=perfect.result();
  assert.equal(res.correct,6);assert.equal(res.perfect,true);assert.equal(res.stars,3);assert(res.bestStreak>=6);
  const missed=new E.Run({bank,island:1,seed});missed.botMiss=[2];simulate(missed);const res2=missed.result();
  assert.equal(missed.status,'completed');assert.equal(res2.perfect,false);assert.equal(res2.correct,5);assert.equal(res2.stars,3);
  // The bonus is score only: the engine records the same passport fields as before.
  const progress={};E.record(progress,'5-A|gryffindor',1,res);assert.deepEqual(Object.keys(progress['5-A|gryffindor'][1]).sort(),['coinPercent','score','stars']);
 }
 const failed=new E.Run({bank,island:1,seed:4});failed.coins=0;failed.beginBoss();simulate(failed);assert.equal(failed.status,'ended');assert.equal(failed.result().perfect,false);
});

test('Guardian hits report their damage, and the damage adds up to the guardian’s guard',()=>{
 const r=new E.Run({bank,island:3,seed:8});r.coins=r.requiredCoins+5;r.beginBoss();let dealt=0,final=0;
 for(let t=0;t<60&&r.status==='running';t+=1/60){drive(r);r.step(1/60);for(const e of r.drain())if(e.type==='bossHit'){assert(Number.isInteger(e.damage)&&e.damage>0);dealt+=e.damage;if(e.final)final++;}}
 assert.equal(r.status,'completed');assert(dealt>=r.boss.maxHP);assert.equal(final,1);
});

// A permissive stub canvas: records nothing, accepts everything.
function stubCanvas(){const gradient={addColorStop(){}};const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>gradient;if(k==='measureText')return ()=>({width:40});return ()=>{};},set(t,k,v){t[k]=v;return true;}});return {width:1,height:1,getContext:()=>ctx};}
const image={complete:true,naturalWidth:200,naturalHeight:200};

test('Floating numbers, rings and ambience stay bounded, expire, and never change gameplay state',()=>{
 for(const realm of Object.keys(S.palettes)){
  const R=new S.Renderer(stubCanvas()),r=new E.Run({bank,island:1,seed:2});R.resize(1200,460,1);R.setup(C.houses[0],image,realm,false,image,B.get(1));
  assert(R.ambient.length>0&&R.ambient.length<=14,'sparse ambience for '+realm);
  R.render(r,1/60);for(let i=0;i<40;i++){R.floatAtRunner('+100','#fff');R.ringAtRunner('#fff');}
  assert(R.floats.length<=8);assert(R.rings.length<=6);
  r.combo=4;const before=JSON.stringify({d:r.distance,c:r.coins,s:r.score,h:r.health,l:r.lane});
  for(let i=0;i<120;i++)R.render(r,1/60);
  assert.equal(JSON.stringify({d:r.distance,c:r.coins,s:r.score,h:r.health,l:r.lane}),before);
  assert.equal(R.floats.length,0,'floats expire');assert.equal(R.rings.length,0,'rings expire');
 }
});

test('Reduced motion keeps cues readable but drops rings, rises and ambience',()=>{
 const R=new S.Renderer(stubCanvas()),r=new E.Run({bank,island:1,seed:2});R.resize(1200,460,1);R.setup(C.houses[0],image,'forest',true,image,B.get(1));
 R.render(r,1/60);R.ringAtRunner('#fff');assert.equal(R.rings.length,0);
 R.floatAtRunner('+100','#fff');assert.equal(R.floats.length,1,'the number itself is still shown');
 let ambience=0;const draw=R.drawAmbience;R.drawAmbience=function(...a){ambience++;return draw.apply(this,a);};R.render(r,1/60);assert.equal(ambience,1);
});

test('Sound palette: every cue the app plays exists, and each cue stops and disconnects its nodes',()=>{
 require('../public/island-runner/runner-fx.js');const FX=globalThis.RunnerFX;
 const app=fs.readFileSync(path.join(__dirname,'../public/island-runner/app.js'),'utf8');
 const used=new Set([...app.matchAll(/sound\('([a-zA-Z]+)'/g)].map(m=>m[1]));
 for(const cue of used)assert(FX.cues.includes(cue),'missing cue '+cue);
 let started=0,stopped=0,disconnected=0,connected=0;
 const node=()=>({connect(){connected++;},disconnect(){disconnected++;},start(){started++;},stop(){stopped++;},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},set onended(f){this._end=f;}});
 const made=[];const ctx={currentTime:0,sampleRate:8000,destination:{},createOscillator(){const n=node();made.push(n);return n;},createGain(){const n=node();made.push(n);return n;},createBiquadFilter(){const n=node();n.frequency={setValueAtTime(){}};made.push(n);return n;},createBufferSource(){const n=node();made.push(n);return n;},createBuffer(c,l){return {sampleRate:8000,getChannelData:()=>new Float32Array(l)};}};
 for(const cue of FX.cues)assert.equal(FX.play(ctx,cue,{streak:7,final:true}),true);
 assert.equal(started,stopped,'every source is scheduled to stop');
 for(const n of made)n._end?.();assert(disconnected>=started,'finished sources disconnect');
 assert.equal(FX.play(ctx,'not-a-cue'),false);
});

test('Board and runner pages load the v9.5 presentation files on the current release tag',()=>{
 const board=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8'),runner=fs.readFileSync(path.join(__dirname,'../public/island-runner/index.html'),'utf8');
 const release=(board.match(/Island Run Edition · v(9\.\d+\.\d+)/)||[])[1];assert.equal(release,'9.5.0');
 for(const f of ['board-v95.css','board-fx.js','arena-v95.css','arena-fx.js','student-ui.js','game.js'])assert.match(board,new RegExp(f.replace('.','\\.')+'\\?v=9\\.5\\.0'),f);
 for(const f of ['visual-v95.css','runner-fx.js','app.js','engine.js','scenery.js'])assert.match(runner,new RegExp(f.replace('.','\\.')+'\\?v=9\\.5\\.0'),f);
 assert.match(runner,/id="runBanner"/);assert.match(runner,/id="streakHud"/);assert.match(runner,/id="bossHPTrail"/);assert.match(runner,/id="resultBadges"/);
});
console.log(JSON.stringify({checks}));
