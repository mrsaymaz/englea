/* v9.6.0 dependency-free checks: every student's contribution count in Google Sheets, the session
   summary that carries it, and the Netlify capability check. Island Run checks are appended below. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

// ---- Session summary: every student of the class, roster order, zero included ----
function loadStudents(){const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/student-rosters.js'),'utf8'),c);return c.window.LeagueStudents;}
test('The session summary lists every student of the class with their count, zero included, in roster order',()=>{
 const S=loadStudents(),totals={};
 const g=S.members('5-A','gryffindor');S.credit(totals,g[2],10);S.credit(totals,g[2],10);S.credit(totals,g[0],10);
 const summary=JSON.parse(JSON.stringify(S.summary('5-A',totals)));
 assert.equal(summary.metric,'contribution_count');
 assert.deepEqual(summary.everyone.gryffindor.map(s=>s.name),JSON.parse(JSON.stringify(g.map(p=>p.name))));
 assert.deepEqual(summary.everyone.gryffindor.slice(0,3).map(s=>s.awards),[1,0,2]);
 for(const team of JSON.parse(JSON.stringify(S.teams)))assert.equal(summary.everyone[team].length,S.members('5-A',team).length);
 assert.equal(summary.teams.gryffindor.length,2,'leaders list still holds contributors only');
});

// ---- Apps Script v9.6.0 ----
const {makeGas}=require('./roster-gas-harness.cjs');
const everyone={gryffindor:[{name:'Elif Naz',awards:3},{name:'Sümeyye',awards:0},{name:'=HACK()',awards:1}],slytherin:[{name:'Şeyma',awards:2}],hufflepuff:[],ravenclaw:[{name:'Derin',awards:0}]};
const teams={gryffindor:[{name:'Elif Naz',awards:3,points:30},{name:'=HACK()',awards:1,points:10}],slytherin:[{name:'Şeyma',awards:2,points:20}],hufflepuff:[],ravenclaw:[]};
const save=(gas,extra={})=>gas.post({type:'FULL_SESSION',pin:'2595',className:'5-A',sessionId:'lesson-9',standings:[{name:'Gryffindor',points:40,level:2}],winner:'Gryffindor',studentContributions:{metric:'contribution_count',teams,everyone},...extra});

test('Apps Script v9.6.0 writes one Student_Contributions row per student (zero included) and lists every contributor in I–L',()=>{
 const gas=makeGas(),r=save(gas);
 assert.equal(r.status,'success',JSON.stringify(r));assert.equal(r.contributionsVersion,1);assert.equal(r.contributionsWritten,5);
 const sheet=gas.sheets.get('Student_Contributions');
 assert.deepEqual(sheet.rows[0],['Date','Class','Team','Student','Contributions','Session ID']);
 const rows=sheet.rows.slice(1).map(r=>[r[1],r[2],r[3],r[4],r[5]]);
 assert.deepEqual(rows,[['5-A','Gryffindor','Elif Naz',3,'lesson-9'],['5-A','Gryffindor','Sümeyye',0,'lesson-9'],['5-A','Gryffindor',"'=HACK()",1,'lesson-9'],['5-A','Slytherin','Şeyma',2,'lesson-9'],['5-A','Ravenclaw','Derin',0,'lesson-9']]);
 const board=gas.sheets.get('Leaderboard');
 assert.deepEqual(board.rows[0].slice(8,12),['Contributors of Gryffindor','Contributors of Hufflepuff','Contributors of Slytherin','Contributors of Ravenclaw']);
 const lesson=board.rows.find(row=>row[12]==='lesson-9');assert.equal(lesson[8],'Elif Naz (3) · =HACK() (1)');assert.equal(lesson[9],'-');assert.equal(lesson[10],'Şeyma (2)');
 assert.equal(gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'}).contributionsVersion,1);
});

test('Saving the same session again updates its counts in place; a new session adds new rows',()=>{
 const gas=makeGas();save(gas);
 const later={...everyone,gryffindor:[{name:'Elif Naz',awards:4},{name:'Sümeyye',awards:1},{name:'=HACK()',awards:1}]};
 const r=save(gas,{studentContributions:{teams,everyone:later}});assert.equal(r.status,'success');
 const sheet=gas.sheets.get('Student_Contributions');assert.equal(sheet.getLastRow(),6,'no duplicate rows for the same session');
 assert.equal(sheet.rows[1][4],4);assert.equal(sheet.rows[2][4],1);
 save(gas,{sessionId:'lesson-10'});assert.equal(sheet.getLastRow(),11);
 assert.equal(sheet.rows.filter(r=>r[5]==='lesson-10').length,5);
});

test('An invalid contribution writes nothing, older headers are kept working, and a battle-only save adds no student rows',()=>{
 let gas=makeGas();
 const bad=save(gas,{studentContributions:{everyone:{gryffindor:[{name:'Elif Naz',awards:-1}]}}});
 assert.equal(bad.status,'error');assert.equal(gas.sheets.get('Student_Contributions'),undefined);
 assert.equal(gas.sheets.get('Leaderboard').rows.filter(r=>r[12]==='lesson-9').length,0,'the session is not half-saved');
 gas=makeGas();gas.sheets.get('Leaderboard').rows[0].push('','','','','',''); // earlier sheets
 gas.sheets.get('Leaderboard').rows[0].splice(8,4,'Leaders of Gryffindor','Leaders of Hufflepuff','Leaders of Slytherin','Leaders of Ravenclaw');
 assert.equal(save(gas).status,'success');assert.equal(gas.sheets.get('Leaderboard').rows[0][8],'Contributors of Gryffindor');
 gas=makeGas();const battle=gas.post({type:'BATTLE_OUTCOME',pin:'2595',className:'5-A',sessionId:'lesson-9',winner:'Slytherin',studentContributions:{everyone}});
 assert.equal(battle.status,'success');assert.equal(gas.sheets.get('Student_Contributions'),undefined);
 gas=makeGas();const older=save(gas,{studentContributions:{teams}});assert.equal(older.status,'success');
 assert.equal(gas.sheets.get('Student_Contributions').getLastRow(),4,'a board without `everyone` still records its contributors');
});

// ---- Board, arena and remote: v9.6.0 removals and the release tag ----
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
test('Arena callouts keep only knockouts, Surge, Final Clash and the winner; attack and relic names stay off screen',()=>{
 const game=pub('game.js'),calls=[...game.matchAll(/battleAnnounce\(([^;]*?)\);/g)].map(m=>m[1]).filter(a=>!a.startsWith('text,'));
 assert.deepEqual(calls.map(a=>a.match(/knocked out|wins the Final Arena|Arena Surge|Final Clash/)?.[0]),['knocked out','wins the Final Arena','Arena Surge','Final Clash']);
 for(const a of calls)assert.doesNotMatch(a,/signature|relic|basic/i);
 assert.doesNotMatch(pub('arena-fx.js'),/signature/i);
});
test('No "takes the lead" banner and no point bubbles on the board or the remote; the Class Mission bar fills smoothly',()=>{
 const fx=pub('board-fx.js'),css=pub('board-v95.css'),ui=pub('student-ui.js'),remote=pub('remote-compact.css');
 const code=t=>t.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
 for(const text of [fx,css,ui,remote])assert.doesNotMatch(code(text),/lead-change-banner|flyPoints|score-fly|mobile-score-pop|takes the lead/);
 assert.match(css,/body\.performance-animated \.app-shell \.class-mission-fill\{transition:width \.9s/);assert.doesNotMatch(css,/class-mission-fill::after/);
 assert.match(remote,/#mobile-controller \.mobile-team-grid\{[^}]*grid-template-rows:repeat\(2,minmax\(220px,1fr\)\)/,'remote cards tall enough for three names');
});
test('Performance mode is gone: two display modes, and a saved or requested Performance choice opens Animated',()=>{
 const game=pub('game.js'),html=pub('index.html');
 assert.match(game,/const VISUAL_MODES ?= ?\['animated', ?'light'\]/);assert.match(game,/normalizeVisualMode = mode => mode === 'ultra' \? 'animated' : mode/);
 assert.doesNotMatch(html,/performance-option-ultra|data-mode="ultra"|'ultra'\)/);
 assert.match(html,/id="custom-points-close"[^>]*onclick="closeCustomPointsModal\(\)"/);
});
test('Board, remote and runner load every v9.6.0 change on the current release tag',()=>{
 const board=pub('index.html'),runner=pub('island-runner/index.html'),release=(board.match(/Island Run Edition · v(9\.\d+\.\d+)/)||[])[1];
 assert(release&&!['9.5.0','9.4.0'].includes(release),'v9.6.0 or later');const tag=release.replace(/\./g,'\\.');
 for(const f of ['student-rosters.js','remote-compact.css','board-fx.js','board-v95.css','game.js','student-ui.js'])assert.match(board,new RegExp(f.replace('.','\\.')+'\\?v='+tag),f);
 for(const f of ['visual-v96.css','visual-kit.js','scenery.js','app.js'])assert.match(runner,new RegExp(f.replace('.','\\.')+'\\?v='+tag),f);
 assert.doesNotMatch(board+runner,/\?v=9\.5\.0/);assert.match(pub('island-run.js'),new RegExp('index\\.html\\?v='+tag));
 assert.match(pub('game.js'),new RegExp("const REMOTE_BUILD = '"+tag+"'"));assert.match(pub('island-runner/app.js'),new RegExp("window\\.IslandRunner=\\{version:'"+tag+"'"));
});

(async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');
 const call=async(capability,body)=>{const fetcher=async(url,o)=>{const d=JSON.parse(o.body);return {ok:true,json:async()=>d.type==='ISLAND_GET'?capability:{status:'success',islandProgress:{}}};};
  return (await handleSession(new Request('https://x.invalid/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),fetcher)).json();};
 const body={type:'FULL_SESSION',pin:'1',className:'5-A',islandProgress:{},studentContributions:{teams,everyone}};
 let r=await call({status:'success',islandProgress:{},passportVersion:1,questionLogVersion:1},body);assert.equal(r.status,'error');assert.match(r.message,/GOOGLE-APPS-SCRIPT-v9\.\d\.0\.gs/);
 r=await call({status:'success',islandProgress:{},passportVersion:1,questionLogVersion:1,contributionsVersion:1},body);assert.equal(r.status,'success');
 checks++;console.log('PASS Netlify session function keeps student contributions on the phone until the Sheet runs the v9.6.0 (or later) script');
 await require('./v96-island.cjs').run(test);
 console.log(JSON.stringify({checks}));
})().catch(e=>{console.error(e);process.exit(1);});
