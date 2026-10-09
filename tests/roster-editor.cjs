const assert=require('assert/strict'),fs=require('fs');const {setup,fixture}=require('./support.cjs'),{makeGas}=require('./roster-gas-harness.cjs');
(async()=>{const gas=makeGas(),{handleRoster}=await import('../netlify/functions/roster.mjs');let fail=false;
// v12.0.0: the teacher's Roster tab holds the class lists (the fictional fixture here); nothing is seeded from code.
fixture.seedGasRoster(gas);
const e=await setup({rosterHandler:(r,deps)=>handleRoster(r,async(url,options)=>{if(fail)throw Error('offline');return new Response(JSON.stringify(gas.post(JSON.parse(options.body))));},deps)});
try{
 fs.mkdirSync('output',{recursive:true});const board=await e.page();await board.evaluate(()=>{__qa.start();__qa.mode('light');__qa.selectClass('5-A');__qa.studentAward('gryffindor','5-A:gryffindor:0');});
 const phone=await e.page();await phone.setViewportSize({width:393,height:660});
 await phone.exposeFunction('__send',data=>board.evaluate(data=>window.__receive?.(data),data));await board.exposeFunction('__send',data=>phone.evaluate(data=>window.__receive?.(data),data));
 await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
 await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>__qa.state().remoteStudentClass==='5-A');
 const controls=await phone.locator('.mobile-header-actions button').evaluateAll(nodes=>nodes.map(n=>({label:n.textContent,rect:n.getBoundingClientRect().toJSON()})));for(const c of controls){assert.ok(c.rect.x>=0&&c.rect.right<=394,JSON.stringify(c));}
 await phone.screenshot({path:'output/manage-remote.png'});await phone.locator('#mobile-manage-btn').click();await phone.locator('#roster-pin').fill('bad');await phone.locator('#roster-load').click();await phone.waitForFunction(()=>document.getElementById('roster-status').textContent.includes('Invalid PIN'));assert.equal(gas.sheets.get('Roster').getLastRow(),121);
 await phone.locator('#roster-pin').fill('8642');await phone.locator('#roster-load').click();await phone.waitForSelector('#roster-class');assert.equal(gas.sheets.get('Roster').getLastRow(),121);
 await phone.screenshot({path:'output/manage-roster-list.png'});
 await phone.locator('#roster-manager [data-student-id="5-A:gryffindor:0"]').click();await phone.locator('#roster-name').fill('Emobi Nese Yeni');await phone.locator('#roster-team').selectOption('hufflepuff');await phone.screenshot({path:'output/manage-roster-edit.png'});await phone.locator('#roster-save').click();await phone.waitForSelector('#roster-class');
 await board.waitForFunction(()=>LeagueRoster.current()?.version===2);
 assert.equal(await board.evaluate(()=>LeagueStudents.student('5-A','gryffindor','5-A:gryffindor:0').name),'Emobi Nese');assert.equal(await phone.evaluate(()=>LeagueStudents.student('5-A','gryffindor','5-A:gryffindor:0').name),'Emobi Nese');
 assert.equal(await board.evaluate(()=>__qa.state().studentContributions['5-A:gryffindor:0'].awards),1);
 await phone.locator('#roster-add').click();await phone.locator('#roster-name').fill('Deneme Öğrenci');await phone.locator('#roster-team').selectOption('slytherin');await phone.locator('#roster-save').click();await phone.waitForSelector('#roster-class');await board.waitForFunction(()=>LeagueRoster.current()?.version===3);
 const added=await phone.evaluate(()=>LeagueRoster.current().students.find(p=>p.name==='Deneme Öğrenci').id);
 await phone.locator('#roster-manager [data-student-id="5-A:hufflepuff:0"]').click();await phone.locator('#roster-remove').click();await phone.locator('#roster-remove').click();await phone.waitForSelector('#roster-class');await board.waitForFunction(()=>LeagueRoster.current()?.version===4);
 // A stale editor must not overwrite a newer save.
 const online=gas.post({type:'ROSTER_GET',pin:'8642'});online.students[1].name='Süvog Yeni';gas.post({type:'ROSTER_SAVE',pin:'8642',revision:online.revision,students:online.students});
 await phone.locator('#roster-manager [data-student-id="5-A:gryffindor:1"]').click();await phone.locator('#roster-name').fill('Süvog Eski');await phone.locator('#roster-save').click();await phone.waitForFunction(()=>document.getElementById('roster-status').textContent.includes('another device'));assert.equal(gas.post({type:'ROSTER_GET',pin:'8642'}).students[1].name,'Süvog Yeni');
 await phone.getByRole('button',{name:'Reload online',exact:true}).click();await phone.waitForSelector('#roster-class');
 fail=true;await phone.locator('#roster-reload').click();await phone.waitForFunction(()=>document.getElementById('roster-status').textContent.includes('Could not confirm'));fail=false;
 await phone.getByRole('button',{name:'Close',exact:true}).click();
 const hasPin=await phone.evaluate(()=>Object.keys(localStorage).some(k=>localStorage.getItem(k).includes('8642')));assert.equal(hasPin,false);
 // Old active lesson and its identity survive reload even after a newer roster was cached.
 await board.evaluate(()=>__qa.checkpoint());await board.reload();await board.waitForFunction(()=>window.__qa&&LeagueAccess.granted);await board.evaluate(()=>{__qa.start({resume:true});__qa.connect('host');});
 assert.equal(await board.evaluate(()=>LeagueStudents.student('5-A','gryffindor','5-A:gryffindor:0').name),'Emobi Nese');assert.equal(await board.evaluate(()=>__qa.state().studentContributions['5-A:gryffindor:0'].awards),1);
 await board.evaluate(()=>{__qa.reset();__qa.selectClass('5-A');});await phone.waitForFunction(()=>LeagueStudents.student('5-A','hufflepuff','5-A:gryffindor:0')?.name==='Emobi Nese Yeni');
 assert.equal(await board.evaluate(id=>LeagueStudents.student('5-A','slytherin',id)?.name,added),'Deneme Öğrenci');assert.equal(await board.evaluate(()=>LeagueStudents.student('5-A','hufflepuff','5-A:hufflepuff:0')),null);
 await board.evaluate(id=>__qa.studentAward('slytherin',id),added);assert.equal(await board.evaluate(id=>__qa.state().studentContributions[id].awards,added),1);
 await board.locator('#undo-btn').click();assert.equal(await board.evaluate(id=>__qa.state().studentContributions[id],added),undefined);
 await board.locator('#undo-btn').click();assert.equal(await board.evaluate(()=>LeagueStudents.student('5-A','gryffindor','5-A:gryffindor:0').name),'Emobi Nese');
 assert.deepEqual(e.errors,[]);console.log('PASS mobile Manage layout and online add/rename/move/remove, incorrect PIN, conflicts, offline errors, stable active-session records, board/phone sync, next session, recovery and Undo.');
}finally{await e.close();}})().catch(e=>{console.error(e);process.exit(1)});
