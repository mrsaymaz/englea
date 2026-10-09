const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');
(async()=>{const e=await setup();try{
 fs.mkdirSync('output',{recursive:true});const p=await e.page();
 await p.evaluate(()=>{__qa.start();__qa.mode('animated');});
 const results=[];
 for(const mission of [false,true])for(const points of [0,1000,10000])for(let seed=1;seed<=4;seed++){
  const r=await p.evaluate(({mission,points,seed})=>{
   LeagueScenes.cancel();__qa.seed(10,points);let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
   __qa.raid(mission);LeagueScenes.skip();return __qa.state().raid;
  },{mission,points,seed});
  assert.equal(r.completed,true);assert.equal(r.finalAttack,true,JSON.stringify({mission,points,seed,r}));
  assert.ok(r.seals.every(s=>s.broken));assert.ok(r.damage.every(n=>n>0));
  assert.equal(r.stage,mission?'victory':'defeat');assert.equal(r.hp,mission?0:420);assert.equal(r.guardian,mission);
  assert.ok(r.fighters.every(f=>mission?(f.alive&&f.hp===f.max):(!f.alive&&f.hp===0)));
  results.push({mission,points,seed,stage:r.stage});
 }
 // v11.0.0: the Rift replaces the Level 8 sigil. With the Rift open, Act I still waits until every team is Level 10.
 await p.evaluate(()=>{LeagueScenes.cancel();__qa.seed(9,1000);__qa.raid(true);});
 assert.equal(await p.evaluate(()=>__qa.state().raid),null);assert.equal(await p.evaluate(()=>__qa.sagaState().sigil),false);
 await p.evaluate(()=>{LeagueScenes.cancel();__qa.seed(10,1000);__qa.raid(false);});
 assert.equal(await p.evaluate(()=>__qa.raidHit(false)),0);assert.ok(await p.evaluate(()=>__qa.raidHit(true))>0);
 for(const [label,kind] of [['NULL LANCE','spear'],['CROWNFALL','shard'],['GRAVITY COLLAPSE','orb'],['SOUL REND','crescent'],['SEPARATED','chain'],['UNITY','unity']]){
  await p.evaluate(label=>{RaidMotion.stop();RaidMotion.bossShot(document.getElementById('vixar-animated-core'),document.getElementById('vixar-avatar-shell-gryffindor'),label,900);},label);
  assert.equal(await p.locator(`.raid-boss-shot[data-projectile="${kind}"]`).count(),1);
  if(kind==='orb'){await p.waitForTimeout(300);await p.screenshot({path:'output/vixar-void-orb.png'});}
 }
 await p.evaluate(()=>LeagueScenes.pause());assert.equal(await p.locator('.raid-boss-shot').count(),0);
 await p.evaluate(()=>{LeagueScenes.resume();LeagueScenes.cancel();__qa.seed(10,1000);__qa.raid(true);__qa.raidThreshold();});
 await p.waitForFunction(()=>__qa.state().raid?.stage==='summoning');
 assert.ok((await p.evaluate(()=>__qa.state().raid.fighters)).every(f=>f.hp===0&&!f.alive));
 await p.waitForSelector('.raid-guardian-claw[data-claw="0"]');assert.equal(await p.evaluate(()=>__qa.state().raid.hp),420);
 await p.waitForSelector('.raid-guardian-claw[data-claw="1"]');assert.equal(await p.evaluate(()=>__qa.state().raid.hp),0);
 await p.screenshot({path:'output/guardian-cross-claw.png'});
 await p.waitForFunction(()=>__qa.state().raid?.completed);assert.equal(await p.locator('#raid-motion-layer > *').count(),0);
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.evaluate(()=>{LeagueScenes.cancel();__qa.seed(10,1000);__qa.raid(true);__qa.raidThreshold();LeagueScenes.skip();});
 assert.equal(await p.evaluate(()=>__qa.state().raid.stage),'victory');assert.equal(await p.locator('#raid-motion-layer > *').count(),0);
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{LeagueScenes.cancel();__qa.unityReplay();});
 assert.equal(await p.locator('.unity-event-header').isVisible(),false);
 await p.waitForTimeout(8500);await p.screenshot({path:'output/guardian-clean-assembly.png'});
 await p.evaluate(()=>LeagueScenes.cancel());assert.equal(await p.locator('#raid-motion-layer > *').count(),0);
 assert.deepEqual(e.errors,[]);fs.writeFileSync('output/vixar-finale-results.json',JSON.stringify(results,null,2));
 console.log('PASS 24 natural Level 10 raids: seals break, all teams damage Vixar, 10% knockout, mission-gated victory; Level 9 gets no fight.');
 console.log('PASS six projectile shapes, sequential claw HP timing, clean assembly, pause/exit cleanup and reduced-motion finale.');
}finally{await e.close();}})().catch(e=>{console.error(e);process.exit(1);});
