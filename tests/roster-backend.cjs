const assert=require('assert/strict');const {makeGas}=require('./roster-gas-harness.cjs');
(async()=>{const g=makeGas(),pin='2595';let initial=g.post({type:'ROSTER_GET',pin:'wrong'});assert.equal(initial.status,'unauthorized');assert.equal(g.sheets.has('Roster'),false);
initial=g.post({type:'ROSTER_GET',pin});assert.equal(initial.students.length,120);assert.equal(initial.version,1);assert.deepEqual(g.sheets.get('Leaderboard').rows[1],['existing lesson']);assert.deepEqual(g.post({type:'ROSTER_GET',pin}),initial);
const next=structuredClone(initial.students),p=next.find(p=>p.name==='Cemile');p.teamId='gryffindor';p.name='Cemile Nur';next.push({id:'student-new',name:'Yeni Öğrenci',className:'5-C',teamId:'slytherin',active:true});
const saved=g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:next});assert.equal(saved.status,'success');assert.equal(saved.version,2);assert.equal(saved.students.length,121);assert.equal(saved.students.find(s=>s.id===p.id).teamId,'gryffindor');
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:next}).version,2);
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:initial.students}).status,'conflict');
for(const name of ['=IMPORTXML("bad")','<img src=x onerror=alert(1)>']){const bad=structuredClone(next);bad[0].name=name;assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:bad}).status,'error');}
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:next.slice(1)}).status,'error');
next[0].active=false;const removed=g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:next});assert.equal(removed.status,'success');assert.equal(removed.students[0].active,false);
g.active('Roster');const before=JSON.stringify(g.sheets.get('Roster').rows);
const result=g.post({type:'FULL_SESSION',pin,className:'5-C',standings:[{name:'Gryffindor',points:100,level:4}],classMissionCompleted:true,winner:'Slytherin',remainingHP:23,damageDealt:210,durationSeconds:30,studentContributions:{teams:{gryffindor:[{name:'A',awards:2},{name:'B',awards:5},{name:'C',awards:3},{name:'D',awards:1}]}}});
assert.equal(result.status,'success');assert.equal(g.sheets.get('Leaderboard').rows[2][8],'B (5) · C (3) · A (2) · D (1)'); // v9.6.0: every contributor, not only three
 assert.deepEqual(g.sheets.get('Leaderboard').rows[0].slice(8,12),['Contributors of Gryffindor','Contributors of Hufflepuff','Contributors of Slytherin','Contributors of Ravenclaw']);assert.equal(g.sheets.get('Battle_Results').rows[2][2],'Slytherin');assert.equal(JSON.stringify(g.sheets.get('Roster').rows),before);assert.equal(g.locked,false);
g.lock(true);assert.equal(g.post({type:'ROSTER_GET',pin}).status,'error');g.lock(false);
const {handleRoster}=await import('../netlify/functions/roster.mjs');let calls=0;const mock=async(url,options)=>{calls++;assert.ok(url.startsWith('https://script.google.com/'));assert.ok(!url.includes(pin));return new Response(JSON.stringify(g.post(JSON.parse(options.body))));};
const req=data=>new Request('https://lesson.example/api/roster',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
assert.equal((await (await handleRoster(req({type:'ROSTER_GET',pin}),mock)).json()).students.length,121);
assert.equal((await (await handleRoster(req({type:'ROSTER_GET',pin:'bad'}),mock)).json()).status,'unauthorized');
const rejected=await handleRoster(req({type:'FULL_SESSION',pin}),mock);assert.equal(rejected.status,400);assert.equal(calls,2);
assert.equal((await handleRoster(req({type:'ROSTER_GET',pin}),async()=>{throw Error('network');})).status,502);
console.log('PASS automatic 120-student seed, persistence, rename/move/add/remove, stable IDs, conflicts and safe retries, validation, locks, existing leader and battle writes, bridge auth/errors.');
})().catch(e=>{console.error(e);process.exit(1)});
