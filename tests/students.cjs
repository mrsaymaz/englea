const assert=require('assert/strict'),fs=require('fs');
const {setup}=require('./support.cjs');
(async()=>{
 const e=await setup(),passes=[],pass=s=>{passes.push(s);console.log('PASS',s);};
 try{
  const board=await e.page();await board.evaluate(()=>{__qa.start();__qa.mode('light');});
  const phone=await e.page();await phone.setViewportSize({width:390,height:844});
  let dropped=false,dropNext=false;
  await phone.exposeFunction('__send',async data=>{if(!board.isClosed())await board.evaluate(data=>window.__receive(data),data);});
  await board.exposeFunction('__send',async data=>{if(dropNext&&data.type==='ACTION_ACK'){dropNext=false;dropped=true;return;}if(!phone.isClosed())await phone.evaluate(data=>window.__receive(data),data);});
  const openPhone=()=>phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await openPhone();await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
  const state=()=>board.evaluate(()=>__qa.state());
  const pickClass=async c=>{await phone.locator('#mobile-class-btn').click();await phone.locator(`[data-class-name="${c}"]`).click();await phone.waitForFunction(c=>__qa.state().remoteStudentClass===c,c);await phone.waitForFunction(()=>__qa.state().remotePending===0);await phone.evaluate(()=>document.getElementById('island-cloud-dialog')?.close());};
  const plus=async t=>phone.locator(`.mobile-score-button.add[onclick*="'${t}'"]`).click();
  const student=async id=>{await phone.locator(`.student-name-choice[data-student-id="${id}"]`).click();await phone.waitForFunction(()=>__qa.state().remotePending===0);};
  const counts={'5-A':[7,7,6,6],'5-C':[6,7,6,7],'6-C':[5,6,5,5],'7-A':[6,6,6,6],'8-B':[6,6,5,6]};
  const classPointDefaults={'5-A':[0,10],'5-C':[0,10],'6-C':[1,100],'7-A':[2,1000],'8-B':[3,10000]};
  let total=0;
  for(const [c,expected] of Object.entries(counts)){
   await pickClass(c);
   assert.deepEqual([(await state()).tierIndex,(await state()).pointValue],classPointDefaults[c]);
   const roster=await phone.evaluate(c=>LeagueStudents.teams.map(t=>LeagueStudents.members(c,t)),c);
   assert.deepEqual(roster.map(t=>t.length),expected);total+=roster.flat().length;
   for(const members of roster){
    await plus(members[0].teamId);
    assert.deepEqual(await phone.locator('.student-name-choice strong').allTextContents(),members.map(p=>p.name));
    assert.deepEqual((await state()).points,[0,0,0,0]);
    await phone.getByRole('button',{name:'Cancel',exact:true}).click();
   }
  }
  await board.locator('.point-tier-btn[data-tier-index="0"]').click();
  assert.deepEqual([(await state()).tierIndex,(await state()).pointValue],[0,10]);
  assert.equal((await state()).selectedClass,'8-B');
  pass('Class selection chooses the grade point tier automatically and the teacher can still override it manually');
  const correctedRosters=await phone.evaluate(()=>({
   fiveCSlytherin:LeagueStudents.members('5-C','slytherin').map(person=>person.name),
   eightBSlytherin:LeagueStudents.members('8-B','slytherin').map(person=>person.name),
   eightBRavenclaw:LeagueStudents.members('8-B','ravenclaw').map(person=>person.name)
  }));
  assert.ok(correctedRosters.fiveCSlytherin.includes('Cemile'));
  assert.ok(correctedRosters.eightBSlytherin.includes('Muhammed B.'));
  assert.ok(!correctedRosters.eightBSlytherin.includes('Hasan Hüseyin'));
  assert.ok(correctedRosters.eightBRavenclaw.includes('Hasan Hüseyin'));
  assert.ok(!correctedRosters.eightBRavenclaw.includes('Muhammed B.'));
  assert.equal(total,120);pass('All 120 students across 20 rosters appear only in their corrected class and team; cancelling adds no points');
  await board.evaluate(()=>__qa.reset());await phone.waitForFunction(()=>!__qa.state().remoteStudentClass);
  await plus('gryffindor');assert.equal(await phone.locator('#student-picker').getAttribute('data-kind'),'class');
  await phone.screenshot({path:'output/classes-390.png'});
  await phone.locator('[data-class-name="5-A"]').click();
  await phone.waitForSelector('#student-picker[data-kind="student"][open]');
  await phone.screenshot({path:'output/students-390.png'});
  assert.equal((await state()).selectedClass,'5-A');assert.deepEqual((await state()).points,[0,0,0,0]);
  dropNext=true;await student('5-A:gryffindor:0');
  assert.ok(dropped);assert.equal((await state()).points[0],10);
  assert.deepEqual((await state()).studentContributions['5-A:gryffindor:0'],{points:10,awards:1});
  assert.equal((await state()).mission.progress,1);
  assert.equal(await board.locator('#constellation-gryffindor .teamwork-star').count(),1);
  assert.match(await board.locator('#team-gryffindor .student-contribution-badge').textContent(),/Elif Naz/);
  await board.screenshot({path:'output/board-student.png'});
  pass('First + guides class → student; a lost receipt retries score and student credit exactly once');
  await plus('gryffindor');
  assert.equal(await phone.locator('.student-name-choice[data-student-id="5-A:gryffindor:0"] span').textContent(),'1 contribution');
  assert.equal(await phone.locator('.student-name-choice[data-student-id="5-A:gryffindor:1"] span').textContent(),'0 contributions');
  await student('5-A:gryffindor:1');
  assert.deepEqual((await state()).studentContributions['5-A:gryffindor:1'],{points:30,awards:1});assert.equal((await state()).points[0],40);
  const countRanking=await board.evaluate(()=>LeagueStudents.ranked('5-A','gryffindor',{
   '5-A:gryffindor:0':{points:1000,awards:1},'5-A:gryffindor:1':{points:20,awards:2}
  }));
  assert.deepEqual(countRanking.map(person=>[person.name,person.awards,person.rank]),[['Sümeyye',2,1],['Elif Naz',1,2]]);
  pass('Student picker shows contribution counts and rankings use participation frequency instead of points');
  await phone.locator('#mobile-class-btn').click();assert.ok(await phone.locator('[data-class-name="5-C"]').isDisabled());await phone.getByRole('button',{name:'Cancel',exact:true}).click();
  const before=await state();await board.evaluate(()=>{__qa.command('ADD','gryffindor',1,'invalid',undefined,{studentId:'5-A:slytherin:0'});__qa.command('ADD','gryffindor',2,'invalid',undefined,{className:'5-C',studentId:'5-C:gryffindor:0'});__qa.command('SET_CLASS',null,3,'invalid',undefined,{className:'5-C'});});
  assert.deepEqual((await state()).points,before.points);assert.deepEqual((await state()).studentContributions,before.studentContributions);assert.equal((await state()).selectedClass,'5-A');
  pass('Combo points go to the selected student; wrong team, wrong class and class changes after scoring are rejected');
  await board.locator('#undo-btn').click();assert.equal((await state()).points[0],10);assert.equal((await state()).studentContributions['5-A:gryffindor:1'],undefined);assert.equal(await board.locator('.student-contribution-badge').count(),0);
  assert.equal((await state()).mission.progress,1);
  assert.equal(await board.locator('#constellation-gryffindor .teamwork-star').count(),1);
  const earnedBeforeReset=(await state()).studentContributions;
  await board.evaluate(()=>__qa.resetTeam('gryffindor'));assert.equal((await state()).points[0],0);assert.deepEqual((await state()).studentContributions,earnedBeforeReset);
  assert.equal((await state()).mission.progress,1);
  assert.equal(await board.locator('#constellation-gryffindor .teamwork-star').count(),1);
  assert.match(await board.locator('#ticker-text').textContent(),/contributions were preserved/i);
  await board.locator('#undo-btn').click();assert.equal((await state()).points[0],10);assert.deepEqual((await state()).studentContributions,earnedBeforeReset);
  pass('Team reset clears the live score but preserves earned student contributions; Undo restores the team state without changing them');
  await board.evaluate(()=>__qa.record());await phone.waitForFunction(()=>Boolean(__qa.state().remoteRecords.cachedLeaderboardRecord));
  await phone.evaluate(()=>openTeacherSaveModal());assert.equal(await phone.locator('#teacher-class-input').inputValue(),'5-A');await phone.evaluate(()=>closeTeacherSaveModal());
  const record=await phone.evaluate(()=>__qa.state().remoteRecords.cachedLeaderboardRecord);
  assert.equal(record.className,'5-A');assert.equal(record.studentContributions.metric,'contribution_count');assert.equal(record.studentContributions.teams.gryffindor[0].name,'Elif Naz');
  await phone.locator('#mobile-participation-btn').click();
  assert.equal(await phone.locator('#mobile-participation-modal').isVisible(),true);
  assert.match(await phone.locator('#mobile-participation-meta').textContent(),/Class 5-A.*contribution count/i);
  assert.equal(await phone.locator('.participation-row').count(),1);
  assert.equal(await phone.locator('.participation-count').textContent(),'1×');
  assert.doesNotMatch(await phone.locator('#mobile-participation-body').textContent(),/pts|points/i);
  await phone.getByRole('button',{name:'Done',exact:true}).click();
  pass('Final remote snapshot includes a private count-based participation summary and pre-fills the saved class');
  await phone.reload();await phone.waitForFunction(()=>Boolean(window.__qa)&&LeagueAccess.granted);await openPhone();await board.evaluate(()=>syncStateToController());await phone.waitForFunction(()=>__qa.state().remoteStudentClass==='5-A');
  await board.evaluate(()=>__qa.checkpoint());await board.reload();await board.waitForFunction(()=>Boolean(window.__qa)&&LeagueAccess.granted);await board.evaluate(()=>__qa.start({resume:true}));await board.evaluate(()=>__qa.connect('host'));
  await phone.waitForFunction(()=>__qa.state().remoteStudentClass==='5-A');assert.equal((await state()).studentContributions['5-A:gryffindor:0'].points,10);
  assert.equal((await state()).mission.target,15);assert.equal((await state()).mission.progress,1);
  assert.equal(await board.locator('#constellation-gryffindor .teamwork-star').count(),1);
  pass('Phone and board reload/resume restore class and student credit');
  await board.evaluate(()=>{__qa.reset();__qa.seed(0,9990);__qa.selectClass('8-B');document.querySelector('[data-tier-index="0"]').click();__qa.studentAward('gryffindor','8-B:gryffindor:0');});
  assert.equal((await state()).points[0],11000);assert.equal((await state()).studentContributions['8-B:gryffindor:0'].points,1010);
  await board.evaluate(()=>__qa.command('SUBTRACT','gryffindor',1,'penalty'));assert.equal((await state()).points[0],10990);assert.equal((await state()).studentContributions['8-B:gryffindor:0'].points,1010);
  pass('Milestone bonus belongs to its triggering student; team deductions preserve earned contributions');
  await board.evaluate(()=>{__qa.reset();__qa.selectClass('7-A');document.getElementById('progression-mode-btn').click();__qa.studentAward('gryffindor','7-A:gryffindor:0');__qa.studentAward('gryffindor','7-A:gryffindor:1');__qa.studentAward('gryffindor','7-A:gryffindor:2');});
  assert.equal(Object.keys((await state()).studentContributions).length,3);assert.match(await board.locator('#team-gryffindor .student-contribution-badge').textContent(),/Evolution ready/);
  await board.evaluate(()=>{document.getElementById('learn-btn').click();document.getElementById('team-select').value='slytherin';document.getElementById('custom-points-input').value='120';document.getElementById('custom-points-form').requestSubmit();});
  await board.locator('[data-student-id="7-A:slytherin:0"]').click();assert.equal((await state()).studentContributions['7-A:slytherin:0'].points,120);
  pass('Hard mode records every student and positive custom awards use the name picker');
  await board.evaluate(()=>{__qa.reset();__qa.seed(0,0);__qa.selectClass('5-A');for(const team of LeagueStudents.teams)for(const person of LeagueStudents.members('5-A',team)){
   __qa.creditCustom(team,person.id,100);
  }});
  assert.equal((await state()).mission.progress,15);assert.equal((await state()).mission.completed,true);
  assert.equal(await board.locator('.teamwork-star').count(),26);
  await board.waitForFunction(()=>LeagueScenes.active==='unity');await board.evaluate(()=>LeagueScenes.skip());
  await board.waitForFunction(()=>!LeagueScenes.active);
  const rankings=await board.evaluate(()=>LeagueStudents.ranked('5-A','gryffindor',__qa.state().studentContributions));assert.equal(rankings.length,7);assert.ok(rankings.every(p=>p.rank===1));
  await board.evaluate(()=>{__qa.arena();LeagueScenes.skip();});await board.waitForFunction(()=>LeagueScenes.active==='results');
  assert.ok(await board.locator('#arena-contributors .contributor-name').count()>0);assert.ok(await board.locator('#league-contributors .contributor-name').count()>0);
  assert.equal(await board.locator('#winner-session-class').textContent(),'CLASS 5-A · PARTICIPATION THIS SESSION');
  assert.equal(await board.locator('.team-recognition-card').count(),4);
  assert.equal(await board.locator('.team-recognition-avatar').count(),4);
  assert.equal(await board.locator('.team-recognition-contributor').count(),12);
  assert.equal(await board.locator('#all-team-recognition-title').textContent(),"Every Team's Contributors");
  await board.waitForTimeout(650);await board.screenshot({path:'output/contributor-champions.png'});
  for(const viewport of [{width:1024,height:600},{width:1366,height:768}]){
   await board.setViewportSize(viewport);assert.equal(await board.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await board.locator('#play-again-btn').scrollIntoViewIfNeeded();assert.ok(await board.locator('#play-again-btn').isVisible());
  }
  pass('Champions show ranked names, shared first places and class, with a reachable New Session control');
  await board.locator('#play-again-btn').click();await phone.waitForFunction(()=>__qa.state().remoteStudentClass===null);assert.deepEqual((await state()).studentContributions,{});
  assert.equal((await state()).mission.progress,0);assert.equal(await board.locator('.teamwork-star').count(),0);
  await pickClass('6-C');await plus('slytherin');
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
   await phone.setViewportSize(viewport);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const button of await phone.locator('.student-name-choice').all()){const box=await button.boundingBox();assert.ok(box.width>=100&&box.height>=44);await button.scrollIntoViewIfNeeded();}
   await phone.screenshot({path:`output/student-picker-${viewport.width}.png`});
  }
  await phone.getByRole('button',{name:'Cancel',exact:true}).click();await phone.setViewportSize({width:390,height:844});await phone.screenshot({path:'output/remote-students-390.png'});
  await plus('slytherin');await board.evaluate(()=>__qa.reset());await phone.waitForFunction(()=>__qa.state().remoteStudentClass===null);assert.equal(await phone.locator('#student-picker').isVisible(),false);
  pass('New sessions clear class/totals and stale pickers; student touch targets fit phone and landscape screens');
  assert.deepEqual(e.errors,[]);assert.deepEqual(e.missing,[]);
  fs.writeFileSync('output/student-results.json',JSON.stringify({passes,errors:e.errors,missing:e.missing},null,2));
 }finally{await e.close();}
})().catch(e=>{console.error(e);process.exit(1);});
