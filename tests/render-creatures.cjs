/* Native Canvas2D coverage of the actual Island Run renderer and distributed atlases.
   This is not a browser/CSS layout or smart-board performance test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage,Path2D}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas':'@napi-rs/canvas');global.Path2D=Path2D;
const P=require('../public/creature-poses.js');global.CreaturePoses=P;
global.RunnerSpiritMotion=require('../public/island-runner/spirit-motion.js');
const S=require('../public/island-runner/scenery.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js'),B=require('../public/island-runner/bosses.js');
const dir=path.resolve(__dirname,'../public'),out=process.argv[2],cache=new Map();
P.load=(id,n)=>{const p=P.pack(id,n);if(!p)return Promise.resolve(null);if(!cache.has(p.key))cache.set(p.key,loadImage(path.join(dir,'assets/poses',p.key+'.webp')).then(img=>({...p,img,ready:true})));return cache.get(p.key);};
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});let frames=0;const sheet=createCanvas(1200,1380),sc=sheet.getContext('2d');
 for(const [hi,house]of C.houses.entries())for(let level=0;level<=10;level++){
  const island=level%10+1,u=C.grades[5][island-1],info=B.get(island),fallback=await loadImage(path.join(dir,'assets/animated',house.id+'-'+level+'.webp')),boss=await loadImage(path.join(dir,'island-runner',info.asset)),canvas=createCanvas(1200,460),renderer=new S.Renderer(canvas,{makeCanvas:createCanvas});
  renderer.resize(1200,460,1);renderer.setup(house,fallback,u.realm,false,boss,info,false,level);await Promise.all([P.load(house.id,level),P.load(info.id)]);assert.equal(renderer.creaturePack.key,house.id+'-'+level);assert.equal(renderer.bossPack.key,info.id);
  const r=new E.Run({bank:u.bank,island,seed:43});r.distance=2200;r.time=.1;
  for(const t of [.1,.8]){r.time=t;const before=JSON.stringify(r);renderer.render(r,1/60);assert.equal(JSON.stringify(r),before);frames++;}
  r.beginGate();r.gate.age=4;r.gate.ratio=.3;r.gate.choicesShown=true;r.jump();renderer.render(r,1/60);frames++;assert.equal(P.runnerState(r),'jump');
  if(out&&level===10){sc.drawImage(canvas,0,0,1200,460,hi%2*600,Math.floor(hi/2)*230,600,230);}
  r.gate=null;r.jumpAge=-1;r.coins=r.requiredCoins;r.beginBoss();r.boss.age=2;r.bossRound();
  for(const state of ['warn','strike','expose','counter','knockout','defeated']){r.boss.state=state;r.boss.defeated=state==='defeated';r.boss.clock=.15;const before=JSON.stringify(r);renderer.render(r,1/60);assert.equal(JSON.stringify(r),before,'render must not change engine state');frames++;
   if(out&&hi===0&&level===10&&['strike','expose'].includes(state)){const row=state==='strike'?2:3;sc.drawImage(canvas,0,0,1200,460,0,row*230,600,230);}}
  renderer.reduced=true;renderer.render(r,1/60);frames++;renderer.creaturePack=null;renderer.bossPack=null;renderer.render(r,1/60);frames++;assert(canvas.toBuffer('image/png').length>2000);
 }
 // Vixar: same frame cropping as the DOM background; all nine distinct states.
 const vixar=await P.load('vixar');vixar.states.forEach((state,i)=>{sc.save();sc.fillStyle='#121d2a';sc.fillRect(i*133,930,133,300);P.draw(sc,vixar,state,i*133,950,133,133);sc.fillStyle='#e5d4aa';sc.font='13px sans-serif';sc.fillText(state,i*133+12,1100);sc.restore();frames++;});
 if(out)fs.writeFileSync(path.join(out,'runner-and-vixar.png'),sheet.toBuffer('image/png'));
 console.log(`PASS ${frames} native Canvas2D frames: all 44 team forms, every island boss, gate jumps, reduced motion and original-art fallback; engine state unchanged`);
})().catch(e=>{console.error(e);process.exitCode=1;});
