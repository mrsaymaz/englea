/* v10.0.0 dependency-free checks: School League Season wins counted by the Apps Script (every class, older
   sessions included, shared titles, Grand Champions, re-saves), the board's season module, and the elemental
   student card rules. Browser checks are in board-v10.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
const {makeGas}=require('./roster-gas-harness.cjs');
const standing=(name,points)=>({name,points,level:3});
const save=(gas,type,className,sessionId,standings,winner)=>gas.post({type,pin:'2595',className,sessionId,standings,winner});

test('Season wins: League title and Arena each count once, a Grand Champion twice, a shared title once per tied team',()=>{
 const gas=makeGas();
 // Grand Champion: Gryffindor tops the League and wins the Arena.
 assert.equal(save(gas,'FULL_SESSION','5-A','s1',[standing('Gryffindor',90),standing('Slytherin',70),standing('Hufflepuff',50),standing('Ravenclaw',20)],'Gryffindor').status,'success');
 // Shared League title (Slytherin and Ravenclaw on 80); Hufflepuff wins the Arena.
 save(gas,'FULL_SESSION','7-A','s2',[standing('Slytherin',80),standing('Ravenclaw',80),standing('Gryffindor',60),standing('Hufflepuff',40)],'Hufflepuff');
 // A standings-only save and an Arena-only save.
 save(gas,'LEADERBOARD_FINAL','6-C','s3',[standing('Hufflepuff',55),standing('Gryffindor',30),standing('Slytherin',20),standing('Ravenclaw',10)]);
 save(gas,'BATTLE_OUTCOME','8-B','s4',[],'Ravenclaw');
 const season=gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'}).season;
 assert.deepEqual(plain(season.wins),{gryffindor:2,hufflepuff:2,slytherin:1,ravenclaw:2});
 assert.equal(season.sessions,4);assert.deepEqual(plain(season.classes),['5-A','6-C','7-A','8-B']);assert.deepEqual(plain(season.recent),['s1','s2','s3','s4']);
});

test('Season wins: older sessions count, a session saved again is counted once, unreadable rows are skipped',()=>{
 const gas=makeGas(),board=gas.sheets.get('Leaderboard'),battles=gas.sheets.get('Battle_Results');
 // Rows written by earlier versions: no Session ID, and one row with no points.
 board.rows.push([new Date(),'5-C','Ravenclaw (120 pts, Lv.4)','Gryffindor (90 pts, Lv.3)','Slytherin (10 pts, Lv.1)','Hufflepuff (5 pts, Lv.1)',120,'No']);
 board.rows.push([new Date(),'5-C','Slytherin','Gryffindor','Hufflepuff','Ravenclaw','-','No']);
 battles.rows.push([new Date(),'5-C','Gryffindor',30,200,'30s']);
 const s=save(gas,'FULL_SESSION','5-A','s9',[standing('Hufflepuff',70),standing('Gryffindor',10),standing('Slytherin',5),standing('Ravenclaw',0)],'Slytherin');
 assert.deepEqual(plain(s.season.wins),{gryffindor:1,hufflepuff:1,slytherin:2,ravenclaw:1},'saves return the season too');
 // The phone saves the same session again (retry): its rows are replaced, not added.
 const again=save(gas,'FULL_SESSION','5-A','s9',[standing('Hufflepuff',70),standing('Gryffindor',10),standing('Slytherin',5),standing('Ravenclaw',0)],'Slytherin');
 assert.deepEqual(plain(again.season.wins),plain(s.season.wins));assert.equal(again.season.sessions,s.season.sessions);
 assert.equal(s.season.sessions,4,'"existing lesson" (unreadable) skipped; three older rows plus one session');
});

// ---- Board module ----
function seasonModule(storage=new Map()){
 const listeners={},window={};
 const ctx={window,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},CustomEvent:class{constructor(t){this.type=t;}},
  document:{getElementById:()=>null,addEventListener:(k,f)=>{(listeners[k]??=[]).push(f);},dispatchEvent:e=>{(listeners[e.type]||[]).forEach(f=>f(e));}},Date,JSON,Number,Array,Object,Set};
 vm.createContext(ctx);vm.runInContext(pub('league-season.js'),ctx);return {L:window.LeagueSeason,storage,listeners};
}
test('The Champions panel adds this session’s wins until the Sheet has them, then shows the saved totals',()=>{
 const {L,storage,listeners}=seasonModule();let changes=0;(listeners['league-season-change']=[]).push(()=>changes++);
 let session={sessionId:'today',league:['slytherin','ravenclaw'],arena:'slytherin'};L.configure({session:()=>session});
 assert.deepEqual(plain(L.sessionWins(session)),{gryffindor:0,slytherin:2,hufflepuff:0,ravenclaw:1},'Grand Champion twice, shared title once each');
 let st=L.standings();assert.equal(st.known,false);assert.deepEqual(plain(st.rows.map(r=>[r.team,r.wins,r.delta,r.rank])),[['slytherin',2,2,1],['ravenclaw',1,1,2],['gryffindor',0,0,3],['hufflepuff',0,0,3]]);
 assert.equal(L.accept({wins:{gryffindor:9,slytherin:7,hufflepuff:4,ravenclaw:7},sessions:20,classes:['5-A','7-A'],recent:['old']}),true);assert.equal(changes,1);
 st=L.standings();assert.equal(st.saved,false);assert.deepEqual(plain(st.rows.map(r=>[r.team,r.wins,r.rank])),[['gryffindor',9,1],['slytherin',9,1],['ravenclaw',8,3],['hufflepuff',4,4]],'ties share a rank, listed in team order');
 L.accept({wins:{gryffindor:9,slytherin:9,hufflepuff:4,ravenclaw:8},sessions:21,classes:['5-A','7-A'],recent:['old','today']});
 st=L.standings();assert.equal(st.saved,true);assert.deepEqual(plain(st.rows.map(r=>[r.team,r.wins])),[['gryffindor',9],['slytherin',9],['ravenclaw',8],['hufflepuff',4]],'no double counting once saved');
 assert.deepEqual(plain(seasonModule(storage).L.data.wins),{gryffindor:9,slytherin:9,hufflepuff:4,ravenclaw:8},'kept for the next lesson');
 for(const bad of [null,{},{wins:{gryffindor:-1,slytherin:0,hufflepuff:0,ravenclaw:0}},{wins:{gryffindor:'x'}}])assert.equal(L.accept(bad),false);
 session=null;assert.equal(L.standings().session,null,'not on the Champions screen: no panel');
});

test('Season data travels: Load islands, every save, and phone → board; the panel sits on the Champions screen',()=>{
 assert.match(pub('island-progress.js'),/if\(result\.season\)root\.LeagueSeason\?\.accept\(result\.season\);else root\.LeagueSeason\?\.outdated\(\);/);
 assert.match(pub('sheets-outbox.js'),/if\(result\.season\)root\.LeagueSeason\?\.accept\(result\.season\);/);
 const game=pub('game.js');
 assert.match(game,/safeRemoteSend\(\{type:'LEAGUE_SEASON',sessionId:latestRemoteSessionId,season:LeagueSeason\.data\}\)/);
 assert.match(game,/if\(data\.type==='LEAGUE_SEASON'&&isHost\)\{\s*if\(data\.sessionId===sessionId\)globalThis\.LeagueSeason\?\.accept\(data\.season\);return;/);
 assert.match(game,/league:battleState\.fighters\.filter\(f=>f\.points===top\)\.map\(f=>f\.id\),arena:determineArenaWinner\(\)\.id/);
 assert.match(pub('league-season.js'),/document\.getElementById\('winner-overlay'\)/);
 const html=pub('index.html'),tag=(html.match(/Island Run Edition · v(10\.\d+\.\d+)/)||[])[1];assert(tag,'edition 10.x');assert(html.includes('league-season.js?v='+tag));assert(html.includes('league-v10.css?v='+tag));assert(html.includes('student-ui.js?v='+tag),'the card fix reaches cached boards');
});

// ---- Elemental student cards ----
test('Elemental cards: fire, nature, water and air by team; Spark, Surge, Storm and Mythic by seals; no level number shown',()=>{
 const ui=pub('student-ui.js'),css=pub('league-v10.css');
 assert.match(ui,/gryffindor:\{kind:'fire',title:'Flamebearer'\}, slytherin:\{kind:'nature',title:'Earthshaker'\},\s*ravenclaw:\{kind:'water',title:'Tidecaller'\}, hufflepuff:\{kind:'air',title:'Stormrider'\}/);
 assert.match(ui,/const tierOf = level => level >= 10 \? 'mythic' : level >= 7 \? 'storm' : level >= 4 \? 'surge' : level >= 1 \? 'spark' : '';/);
 assert.doesNotMatch(ui,/Lv\.? ?\$\{level\}|Level \$\{level\}/,'the level is never printed');
 for(const kind of ['fire','nature','water','air'])assert.match(css,new RegExp(`\\.el-card\\.el-${kind}\\{--el-a:`));
 for(const name of ['el-rise','el-leaf','el-bubble','el-wisp'])assert.match(css,new RegExp(`@keyframes ${name}\\{`));
 // Motion only in Animated mode and only without reduced motion; specific enough to beat the lean "no animation" rule.
 assert.match(css,/@media \(prefers-reduced-motion:no-preference\)\{\s*body\.performance-animated \.app-shell \.mascot-area>\.student-contribution-badge\.el-card \.el-p\{opacity:0;animation:el-rise/);
 // One level-up burst per new seal.
 const seals=pub('navigator-seals.js');assert.match(seals,/if\(added\)\{save\(\);markLevelUp\(c,student\.id\);/);assert.match(seals,/function takeLevelUp\(c,id\)\{const key=c\+'\|'\+id;if\(!levelUps\[key\]\)return false;delete levelUps\[key\];/);
});

console.log(JSON.stringify({checks}));
