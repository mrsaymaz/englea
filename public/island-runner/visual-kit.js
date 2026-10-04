/* Small reusable vector motifs. No spritesheets, shaders or unbounded effects. */
(function(root){
 'use strict';
 const colors={gryffindor:'#f6ac58',hufflepuff:'#ead895',slytherin:'#82c99c',ravenclaw:'#92dced'};
 // Each island owns one silhouette; the curriculum realm still supplies its palette.
 const landmarks=[
  {name:'Lantern sanctuary',base:'M55 87V54L100 24l45 30v33H55ZM46 55l54-38 54 38-9 5-45-30-45 30Z',broken:'M55 87V54l27-19-5 18 19 7-8 27ZM112 87V51l33 3v33Z',detail:'M65 60h9v26h-9M127 60h9v26h-9',light:'M92 85V62a8 8 0 0 1 16 0v23Z',extra:'M40 87h120v6H40Z'},
  {name:'Clockwork station',base:'M48 88V54h40V38h24v16h40v34H48ZM82 39l18-18 18 18Z',broken:'M48 88V63h28v25ZM123 88V58h29v30ZM88 88V58h24v30Z',detail:'M58 66h15v13H58ZM127 66h15v13h-15Z',light:'M93 38h14v14H93ZM91 88V67h18v21Z',extra:'M37 94h126M60 90v8m28-8v8m28-8v8m28-8v8'},
  {name:'Crystal arch',base:'M57 88 64 46 83 33l17-14 22 16 15 14 9 39h-18l-9-36-19-13-17 13-9 36Z',broken:'M57 88 64 46l16 1 4 30-10 11-9 1ZM128 88l-8-25 15-14 11 39Z',detail:'M64 46l19 6-9 36M122 35l-3 17 18-3',light:'M100 27l9 12-9 12-9-12Z',extra:'M42 91l6-16 8 16M148 91l6-21 9 21'},
  {name:'Rootbound grove',base:'M96 88V60C48 72 45 35 69 36 53 10 97 13 101 30c25-25 56 6 34 19 28 15 2 35-29 17v22Z',broken:'M94 88V64L73 72 50 63l4-16 27 4-7-21 19 6 8 21 22-14 17 13-24 15-10 17Z',detail:'M101 60V32M96 72 78 59m27 5 23-12',light:'M95 62q6-9 12 0v13H95Z',extra:'M39 92q8-20 26-11m90 11q-8-20-26-11'},
  {name:'Signal viaduct',base:'M42 86V57h19v29h78V57h19v29ZM42 59h116v10H42ZM77 87V69h12v18m22 0V69h12v18',broken:'M42 86V57h19v12h23v-10H42ZM139 86V57h19v12h-34v-10h34Z',detail:'M47 57V37m104 20V37M62 87h77',light:'M44 29h10v9H44ZM147 29h10v9h-10Z',extra:'M34 90h132M63 95h75'},
  {name:'Storm spire',base:'M80 89 94 43V27h13v16l15 46ZM77 29l24-17 23 17Z',broken:'M80 89 88 62l17 7 8-14 9 34ZM94 66V45h13v21Z',detail:'M92 57h18M85 76h31M100 27V14',light:'M96 45h10v12H96Z',extra:'M57 73q-12-15 5-27m78 27q12-15-5-27M50 94h100'},
  {name:'Tidal lighthouse',base:'M81 89l9-51h22l9 51ZM86 39V25h30v14ZM82 25l19-15 19 15Z',broken:'M81 89l9-51h22l3 19-12 13 12-4 6 23Z',detail:'M88 56h26v11H88M87 78h28',light:'M92 28h18v8H92Z',extra:'M37 92q20-13 40 0t40 0t40 0'},
  {name:'Moon observatory',base:'M66 88V53h68v35ZM60 53a40 34 0 0 1 80 0ZM101 19l30-11 5 11-31 11Z',broken:'M66 88V53h22v35ZM115 88V53h19v35ZM60 53a40 34 0 0 1 29-32l-7 32Z',detail:'M70 55h60M89 88V70h22v18',light:'M106 19l23-9 4 8-24 9Z',extra:'M44 92h112M149 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z'},
  {name:'Ember forge',base:'M55 88V56h63V28h21v60ZM49 57l38-21 36 21Z',broken:'M55 88V67h25v21ZM99 88V56h19V40h21v48Z',detail:'M124 35h9v9h-9M59 70h16v8H59M101 70h12v8h-12',light:'M82 87V68q7-16 15 0v19Z',extra:'M42 92h116M136 22l-7-7 6-9'},
  {name:'Eclipse astrolabe',base:'M79 89l16-44h12l16 44ZM89 47V35h23v12Z',broken:'M79 89l9-22 11 9 9-18 15 31ZM89 47V35h23v12Z',detail:'M64 35a38 22 0 1 1 76 0 38 22 0 1 1-76 0M101 9V63M61 35h80',light:'M94 28h14v14H94Z',extra:'M43 91h116M150 17l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z'}
 ];
 function get(n){return landmarks[Math.max(0,Math.min(9,n-1))];}
 function landmarkSVG(n,stage,p){const l=get(n),fixed=stage>0;return `<g class="landmark" data-landmark="${n}"><path d="${fixed?l.base:l.broken}" fill="${p.stone}" stroke="#bdc9bd" stroke-width="1.3"/><path d="${l.detail}" fill="none" stroke="${fixed?'#d6c69a':'#596574'}" stroke-width="2" opacity="${fixed?'.8':'.3'}"/>${fixed?`<path class="landmark-light" d="${l.light}" fill="${p.light}"/>`:''}${stage>1?`<path d="${l.extra}" fill="none" stroke="${p.light}" stroke-width="2.5"/>`:''}${stage>2?'<path d="M50 92q4-12 14-10m73 10q-4-12-14-10" fill="none" stroke="#a1ce91" stroke-width="3"/>':''}${stage===4?'<ellipse cx="101" cy="54" rx="63" ry="40" fill="none" stroke="#f6dc99" stroke-width="1" opacity=".5"/>':''}</g>`;}
 const paths=new Map();
 function landmarkCanvas(c,n,x,y,size,p){
  // Native tests may supply Path2D; old canvases simply keep the other scenery planes.
  if(!root.Path2D)return;const l=get(n);c.save();c.translate(x-size*.5,y-size*.47);c.scale(size/200,size/200);c.globalAlpha=.45;
  for(const [d,fill,stroke]of [[l.broken,p.stone,p.mist]]){if(!paths.has(d))paths.set(d,new root.Path2D(d));const path=paths.get(d);if(fill){c.fillStyle=fill;c.fill(path);}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke(path);}}c.restore();
 }
 class Quality{
  constructor(){this.tier=0;this.reset();}
  reset(light=false){this.manual=light;this.tier=light?2:0;this.warm=1.5;this.slow=0;this.fast=0;this.cost=0;this.interval=1/60;}
  sample(seconds,cost){if(this.manual||seconds<=0||seconds>.75||!Number.isFinite(cost))return false;seconds=Math.min(.1,seconds);if(this.warm>0){this.warm-=seconds;return false;}
   this.cost+=.06*(cost-this.cost);this.interval+=.06*(seconds-this.interval);
   const slow=this.cost>(this.tier===0?11:19)||this.interval>(this.tier===0?.026:.043);
   this.slow=slow?this.slow+seconds:Math.max(0,this.slow-seconds*2);
   this.fast=this.cost<6&&this.interval<.022?this.fast+seconds:0;
   if(this.slow>2.5&&this.tier<2){this.tier++;this.slow=this.fast=0;this.warm=2;return true;}
   if(this.fast>12&&this.tier>0){this.tier--;this.slow=this.fast=0;this.warm=3;return true;}return false;
  }
  get limits(){return [{particles:60,strips:16,pixels:2400000,parallax:3},{particles:36,strips:10,pixels:1600000,parallax:2},{particles:18,strips:6,pixels:1000000,parallax:1}][this.tier];}
 }
 function projectile(c,n,x,y,r,time,reduced,color){
  c.save();c.translate(x,y);c.strokeStyle=color;c.fillStyle=color+'aa';c.lineWidth=3;
  const line=(a,b,d,e)=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke();};
  if(n===1){c.beginPath();c.ellipse(0,0,r*.45,r*1.4,0,0,Math.PI*2);c.stroke();line(r*.4,-r,r*.4,r);}
  else if(n===2){for(const dx of [-r*.55,r*.55]){c.save();c.translate(dx,0);if(!reduced)c.rotate(time*3);c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,s=i%2?r*.65:r;c.lineTo(Math.cos(a)*s,Math.sin(a)*s);}c.closePath();c.stroke();c.beginPath();c.arc(0,0,r*.3,0,Math.PI*2);c.stroke();c.restore();}}
  else if(n===3){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-r*1.2,i*r*.65);c.lineTo(r*.6,i*r*.65-r*.25);c.lineTo(r*.3,i*r*.65+r*.25);c.closePath();c.fill();}}
  else if(n===4){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*r*.6,r);c.bezierCurveTo(i*r*.6-r*.6,0,i*r*.6+r*.4,-r*.5,i*r*.6,-r*1.1);c.stroke();}}
  else if(n===5){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-r+i*5,-r+i*r);c.lineTo(r+i*5,-r+i*r);c.lineTo(r+i*5,-r+i*r+r*.4);c.stroke();}}
  else if(n===6){c.beginPath();c.moveTo(r,-r);c.lineTo(-r*.3,-r*.1);c.lineTo(r*.2,r*.1);c.lineTo(-r,r);c.stroke();line(-r*.5,-r,r*.4,r);}
  else if(n===7){c.beginPath();c.moveTo(r,r*.8);c.bezierCurveTo(-r*1.6,r*.8,-r*1.6,-r,r*.3,-r);c.bezierCurveTo(r*1.2,-r,r*.8,0,0,0);c.stroke();line(-r,r,r,r);}
  else if(n===8){for(let i=0;i<2;i++){c.beginPath();c.arc(i*r*.6,0,r*(1-i*.25),.7,5.6);c.stroke();}}
  else if(n===9){c.beginPath();c.moveTo(-r,r*.6);c.lineTo(-r*.7,-r*.6);c.lineTo(r*.5,-r);c.lineTo(r,r*.3);c.closePath();c.fill();line(-r*.4,-r*.5,r*.6,r*.2);}
  else {c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,r*.65,.8,5.5);c.stroke();for(const dx of [-r*1.35,r*1.35]){c.beginPath();c.arc(dx,0,r*.5,1,5.2);c.stroke();}}
  c.restore();
 }
 function element(c,team,x,y,r){c.save();c.translate(x,y);c.strokeStyle=colors[team];c.fillStyle=colors[team];c.lineWidth=1.5;c.beginPath();
  if(team==='gryffindor'){c.moveTo(0,-r);c.quadraticCurveTo(r*.4,0,r*.6,r*.2);c.quadraticCurveTo(0,r*1.2,-r*.5,r*.1);c.quadraticCurveTo(-r*.1,0,0,-r);c.fill();}
  else if(team==='hufflepuff'){c.moveTo(-r,r*.2);c.bezierCurveTo(-r,-r,r*.9,-r,r*.9,0);c.quadraticCurveTo(r*.6,r*.5,r*.3,0);c.moveTo(-r,r*.65);c.quadraticCurveTo(0,r*.1,r,r*.65);c.stroke();}
  else if(team==='slytherin'){c.moveTo(-r*.7,r*.7);c.quadraticCurveTo(-r,-r,r*.8,-r*.7);c.quadraticCurveTo(r,r,-r*.7,r*.7);c.fill();c.strokeStyle='#1d4438';c.moveTo(-r*.5,r*.5);c.lineTo(r*.5,-r*.5);c.stroke();}
  else{c.moveTo(0,-r);c.bezierCurveTo(-r*1.4,r*.2,-r*.4,r,0,r);c.bezierCurveTo(r*.6,r,r,r*.2,0,-r);c.fill();}c.restore();
 }
 const api={colors,landmarks,get,landmarkSVG,landmarkCanvas,Quality,projectile,element};if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerVisuals=api;
})(typeof globalThis!=='undefined'?globalThis:this);
