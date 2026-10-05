/* v9.7.0 browser checks (Chromium): the student award card with ten seal places, no seal chips on team cards,
   one Island Run navigator for the whole session, the phone's student controller popping up, a keyboard on the
   phone steering the runner on the board, and a navigator seal reaching the phone. See ../TEST-REPORT-v9.7.0.md. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  const board=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
  const phone=await e.page(await e.browser.newContext({viewport:{width:393,height:660},isMobile:true,hasTouch:true}));
  await board.route('**/island-runner/app.js*',async r=>{const resp=await r.fetch();let body=await resp.text();const i=body.lastIndexOf('})();');body=body.slice(0,i)+'window.__run=()=>run;window.__start=startRun;\n'+body.slice(i);r.fulfill({response:resp,body});});
  await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d));
  await board.evaluate(()=>{__qa.start();__qa.mode('animated');});
  await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
  await board.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(10,40);});await wait(800);

  // Student award card: ten seal places, the earned ones filled; no points chip and no team seal chip.
  await board.evaluate(()=>LeagueNavigatorSeals.merge('5-A',[{studentId:'5-A:gryffindor:0',student:'Elif Naz',team:'gryffindor',island:1},{studentId:'5-A:gryffindor:0',student:'Elif Naz',team:'gryffindor',island:4}]));
  await board.evaluate(()=>__qa.studentAward('gryffindor','5-A:gryffindor:0'));await wait(400);
  const card=await board.evaluate(()=>{const c=document.querySelector('#team-gryffindor .student-contribution-badge');const g=c?.querySelector('.student-seal-grid');const r=g?.getBoundingClientRect();
   return {name:c?.querySelector('.student-contribution-name')?.textContent,slots:c?.querySelectorAll('.student-seal-slot').length,earned:[...(c?.querySelectorAll('.student-seal-slot.earned')||[])].map(s=>s.title),
    points:c?.querySelectorAll('.student-contribution-points').length,rows:new Set([...(c?.querySelectorAll('.student-seal-slot')||[])].map(s=>Math.round(s.getBoundingClientRect().top))).size,
    inside:Boolean(r&&c.closest('.mascot-area').getBoundingClientRect().bottom>=r.bottom-1),teamChips:document.querySelectorAll('.passport-seals,.mobile-passport-seals').length};});
  assert.deepEqual(card,{name:'Elif Naz',slots:10,earned:['Island 1 · Veyr seal','Island 4 · Rootmaw seal'],points:0,rows:2,inside:true,teamChips:0});
  console.log('PASS the award card shows the student’s name and ten seal places in two rows of five (islands 1 and 4 earned); no points chip, no team seal chips');

  // Contributors on every team, then the arena; the champion's contributors provide the navigator.
  for(const t of ['slytherin','hufflepuff','ravenclaw'])await board.evaluate(t=>__qa.studentAward(t,`5-A:${t}:1`),t);
  await board.evaluate(()=>__qa.studentAward('gryffindor','5-A:gryffindor:2'));await wait(300);
  await board.evaluate(()=>__qa.arena());await wait(1200);
  for(let i=0;i<40;i++){const st=await board.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await board.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(600);}
  assert.equal((await board.evaluate(()=>LeagueIslandRun.open())).ok,true);
  await board.waitForFunction(()=>LeagueIslandRun.state.ready,{},{timeout:20000});
  const f=board.frames().find(x=>x.url().includes('island-runner'));
  const contributors=await board.evaluate(()=>{const w=document.getElementById('island-run-frame').contentWindow.RunnerHost.context;return {house:w.house,navigator:w.navigator,list:LeagueStudents.contributors('5-A',w.house,__qa.state().studentContributions).map(p=>p.name)};});
  assert(contributors.navigator&&contributors.list.includes(contributors.navigator.name),'navigator is a contributor of the champion team');

  // A run starts: the phone's student controller pops up and names the navigator.
  await f.evaluate(()=>window.__start(1,false));
  await phone.waitForFunction(()=>!document.getElementById('mobile-run-pad').hidden,{},{timeout:8000});
  assert.equal(await phone.locator('#mobile-run-pad-navigator').textContent(),'Navigator · '+contributors.navigator.name);
  assert.equal(await f.evaluate(()=>document.getElementById('navigatorName').textContent),contributors.navigator.name);
  console.log('PASS one navigator, a contributor of the Arena champion, is named on the board and on the phone; the student controller pops up when the run starts');

  // A Bluetooth keyboard on the phone steers the runner on the board.
  await f.waitForFunction(()=>window.__run()?.canControl(),{},{timeout:8000});
  const lane=()=>f.evaluate(()=>window.__run().lane);const start=await lane();
  await phone.keyboard.press('ArrowDown');await f.waitForFunction(s=>window.__run().lane===Math.min(2,s+1),start,{timeout:3000});
  await phone.keyboard.press('ArrowUp');await phone.keyboard.press('ArrowUp');await f.waitForFunction(s=>window.__run().lane===Math.max(0,Math.min(2,s+1)-2),start,{timeout:3000});
  await phone.keyboard.press('Space');await f.waitForFunction(()=>window.__run().jumpAge>=0||window.__run().jumpHeight>0,{},{timeout:3000});
  await phone.locator('[data-run-control="down"]').dispatchEvent('pointerdown');await f.waitForFunction(()=>window.__run().lane>=1,{},{timeout:3000});
  console.log('PASS the phone keyboard (↓ ↑ Space) and the big DOWN button steer the runner on the board');

  // A second run keeps the same navigator.
  await f.evaluate(()=>window.__start(1,false));await wait(300);
  assert.equal(await f.evaluate(()=>document.getElementById('navigatorName').textContent),contributors.navigator.name);

  // A completed run's seal: the board keeps it, the phone receives it, and it is announced after Island Run.
  const result=await f.evaluate(()=>window.RunnerHost.seal(2));assert.equal(result.added,true);
  assert.deepEqual(await f.evaluate(()=>window.RunnerHost.seal(2)),{added:false,count:result.count,name:result.name},'the same island is one seal');
  const id=contributors.navigator.id;
  assert((await board.evaluate(id=>LeagueNavigatorSeals.islands('5-A',id),id)).includes(2));
  await phone.waitForFunction(id=>LeagueNavigatorSeals.islands('5-A',id).includes(2),id,{timeout:8000});
  await board.evaluate(()=>LeagueIslandRun.close());
  await board.waitForFunction(()=>document.getElementById('passport-seal-toast')?.classList.contains('visible'),{},{timeout:6000});
  assert.match(await board.locator('#passport-seal-toast strong').textContent(),new RegExp(contributors.navigator.name+' · Island 2'));
  await phone.waitForFunction(()=>document.getElementById('mobile-run-pad').hidden,{},{timeout:5000});
  console.log('PASS a navigator seal is kept on the board, reaches the phone for saving, is announced with the student’s name, and the controller closes with Island Run');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
