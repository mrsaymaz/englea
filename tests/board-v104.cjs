/* v10.4.0 browser check (Chromium, board + phone): the Challenge Deck on the English wheel.
   - Five awards take a team to Level 5; the English wheel deals a real card from the class's island content, named
     for the student who gave the last point. A wrong answer takes the team back to the moment it reached Level 4
     (points, level, traits); the wheel waits at Level 5 again. A right answer keeps everything.
   - The board's options answer choice cards (Right / Wrong with the correct answer and an explanation); the phone's
     buttons answer them too. Taboo: the phone shows the English word and forbidden Turkish words; the board does not.
   - The manual English wheel deals a practice card (no points change). Each card goes to the Sheets summary and
     the recovery snapshot keeps a wheel whose card is still open. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  const board=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
  const phone=await e.page(await e.browser.newContext({viewport:{width:393,height:760},isMobile:true,hasTouch:true}));
  await phone.exposeFunction('__send',d=>board.evaluate(d=>window.__receive(d),d).catch(()=>{}));await board.exposeFunction('__send',d=>phone.evaluate(d=>window.__receive(d),d).catch(()=>{}));
  await board.evaluate(()=>{__qa.start();__qa.mode('animated');});
  await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
  await board.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.wheelMode('english');});
  await board.waitForFunction(()=>globalThis.RunnerContent?.version===3,{},{timeout:20000});
  const waitCard=async()=>{for(let i=0;i<80;i++){const st=await board.evaluate(()=>({c:LeagueChallenge.active,s:LeagueScenes.active}));if(st.c)break;if(st.s==='evolution')await board.evaluate(()=>{if(LeagueScenes.active==='evolution')__qa.settleScene();});await wait(400);}
   assert(await board.evaluate(()=>LeagueChallenge.active),'a card is dealt: '+JSON.stringify(await board.evaluate(()=>({scene:LeagueScenes.active,w:__qa.wheels(),g:__qa.team('gryffindor'),modal:document.getElementById('wheel-modal').className,log:__qa.challengeLog(),hist:LeagueRecovery.read()?.historyLog?.slice(0,8)}))));await wait(1000);};
  const boardText=()=>board.evaluate(()=>document.getElementById('challenge-overlay').innerText);
  const phoneButtons=()=>phone.evaluate(()=>[...document.querySelectorAll('#mobile-challenge button')].map(b=>b.textContent));
  const tapPhone=label=>phone.evaluate(label=>[...document.querySelectorAll('#mobile-challenge button')].find(b=>b.textContent.startsWith(label)).click(),label);
  const types=["Vocabulary","Grammar","Pronunciation","Speaking","Listening","Sentence Repair","Taboo Description","Translation","Ask a Question"];

  // 1. Five awards from five students: Level 5, the English wheel, a card for the last student.
  for(let i=0;i<5;i++){await board.evaluate(i=>__qa.studentAward('gryffindor','5-A:gryffindor:'+i),i);await wait(700);}
  const atFour=await board.evaluate(()=>__qa.wheels().pending.concat(__qa.wheels().active||[]).find(w=>w.teamId==='gryffindor'));
  assert.equal(atFour.stage,5);assert.equal(atFour.restore.level,4);assert.equal(atFour.restore.traits.length,4);
  const last=await board.evaluate(()=>LeagueStudents.student('5-A','gryffindor','5-A:gryffindor:4').name);assert.equal(atFour.student.name,last);
  await waitCard();
  let view=await board.evaluate(()=>LeagueChallenge.remoteView());
  assert(types.includes(view.type),view.type);assert.equal(view.team,'Gryffindor');assert.equal(view.student,last);
  assert.match(await boardText(),new RegExp(`${last} · Gryffindor[\\s\\S]*Right: keep Level 5 · ✗ Wrong: back to Level 4`));
  await phone.waitForFunction(()=>!document.getElementById('mobile-challenge').hidden);
  assert.equal(await phone.evaluate(()=>document.getElementById('mobile-wheel-title').textContent),'ENGLISH CHALLENGE');
  console.log(`PASS five awards: Level 5 → English wheel → a ${view.type} card for ${last} (the student who gave the last point), on the board and the phone`);

  // Wrong: on the board for a choice card, on the phone for a judged card.
  const pointsAt5=await board.evaluate(()=>__qa.points('gryffindor'));
  if(view.choice){const answer=await board.evaluate(()=>LeagueChallenge.card.answer);await board.click(`.challenge-option[data-index="${(answer+1)%3}"]`);}
  else await tapPhone('✗ Not correct');
  await board.waitForFunction(()=>LeagueChallenge.remoteView()?.outcome==='wrong');await wait(300);
  const afterWrong=await board.evaluate(()=>__qa.team('gryffindor'));
  assert.equal(afterWrong.level,4);assert.equal(afterWrong.points,atFour.restore.points);assert.deepEqual(afterWrong.traits,atFour.restore.traits);
  assert(!afterWrong.wheelMilestonesReached.includes(5),'the wheel waits at Level 5 again');assert(pointsAt5>afterWrong.points);
  let text=await boardText();assert.match(text,/✗ Wrong/);assert.match(text,/Gryffindor goes back to Level 4 and [\d,]+ points\./);
  if(view.choice)assert.match(text,/Correct answer: [ABC]\) /);
  await phone.waitForFunction(()=>document.querySelector('#mobile-challenge .mobile-challenge-result.wrong'));
  await tapPhone('Continue');await board.waitForFunction(()=>!LeagueChallenge.active&&!document.getElementById('wheel-modal').classList.contains('visible'));
  await phone.waitForFunction(()=>document.getElementById('mobile-wheel-overlay').classList.contains('hidden'));
  console.log(`PASS wrong: Gryffindor goes back to the moment it reached Level 4 (${pointsAt5} → ${afterWrong.points} points, four traits); Continue on the phone closes the card and the wheel`);

  // 2. One more award: Level 5 again, the wheel again. Right keeps everything.
  await board.evaluate(()=>__qa.studentAward('gryffindor','5-A:gryffindor:5'));await waitCard();
  view=await board.evaluate(()=>LeagueChallenge.remoteView());const kept=await board.evaluate(()=>__qa.team('gryffindor'));assert.equal(kept.level,5);
  if(view.choice){const answer=await board.evaluate(()=>LeagueChallenge.card.answer);await tapPhone('ABC'[answer]+') ');}
  else await tapPhone('✓ Correct');
  await board.waitForFunction(()=>LeagueChallenge.remoteView()?.outcome==='right');
  assert.deepEqual(await board.evaluate(()=>__qa.team('gryffindor')),kept);assert.match(await boardText(),new RegExp(`✓ Right![\\s\\S]*Gryffindor keeps Level 5 and ${kept.points.toLocaleString('en-US')} points!`));
  await board.click('.challenge-continue');await board.waitForFunction(()=>!LeagueChallenge.active);
  console.log(`PASS Level 5 again → a new wheel; right (${view.type}, answered on the phone) keeps Level 5 and ${kept.points} points`);

  // 3. Taboo: the phone shows the word and the forbidden Turkish words; the board does not show the word.
  await board.evaluate(()=>__qa.challengeWheel('slytherin',5,'Taboo Description'));await waitCard();
  view=await board.evaluate(()=>LeagueChallenge.remoteView());assert.equal(view.type,'Taboo Description');
  const tabooPhone=await phone.evaluate(()=>({word:document.querySelector('.mobile-challenge-word')?.textContent,forbidden:[...document.querySelectorAll('.mobile-challenge-forbidden b')].map(b=>b.textContent)}));
  assert.equal(tabooPhone.word,view.word);assert(tabooPhone.forbidden.length>=1&&tabooPhone.forbidden.includes(view.tr.toLocaleLowerCase('tr')),JSON.stringify(tabooPhone));
  text=await boardText();assert(!text.toLowerCase().includes(view.word.toLowerCase()),'the board does not show the Taboo word');assert(!text.includes(view.tr),'nor its Turkish');
  assert.deepEqual(await phoneButtons(),['✓ Correct','✗ Not correct','Skip card']);
  await tapPhone('✓ Correct');await board.waitForFunction(()=>LeagueChallenge.remoteView()?.outcome==='right');
  await phone.waitForFunction(()=>document.querySelector('#mobile-challenge .mobile-challenge-result.right'));await tapPhone('Continue');await board.waitForFunction(()=>!LeagueChallenge.active);
  console.log(`PASS Taboo: the phone shows “${view.word}” and the forbidden words ${tabooPhone.forbidden.join(', ')}; the board hides them; ✓ on the phone`);

  // 4. Sentence Repair: the wrong word is marked; a late tap for a closed card is refused.
  await board.evaluate(()=>__qa.challengeWheel('hufflepuff',5,'Sentence Repair'));await waitCard();
  const mark=await board.evaluate(()=>({mark:document.querySelector('.challenge-mistake')?.textContent,card:LeagueChallenge.card}));
  assert.equal(mark.mark,mark.card.mistake.word);assert(mark.card.options.includes(mark.mark),'the wrong word is among the options');
  const stale=await board.evaluate(()=>LeagueChallenge.command({op:'choose',index:0,card:999}));assert.equal(stale.ok,false);
  await board.click(`.challenge-option[data-index="${mark.card.answer}"]`);
  text=await boardText();assert.match(text,/✓ Right!/);assert.match(text,/The correct sentence is: “/);
  await board.evaluate(()=>__qa.settleScene());await board.waitForFunction(()=>!LeagueChallenge.active&&!LeagueScenes.active); // the scene bar's Skip after an answer: Continue
  console.log(`PASS Sentence Repair: “${mark.mark}” is marked; a late phone tap for a closed card is refused; the right fix is chosen on the board; the scene bar closes an answered card`);

  // 5. Skip (the phone's Close Wheel or Skip card): nothing changes; the recovery snapshot keeps an open card's wheel.
  await board.evaluate(()=>__qa.challengeWheel('ravenclaw',5,'Grammar'));await waitCard();
  await board.evaluate(()=>__qa.checkpoint());
  assert.deepEqual(await board.evaluate(()=>LeagueRecovery.read().wheels.map(w=>[w.teamId,w.stage])),[['ravenclaw',5]],'saved as not yet spun');
  const ravenclaw=await board.evaluate(()=>__qa.team('ravenclaw'));await tapPhone('Skip card');await board.waitForFunction(()=>!LeagueChallenge.active);
  assert.deepEqual(await board.evaluate(()=>__qa.team('ravenclaw')),ravenclaw);
  console.log('PASS Skip card: nothing changes; while a card is open the recovery snapshot keeps its wheel (it spins again after a reload)');

  // 6. The manual English wheel: a practice card.
  const before=await board.evaluate(()=>__qa.state().pointsByTeam);
  await board.evaluate(()=>{document.getElementById('wheel-btn').click();document.getElementById('spin-btn').click();});await waitCard();
  view=await board.evaluate(()=>LeagueChallenge.remoteView());assert.equal(view.team,'');assert.match(await boardText(),/Practice card/);
  if(view.choice)await board.click('.challenge-option[data-index="0"]');else await tapPhone('✓ Correct');
  await board.waitForFunction(()=>LeagueChallenge.remoteView()?.outcome);assert.match(await boardText(),/Practice card · no points change\./);
  assert.deepEqual(await board.evaluate(()=>__qa.state().pointsByTeam),before);await board.click('.challenge-continue');
  console.log(`PASS the manual English wheel deals a practice card (${view.type}); no points change`);

  // 7. Google Sheets: every card is in the session summary.
  await board.evaluate(()=>{__qa.record();__qa.checkpoint();});
  const rows=await board.evaluate(()=>LeagueRecovery.read().boardSummaries.LEADERBOARD_FINAL.challengeLog);
  assert.deepEqual(rows.map(r=>[r.team,r.result]),[['Gryffindor','wrong'],['Gryffindor','right'],['Slytherin','right'],['Hufflepuff','right'],['Ravenclaw','skipped'],['Practice',rows[5].result]]);
  assert(rows.every(r=>r.className==='5-A'&&types.includes(r.type)&&r.island>=1&&r.island<=10&&/-c\d+$/.test(r.id)));assert.equal(rows[0].student,last);assert.equal(rows[0].level,5);
  console.log(`PASS ${rows.length} cards in the summary for Google Sheets (student, card, word, island, result)`);
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
