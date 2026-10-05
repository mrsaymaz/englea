/* v9.4.0: Island Run scene colour, renderer smoke frames (stub canvas) and passport seals on the board. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
global.RunnerSpiritMotion=require('../public/island-runner/spirit-motion.js');
const S=require('../public/island-runner/scenery.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js'),B=require('../public/island-runner/bosses.js');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

// A permissive 2D context: every call is accepted and gradients are objects.
function stubCanvas(){
 const gradient={addColorStop(){}},calls={n:0};
 const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>gradient;if(k==='measureText')return ()=>({width:40});return (...a)=>{calls.n++;};},set(t,k,v){t[k]=v;return true;}});
 return {canvas:{width:1,height:1,getContext:()=>ctx},calls};
}
const image={complete:true,naturalWidth:200,naturalHeight:200};

test('Every realm palette has the v9.4 scene colours and keeps the v9 island-art colours',()=>{
 const keys=['skyTop','skyLow','sun','cloud','far','mid','near','ground','lane','laneTop','foliage','window','sky','mist','hill','stone','moss','light'];
 for(const [realm,p] of Object.entries(S.palettes))for(const k of keys)assert.match(p[k],/^#[0-9a-f]{6}$/i,realm+'.'+k);
});

test('Scene colour starts muted, rises with each correct answer and is complete when the guardian falls',()=>{
 const {canvas}=stubCanvas(),r=new E.Run({bank:C.grades[5][0].bank,island:1,seed:3}),renderer=new S.Renderer(canvas);
 renderer.resize(1200,460,1);renderer.setup(C.houses[0],image,'academy',false,image,B.get(1));
 const start=renderer.vivid;assert(start>.3&&start<.6);
 for(let i=0;i<120;i++)renderer.render(r,1/60);assert(Math.abs(renderer.vivid-start)<.01,'no answers: colour stays put');
 r.correct=3;for(let i=0;i<240;i++)renderer.render(r,1/60);const mid=renderer.vivid;assert(mid>start+.2&&mid<.95);
 r.correct=6;r.coins=r.requiredCoins;r.beginBoss();r.boss.defeated=true;for(let i=0;i<400;i++)renderer.render(r,1/60);assert(renderer.vivid>.98);
 // Reduced motion reaches the target quickly instead of animating it.
 renderer.setup(C.houses[0],image,'academy',true,image,B.get(1));const q=new E.Run({bank:C.grades[5][0].bank,island:1,seed:4});q.correct=6;for(let i=0;i<20;i++)renderer.render(q,1/60);assert(renderer.vivid>.9);
 // Islands already restored by the class start brighter.
 renderer.setup(C.houses[0],image,'academy',false,image,B.get(1));renderer.restoredStart(4);assert(renderer.vivid>start+.3);
});

test('392 stub-canvas frames: every realm, house and phase render without changing gameplay, with bounded particles',()=>{
 let frames=0;
 for(const realm of Object.keys(S.palettes))for(const house of C.houses)for(const light of [false,true]){
  const island=1+frames%10,{canvas}=stubCanvas(),r=new E.Run({bank:C.grades[5][island-1].bank,island,seed:42}),renderer=new S.Renderer(canvas);
  renderer.resize(1200,460,1);renderer.setup(house,image,realm,false,image,B.get(island),light);
  r.distance=2800;r.beginMechanic();r.mechanic.at=r.distance+500;r.addFocus(100);
  for(let i=0;i<4;i++){r.time+=.2;r.jumpAge=i%2?.1:-1;renderer.render(r,1/60);frames++;}
  r.mechanic=null;r.beginGate();r.gate.age=4;r.gate.ratio=.3;r.gate.choicesShown=true;renderer.render(r,1/60);frames++;
  r.gate=null;r.coins=r.requiredCoins;r.beginBoss();r.boss.age=2;r.bossRound();
  const before=JSON.stringify(r);renderer.burst('bossHit',1);renderer.render(r,1/60);renderer.reduced=true;renderer.render(r,1/60);frames+=2;assert.equal(JSON.stringify(r),before,'drawing cannot change gameplay');
  assert.equal(renderer.particles.length,60);assert(renderer.particles.filter(p=>p.life>0).length<=renderer.quality.limits.particles);
  assert(renderer.gradients.size<=41,'gradient cache stays bounded');
 }
 assert.equal(frames,392);
});

// ---- Passport seals on the board and remote ----
function boardDOM(){
 const nodes=new Map(),listeners={};
 class El{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.style={setProperty(k,v){this[k]=v;}};this.cls=new Set();this.hidden=false;this.textContent='';this.parentNode=null;this.offsetWidth=1;
  this.classList={add:(...c)=>c.forEach(x=>this.cls.add(x)),remove:(...c)=>c.forEach(x=>this.cls.delete(x)),contains:c=>this.cls.has(c),toggle:(c,b)=>{(b??!this.cls.has(c))?this.cls.add(c):this.cls.delete(c);}};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  set className(v){this.cls=new Set(v.split(/\s+/).filter(Boolean));}
  set innerHTML(v){this.children=[];if(v.includes('passport-seal-emblem')){const img=new El('img');const b=new El('b');this.children.push(img,b);this._img=img;this._b=b;}}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
  append(...n){n.forEach(x=>{this.children.push(x);x.parentNode=this;if(x._id)nodes.set(x._id,x);});}after(n){this.parentNode?.append(n);}
  querySelector(sel){if(sel==='img')return this._img;if(sel==='b')return this._b;if(sel.includes('mascot-area'))return this._mascot;return null;}
 }
 const document={body:new El('body'),getElementById:id=>nodes.get(id)||null,createElement:t=>new El(t),querySelector:sel=>{const m=sel.match(/^#team-(\w+) \.mascot-area$/);return m?nodes.get('team-'+m[1])?._mascot||null:null;},addEventListener:(k,f)=>{(listeners[k]??=[]).push(f);},dispatchEvent:e=>{(listeners[e.type]||[]).forEach(f=>f(e));}};
 document.body.classList.contains=()=>false;
 for(const t of ['gryffindor','hufflepuff','slytherin','ravenclaw']){const panel=new El('div');panel.id='score-panel-'+t;}
 return {document,nodes};
}
function sealsContext(){
 const {document,nodes}=boardDOM(),progress={'5-A|slytherin':{}};
 const LeagueIslandProgress={valid:c=>c==='5-A',snapshot:c=>JSON.parse(JSON.stringify(progress))};
 const timers=[];const window={LeagueIslandProgress};
 const ctx={window,document,Image:class{},setTimeout:(f)=>{timers.push(f);return timers.length;},setInterval:(f)=>{timers.push(f);return timers.length;},clearInterval(){},CustomEvent:class{constructor(t){this.type=t;}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/passport-seals.js'),'utf8'),ctx);
 const seals=window.LeaguePassportSeals;seals.configure({getClass:()=>'5-A'});
 const change=()=>document.dispatchEvent({type:'island-progress-change'});
 return {seals,progress,nodes,timers,change,flush(){while(timers.length)timers.shift()();}};
}

// v9.7.0 moved seals from the team cards to the navigator student's award card (see v97.cjs).
test('Team cards carry no seal chip since v9.7.0; the team passport is still read for the map and unlocks',()=>{
 const t=sealsContext();
 t.progress['5-A|slytherin']={1:{score:900,stars:2},3:{score:1200,stars:3}};t.seals.fromRun();t.change();t.flush();
 assert.equal(t.nodes.get('passport-seals-slytherin'),undefined,'no chip on the team card');assert.equal(t.nodes.get('passport-seal-toast'),undefined,'no team toast');
 assert.equal(JSON.stringify(t.seals.sealsFor('5-A','slytherin').map(s=>s.island)),'[1,3]');
});

test('Board and runner pages load the shared look and the seals script, all on the current release tag',()=>{
 const board=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8'),runner=fs.readFileSync(path.join(__dirname,'../public/island-runner/index.html'),'utf8');
 const release=(board.match(/Island Run Edition · v(\d+\.\d+\.\d+)/)||[])[1];assert(release,'edition badge present');const tag=release.replace(/\./g,'\\.');
 for(const html of [board,runner]){assert.match(html,new RegExp('league-look\\.css\\?v='+tag));assert.doesNotMatch(html,/\?v=9\.3\.0/);}
 assert.match(board,new RegExp('passport-seals\\.js\\?v='+tag));
 assert.match(runner,/id="laneGuide"/);assert.match(runner,/id="runSoundButton"/);assert.match(runner,new RegExp('visual-v94\\.css\\?v='+tag));
 assert.match(fs.readFileSync(path.join(__dirname,'../public/island-run.js'),'utf8'),new RegExp('index\\.html\\?v='+tag));
});
console.log(JSON.stringify({checks}));
