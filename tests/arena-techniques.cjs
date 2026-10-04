const assert=require('assert/strict'),fs=require('fs');
const {setup}=require('./support.cjs');
(async()=>{const e=await setup();try{
 fs.mkdirSync('output',{recursive:true});
 const p=await e.page();await p.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.seed(10);__qa.arena();SceneRuntime.create('arena').clear();ArenaMotion.stop();});
 const hpBefore=await p.evaluate(()=>__qa.state().battle.hp);
 const ids=['gryffindor','slytherin','hufflepuff','ravenclaw'];
 for(const id of ids){
  const preset=await p.evaluate(id=>ArenaTechniques.presets[id],id);
  assert.equal(new Set(preset.attacks).size,3);assert.equal(new Set(preset.defenses).size,3);
  const movements=await p.evaluate(id=>[0,1,2].map(v=>({attack:ArenaTechniques.approach(id,v,200,100,420,'translateX(-50%)'),defense:ArenaTechniques.defense(id,v)})),id);
  assert.equal(new Set(movements.map(m=>JSON.stringify(m.attack.frames))).size,3);
  assert.equal(new Set(movements.map(m=>JSON.stringify(m.defense.frames))).size,3);
  for(const m of movements){assert.ok(Math.abs(m.attack.frames[3].offset*m.attack.duration-420)<0.001);assert.match(m.attack.frames[3].transform,/translate\(200px,100px\)/);assert.equal(m.attack.frames.at(-1).offset,1);}
  for(let v=0;v<3;v++){
   await p.evaluate(({id,target})=>{ArenaMotion.stop();ArenaMotion.attack({id,alive:true,color:'#fff'},{id:target,alive:true,color:'#fff'},{impact:420});},{id,target:ids[(ids.indexOf(id)+1)%4]});
   await p.waitForFunction(name=>Boolean(document.querySelector(`[data-technique="${name}"]`)),preset.attacks[v]);
   assert.equal(await p.locator(`[data-technique="${preset.attacks[v]}"]`).isVisible(),true);
   const a=await p.evaluate(()=>ArenaMotion.diagnostics());assert.ok(a.effects<=10);assert.ok(a.actors<=8);
   if(id==='gryffindor'&&v===0)await p.screenshot({path:'output/arena-fire-attack.png'});
   await p.evaluate(()=>ArenaMotion.stop());
   await p.evaluate(id=>ArenaMotion.reaction(id,'guard','#fff'),id);
   assert.equal(await p.locator(`[data-technique="${preset.defenses[v]}"]`).count(),1);
   if(id==='ravenclaw'&&v===2)await p.screenshot({path:'output/arena-water-defense.png'});
  }
 }
 assert.deepEqual(await p.evaluate(()=>__qa.state().battle.hp),hpBefore);
 // Stress accents without changing the HP model; the shared budget bounds nodes.
 const budget=await p.evaluate(()=>{ArenaMotion.stop();for(let i=0;i<100;i++)ArenaMotion.reaction('gryffindor','guard','#fff');return ArenaMotion.diagnostics();});assert.ok(budget.effects<=10);
 await p.evaluate(()=>LeagueScenes.pause());assert.equal((await p.evaluate(()=>ArenaMotion.diagnostics())).effects,0);assert.equal(await p.locator('.arena-technique').count(),0);
 await p.evaluate(()=>LeagueScenes.resume());
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>ArenaMotion.reaction('slytherin','guard','#fff'));assert.equal(await p.locator('.arena-technique').count(),0);
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{
  ArenaMotion.reaction('ravenclaw','guard','#fff');
  const gallery=document.createElement('div');gallery.id='technique-gallery';gallery.style.cssText='position:fixed;inset:0;z-index:99999;background:#020617;color:#fff;padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font:14px system-ui';
  for(const [id,pr] of Object.entries(ArenaTechniques.presets))for(let v=0;v<3;v++){
   const cell=document.createElement('div');cell.style.cssText=`background:#0f172a;border:1px solid ${pr.color};border-radius:12px;padding:10px;text-align:center;color:${pr.color}`;
   cell.innerHTML=`<div style="text-transform:uppercase;font-weight:800">${id} · ${pr.element}</div><div style="display:flex;justify-content:center;gap:30px"><div><div style="width:78px;height:78px;margin:auto">${ArenaTechniques.mark(id,'strike',v)}</div>${pr.attacks[v]}</div><div><div style="width:78px;height:78px;margin:auto">${ArenaTechniques.mark(id,'guard',v)}</div>${pr.defenses[v]}</div></div>`;
   gallery.append(cell);
  }document.body.append(gallery);
 });
 await p.screenshot({path:'output/arena-techniques-catalogue.png'});
 await p.evaluate(()=>{document.getElementById('technique-gallery').remove();LeagueScenes.cancel();});
 assert.equal(await p.evaluate(()=>LeagueScenes.active),null);assert.equal((await p.evaluate(()=>ArenaMotion.diagnostics())).timers,0);
 assert.deepEqual(e.errors,[]);
 console.log('PASS all 12 attacks and 12 defenses appear in rotation; distinct movements and marks; contact stays at damage time; visual calls leave HP untouched');
 console.log('PASS effect budget under burst load, pause/exit cleanup, reduced motion suppression and no browser errors');
}finally{await e.close();}})().catch(e=>{console.error(e);process.exit(1);});
