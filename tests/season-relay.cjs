/* v10.0.2 browser check (Chromium): the School League Season reaches the board when the teacher types the PIN on
   the phone (the board does not load islands itself while a phone is connected). The phone's Sheet requests are
   answered by the real Apps Script running in the in-memory spreadsheet harness. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const {makeGas}=require('./roster-gas-harness.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function pair(e,{answer,phoneContext=null,boardContext=null}){
 const board=await e.page(boardContext||await e.browser.newContext({viewport:{width:1366,height:768}}));
 const pctx=phoneContext||await e.browser.newContext({viewport:{width:393,height:660},isMobile:true,hasTouch:true});
 const phone=await e.page(pctx);
 await phone.route('**/api/session',async r=>{const data=JSON.parse(r.request().postData()||'{}');r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(answer(data))});});
 // A message still in flight when the test closes one side is dropped (the real link would be gone too).
 await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d).catch(()=>{}));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d).catch(()=>{}));
 await board.evaluate(()=>{__qa.start();__qa.mode('animated');});
 await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
 await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
 await board.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
 return {board,phone,pctx};
}
async function typePin(phone){
 await phone.waitForFunction(()=>document.getElementById('island-cloud-dialog')?.open,{},{timeout:8000});
 await phone.fill('#island-cloud-pin','8642');await phone.locator('#island-cloud-dialog button[type="submit"]').click();
 await phone.waitForFunction(()=>!document.getElementById('island-cloud-dialog').open,{},{timeout:8000});
}
async function champions(board){
 await board.evaluate(()=>{__qa.seed(10,40);__qa.arena();});await wait(1000);
 for(let i=0;i<40;i++){const st=await board.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await board.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(500);}
 await wait(500);
 return board.evaluate(()=>({data:LeagueSeason.data,foot:document.querySelector('#league-season-panel .season-foot')?.textContent,wins:[...document.querySelectorAll('#league-season-panel .season-wins')].map(n=>+n.textContent)}));
}
(async()=>{
 const e=await setup();
 try{
  // A Sheet with earlier sessions from other classes.
  const gas=makeGas();
  gas.post({type:'FULL_SESSION',pin:'8642',className:'7-A',sessionId:'old-1',standings:[{name:'Ravenclaw',points:90,level:3},{name:'Gryffindor',points:40,level:2}],winner:'Ravenclaw'});
  gas.post({type:'FULL_SESSION',pin:'8642',className:'6-C',sessionId:'old-2',standings:[{name:'Slytherin',points:70,level:3},{name:'Hufflepuff',points:70,level:2}],winner:'Hufflepuff'});
  const current=data=>gas.post(data);

  // 1. PIN typed on the phone: the season reaches the board.
  const one=await pair(e,{answer:current});await typePin(one.phone);
  await one.board.waitForFunction(()=>Boolean(LeagueSeason.data),{},{timeout:8000});
  const shown=await champions(one.board);
  assert.deepEqual(shown.data.wins,{gryffindor:0,slytherin:1,hufflepuff:2,ravenclaw:2});
  assert.match(shown.foot,/2 sessions · 6-C, 7-A/);
  console.log('PASS PIN typed on the phone: the whole school’s season reaches the board’s Champions screen');

  // 2. Next lesson on a board that has no season stored, with a phone that already holds the same season:
  //    the phone still passes it on (an unchanged season used to stay on the phone).
  const pctx=one.pctx;await one.phone.close();await one.board.context().close();
  const fresh=await e.browser.newContext({viewport:{width:1366,height:768}});
  const two=await pair(e,{answer:current,phoneContext:pctx,boardContext:fresh});
  await two.phone.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await two.board.waitForFunction(()=>Boolean(LeagueSeason.data),{},{timeout:8000});
  console.log('PASS a board without the season gets it from a phone that already had it, even when nothing changed');
  await two.board.context().close();await pctx.close();

  // 3. The Sheet still runs an older script: the board says so instead of "Load islands".
  const old=data=>{const r=gas.post(data);delete r.season;delete r.seasonVersion;return r;};
  const three=await pair(e,{answer:old});await typePin(three.phone);await wait(800);
  const stale=await champions(three.board);
  assert.equal(stale.data,null);assert.match(stale.foot,/Update Apps Script to v10\.0\.0/);
  console.log('PASS an older Apps Script is reported on the board: "Update Apps Script to v10.0.0"');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
