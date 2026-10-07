/* Mechanical atlas packing: preserve generated RGBA art, one scale and anchor per pack. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
const extract=require('./extract-poses.cjs');
const root=path.resolve(__dirname,'..');
const recovered=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const extra=fs.existsSync(path.join(__dirname,'generated'))?fs.readdirSync(path.join(__dirname,'generated')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'generated',f),'utf8'))):[];
const inputs=[...new Map([...recovered,...extra].map(a=>[a.id,a])).values()].sort((a,b)=>a.id.localeCompare(b.id));
const output=path.join(root,'public/assets/poses');fs.mkdirSync(output,{recursive:true});
const flips={'gryffindor-2':[0,2,4]};
(async()=>{
 const manifest={version:'10.5.0',method:'Built-in image generation; original per-level identity reference',anchor:[.5,.95],packs:{}};
 for(const a of inputs){
  const file=path.join(output,a.id+'.webp'),size=a.id==='vixar'?448:a.rows===2?384:320;
  if(!fs.existsSync(file)||process.argv.includes('--force')){
   const source=sharp(a.source),m=await source.metadata();if(!m.hasAlpha)throw Error(a.id+' has no alpha');
   const parts=extract(await source.clone().ensureAlpha().raw().toBuffer(),m.width,m.height,a.cols,a.rows);
   const largest=Math.max(...parts.flatMap(p=>[p.width,p.height]));
   const scale=size*.88/largest,layers=[];
   for(let i=0;i<parts.length;i++){
    const p=parts[i],w=Math.round(p.width*scale),h=Math.round(p.height*scale);let frame=sharp(p.raw,{raw:{width:p.width,height:p.height,channels:4}});
    if(flips[a.id]?.includes(i))frame=frame.flop();
    layers.push({input:await frame.resize(w,h).png().toBuffer(),left:i%a.cols*size+Math.round((size-w)/2),top:Math.floor(i/a.cols)*size+Math.round(size*.95-h)});
   }
   await sharp({create:{width:size*a.cols,height:size*a.rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({quality:85,alphaQuality:100,effort:5}).toFile(file);
  }
  manifest.packs[a.id]={file:a.id+'.webp',cols:a.cols,rows:a.rows,cell:size,states:a.states,bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
  console.log(a.id,manifest.packs[a.id].bytes);
 }
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Packed',inputs.length,'atlases.');
})().catch(e=>{console.error(e);process.exit(1)});
