const fs=require('fs'),path=require('path');
const sourceDir=path.join(__dirname,'source');
const original=fs.readFileSync(path.join(sourceDir,'arena-source.js'),'utf8');
const runtime=fs.readFileSync(path.join(sourceDir,'classroom-runtime.js'),'utf8');
const rules=fs.readFileSync(path.join(sourceDir,'game-rules.js'),'utf8');
const ids=['gryffindor','slytherin','hufflepuff','ravenclaw'];
function rng(seed){return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
// UI-only entry points. No combat, targeting, damage, scheduling or winner rules are replaced.
const visualNames=['renderBattleFighters','updateBattleHUD','setBattleStatus','battleAnnounce','setArenaTeamFlare','cacheLightBattleGeometry','clearLightBattleVisuals','animateLightFace','animateLightDefense','setMotionVector','showTargetIndicator','showSignatureSpotlight','animateShell','createImpact','createProjectile','createFog','createElementalBurst','shakeArena','screenFlash'];
const overrides=visualNames.map(n=>`${n}=noop;`).join('\n');
function makeLab(patches=[]){
 let source=original;
 for(const [before,after] of patches){if(!source.includes(before))throw Error('Patch not found: '+before);source=source.replace(before,after);}
 const factory=new Function('rng',`
 const noop=()=>{},window={},document={hidden:false,addEventListener:noop,dispatchEvent:noop,querySelectorAll:()=>[],getElementById:()=>node,body:null};
 const node={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},setAttribute:noop,querySelector:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};document.body=node;
 const performance={now:()=>1000},setTimeout=()=>0,clearTimeout=noop,requestAnimationFrame=noop,addEventListener=noop,CustomEvent=function(){};
 const Math=Object.create(globalThis.Math);Math.random=rng(1);
 ${runtime}\n${rules}
 const {SceneRuntime,LeagueScenes,LeagueRules}=window;
 const ArenaMotion={stop:noop,resolve:noop,extraTarget:noop},AnimatedMode={cancelAll:noop};
 const stopBattleMusic=noop,playSound=noop,addHistoryLog=noop,startPredatorRunBattleTrack=noop;
 const isLeanMode=()=>true;let vixarRaidState=null,unityEventRunning=false,unityEventQueued=false,currentEvent=null;
 ${source}
 ${overrides}
 finishFinalBattle=function(){battleState.running=false;clearBattleTasks();};
 const baseBalance=JSON.parse(JSON.stringify(arenaDamageBalance));const baseLow=typeof arenaDamageBalanceLowHP==='undefined'?null:JSON.parse(JSON.stringify(arenaDamageBalanceLowHP));
 return {baseBalance,probePoison(){
  clearBattleTasks();Math.random=rng(1);
  const target=buildBattleFighter({...teamsData[0],points:1000,level:5,traits:[]},1000),attacker=buildBattleFighter({...teamsData[1],points:1000,level:5,traits:[]},1000);
  target.invulnerableUntil=5000;target.shieldHP=50;battleState={running:true,elapsed:0,fighters:[target,attacker]};
  applyPoison(attacker,target,7,1000);SceneRuntime.fastForward('arena',()=>target.hp<target.maxHP||!target.poisonTickScheduled,3000);
  const result={hpBefore:target.maxHP,hpAfter:target.hp,shieldAfter:target.shieldHP,invulnerableUntil:target.invulnerableUntil};clearBattleTasks();battleState=null;return result;
 },run(config,seed){
  Math.random=rng(seed);LeagueScenes.leave('arena');clearBattleTasks();battleState=null;
  teamsData.sort((a,b)=>['gryffindor','slytherin','hufflepuff','ravenclaw'].indexOf(a.id)-['gryffindor','slytherin','hufflepuff','ravenclaw'].indexOf(b.id));
  const traitRandom=rng(seed^0xA5A5A5A5);
  teamsData.forEach((t,i)=>{t.level=Array.isArray(config.levels)?config.levels[i]:(config.level??5);t.points=config.points?.[i]??1000;t.hasRelic=config.relics===false?false:t.level>=5;
   const traits=teamTraits[t.id].map(t=>t.id);
   if(config.traits!=='ordered')for(let j=traits.length-1;j>0;j--){const k=Math.floor(traitRandom()*(j+1));[traits[j],traits[k]]=[traits[k],traits[j]];}
   t.traits=config.traitIds?.[i]||traits.slice(0,t.level);
   arenaDamageBalance[t.id]=config.balance?.[t.id]||baseBalance[t.id];
   if(baseLow)arenaDamageBalanceLowHP[t.id]=config.lowBalance?.[t.id]||baseLow[t.id];
  });
  if(config.order){teamsData.sort((a,b)=>config.order.indexOf(a.id)-config.order.indexOf(b.id));}
  else teamsData.sort((a,b)=>['gryffindor','slytherin','hufflepuff','ravenclaw'].indexOf(a.id)-['gryffindor','slytherin','hufflepuff','ravenclaw'].indexOf(b.id));
  startFinalBattle();
  const started=battleState.startedAt;
  if(!SceneRuntime.fastForward('arena',()=>!battleState.running,32000))throw Error('Arena did not finish');
  const ranked=[...battleState.fighters].sort(compareArenaFighters),winner=ranked[0];
  const result={winner:winner.id,elapsed:battleState.elapsed,alive:ranked.filter(f=>f.alive).length,timeout:battleState.elapsed>=30000,
   fighters:battleState.fighters.map(f=>({id:f.id,points:f.points,level:f.level,hp:f.hp,maxHP:f.maxHP,alive:f.alive,damage:f.damageDealt,taken:f.damageTaken,blocked:f.damageBlocked,actions:f.actions,signatures:f.signatureUses,relicUsed:f.relicUsed,slot:f.arenaSlot,knockout:f.knockedOutAt?f.knockedOutAt-started:null,power:f.power,armor:f.armor,speed:f.speed,arcane:f.arcane,traits:f.traits}))};
  LeagueScenes.leave('arena');return result;
 }};`);
 return factory(rng);
}
function measure(lab,config,n,seedBase=1){
 const wins=Object.fromEntries(ids.map(id=>[id,0])),totals=Object.fromEntries(ids.map(id=>[id,{damage:0,hp:0,actions:0,signatures:0,relicUses:0,survives:0,slotWins:[0,0,0,0],slots:[0,0,0,0]}]));let duration=0,timeouts=0,alive=0;
 for(let i=0;i<n;i++){const r=lab.run(config,(seedBase+i)>>>0);wins[r.winner]++;duration+=r.elapsed;timeouts+=r.timeout;alive+=r.alive;
  for(const f of r.fighters){const t=totals[f.id];t.damage+=f.damage;t.hp+=f.hp;t.actions+=f.actions;t.signatures+=f.signatures;t.relicUses+=f.relicUsed;t.survives+=f.alive;t.slots[f.slot]++;if(r.winner===f.id)t.slotWins[f.slot]++;}
 }
 return {config,n,seedBase,wins,rates:Object.fromEntries(ids.map(id=>[id,wins[id]/n*100])),meanDuration:duration/n/1000,timeoutRate:timeouts/n*100,meanSurvivors:alive/n,totals};
}
module.exports={makeLab,measure,ids,rng,overrides};
if(require.main===module){const lab=makeLab(),n=Number(process.argv[2]||2000),results=[];for(let level=0;level<=10;level++){const r=measure(lab,{level},n,100000+level*10000);results.push(r);console.log(level,Object.values(r.rates).map(x=>x.toFixed(2)).join(' / '),'timeout',r.timeoutRate.toFixed(1));}fs.writeFileSync(path.join(__dirname,'baseline.json'),JSON.stringify(results,null,2));}
