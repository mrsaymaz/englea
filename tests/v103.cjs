/* v10.3.0 dependency-free checks: smoother class moments on slow boards.
   - Island Run draws at a lower resolution on slower steps (100%, 75%, 55%) and each board remembers its step.
   - Awards no longer read the layout mid-award (restartClass, cached card places, deferred crown).
   - The recovery snapshot is written when the board is idle and at once when the page is closed or hidden.
   - The board remembers its effects level; the board background is not drawn under the Arena.
   Browser checks: board-v103.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
function freshQuality(storage){
 globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
 const file=require.resolve('../public/island-runner/visual-kit.js');delete require.cache[file];
 return require(file).Quality; // the store is read when the step changes, so it stays in place for the test
}
test('Island Run: each slower step also lowers the resolution (100%, 75%, 55%); the board remembers its step for the next run',()=>{
 const storage=new Map();let Q=freshQuality(storage),q=new Q();
 assert.deepEqual([0,1,2].map(t=>{q.tier=t;return q.limits.scale;}),[1,.75,.55]);
 q=new Q();assert.equal(q.tier,0,'a new board starts sharp');
 for(let i=0;i<400;i++)q.sample(1/24,4);assert.equal(q.tier,2,'about 24 frames a second: steps down to the lightest step');
 assert.equal(storage.get('island-run-quality-v1'),'2');
 q=new (freshQuality(storage))();assert.equal(q.tier,2,'the next run starts on the remembered step');
 q.reset();assert.equal(q.tier,2,'and so does every later run');
 for(let i=0;i<60*40;i++)q.sample(1/60,2);assert.equal(q.tier,0,'a board that is fast again steps back up');assert.equal(storage.get('island-run-quality-v1'),'0');
 q.reset(true);assert.equal(q.tier,2,'Light graphics');for(let i=0;i<60*40;i++)q.sample(1/60,2);assert.equal(storage.get('island-run-quality-v1'),'0','Light graphics are not remembered as the board’s step');
 assert.match(pub('island-runner/scenery.js'),/dpr=Math\.min\(dpr\*\(this\.quality\.limits\.scale\|\|1\),2,/);
});
test('Awards: no layout reads in the middle of an award (score, level badge, ranking slide, leader crown)',()=>{
 const game=pub('game.js'),body=name=>{const i=game.indexOf(`function ${name}(`);return game.slice(i,game.indexOf('\n            }\n',i));};
 assert.doesNotMatch(body('animateTeamScore'),/offsetWidth/);assert.match(body('animateTeamScore'),/restartClass\(numberEl, 'score-counting'\);/);
 assert.match(game,/restartClass\(levelDisplay, 'level-up'\);/);
 assert.match(game,/function restartClass\(el, cls\) \{[\s\S]*?requestAnimationFrame\(\(\) => requestAnimationFrame\(/);
 assert.match(game,/new ResizeObserver\(measureGridSlots\)/);assert.match(game,/const slots = settled \? gridSlots : null;/);
 assert.match(pub('board-fx.js'),/requestAnimationFrame\(\(\)=>setTimeout\(\(\)=>\{if\(crowned!==team\|\|sceneOpen\(\)\)return;/);
 assert.match(game,/if \(wanted && !document\.body\.classList\.contains\(wanted\)\) document\.body\.classList\.add\(wanted\);/,'the page’s leader class changes only when the leader changes');
});
test('Session recovery: written when the board is idle (within 0.6 s), and at once when the page is closed or hidden',()=>{
 const game=pub('game.js');
 assert.match(game,/checkpointHandle=window\.requestIdleCallback\?requestIdleCallback\(flushCheckpoint,\{timeout:600\}\):setTimeout\(flushCheckpoint,250\);/);
 assert.match(game,/addEventListener\('pagehide',flushCheckpoint\);/);assert.match(game,/if\(document\.hidden\)flushCheckpoint\(\);/);
});
test('Board passport for effects: the level is remembered and announced; checked every 4 s during a scene; no board background under the Arena',()=>{
 const budget=pub('performance-budget.js'),css=pub('league-v10.css');
 assert.match(budget,/const KEY='englishLeague\.effectsBudget\.v1';/);assert.match(budget,/try\{localStorage\.setItem\(KEY,String\(level\)\);\}catch\{\}/);
 assert.match(budget,/const pause=\(\)=>root\.LeagueScenes\?\.active\?4000:15000;/);
 assert.match(budget,/document\.body\.classList\.toggle\('arena-covering',overlay\.classList\.contains\('visible'\)\)/);
 assert.match(css,/body\.arena-covering #dynamic-background\{visibility:hidden!important\}/);
 assert.match(css,/body\[data-effects-budget="1"\] #battle-overlay::before,body\[data-effects-budget="2"\] #battle-overlay::before\{animation:none!important\}/);
});
console.log(JSON.stringify({checks}));
