/* v10.2.0 dependency-free checks: the Comeback Halo. Teams that won neither the League title nor the Final Arena
   in a class's last session earn ×2 in that class's next session. Covers the halo store (board results and Google
   Sheets results), the scoring rule, the Apps Script's last session per class (in-memory spreadsheet), the head
   positions for all 44 Animated avatars and the Light avatars, and the board/phone wiring. Browser checks:
   board-v102.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeGas}=require('./roster-gas-harness.cjs');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
function haloModule(storage=new Map()){
 const events=[],window={};
 const ctx={window,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail;}},
  document:{getElementById:()=>null,dispatchEvent:e=>events.push(e.detail)},JSON,Number,String,Array,Object,Set,Map,Math};
 vm.createContext(ctx);vm.runInContext(pub('comeback-halo.js'),ctx);return {H:window.LeagueHalo,events,storage};
}
const result=(sessionId,at,league,arena)=>({sessionId,at,league,arena});

test('Comeback Halo: every team that won neither title gets ×2; a shared League title and the Arena champion are both winners',()=>{
 const {H,events}=haloModule();
 assert.deepEqual(plain(H.teams('5-A','now')),[],'a first session: no halo');
 assert.equal(H.record('5-A',result('lesson-1',1000,['gryffindor'],'slytherin')),true);assert.deepEqual(plain(events),[{className:'5-A'}]);
 assert.deepEqual(plain(H.teams('5-A','lesson-2')),['hufflepuff','ravenclaw']);
 H.record('5-A',result('lesson-2',2000,['gryffindor'],'gryffindor'));assert.deepEqual(plain(H.teams('5-A','lesson-3')),['slytherin','hufflepuff','ravenclaw'],'a Grand Champion: the other three');
 H.record('5-A',result('lesson-3',3000,['slytherin','ravenclaw'],'hufflepuff'));assert.deepEqual(plain(H.teams('5-A','lesson-4')),['gryffindor'],'a shared title counts each tied team');
 H.record('5-A',result('lesson-4',4000,['gryffindor','slytherin','hufflepuff','ravenclaw'],'gryffindor'));assert.deepEqual(plain(H.teams('5-A','lesson-5')),[],'everyone won: no halo');
 assert.deepEqual(plain(H.teams('5-A','lesson-4')),[],'never from the session itself');
 assert.deepEqual(plain(H.teams('7-A','x')),[],'each class has its own last session');
});
test('Results from Google Sheets: kept unless the board knows a later session; invalid results are refused; kept for the next lesson',()=>{
 const {H,storage}=haloModule();
 H.record('6-C',result('board-2',5000,['ravenclaw'],'ravenclaw'));
 assert.equal(H.accept('6-C',result('sheet-old',4000,['gryffindor'],'slytherin')),false,'an older saved session does not replace the board’s later one');
 assert.equal(H.accept('6-C',result('board-2',5200,['ravenclaw'],'ravenclaw')),true,'the same session as saved');
 assert.equal(H.accept('6-C',result('other-board',9000,['slytherin'],'gryffindor')),true,'a later session played on another board');
 assert.deepEqual(plain(H.teams('6-C','today')),['hufflepuff','ravenclaw']);
 for(const bad of [null,{},result('bad id!',1,['gryffindor'],null),result('x',-1,['gryffindor'],null),result('x',1,[],null),result('x',1,['dragons'],'nobody')])assert.equal(H.accept('5-C',bad),false);
 assert.deepEqual(plain(haloModule(storage).H.teams('6-C','next')),['hufflepuff','ravenclaw'],'kept on this board for the next lesson');
});
test('Scoring: the halo doubles the award after every other bonus; teams without it are unchanged',()=>{
 const window={};vm.runInNewContext(pub('game-rules.js'),{window,Math});const R=window.LeagueRules;
 const teams=[{id:'gryffindor',points:100,powerups:{}},{id:'slytherin',points:100,powerups:{}}];
 const plainAward=R.award({team:teams[0],teams,base:40,lastTeam:null});
 const halo=R.award({team:teams[0],teams,base:40,lastTeam:null,halo:true});
 assert.equal(plainAward.points,40);assert.equal(halo.points,80);assert.deepEqual(plain(halo.modifiers.map(m=>m.label)),['Halo ×2']);
 const both=R.award({team:{...teams[0],powerups:{doubleUp:true}},teams,base:40,lastTeam:null,halo:true});assert.equal(both.points,160,'stacks with the Double power-up');
});
test('Apps Script v10.2.0: Load islands returns each class’s last saved session (same session, later Arena-only save, shared title, older rows)',()=>{
 const gas=makeGas(),pin='2595',st=(n,p)=>({name:n,points:p,level:2});
 const save=(type,className,sessionId,standings,winner)=>gas.post({type,pin,className,sessionId,standings,winner});
 assert.equal(gas.post({type:'ISLAND_GET',pin,className:'5-A'}).lastSession,null,'no sessions yet');
 save('FULL_SESSION','5-A','s1',[st('Gryffindor',90),st('Slytherin',60)],'Ravenclaw');
 let got=gas.post({type:'ISLAND_GET',pin,className:'5-A'});assert.equal(got.lastSessionVersion,1);
 assert.deepEqual(plain(got.lastSession).league,['gryffindor']);assert.equal(got.lastSession.arena,'ravenclaw');assert.equal(got.lastSession.sessionId,'s1');assert(got.lastSession.at>0);
 save('FULL_SESSION','5-A','s2',[st('Slytherin',80),st('Hufflepuff',80),st('Gryffindor',10)],'Slytherin');
 got=gas.post({type:'ISLAND_GET',pin,className:'5-A'}).lastSession;assert.deepEqual(plain(got),{sessionId:'s2',at:got.at,league:['slytherin','hufflepuff'],arena:'slytherin'},'shared title');
 save('FULL_SESSION','7-A','s3',[st('Ravenclaw',50)],'Ravenclaw');
 assert.equal(gas.post({type:'ISLAND_GET',pin,className:'5-A'}).lastSession.sessionId,'s2','another class does not change it');
 // The last save of the class was an Arena result only (a later session).
 const later=new gas.SheetDate(Date.now()+60000);gas.sheets.get('Battle_Results').rows.push([later,'5-A','Hufflepuff',120,300,'30s','s4']);
 got=gas.post({type:'ISLAND_GET',pin,className:'5-A'}).lastSession;assert.deepEqual(plain(got.league),[]);assert.equal(got.arena,'hufflepuff');assert.equal(got.sessionId,'s4');
 // Rows written before Session IDs: the latest League row and Arena row of the class, saved together.
 const old=makeGas();old.sheets.get('Leaderboard').rows.push(['10/5/2026, 7:46:12 PM','8-B','Ravenclaw (120 pts, Lv.4)','Gryffindor (90 pts, Lv.3)']);
 old.sheets.get('Battle_Results').rows.push(['10/5/2026, 7:47:00 PM','8-B','Gryffindor',30,200,'30s']);
 got=old.post({type:'ISLAND_GET',pin,className:'8-B'}).lastSession;assert.deepEqual(plain(got.league),['ravenclaw']);assert.equal(got.arena,'gryffindor');assert.match(got.sessionId,/^sheet-\d+$/);
 const H=haloModule().H;assert.equal(H.accept('8-B',got),true,'the board accepts the Sheet’s result');assert.deepEqual(plain(H.teams('8-B','today')),['slytherin','hufflepuff']);
});
test('The halo sits on the head: an anchor for each of the 44 Animated avatars and each Light avatar trait that raises the head',()=>{
 const {H}=haloModule(),game=pub('game.js');
 for(const team of ['gryffindor','slytherin','hufflepuff','ravenclaw']){
  assert.equal(H.anchors[team].length,13,team+': levels 0–12 (v11.0.0 adds Levels 11 and 12)');
  for(const [x,y,w] of H.anchors[team]){assert(x>=25&&x<=80&&y>=3&&y<=25&&w>=20&&w<=40,`${team}: ${x},${y},${w}`);}
  for(const trait of Object.keys(H.light[team].traits))assert(game.includes(`hasTrait('${trait}')`),`${team}: the Light avatar has the trait ${trait}`);
 }
 const css=pub('league-v10.css');assert.match(css,/\.animal-mascot>\.halo-svg\{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none/);
 assert.match(css,/@media \(prefers-reduced-motion:no-preference\)\{\s*body\.performance-animated \.app-shell \.animal-mascot>\.halo-svg \.halo-float\{animation:halo-float/,'moves gently only in Animated mode');
});
test('Wiring: chosen with the class, fixed from the first award, kept in the checkpoint, recorded when the Arena ends, synced with the phone and Sheets',()=>{
 const game=pub('game.js');
 assert.match(game,/LeagueRules\.award\(\{[^}]*halo:haloTeams\.includes\(team\.id\)\}\);\s*lockHalo\(\);/);
 assert.match(game,/const halo = pts > 0 && haloTeams\.includes\(t\.id\);\s*if \(halo\) pts \*= 2;/,'custom points, never deductions');
 assert.match(game,/if \(classChanged\) \{ handlePointChange\(CLASS_STARTING_POINT_TIERS\[className\]\); haloLocked = false; refreshHalo\(\); \}/);
 assert.match(game,/if \(!haloLocked && last\?\.sessionId !== sessionId\) haloTeams = /);
 assert.match(game,/globalThis\.LeagueHalo\?\.record\(selectedClass,\{sessionId,at:Date\.now\(\),league:leagueWinners\.map\(f=>f\.id\),arena:arenaWinner\.id\}\)/);
 assert.match(game,/lastVortexTime,sessionNavigator,haloTeams,haloLocked,/);assert.match(game,/haloTeams=Array\.isArray\(s\.haloTeams\)/);
 assert.match(game,/selectedClass=null;studentContributions=\{\};pendingRemoteClassSelection=null;haloTeams=\[\];haloLocked=false;/,'a new session starts afresh');
 assert.match(game,/seasonOutdated:Boolean\(globalThis\.LeagueSeason\?\.outdatedScript\),haloTeams,/);
 assert.match(game,/if\(data\.type==='HALO_RESULT'&&isHost\)\{/);
 assert.match(pub('island-progress.js'),/if\(result\.lastSession\)root\.LeagueHalo\?\.accept\(c,result\.lastSession\);/);
 const html=pub('index.html');assert(html.indexOf('comeback-halo.js?v=')>0&&html.indexOf('comeback-halo.js')<html.indexOf('game.js?v='));
});
console.log(JSON.stringify({checks}));
