/* v9.3.0: review questions, second chances, Word Trail, Word Strike, formats, answer log, Apps Script and save capability. */
const assert=require('assert/strict'),fs=require('fs');
const E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js'),F=require('../public/island-runner/formats.js'),P=require('../public/island-runner/pictures.js');
const {simulate}=require('./runner-driver.cjs');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS',name);};
const unit=(g,i)=>C.grades[g][i-1],bankFor=(g,i)=>unit(g,i).bank;
// The answer log module runs in node with a small storage shim.
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};globalThis.document={dispatchEvent(){}};globalThis.CustomEvent=class{constructor(t,o){this.type=t;this.detail=o?.detail;}};
require('../public/question-log.js');const L=globalThis.LeagueQuestionLog;

test('Up to two review questions take slots 2 and 5, keep their concept and never duplicate a family',()=>{
 const bank=bankFor(5,4),missed=bank.filter(q=>q.kind==='gap').slice(0,2);
 for(let seed=1;seed<40;seed++){const r=new E.Run({bank,seed,review:missed});
  assert.equal(r.questions[1].review,true);assert.equal(r.questions[4].review,true);assert.equal(r.questions.filter(q=>q.review).length,2);
  assert.equal(new Set(r.questions.map(q=>q.family)).size,6);assert.equal(new Set(r.questions.map(q=>q.id)).size,6);
  r.questions.forEach(q=>assert(E.validateQuestion(q)));}
 assert.equal(new E.Run({bank,seed:3}).questions.some(q=>q.review),false);
});
test('Review lookup prefers a fresh variant of the missed concept, then the island where it was missed',()=>{
 const bank=bankFor(5,1),missed=bank.find(q=>q.kind==='word'&&q.concept);const family=E.familyOf(missed);
 const found=F.reviewQuestions([{concept:family,island:1,ids:[missed.id]}],{grade:5,island:3,bankFor});
 assert.equal(found.length,1);assert.equal(E.familyOf(found[0]),family);assert.notEqual(found[0].id,missed.id);
 assert.equal(F.reviewQuestions([{concept:'not-a-concept',island:2,ids:[]}],{grade:5,island:3,bankFor}).length,0);
});
test('A missed answer returns once before the boss, reshuffled, for half points; stars still count only the six',()=>{
 for(const seed of [5,11,17]){const r=new E.Run({bank:bankFor(6,2),seed,secondChance:true,island:2,readPace:'extra'});r.botMiss=[2];simulate(r);
  const echo=r.review.filter(x=>x.echo);assert.equal(echo.length,1);assert.equal(echo[0].index,2);assert.equal(r.correct,5);
  const original=r.review.find(x=>x.index===2&&!x.echo);assert.equal(original.correct,false);assert.equal(r.result().total,6);
  assert.equal(r.status,'completed');assert.equal(r.result().stars,3);assert.equal(r.echoCorrect,1);assert.equal(echo[0].points,50);}
 const clean=simulate(new E.Run({bank:bankFor(6,2),seed:5,secondChance:true}));assert.equal(clean.review.some(x=>x.echo),false);
});
test('Word Trail spells a vocabulary word after the course and moves the boss boundary back',()=>{
 const trail=F.trailWord(bankFor(5,4),E.random(4));assert(E.trailWordPattern.test(trail.word));assert(trail.clue);
 const r=new E.Run({bank:bankFor(5,4),seed:9,trail,island:4});assert(r.bossAt>r.courseEnd);
 assert(r.objects.filter(o=>o.type==='coin').every(o=>o.at<r.courseEnd));assert.equal(r.trail.steps.length,trail.word.length);
 r.trail.steps.forEach(s=>{assert.equal(s.letters[s.lane],s.letter);assert.equal(new Set(s.letters).size,3);});
 simulate(r);assert.equal(r.status,'completed');assert(r.trail.success);assert.equal(r.trail.mistakes,0);
 assert(r.length-600-r.bossAt<r.normalSpeed/60+1,'boss begins at the moved boundary');
});
test('Word Strike removes 15% of the guard; misses beyond the allowance give no strike',()=>{
 const trail={word:'library',clue:'kütüphane',concept:'5-1-library'};
 const r=new E.Run({bank:bankFor(5,1),seed:2,trail});r.coins=r.requiredCoins;r.trail.done=true;r.trail.success=true;r.beginBoss();
 const strike=Math.max(10,Math.round(r.boss.maxHP*.15/10)*10);assert.equal(r.boss.wordStrike,strike);assert(strike<r.boss.maxHP);
 for(let i=0;i<60;i++)r.step(1/60);assert.equal(r.boss.hp,r.boss.maxHP-strike);
 const soft=new E.Run({bank:bankFor(5,1),seed:2,trail});soft.botTrailMiss=[1];simulate(soft);assert.equal(soft.trail.success,true);assert.equal(soft.trail.mistakes,1);
 const soft2=new E.Run({bank:bankFor(5,1),seed:2,trail});soft2.botTrailMiss=[1,3];simulate(soft2);assert.equal(soft2.trail.success,false);assert.equal(soft2.boss.wordStrike,0);
 const hard=new E.Run({bank:bankFor(5,1),seed:2,trail,mode:'hard'});hard.botTrailMiss=[0];simulate(hard);assert.equal(hard.trail.success,false);
});
test('160 full v9.3 runs (every grade/island, both modes, with formats, review, second chance and Word Trail) complete',()=>{
 const failures=[];let n=0;
 for(const [g,units] of Object.entries(C.grades))for(const u of units)for(const mode of ['soft','hard'])for(const readPace of ['quick','extra']){
  const seed=+g*1000+u.id*10+readPace.length,rng=E.random(seed),review=F.reviewQuestions([{concept:E.familyOf(u.bank.find(q=>q.kind==='gap')),island:u.id,ids:[]}],{grade:+g,island:u.id,bankFor:(gg,i)=>C.grades[gg][i-1].bank});
  const r=new E.Run({bank:u.bank,mode,island:u.id,readPace,seed,review,secondChance:true,trail:F.trailWord(u.bank,rng)});
  r.questions=F.applyFormats(r.questions,{bank:u.bank,rng,listening:true,pictures:true});r.botMiss=[0];simulate(r);n++;
  if(r.status!=='completed'||!r.trail.success||r.review.filter(x=>x.echo).length!==1)failures.push({g,island:u.id,mode,readPace,status:r.status,reason:r.failureReason});
 }
 assert.deepEqual(failures,[]);assert.equal(n,160);
});
test('Listening and picture gates are valid, keep the original answer lane and never offer lookalike pictures',()=>{
 for(const [g,units] of Object.entries(C.grades))for(const u of units)for(let seed=1;seed<6;seed++){
  const r=new E.Run({bank:u.bank,seed}),out=F.applyFormats(r.questions,{bank:u.bank,rng:E.random(seed),listening:true,pictures:true});
  out.forEach((q,i)=>{assert(E.validateQuestion(q));assert.equal(q.answer,r.questions[i].answer);});
  const pic=out.find(q=>q.format==='picture');if(pic){assert(P.has(pic.picture));pic.choices.filter((_,i)=>i!==pic.answer).forEach(c=>assert(!P.similar(c,pic.picture)));}
  const listen=out.find(q=>q.format==='listen');assert(listen&&listen.speak&&listen.choices[listen.answer]===listen.explanation.split(' = ')[1]);
 }
 const off=F.applyFormats(new E.Run({bank:bankFor(5,1),seed:1}).questions,{bank:bankFor(5,1),rng:E.random(1)});assert(!off.some(q=>q.format));
 const n=new F.Navigators(['A','B','C','D'],E.random(7)),seen=[];for(let i=0;i<8;i++)seen.push(n.next());
 assert.equal(new Set(seen.slice(0,4)).size,4);assert.equal(new Set(seen.slice(4)).size,4);assert.equal(new F.Navigators([],Math.random).next(),'');
});
const row=(id,k,ok,extra={})=>({id,t:1.75e12+Number(id.replace(/\D/g,''))*1000,s:'lesson-1',c:'5-A',h:'gryffindor',g:5,i:2,q:'q-'+k,k,y:'gap',f:'text',ok,p:'x',a:'y',x:'Prompt '+k,...extra});
test('Answer log: review starts on a miss and ends after correct answers in two later runs; echoes and spelling are ignored',()=>{
 L.merge('5-A',[row('run1:0','be',false),row('run1:1','tag',true)]);assert.deepEqual(L.review('5-A',5).map(e=>e.concept),['be']);
 L.merge('5-A',[row('run2:0','be',true),row('run2:5','be',true)]);assert.equal(L.review('5-A',5).length,1,'two correct answers in one run are one run');
 L.merge('5-A',[row('run3:0','be',true,{e:true})]);assert.equal(L.review('5-A',5).length,1,'second chances do not clear review');
 L.merge('5-A',[row('run4:0','be',true)]);assert.equal(L.review('5-A',5).length,0);
 L.merge('5-A',[row('run5:9','spell:tent',false,{y:'spell',f:'spell'}),row('run5:8','tag',false,{e:true})]);assert.equal(L.review('5-A',5).length,0);
 const before=L.stamp('5-A');assert.equal(L.merge('5-A',[row('run1:0','be',false)]),0);assert.equal(L.stamp('5-A'),before);
 assert.equal(L.merge('5-A',[{...row('bad:1','be',false),c:'6-C'},{...row('bad:2','be',false),h:'nobody'},{...row('bad:3','be',false),x:'y'.repeat(200)}]),0);
 L.merge('5-A',[row('run6:0','tag',false)]);assert.equal(L.review('5-A',5).length,1);L.clearReview('5-A');assert.equal(L.review('5-A',5).length,0);
 assert.equal(L.rows('5-A',{sessionId:'lesson-1'}).length,L.rows('5-A').length);
});
test('Apps Script v9.3.0 appends answers once, rebuilds the summary and returns them on Load islands',()=>{
 const {makeGas}=require('./roster-gas-harness.cjs'),gas=makeGas();
 const rows=[row('runA:0','be',false),row('runA:1','tag',true,{x:'=HYPERLINK("x")'})];
 const save=()=>gas.post({type:'FULL_SESSION',pin:'2595',className:'5-A',sessionId:'lesson-1',standings:[],islandProgress:{},questionLog:rows});
 let r=save();assert.equal(r.status,'success',JSON.stringify(r));assert.equal(r.questionsAdded,2);assert.equal(r.questionLogVersion,1);
 r=save();assert.equal(r.questionsAdded,0);
 const log=gas.sheets.get('Question_Log');assert.equal(log.getLastRow(),3);assert.equal(log.rows[2][15],"'=HYPERLINK(\"x\")");
 const summary=gas.sheets.get('Question_Summary');assert.equal(summary.rows[0][0],'Class');assert(summary.rows.some(x=>x[1]==='be'&&x[8]==='Yes'));
 const get=gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'});assert.equal(get.questionLogVersion,1);assert.equal(get.questionLog.length,2);assert.equal(get.questionLog[1].x,'=HYPERLINK("x")');
 const bad=gas.post({type:'FULL_SESSION',pin:'2595',className:'5-A',sessionId:'lesson-2',standings:[],questionLog:[{...rows[0],id:'runB:0',c:'6-C'}]});
 assert.equal(bad.status,'error');assert.equal(gas.sheets.get('Leaderboard').rows.filter(x=>x[12]==='lesson-2').length,0,'nothing is written when a row is invalid');
});
(async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');
 const call=async(capability,body)=>{const fetcher=async(url,o)=>{const d=JSON.parse(o.body);return {ok:true,json:async()=>d.type==='ISLAND_GET'?capability:{status:'success',islandProgress:{}}};};
  return (await handleSession(new Request('https://x.invalid/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),fetcher)).json();};
 const body={type:'FULL_SESSION',pin:'1',className:'5-A',islandProgress:{},questionLog:[row('runZ:0','be',false)]};
 let r=await call({status:'success',islandProgress:{},passportVersion:1},body);assert.equal(r.status,'error');assert.match(r.message,/GOOGLE-APPS-SCRIPT-v9\.\d\.0\.gs/); // the current script includes the v9.3.0 answer log
 r=await call({status:'success',islandProgress:{},passportVersion:1,questionLogVersion:1},body);assert.equal(r.status,'success');
 checks++;console.log('PASS Netlify session function refuses to drop answers when the Sheet still runs an older Apps Script');
 console.log(JSON.stringify({checks}));
})().catch(e=>{console.error(e);process.exit(1);});
