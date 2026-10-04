const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');
(async()=>{const e=await setup();try{
 fs.mkdirSync('output',{recursive:true});const p=await e.page();
 assert.deepEqual(await p.evaluate(()=>[1000,750,500,250,100,0,-1000].map(x=>LeagueRules.arenaHP(x,1000))),[250,243,235,225,216,200,200]);
 assert.equal(await p.evaluate(()=>LeagueRules.arenaHP(-10,-1)),200);
 await p.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.seed(5,0);__qa.arena();SceneRuntime.create('arena').clear();ArenaMotion.stop();});
 assert.deepEqual(await p.evaluate(()=>__qa.state().battle.max),[200,200,200,200]);
 for(const kind of ['hit','blocked','partial','evaded']){
  await p.evaluate(()=>{SceneRuntime.create('arena').clear();ArenaMotion.stop();});
  await p.evaluate(kind=>__qa.arenaOutcome(kind),kind);
  await p.waitForSelector('.combat-shot');
  assert.equal(await p.locator('.combat-shot').count(),1);
  if(kind==='hit'){await p.waitForTimeout(100);await p.screenshot({path:'output/arena-projectile.png'});}
  if(kind!=='hit')await p.waitForSelector(`[data-outcome="${kind}"]`);
  else await p.waitForFunction(()=>__qa.state().battle.hp[1]===180);
  const hp=await p.evaluate(()=>__qa.state().battle.hp[1]);assert.equal(hp,kind==='hit'?180:kind==='partial'?190:200);
 }
 await p.evaluate(()=>{LeagueScenes.cancel();__qa.seed(10,1000);__qa.raid();SceneRuntime.create('raid').clear();RaidMotion.stop();});
 for(const id of ['gryffindor','slytherin','hufflepuff','ravenclaw']){
  for(let v=0;v<3;v++){
   await p.evaluate(id=>{RaidMotion.stop();__qa.raidVisual(id);},id);
   assert.equal(await p.locator(`.combat-shot[data-projectile="${id}"]`).count(),1);
   assert.equal(await p.locator(`.combat-shot[data-projectile="${id}"]`).getAttribute('data-variant'),String(v));
   await p.evaluate(id=>RaidMotion.move(id,'guard'),id);
   assert.equal(await p.locator('.raid-element-guard').count(),1);
   if(id==='ravenclaw'&&v===1){await p.waitForTimeout(130);await p.screenshot({path:'output/vixar-projectile.png'});}
  }
 }
 await p.evaluate(()=>LeagueScenes.pause());assert.equal(await p.locator('.combat-shot').count(),0);
 await p.evaluate(()=>{LeagueScenes.resume();LeagueScenes.cancel();__qa.seed(10,1000);__qa.raid();});
 await p.waitForTimeout(500);await p.evaluate(()=>LeagueScenes.skip());await p.waitForFunction(()=>__qa.state().raid?.completed===true);
 assert.deepEqual(e.errors,[]);
 console.log('PASS exact 200–250 HP examples and zero-score arena; projectiles match hits, full blocks, partial blocks and evasions');
 console.log('PASS all 12 team projectiles and defenses in Vixar, pause cleanup, and full boss-fight completion');
}finally{await e.close();}})().catch(e=>{console.error(e);process.exit(1);});
