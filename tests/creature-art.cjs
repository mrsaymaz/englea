/* Optional Sharp check: actual distributed WebP frames, not source generation previews. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
const dir=path.join(__dirname,'../public/assets/poses'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),out=process.argv[2];
const teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
(async()=>{
 let count=0,bytes=0;assert.equal(Object.keys(manifest.packs).length,55);const thumbnails={};
 for(const [id,p]of Object.entries(manifest.packs)){
  const buffer=fs.readFileSync(path.join(dir,p.file)),m=await sharp(buffer).metadata();assert(m.hasAlpha,id+' alpha');assert.equal(m.width,p.cols*p.cell,id);assert.equal(m.height,p.rows*p.cell,id);assert.equal(buffer.length,p.bytes,id);assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),p.sha256,id);bytes+=buffer.length;
  const raw=await sharp(buffer).ensureAlpha().raw().toBuffer(),unique=new Set();
  for(let i=0;i<p.states.length;i++){
   const left=i%p.cols*p.cell,top=Math.floor(i/p.cols)*p.cell;let opaque=0,minX=p.cell,minY=p.cell,maxX=0,maxY=0;
   for(let y=0;y<p.cell;y++)for(let x=0;x<p.cell;x++)if(raw[((y+top)*m.width+x+left)*4+3]>16){opaque++;minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);}
   assert(opaque>p.cell*p.cell*.035&&opaque<p.cell*p.cell*.9,id+' '+p.states[i]+' visible transparent figure');assert(minX>2&&minY>2&&maxX<p.cell-3&&maxY<p.cell-3,id+' frame touches edge');assert(Math.abs(maxY/p.cell-.95)<.035,id+' stable ground anchor');
   const tile=await sharp(buffer).extract({left,top,width:p.cell,height:p.cell}).resize(116,116).png().toBuffer();unique.add(crypto.createHash('sha256').update(tile).digest('hex'));
   if(out)(thumbnails[id]??=[]).push(tile);count++;
  }
  assert.equal(unique.size,p.states.length,id+' duplicate frames');
 }
 assert.equal(count,465);assert(bytes<18*1024*1024,'asset download budget');
 if(out){fs.mkdirSync(out,{recursive:true});const groups=Object.fromEntries(teams.map(t=>[t,Array.from({length:11},(_,n)=>t+'-'+n)]));groups.bosses=Object.keys(manifest.packs).filter(id=>!teams.some(t=>id.startsWith(t+'-')));
  for(const [name,ids]of Object.entries(groups)){const cells=[],labels=[];ids.forEach((id,x)=>{labels.push(`<text x="${x*120+4}" y="16">${id.replace(name+'-','Level ')}</text>`);thumbnails[id].forEach((input,y)=>{cells.push({input,left:x*120+2,top:y*134+24});labels.push(`<text x="${x*120+4}" y="${y*134+153}">${manifest.packs[id].states[y]}</text>`);});});const height=9*134+26,width=ids.length*120;cells.push({input:Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g font-family="sans-serif" font-size="10" fill="#d9e0ec">${labels.join('')}</g></svg>`),left:0,top:0});await sharp({create:{width,height,channels:4,background:'#101b2b'}}).composite(cells).png().toFile(path.join(out,name+'.png'));}
 }
 console.log(`PASS ${count} distinct, transparent, safely inset frames in 55 verified atlases; ${(bytes/1024/1024).toFixed(2)} MiB total`);
})().catch(e=>{console.error(e);process.exitCode=1;});
