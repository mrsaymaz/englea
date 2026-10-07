/* v11.0.0 balance lab: the Vixar Saga's fights, simulated with the game's own rules in Chromium.
   Every fight runs the real raid engine through SceneRuntime.fastForward with seeded randomness (no shortcuts in the
   damage, HP or boss rules). A class "meets every requirement" when all four teams are at the act's level and the
   Class Mission is complete; in Act III it also casts the Merge Spell (both pairs fuse, answering correctly).
   Targets (spec): Act II and Act III with every requirement → 8 or more wins in 10. Act III without the Merge Spell →
   rare. Results are written to balance-lab/saga-balance.json.
   Run: node saga-balance.cjs [fights per scenario, default 20] */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('./support.cjs');
const N=Math.max(10,Number(process.argv[2])||20);
const scenarios=[
 {name:'Act I · Violet · Level 10 · mission',stage:'Violet',level:10,mission:true,merge:null,target:{min:.8}},
 {name:'Act II · Scarlet · Level 11 · mission',stage:'Scarlet',level:11,mission:true,merge:null,target:{min:.8}},
 {name:'Act III · Gilded · Level 12 · mission · both pairs fused',stage:'Gilded',level:12,mission:true,merge:'both',target:{min:.8}},
 {name:'Act III · Gilded · Level 12 · mission · one pair fused',stage:'Gilded',level:12,mission:true,merge:'one',target:null},
 {name:'Act III · Gilded · Level 12 · mission · Merge Spell failed',stage:'Gilded',level:12,mission:true,merge:'none',target:{max:.3}},
 {name:'Act II · Scarlet · Level 11 · no mission',stage:'Scarlet',level:11,mission:false,merge:null,target:{max:0}}
];
(async()=>{const e=await setup();try{
 const p=await e.page();
 await p.evaluate(()=>{__qa.start();__qa.mode('light');});
 await p.evaluate(()=>{__qa.selectClass('5-A');document.getElementById('island-cloud-dialog')?.close();});
 const results=[];
 for(const sc of scenarios){
  let wins=0;const details=[];
  for(let seed=1;seed<=N;seed++){
   const r=await p.evaluate(({sc,seed})=>{
    LeagueScenes.cancel();__qa.seed(sc.level,1000);
    let n=seed*7919;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
    __qa.raid(sc.mission,sc.stage);
    const st=()=>__qa.state().raid,saga=()=>__qa.sagaState();
    let guard=0;
    while(!st()?.completed&&guard++<200){
     SceneRuntime.fastForward('raid',()=>Boolean(st()?.completed)||Boolean(saga().merge&&!saga().merge.done&&saga().merge.card&&!saga().merge.outcome),400000);
     const m=saga().merge;
     if(m&&!m.done&&m.card&&!m.outcome){
      const house=m.turn.house,pair=house==='gryffindor'||house==='slytherin'?'slyffindor':'huffleclaw';
      const ok=sc.merge==='both'||(sc.merge==='one'&&pair==='slyffindor');
      __qa.mergeAnswer(ok);
     }
    }
    const s=saga();
    return {completed:Boolean(st()?.completed),won:st()?.stage==='victory'||Boolean(s.finale),fused:s.fused?.length??0,edict:s.edict,hp:st()?.hp};
   },{sc,seed});
   assert.equal(r.completed||r.won,true,JSON.stringify({sc:sc.name,seed,r}));
   if(r.won)wins++;details.push(r);
   await p.evaluate(()=>{LeagueSagaScenes.finale.stop(false);LeagueScenes.cancel();});
  }
  const rate=wins/N;results.push({scenario:sc.name,fights:N,wins,rate,target:sc.target,fused:details.map(d=>d.fused)});
  console.log(`${sc.name}: ${wins}/${N} wins (${Math.round(rate*100)}%)`);
 }
 fs.mkdirSync(path.join(__dirname,'balance-lab'),{recursive:true});
 fs.writeFileSync(path.join(__dirname,'balance-lab/saga-balance.json'),JSON.stringify({fightsPerScenario:N,results},null,2)+'\n');
 for(const r of results){
  if(r.target?.min!==undefined)assert(r.rate>=r.target.min,`${r.scenario}: ${r.wins}/${r.fights} is below the target`);
  if(r.target?.max!==undefined)assert(r.rate<=r.target.max,`${r.scenario}: ${r.wins}/${r.fights} is above the target`);
 }
 assert.deepEqual(e.errors,[]);
 console.log('PASS Vixar Saga balance lab: Acts I–III meet their targets ('+N+' fights per scenario).');
}finally{await e.close();}})().catch(error=>{console.error(error);process.exit(1);});
