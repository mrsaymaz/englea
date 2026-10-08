/* v11.0.0 · Places one transparent picture the way the game's art expects it (needs Sharp: npm i sharp).
   node art/place-avatar.cjs avatar <source.png> <out.webp>  → 384 × 384 team avatar (figure fitted inside 344 px, centred)
   node art/place-avatar.cjs boss <source.png> <out.webp>    → 1100 × 890 boss picture, like vixar.webp
   The figure is trimmed to its alpha edges first, so loose margins in the source do not matter. */
const sharp=require('sharp'),fs=require('fs');
async function trimmed(file){const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=0,y1=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 return sharp(file).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});}
async function place(file,out,W,H,boxW,boxH,quality){
 const img=await trimmed(file),buf=await img.png().toBuffer(),m=await sharp(buf).metadata();
 const s=Math.min(boxW/m.width,boxH/m.height),w=Math.round(m.width*s),h=Math.round(m.height*s);
 const fitted=await sharp(buf).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
 await sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:fitted,left:Math.round((W-w)/2),top:Math.round((H-h)/2)}]).webp({quality,alphaQuality:100,effort:6}).toFile(out);
 console.log(out.split('/').pop(),W+'x'+H,fs.statSync(out).size);}
(async()=>{const [kind,src,out]=process.argv.slice(2);
 if(kind==='avatar')await place(src,out,384,384,344,344,82);else await place(src,out,1100,890,1080,876,84);})();
