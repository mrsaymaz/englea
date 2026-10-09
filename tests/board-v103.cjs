/* v10.3.0 browser check (Chromium): smoother class moments.
   - An award reads no layout while it runs (with or without a ranking change), so the board draws it in one go.
   - The recovery snapshot follows within a second of an award, and at once when the page is hidden.
   - Island Run starts on the board's remembered step: a slow board draws the run at 55% resolution from the
     first frame; a new board draws it sharp.
   - The remembered effects level is applied at start; the board background is not drawn while the Arena shows.
   Frame-rate figures are in ../archive/TEST-REPORT-v10.3.0.md (measured with a slowed CPU; too variable for a pass/fail). */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  const p=await e.page();
  await p.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});await wait(800);
  // Count layout reads made while an award runs.
  const reads=await p.evaluate(async()=>{
   let n=0;const names=[];const wrap=(proto,prop)=>{const d=Object.getOwnPropertyDescriptor(proto,prop);Object.defineProperty(proto,prop,{configurable:true,get(){n++;names.push(prop);return d.get.call(this);}});return ()=>Object.defineProperty(proto,prop,d);};
   const undo=['offsetWidth','offsetHeight','offsetLeft','offsetTop'].map(k=>wrap(HTMLElement.prototype,k));
   const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){n++;names.push('getBoundingClientRect');return rect.call(this);};
   const cs=window.getComputedStyle;window.getComputedStyle=function(...a){n++;names.push('getComputedStyle');return cs.apply(this,a);};
   const out=[];
   for(const [team,id] of [['gryffindor','5-A:gryffindor:0'],['gryffindor','5-A:gryffindor:1'],['slytherin','5-A:slytherin:0'],['slytherin','5-A:slytherin:1'],['ravenclaw','5-A:ravenclaw:0']]){
    n=0;names.length=0;const before=[...document.getElementById('teams-grid').children].map(c=>c.id).join();
    __qa.studentAward(team,id);out.push({team,reads:n,names:[...new Set(names)],reordered:before!==[...document.getElementById('teams-grid').children].map(c=>c.id).join()});
    await new Promise(r=>setTimeout(r,1500));} // awards a moment apart, as in class (a slide still moving is measured)
   undo.forEach(f=>f());Element.prototype.getBoundingClientRect=rect;window.getComputedStyle=cs;return out;});
  assert(reads.some(r=>r.reordered),'the plan includes a ranking change: '+JSON.stringify(reads));
  for(const r of reads)assert.equal(r.reads,0,`${r.team}${r.reordered?' (ranking slide)':''}: ${r.names.join(', ')}`);
  console.log(`PASS ${reads.length} awards (${reads.filter(r=>r.reordered).length} with a ranking slide) read no layout while they run`);

  // Recovery snapshot: within a second after an award, at once when the page is hidden.
  const saved=()=>p.evaluate(()=>LeagueRecovery.read()?.teams?.find(t=>t.id==='hufflepuff')?.points||0);
  const before=await saved();await p.evaluate(()=>__qa.studentAward('hufflepuff','5-A:hufflepuff:0'));
  const at=Date.now();await p.waitForFunction(b=>(LeagueRecovery.read()?.teams?.find(t=>t.id==='hufflepuff')?.points||0)>b,before,{timeout:2000});
  assert(Date.now()-at<1500,'saved soon after the award');
  const mid=await saved();await p.evaluate(()=>{__qa.studentAward('hufflepuff','5-A:hufflepuff:1');Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert((await saved())>mid,'saved at once when the page is hidden');
  console.log('PASS the recovery snapshot is written within a second of an award, and at once when the page is hidden');
  await p.context().close();

  // Island Run: the remembered step. A slow board's next run is drawn at 55% from the first frame.
  const ctx=await e.browser.newContext({viewport:{width:1366,height:768}}),q=await e.page(ctx);
  await q.route('**/island-runner/app.js*',async r=>{const resp=await r.fetch();let body=await resp.text();const i=body.lastIndexOf('})();');body=body.slice(0,i)+'window.__start=startRun;window.__renderer=renderer;\n'+body.slice(i);r.fulfill({response:resp,body});});
  await q.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(8,500);});await wait(500);
  await q.evaluate(()=>__qa.arena());await wait(1200);
  const covering=await q.evaluate(()=>({arena:document.body.classList.contains('arena-covering'),bg:getComputedStyle(document.getElementById('dynamic-background')).visibility}));
  assert.deepEqual(covering,{arena:true,bg:'hidden'},'the board background is not drawn under the Arena');
  for(let i=0;i<60;i++){const st=await q.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await q.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(500);}
  await q.evaluate(()=>LeagueIslandRun.open());await q.waitForFunction(()=>LeagueIslandRun.state.ready,{},{timeout:30000});
  const f=q.frames().find(x=>x.url().includes('island-runner'));
  const width=()=>f.evaluate(()=>{const c=document.getElementById('gameCanvas');return Math.round(c.width/c.clientWidth*100);});
  await f.evaluate(()=>window.__start(1,false));await wait(400);const sharp=await width();
  // A run that keeps going at about 24 frames a second: the board steps down and remembers it.
  const stepped=await f.evaluate(()=>{const qual=window.__renderer.quality;for(let i=0;i<400;i++)qual.sample(1/24,4);return [qual.tier,localStorage.getItem('island-run-quality-v1')].join();});
  assert.equal(stepped,'2,2');
  await f.evaluate(()=>window.__start(1,false));await wait(400);
  const light=await width();
  assert.equal(sharp,100,'a new board draws the run sharp');assert(light>=53&&light<=57,`a slow board starts at 55% (${light}%)`);
  console.log(`PASS Island Run: ${sharp}% resolution on a new board; after a slow run the board remembers its step and the next run starts at ${light}%`);
  await ctx.close();

  // Effects level remembered across lessons.
  const ctx2=await e.browser.newContext({viewport:{width:1366,height:768}});
  await ctx2.addInitScript(()=>{try{localStorage.setItem('englishLeague.effectsBudget.v1','1');}catch{}});
  const r=await e.page(ctx2);
  assert.equal(await r.evaluate(()=>[document.body.dataset.effectsBudget,LeaguePerformance.level].join()),'1,1');
  console.log('PASS the board’s remembered effects level applies from the start of the next lesson');
  await ctx2.close();
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
