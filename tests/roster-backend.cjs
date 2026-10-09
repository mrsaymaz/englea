const assert=require('assert/strict'),fs=require('fs'),path=require('path');const {makeGas}=require('./roster-gas-harness.cjs');const fixture=require('./fixture.cjs');
(async()=>{const g=makeGas(),pin='8642';
// v12.0.0: only the site (with the server key) reaches the PIN check; the PIN and the key live in Script properties.
assert.equal(g.raw({type:'ROSTER_GET',pin}).code,'server-key','no server key: refused before the PIN is checked');
assert.equal(g.raw({type:'ROSTER_GET',pin,serverKey:'guess'}).code,'server-key');
let initial=g.post({type:'ROSTER_GET',pin:'wrong'});assert.equal(initial.status,'unauthorized');assert.equal(g.sheets.has('Roster'),false);
assert.deepEqual(g.post({type:'AUTH_CHECK',pin}),{status:'success',authVersion:1});assert.equal(g.post({type:'AUTH_CHECK',pin:'1'}).status,'unauthorized');
// No names in the code: a new Roster tab starts with its headers only; the teacher's class lists are saved into it.
initial=g.post({type:'ROSTER_GET',pin});assert.equal(initial.students.length,0);assert.equal(initial.version,1);assert.deepEqual(g.sheets.get('Roster').rows,[['Student ID','Class','Student','Team','Active']]);
const seeded=g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:fixture.roster});assert.equal(seeded.status,'success');assert.equal(seeded.students.length,120);assert.equal(seeded.version,2);
initial=g.post({type:'ROSTER_GET',pin});assert.equal(initial.students.length,120);assert.deepEqual(g.sheets.get('Leaderboard').rows[1],['existing lesson']);assert.deepEqual(g.post({type:'ROSTER_GET',pin}),initial);
const next=structuredClone(initial.students),p=next.find(p=>p.name==='Cilef');p.teamId='gryffindor';p.name='Cilef Nug';next.push({id:'student-new',name:'Yeni Öğrenci',className:'5-C',teamId:'slytherin',active:true});
const saved=g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:next});assert.equal(saved.status,'success');assert.equal(saved.version,3);assert.equal(saved.students.length,121);assert.equal(saved.students.find(s=>s.id===p.id).teamId,'gryffindor');
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:next}).version,3);
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:initial.revision,students:initial.students}).status,'conflict');
for(const name of ['=IMPORTXML("bad")','<img src=x onerror=alert(1)>']){const bad=structuredClone(next);bad[0].name=name;assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:bad}).status,'error');}
assert.equal(g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:next.slice(1)}).status,'error');
next[0].active=false;const removed=g.post({type:'ROSTER_SAVE',pin,revision:saved.revision,students:next});assert.equal(removed.status,'success');assert.equal(removed.students[0].active,false);
g.active('Roster');const before=JSON.stringify(g.sheets.get('Roster').rows);
const result=g.post({type:'FULL_SESSION',pin,className:'5-C',standings:[{name:'Gryffindor',points:100,level:4}],classMissionCompleted:true,winner:'Slytherin',remainingHP:23,damageDealt:210,durationSeconds:30,studentContributions:{teams:{gryffindor:[{name:'A',awards:2},{name:'B',awards:5},{name:'C',awards:3},{name:'D',awards:1}]}}});
assert.equal(result.status,'success');assert.equal(g.sheets.get('Leaderboard').rows[2][8],'B (5) · C (3) · A (2) · D (1)'); // v9.6.0: every contributor, not only three
 assert.deepEqual(g.sheets.get('Leaderboard').rows[0].slice(8,12),['Contributors of Gryffindor','Contributors of Hufflepuff','Contributors of Slytherin','Contributors of Ravenclaw']);assert.equal(g.sheets.get('Battle_Results').rows[2][2],'Slytherin');assert.equal(JSON.stringify(g.sheets.get('Roster').rows),before);assert.equal(g.locked,false);
g.lock(true);assert.equal(g.post({type:'ROSTER_GET',pin}).status,'error');g.lock(false);
// Missing Script properties: a setup message, nothing else answers.
g.properties.delete('TEACHER_PIN');assert.equal(g.post({type:'ROSTER_GET',pin}).code,'setup');g.properties.set('TEACHER_PIN',pin);
// The Netlify function: a signed-in device only; the server key travels from Netlify, never from the browser.
const A=await fixture.auth(),{handleRoster}=await import('../netlify/functions/roster.mjs');let calls=0;
const mock=async(url,options)=>{calls++;assert.ok(url.startsWith('https://script.google.com/'));assert.ok(!url.includes(pin));const body=JSON.parse(options.body);assert.equal(body.serverKey,fixture.SERVER_KEY);return new Response(JSON.stringify(g.post(body)));};
const req=(data,signed=true)=>(signed?A.signed:(u,i)=>new Request(u,i))('https://lesson.example/api/roster',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
let r=await handleRoster(req({type:'ROSTER_GET',pin},false),mock,A.deps);assert.equal(r.status,401);assert.equal(calls,0,'no session: Apps Script is not called');
assert.equal((await (await handleRoster(req({type:'ROSTER_GET',pin}),mock,A.deps)).json()).students.length,121);
assert.equal((await (await handleRoster(req({type:'ROSTER_GET',pin:'bad'}),mock,A.deps)).json()).status,'unauthorized');
const rejected=await handleRoster(req({type:'FULL_SESSION',pin}),mock,A.deps);assert.equal(rejected.status,400);assert.equal(calls,2);
assert.equal((await handleRoster(req({type:'ROSTER_GET',pin}),async()=>{throw Error('network');},A.deps)).status,502);
// Five wrong PINs from one device pause PIN requests for 15 minutes.
for(let i=0;i<4;i++)await handleRoster(req({type:'ROSTER_GET',pin:'bad'}),mock,A.deps);
r=await handleRoster(req({type:'ROSTER_GET',pin}),mock,A.deps);assert.equal(r.status,429);assert.match((await r.json()).message,/15 minutes/);
r=await handleRoster(req({type:'ROSTER_GET',pin}),mock,{...A.deps,now:Date.now()+15*60000+1});assert.equal((await r.json()).students.length,121);
const noKey=await handleRoster(req({type:'ROSTER_GET',pin}),mock,{...A.deps,env:{}});assert.equal((await noKey.json()).code,'setup');
// Nothing in the public code names a real student: the bundle has example names only, the Apps Script none at all.
const gs=fs.readFileSync(path.join(__dirname,'../GOOGLE-APPS-SCRIPT-v12.0.0.gs'),'utf8'),bundle=fs.readFileSync(path.join(__dirname,'../public/student-rosters.js'),'utf8');
assert.doesNotMatch(gs,/DEFAULT_ROSTER|TEACHER_PIN\s*=/);for(const p of fixture.roster.slice(0,20))assert.ok(!gs.includes(`"${p.name}"`)&&!bundle.includes(`'${p.name}'`));
console.log('PASS the server key before the PIN; PIN and key from Script properties; a new Roster tab starts empty (no names in the code); persistence, rename/move/add/remove, stable IDs, conflicts and safe retries, validation, locks; the roster function needs a signed-in device and pauses after five wrong PINs');
})().catch(e=>{console.error(e);process.exit(1)});
