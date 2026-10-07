/* v10.5.1 browser check (Chromium): smoother creature poses.
   - A pose on a team card is square and fitted inside the avatar box by CSS, and showing it measures nothing.
   - Ten pose sheets stay decoded through a lesson in which every team evolves.
   - Island Run still draws the team's creature poses for the runner.
   Frame rates on a slowed CPU are in ../TEST-REPORT-v10.5.1.md. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  const p=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
  await p.route('**/island-runner/app.js*',async r=>{const resp=await r.fetch();let body=await resp.text();const i=body.lastIndexOf('})();');body=body.slice(0,i)+'window.__start=startRun;\n'+body.slice(i);r.fulfill({response:resp,body});});
  await p.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(4,800);});await wait(1500);
  for(const t of ['gryffindor','slytherin','hufflepuff','ravenclaw']){await p.evaluate(t=>__qa.studentAward(t,`5-A:${t}:1`),t);
   for(let i=0;i<20;i++){const s=await p.evaluate(()=>LeagueScenes.active);if(!s)break;await p.evaluate(()=>{if(['evolution','wheel'].includes(LeagueScenes.active))__qa.settleScene();});await wait(300);}await wait(300);}
  const card=await p.evaluate(async()=>{const el=document.querySelector('#mascot-gryffindor .animated-avatar');await CreaturePoses.load('gryffindor',el.dataset.avatarLevel);
   let n=0;const keep={};for(const k of ['clientWidth','clientHeight'])keep[k]=Object.getOwnPropertyDescriptor(Element.prototype,k);
   for(const k of ['clientWidth','clientHeight'])Object.defineProperty(Element.prototype,k,{configurable:true,get(){n++;return keep[k].get.call(this);}});
   const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){n++;return rect.call(this);};
   CreaturePoses.show(el,'proud',{duration:3000,priority:99});const reads=n;
   for(const k of ['clientWidth','clientHeight'])Object.defineProperty(Element.prototype,k,keep[k]);Element.prototype.getBoundingClientRect=rect;
   const r=el.getBoundingClientRect(),l=el.querySelector('.creature-pose-layer').getBoundingClientRect();
   return {reads,square:Math.round(l.width)===Math.round(l.height),fits:Math.round(l.width)===Math.round(Math.min(r.width,r.height)),centred:Math.abs((l.left-r.left)-(r.right-l.right))<1.5,pose:el.dataset.creaturePose,diag:CreaturePoses.diagnostics()};});
  assert.deepEqual({reads:card.reads,square:card.square,fits:card.fits,centred:card.centred,pose:card.pose},{reads:0,square:true,fits:true,centred:true,pose:'proud'});
  assert.equal(card.diag.maxSheets,10);assert(card.diag.cached>6&&card.diag.cached<=10,JSON.stringify(card.diag));
  console.log(`PASS a pose on a team card is square, fitted and centred by CSS and measures nothing; ${card.diag.cached} pose sheets stay decoded (up to 10)`);

  await p.evaluate(()=>__qa.arena());await wait(1500);
  for(let i=0;i<80;i++){const st=await p.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await p.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(500);}
  await p.evaluate(()=>LeagueIslandRun.open());await p.waitForFunction(()=>LeagueIslandRun.state.ready,{},{timeout:30000});
  const f=p.frames().find(x=>x.url().includes('island-runner'));
  await f.evaluate(()=>window.__start(1,false));await wait(3000);
  const drawn=await f.evaluate(async()=>{const P=window.CreaturePoses,orig=P.draw;let ok=0,all=0;P.draw=function(...a){all++;const r=orig.apply(this,a);if(r)ok++;return r;};
   await new Promise(r=>setTimeout(r,1500));P.draw=orig;return {ok,all};});
  assert(drawn.ok>10&&drawn.ok===drawn.all,JSON.stringify(drawn));
  console.log(`PASS Island Run draws the runner’s creature poses (${drawn.ok} pose frames in 1.5 s)`);
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
