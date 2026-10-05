/* v9.6.0 Island Run checks: one navigator per run, a fixed prompt panel, and a renderer that keeps the
   background moving smoothly (cached layers, no mid-run reallocation, no snapping, bounded caches). */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../public/island-runner'),read=f=>fs.readFileSync(path.join(dir,f),'utf8');
global.RunnerSpiritMotion=global.RunnerSpiritMotion||require('../public/island-runner/spirit-motion.js');
const S=require('../public/island-runner/scenery.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js'),B=require('../public/island-runner/bosses.js'),V=require('../public/island-runner/visual-kit.js'),F=require('../public/island-runner/formats.js');
const image={complete:true,naturalWidth:200,naturalHeight:200},{drive}=require('./runner-driver.cjs');

// A recording 2D context. Sprites get their own canvases (makeCanvas), so the cached path is exercised.
function recorder(){
 const draws=[],made=[];let writes=0;
 const context=owner=>new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});
  if(k==='measureText')return ()=>({width:40});if(k==='drawImage')return (img,x,y,w,h)=>{if(owner==='main')draws.push({img,x,y,w,h});};return ()=>{};},set(t,k,v){t[k]=v;return true;}});
 const makeCanvas=(w,h)=>{const c={width:w,height:h,getContext:()=>context('sprite')};made.push(c);return c;};
 const main={w:1,h:1,get width(){return this.w;},set width(v){writes++;this.w=v;},get height(){return this.h;},set height(v){writes++;this.h=v;},getContext:()=>context('main')};
 return {main,makeCanvas,draws,made,writes:()=>writes};
}
function scene(realm='forest',island=4){
 const rec=recorder(),renderer=new S.Renderer(rec.main,{makeCanvas:rec.makeCanvas}),bank=C.grades[5][island-1].bank,run=new E.Run({bank,island,seed:11,trail:F.trailWord(bank,E.random(5))});
 renderer.resize(1200,460,1);renderer.setup(C.houses[2],image,realm,false,image,B.get(island));return {rec,renderer,run};
}
const stripImages=(renderer,level)=>new Set(Object.values(renderer.bakes.get(level)?.parts||{}).map(p=>p.img));

module.exports={async run(test){
 test('One navigator leads the whole run: set when the run starts, never per question or per trail (v9.7.0: the board picks one per session)',()=>{
  const app=read('app.js');
  assert(!app.includes('navigators.next()'),'no per-run bag any more');assert(!/nextNavigator/.test(app),'no “another student” action');
  const start=app.slice(app.indexOf('function startRun'),app.indexOf('function startRun')+4000);assert(start.includes('setNavigator(sessionNavigator)'));
  for(const handler of ['function showQuestion','function showAnswer','function showTrail','function showLetter','function endTrail','function showBoss','function bossPhase','function frame']){
   assert(app.includes(handler),handler);const body=app.slice(app.indexOf(handler),app.indexOf('\n  function',app.indexOf(handler)+10));assert(!/setNavigator\((?!'')/.test(body),handler+' keeps the navigator');}
  assert.match(app,/Navigator · \$\{navigator\}/,'the intro card names the navigator for the run');
 });

 test('The prompt panel keeps one height for every prompt type; pictures and letter slots fit inside it',()=>{
  const css=read('visual-v96.css'),html=read('index.html');
  assert(html.indexOf('visual-v96.css')>html.indexOf('visual-v95.css'),'loaded after the v9.5 styles');
  assert.match(css,/\.game-surface \.prompt-panel,\.game-surface \.prompt-panel\.picture,\.game-surface \.prompt-panel\.trail,\.game-surface \.prompt-panel\.listen\{\s*height:var\(--prompt-h\);min-height:0;max-height:none;flex:none;overflow:hidden\}/);
  assert.match(css,/\.picture-gate-art\{[^}]*width:var\(--prompt-art\);height:var\(--prompt-art\)/);
  for(const [,h,art] of css.matchAll(/--prompt-h:(\d+)px;--prompt-art:(\d+)px/g))assert(+art<=+h-16,`picture ${art}px fits a ${h}px panel`);
  for(const n of [1,2,3])assert(css.includes(`#promptText[data-fit="${n}"]`));assert(css.includes('.prompt-panel[data-fit="4"] #promptNote{display:none}'));
  // fitPrompt steps the text down only as far as needed, and starts again from full size for the next prompt.
  const source=read('app.js').match(/function fitPrompt\(\)\{[\s\S]*?\}\}\n/)[0];
  const text={dataset:{}},panel={dataset:{},clientHeight:100,need:0,get scrollHeight(){return this.need-(+text.dataset.fit||0)*12-(this.dataset.fit?16:0);}};
  const fit=new Function('$',source+'return fitPrompt;')(id=>id==='promptPanel'?panel:text);
  panel.need=126;fit();assert.equal(text.dataset.fit,'3');assert.equal(panel.dataset.fit,undefined);
  panel.need=150;fit();assert.equal(panel.dataset.fit,'4','the note gives way last');
  panel.need=90;fit();assert.equal(text.dataset.fit,undefined);assert.equal(panel.dataset.fit,undefined);
  assert.match(read('app.js'),/new MutationObserver\(fitPrompt\)\.observe\(\$\('promptPanel'\)/);
 });

 test('Resizing to the same size never reallocates the canvas; the quality governor cannot bounce',()=>{
  const {rec,renderer}=scene();const first=rec.writes();
  for(let i=0;i<20;i++)renderer.resize(1200,460,1);assert.equal(rec.writes(),first,'same size: canvas kept');
  renderer.resize(1200,520,1);assert(rec.writes()>first);
  // Slow on tier 0, fast on tier 1: one step down, at most one step back up, then it stays down.
  const q=new V.Quality();let changes=0;for(let i=0;i<60*240;i++)if(q.sample(1/60,q.tier===0?14:4))changes++;
  assert(changes<=3,`${changes} quality changes in four minutes`);assert.equal(q.tier,1);
 });

 test('Settled scenery is one cached copy per layer; colour returns through one blended level at a time',()=>{
  const {rec,renderer,run}=scene();
  for(let i=0;i<30;i++){run.step(1/60);renderer.render(run,1/60);}
  const settled=renderer.shown,ownStrips=stripImages(renderer,settled);assert.equal(ownStrips.size,4,'sky, ridges, skyline and lane row');
  rec.draws.length=0;run.step(1/60);renderer.render(run,1/60);
  const used=rec.draws.filter(d=>ownStrips.has(d.img)).length;assert(used>=6&&used<=12,`${used} strip copies (each layer once, twice where it wraps)`);
  // A correct answer: the next level is baked a layer per frame, then blended in and the old level released.
  run.correct=1;let maxPerFrame=0;
  for(let i=0;i<120;i++){const before=rec.made.length;run.step(1/60);renderer.render(run,1/60);maxPerFrame=Math.max(maxPerFrame,rec.made.slice(before).filter(c=>c.width>=1200).length);}
  assert(maxPerFrame<=1,'never more than one full-width layer drawn in a frame');
  assert.notEqual(renderer.shown,settled);assert.equal(renderer.next,null);assert.equal(renderer.bakes.size,1,'the old level is released');
  rec.draws.length=0;run.step(1/60);renderer.render(run,1/60);assert.equal(rec.draws.filter(d=>ownStrips.has(d.img)).length,0,'old level no longer drawn');
 });

 test('The background keeps moving at every quality tier, the landmark drifts without snapping, still only with reduced motion',()=>{
  const fake=globalThis.Path2D;globalThis.Path2D=class{};
  try{
   const {rec,renderer,run}=scene('academy',1);renderer.render(run,1/60);const landmark=renderer.layers.landmark.img,ridges=renderer.bakes.get(renderer.shown).parts.ridges.img;
   const xOf=img=>rec.draws.find(d=>d.img===img)?.x;
   let last=null;for(let i=0;i<900;i++){run.distance+=9;rec.draws.length=0;renderer.render(run,1/60);const x=xOf(landmark);if(last!==null){assert(x<=last+1e-9,'drifts one way');assert(last-x<1,'no jumps');}last=x;}
   renderer.quality.tier=2;rec.draws.length=0;renderer.render(run,1/60);const a=xOf(ridges);run.distance+=200;rec.draws.length=0;renderer.render(run,1/60);assert.notEqual(xOf(ridges),a,'lowest tier still scrolls the far layers');
   renderer.reduced=true;rec.draws.length=0;renderer.render(run,1/60);const b=xOf(ridges);run.distance+=200;rec.draws.length=0;renderer.render(run,1/60);assert.equal(xOf(ridges),b,'reduced motion keeps far layers still');
  }finally{globalThis.Path2D=fake;}
 });

 test('Sprite cache stays bounded through four complete driven runs (course, gates, Word Trail, guardian); drawing never changes gameplay',()=>{
  for(const [realm,island] of [['academy',1],['coast',5],['harbour',7],['sky',10]]){
   const {renderer,run}=scene(realm,island),phases=new Set();
   for(let i=0;i<60*60*6&&run.status==='running';i++){drive(run);run.step(1/60);phases.add(run.phase);
    const before=JSON.stringify(run);renderer.render(run,1/60);if(i%97===0)assert.equal(JSON.stringify(run),before,'drawing cannot change gameplay');
    assert(renderer.sprites.size<=240,`${realm}: ${renderer.sprites.size} sprites`);assert(renderer.bakes.size<=2);}
   assert.equal(run.status,'completed',realm);assert(phases.has('boss'),realm+' reached the guardian');assert(run.trail?.done,realm+' spelled the Word Trail');
  }
 });
}};
