/* v10.0.0 browser checks (Chromium): elemental student cards by seal count and team element (moving in Animated
   mode, still in Light), the one-time level-up burst, and the School League Season panel on the Champions screen
   at three board sizes. See ../TEST-REPORT-v10.0.0.md. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const plan={'5-A:gryffindor:0':0,'5-A:slytherin:0':2,'5-A:ravenclaw:0':5,'5-A:hufflepuff:0':8,'5-A:slytherin:1':10};
async function board(e,w,h,mode){
 const p=await e.page(await e.browser.newContext({viewport:{width:w,height:h}}));
 await p.evaluate(m=>{__qa.start();__qa.mode(m);},mode);await wait(300);
 await p.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());__qa.seed(10,40);});await wait(800);
 await p.evaluate(plan=>{for(const [id,n] of Object.entries(plan)){const team=id.split(':')[1];LeagueNavigatorSeals.merge('5-A',Array.from({length:n},(_,i)=>({studentId:id,student:'x',team,island:i+1})));}},plan);
 return p;
}
const card=(p,team)=>p.evaluate(team=>{const c=document.querySelector(`#team-${team} .student-contribution-badge`);if(!c)return null;
 return {cls:[...c.classList].filter(x=>x.startsWith('el-')).sort(),particles:c.querySelectorAll('.el-p').length,edges:c.querySelectorAll('.el-edge').length,
  title:c.querySelector('.el-title')?.textContent||null,crown:Boolean(c.querySelector('.el-crown svg')),text:c.innerText,
  anim:getComputedStyle(c.querySelector('.el-p')||c).animationName,levelup:c.classList.contains('el-levelup')};},team);
(async()=>{
 const e=await setup();
 try{
  const p=await board(e,1366,768,'animated');
  const seen={};
  for(const [id,n] of Object.entries(plan)){const team=id.split(':')[1];await p.evaluate(([t,id])=>__qa.studentAward(t,id),[team,id]);await wait(250);seen[n]=await card(p,team);}
  assert.deepEqual(seen[0].cls,[],'no seals: the regular card');
  assert.deepEqual(seen[2].cls,['el-card','el-nature','el-spark']);assert.equal(seen[2].particles,4);assert.equal(seen[2].edges,0);
  assert.deepEqual(seen[5].cls,['el-card','el-surge','el-water']);assert.equal(seen[5].particles,7);
  assert.deepEqual(seen[8].cls,['el-air','el-card','el-storm']);assert.equal(seen[8].edges,4,'six edge shapes, the two behind “★ First time” left out');assert.equal(seen[8].title,null);
  assert.deepEqual(seen[10].cls,['el-card','el-mythic','el-nature']);assert.equal(seen[10].particles,16);assert.equal(seen[10].edges,6,'nine edge shapes, the three behind “★ First time” left out');assert.equal(seen[10].title,'Earthshaker');assert.equal(seen[10].crown,true);
  for(const c of Object.values(seen))assert.doesNotMatch(c.text,/\bL(?:v|evel)\.?\s*\d/i,'no level number on the card');
  // "★ First time" sits above the effects, with the centre of the edge row left clear behind it.
  const tag=await p.evaluate(()=>{const c=document.querySelector('#team-hufflepuff .student-contribution-badge'),t=c.querySelector('.student-contribution-first'),r=t.getBoundingClientRect();
   const probe=document.createElement('style');probe.textContent='.student-contribution-badge,.student-contribution-badge *{pointer-events:auto!important}';document.head.append(probe); // the card ignores taps; hit-test it for this check only
   const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);probe.remove();
   return {first:Boolean(t),onTop:t.contains(top),centred:[...c.querySelectorAll('.el-edge')].map(e=>parseFloat(e.style.getPropertyValue('--x'))).filter(x=>x>34&&x<66).length};});
  assert.deepEqual(tag,{first:true,onTop:true,centred:0});
  for(const n of [2,5,8,10])assert.notEqual(seen[n].anim,'none',`Animated mode moves the level-${n} card`);
  const fire=await p.evaluate(()=>{LeagueNavigatorSeals.merge('5-A',Array.from({length:10},(_,i)=>({studentId:'5-A:gryffindor:3',student:'x',team:'gryffindor',island:i+1})));__qa.studentAward('gryffindor','5-A:gryffindor:3');return document.querySelector('#team-gryffindor .el-title')?.textContent;});
  const titles={fire};await wait(300);
  for(const [team,id] of [['ravenclaw','5-A:ravenclaw:3'],['hufflepuff','5-A:hufflepuff:3']])titles[team]=await p.evaluate(([team,id])=>{LeagueNavigatorSeals.merge('5-A',Array.from({length:10},(_,i)=>({studentId:id,student:'x',team,island:i+1})));__qa.studentAward(team,id);return document.querySelector(`#team-${team} .el-title`)?.textContent;},[team,id]);
  assert.deepEqual(titles,{fire:'Flamebearer',ravenclaw:'Tidecaller',hufflepuff:'Stormrider'});
  console.log('PASS elemental cards: regular with no seals; nature Spark, water Surge, air Storm and nature Mythic (Earthshaker) by seal count; Flamebearer, Tidecaller and Stormrider; no level number; “★ First time” above the effects; moving in Animated mode');

  // A newly earned seal: one burst on the next card, none after.
  await p.evaluate(()=>LeagueNavigatorSeals.award('5-A',{id:'5-A:slytherin:0',name:'Şeyma',team:'slytherin'},3,'s'));
  await wait(4500);await p.evaluate(()=>__qa.studentAward('slytherin','5-A:slytherin:0'));await wait(200);assert.equal((await card(p,'slytherin')).levelup,true);
  await wait(4500);await p.evaluate(()=>__qa.studentAward('slytherin','5-A:slytherin:0'));await wait(200);assert.equal((await card(p,'slytherin')).levelup,false);
  console.log('PASS a new seal gives the student’s next card one level-up burst, and only once');

  const light=await board(e,1366,768,'light');
  await light.evaluate(()=>__qa.studentAward('hufflepuff','5-A:hufflepuff:0'));await wait(300);
  const still=await card(light,'hufflepuff');assert.deepEqual(still.cls,['el-air','el-card','el-storm']);assert.equal(still.anim,'none');
  console.log('PASS Light mode shows the same elemental card, still');
  await light.context().close();

  // School League Season panel.
  for(const [w,h] of [[1366,768],[1280,720],[1920,1080]]){
   const b=w===1366?p:await board(e,w,h,'animated');
   await b.evaluate(()=>LeagueSeason.accept({wins:{gryffindor:14,slytherin:11,hufflepuff:9,ravenclaw:11},sessions:22,classes:['5-A','5-C','6-C','7-A','8-B'],recent:['older']}));
   await b.evaluate(()=>__qa.arena());await wait(1000);
   for(let i=0;i<40;i++){const st=await b.evaluate(()=>({scene:LeagueScenes.active,run:__qa.state().battle?.running}));if(st.scene==='results'&&!st.run)break;await b.evaluate(()=>{try{__qa.settleScene()}catch{}});await wait(500);}
   await wait(600);
   const s=await b.evaluate(()=>{const panel=document.getElementById('league-season-panel'),r=panel.getBoundingClientRect(),f=__qa.state().battle;
    const rows=[...panel.querySelectorAll('.season-row')].map(x=>({team:x.querySelector('.season-team').textContent,wins:+x.querySelector('.season-wins').textContent,delta:x.querySelector('.season-delta').textContent,pending:x.querySelector('.season-delta').classList.contains('pending')}));
    const titles=['arena-champion-panel','league-champion-panel'].map(id=>document.querySelector('#'+id+' .champion-team-name,#'+id+' h3,#'+id)?.getBoundingClientRect());
    const name=document.getElementById('champion-team-name')?.getBoundingClientRect(),league=document.getElementById('league-winner-name')?.getBoundingClientRect();
    const hit=a=>a&&!(a.right<=r.left||a.left>=r.right||a.bottom<=r.top||a.top>=r.bottom);
    return {visible:!panel.hidden&&r.width>0,inside:r.right<=innerWidth&&r.bottom<=innerHeight&&r.left>innerWidth*.7,rows,overlap:hit(name)||hit(league),foot:panel.querySelector('.season-foot').textContent};});
   assert.equal(s.visible,true);assert.equal(s.inside,true,`${w}×${h}: upper right, on screen`);assert.equal(s.overlap,false,`${w}×${h}: clear of the champion names`);
   assert.equal(s.rows.length,4);assert.equal(s.rows.reduce((n,r)=>n+(r.delta?+r.delta.slice(1):0),0)>=2,true,'today: League title(s) plus the Arena');assert(s.rows.every(r=>!r.delta||r.pending));
   assert.equal(s.rows.reduce((n,r)=>n+r.wins,0),45+s.rows.reduce((n,r)=>n+(r.delta?+r.delta.slice(1):0),0));
   // The phone's save returns the season including this session: no double counting, no longer pending.
   const after=await b.evaluate(()=>{const s=LeagueSeason.data;s.recent.push(__qa.state().sessionId);for(const r of LeagueSeason.standings().rows)s.wins[r.team]+=r.delta;LeagueSeason.accept(s);
    return [...document.querySelectorAll('#league-season-panel .season-row')].map(x=>({wins:+x.querySelector('.season-wins').textContent,pending:x.querySelector('.season-delta').classList.contains('pending')}));});
   assert.equal(after.reduce((n,r)=>n+r.wins,0),s.rows.reduce((n,r)=>n+r.wins,0));assert(after.every(r=>!r.pending));
   if(w!==1366)await b.context().close();
  }
  console.log('PASS the School League Season panel sits in the upper right of the Champions screen at 1280×720, 1366×768 and 1920×1080, adds today’s wins as “saving”, and shows saved totals without double counting');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
