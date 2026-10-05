/* v10.1.0 browser check (Chromium): the Teacher PIN typed beside the room code signs the teacher in once the board
   allows the phone. Student names, islands, seals and the season then reach the board, and Studio opens without
   another PIN prompt. A wrong PIN asks once and the PIN typed there signs in too. The phone's Sheet requests are
   answered by the real Apps Script running in the in-memory spreadsheet harness. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const {makeGas}=require('./roster-gas-harness.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function sheet(){
 const gas=makeGas(),pin='2595';
 const roster=gas.post({type:'ROSTER_GET',pin});
 const students=roster.students.map(p=>p.className==='5-A'&&p.teamId==='gryffindor'&&p===roster.students.find(q=>q.className==='5-A'&&q.teamId==='gryffindor')?{...p,name:'Deniz Yıldız'}:p);
 assert.equal(gas.post({type:'ROSTER_SAVE',pin,revision:roster.revision,students}).status,'success');
 const first=students.find(p=>p.className==='5-A'&&p.teamId==='gryffindor');
 gas.post({type:'FULL_SESSION',pin,className:'7-A',sessionId:'old-1',standings:[{name:'Ravenclaw',points:90,level:3},{name:'Gryffindor',points:40,level:2}],winner:'Ravenclaw'});
 gas.post({type:'FULL_SESSION',pin,className:'5-A',sessionId:'old-2',standings:[{name:'Slytherin',points:60,level:3}],winner:'Slytherin',
  islandProgress:{'5-A|gryffindor':{1:{score:700,stars:3},2:{score:500,stars:2}}},
  navigatorSeals:[{studentId:first.id,student:'Deniz Yıldız',team:'gryffindor',island:1,sessionId:'old-2'},{studentId:first.id,student:'Deniz Yıldız',team:'gryffindor',island:2,sessionId:'old-2'}]});
 return {gas,first};
}
async function pair(e,gas,typed){
 const board=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
 const phone=await e.page(await e.browser.newContext({viewport:{width:393,height:660},isMobile:true,hasTouch:true}));
 const calls={phone:[],board:[]};
 for(const [name,page] of [['phone',phone],['board',board]])for(const api of ['**/api/session','**/api/roster'])
  await page.route(api,r=>{const data=JSON.parse(r.request().postData()||'{}');calls[name].push(data.type);r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(gas.post(data))});});
 await phone.evaluate(()=>{window.__dialogs=[];const show=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){window.__dialogs.push(this.id);return show.call(this);};});
 // A message still in flight when the test closes one side is dropped (the real link would be gone too).
 await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d).catch(()=>{}));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d).catch(()=>{}));
 // The board starts the lesson and chooses the class before the phone connects (no one awarded yet).
 await board.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
 calls.board.length=0;
 // The phone's opening screen: room code and Teacher PIN, then Connect (startControllerMode reads the same field).
 await phone.evaluate(pin=>{const f=document.getElementById('teacher-pin-startup');f.value=pin;LeagueTeacher.start(f.value);f.value='';
  document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');},typed);
 assert.equal(await phone.evaluate(()=>LeagueTeacher.state),typed?'pending':'none');
 await phone.evaluate(()=>__qa.connect('controller'));await board.evaluate(()=>__qa.connect('host'));
 return {board,phone,calls};
}
(async()=>{
 const e=await setup();
 try{
  // 1. The right PIN: one sign-in, everything loads, no PIN prompt anywhere.
  {const {gas,first}=sheet();const {board,phone,calls}=await pair(e,gas,'2595');
   await phone.waitForFunction(()=>LeagueTeacher.state==='ok'&&/islands/.test(document.getElementById('mobile-teacher-status').textContent),{},{timeout:10000});
   await board.waitForFunction(id=>LeagueStudents.student('5-A','gryffindor',id)?.name==='Deniz Yıldız'&&Boolean(LeagueSeason.data),first.id,{timeout:8000});
   const shown=await board.evaluate(id=>({seals:LeagueNavigatorSeals.rows('5-A').filter(r=>r.studentId===id).length,islands:Object.keys(LeagueIslandProgress.snapshot('5-A')['5-A|gryffindor']).length,wins:LeagueSeason.data.wins}),first.id);
   assert.deepEqual(shown,{seals:2,islands:2,wins:{gryffindor:0,slytherin:2,hufflepuff:0,ravenclaw:2}});
   const onPhone=await phone.evaluate(id=>({name:LeagueStudents.student('5-A','gryffindor',id)?.name,bar:document.getElementById('mobile-teacher-status').textContent,hidden:document.getElementById('mobile-teacher-status').hidden,dialogs:window.__dialogs}),first.id);
   assert.equal(onPhone.name,'Deniz Yıldız','the board’s lesson roster comes back to the phone');assert.equal(onPhone.hidden,false);assert.match(onPhone.bar,/Signed in · names, islands, seals and season loaded/);
   assert.deepEqual(onPhone.dialogs,[],'no PIN prompt after Allow');
   assert.deepEqual([...new Set(calls.phone)].sort(),['ISLAND_GET','ROSTER_GET']);assert.deepEqual(calls.board,[],'the board itself sends nothing to Google Sheets');
   // Studio and Manage reuse the PIN.
   await phone.evaluate(()=>LeagueStudio.open());await phone.waitForFunction(()=>!document.getElementById('studio-workspace').hidden,{},{timeout:8000});
   assert.equal(await phone.evaluate(()=>document.getElementById('studio-auth').hidden),true);
   await phone.evaluate(()=>document.getElementById('studio-close').click());
   // The More sheet shows the signed-in state; the status pill fades after a few seconds.
   assert.equal(await phone.evaluate(()=>document.getElementById('mobile-teacher-btn').textContent),'Teacher signed in ✓');
   await wait(7300);assert.equal(await phone.evaluate(()=>document.getElementById('mobile-teacher-status').hidden),true);
   console.log('PASS the PIN typed beside the room code signs in after Allow: names, islands, seals and the school season reach the board with no PIN prompt; Studio opens without asking again');
   await board.context().close();await phone.context().close();}

  // 2. A wrong PIN: the phone says so and asks once; the PIN typed there signs in too.
  {const {gas,first}=sheet();const {board,phone}=await pair(e,gas,'1111');
   await phone.waitForFunction(()=>LeagueTeacher.state==='error'&&document.getElementById('island-cloud-dialog')?.open,{},{timeout:10000});
   assert.match(await phone.evaluate(()=>document.getElementById('mobile-teacher-status').textContent),/Teacher PIN not accepted/);
   await phone.fill('#island-cloud-pin','2595');await phone.locator('#island-cloud-dialog button[type="submit"]').click();
   await phone.waitForFunction(()=>LeagueTeacher.state==='ok'&&LeagueTeacher.pin==='2595',{},{timeout:8000});
   await board.waitForFunction(id=>LeagueStudents.student('5-A','gryffindor',id)?.name==='Deniz Yıldız'&&Boolean(LeagueSeason.data),first.id,{timeout:8000});
   assert.deepEqual(await phone.evaluate(()=>window.__dialogs),['island-cloud-dialog'],'one prompt only');
   console.log('PASS a wrong PIN is reported on the phone and asked for once; the PIN entered there loads names, islands and the season');
   await board.context().close();await phone.context().close();}

  // 3. No PIN: the earlier behaviour (Load islands asks when the class is known).
  {const {gas}=sheet();const {board,phone}=await pair(e,gas,'');
   await phone.waitForFunction(()=>document.getElementById('island-cloud-dialog')?.open,{},{timeout:8000});
   assert.equal(await phone.evaluate(()=>LeagueTeacher.state),'none');
   console.log('PASS without a PIN the remote works as before and Load islands asks for it');
   await board.context().close();await phone.context().close();}
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
