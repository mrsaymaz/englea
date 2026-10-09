/* v10.2.0 browser check (Chromium): the Comeback Halo on the board.
   - A finished session decides the halo for the class's next session; the halo teams' points are doubled.
   - A later result can change the halo until the first award, then it stays (also after a reload).
   - The halo sits on the avatar's head at every evolution level, in Animated and Light mode, and follows the avatar
     when it evolves.
   - From Google Sheets via the phone: a board that never played the class gets the halo after the teacher's PIN,
     and the phone shows ×2 on those teams (the real Apps Script runs in the in-memory spreadsheet). */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const {makeGas}=require('./roster-gas-harness.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const halos=p=>p.evaluate(()=>['gryffindor','slytherin','hufflepuff','ravenclaw'].filter(id=>document.querySelector(`#mascot-${id}>.halo-svg`)));
// Where the halo is, compared with the head position for the avatar on screen (in pixels of the picture).
const placement=(p,id)=>p.evaluate(id=>{
 const m=document.getElementById('mascot-'+id),pic=m.querySelector('.animated-avatar:not(.animated-previous)')||m.querySelector(':scope>svg:not(.halo-svg)');
 const r=pic.getBoundingClientRect(),size=Math.min(r.width,r.height),left=r.left+(r.width-size)/2,top=r.top+(r.height-size)/2,box=m.getBoundingClientRect(); // the picture as drawn (it may shrink to make room)
 const avatar=m.querySelector('.animated-avatar:not(.animated-previous)');let x,y;
 if(avatar)[x,y]=LeagueHalo.anchors[id][Number(avatar.dataset.avatarLevel)];else[x,y]=m.querySelector('.halo-svg').dataset.key.split('|').map(Number); // Light: the head top after its traits
 const ring=m.querySelector('.halo-ring').getBoundingClientRect(),text=m.querySelector('.halo-svg text').textContent;
 const badge=m.querySelector('.halo-badge rect').getBoundingClientRect(),title=m.closest('.team-container').querySelector('.team-card-title').getBoundingClientRect();
 return {inside:badge.top>=box.top-1&&badge.top>=title.bottom-1,level:avatar?Number(avatar.dataset.avatarLevel):'light',dx:Math.abs((ring.left+ring.right)/2-(left+x/100*size))/size,gap:((top+y/100*size)-ring.bottom)/size,size,text};
},id);
async function arena(p){
 await p.evaluate(()=>__qa.arena());await wait(1000);
 for(let i=0;i<40;i++){const st=await p.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await p.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(500);}
}
(async()=>{
 const e=await setup();
 try{
  const ctx=await e.browser.newContext({viewport:{width:1366,height:768}}),p=await e.page(ctx);
  await p.evaluate(()=>{__qa.start();__qa.mode('animated');});await wait(300);
  // Session 1 in 5-A: Gryffindor tops the League; the Arena champion is whoever wins the battle.
  await p.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(3,0);
   __qa.creditCustom('gryffindor','5-A:gryffindor:0',400);__qa.creditCustom('slytherin','5-A:slytherin:0',200);__qa.creditCustom('hufflepuff','5-A:hufflepuff:0',100);__qa.creditCustom('ravenclaw','5-A:ravenclaw:0',50);});
  assert.deepEqual(await halos(p),[],'a first session has no halo');
  await arena(p);
  const first=await p.evaluate(()=>({result:LeagueHalo.result('5-A'),session:__qa.state().sessionId}));
  assert.equal(first.result.sessionId,first.session);assert.deepEqual(first.result.league,['gryffindor']);
  const winners=new Set(['gryffindor',first.result.arena]),expected=['gryffindor','slytherin','hufflepuff','ravenclaw'].filter(t=>!winners.has(t));
  console.log('PASS the board records the class’s result when the Arena ends (League: gryffindor, Arena: '+first.result.arena+')');

  // Session 2 in 5-A: the other teams get the halo, and their points are doubled.
  await p.evaluate(()=>{__qa.reset({saveUndo:false});LeagueScenes.leave?.('arena');});await wait(300);
  await p.evaluate(()=>{for(const s of ['arena','results','raid','agent'])try{LeagueScenes.leave(s)}catch{}});
  await p.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});await wait(200);
  assert.deepEqual(await halos(p),expected,'every team that won neither title');
  for(const id of expected){const at=await placement(p,id);assert.equal(at.text,'×2');assert(at.dx<.02&&at.gap>-.02&&at.gap<.06,`${id}: on the head ${JSON.stringify(at)}`);}
  const base=await p.evaluate(()=>__qa.state().pointValue);
  const halo=expected[0],plainTeam=[...winners][0];
  const before=await p.evaluate(()=>__qa.state().pointsByTeam);
  await p.evaluate(id=>__qa.studentAward(id,`5-A:${id}:1`),halo);await wait(200);
  const after=await p.evaluate(()=>__qa.state().pointsByTeam);
  assert.equal(after[halo]-before[halo],2*base,`${halo}: ×2 on its first award`);
  console.log(`PASS next session: ${expected.join(', ')} wear the halo with “×2” on the avatar’s head; ${halo} earns ${2*base} for a ${base}-point award`);

  // Fixed from the first award: a later result no longer changes it, and a reload keeps it.
  await p.evaluate(()=>LeagueHalo.accept('5-A',{sessionId:'other-board',at:Date.now()+5000,league:['gryffindor','slytherin','hufflepuff','ravenclaw'],arena:'gryffindor'}));await wait(100);
  assert.deepEqual(await halos(p),expected,'kept for the whole session');
  await p.evaluate(()=>__qa.checkpoint());
  const again=await e.page(ctx);await again.evaluate(()=>__qa.start({resume:true}));await wait(800);
  assert.deepEqual(await halos(again),expected,'kept after a reload');
  await again.evaluate(id=>__qa.studentAward(id,`5-A:${id}:2`),plainTeam);await wait(150);
  const doubled=await again.evaluate(()=>__qa.state().pointsByTeam);
  await again.evaluate(id=>__qa.studentAward(id,`5-A:${id}:2`),halo);await wait(150);
  const later=await again.evaluate(()=>__qa.state().pointsByTeam);assert((later[halo]-doubled[halo])%2===0&&later[halo]-doubled[halo]>=2*base,'still ×2 after the reload');
  console.log('PASS the halo is fixed from the first award: a later result does not change it, and a reload keeps it');

  // It follows the avatar as it evolves, at every level, and in Light mode.
  const seen=[];
  for(const level of [0,1,2,3,4,5,6,7,8,9,10]){
   await again.evaluate(level=>__qa.seed(level,0),level);await wait(250);
   for(const id of expected){const at=await placement(again,id);seen.push(at);assert.equal(at.level,level,`${id}: shows level ${level}`);assert(at.dx<.02&&at.gap>-.02&&at.gap<.06&&at.inside,`${id} level ${level}: ${JSON.stringify(at)}`);}
  }
  await again.evaluate(()=>__qa.mode('light'));await wait(400);await again.evaluate(()=>__qa.seed(10,0));await wait(300);
  for(const id of expected){const at=await placement(again,id);assert.equal(at.level,'light');assert(at.dx<.02&&at.gap>-.02&&at.gap<.08&&at.inside,`${id} Light: ${JSON.stringify(at)}`);}
  await again.evaluate(()=>__qa.mode('animated'));await wait(300);
  console.log(`PASS the halo stays on the head at evolution levels 0–10 (${seen.length} placements) and on the Light avatars, inside the picture and clear of the team name`);
  await ctx.close();

  // Google Sheets via the phone: a board that never played 5-A.
  const gas=makeGas();
  gas.post({type:'FULL_SESSION',pin:'8642',className:'5-A',sessionId:'sheet-lesson',standings:[{name:'Gryffindor',points:90,level:3},{name:'Slytherin',points:40,level:2}],winner:'Slytherin'});
  const board=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
  const phone=await e.page(await e.browser.newContext({viewport:{width:393,height:660},isMobile:true,hasTouch:true}));
  await phone.route('**/api/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(gas.post(JSON.parse(r.request().postData()||'{}')))}));
  await phone.route('**/api/roster',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(gas.post(JSON.parse(r.request().postData()||'{}')))}));
  await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d).catch(()=>{}));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d).catch(()=>{}));
  await board.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
  assert.deepEqual(await halos(board),[]);
  await phone.evaluate(()=>{LeagueTeacher.start('8642');document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');});
  await phone.evaluate(()=>__qa.connect('controller'));await board.evaluate(()=>__qa.connect('host'));
  await board.waitForFunction(()=>document.querySelectorAll('.halo-svg').length===2,{},{timeout:10000});
  assert.deepEqual(await halos(board),['hufflepuff','ravenclaw']);
  await phone.waitForFunction(()=>document.querySelectorAll('.mobile-halo-chip').length===2,{},{timeout:6000});
  const chips=await phone.evaluate(()=>[...document.querySelectorAll('.mobile-team-card.halo-active .mobile-team-name')].map(n=>n.textContent));
  assert.deepEqual(chips,['Hufflepuff','Ravenclaw']);
  console.log('PASS from Google Sheets: after the teacher’s PIN on the phone, a board that never played 5-A shows the halo on Hufflepuff and Ravenclaw, and the phone marks them ×2');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
