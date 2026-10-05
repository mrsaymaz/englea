const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');
(async()=>{
 const e=await setup(),passes=[];const pass=s=>{passes.push(s);console.log('PASS',s);fs.writeFileSync('output/progress.json',JSON.stringify({passes,errors:e.errors,missing:e.missing},null,2));};
 try{
  const p=await e.page();await p.evaluate(()=>__qa.start());await p.evaluate(()=>__qa.mode('light'));
  const state=()=>p.evaluate(()=>__qa.state());
  if(!process.env.REMOTE_ONLY){
  await p.evaluate(()=>{__qa.selectClass('5-A');__qa.connect('host');});
  await p.evaluate(()=>{__qa.command('ADD','gryffindor',1);__qa.command('ADD','gryffindor',1);});
  assert.equal((await state()).points[0],10);assert.equal((await state()).combo,1);
  await p.reload();await p.waitForFunction(()=>window.__qa);assert.ok(await p.locator('#resume-session-btn').isVisible());await p.evaluate(()=>__qa.start({resume:true}));await p.evaluate(()=>{__qa.connect('host');__qa.command('ADD','gryffindor',1);});
  assert.equal((await state()).points[0],10);assert.equal((await state()).combo,1);pass('Duplicate remote ADD applies once, including after board reload/resume');
  const oldId=(await state()).sessionId;await p.evaluate(()=>__qa.reset());await p.evaluate(id=>__qa.command('ADD','gryffindor',2,'test-client',id),oldId);assert.equal((await state()).points[0],0);assert.notEqual((await state()).sessionId,oldId);pass('Old-session command cannot change a new lesson');
  await p.evaluate(()=>{__qa.mode('animated');__qa.award('gryffindor');__qa.award('slytherin');});await p.waitForFunction(()=>!LeagueScenes.active);
  let s=await state();assert.deepEqual(s.levels,[1,1,0,0]);assert.deepEqual(s.tiers,[40,400,4000,40000]);
  await p.reload();await p.waitForFunction(()=>window.__qa);await p.evaluate(()=>__qa.start({resume:true}));s=await state();assert.deepEqual(s.levels,[1,1,0,0]);assert.deepEqual(s.tiers,[40,400,4000,40000]);pass('Scores, mode, evolved levels, and point economy survive reload');
  await p.evaluate(()=>{__qa.reset();__qa.mode('light');__qa.award('gryffindor');document.querySelector('[data-team-id="gryffindor"].btn-evolution-chest').click();});
  await p.waitForFunction(()=>__qa.state().levels[0]===1);await p.evaluate(()=>__qa.checkpoint());s=await state();assert.equal(s.tiers[0],20);
  await p.reload();await p.waitForFunction(()=>window.__qa);await p.evaluate(()=>__qa.start({resume:true}));assert.equal((await state()).tiers[0],20);assert.equal((await state()).levels[0],1);pass('Reload between chest reveal and close preserves exactly one evolution and multiplier');
  await p.evaluate(()=>{__qa.reset();__qa.mode('animated');__qa.mission();});await p.waitForFunction(()=>LeagueScenes.active==='unity');
  await p.evaluate(()=>SceneRuntime.fastForward('unity',()=>__qa.state().wave>=1,12000));await p.evaluate(()=>__qa.checkpoint());assert.deepEqual((await state()).levels,[1,1,1,1]);
  await p.reload();await p.waitForFunction(()=>window.__qa);await p.evaluate(()=>__qa.start({resume:true}));await p.waitForFunction(()=>LeagueScenes.active==='unity');await p.evaluate(()=>LeagueScenes.skip());await p.waitForFunction(()=>!LeagueScenes.active);s=await state();assert.deepEqual(s.levels,[3,3,3,3]);assert.equal(s.mission.rewardGranted,true);assert.equal(s.tiers[0],40960);pass('Unity resumes its stored reward plan after one wave; no duplicated levels');
  await p.evaluate(()=>{__qa.reset();__qa.mode('light');__qa.queue();});await p.waitForFunction(()=>__qa.state().spin);await p.evaluate(()=>LeagueScenes.pause());s=await state();await p.waitForTimeout(700);assert.equal((await state()).activeWheel.teamId,s.activeWheel.teamId);assert.equal((await state()).paused,true);
  await p.evaluate(()=>{__qa.hidden(true);__qa.hidden(false);});assert.equal((await state()).paused,true);await p.evaluate(()=>LeagueScenes.resume());
  for(let i=0;i<3;i++){
   await p.waitForFunction(()=>Boolean(__qa.state().wheelResult),{},{timeout:10000});
   s=await state();assert.equal(s.wheelTimer,true);assert.equal(await p.locator('#wheel-continue-btn').isVisible(),true);
   await p.locator('#wheel-continue-btn').click();
  }
  await p.waitForFunction(()=>!__qa.state().spin&&!__qa.state().wheels&&!LeagueScenes.active,{},{timeout:10000});pass('Queued Level 5 wheels pause, show a held result, and resume; visibility change cannot undo teacher Pause');
  for(const mode of ['light','animated']){
   await p.evaluate(mode=>{__qa.seed(10);__qa.mode(mode);__qa.arena();},mode);await p.waitForFunction(()=>LeagueScenes.active==='arena');
   if(mode==='light'){
    await p.evaluate(()=>LeagueScenes.pause());const hp=(await state()).battle.hp;await p.waitForTimeout(700);assert.deepEqual((await state()).battle.hp,hp);await p.evaluate(()=>LeagueScenes.resume());
   }
   await p.evaluate(()=>LeagueScenes.skip());await p.waitForFunction(()=>LeagueScenes.active==='results');assert.equal((await state()).battle.running,false);
   assert.equal(await p.locator('#battle-result-details').textContent(),'');
   await p.waitForTimeout(650);await p.screenshot({path:`output/champions-${mode}.png`});await p.evaluate(()=>LeagueScenes.cancel());assert.equal((await state()).scene,null);
   pass(mode+': Arena Skip simulates remaining combat and reaches clean champion results');
  }
  for(const mode of ['light','animated']){
   await p.evaluate(mode=>{__qa.seed(10);__qa.mode(mode);__qa.raid(true);__qa.raidThreshold();},mode);
   await p.evaluate(()=>LeagueScenes.skip());s=await state();assert.equal(s.raid.completed,true);assert.equal(s.raid.hp,0);assert.ok(s.raid.fighters.every(f=>f.alive&&f.hp===f.max));
   await p.screenshot({path:`output/vixar-${mode}.png`});await p.evaluate(()=>LeagueScenes.cancel());assert.equal((await state()).scene,null);assert.equal((await state()).clocks.raid.tasks,0);pass(mode+': VIXAR finale Skip calculates Guardian victory and full revival; Exit clears scene');
  }
  await p.evaluate(()=>{__qa.seed(10);__qa.mode('animated');__qa.raid(false);__qa.raidThreshold();LeagueScenes.skip();});assert.equal((await state()).raid.stage,'defeat');await p.evaluate(()=>LeagueScenes.cancel());pass('Skipping an incomplete-mission raid does not grant Guardian victory');
  }
  const phone=await e.page();await phone.setViewportSize({width:390,height:844});
  await phone.exposeFunction('__send',async data=>{if(!p.isClosed())await p.evaluate(data=>window.__receive(data),data);});
  let drop=true;await p.exposeFunction('__send',async data=>{if(data.type==='ACTION_ACK'&&drop){drop=false;return;}if(!phone.isClosed())await phone.evaluate(data=>window.__receive(data),data);});
  await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await p.evaluate(()=>{__qa.reset();__qa.mode('light');__qa.connect('host');});await phone.waitForFunction(id=>__qa.remoteSession()===id,(await state()).sessionId);
  await phone.locator('#mobile-class-btn').click();await phone.locator('[data-class-name="5-A"]').click();await phone.waitForFunction(()=>__qa.state().remoteStudentClass==='5-A');drop=true;
  await phone.evaluate(()=>__qa.phone('ADD','ravenclaw'));await phone.locator('[data-student-id="5-A:ravenclaw:0"]').click();await phone.waitForFunction(()=>__qa.state().remotePending===0,{},{timeout:10000});assert.equal(await p.evaluate(()=>__qa.points('ravenclaw')),10);pass('Actual phone ACTION → board → lost ACK → retry applies one score and clears pending');
  await p.evaluate(()=>__qa.record());await phone.waitForFunction(()=>Boolean(__qa.state().remoteRecords.cachedLeaderboardRecord));
  await phone.evaluate(async()=>{document.getElementById('teacher-class-input').value='5-A';document.getElementById('teacher-pin-input').value='test';document.getElementById('teacher-record-type').value='FULL_SESSION';await submitOfficialRecordFromMobile();});
  assert.match(await phone.locator('#mobile-save-status').textContent(),/Wait for the Arena result/);assert.equal(await phone.evaluate(()=>LeagueOutbox.list().length),0);pass('Full Session cannot submit an invented Arena outcome while only League results exist');
  await p.evaluate(()=>{__qa.seed(8);__qa.arena();LeagueScenes.skip();});await p.waitForFunction(()=>LeagueScenes.active==='results');await phone.waitForFunction(()=>Boolean(__qa.state().remoteRecords.cachedBattleRecord));
  const record=await phone.evaluate(()=>__qa.state().remoteRecords);assert.ok(record.cachedBattleRecord);assert.ok(record.cachedLeaderboardRecord);pass('Remote retains League and Arena summaries separately');
  assert.equal(await phone.locator('#remote-pause-btn').isVisible(),false);assert.equal(await phone.locator('#remote-skip-btn').isVisible(),false);assert.ok(await phone.locator('.mobile-score-button').first().isDisabled());pass('Remote champion controls show Exit and lock score changes');
  await phone.evaluate(()=>{document.getElementById('mobile-wheel-overlay').classList.add('hidden');});await phone.screenshot({path:'output/remote-390.png'});
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const cards=await phone.locator('.mobile-team-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));assert.ok(cards.every(Boolean));pass('All four remote team cards fit a 390×844 viewport with command status and scene controls');
  await phone.close();
  const attempt=await e.page();assert.deepEqual(await attempt.evaluate(()=>__qa.failedConnection()),{retried:true,lateIgnored:true,state:'reconnecting'});await attempt.close();pass('A channel failure before connection schedules retry and ignores a stale late open');
  assert.deepEqual(e.errors,[]);assert.deepEqual(e.missing,[]);fs.writeFileSync('output/results.json',JSON.stringify({passes,errors:e.errors,missing:e.missing},null,2));console.log('V7 CHECKS PASSED');
 }finally{await e.close();}
})().catch(e=>{console.error(e);process.exit(1)});
