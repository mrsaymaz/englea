/* Continuous deformation of the current avatar; bounded canvas work, no pose flicker. */
(function(root){
 'use strict';
 function pose(team,run,reduced){
  if(reduced||run.paused)return {bob:0,angle:0,sx:1,sy:1,wave:0,phase:0};
  const airborne=run.jumpAge>=0,phase=run.time*(team==='hufflepuff'?6:team==='slytherin'?5:team==='ravenclaw'?4:7);
  // Jump progress follows distance on the course, so reading slowdown cannot freeze a pose mid-flight.
  if(airborne){const t=run.jumpProgress;return {bob:0,angle:-.10*Math.cos(Math.PI*t),sx:1+.025*Math.sin(Math.PI*t),sy:1-.025*Math.sin(Math.PI*t),wave:.006,phase};}
  if(run.phase!=='course')return {bob:0,angle:0,sx:1,sy:1,wave:0,phase};
  const bounce=Math.sin(phase),p=(1-Math.cos(phase))/2,ratio=Number.isFinite(run.speed/run.normalSpeed)?run.speed/run.normalSpeed:1,lean=-.025*Math.max(0,Math.min(1,ratio));
  return {bob:team==='ravenclaw'?bounce*.018:team==='slytherin'?0:-p*(team==='hufflepuff'?.008:.019),angle:lean+(team==='slytherin'?bounce*.018:bounce*.007),sx:1+p*.012,sy:1-p*.010,wave:team==='slytherin'?.018:team==='ravenclaw'?.010:.006,phase};
 }
 function draw(c,image,size,p,team,slices=16){
  const width=image.naturalWidth,height=image.naturalHeight||width;
  if(!p.wave){c.drawImage(image,-size*.5,-size*.8,size,size);return;}
  // Overlapping strips keep the original art intact while feet, coils or wings follow a smooth gait.
  for(let i=0;i<slices;i++){const t=i/slices,weight=team==='slytherin'?Math.sin(t*Math.PI):Math.max(0,(t-.45)/.55),offset=Math.sin(p.phase-t*5)*p.wave*size*weight;
   const sy=i*height/slices,sh=Math.min(height-sy,height/slices+1);c.drawImage(image,0,sy,width,sh,-size*.5+offset,-size*.8+i*size/slices,size,size*sh/height);
  }
 }
 function trail(c,team,x,y,size,time,reduced){
  if(reduced)return;c.save();c.lineWidth=1.8;
  const color={gryffindor:'#f6ac58',hufflepuff:'#ead895',slytherin:'#82c99c',ravenclaw:'#92dced'}[team];c.strokeStyle=color;c.fillStyle=color;
  for(let i=0;i<5;i++){const phase=(time*1.5+i/5)%1,tx=x-size*(.36+phase*.8),ty=y-size*.02+Math.sin(time*4+i)*size*.045;c.globalAlpha=(1-phase)*.55;
   c.beginPath();if(team==='gryffindor'){c.moveTo(tx,ty);c.lineTo(tx-size*.045,ty-size*(.02+phase*.03));c.lineTo(tx-size*.02,ty+size*.01);c.fill();}
   else if(team==='hufflepuff'){c.ellipse(tx,ty,size*.09,size*.024,-.2,0,Math.PI*1.5);c.stroke();}
   else if(team==='slytherin'){c.ellipse(tx,ty,size*.026,size*.011,phase*5,0,Math.PI*2);c.fill();}
   else {c.moveTo(tx-size*.08,ty);c.quadraticCurveTo(tx-size*.04,ty-size*.045,tx,ty);c.stroke();}
  }c.restore();
 }
 const api={pose,draw,trail};if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerSpiritMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
