/* Presentation tests with deterministic geometry, animation promises and simulation time. No browser required. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/raid-motion.js','utf8');
let count=0;async function test(name,fn){await fn();console.log('PASS '+name);count++;}
function harness(){
 let time=0,budget=12,serial=0;const tasks=new Map(),nodes=new Map(),events={},poses=[],animations=[];
 const clock={after(fn,ms){const id=++serial;tasks.set(id,{fn,due:time+ms});return id;},cancel(id){tasks.delete(id);},clear(){tasks.clear();}};
 class Element{
  constructor(id='',x=0,y=0,w=100,h=100){this.id=id;this.rect={x,y,width:w,height:h};this.dataset={};this.style={};this.children=[];this.classes=new Set();this.isConnected=true;this.classList={contains:k=>this.classes.has(k),add:(...ks)=>ks.forEach(k=>this.classes.add(k)),remove:(...ks)=>ks.forEach(k=>this.classes.delete(k))};}
  set className(v){this.classes=new Set(v.split(' '));}get className(){return [...this.classes].join(' ');}
  getBoundingClientRect(){return this.rect;}querySelector(){return null;}closest(){return null;}
  appendChild(el){this.children.push(el);el.parent=this;return el;}replaceChildren(){this.children.forEach(e=>e.parent=null);this.children=[];}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null;}
  animate(frames,options){let resolve;const a={frames,options,el:this,canceled:false,finished:new Promise(r=>resolve=r),cancel(){this.canceled=true;clock.cancel(this.timer);resolve();}};a.timer=clock.after(resolve,options.duration);animations.push(a);return a;}
 }
 const add=(id,x,y,w,h)=>{const e=new Element(id,x,y,w,h);nodes.set(id,e);return e;};
 const body=new Element();body.classList.add('vixar-raid-active','performance-animated');
 const layer=add('raid-motion-layer'),arena=add('vixar-raid-arena',0,0,1200,700),overlay=add('vixar-raid-overlay');
 const boss=add('vixar-animated-actor',400,60,400,400);boss.dataset.poseId='vixar-scarlet';
 const stage=add('vixar-boss-stage',400,60,400,400);add('vixar-boss-svg');
 const targets=['gryffindor','slytherin','hufflepuff','ravenclaw'].map((id,i)=>add('vixar-avatar-shell-'+id,60+i*285,520,160,160));
 const preference={matches:false,addEventListener:(name,f)=>events.preference=f};
 const document={body,hidden:false,getElementById:id=>nodes.get(id),createElement:()=>new Element(),querySelectorAll:()=>[...nodes.values()].filter(e=>e.classes.has('raid-targeted')),addEventListener:(n,f)=>(events[n]??=[]).push(f)};
 const c={document,window:null,innerWidth:1200,Map,Set,Math,Promise,matchMedia:()=>preference,addEventListener:(n,f)=>(events[n]??=[]).push(f),
  SceneRuntime:{now:()=>time,paused:false,fastForwarding:false},LeaguePerformance:{limit:()=>budget},CreaturePoses:{raid:(...args)=>poses.push(args),clear:()=>poses.push(['clear'])},
  ArenaTechniques:{presets:{}},LeagueMotion:{profiles:{},pose:()=>({duration:300,frames:[{transform:'none'},{transform:'none'}]}),approach:()=>({duration:700,frames:[]})}};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
 const advance=async ms=>{const end=time+ms;while(true){const [id,t]=[...tasks].sort((a,b)=>a[1].due-b[1].due)[0]||[];if(!t||t.due>end)break;tasks.delete(id);time=t.due;t.fn();await settle();}time=end;await settle();};
 const fire=n=>(events[n]||[]).forEach(f=>f());
 return {R:c.RaidMotion,c,clock,advance,settle,fire,nodes,poses,animations,layer,targets,boss,stage,overlay,preference,setBudget:n=>budget=n};
}
function damageFunction(){const source=fs.readFileSync('public/game.js','utf8'),start=source.indexOf('            function vixarApplyTeamDamage(');return source.slice(start,source.indexOf('\n            function ',start+30));}
(async()=>{
await test('All three forms have distinct glyphs, palettes and movement, retaining readable projectile kinds',async()=>{
 const shapes=[],motions=[];for(const form of ['vixar','vixar-scarlet','vixar-gilded']){
  const h=harness();h.boss.dataset.poseId=form;
  for(const [attack,kind] of [['NULL LANCE','spear'],['CROWNFALL','shard'],['GRAVITY COLLAPSE','orb'],['SOUL REND','crescent'],['SEPARATED','chain'],['UNITY','unity'],['SCARLET BRAND','brand']]){
   h.R.bossShot(h.stage,h.targets[0],attack);const el=h.layer.children.at(-1);assert.equal(el.dataset.projectile,kind);assert(!el.innerHTML.includes('undefined'));if(kind==='spear')shapes.push(el.innerHTML);await h.advance(800);
  }
  h.R.move('boss','attack',h.targets[0]);motions.push(JSON.stringify(h.animations.at(-1).frames));h.R.stop();
 }
 assert.equal(new Set(shapes).size,3);assert.equal(new Set(motions).size,3);
});
await test('Release holds at the source for 22%, then linear flight arrives at the unchanged 420 ms',async()=>{
 const h=harness();h.R.bossShot(h.stage,h.targets[0],'NULL LANCE');const a=h.animations.find(a=>a.el.dataset.projectile);
 assert.equal(a.options.duration,420);assert.equal(a.options.easing,'linear');assert.equal(a.frames[1].offset,.22);
 assert.match(a.frames[1].transform,/translate\(0px,0px\)/);assert.match(a.frames[2].transform,/translate\(-460px,340px\)/);
 assert.equal(h.poses[0][3].releaseAt,92.4);await h.advance(419);assert.equal(h.layer.children.length,1);await h.advance(1);assert.equal(h.layer.children.length,0);
});
await test('Four targets share one cast; recoil cannot erase launch; ultimate and defeat interrupt and remain dominant',async()=>{
 const h=harness();h.targets.forEach(t=>h.R.bossShot(h.stage,t,'CROWNFALL'));
 assert.equal(h.poses.length,1);assert.equal(h.R.diagnostics().actors,1);assert.equal(h.layer.children.length,4);
 h.R.move('boss','hit');assert.equal(h.poses.length,1);await h.advance(421);h.R.move('boss','hit');assert.equal(h.poses.at(-1)[1],'hit');
 h.R.move('boss','ultimate');h.R.move('boss','hit');h.R.move('boss','attack');assert.equal(h.poses.at(-1)[1],'ultimate');
 h.R.move('boss','knockout');h.R.move('boss','attack');assert.equal(h.poses.at(-1)[1],'knockout');h.R.stop();await h.settle();assert.equal(h.R.diagnostics().actors,0);
});
await test('Light-mode form art is the movement target; the effect budget is bounded and cleanup cannot resurrect effects',async()=>{
 const h=harness();h.c.document.body.classList.remove('performance-animated');h.overlay.classList.add('saga-form-art');assert.equal(h.R.node('boss'),h.boss);
 h.setBudget(3);for(let i=0;i<20;i++)h.R.bossShot(h.stage,h.targets[i%4],'CROWNFALL');assert.equal(h.layer.children.length,3);assert.equal(h.R.diagnostics().effects,3);
 h.R.stop();await h.advance(5000);assert.equal(h.layer.children.length,0);assert.equal(h.R.diagnostics().effects,0);assert.equal(h.R.diagnostics().actors,0);assert(h.targets.every(t=>!t.classes.has('raid-targeted')));
});
await test('Pause, hidden page, scene exit, reduced motion and fast-forward suppress/cancel presentation',async()=>{
 for(const event of ['league-pause-change','visibilitychange','league-scene-change','pagehide']){
  const h=harness();h.R.bossShot(h.stage,h.targets[0]);if(event==='league-pause-change')h.c.SceneRuntime.paused=true;if(event==='visibilitychange')h.c.document.hidden=true;
  h.fire(event);await h.advance(5000);assert.equal(h.layer.children.length,0,event);assert.equal(h.R.diagnostics().actors,0,event);
 }
 for(const condition of ['reduced','paused','hidden','fastForwarding']){const h=harness();if(condition==='reduced')h.preference.matches=true;else if(condition==='hidden')h.c.document.hidden=true;else h.c.SceneRuntime[condition]=true;
  h.R.bossShot(h.stage,h.targets[0]);h.R.bossImpact(h.targets[0]);h.R.move('boss','attack');assert.equal(h.animations.length,0,condition);assert.equal(h.poses.length,0,condition);}
});
await test('Actual damage resolver emits no premature hit; preserves immunity, armor, shields and knockout results',()=>{
 for(const spec of [{hp:500,armor:0,want:100},{hp:500,armor:100,want:70},{hp:500,armor:100,options:{trueDamage:true},want:100},{hp:500,shieldHP:40,want:60},{hp:500,shieldHP:200,want:0},{hp:500,shieldHP:200,options:{ignoreShield:true},want:100},{hp:500,invulnerableUntil:9999,want:0},{hp:20,want:100}]){
  const h=harness(),events=[],tasks=[],target={id:'gryffindor',name:'Gryffindor',hp:spec.hp,maxHP:500,armor:0,shieldHP:0,alive:true,damageTaken:0,...spec};
  const c={Math,SceneRuntime:{now:()=>1000},document:h.c.document,vixarRaidState:{running:true,finishing:false,allLegendary:false,act:{color:'#f43f5e',merge:false},boss:{}},
   RaidMotion:{bossStyle:()=>({color:'#fb7185'}),bossShot:()=>events.push('shot'),bossImpact:(t,l,o)=>events.push(o)},vixarBossTarget:()=>h.stage,
   vixarSchedule:(fn,ms)=>tasks.push({fn,ms}),animateVixarTeam:()=>{},createVixarImpact:()=>{},isLeanMode:()=>true,updateVixarTeamHUD:()=>{},setVixarTeamStatus:()=>{},addHistoryLog:()=>{},playSound:()=>{}};
  vm.createContext(c);vm.runInContext(damageFunction()+';this.apply=vixarApplyTeamDamage;',c);
  assert.equal(c.apply(target,100,'NULL LANCE',spec.options||{}),0);assert.equal(target.hp,spec.hp);assert.equal(events.join(','),'shot');assert.equal(tasks[0].ms,420);
  const damage=tasks[0].fn();assert.equal(damage,spec.want);assert.equal(target.hp,Math.max(0,spec.hp-spec.want));assert.equal(target.damageTaken,spec.want);assert(events.includes(spec.want?'hit':'blocked'));
  if(spec.hp===20)assert.equal(target.alive,false);
 }
});
console.log(`${count} Vixar motion groups passed.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
