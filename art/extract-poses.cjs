/* Mechanical sheet separation. Generated figures can extend across nominal grid lines.
   Identify their opaque cores, then grow labels back to the original alpha edges.
   The core erosion is only for finding labels: rendered pixels are never eroded or repainted. */
module.exports=function extractPoses(data,w,h,cols,rows){
 const N=w*h,core=new Uint8Array(N),seen=new Uint8Array(N),labels=new Int16Array(N),queue=new Int32Array(N),radius=5;
 for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){
  let solid=true;for(let d=-radius;d<=radius;d++)if(data[(y*w+x+d)*4+3]<128||data[((y+d)*w+x)*4+3]<128){solid=false;break;}
  if(solid)core[y*w+x]=1;
 }
 const cell=(x,y)=>Math.min(cols-1,Math.floor(x/w*cols))+cols*Math.min(rows-1,Math.floor(y/h*rows));
 const visit=(i,mask)=>{
  let start=0,end=1,x0=w,y0=h,x1=0,y1=0;queue[0]=i;seen[i]=1;
  while(start<end){const p=queue[start++],x=p%w,y=(p/w)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   for(const k of [p-1,p+1,p-w,p+w])if(k>=0&&k<N&&!seen[k]&&Math.abs(k%w-x)<=1&&mask(k)){seen[k]=1;queue[end++]=k;}
  }return {end,x0,y0,x1,y1};
 };
 const seeded=new Set();
 for(let i=0;i<N;i++)if(core[i]&&!seen[i]){const b=visit(i,k=>core[k]);if(b.end<5000)continue;const id=cell((b.x0+b.x1)/2,(b.y0+b.y1)/2)+1;seeded.add(id);for(let j=0;j<b.end;j++)labels[queue[j]]=id;}
 if(seeded.size!==cols*rows)throw Error('Could not identify every figure core: '+seeded.size+'/'+cols*rows);
 let start=0,end=0;for(let i=0;i<N;i++)if(labels[i])queue[end++]=i;
 while(start<end){const p=queue[start++],x=p%w;for(const k of [p-1,p+1,p-w,p+w])if(k>=0&&k<N&&!labels[k]&&Math.abs(k%w-x)<=1&&data[k*4+3]>8){labels[k]=labels[p];queue[end++]=k;}}
 // Preserve separate runes, horns and aura pieces; reject only tiny disconnected export noise.
 seen.fill(0);for(let i=0;i<N;i++)if(!labels[i]&&!seen[i]&&data[i*4+3]>8){const b=visit(i,k=>!labels[k]&&data[k*4+3]>8);if(b.end<64)continue;const id=cell((b.x0+b.x1)/2,(b.y0+b.y1)/2)+1;for(let j=0;j<b.end;j++)labels[queue[j]]=id;}
 const boxes=Array.from({length:cols*rows},()=>({x0:w,y0:h,x1:0,y1:0}));
 for(let i=0;i<N;i++)if(labels[i]&&data[i*4+3]>16){const b=boxes[labels[i]-1],x=i%w,y=(i/w)|0;b.x0=Math.min(b.x0,x);b.y0=Math.min(b.y0,y);b.x1=Math.max(b.x1,x);b.y1=Math.max(b.y1,y);}
 return boxes.map((b,n)=>{
  const left=Math.max(0,b.x0-2),top=Math.max(0,b.y0-2),width=Math.min(w-1,b.x1+2)-left+1,height=Math.min(h-1,b.y1+2)-top+1,raw=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y+top)*w+x+left;if(labels[p]===n+1)data.copy(raw,(y*width+x)*4,p*4,p*4+4);}
  return {raw,width,height};
 });
};
