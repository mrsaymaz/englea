const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../public/game.js'),'utf8');
const tables=code.slice(code.indexOf('            const arenaDamageBalance ='),code.indexOf('            let teamsData ='));
const poison=code.slice(code.indexOf('            function applyPoison('),code.indexOf('            function performSignature('));
function harness({shield=0,immune=0,guard=0}={}){
 let now=1000;const queue=[],impacts=[];
 const target={id:'gryffindor',alive:true,hp:250,maxHP:250,shieldHP:shield,invulnerableUntil:immune,guardUntil:guard,wardUntil:guard,damageTaken:0,damageBlocked:0,poisonUntil:0,poisonTickDamage:0,guardWeakenedUntil:0,poisonTickScheduled:false};
 const owner={id:'slytherin',level:5,damageDealt:0};const state={running:true,startingMeanHP:250,fighters:[target,owner]};
 const api=new Function('battleState','SceneRuntime','scheduleBattleTask','updateBattleHUD','createImpact','knockOutFighter','createFog',tables+poison+';return {applyPoison,arenaOutputMultiplier,high:arenaDamageBalance,low:arenaDamageBalanceLowHP};')(state,{now:()=>now},(fn,delay)=>queue.push({fn,due:now+delay}),()=>{},(t,c,d,o)=>impacts.push({damage:d,...o}),t=>{t.alive=false;},()=>{});
 return {api,target,owner,state,queue,impacts,tick(){queue.sort((a,b)=>a.due-b.due);const t=queue.shift();if(!t)throw Error('No scheduled tick');now=t.due;t.fn();}};
}
for(const conditions of [{immune:5000,shield:50},{shield:50},{shield:1},{guard:5000},{}]){
 const h=harness(conditions),amount=Math.max(1,Math.round(7*h.api.arenaOutputMultiplier(h.owner)));
 h.api.applyPoison(h.owner,h.target,7,1000,true);h.tick();
 const absorbed=conditions.immune?amount:Math.min(conditions.shield||0,amount),damage=amount-absorbed;
 assert.equal(h.target.hp,250-damage);assert.equal(h.owner.damageDealt,damage);assert.equal(h.target.damageTaken,damage);assert.equal(h.target.damageBlocked,absorbed);
 assert.equal(h.target.shieldHP,conditions.immune?50:Math.max(0,(conditions.shield||0)-amount));
 assert.equal(h.impacts[0].blocked,damage===0);assert.equal(h.impacts[0].damage,damage);
 h.tick();assert.equal(h.target.poisonTickScheduled,false);assert.equal(h.queue.length,0);
}
const h=harness();h.api.applyPoison(h.owner,h.target,3,2000);h.api.applyPoison(h.owner,h.target,7,3000);assert.equal(h.queue.length,1);assert.equal(h.target.poisonTickDamage,7);
const totals=[];
for(const factor of [1.12,1.13]){
 const t=harness();t.api.high.slytherin[5]=factor;t.api.applyPoison(t.owner,t.target,4,22000);
 for(let tick=0;tick<20;tick++)t.tick();
 assert.ok(Number.isInteger(t.owner.damageDealt));
 assert.ok(Math.abs(t.owner.damageDealt-20*4*factor)<=.500001);
 totals.push(t.owner.damageDealt);
}
assert.ok(Math.abs(totals[1]-totals[0])<=1,'Tiny multiplier changes must not jump every poison tick by one HP');
for(const id of Object.keys(h.api.high))for(let level=0;level<=10;level++){
 const fighter={id,level,hp:250};
 for(const mean of [200,212.5,225,237.5,250]){
  h.state.startingMeanHP=mean;const expected=h.api.high[id][level]+(h.api.low[id][level]-h.api.high[id][level])*(250-mean)/50;
  const value=h.api.arenaOutputMultiplier(fighter);assert.ok(Math.abs(value-expected)<1e-12);assert.ok(Number.isFinite(value)&&value>0);
  fighter.hp=1;assert.equal(h.api.arenaOutputMultiplier(fighter),value);
 }
}
console.log('PASS poison respects invulnerability, full/partial combat shields, exact damage accounting and expiry; armor/guard bypass remains intentional.');
console.log('PASS one refreshed poison chain; all 44 team/level multipliers interpolate from fixed starting HP and never current health.');
console.log('PASS fractional poison carry preserves integral HP and removes repeated per-tick rounding cliffs.');
