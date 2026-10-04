const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');const {setup}=require('./support.cjs');
(async()=>{
 const passes=[],pass=s=>{passes.push(s);console.log('PASS',s);};
 // Drive the actual quality regulator with slow/healthy frame traces and its normal timers.
 let raf=null,timer=null,stamp=0;const body={dataset:{}},document={hidden:false,body,addEventListener(){},dispatchEvent(){}};
 const fake={window:{},document,SceneRuntime:{paused:false},CustomEvent:class{},setTimeout:fn=>(timer=fn,1),clearTimeout:()=>{timer=null},requestAnimationFrame:fn=>(raf=fn,1),cancelAnimationFrame:()=>{raf=null}};
 vm.runInNewContext(fs.readFileSync(require('path').join(require('./support.cjs').root,'performance-budget.js'),'utf8'),fake);
 const perf=fake.window.LeaguePerformance;perf.start();
 function sample(dt){const run=timer;timer=null;assert.ok(run);run();for(let i=0;i<180&&raf;i++){const cb=raf;raf=null;stamp+=dt;cb(stamp);}}
 sample(40);sample(40);assert.equal(perf.level,1);sample(40);sample(40);assert.equal(perf.level,2);assert.equal(perf.limit(12),3);
 sample(16);sample(16);assert.equal(perf.level,2);sample(16);assert.equal(perf.level,1);sample(16);sample(16);sample(16);assert.equal(perf.level,0);perf.stop();
 pass('Adaptive effects step down after sustained slow frames and recover after three healthy samples');
 const e=await setup();try{
  const p=await e.page();let posts=[];
  await p.route('https://script.google.com/**',route=>{posts.push(JSON.parse(route.request().postData()));return route.fulfill({status:200,body:'OK'});});
  await p.evaluate(()=>{LeagueOutbox.configure('https://script.google.com/test',()=>{});Object.defineProperty(navigator,'onLine',{configurable:true,value:false});});
  await p.evaluate(async()=>{const item=LeagueOutbox.add('lesson-one',{type:'FULL_SESSION',className:'5-A',pin:'test-secret',standings:[]});await LeagueOutbox.send(item,'test-secret');});
  assert.equal(posts.length,0);assert.equal(await p.evaluate(()=>LeagueOutbox.find('lesson-one').state),'waiting');assert.ok(!(await p.evaluate(()=>localStorage.getItem('englishLeague.sheets.v7'))).includes('test-secret'));
  await p.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'));});await p.waitForFunction(()=>LeagueOutbox.find('lesson-one').state==='sent');assert.equal(posts.length,1);assert.equal(posts[0].pin,'test-secret');
  await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForTimeout(100);assert.equal(posts.length,1);pass('Offline Sheets result persists without PIN; online sends once and does not repeat');
  await p.reload();await p.waitForFunction(()=>window.__qa);assert.equal(await p.evaluate(()=>LeagueOutbox.find('lesson-one').state),'sent');assert.ok(await p.locator('#open-saved-results-btn').isVisible());pass('Outbox and honest sent status survive reload');
  await p.unroute('https://script.google.com/**');await p.route('https://script.google.com/**',route=>{posts.push('ambiguous');return route.abort('failed');});
  await p.evaluate(async()=>{LeagueOutbox.configure('https://script.google.com/test',()=>{});await LeagueOutbox.send(LeagueOutbox.add('lesson-two',{type:'FULL_SESSION',className:'5-C',standings:[]}), 'never-store');});
  assert.equal(await p.evaluate(()=>LeagueOutbox.find('lesson-two').state),'uncertain');const attempts=posts.length;await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForTimeout(100);assert.equal(posts.length,attempts);assert.ok(!(await p.evaluate(()=>localStorage.getItem('englishLeague.sheets.v7'))).includes('never-store'));pass('Ambiguous Sheets delivery never auto-retries or falsely claims confirmed storage');
  await p.evaluate(()=>{localStorage.setItem('englishLeague.session.v7','{broken');});await p.reload();await p.waitForFunction(()=>window.__qa);assert.equal(await p.locator('#recovery-card').isVisible(),false);await p.evaluate(()=>__qa.start());pass('Malformed recovery data does not prevent a new session');
  await p.evaluate(()=>{__qa.mode('light');__qa.queue();});await p.waitForFunction(()=>__qa.state().spin);await p.evaluate(()=>LeagueScenes.cancel());await p.waitForFunction(()=>!LeagueScenes.active);assert.equal((await p.evaluate(()=>__qa.state())).wheels,2);assert.ok(await p.locator('#continue-scenes').isVisible());await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>LeagueScenes.active),null);await p.locator('#continue-scenes').click();
  for(let i=0;i<2;i++){await p.waitForFunction(()=>Boolean(__qa.state().wheelResult),{},{timeout:10000});await p.locator('#wheel-continue-btn').click();}
  await p.waitForFunction(()=>!__qa.state().wheels&&!__qa.state().spin&&!LeagueScenes.active,{},{timeout:10000});pass('Exit stops the presentation queue; Continue rewards resumes held Level 5 wheel results');
  await p.evaluate(()=>{__qa.seed(10);__qa.mode('animated');__qa.arena();});await p.waitForTimeout(2500);await p.evaluate(()=>LeagueScenes.cancel());await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>LeagueScenes.active),null);assert.equal(await p.evaluate(()=>ArenaMotion.diagnostics().actors),0);assert.equal(await p.evaluate(()=>__qa.state().clocks.arena.tasks),0);pass('Exiting a live Arena cancels its clocks, motion, and stale results');
  await p.evaluate(()=>{__qa.seed(10);__qa.mode('animated');__qa.raid(true);});await p.waitForTimeout(200);await p.evaluate(()=>LeagueScenes.pause());let s=await p.evaluate(()=>__qa.state());await p.waitForTimeout(500);assert.deepEqual((await p.evaluate(()=>__qa.state())).raid,s.raid);await p.evaluate(()=>LeagueScenes.resume());
  await p.evaluate(()=>__qa.raidThreshold());await p.waitForFunction(()=>__qa.state().raid.stage==='fallen');await p.evaluate(()=>LeagueScenes.cancel());await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>__qa.state().clocks.raid.tasks),0);assert.deepEqual(await p.evaluate(()=>RaidMotion.diagnostics()),{actors:0,effects:0});pass('VIXAR Pause preserves state; Exit during final attack clears pending Guardian work');
  const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.evaluate(()=>{__qa.seed(10);__qa.mode('light');__qa.raid(true);__qa.raidThreshold();LeagueScenes.skip();});assert.ok((await p.evaluate(()=>__qa.state())).raid.fighters.every(f=>f.alive&&f.hp===f.max));await p.evaluate(()=>LeagueScenes.cancel());await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});pass('4× CPU throttling preserves finale victory and cleanup');
  for(const viewport of [{width:1024,height:600},{width:390,height:844}]){
   await p.setViewportSize(viewport);await p.reload();await p.waitForFunction(()=>window.__qa);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:`output/startup-${viewport.width}.png`});
  }pass('Readiness and recovery startup fit smartboard and phone widths');
  assert.deepEqual(e.errors,[]);assert.deepEqual(e.missing,[]);fs.writeFileSync('output/resilience-results.json',JSON.stringify({passes,errors:e.errors,missing:e.missing},null,2));
 }finally{await e.close();}
})().catch(e=>{console.error(e);process.exit(1)});
