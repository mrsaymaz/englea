const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),assert=require('assert/strict');const {makeLab,rng,overrides}=require('./lab.cjs');
process.chdir(__dirname);
const project=path.resolve(process.argv[2]||path.join(__dirname,'../..'));const source=path.join(project,'tests/support.cjs');
let support=fs.readFileSync(source,'utf8').replace("'../netlify/functions/access-time.mjs'",JSON.stringify(pathToFileURL(path.join(project,'netlify/functions/access-time.mjs')).href)).replace("path.resolve(__dirname,'../public')",JSON.stringify(path.join(project,'public')));
const injection=`window.__labRun=function(config,seed){
 ${overrides.replaceAll('=noop;','=()=>{};')}
 playSound=()=>{};startPredatorRunBattleTrack=()=>{};stopBattleMusic=()=>{};addHistoryLog=()=>{};
 const oldNow=performance.now;performance.now=()=>1000;
 const oldRandom=Math.random;
 const rng=${rng.toString()}; Math.random=rng(seed);
 const traitRandom=rng(seed^0xA5A5A5A5);
 LeagueScenes.cancel(); clearBattleTasks();battleState=null;
 teamsData.forEach((t,i)=>{t.level=config.level;t.points=config.points?.[i]??1000;t.hasRelic=t.level>=5;const traits=teamTraits[t.id].map(t=>t.id);for(let j=traits.length-1;j>0;j--){const k=Math.floor(traitRandom()*(j+1));[traits[j],traits[k]]=[traits[k],traits[j]];}t.traits=traits.slice(0,t.level);});
 const oldFinish=finishFinalBattle;finishFinalBattle=function(){battleState.running=false;clearBattleTasks();};
 startFinalBattle();SceneRuntime.fastForward('arena',()=>!battleState.running,32000);
 const winner=determineArenaWinner().id;const result={winner,elapsed:battleState.elapsed,fighters:battleState.fighters.map(f=>({id:f.id,hp:f.hp,damage:f.damageDealt,actions:f.actions,signatures:f.signatureUses}))};
 finishFinalBattle=oldFinish;Math.random=oldRandom;performance.now=oldNow;LeagueScenes.leave('arena');return result;
};`;
support=support.replace("str.slice(0,i)+hook+str.slice(i)","str.slice(0,i)+hook+"+JSON.stringify(injection)+"+str.slice(i)");fs.writeFileSync('parity-support.cjs',support);
(async()=>{const e=await require('./parity-support.cjs').setup();try{const p=await e.page();const lab=makeLab();let n=0;for(const level of [0,3,5,8,9,10])for(const points of [[1000,1000,1000,1000],[0,0,0,0],[1000,500,0,-100]])for(let seed=50;seed<54;seed++){
const config={level,points};
const actual=await p.evaluate(({config,seed})=>window.__labRun(config,seed),{config,seed});const r=lab.run(config,seed);const expected={winner:r.winner,elapsed:r.elapsed,fighters:r.fighters.map(f=>({id:f.id,hp:f.hp,damage:f.damage,actions:f.actions,signatures:f.signatures}))};assert.deepEqual(actual,expected);n++;}console.log('PASS',n,'seeded browser/laboratory parity battles; exact HP, damage, actions, signatures, winner and duration.');fs.writeFileSync('parity-result.json',JSON.stringify({passed:n,scope:'Production full-game closure versus extracted laboratory. UI-only methods disabled in both; real production combat and fast-forward clock.'},null,2));}finally{await e.close()}})().catch(e=>{console.error(e);process.exit(1)});
