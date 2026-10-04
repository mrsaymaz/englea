/* Actual Canvas2D smoke renders, not a browser/DOM layout test. Optional @napi-rs/canvas. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage,Path2D}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');global.Path2D=Path2D;
global.RunnerSpiritMotion=require('../public/island-runner/spirit-motion.js');
const S=require('../public/island-runner/scenery.js'),E=require('../public/island-runner/engine.js'),C=require('../public/island-runner/expand-content.js'),B=require('../public/island-runner/bosses.js');
const root=path.resolve(__dirname,'../public/island-runner'),out=process.argv[2];
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 let frames=0;const V=require('../public/island-runner/visual-kit.js'),signatures=new Set();
 for(let id=1;id<=10;id++){const icon=createCanvas(120,120),c=icon.getContext('2d');V.projectile(c,id,60,60,26,1,false,'#d5c69b');signatures.add(crypto.createHash('sha256').update(icon.toBuffer('image/png')).digest('hex'));}assert.equal(signatures.size,10,'all ten signatures are visibly different even without colour');
 const sheet=out?createCanvas(1200,1250):null,sheetCtx=sheet?.getContext('2d');
 const budgetCanvas=createCanvas(1,1),budgetRenderer=new S.Renderer(budgetCanvas);budgetRenderer.resize(3840,1800,2);assert(budgetCanvas.width*budgetCanvas.height<=2400000);
 for(const house of C.houses){
  const image=await loadImage(path.join(root,'assets',house.id+'-10.webp'));
  for(let island=1;island<=10;island++){
   const boss=await loadImage(path.join(root,B.get(island).asset)),canvas=createCanvas(1200,460),r=new E.Run({bank:C.grades[5][island-1].bank,island,seed:42});
   const renderer=new S.Renderer(canvas);renderer.resize(1200,460,1);renderer.setup(house,image,C.grades[5][island-1].realm,false,boss,B.get(island));
   r.distance=2800;r.beginMechanic();r.mechanic.at=r.distance+500;r.addFocus(100);renderer.burst('answer',1);renderer.render(r,1/60);frames++;
   if(out&&house.id==='gryffindor'&&island===7){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'tide-focus.png'),canvas.toBuffer('image/png'));}
   r.mechanic=null;r.beginGate();r.gate.age=4;r.gate.ratio=.3;r.gate.choicesShown=true;renderer.render(r,1/60);frames++;
   r.gate=null;r.coins=r.requiredCoins;r.beginBoss();r.boss.age=2;r.bossRound();renderer.render(r,1/60);frames++;
   if(out&&house.id==='gryffindor'&&island===1)fs.writeFileSync(path.join(out,'boss-warning.png'),canvas.toBuffer('image/png'));
   r.bossState('expose');renderer.render(r,1/60);frames++;
   if(out&&house.id==='gryffindor'&&island===1)fs.writeFileSync(path.join(out,'boss-opening.png'),canvas.toBuffer('image/png'));
   r.bossState('strike');r.boss.attack=.7;renderer.render(r,1/60);frames++;
   if(sheet&&house.id==='gryffindor'){const col=(island-1)%2,row=Math.floor((island-1)/2);sheetCtx.drawImage(canvas,0,0,1200,460,col*600,row*250+20,600,230);sheetCtx.fillStyle='#14283a';sheetCtx.fillRect(col*600,row*250,600,20);sheetCtx.fillStyle='#ecdfbd';sheetCtx.font='13px sans-serif';sheetCtx.fillText(`${island} · ${B.get(island).name} · ${V.get(island).name}`,col*600+10,row*250+15);}
   const before=JSON.stringify(r);renderer.burst('bossHit',1);renderer.render(r,1/60);frames++;assert.equal(JSON.stringify(r),before,'drawing cannot change gameplay');
   renderer.reduced=true;renderer.render(r,1/60);frames++;
   for(let n=0;n<100;n++)renderer.burst('coin',1);assert.equal(renderer.particles.length,60);
   renderer.setup(house,image,C.grades[5][island-1].realm,false,boss,B.get(island),true);renderer.resize(3840,1800,2);assert(canvas.width*canvas.height<=1000000);for(let n=0;n<100;n++)renderer.burst('coin',1);assert(renderer.particles.filter(p=>p.life>0).length<=18);renderer.render(r,1/60);frames++;
   assert(canvas.toBuffer('image/png').length>2000);
  }
 }
 if(sheet)fs.writeFileSync(path.join(out,'boss-signatures.png'),sheet.toBuffer('image/png'));
 if(out){const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp'),tiles=[];for(let id=1;id<=10;id++)for(const stage of [0,1]){const svg=S.islandSVG(C.grades[5][id-1].realm,id,{stage,teams:stage?['gryffindor']:[]}),png=await sharp(Buffer.from(svg)).resize(200,153).png().toBuffer();tiles.push({input:png,left:((id-1)%5)*400+stage*200,top:Math.floor((id-1)/5)*170});}await sharp({create:{width:2000,height:340,channels:4,background:'#182e3d'}}).composite(tiles).png().toFile(path.join(out,'landmark-restorations.png'));}
 console.log(`PASS ${frames} native Canvas2D frames: all houses, ten mechanics, boss warnings/openings/projectiles, Focus, reduced motion and bounded particles.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
