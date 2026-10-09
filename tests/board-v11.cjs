/* v11.0.0 browser check (Chromium, board + phone): the Vixar Saga.
   1. The Rift: a short tap does nothing; a 1.5-second hold on the phone opens it; nothing shows on the board until all
      four teams reach the act's level, then the raid sigil appears; Close and reopen.
   2. A loss keeps the stage and the cap, counts an attempt, closes the Rift for the session; Undo never changes the stage.
   3. A win (next session) advances the stage once: the escape plays, the reward panel previews the next forms, the cap
      stays 10 for the rest of the day, and the phone saves the row (queued offline, sent after the Teacher sign-in).
   4. The next session's cap is 11 (Mythic): the badge shows 11, no chest above the cap.
   5. Act III: the Edict and the Merge Spell on the board and the phone; a miss passes to the partner and never names the
      student; the second casting; a partial merge; Merge answers in the Sheets log; the fused fight.
   6. The Finale from the phone (Continue, the English voice), Freed, the epilogue ally, Replay the Finale (no fight).
   7. Session recovery keeps the Rift; a reload mid-fight counts no attempt.
   8. Light mode and reduced motion run the escape and the Finale to the same result.
   9. A Level 11 avatar that fails to load shows the Level 10 form; the phone's saga panel fits an iPhone 14 Pro screen.
  10. Teacher Studio's Finale speech tab: per-grade lines, checked, saved online and used by the board. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  fs.mkdirSync('output',{recursive:true});
  const ctx=await e.browser.newContext({viewport:{width:1366,height:768}});
  const board=await e.page(ctx);
  const phone=await e.page(await e.browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}));
  await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d).catch(()=>{}));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d).catch(()=>{}));
  await board.evaluate(()=>{__qa.start();__qa.mode('animated');LeagueSaga.reset();});
  await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
  const closeDialogs=p=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await board.evaluate(()=>{__qa.selectClass('5-A');__qa.seed(9,1000);});await closeDialogs(board);
  const saga=()=>board.evaluate(()=>__qa.sagaState());
  const panel=()=>phone.evaluate(()=>document.getElementById('mobile-saga-panel').innerText);
  const hold=ms=>phone.evaluate(ms=>new Promise(r=>{const b=document.querySelector('#mobile-saga-panel .saga-hold');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));setTimeout(()=>{b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));r();},ms);}),ms);
  const tap=(p,selector,text)=>p.evaluate(({selector,text})=>{const b=[...document.querySelectorAll(selector)].find(x=>x.textContent.includes(text));if(!b)throw Error('No button '+text);b.click();},{selector,text});

  // 1. The Rift.
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-panel').innerText.includes('5-A · Violet Vixar'));
  assert.match(await panel(),/Level 10: 0 of 4 teams · Class Mission not yet/);assert.match(await panel(),/Offline · the board’s saved copy/);
  const ticker=await board.evaluate(()=>document.getElementById('ticker-text').textContent);
  await hold(300);await wait(500);assert.equal((await saga()).rift,false,'a short tap does nothing');
  await hold(1700);await board.waitForFunction(()=>__qa.sagaState().rift);
  assert.equal((await saga()).sigil,false,'Level 9: nothing on the board');assert.equal(await board.evaluate(()=>document.getElementById('ticker-text').textContent),ticker,'the surprise is kept');
  await board.evaluate(()=>__qa.seed(10,1000));await board.waitForFunction(()=>__qa.sagaState().sigil);
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-panel').innerText.includes('Level 10: 4 of 4 teams'));
  await tap(phone,'#mobile-saga-panel button','Close the Rift');await board.waitForFunction(()=>!__qa.sagaState().rift&&!__qa.sagaState().sigil);
  await phone.waitForSelector('#mobile-saga-panel .saga-hold',{state:'attached'});await hold(1700);await board.waitForFunction(()=>__qa.sagaState().sigil);
  console.log('PASS the Rift: a short tap does nothing; a 1.5 s hold opens it; the sigil appears only with every team at Level 10; close and reopen');

  // 2. A loss.
  await board.evaluate(()=>{__qa.studentAward('gryffindor','5-A:gryffindor:0');__qa.setMission(false);document.getElementById('vixar-raid-btn').click();});
  await board.waitForFunction(()=>__qa.state().raid?.running);await board.evaluate(()=>LeagueScenes.skip());
  await board.waitForFunction(()=>__qa.sagaState().result);
  let s=await saga();assert.equal(s.result,'The Empty Crown Endures');assert.equal(s.row.stage,'Violet');assert.equal(s.row.attempts,1);assert.equal(s.rift,false);assert.equal(s.fought,true);assert.equal(s.cap,10);
  assert.doesNotMatch(await board.evaluate(()=>document.getElementById('vixar-result-subtitle').textContent),/Gryffindor|Slytherin|Hufflepuff|Ravenclaw|5-A:/,'no team or student is named as the reason');
  await board.evaluate(()=>{LeagueScenes.cancel();document.getElementById('undo-btn').click();});await wait(200);
  s=await saga();assert.equal(s.row.stage,'Violet');assert.equal(s.row.attempts,1,'Undo never changes the saga');
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-panel').innerText.includes('has fought today'));
  assert.equal(await phone.locator('#mobile-saga-panel .saga-hold').count(),0,'no Rift for the rest of the session');
  console.log('PASS a loss keeps Violet and Level 10, counts one attempt and closes the Rift until a later session; Undo leaves the saga alone');

  // 3. A win in the next session.
  await board.evaluate(()=>{LeagueScenes.cancel();__qa.reset({saveUndo:false,clearUndo:true,message:'Next lesson'});});
  await board.evaluate(()=>{__qa.selectClass('5-A');__qa.seed(10,1000);__qa.setMission(true);});await closeDialogs(board);
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-panel').innerText.includes('attempt 2'));
  await hold(1700);await board.waitForFunction(()=>__qa.sagaState().sigil);
  await board.evaluate(()=>{document.getElementById('vixar-raid-btn').click();});await board.waitForFunction(()=>__qa.state().raid?.running);
  await board.evaluate(()=>__qa.raidThreshold());await board.waitForFunction(()=>__qa.state().raid?.completed,null,{timeout:15000});
  s=await saga();assert.equal(s.escaping,true,'the escape plays instead of the victory screen');assert.equal(s.result,null);assert.equal(s.row.stage,'Scarlet','the stage advances at the moment of victory');
  await wait(2200);assert.equal(await board.evaluate(()=>document.getElementById('vixar-raid-overlay').classList.contains('saga-cut')),true,'the cut');
  await board.waitForFunction(()=>__qa.sagaState().result,null,{timeout:12000});
  s=await saga();assert.equal(s.result,'The Violet Form Is Broken');assert.match(await board.evaluate(()=>document.getElementById('vixar-result-subtitle').textContent),/Vixar’s first form is broken\. From the next lesson, every team in 5-A can grow to Level 11\./);
  assert.equal(await board.locator('#vixar-result-preview figure').count(),4,'each team’s Level 11 form, once, as a preview');
  await board.screenshot({path:'output/v11-act1-reward.png'});
  assert.equal(s.cap,10,'the cap rises from the next session');assert.equal(s.row.won.Violet>0,true);assert.equal(s.win.from,'Violet');
  await board.evaluate(()=>{LeagueScenes.cancel();__qa.studentAward('gryffindor','5-A:gryffindor:1');});await wait(300);
  assert.equal(await board.evaluate(()=>__qa.state().levelsByTeam.gryffindor),10,'today stays at Level 10');
  await phone.waitForFunction(()=>LeagueOutbox.find('saga:5-A')?.payload.saga.stage==='Scarlet');
  assert.equal(await phone.evaluate(()=>LeagueOutbox.find('saga:5-A').state),'waiting','offline: queued in the outbox');
  let saved=null;await phone.route('**/api/session',async r=>{const body=JSON.parse(r.request().postData());saved=body;await r.fulfill({contentType:'application/json',body:JSON.stringify({status:'success',sagaVersion:1,saga:body.saga})});});
  await phone.evaluate(()=>LeagueTeacher.accepted('8642'));await phone.waitForFunction(()=>LeagueOutbox.find('saga:5-A')?.state==='sent');
  assert.equal(saved.type,'SAGA_SAVE');assert.equal(saved.saga.stage,'Scarlet');assert.equal(saved.className,'5-A');assert.equal(saved.pin,'8642');
  console.log('PASS a win advances Violet → Scarlet once: false victory, the cut, the escape, the reward panel with the Level 11 forms; today stays at Level 10; the row waits offline and is saved after sign-in');

  // 4. The next session: Level 11.
  await board.evaluate(()=>{__qa.reset({saveUndo:false,clearUndo:true,message:'Next lesson'});__qa.selectClass('5-A');__qa.seed(10,1000);});await closeDialogs(board);
  assert.equal((await saga()).cap,11);
  await board.evaluate(()=>__qa.studentAward('ravenclaw','5-A:ravenclaw:0'));await board.waitForFunction(()=>__qa.state().levelsByTeam.ravenclaw===11);
  await board.evaluate(()=>__qa.studentAward('ravenclaw','5-A:ravenclaw:1'));await wait(400);
  assert.equal(await board.evaluate(()=>__qa.state().levelsByTeam.ravenclaw),11,'no chest above the cap');
  const badge=await board.evaluate(()=>({n:document.getElementById('level-ravenclaw').textContent,word:document.querySelector('#level-display-ravenclaw .team-level-badge span').textContent,tier:document.getElementById('level-display-ravenclaw').dataset.tier,mythic:document.getElementById('team-ravenclaw').classList.contains('mythic'),chest:document.getElementById('evolution-chest-ravenclaw').classList.contains('visible'),traits:__qa.team('ravenclaw').traits}));
  assert.deepEqual([badge.n,badge.word,badge.tier,badge.mythic,badge.chest],['11','Mythic','mythic',true,false]);assert(badge.traits.includes('crystal_violet'),'Level 11 wears violet crystal');
  console.log('PASS next session: the cap is 11; Ravenclaw reaches Level 11 (Mythic, violet crystal) and no chest appears above it');

  // 5. Act III: the Edict and the Merge Spell (board and phone).
  await board.evaluate(()=>{__qa.seed(12,1000);__qa.raid(true,'Gilded');});await closeDialogs(board);
  await board.waitForFunction(()=>__qa.state().raid?.running);await wait(300);
  await board.evaluate(()=>__qa.raidHP(.70));await board.waitForFunction(()=>__qa.sagaState().merge?.card,null,{timeout:8000});
  s=await saga();assert.equal(s.edict,true);assert.equal(s.merge.turn.house,'gryffindor');const missed=s.merge.student.name;
  await board.evaluate(()=>{const c=__qa.sagaState().merge.card;document.querySelectorAll('#merge-spell .merge-option')[(c.answer+1)%3].click();});
  s=await saga();assert.equal(s.merge.turn.house,'slytherin');assert.equal(s.merge.turn.rescue,true);
  const banner=await board.evaluate(()=>document.querySelector('#merge-spell .merge-turn').innerText);
  assert.match(banner,/Slytherin can rescue the pair/i);assert(!banner.includes(missed),'the student who missed is not named');
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-live').dataset.mode==='merge');
  await board.waitForFunction(()=>__qa.sagaState().merge.card&&!__qa.sagaState().merge.outcome&&__qa.sagaState().merge.card.id==='merge-2',null,{timeout:6000});
  await phone.waitForFunction(()=>document.querySelectorAll('#mobile-saga-live .saga-remote-btn.option').length>=3);
  const right=(await saga()).merge.card.answer;
  await phone.evaluate(i=>{const opts=[...document.querySelectorAll('#mobile-saga-live button')].filter(b=>/^[ABC]\) /.test(b.textContent));opts[i].click();},right);
  await board.waitForFunction(()=>__qa.sagaState().merge.pairs.slyffindor.correct.slytherin===1);
  console.log(`PASS the Edict at 70%: the Merge Spell; a miss passes the turn to Slytherin (${missed} is not named) and the phone answers the rescue`);
  // Slyffindor fuses; Huffleclaw keeps missing until the circle empties twice: a partial merge.
  for(let i=0;i<30;i++){
   await board.waitForFunction(()=>{const m=__qa.sagaState().merge;return m.done||m.casting===2||(m.card&&!m.outcome);},null,{timeout:8000});
   const m=(await saga()).merge;if(m.done||m.pairs.slyffindor.merged)break;
   await board.evaluate(()=>{const m=__qa.sagaState().merge;__qa.mergeAnswer(['gryffindor','slytherin'].includes(m.turn.house));});
  }
  s=await saga();assert.equal(s.merge.pairs.slyffindor.merged,true);
  await board.waitForFunction(()=>document.querySelector('#merge-spell .merge-slyffindor')?.classList.contains('has-fused-art'),null,{timeout:6000});
  assert.equal(await board.evaluate(()=>document.querySelector('#merge-spell .merge-huffleclaw').classList.contains('fused')),false,'Huffleclaw has not fused');
  await board.evaluate(()=>__qa.mergeExpire());await board.waitForFunction(()=>__qa.sagaState().merge.casting===2);
  assert.equal(await board.evaluate(()=>document.querySelector('#merge-spell .merge-circle').classList.contains('second')),true,'the second casting');
  assert.equal((await saga()).merge.pairs.slyffindor.merged,true,'a fused pair stays fused');
  await board.evaluate(()=>__qa.mergeExpire());await board.waitForFunction(()=>__qa.sagaState().fused.length===1,null,{timeout:8000});
  s=await saga();assert.deepEqual(s.fused,['slyffindor']);
  const fighters=await board.evaluate(()=>[...document.querySelectorAll('.vixar-team-fighter')].map(f=>f.dataset.team));
  assert.deepEqual(fighters.sort(),['hufflepuff','ravenclaw','slyffindor'].sort(),'Slyffindor fights; Hufflepuff and Ravenclaw fight on apart');
  const mergeRows=await board.evaluate(()=>__qa.challengeLog().filter(r=>r.merge));
  assert(mergeRows.length>=5&&mergeRows.every(r=>r.type.startsWith('Merge · ')&&r.level===12&&r.className==='5-A'));assert.equal(new Set(mergeRows.map(r=>r.id)).size,mergeRows.length);
  await board.waitForFunction(()=>document.querySelector('#vixar-team-slyffindor .merged-fighter-art.has-art'),null,{timeout:6000});
  assert.equal(await board.locator('#vixar-team-slyffindor .merged-member').count(),0,'the stand-in creatures leave once the picture loads');
  await board.waitForFunction(()=>document.querySelector('#vixar-team-slyffindor .animated-avatar.merged-art[data-avatar-team="slyffindor"]')?.dataset.creaturePose,null,{timeout:12000});
  const sheetUrl=await board.evaluate(()=>document.querySelector('#vixar-team-slyffindor .merged-art .creature-pose-layer').style.backgroundImage);assert.match(sheetUrl,/assets\/poses\/slyffindor\.webp\?v=11\.0\.0/);
  await board.screenshot({path:'output/v11-fused-fight.png'});
  console.log(`PASS second casting and a partial merge: Slyffindor fused (its picture in the spell and the fight, posed from its own sheet); ${mergeRows.length} Merge answers logged for Google Sheets (no duplicate IDs)`);

  // 6. The Finale from the phone, with the shipped kneeling pose and hug picture.
  await board.evaluate(()=>__qa.raidThreshold());await board.waitForFunction(()=>__qa.sagaState().finale,null,{timeout:20000});
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-live').dataset.mode==='finale');
  await tap(phone,'#mobile-saga-live button','English voice: off');await board.waitForFunction(()=>__qa.sagaState().finale?.voice===true);
  const steps=[];let revealSeen=null,hugSeen=null;for(let i=0;i<20;i++){const v=(await saga()).finale;if(!v)break;steps.push(v.step+(v.line?':'+v.line:''));
   if(v.step==='reveal'){await board.waitForFunction(()=>LeagueSagaScenes.finale.view()?.reveal?.frame>=4,null,{timeout:8000});revealSeen=await board.evaluate(()=>({view:LeagueSagaScenes.finale.view().reveal,frames:[...document.querySelectorAll('.finale-reveal-frame')].map(f=>f.src.replace(/^.*\/|\?.*$/g,'')),loaded:[...document.querySelectorAll('.finale-reveal-frame')].every(f=>f.naturalWidth===640)}));await board.screenshot({path:'output/v11-finale-reveal.png'});}
   if(v.step==='hug'){await board.waitForFunction(()=>document.getElementById('saga-finale').classList.contains('hugging'),null,{timeout:9000});
    await board.waitForFunction(()=>{const h=document.querySelector('.finale-hug');return h&&!h.hidden&&h.querySelector('img')?.complete;},null,{timeout:6000});
    hugSeen=await board.evaluate(()=>({levels:[...document.querySelectorAll('.finale-creature.is-baby .animated-avatar')].map(a=>a.dataset.avatarLevel),zoom:document.getElementById('saga-finale').classList.contains('hug-zoom'),
     pose:document.querySelector('.finale-teacher .saga-teacher-art').dataset.pose,kneelSrc:/mr-saymaz-kneel\.webp/.test(document.querySelector('.finale-teacher .saga-teacher-art img').src),hug:/hug\.webp/.test(document.querySelector('.finale-hug img')?.src||''),inArms:[...document.querySelectorAll('.finale-creature')].every(c=>/scale/.test(c.style.transform))}));
    await board.screenshot({path:'output/v11-finale-hug.png'});}
   await phone.waitForFunction(()=>document.querySelector('#mobile-saga-live button.primary'));await tap(phone,'#mobile-saga-live button.primary','');await wait(250);
   if(v.step==='names'){await board.screenshot({path:'output/v11-finale-names.png'});}}
  assert.deepEqual(steps.filter(x=>!x.startsWith('speech:')),['crack','break','reveal','names','hug','closing']);assert(steps.filter(x=>x.startsWith('speech:')).length>=4,'each speech line is one Continue');
  assert.deepEqual(hugSeen,{levels:['0','0','0','0'],zoom:true,pose:'kneel',kneelSrc:true,hug:true,inArms:true},'the four creatures turn back into their Level 0 selves and jump into his arms as he kneels; the hug illustration follows');assert.equal(revealSeen.frames.length,6);assert.match(revealSeen.frames[0],/bound/);assert.equal(revealSeen.loaded,true,'every reveal frame was ready');assert.equal(revealSeen.view.frames,6);
  s=await saga();assert.equal(s.finale,null);assert.equal(await board.evaluate(()=>LeagueSaga.stageOf('5-A')),'Freed');
  assert.equal(await board.evaluate(()=>document.querySelector('#vixar-raid-btn .saga-ally-portrait img')?.src.includes('mr-saymaz-portrait.webp')),true,'Mr. Saymaz’s portrait as the ally');
  assert.equal(await board.evaluate(()=>document.getElementById('vixar-raid-btn').classList.contains('saga-ally')),true,'the epilogue ally sits where the sigil was');
  await phone.waitForFunction(()=>document.getElementById('mobile-saga-panel').innerText.includes('Replay the Finale'));
  await tap(phone,'#mobile-saga-panel button','Replay the Finale');await board.waitForFunction(()=>__qa.sagaState().finale?.replay===true);
  await board.evaluate(()=>LeagueScenes.skip());assert.equal((await saga()).finale.step,'closing');await board.evaluate(()=>__qa.finaleNext());
  assert.equal(await board.evaluate(()=>LeagueSaga.stageOf('5-A')),'Freed');assert.equal(await board.evaluate(()=>__qa.state().raid),null,'no fight');
  console.log(`PASS the Finale from the phone (${steps.length} steps, English voice on; the reveal reached frame ${revealSeen.view.frame} of 6 before Continue; in the hug the four Level 0 creatures jump into his arms as he kneels, then the hug illustration), 5-A is Freed, Mr. Saymaz’s portrait appears as the ally, and Replay the Finale plays it again with no fight`);

  // 7. Recovery: the Rift survives a reload; a reload mid-fight is not an attempt.
  await board.evaluate(()=>{LeagueScenes.cancel();__qa.reset({saveUndo:false,clearUndo:true,message:'Next lesson'});__qa.saga('Scarlet');__qa.seed(11,1000);__qa.setMission(true);__qa.startRaid();});
  await board.waitForFunction(()=>__qa.state().raid?.running);await board.evaluate(()=>__qa.checkpoint());
  const again=await e.page(ctx);await again.evaluate(()=>__qa.start({resume:true}));await wait(900);
  const restored=await again.evaluate(()=>__qa.sagaState());assert.equal(restored.rift,true);assert.equal(restored.row.attempts,0);assert.equal(restored.row.stage,'Scarlet');assert.equal(restored.sigil,true);
  assert.equal(await again.evaluate(()=>LeagueScenes.active),null);
  console.log('PASS a reload during the Scarlet fight returns to the board with the Rift open; no attempt and no loss');

  // 8. Light mode and reduced motion: the same results.
  await again.emulateMedia({reducedMotion:'reduce'});
  await again.evaluate(()=>{__qa.mode('light');__qa.seed(10,1000);__qa.raid(true,'Violet');__qa.raidThreshold();});
  await again.waitForFunction(()=>__qa.sagaState().result,null,{timeout:20000});
  assert.equal((await again.evaluate(()=>__qa.sagaState())).result,'The Violet Form Is Broken');assert.equal(await again.evaluate(()=>LeagueSaga.stageOf('5-A')),'Scarlet');
  assert.equal(await again.locator('#raid-motion-layer .fx-spark').count(),0);
  await again.evaluate(()=>{LeagueScenes.cancel();__qa.seed(12,1000);__qa.raid(true,'Gilded');__qa.raidHP(.70);});
  await again.waitForFunction(()=>__qa.sagaState().merge?.card,null,{timeout:8000});
  for(let i=0;i<12;i++){await again.waitForFunction(()=>{const m=__qa.sagaState().merge;return !m||m.done||(m.card&&!m.outcome);},null,{timeout:8000});const m=(await again.evaluate(()=>__qa.sagaState())).merge;if(!m||m.done)break;await again.evaluate(()=>__qa.mergeAnswer(true));}
  await again.waitForFunction(()=>__qa.sagaState().fused.length===2,null,{timeout:8000});
  await again.evaluate(()=>__qa.raidThreshold());await again.waitForFunction(()=>__qa.sagaState().finale,null,{timeout:20000});
  assert.equal(await again.evaluate(()=>document.getElementById('saga-finale').classList.contains('still')),true,'still frames');
  const stillSteps=[];let stillReveal=null,stillHug=null;for(let i=0;i<20;i++){const v=(await again.evaluate(()=>__qa.sagaState())).finale;if(!v)break;stillSteps.push(v.step);
   if(v.step==='hug'){await again.waitForFunction(()=>{const h=document.querySelector('.finale-hug');return h&&!h.hidden&&h.querySelector('img')?.complete;},null,{timeout:8000});stillHug=await again.evaluate(()=>({pictures:[...document.querySelectorAll('.finale-creature.is-baby img.animated-sprite')].map(i=>i.src.replace(/^.*\/|\?.*$/g,'')),crests:document.querySelectorAll('.finale-creature svg').length,zoom:document.getElementById('saga-finale').classList.contains('hug-zoom'),pose:document.querySelector('.finale-teacher .saga-teacher-art').dataset.pose,hug:!document.querySelector('.finale-hug').hidden}));}
   if(v.step==='reveal'){const first=v.reveal,src=await again.evaluate(()=>document.querySelector('.finale-reveal-frame')?.src.replace(/^.*\/|\?.*$/g,''));await again.waitForFunction(()=>!document.querySelector('.finale-reveal'),null,{timeout:5000});stillReveal={first,src,after:await again.evaluate(()=>LeagueSagaScenes.finale.view().reveal)};}
   await again.evaluate(()=>__qa.finaleNext());}
  assert.deepEqual(stillReveal.first,{frame:1,frames:1});assert.match(stillReveal.src,/identity-revealed/);assert.equal(stillReveal.after,null,'then the standing pose');
  assert.deepEqual([...new Set(stillSteps)],['crack','break','reveal','speech','names','hug','closing']);
  assert.deepEqual(stillHug,{pictures:['gryffindor-0.webp','slytherin-0.webp','hufflepuff-0.webp','ravenclaw-0.webp'],crests:0,zoom:true,pose:'kneel',hug:true},'the hug shows the creatures’ own Level 0 pictures in Light mode too, Mr. Saymaz kneels and the hug picture appears at once');
  assert.equal(await again.evaluate(()=>performance.getEntriesByType('resource').some(r=>/assets\/poses\/vixar-gilded\.webp/.test(r.name))),false,'Light mode keeps Gilded Vixar a still picture: its pose sheet is not downloaded');
  console.log('PASS Light mode with reduced motion: the escape ends on the same reward, and the Finale keeps every step as still frames (the reveal shows the identity frame, then Mr. Saymaz standing; the hug shows the creatures’ Level 0 pictures in his arms as he kneels, then the hug picture; Gilded Vixar’s pose sheet is not downloaded)');

  // 9. Art fallback and the phone panel's size.
  const p3=await e.page(ctx);await p3.route('**/assets/animated/gryffindor-11.webp*',r=>r.fulfill({status:404,body:''}));
  await p3.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');__qa.saga('Scarlet');__qa.seed(11,1000);});
  await p3.waitForFunction(()=>document.querySelector('#mascot-gryffindor img.animated-sprite')?.dataset.fallback==='10',null,{timeout:8000});
  assert.match(await p3.evaluate(()=>document.querySelector('#mascot-gryffindor img.animated-sprite').src),/gryffindor-10\.webp/);
  await phone.evaluate(()=>{document.getElementById('mobile-more-sheet').hidden=false;});
  const size=await phone.evaluate(()=>{const r=document.getElementById('mobile-saga-panel').getBoundingClientRect();return {h:r.height,w:r.width,vw:innerWidth,vh:innerHeight};});
  assert(size.h>0&&size.h<size.vh*.6&&size.w<=size.vw,'the saga panel fits the screen: '+JSON.stringify(size));
  await phone.screenshot({path:'output/v11-phone-saga-panel.png'});
  console.log(`PASS a missing Level 11 avatar shows the Level 10 form; the phone's saga panel is ${Math.round(size.h)} px tall on a ${size.vw}×${size.vh} screen`);

  // 10. Teacher Studio: the Finale speech per grade.
  const p4=await e.page(ctx);let linesSaved=null;
  await p4.route('**/api/session',async r=>{const body=JSON.parse(r.request().postData()),ok=d=>r.fulfill({contentType:'application/json',body:JSON.stringify({status:'success',...d})});
   if(body.type==='SAGA_LINES_SAVE'){linesSaved=body;return ok({sagaVersion:1,finaleLines:{grade:body.grade,lines:body.lines,at:Date.now()}});}
   if(body.type==='ISLAND_GET')return ok({islandProgress:{},sagaVersion:1,saga:null,sagaExtras:null,finaleLines:null});
   if(body.type==='TEACHING_GET')return ok({unit:body.unit,content:{},revision:'0'.repeat(64),version:0});return ok({});});
  await p4.evaluate(()=>{__qa.start();__qa.selectClass('6-C');document.querySelectorAll('dialog[open]').forEach(d=>d.close());LeagueStudio.open({className:'6-C'});});
  await p4.fill('#studio-pin','8642');await p4.click('#studio-auth button');await p4.waitForSelector('#studio-workspace:not([hidden])',{timeout:8000}).catch(async err=>{console.log('studio status:',await p4.textContent('#studio-status'));throw err;});
  await p4.click('[data-studio-tab="finale"]');await p4.waitForSelector('#studio-finale-lines');
  assert.equal(await p4.inputValue('#studio-finale-lines'),(await p4.evaluate(()=>LeagueSaga.DEFAULT_LINES[6].join('\n'))),'the default Grade 6 lines are shown');
  assert.match(await p4.textContent('#studio-status'),/default lines/);
  await p4.fill('#studio-finale-lines','x'.repeat(170));assert.match(await p4.textContent('.studio-finale-count'),/too long/);
  await p4.click('#studio-finale-save');assert.equal(linesSaved,null,'too-long lines are not sent');
  await p4.fill('#studio-finale-lines','Thank you, 6-C and every class in Grade 6.\n\nYou set me free.\nI will never forget it.');
  await p4.click('#studio-finale-save');await p4.waitForFunction(()=>/Saved online/.test(document.getElementById('studio-status').textContent));
  assert.equal(linesSaved.type,'SAGA_LINES_SAVE');assert.equal(linesSaved.grade,6);assert.equal(linesSaved.className,'6-C');assert.deepEqual(linesSaved.lines,['Thank you, 6-C and every class in Grade 6.','You set me free.','I will never forget it.']);
  assert.deepEqual(await p4.evaluate(()=>LeagueSaga.lines(6)),linesSaved.lines,'this board’s Grade 6 Finale uses the new lines');
  assert.deepEqual(await p4.evaluate(()=>LeagueSaga.lines(5)),await p4.evaluate(()=>[...LeagueSaga.DEFAULT_LINES[5]]),'other grades keep theirs');
  console.log('PASS Teacher Studio · Finale speech: Grade 6 shows the default lines, refuses lines over 160 characters, saves 3 lines online and the board’s Finale uses them');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
