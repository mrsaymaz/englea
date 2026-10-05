/* v10.1.1 browser check (Chromium): one student card at a time on the board. Every frame is sampled while awards
   go to different teams, with and without a change of ranking: at most one card is visible; no card is visible while
   the team cards slide; the previous card fades in about 0.2 s; each new card appears on its own team once the slide
   has landed. Also: the frame stripe moves by transform, and a scene change cancels a waiting card. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const e=await setup();
 try{
  for(const mode of ['animated','light']){
   const p=await e.page(await e.browser.newContext({viewport:{width:1366,height:768}}));
   await p.evaluate(m=>{__qa.start();__qa.mode(m);},mode);await wait(300);
   await p.evaluate(()=>{__qa.selectClass('5-A');document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    for(const t of ['gryffindor','slytherin','hufflepuff','ravenclaw'])LeagueNavigatorSeals.merge('5-A',Array.from({length:8},(_,i)=>({studentId:`5-A:${t}:0`,student:'x',team:t,island:i+1})));});
   await wait(500);
   // Sample every frame: visible cards (by their animated opacity) and whether any team card is sliding.
   await p.evaluate(()=>{window.__samples=[];const grid=document.getElementById('teams-grid');
    const loop=()=>{const cards=[...document.querySelectorAll('.student-contribution-badge')].filter(c=>parseFloat(getComputedStyle(c).opacity)>.05);
     const sliding=[...grid.children].some(el=>el.getAnimations().some(a=>a.playState==='running'&&a.currentTime>=(a.effect.getTiming().delay||0)&&a.effect.getKeyframes().some(k=>String(k.transform||'').startsWith('translate3d'))));
     window.__samples.push({t:performance.now(),cards:cards.map(c=>c.closest('[id^="team-"]').id),sliding});if(window.__sampling)requestAnimationFrame(loop);};
    window.__sampling=true;requestAnimationFrame(loop);});
   const order=()=>p.evaluate(()=>[...document.getElementById('teams-grid').children].map(n=>n.id.slice(5)));
   const log=[];
   const award=async team=>{const before=await order();const at=await p.evaluate(t=>{__qa.studentAward(t,`5-A:${t}:0`);return performance.now();},team);await wait(1400);log.push({team,at,reordered:JSON.stringify(before)!==JSON.stringify(await order())});};
   const start=await order();
   await award(start[3]);              // the last team takes the lead: ranking slide
   await award(start[2]);              // another team joins the top: ranking slide while the first card shows
   await award((await order())[0]);    // the leader again: no slide
   await p.evaluate(()=>{window.__sampling=false;});
   const s=await p.evaluate(()=>window.__samples);
   assert(log.filter(x=>x.reordered).length>=2&&log.some(x=>!x.reordered),'the plan covers awards with and without a ranking slide: '+JSON.stringify(log));
   assert(s.length>120,'frames sampled');
   assert.equal(Math.max(...s.map(x=>x.cards.length)),1,'never two cards at once');
   assert.equal(s.filter(x=>x.sliding&&x.cards.length).length,0,'no card while the team cards slide');
   for(const [i,x] of log.entries()){
    const next=log[i+1]?.at??Infinity,mine=s.filter(f=>f.t>x.at&&f.t<next);
    const shownAt=mine.find(f=>f.cards[0]===`team-${x.team}`)?.t;assert(shownAt,`card for ${x.team}`);
    if(i){const gone=mine.find(f=>!f.cards.length)?.t;assert(gone&&gone-x.at<(mode==='light'?80:320),`previous card leaves quickly (${Math.round(gone-x.at)} ms)`);}
    if(x.reordered){const slideEnd=Math.max(...mine.filter(f=>f.sliding).map(f=>f.t));assert(shownAt>slideEnd,'the new card appears once the slide has landed');}
   }
   console.log(`PASS ${mode}: one card at a time, never during a ranking slide, the previous card leaves quickly and the new one appears on its own team after the slide`);
   if(mode==='animated'){
    // The frame stripe flows by transform (compositor), not by repainting the background.
    const strip=await p.evaluate(()=>{LeagueNavigatorSeals.merge('5-A',Array.from({length:10},(_,i)=>({studentId:'5-A:ravenclaw:1',student:'x',team:'ravenclaw',island:i+1})));__qa.studentAward('ravenclaw','5-A:ravenclaw:1');
     return new Promise(r=>setTimeout(()=>{const n=document.querySelector('#team-ravenclaw .el-strip');const a=n?.getAnimations()[0];r({name:a?.animationName,props:a?Object.keys(a.effect.getKeyframes()[0]).filter(k=>!['offset','easing','composite','computedOffset'].includes(k)):null,edgesShadow:[...document.querySelectorAll('#team-ravenclaw .el-edge')].some(x=>getComputedStyle(x).boxShadow!=='none'),crownFilter:getComputedStyle(document.querySelector('#team-ravenclaw .el-crown')).filter});},900));});
    assert.deepEqual(strip,{name:'el-flow',props:['transform'],edgesShadow:false,crownFilter:'none'});
    // A scene change while a card waits cancels it.
    const left=await p.evaluate(()=>new Promise(r=>{__qa.studentAward('hufflepuff','5-A:hufflepuff:0');LeagueStudentUI.clearCelebrations();setTimeout(()=>r(document.querySelectorAll('.student-contribution-badge').length),700);}));
    assert.equal(left,0);
    console.log('PASS the frame stripe moves by transform; edge shapes and crown have no blurred shadows; a scene change cancels a waiting card');
   }
   await p.context().close();
  }
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
