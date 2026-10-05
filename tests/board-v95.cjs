/* v9.5.0/v9.6.0 browser checks: the board fits common smartboard sizes in Light and Animated (v9.6.0 removed
   Performance), a new leader is crowned quietly (v9.6.0 removed the "takes the lead" banner and the point bubbles),
   Award Custom Points closes, the arena dial and damage layer are bounded and cleaned up, and a shared League title
   lines its champions up. Chromium only; see ../TEST-REPORT-v10.0.0.md. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  for(const mode of ['light','animated'])for(const [w,h] of [[1280,720],[1366,768],[1920,1080]]){
   const ctx=await e.browser.newContext({viewport:{width:w,height:h}}),b=await e.page(ctx);
   await b.evaluate(m=>{__qa.start();__qa.mode(m);},mode);await wait(300);
   await b.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(9,40);});await wait(900);
   const fit=await b.evaluate(()=>({scroll:document.documentElement.scrollHeight-innerHeight,
    controls:[...document.querySelectorAll('.btn-add-points,.btn-reset-team,.point-tier-btn,.wheel-mode-btn')].filter(n=>{const r=n.getBoundingClientRect();return r.top<0||r.bottom>innerHeight+.5||r.right>innerWidth+.5||r.height<1;}).map(n=>n.className.split(' ')[0]),
    addHeight:Math.min(...[...document.querySelectorAll('.btn-add-points')].map(n=>n.getBoundingClientRect().height))}));
   assert.ok(fit.scroll<=0,`${mode} ${w}×${h}: page scrolls by ${fit.scroll}px`);
   assert.deepEqual(fit.controls,[],`${mode} ${w}×${h}: controls off screen`);
   assert.ok(fit.addHeight>=44,`${mode} ${w}×${h}: Add Points under 44 px`);
   await ctx.close();
  }
  console.log('PASS board fits 1280×720, 1366×768 and 1920×1080 in Light and Animated without scrolling; every control on screen');

  const mctx=await e.browser.newContext({viewport:{width:1366,height:768}});await mctx.addInitScript(()=>{try{localStorage.setItem('englishLeaguePerformanceMode','ultra');}catch{}});
  const m=await e.page(mctx);const saved=await m.evaluate(()=>{__qa.start();return document.body.classList.contains('performance-animated');});assert.equal(saved,true,'a saved Performance choice opens Animated');
  await m.evaluate(()=>__qa.mode('ultra'));await wait(300);
  const modes=await m.evaluate(()=>({options:[...document.querySelectorAll('.performance-option')].map(b=>b.dataset.mode),ultra:document.querySelectorAll('[data-mode="ultra"],[onclick*="ultra"]').length,animated:document.body.classList.contains('performance-animated')}));
  assert.deepEqual(modes,{options:['animated','light'],ultra:0,animated:true});
  await m.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
  const open=()=>m.evaluate(()=>document.getElementById('custom-points-modal').classList.contains('visible'));
  await m.evaluate(()=>document.getElementById('learn-btn').click());assert.equal(await open(),true);
  await m.click('#custom-points-close');assert.equal(await open(),false,'the × button closes Award Custom Points');
  await m.evaluate(()=>document.getElementById('learn-btn').click());await m.keyboard.press('Escape');assert.equal(await open(),false,'Escape closes it too');
  await m.context().close();
  console.log('PASS only Animated and Light remain (a saved Performance choice opens Animated); Award Custom Points closes with × and Escape');

  const b=await e.page();await b.evaluate(()=>{__qa.start();__qa.mode('animated');});await wait(300);
  await b.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(3,40);__qa.creditCustom('gryffindor','5-A:gryffindor:0',100);});
  await wait(1900);
  await b.evaluate(()=>__qa.creditCustom('ravenclaw','5-A:ravenclaw:0',500));await wait(250);
  const lead=await b.evaluate(()=>({leader:LeagueBoardFX.leaderOf(),banner:Boolean(document.getElementById('lead-change-banner')),bubbles:document.querySelectorAll('.score-fly,.score-hit,.mobile-score-pop').length,text:/takes the lead/i.test(document.body.innerText)}));
  assert.deepEqual(lead,{leader:'ravenclaw',banner:false,bubbles:0,text:false});
  console.log('PASS a new leader is crowned quietly: no "takes the lead" banner and no point bubbles left behind');

  await b.evaluate(()=>__qa.arena());await wait(2500);
  const arena=await b.evaluate(()=>({layer:Boolean(document.getElementById('arena-fx-layer')),digits:document.querySelector('.arena-dial-digits')?.textContent,clock:document.getElementById('battle-clock').textContent}));
  assert.equal(arena.layer,true);assert.equal(arena.digits,String(Math.ceil(parseFloat(arena.clock))));
  await b.evaluate(()=>{for(let i=0;i<30;i++)LeagueArenaFX.impact('gryffindor',12,{color:'#fff'});});
  assert.ok((await b.evaluate(()=>LeagueArenaFX.diagnostics().numbers))<=8,'at most eight damage numbers');
  for(let i=0;i<40;i++){if(await b.evaluate(()=>LeagueScenes.active==='results'))break;await b.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(600);}
  await wait(400);
  assert.deepEqual(await b.evaluate(()=>LeagueArenaFX.diagnostics()),{numbers:0,layer:false},'arena layer removed after the battle');
  console.log('PASS arena dial mirrors the clock, damage numbers are capped at eight and the layer is removed after the battle');
  await b.context().close();

  const t=await e.page();await t.evaluate(()=>{__qa.start();__qa.mode('animated');});await wait(300);
  await t.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(8,40);});await wait(600);
  await t.evaluate(()=>__qa.arena());
  for(let i=0;i<40;i++){if(await t.evaluate(()=>LeagueScenes.active==='results'))break;await t.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(600);}
  const tie=await t.evaluate(()=>({count:document.getElementById('league-winner-avatars').dataset.tieCount,role:document.querySelector('#league-champion-panel .champion-role').textContent,names:[...document.querySelectorAll('#league-winner-name span')].map(s=>s.textContent),
   rows:new Set([...document.querySelectorAll('#league-winner-avatars .league-winner-avatar')].map(n=>Math.round(n.getBoundingClientRect().top))).size}));
  assert.deepEqual(tie,{count:'4',role:'Shared League Title',names:['Gryffindor','Slytherin','Hufflepuff','Ravenclaw'],rows:1});
  console.log('PASS a four-way League tie shows a Shared League Title with all four champions in one row');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
