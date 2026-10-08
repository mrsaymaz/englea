/* v11.0.0 dependency-free checks: the Vixar Saga.
   - Saga rules (vixar-saga.js): stages and level caps; a win advances the stage once (a re-save or a repeated report
     changes nothing); a loss keeps the stage and counts an attempt; Set stage corrections; merging rows from Google
     Sheets (the furthest stage is kept; a newer correction wins); the readiness line; the Finale's names come only
     from contributions, navigators and correct Merge answers; the speech lines per grade.
   - The Merge Spell engine: the fixed turn order, the partner rescue after a wrong answer, houses that have given
     their two answers are passed over, the second casting, a partial merge, the suggested student.
   - Apps Script v11.0.0: the Vixar_Saga tab (no double advance on re-save, corrections logged, day-first dates), Merge
     answers in Challenge_Log (marked Merge, no duplicates), what the Finale needs, the speech lines; the Netlify
     function keeps saga data on the phone while the Sheet runs an older script.
   - New art falls back to the Level 10 pictures when a Level 11 or 12 sheet or avatar fails to load.
   - Wiring: the per-class level cap where Level 10 was written in, the Rift gating, the scripts and the build.
   Browser checks: board-v11.cjs. Balance: saga-balance.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeGas}=require('./roster-gas-harness.cjs');
const same=(a,b,m)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),m);
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
function saga(){const store=new Map(),c={console,JSON,Date,Math,Number,String,Array,Object,Set,Map,
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};
 c.globalThis=c;vm.createContext(c);vm.runInContext(pub('vixar-saga.js'),c);return {S:c.LeagueSaga,store,c};}
const M=require('../public/merge-spell.js');
const T0=Date.UTC(2026,10,14,6,42,10);
(async()=>{
await test('Stages and caps: Violet 10, Scarlet 11, Gilded 12, Freed 12; three acts with rising HP, seals, length and pace',()=>{
 const {S}=saga();same([...S.STAGES],['Violet','Scarlet','Gilded','Freed']);
 same(S.STAGES.map(S.cap),[10,11,12,12]);assert.equal(S.cap('unknown'),10);
 const [a,b,c]=['Violet','Scarlet','Gilded'].map(S.act);
 same([a.bossHP,b.bossHP,c.bossHP],[4200,5600,7000]);same([a.sealHP,b.sealHP,c.sealHP],[240,300,360]);
 same([a.duration,b.duration],[85000,95000]);assert(b.pace<a.pace&&Math.abs(b.pace-.9)<.001,'Scarlet acts about 10% faster');
 same([a.level,b.level,c.level],[10,11,12]);assert.equal(S.act('Freed'),null);
 assert.equal(a.winTitle,'The Violet Form Is Broken');assert.equal(b.winTitle,'The Scarlet Form Is Broken');assert.equal(a.lossTitle,'The Empty Crown Endures');assert.equal(c.lossTitle,'The Gilded Crown Endures');
 assert.equal(c.merge,true);assert.equal(b.brand,true);assert.equal(a.escape&&b.escape,true);assert.equal(c.escape,false);
 same(['Violet','Scarlet','Gilded'].map(s=>S.act(s).phases[0]),['Cosmic Dominion','Crimson Dominion','Gilded Dominion']);
 same([10,11,12].map(S.tierName),['Legendary','Mythic','Celestial']);
});
await test('A win advances the stage once (repeated reports change nothing); a loss keeps the stage and counts an attempt',()=>{
 const {S}=saga();
 let r=S.recordFight('5-A',{sessionId:'s1',won:false,at:T0});assert.equal(r.ok,true);assert.equal(r.row.stage,'Violet');assert.equal(r.row.attempts,1);
 r=S.recordFight('5-A',{sessionId:'s2',won:true,stage:'Violet',at:T0+1});assert.equal(r.advanced,true);assert.equal(r.row.stage,'Scarlet');assert.equal(r.row.attempts,0,'attempts reset when the stage advances');
 assert.equal(r.row.won.Violet,T0+1);same([...r.row.fightSessions],['s1','s2']);assert.equal(r.row.lastSessionId,'s2');
 r=S.recordFight('5-A',{sessionId:'s2',won:true,stage:'Violet',at:T0+2});assert.equal(r.ok,false,'the same win reported again');assert.equal(S.stageOf('5-A'),'Scarlet');
 r=S.recordFight('5-A',{sessionId:'bad id',won:true});assert.equal(r.ok,false);
 assert.equal(S.recordFight('9-Z',{sessionId:'s3',won:true}).ok,false);
 for(const id of ['s3','s4'])S.recordFight('5-A',{sessionId:id,won:true,at:T0+3});assert.equal(S.stageOf('5-A'),'Freed');
 assert.equal(S.recordFight('5-A',{sessionId:'s5',won:true}).ok,false,'a Freed class has no fight');assert.equal(S.stageOf('6-C'),'Violet','each class has its own saga');
});
await test('Set stage (a teacher correction) moves a class anywhere, clears the wins it undoes and is logged',()=>{
 const {S}=saga();S.recordFight('7-A',{sessionId:'a',won:true,at:T0});S.recordFight('7-A',{sessionId:'b',won:true,at:T0+5});
 const r=S.setStage('7-A','Scarlet',{note:'Set to Scarlet by teacher',at:T0+10});assert.equal(r.ok,true);
 assert.equal(r.row.stage,'Scarlet');assert.equal(r.row.won.Violet,T0);assert.equal(r.row.won.Scarlet,0);assert.equal(r.row.correctedAt,T0+10);
 same(JSON.parse(JSON.stringify(r.row.corrections)),[{at:T0+10,from:'Gilded',to:'Scarlet',note:'Set to Scarlet by teacher'}]);
 assert.equal(S.setStage('7-A','Purple').ok,false);
});
await test('Rows from Google Sheets: the furthest stage is kept; a newer correction wins; a later win beats an older correction',()=>{
 const {S}=saga();S.recordFight('5-C',{sessionId:'x',won:true,at:T0});
 assert.equal(S.accept('5-C',{stage:'Violet',attempts:4,updatedAt:T0+100}),false,'an older stage never takes an earned stage back');assert.equal(S.stageOf('5-C'),'Scarlet');
 assert.equal(S.accept('5-C',{stage:'Gilded',won:{Violet:T0-50,Scarlet:T0+20},fightSessions:['y'],updatedAt:T0+30}),true);
 let row=S.get('5-C');assert.equal(row.stage,'Gilded');assert.equal(row.won.Violet,T0-50,'the earliest date');same([...row.fightSessions].sort(),['x','y']);
 assert.equal(S.accept('5-C',{stage:'Violet',correctedAt:T0+500,updatedAt:T0+500,corrections:[{at:T0+500,from:'Gilded',to:'Violet',note:'test run'}]}),true);assert.equal(S.stageOf('5-C'),'Violet','a newer correction wins');
 S.recordFight('5-C',{sessionId:'z',won:true,at:T0+900});
 assert.equal(S.accept('5-C',{stage:'Violet',correctedAt:T0+500,updatedAt:T0+500}),false);assert.equal(S.stageOf('5-C'),'Scarlet','a win after the correction counts');
 assert.equal(S.accept('5-C',{stage:'Violet',correctedAt:T0+700,updatedAt:T0+700}),false,'a correction older than the win does not undo it');
 assert.equal(S.accept('5-C',S.get('5-C')),false,'the same row changes nothing');
});
await test('Readiness line: how many teams have reached the act level, and the Class Mission',()=>{
 const {S}=saga();
 same(JSON.parse(JSON.stringify(S.readiness('Scarlet',{gryffindor:11,slytherin:11,hufflepuff:10,ravenclaw:11},false))),{level:11,ready:3,total:4,mission:false,complete:false});
 assert.equal(S.readiness('Gilded',{gryffindor:12,slytherin:12,hufflepuff:12,ravenclaw:12},true).complete,true);
 assert.equal(S.readiness('Freed',{},true).level,null);
});
await test('Finale names: up to three per house, only for what they gave (contributions, navigation, correct Merge answers)',()=>{
 const {S}=saga();
 const names=S.finaleNames({
  contributions:[{team:'gryffindor',name:'Ada',contributions:5},{team:'gryffindor',name:'Ada',contributions:2},{team:'gryffindor',name:'Bo',contributions:3},{team:'gryffindor',name:'Cy',contributions:1},{team:'gryffindor',name:'Di',contributions:1},{team:'gryffindor',name:'Zero',contributions:0}],
  navigators:[{team:'slytherin',student:'Nav'}],
  merge:[{team:'hufflepuff',student:'Right',result:'right'},{team:'hufflepuff',student:'Missed',result:'wrong'},{team:'gryffindor',student:'Di',result:'right'}]});
 same(names.gryffindor.map(p=>p.name),['Ada','Di','Bo'],'contributions add up; a Merge answer counts; three at most');
 same(names.gryffindor[0].gave,['7 contributions']);same(names.gryffindor[1].gave,['1 contribution','Merge Spell']);
 same(names.slytherin.map(p=>[p.name,p.gave.join()]),[['Nav','Island Run navigator']]);
 same(names.hufflepuff.map(p=>p.name),['Right'],'a missed answer never names anyone');same(names.ravenclaw,[]);
 assert(!JSON.stringify(names).includes('Missed')&&!JSON.stringify(names).includes('Zero'));
});
await test('Thank-you lines: graded defaults for 5–8, editable (newest copy wins), at most ten lines',()=>{
 const {S}=saga();assert.equal(S.lines(5)[0],'Thank you!');assert(S.lines(5).includes('You are my heroes.'));
 assert.match(S.lines(6).join(' '),/prisoner in that armour, but you never stopped/);assert.match(S.lines(7).join(' '),/couldn’t speak/);assert.match(S.lines(8).join(' '),/trapped since September/);
 assert.equal(S.acceptLines(5,['Hello class!','  You did it.  '],T0),true);same([...S.lines(5)],['Hello class!','You did it.']);
 assert.equal(S.acceptLines(5,['Older'],T0-1),false);assert.equal(S.acceptLines(9,['x'],T0),false);assert.equal(S.cleanLines(Array(14).fill('a')).length,10);
});
await test('Merge Spell: turn order G, H, S, R; a wrong answer passes to the partner; a missed rescue goes back to the order',()=>{
 const s=M.create({now:0});assert.equal(M.start(s),'gryffindor');
 let r=M.answer(s,false,{at:1});assert.equal(r.rescueBy,'slytherin');assert.equal(s.turn.house,'slytherin');assert.equal(s.turn.rescue,true);
 r=M.answer(s,false,{at:2});assert.equal(s.turn.house,'hufflepuff','a missed rescue goes back to the fixed order');assert.equal(M.meter(s,'slyffindor'),0);
 r=M.answer(s,true,{at:3});assert.equal(s.turn.house,'slytherin');assert.equal(M.meter(s,'huffleclaw'),1);
 M.answer(s,true);assert.equal(s.turn.house,'ravenclaw');M.answer(s,true);assert.equal(s.turn.house,'gryffindor');
 M.answer(s,true);M.answer(s,true);assert.equal(s.pairs.huffleclaw.correct.hufflepuff,2);
 // Hufflepuff has given its two answers: it is passed over.
 assert.equal(s.turn.house,'slytherin');M.answer(s,true);assert.equal(s.turn.house,'ravenclaw');
 r=M.answer(s,true);assert.equal(r.fused,'huffleclaw');assert.equal(s.pairs.huffleclaw.merged,true);assert.equal(s.turn.house,'gryffindor','a fused pair stops taking turns');
 r=M.answer(s,true);assert.equal(r.fused,'slyffindor');assert.equal(r.done,true);assert.equal(s.success,true);
 same(JSON.parse(JSON.stringify(M.result(s))),{merged:['slyffindor','huffleclaw'],unmerged:[]});
});
await test('Merge Spell: the circle empties → one 60-second second casting for the unfused pair (a fused pair stays fused), then the spell ends',()=>{
 const s=M.create({now:0});M.start(s);
 // Slyffindor fuses; Huffleclaw keeps missing.
 for(let i=0;i<40&&!s.pairs.slyffindor.merged;i++){const h=s.turn.house;M.answer(s,h==='gryffindor'||h==='slytherin');}
 assert.equal(s.pairs.slyffindor.merged,true);assert.equal(s.done,false);assert.notEqual(['gryffindor','slytherin'].includes(s.turn.house),true);
 let r=M.expire(s,120000);assert.equal(r.second,true);assert.equal(s.casting,2);assert.equal(s.endsAt,180000);assert.equal(M.remaining(s,150000),30000);assert.equal(s.pairs.slyffindor.merged,true);
 assert(['hufflepuff','ravenclaw'].includes(s.turn.house));
 M.shift(s,5000);assert.equal(s.endsAt,185000,'a paused scene moves the end of the circle');
 r=M.expire(s,185000);assert.equal(r.done,true);assert.equal(r.success,false);
 same(JSON.parse(JSON.stringify(M.result(s))),{merged:['slyffindor'],unmerged:['huffleclaw']},'a partial merge');
 const t=M.create({now:0});M.start(t);M.expire(t,1);M.expire(t,2);same(JSON.parse(JSON.stringify(M.result(t))),{merged:[],unmerged:['slyffindor','huffleclaw']});
});
await test('Merge Spell: the suggested student has the fewest contributions; each answers at most once while the house has others left',()=>{
 const s=M.create();const house=[{id:'a',name:'A',awards:0},{id:'b',name:'B',awards:1},{id:'c',name:'C',awards:4}];
 assert.equal(M.suggest(s,house).id,'a');s.answered.push('a');assert.equal(M.suggest(s,house).id,'b');
 same(M.choices(s,house).map(p=>p.id),['b','c']);s.answered.push('b','c');assert.equal(M.suggest(s,house).id,'a','everyone has answered: anyone may answer again');
 M.start(s);M.answer(s,true,{studentId:'z'});assert(s.answered.includes('z'));assert.equal(s.log[0].ok,true);assert.equal(s.log[0].house,'gryffindor');
});
await test('Apps Script v11.0.0: Vixar_Saga row per class, no double advance on re-save, Merge answers in Challenge_Log once',()=>{
 const gas=makeGas(),now=Date.now();
 const row={stage:'Scarlet',attempts:0,won:{Violet:now-5000},lastSessionId:'lesson-a',fightSessions:['lesson-a'],updatedAt:now-5000};
 const merge=[{id:'lesson-a-m1',at:now-6000,className:'5-A',team:'Gryffindor',studentId:'5-A:gryffindor:0',student:'Elif Naz',level:12,type:'Merge · Grammar',merge:true,word:'meet · answered: meets',island:2,result:'right'},
  {id:'lesson-a-m2',at:now-5900,className:'5-A',team:'Slytherin',student:'',level:12,type:'Merge · Vocabulary',word:'answered: x',island:2,result:'wrong'}];
 let r=gas.post({type:'SAGA_SAVE',pin:'2595',className:'5-A',sessionId:'lesson-a',saga:row,mergeLog:merge});
 assert.equal(r.status,'success',r.message);assert.equal(r.saga.stage,'Scarlet');assert.equal(r.challengesAdded,2);
 const sheet=gas.ss.getSheetByName('Vixar_Saga');same(sheet.rows[0],['Class','Stage','Level cap','Attempts at current form','Violet won','Scarlet won','Gilded won','Last session ID','Corrections','Corrected at','Fight sessions','Updated']);
 assert.equal(sheet.rows[1][0],'5-A');assert.equal(sheet.rows[1][2],11);assert(sheet.rows[1][4] instanceof gas.SheetDate);assert.equal(sheet.formats.get('2:5'),'dd/mm/yyyy hh:mm:ss');
 r=gas.post({type:'SAGA_SAVE',pin:'2595',className:'5-A',sessionId:'lesson-a',saga:row,mergeLog:merge});
 assert.equal(r.saga.stage,'Scarlet','a re-save does not advance again');assert.equal(r.challengesAdded,0,'no duplicate Merge rows');assert.equal(sheet.getLastRow(),2,'one row per class');
 r=gas.post({type:'SAGA_SAVE',pin:'2595',className:'5-A',saga:{stage:'Violet',attempts:3,updatedAt:now}});assert.equal(r.saga.stage,'Scarlet','a save never takes an earned stage back');
 const log=gas.ss.getSheetByName('Challenge_Log');assert.equal(log.rows[1][6],'Merge · Grammar');assert.equal(log.rows[1][5],12);assert.equal(log.rows[1][9],'Right');
 // The same Merge rows inside a session record are not written twice either.
 r=gas.post({type:'LEADERBOARD_FINAL',pin:'2595',className:'5-A',sessionId:'lesson-a',standings:[],challengeLog:merge});assert.equal(r.status,'success');assert.equal(r.sagaVersion,1);assert.equal(r.challengesAdded,0);
 for(const bad of [{...merge[0],id:'x-m9',level:5},{...merge[0],id:'x-m9',team:'Practice'},{...merge[0],id:'x-m9',type:'Merge · Taboo Description'}]){r=gas.post({type:'SAGA_SAVE',pin:'2595',className:'5-A',saga:row,mergeLog:[bad]});assert.equal(r.status,'error');}
});
await test('Apps Script v11.0.0: Set stage is logged ("Set to Scarlet by teacher, 02/12/2026"); Load islands returns the row, the Finale data and the lines',()=>{
 const gas=makeGas(),at=new Date(2026,11,2,9,10).getTime();
 gas.post({type:'SAGA_SAVE',pin:'2595',className:'6-C',saga:{stage:'Gilded',won:{Violet:at-9e8,Scarlet:at-5e8},fightSessions:['f1','f2'],updatedAt:at-5e8}});
 let r=gas.post({type:'SAGA_SET',pin:'2595',className:'6-C',stage:'Scarlet',at,note:'Set to Scarlet by teacher'});
 assert.equal(r.status,'success');assert.equal(r.saga.stage,'Scarlet');assert.equal(r.saga.won.Scarlet,0);assert.equal(r.saga.correctedAt,at);
 const row=gas.ss.getSheetByName('Vixar_Saga').rows[1];assert.equal(row[8],'Set to Scarlet by teacher, 02/12/2026');assert.equal(row[2],11);
 assert.equal(gas.post({type:'SAGA_SET',pin:'2595',className:'6-C',stage:'Blue'}).status,'error');assert.equal(gas.post({type:'SAGA_SET',pin:'0000',className:'6-C',stage:'Violet'}).status,'unauthorized');
 // What the Finale needs: contributions of the saga sessions, navigators and Merge answers.
 gas.post({type:'LEADERBOARD_FINAL',pin:'2595',className:'6-C',sessionId:'f1',standings:[],studentContributions:{everyone:{gryffindor:[{name:'Selin',awards:4}],slytherin:[],hufflepuff:[],ravenclaw:[]}}});
 gas.post({type:'LEADERBOARD_FINAL',pin:'2595',className:'6-C',sessionId:'other',standings:[],studentContributions:{everyone:{gryffindor:[{name:'Amir',awards:9}],slytherin:[],hufflepuff:[],ravenclaw:[]}}});
 gas.post({type:'SAGA_SAVE',pin:'2595',className:'6-C',saga:{stage:'Scarlet',updatedAt:Date.now()},mergeLog:[{id:'f2-m1',at:Date.now(),className:'6-C',team:'Ravenclaw',student:'Hedil',level:12,type:'Merge · Translation',word:'',island:3,result:'right'}]});
 r=gas.post({type:'SAGA_LINES_SAVE',pin:'2595',className:'6-C',grade:6,lines:['Thank you, 6-C.','You never stopped.']});assert.equal(r.status,'success');same(r.finaleLines.lines,['Thank you, 6-C.','You never stopped.']);
 assert.equal(gas.post({type:'SAGA_LINES_SAVE',pin:'2595',className:'6-C',grade:6,lines:[]}).status,'error');
 r=gas.post({type:'ISLAND_GET',pin:'2595',className:'6-C'});
 assert.equal(r.sagaVersion,1);assert.equal(r.saga.stage,'Scarlet');same(r.saga.fightSessions,['f1','f2']);
 same(r.sagaExtras.contributions.map(c=>[c.name,c.contributions,c.sessionId]),[['Selin',4,'f1']],'only the saga sessions');
 same(r.sagaExtras.merge.map(m=>[m.team,m.student,m.result]),[['ravenclaw','Hedil','right']]);
 same(r.finaleLines.lines,['Thank you, 6-C.','You never stopped.']);assert.equal(r.finaleLines.grade,6);
 assert.equal(gas.post({type:'ISLAND_GET',pin:'2595',className:'8-B'}).saga.stage,'Violet','a class without a row starts at Violet');
});
await test('Netlify: saga saves pass through; an older script keeps the saga and Merge answers on the phone and writes nothing',async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');
 const req=data=>new Request('https://school.test/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const older=async(url,o)=>{const b=JSON.parse(o.body);if(b.type==='ISLAND_GET')return new Response(JSON.stringify({status:'success',islandProgress:{},questionLogVersion:1,contributionsVersion:1,navigatorSealsVersion:1,challengeLogVersion:1}));
  return new Response(JSON.stringify(['FULL_SESSION','LEADERBOARD_FINAL','BATTLE_OUTCOME'].includes(b.type)?{status:'success'}:{status:'error',message:'Unknown record type'}));};
 let r=await (await handleSession(req({type:'SAGA_SAVE',pin:'2595',className:'5-A',saga:{stage:'Scarlet'}}),older)).json();
 assert.equal(r.status,'error');assert.match(r.message,/Vixar Saga is kept on this board and phone\. Update Apps Script using GOOGLE-APPS-SCRIPT-v11\.0\.0\.gs/);
 r=await (await handleSession(req({type:'LEADERBOARD_FINAL',pin:'2595',className:'5-A',sessionId:'s',islandProgress:{},standings:[],challengeLog:[{id:'s-m1',merge:true,type:'Merge · Grammar'}]}),older)).json();
 assert.equal(r.status,'error');assert.match(r.message,/Merge Spell answers are kept on this phone/);
 const gas=makeGas(),current=async(url,o)=>new Response(JSON.stringify(gas.post(JSON.parse(o.body))));
 r=await (await handleSession(req({type:'SAGA_SAVE',pin:'2595',className:'5-A',saga:{stage:'Scarlet',updatedAt:Date.now()}}),current)).json();assert.equal(r.status,'success');assert.equal(r.saga.stage,'Scarlet');
 for(const type of ['SAGA_SET','SAGA_LINES_SAVE']){r=await (await handleSession(req({type,pin:'',className:'5-A'}),current)).json();assert.equal(r.status,'error');assert.match(r.message,/Teacher PIN/);}
});
await test('New art falls back to the Level 10 pictures when a Level 11 or 12 sheet fails to load; the v10.5.0 sheets keep their cache tag',async()=>{
 const images=[];const c={console,URL,Map,Set,WeakMap,Promise,Math,performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},CSS:{supports:()=>true},
  Image:class{constructor(){images.push(this);this.naturalWidth=960;this.naturalHeight=960;}decode(){return Promise.resolve();}}};
 vm.createContext(c);vm.runInContext(pub('creature-poses.js'),c);const P=c.CreaturePoses;
 const p=P.load('gryffindor',11);assert.match(images[0].src,/gryffindor-11\.webp\?v=11\.0\.0$/);images[0].onerror();
 assert.match(images[1].src,/gryffindor-10\.webp\?v=10\.5\.0$/,'the Level 10 sheet is requested instead');images[1].onload();for(let i=0;i<6;i++)await Promise.resolve();
 const e=await p;assert.equal(e.key,'gryffindor-10');
 P.load('vixar-scarlet');assert.match(images[2].src,/vixar-scarlet\.webp\?v=11\.0\.0$/);P.load('veyr');assert.match(images[3].src,/veyr\.webp\?v=10\.5\.0$/);
 const anim=pub('animated-mode.js');assert.match(anim,/if\(Number\(frame\.dataset\.avatarLevel\)>10&&!img\.dataset\.fallback\)\{img\.dataset\.fallback='10';img\.src=source\(frame\.dataset\.avatarTeam,10\);return;\}/);
 assert.match(pub('island-runner/app.js'),/Math\.min\(10,Math\.max\(0,Math\.round\(H\.context\.level\)\|\|0\)\)/);
 for(const team of ['gryffindor','slytherin','hufflepuff','ravenclaw'])for(const n of [11,12]){
  assert(fs.existsSync(path.join(__dirname,'../public/assets/poses',`${team}-${n}.webp`)),`${team}-${n} poses`);assert(fs.existsSync(path.join(__dirname,'../public/assets/animated',`${team}-${n}.webp`)),`${team}-${n} avatar`);}
 const manifest=JSON.parse(pub('assets/poses/manifest.json'));for(const k of ['gryffindor-11','ravenclaw-12','vixar-scarlet','vixar-gilded'])assert.equal(manifest.packs[k].cols,3);
 same(manifest.packs['vixar-gilded'].states,['ready','charge','cast','guard','exposed','hit','ultimate','defeat','proud']);
 const slots=JSON.parse(pub('assets/saga/manifest.json'));assert.equal(slots.hug,'hug.webp');same(Object.keys(slots.mrSaymaz),['portrait','ready','proud','support','wave','bow','kneel']);assert.equal(slots.mrSaymaz.kneel,'mr-saymaz-kneel.webp');same(Object.keys(slots.merged),['slyffindor','huffleclaw']);
});
await test('Saga art: Mr. Saymaz (portrait, five poses, a six-frame reveal on one canvas) and the fused teams (pictures and nine-pose sheets); placeholders for the kneeling pose, the hug and the sharper Vixar poses',()=>{
 // WebP size from the file header (VP8X, VP8L or VP8), so no image library is needed.
 const size=file=>{const b=fs.readFileSync(file);assert.equal(b.toString('ascii',0,4)+b.toString('ascii',8,12),'RIFFWEBP',file);const kind=b.toString('ascii',12,16);
  if(kind==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(kind==='VP8L'){const n=b.readUInt32LE(21);return [1+(n&0x3fff),1+((n>>14)&0x3fff)];}return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
 const slots=JSON.parse(pub('assets/saga/manifest.json')),dir=path.join(__dirname,'../public/assets/saga'),safe=/^[A-Za-z0-9._-]{1,80}\.(webp|png|jpg|jpeg)$/i;
 for(const [pose,name] of Object.entries(slots.mrSaymaz)){if(pose==='kneel')continue;assert.match(name,safe,pose);same(size(path.join(dir,name)),pose==='portrait'?[320,320]:[640,1120],pose);}
 // Still to come: the kneeling pose and the hug illustration are half-size placeholders under their final names, under the
 // widths the board accepts, so the board keeps its stand-ins until the real pictures replace the files.
 const scenesCode=pub('saga-scenes.js'),min=k=>Number(scenesCode.match(new RegExp(k+'=(\\d+)'))[1]);
 same(size(path.join(dir,slots.mrSaymaz.kneel)),[320,560],'kneel placeholder');assert(320<min('KNEEL_MIN')&&min('KNEEL_MIN')<=640);
 same(size(path.join(dir,slots.hug)),[800,450],'hug placeholder');assert(800<min('HUG_MIN')&&min('HUG_MIN')<=1600);
 // The sharper Scarlet and Gilded poses: nine labelled placeholders per form for art/pack-vixar-poses.cjs, which refuses
 // anything under 1000 px; until it packs real ones the two forms keep their poses off.
 const pngSize=file=>{const b=fs.readFileSync(file);assert.equal(b.toString('ascii',1,4),'PNG',file);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
 const states=['ready','charge','cast','guard','exposed','hit','ultimate','defeat','proud'],src=path.join(__dirname,'../art/vixar-poses');
 same(fs.readdirSync(src).filter(f=>f.endsWith('.png')).sort(),['gilded','scarlet'].flatMap(form=>states.map(s=>`vixar-${form}-${s}.png`)).sort());
 for(const f of fs.readdirSync(src).filter(f=>f.endsWith('.png')))same(pngSize(path.join(src,f)),[627,627],f);
 const packer=fs.readFileSync(path.join(__dirname,'../art/pack-vixar-poses.cjs'),'utf8');assert.match(packer,/CELL=640,MIN=1000/);assert.match(packer,/poses:false`,`art:'\$\{id\}',poses:true`/);
 assert.match(pub('vixar-saga.js'),/art:'vixar-scarlet',poses:false/);assert.match(pub('vixar-saga.js'),/art:'vixar-gilded',poses:false/);
 assert.equal(slots.reveal.length,6,'six reveal frames');for(const name of slots.reveal){assert.match(name,safe);same(size(path.join(dir,name)),[640,1120],name);}
 assert.match(slots.reveal[0],/bound/);assert.match(slots.reveal[5],/identity-revealed/);
 for(const [pair,name] of Object.entries(slots.merged)){assert.match(name,safe);same(size(path.join(dir,name)),[512,512],pair);}
 const poses=JSON.parse(pub('assets/poses/manifest.json')).packs,crypto=require('crypto');
 for(const pair of ['slyffindor','huffleclaw']){const e=poses[pair],file=path.join(__dirname,'../public/assets/poses',e.file),bytes=fs.readFileSync(file);
  same([e.cols,e.rows,e.cell],[3,3,320]);same(e.states,poses['gryffindor-12'].states,'team states');same(size(file),[960,960]);
  assert.equal(bytes.length,e.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),e.sha256,pair+' hash');}
 const scenes=pub('saga-scenes.js');assert.match(scenes,/reveal:Array\.isArray\(m\?\.reveal\)/);assert.match(scenes,/data-avatar-team="\$\{pairId\}"/,'the fused picture is a posable creature in Animated mode');
 assert.match(pub('game.js'),/mergedArt\(fighter\.id, \{ poses:performanceMode === 'animated' \}\)/,'Light mode keeps the still picture');
});
await test('Wiring: the class cap replaces Level 10 in chests, traits, Unity, the badge and the phone; the Rift gates every fight; build 11.0.0',()=>{
 const game=pub('game.js'),html=pub('index.html');
 assert.match(game,/const REMOTE_BUILD = '11\.0\.0';/);
 assert.equal(html.match(/<script src="([^"]+)"/)[1],'./vixar-preview.js?v=11.0.0','the fight preview loads before every other script');
 assert.match(pub('vixar-preview.js'),/if\(!match\)return;/,'and does nothing without a #preview- address');for(const f of ['vixar-saga.js','merge-spell.js','fight-fx.js','saga-scenes.js','saga-remote.js','vixar-saga.css'])assert(html.includes(f+'?v=11.0.0'),f);
 assert.match(game,/if \(team\.level >= levelCap\(\) \|\| team\.pendingEvolution\) return false;/);
 assert.match(game,/if \(team\.level >= levelCap\(\) \|\| team\.evolutionProgress < 3 \|\| team\.pendingEvolution\) return false;\s*let available = traitsForStage\(team\.id, team\.level \+ 1, team\.traits\);/);
 assert.match(game,/const remainingLevels = Math\.max\(0, levelCap\(\) - team\.level\);/);assert.match(game,/team\.level = Math\.min\(levelCap\(\), team\.level \+ 1\);/);
 assert.match(game,/const ready = Boolean\(team\.pendingEvolution\) && team\.level < levelCap\(\);/);assert.match(game,/getTeam\('gryffindor'\)\.level < cap,/);
 assert.equal((game.match(/Math\.min\(10,/g)||[]).length,3,'only the island number and the ten original traits (Unity, Light forms) keep 10');
 assert.match(game,/function sagaFightReady\(\) \{ const act = sagaFightAct\(\); return Boolean\(act && riftOpen && !sagaFoughtToday\(\) && allTeamsAtLeastLevel\(act\.level\)\); \}/);
 assert(!/allTeamsAtLeastLevel\(8\)/.test(game),'the Level 8 sigil rule is gone');
 assert.match(game,/riftOpen,sagaSessionWin,/,'the Rift is in the recovery snapshot');assert.match(game,/riftOpen=s\.riftOpen===true;/);
 assert.match(pub('session-recovery.js'),/t\.level<=12&&Array\.isArray\(t\.traits\)&&t\.traits\.length<=12/);
 // Stage changes stay outside Undo: the Undo snapshot never contains the saga.
 const undo=game.slice(game.indexOf('function saveState()'),game.indexOf("document.getElementById('undo-btn').addEventListener"));assert(!/saga|LeagueSaga|riftOpen/i.test(undo));
 // The subject wheel stays at Levels 5 and 10.
 assert.match(game,/const SUBJECT_WHEEL_LEVELS = Object\.freeze\(\[5, 10\]\);/);
});
await test('Light on old boards: the saga effects animate transforms and opacity only, within the effects budget, and stop on pause',()=>{
 const fx=pub('fight-fx.js'),css=pub('vixar-saga.css'),scenes=pub('saga-scenes.js');
 assert(!/filter\s*:/.test(css.replace(/\/\*[\s\S]*?\*\//g,'')),'no filters in the saga stylesheet');
 assert(!/transition:[^;]*(box-shadow|filter)/.test(css),'no animated shadows or filters');
 for(const kf of css.match(/@keyframes [\s\S]*?\}\s*\}/g)||[])assert(!/box-shadow|filter|width|height|top|left/.test(kf),'keyframes animate transforms and opacity only: '+kf.slice(0,40));
 assert.match(fx,/LeaguePerformance\.limit/);assert.match(fx,/const paused=\(\)=>doc\.hidden\|\|root\.SceneRuntime\?\.paused\|\|root\.SceneRuntime\?\.fastForwarding;/);
 assert.match(fx,/if\(reduced\(\)\|\|light\(\)\|\|level\(\)>=2\|\|typeof n\.animate!=='function'\)/,'Light mode and reduced motion: still numbers');
 assert.match(scenes,/Light mode and reduced motion keep the same order and words/);assert(!/getBoundingClientRect[\s\S]{0,40}requestAnimationFrame/.test(scenes),'no per-frame measuring');
});
console.log(JSON.stringify({checks}));
})().catch(error=>{console.error(error);process.exit(1);});
