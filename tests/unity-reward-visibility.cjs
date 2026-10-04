const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');
(async()=>{const e=await setup();try{fs.mkdirSync('output',{recursive:true});const p=await e.page();
await p.evaluate(()=>{__qa.start();__qa.mode('animated');__qa.seed(3);__qa.unityReward();});
assert.equal(await p.locator('.unity-event-header').isVisible(),false);
assert.equal(await p.locator('#team-gryffindor').isVisible(),false);
for(let wave=1;wave<=3;wave++){
 await p.waitForFunction(w=>__qa.state().wave===w,wave);
 await p.waitForTimeout(320);
 assert.deepEqual(await p.evaluate(()=>__qa.state().levels),Array(4).fill(3+wave));
 assert.equal(await p.locator('.unity-event-header').isVisible(),true);
 assert.equal(await p.locator('#team-gryffindor').isVisible(),true);
 assert.equal(await p.locator('#unity-event-skip').isVisible(),false);
 assert.ok((await p.locator('#unity-event-title').textContent()).includes(`Ascension ${wave} of 3`));
 assert.deepEqual(await p.locator('.unity-ascension-level').allTextContents(),Array(4).fill(`Level ${3+wave}`));
 for(const badge of await p.locator('.unity-ascension-badge').all())assert.ok(await badge.evaluate(el=>Number(getComputedStyle(el).opacity)>.5));
 await p.screenshot({path:`output/unity-reward-${wave}.png`});
}
await p.waitForFunction(()=>!LeagueScenes.active);
assert.equal(await p.evaluate(()=>document.body.classList.contains('unity-reward-active')),false);
assert.equal(await p.evaluate(()=>__qa.state().mission.rewardGranted),true);
await p.evaluate(()=>{__qa.unityReplay();LeagueScenes.skip();});
assert.deepEqual(await p.evaluate(()=>__qa.state().levels),[6,6,6,6]);
await p.evaluate(()=>{__qa.seed(9);__qa.unityReward();LeagueScenes.skip();});
assert.deepEqual(await p.evaluate(()=>__qa.state().levels),[10,10,10,10]);
assert.deepEqual(e.errors,[]);
console.log('PASS three visible, consecutive reward waves: Level 3 → 4 → 5 → 6, team cards and readable level badges, quiet assembly, exit cleanup, replay without duplicate grants, Level 10 cap.');
}finally{await e.close();}})().catch(e=>{console.error(e);process.exit(1)});
