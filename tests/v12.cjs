/* v12.0.0 dependency-free checks: Foundations and Trials.
   - Stable student IDs: the session summary carries roster IDs; Student_Contributions keeps the ID (G) next to the name
     and team as they were in the lesson; rows match by ID within a session (a rename or team change never duplicates
     or merges); two students who share a name stay two; example students are never saved; older rows get their IDs
     once from the Roster tab and Navigator_Seals (ambiguous and unmatched rows are marked, never guessed); the term
     report groups by ID; the Finale's names group by ID.
   Browser checks: board-v12.cjs. Teacher access and rosters: access-gate.cjs, roster-backend.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeGas}=require('./roster-gas-harness.cjs');const fixture=require('./fixture.cjs');
const same=(a,b,m)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),m);
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const pin=fixture.TEST_PIN;
function students(){const c={window:{}};vm.createContext(c);vm.runInContext(pub('student-rosters.js'),c);const S=c.window.LeagueStudents;S.useRoster(fixture.roster);return S;}
const save=(gas,sessionId,everyone,extra={})=>gas.post({type:'LEADERBOARD_FINAL',pin,className:'5-A',sessionId,standings:[],studentContributions:{metric:'contribution_count',ids:1,everyone},...extra});
const contribRows=gas=>gas.sheets.get('Student_Contributions').rows.slice(1).map(r=>[r[2],r[3],r[4],r[5],r[6],r[7]]);
(async()=>{
await test('The session summary carries each student\'s roster ID with the name and team of this lesson; example students are left out of saves',()=>{
 const S=students(),totals={},g=S.members('5-A','gryffindor');S.credit(totals,g[0],10);S.credit(totals,g[0],10);
 const summary=JSON.parse(JSON.stringify(S.summary('5-A',totals)));
 same(summary.everyone.gryffindor[0],{id:'5-A:gryffindor:0',name:g[0].name,awards:2});
 assert.equal(summary.teams.gryffindor[0].id,'5-A:gryffindor:0');assert.equal(summary.ids,1);
 const E=(()=>{const c={window:{}};vm.createContext(c);vm.runInContext(pub('student-rosters.js'),c);return c.window.LeagueStudents;})();
 assert.ok(E.usingExamples());const t={},ex=E.members('5-A','slytherin')[1];E.credit(t,ex,5);E.credit(t,ex,5);E.credit(t,ex,5);
 const {summary:kept,skipped}=E.withoutExamples(E.summary('5-A',t));assert.equal(skipped,3);
 for(const team of E.teams){assert.equal(kept.everyone[team].length,0);assert.equal(kept.teams[team].length,0);}
});

await test('Apps Script: contribution rows keep the student ID (G, "board" in H) next to the lesson\'s name and team',()=>{
 const gas=makeGas();fixture.seedGasRoster(gas);
 const r=save(gas,'lesson-1',{gryffindor:[{id:'5-A:gryffindor:0',name:'Emobi Nese',awards:3},{id:'5-A:gryffindor:1',name:'Süvog',awards:0}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 assert.equal(r.status,'success',JSON.stringify(r));assert.equal(r.contributionIdsVersion,1);assert.equal(r.contributionsWritten,2);
 same(gas.sheets.get('Student_Contributions').rows[0],['Date','Class','Team','Student','Contributions','Session ID','Student ID','ID source']);
 same(contribRows(gas),[['Gryffindor','Emobi Nese',3,'lesson-1','5-A:gryffindor:0','board'],['Gryffindor','Süvog',0,'lesson-1','5-A:gryffindor:1','board']]);
 assert.equal(gas.post({type:'ISLAND_GET',pin,className:'5-A'}).contributionIdsVersion,1);
});

await test('A rename or a team change between two saves of the same lesson updates the count in place; the lesson\'s name and team stay',()=>{
 const gas=makeGas();
 save(gas,'lesson-2',{gryffindor:[{id:'5-A:gryffindor:0',name:'Emobi Nese',awards:1}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 const r=save(gas,'lesson-2',{gryffindor:[],slytherin:[],hufflepuff:[{id:'5-A:gryffindor:0',name:'Emobi Nese Yeni',awards:4}],ravenclaw:[]});
 assert.equal(r.status,'success');same(contribRows(gas),[['Gryffindor','Emobi Nese',4,'lesson-2','5-A:gryffindor:0','board']],'one row: matched by ID, counted again');
 save(gas,'lesson-3',{gryffindor:[],slytherin:[],hufflepuff:[{id:'5-A:gryffindor:0',name:'Emobi Nese Yeni',awards:2}],ravenclaw:[]});
 same(contribRows(gas)[1],['Hufflepuff','Emobi Nese Yeni',2,'lesson-3','5-A:gryffindor:0','board'],'the next lesson records the new name and team under the same ID');
});

await test('Two students who share a name stay two rows; one student is never written twice in a lesson',()=>{
 const gas=makeGas();
 const r=save(gas,'lesson-4',{gryffindor:[{id:'s-1',name:'Defne',awards:2},{id:'s-2',name:'Defne',awards:5},{id:'s-1',name:'Defne',awards:9}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 assert.equal(r.status,'success');same(contribRows(gas).map(x=>[x[4],x[2]]),[['s-1',2],['s-2',5]]);
 save(gas,'lesson-4',{gryffindor:[{id:'s-2',name:'Defne',awards:6},{id:'s-1',name:'Defne',awards:3}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 same(contribRows(gas).map(x=>[x[4],x[2]]),[['s-1',3],['s-2',6]],'re-saved by ID, not by name');
 assert.equal(save(gas,'lesson-5',{gryffindor:[{id:'bad id!',name:'X',awards:1}]}).status,'error','an invalid ID refuses the save');
});

await test('Example students (shown before a sign-in) are never written to the Sheet',()=>{
 const gas=makeGas();
 const r=save(gas,'lesson-6',{gryffindor:[{id:'example-5-A-gryffindor-0',name:'Ada',awards:4},{id:'5-A:gryffindor:1',name:'Süvog',awards:1}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 assert.equal(r.status,'success');assert.equal(r.contributionsSkipped,4);same(contribRows(gas).map(x=>x[4]),['5-A:gryffindor:1']);
});

await test('Older rows get their IDs once: by name in the team, then by name in the class; shared names are "ambiguous", unknown ones "unmatched"',()=>{
 const gas=makeGas();
 const roster=[...fixture.roster.filter(p=>p.className==='5-A'),{id:'twin-a',name:'Ece',className:'5-A',teamId:'ravenclaw',active:true},{id:'twin-b',name:'Ece',className:'5-A',teamId:'ravenclaw',active:true}];
 fixture.seedGasRoster(gas,roster);
 const sheet=gas.ss.insertSheet('Student_Contributions');const d=new Date(2026,8,1);
 sheet.rows=[['Date','Class','Team','Student','Contributions','Session ID'],
  [d,'5-A','Gryffindor','Emobi Nese',2,'old-1'],     // one in the team
  [d,'5-A','Hufflepuff','Süvog',1,'old-1'],          // moved team since: one in the class
  [d,'5-A','Ravenclaw','Ece',3,'old-1'],             // two Eces
  [d,'5-A','Slytherin','Renamed Long Ago',1,'old-1'],// not on the roster any more…
  [d,'5-A','Slytherin','Seal Name',2,'old-1']];      // …but known from a navigator seal
 const seals=gas.ss.insertSheet('Navigator_Seals');seals.rows=[['Date','Class','Team','Student','Student ID','Island','Guardian','Session ID'],[d,'5-A','Slytherin','Seal Name','5-A:slytherin:3',1,'Veyr','old-1']];
 assert.equal(gas.post({type:'ISLAND_GET',pin,className:'5-A'}).status,'success','the first sign-in after the update matches the older rows');
 same(contribRows(gas).map(x=>[x[1],x[4],x[5]]),[['Emobi Nese','5-A:gryffindor:0','matched by name and team'],['Süvog','5-A:gryffindor:1','matched by name in class'],['Ece','','ambiguous: same name'],['Renamed Long Ago','','unmatched'],['Seal Name','5-A:slytherin:3','matched by name and team']]);
 assert.equal(gas.properties.get('ENGLISH_LEAGUE_CONTRIBUTION_IDS'),'1','once');
 // Fix the Roster tab, then run the match again from the menu.
 gas.sheets.get('Roster').rows.push(['old-renamed','5-A','Renamed Long Ago','Slytherin',false]);
 assert.match(gas.call('migrateStudentIds'),/1 matched, 1 ambiguous, 0 unmatched/);
 assert.equal(contribRows(gas)[3][4],'old-renamed');
 // A row saved before IDs gets its ID when the same lesson is saved again by a board that sends IDs.
 const g2=makeGas();const s2=g2.ss.insertSheet('Student_Contributions');s2.rows=[['Date','Class','Team','Student','Contributions','Session ID'],[d,'5-A','Gryffindor','Emobi Nese',1,'same-lesson']];
 g2.properties.set('ENGLISH_LEAGUE_CONTRIBUTION_IDS','1');
 save(g2,'same-lesson',{gryffindor:[{id:'5-A:gryffindor:0',name:'Emobi Nese',awards:2}],slytherin:[],hufflepuff:[],ravenclaw:[]});
 same(contribRows(g2),[['Gryffindor','Emobi Nese',2,'same-lesson','5-A:gryffindor:0','board']]);
});

await test('Term report: one row per student ID across lessons (renames and team changes listed, twins apart); rows without an ID listed at the end',()=>{
 const gas=makeGas();fixture.seedGasRoster(gas,[...fixture.roster,{id:'twin-a',name:'Ece',className:'5-A',teamId:'ravenclaw',active:true},{id:'twin-b',name:'Ece',className:'5-A',teamId:'ravenclaw',active:false}]);
 save(gas,'t-1',{gryffindor:[{id:'5-A:gryffindor:0',name:'Old Name',awards:2}],slytherin:[],hufflepuff:[],ravenclaw:[{id:'twin-a',name:'Ece',awards:1},{id:'twin-b',name:'Ece',awards:4}]});
 save(gas,'t-2',{gryffindor:[],slytherin:[],hufflepuff:[{id:'5-A:gryffindor:0',name:'Emobi Nese',awards:3}],ravenclaw:[]},{challengeLog:[{id:'t-2-c1',at:Date.now(),className:'5-A',team:'Hufflepuff',studentId:'5-A:gryffindor:0',student:'Emobi Nese',level:5,type:'Speaking',word:'x',island:1,result:'right'}]});
 gas.sheets.get('Student_Contributions').rows.push([new Date(),'5-A','Slytherin','Nobody Known',7,'t-0','','unmatched']);
 assert.match(gas.call('buildTermReport'),/students, 1 older rows without an ID/);
 const rows=gas.sheets.get('Term_Report').rows,head=rows[0];same(head.slice(0,7),['Student ID','Student (roster)','Class','Team (roster)','Active','Lessons','Contributions']);
 const by=id=>rows.find(r=>r[0]===id);
 const e=by('5-A:gryffindor:0');assert.equal(e[1],'Emobi Nese');assert.equal(e[5],2);assert.equal(e[6],5);assert.equal(e[7],1);assert.equal(e[8],1);assert.equal(e[11],'Old Name · Emobi Nese');assert.equal(e[12],'Gryffindor · Hufflepuff');
 assert.equal(by('twin-a')[6],1);assert.equal(by('twin-b')[6],4);assert.equal(by('twin-b')[4],'No');
 assert.equal(rows[rows.length-1][0],'(unmatched)');assert.equal(rows[rows.length-1][1],'Nobody Known');
});

await test('The Finale names students by ID: a rename joins up, two students who share a name stay two, today\'s roster name is shown',()=>{
 const S=require('../public/vixar-saga.js');
 const names=S.finaleNames({contributions:[{team:'gryffindor',name:'Old',contributions:2},{team:'gryffindor',name:'Old',studentId:'g0',contributions:3},{team:'gryffindor',name:'Twin',studentId:'a',contributions:1},{team:'gryffindor',name:'Twin',studentId:'b',contributions:4}],
  merge:[{team:'gryffindor',student:'Old',studentId:'g0',kind:'brand',result:'right'},{team:'gryffindor',student:'Twin',studentId:'a',kind:'rune',result:'wrong'}],current:{g0:'New'}});
 same(names.gryffindor,[{name:'New',id:'g0',gave:['5 contributions','Broke the Scarlet Brand']},{name:'Twin',id:'b',gave:['4 contributions']},{name:'Twin',id:'a',gave:['1 contribution']}]);
 const extras=S.cleanExtras({contributions:[{team:'gryffindor',name:'A',studentId:'5-A:gryffindor:0',contributions:2,sessionId:'s'}],merge:[{team:'ravenclaw',student:'B',studentId:'x',kind:'rune',result:'right'}]});
 assert.equal(extras.contributions[0].studentId,'5-A:gryffindor:0');assert.equal(extras.merge[0].kind,'rune');
});

await test('Apps Script: what the Finale needs carries student IDs (contributions, navigators, saga answers)',()=>{
 const gas=makeGas();
 gas.post({type:'SAGA_SAVE',pin,className:'6-C',saga:{stage:'Scarlet',fightSessions:['f1'],updatedAt:Date.now()}});
 gas.post({type:'LEADERBOARD_FINAL',pin,className:'6-C',sessionId:'f1',standings:[],studentContributions:{everyone:{gryffindor:[{id:'6-C:gryffindor:1',name:'Silep',awards:4}],slytherin:[],hufflepuff:[],ravenclaw:[]}}});
 const r=gas.post({type:'ISLAND_GET',pin,className:'6-C'});
 same(r.sagaExtras.contributions.map(c=>[c.name,c.studentId,c.contributions]),[['Silep','6-C:gryffindor:1',4]]);
});
console.log(JSON.stringify({checks}));
})().catch(error=>{console.error(error);process.exit(1);});
