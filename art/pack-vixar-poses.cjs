/* v11.0.0: packs the nine sharper pose pictures of Scarlet or Gilded Vixar into the board's pose sheet, then switches
   that form's poses on. Usage: node art/pack-vixar-poses.cjs scarlet|gilded [--check]
   Sources: art/vixar-poses/vixar-{form}-{state}.png (or .webp), one per state, at least 1000 × 1000 with a transparent
   background. The build includes the finished high-resolution sources; the packer refuses low-resolution stand-ins.
   Same rules as art/pack-poses.cjs: one scale for the whole form (its largest picture fills 88% of a cell), each picture
   centred with its lowest point at 95% of the cell (the board's ground anchor). Cells are 640 px (a 1920 × 1920 sheet).
   --check only reports what is missing or still a placeholder. Needs the sharp package (npm install sharp). */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
let sharp;try{sharp=require('sharp');}catch{console.error('This tool needs the sharp package: npm install sharp');process.exit(1);}
const STATES=['ready','charge','cast','guard','exposed','hit','ultimate','defeat','proud'],CELL=640,MIN=1000;
const form=process.argv[2],check=process.argv.includes('--check');
if(!['scarlet','gilded'].includes(form)){console.error('Usage: node art/pack-vixar-poses.cjs scarlet|gilded [--check]');process.exit(1);}
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'vixar-poses'),id='vixar-'+form;
(async()=>{
 const problems=[],parts=[];
 for(const state of STATES){
  const file=['png','webp'].map(x=>path.join(dir,`${id}-${state}.${x}`)).find(f=>fs.existsSync(f));
  if(!file){problems.push(`${id}-${state}.png is missing`);continue;}
  const m=await sharp(file).metadata(),name=path.basename(file);
  if(m.width<MIN||m.height<MIN){problems.push(`${name} is ${m.width} × ${m.height}, so it is still the placeholder (at least ${MIN} × ${MIN} needed)`);continue;}
  if(!m.hasAlpha){problems.push(`${name} has no transparent background`);continue;}
  // The picture's own box (pixels that are not transparent).
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=-1,y1=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0){problems.push(`${name} is empty`);continue;}
  parts.push({state,file,left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
 }
 if(problems.length){console.error(`${id}: not packed\n- `+problems.join('\n- '));process.exit(check?0:1);}
 if(check){console.log(`${id}: all nine pictures are ready to pack`);return;}
 const scale=CELL*.88/Math.max(...parts.flatMap(p=>[p.width,p.height])),layers=[];
 for(const [i,p] of parts.entries()){
  const w=Math.max(1,Math.round(p.width*scale)),h=Math.max(1,Math.round(p.height*scale));
  const input=await sharp(p.file).extract({left:p.left,top:p.top,width:p.width,height:p.height}).resize(w,h).png().toBuffer();
  layers.push({input,left:(i%3)*CELL+Math.round((CELL-w)/2),top:Math.floor(i/3)*CELL+Math.round(CELL*.95-h)});
 }
 const sheet=path.join(root,'public/assets/poses',id+'.webp');
 await sharp({create:{width:CELL*3,height:CELL*3,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({quality:85,alphaQuality:100,effort:5}).toFile(sheet);
 // Match the idle picture to the ready cell's scale and anchor, so finishing an action does not make Vixar jump in size.
 const p=parts[0],stillCell=CELL*2,w=Math.round(p.width*scale*2),h=Math.round(p.height*scale*2);
 const input=await sharp(p.file).extract({left:p.left,top:p.top,width:p.width,height:p.height}).resize(w,h).png().toBuffer();
 await sharp({create:{width:stillCell,height:stillCell,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input,left:Math.round((stillCell-w)/2),top:Math.round(stillCell*.95-h)}]).webp({quality:90,alphaQuality:100,effort:5})
  .toFile(path.join(root,'public/assets/animated',id+'.webp'));
 const bytes=fs.readFileSync(sheet),manifestFile=path.join(root,'public/assets/poses/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 manifest.packs[id]={...manifest.packs[id],file:id+'.webp',cols:3,rows:3,cell:CELL,states:STATES,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 // Switch the form's poses on (vixar-saga.js keeps them off while the sheet is the soft 448 px one).
 const sagaFile=path.join(root,'public/vixar-saga.js'),saga=fs.readFileSync(sagaFile,'utf8'),on=saga.replace(`art:'${id}',poses:false`,`art:'${id}',poses:true`);
 if(on!==saga)fs.writeFileSync(sagaFile,on);
 console.log(`${id}: packed ${parts.length} poses into public/assets/poses/${id}.webp (${CELL * 3} × ${CELL * 3}, ${(bytes.length/1024).toFixed(0)} KB); poses ${on!==saga?'switched on':'already on'} in public/vixar-saga.js`);
})().catch(e=>{console.error(e);process.exit(1);});
