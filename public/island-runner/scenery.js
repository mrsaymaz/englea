(function(root){
  'use strict';
  const V=typeof module==='object'&&module.exports?require('./visual-kit.js'):root.RunnerVisuals;
  // v9.4: each realm has a full daylight palette. The run starts muted and regains colour
  // as the team answers correctly (see Renderer.scenePalette).
  const palettes={
    academy:{sky:'#152439',mist:'#3b5b6a',hill:'#203e4e',stone:'#536473',moss:'#71998e',light:'#c8b477',
      skyTop:'#24426f',skyLow:'#e7b98d',sun:'#ffdca0',cloud:'#fbeedd',far:'#7489b0',mid:'#35517a',near:'#243b5d',ground:'#2c5552',lane:'#29475b',laneTop:'#6c97a2',foliage:'#92d4a0',window:'#ffd98a'},
    village:{sky:'#172b30',mist:'#385d57',hill:'#24433d',stone:'#506568',moss:'#91a274',light:'#ebc282',
      skyTop:'#2a6a8e',skyLow:'#f3d89b',sun:'#fff1ba',cloud:'#fffaf0',far:'#82b09e',mid:'#3f7a5a',near:'#2c5b45',ground:'#356640',lane:'#35533f',laneTop:'#93b67c',foliage:'#acde88',window:'#ffe3a0'},
    city:{sky:'#172039',mist:'#344c6e',hill:'#263955',stone:'#58677c',moss:'#6d9bb0',light:'#9bd8e8',
      skyTop:'#1c2a5b',skyLow:'#d47fa2',sun:'#ffc6ab',cloud:'#f6d9e6',far:'#6c71a9',mid:'#343f74',near:'#242c57',ground:'#29365a',lane:'#2b3a5c',laneTop:'#8193c6',foliage:'#92c7ea',window:'#ffe08f'},
    coast:{sky:'#142f3d',mist:'#337075',hill:'#245859',stone:'#5a7581',moss:'#9dbbb0',light:'#dace9d',
      skyTop:'#1d6d9b',skyLow:'#c3eade',sun:'#fff7cc',cloud:'#ffffff',far:'#72b8c2',mid:'#2e8b8e',near:'#1d646e',ground:'#327c78',lane:'#285c68',laneTop:'#92d8cd',foliage:'#a2e6c7',window:'#fff1b8'},
    harbour:{sky:'#1d283c',mist:'#535d6b',hill:'#354857',stone:'#6a6a76',moss:'#a0a482',light:'#f1c481',
      skyTop:'#383e78',skyLow:'#f5a86d',sun:'#ffd48b',cloud:'#ffe2c8',far:'#8b80a8',mid:'#4b4e78',near:'#32365a',ground:'#43465f',lane:'#373f57',laneTop:'#c9a07a',foliage:'#ecc58c',window:'#ffd17f'},
    forest:{sky:'#102c2c',mist:'#30554b',hill:'#1c423c',stone:'#4f6763',moss:'#7eab79',light:'#b8d5a0',
      skyTop:'#1d5a5b',skyLow:'#bfe3aa',sun:'#f7ffd2',cloud:'#f4fff0',far:'#619e88',mid:'#2e6e54',near:'#1e513d',ground:'#2a5a39',lane:'#2d4d3a',laneTop:'#8abb7b',foliage:'#ade38c',window:'#f4f0a8'},
    sky:{sky:'#1d2341',mist:'#45476b',hill:'#323752',stone:'#6b7392',moss:'#8b9ba3',light:'#dad3a0',
      skyTop:'#191848',skyLow:'#9381d3',sun:'#f5ebff',cloud:'#e6dcff',far:'#6d62ab',mid:'#3f397a',near:'#2a265b',ground:'#363167',lane:'#302b5b',laneTop:'#aa9de2',foliage:'#cbbcff',window:'#fff0b0',stars:true}
  };
  const hexCache=new Map();
  function rgb(hex){let v=hexCache.get(hex);if(!v){const n=parseInt(hex.slice(1,7),16);v=[n>>16&255,n>>8&255,n&255];hexCache.set(hex,v);}return v;}
  function hex([r,g,b]){return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');}
  // Unrestored colour: closer to grey and a little darker; v=1 is the full palette.
  function fade(color,v){const [r,g,b]=rgb(color),grey=r*.3+g*.55+b*.15,k=(1-v)*.78,d=1-(1-v)*.22;return hex([(r+(grey-r)*k)*d,(g+(grey-g)*k)*d,(b+(grey-b)*k)*d]);}
  function mixHex(a,b,t){const x=rgb(a),y=rgb(b);return hex(x.map((n,i)=>n+(y[i]-n)*t));}

  function islandSVG(realm,n,restoration){
    const p=palettes[realm]||palettes.academy;
    const stageValue=restoration?.stage??4;
    let landmark=V.landmarkSVG(n,stageValue,p);
    const stage=restoration?.stage??4,teams=restoration?.teams||[];
    const colors={gryffindor:'#fb7185',hufflepuff:'#fbbf24',slytherin:'#34d399',ravenclaw:'#38bdf8'};
    let renewal='';
    if(stage===0){landmark='<g opacity=".42">'+landmark+'</g>';renewal='<path d="m96 35-6 17 15 9-13 24" fill="none" stroke="#172a39" stroke-width="5"/>';}
    if(stage>0)renewal+='<path d="M45 94Q98 80 156 94" fill="none" stroke="#d6cfa3" stroke-width="3"/>';
    if(stage>1)renewal+='<path d="M40 89v-13m120 13V76" stroke="#d8caaa" stroke-width="3"/><circle cx="40" cy="75" r="4" fill="#ffe5a6"/><circle cx="160" cy="75" r="4" fill="#ffe5a6"/>';
    if(stage>2)renewal+='<path d="M53 96q0-14 12-14m-5 16q0-12 10-10M143 97q0-14-12-14" fill="none" stroke="#a5d6a4" stroke-width="3"/>';
    if(stage===4)renewal+='<ellipse cx="100" cy="94" rx="76" ry="21" fill="none" stroke="#f4dea1" stroke-width="1.5" opacity=".65"/>';
    const symbols={gryffindor:'M-3 4 0-6 4 1 1 5Z',hufflepuff:'M-5-2Q2-7 5-2M-5 3Q2-2 5 3',slytherin:'M-4 4Q-6-5 5-5Q6 5-4 4ZM-4 4 3-3',ravenclaw:'M0-6Q-9 3 0 6Q9 3 0-6Z'};
    renewal+=teams.map((team,i)=>`<g transform="translate(${100-(teams.length-1)*9+i*18} 117)"><circle r="8" fill="#112b3b" stroke="${colors[team]}"/><path d="${symbols[team]}" fill="none" stroke="${colors[team]}" stroke-width="1.4"/></g>`).join('');
    return `<svg class="island-art" viewBox="0 0 200 153" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="101" cy="134" rx="54" ry="8" fill="#07131b" opacity=".45"/><path d="m28 92 20 31 36 5 20 17 23-18 29-6 19-29Z" fill="${p.stone}"/><path d="m28 92 40 9 16 27-36-5Zm56 36 15-30 5 47Zm43-1 14-32 34-3-19 29Z" fill="#1a3144" opacity=".65"/><path d="m26 92 18-18 41-5 21 5 31-7 32 13 7 14-40 11-42-2-31 4Z" fill="${p.moss}"/><path d="m26 92 39 10 32-5 41 5 38-8" fill="none" stroke="#b4c6ae" stroke-width="2" opacity=".45"/>${landmark}${renewal}<path d="m${42+n%4*8} 107 5 10-2 7m103-22-3 10 1 7" fill="none" stroke="${p.light}" stroke-width="1" opacity=".5"/><circle cx="156" cy="87" r="2" fill="${p.light}"/><circle cx="46" cy="85" r="2" fill="${p.light}"/></svg>`;
  }
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.w=1000;this.h=500;this.particles=Array.from({length:60},()=>({life:0}));this.quality=new V.Quality();this.house=null;this.image=null;this.realm='academy';this.reduced=false;}
    resize(w,h,dpr=1){if(w<1||h<1)return;this.w=w;this.h=h;this.requestedDPR=dpr;dpr=Math.min(dpr,2,Math.sqrt(this.quality.limits.pixels/(w*h)));this.canvas.width=Math.max(1,Math.floor(w*dpr));this.canvas.height=Math.max(1,Math.floor(h*dpr));this.ctx.setTransform(dpr,0,0,dpr,0,0);}
    setup(house,image,realm,reduced,bossImage,bossInfo,light=false){this.bossImage=bossImage;this.bossInfo=bossInfo;this.house=house;this.image=image;this.realm=realm;this.reduced=reduced;this.quality.reset(light);this.particles.forEach(p=>p.life=0);this.lastJump=-1;this.landing=0;this.answerGlow=0;this.impact=0;this.impactFinal=false;
      // Scene colour returns with correct answers; already-restored islands start brighter.
      this.vivid=this.vividStart=0.46;this.vividCache=new Map();this.dustClock=0;this.gradients=new Map();
      let seed=(realm||'').length*97+7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
      this.clouds=Array.from({length:6},(_,i)=>({x:i/6+rnd()*.12,y:.06+rnd()*.2,s:.6+rnd()*.7,speed:.004+rnd()*.006}));
      this.stars=Array.from({length:42},()=>({x:rnd(),y:rnd()*.34,r:.6+rnd()*1.3,t:rnd()*6}));}
    restoredStart(stage){this.vivid=this.vividStart=Math.min(.82,.46+(stage||0)*.09);}
    scenePalette(realm){
      const q=Math.round(this.vivid*20)/20,key=realm+q;let p=this.vividCache.get(key);
      if(!p){const base=palettes[realm]||palettes.academy;p={stars:base.stars,vivid:q};for(const [k,v] of Object.entries(base))if(typeof v==='string')p[k]=fade(v,q);this.vividCache.set(key,p);}
      return p;
    }
    gradient(key,make){let g=this.gradients.get(key);if(!g){if(this.gradients.size>40)this.gradients.clear();g=make();this.gradients.set(key,g);}return g;}
    // Distinct mid-distance silhouettes, one tile per fifth of the width.
    skyline(realm,x,base,high,p,i){
      const c=this.ctx,w=this.w,h=this.h;c.fillStyle=p.mid;
      if(realm==='forest'){for(const [dx,r] of [[.03,.032],[.075,.045],[.125,.036]]){c.fillRect(x+w*dx-2,base-high*.35,4,high*.35);c.beginPath();c.ellipse(x+w*dx,base-high*.55-r*h*.6,r*w*.62,high*.5,0,0,Math.PI*2);c.fill();}}
      else if(realm==='village'){c.beginPath();c.ellipse(x+w*.1,base+h*.02,w*.13,high*.75,0,Math.PI,0);c.fill();c.fillStyle=p.near;this.polygon([[x+w*.04,base],[x+w*.04,base-high*.45],[x+w*.07,base-high*.75],[x+w*.1,base-high*.45],[x+w*.1,base]],p.near);c.fillStyle=p.window;c.globalAlpha*=.8;c.fillRect(x+w*.062,base-high*.36,w*.012,high*.14);c.globalAlpha/=.8;}
      else if(realm==='academy'){c.fillRect(x,base-high*.62,w*.11,high*.62);this.polygon([[x-w*.008,base-high*.62],[x+w*.055,base-high*.95],[x+w*.118,base-high*.62]],p.mid);
        if(i%2===0){c.fillRect(x+w*.13,base-high*1.25,w*.03,high*1.25);this.polygon([[x+w*.124,base-high*1.25],[x+w*.145,base-high*1.5],[x+w*.166,base-high*1.25]],p.mid);c.fillStyle=p.window;c.beginPath();c.arc(x+w*.145,base-high*1.08,w*.007,0,Math.PI*2);c.fill();}
        c.fillStyle=p.window;c.globalAlpha*=.75;for(let k=0;k<4;k++)c.fillRect(x+w*(.012+k*.025),base-high*.42,w*.01,high*.16);c.globalAlpha/=.75;}
      else if(realm==='city'){const towers=[[0,.045,1.15],[.05,.035,.8],[.09,.05,1.45],[.145,.03,.95]];for(const [dx,tw,th] of towers){c.fillStyle=p.mid;c.fillRect(x+w*dx,base-high*th,w*tw,high*th);c.fillStyle=p.window;c.globalAlpha*=.7;for(let r=1;r<th*5;r++)if((r+i)%3)c.fillRect(x+w*(dx+tw*.3),base-high*th+r*high*.19,w*tw*.4,high*.06);c.globalAlpha/=.7;}}
      else if(realm==='harbour'){c.beginPath();c.ellipse(x+w*.1,base+h*.01,w*.12,high*.35,0,Math.PI,0);c.fill();c.strokeStyle=p.mid;c.lineWidth=3;c.beginPath();c.moveTo(x+w*.06,base);c.lineTo(x+w*.06,base-high*1.3);c.lineTo(x+w*.15,base-high*1.3);c.moveTo(x+w*.13,base-high*1.3);c.lineTo(x+w*.13,base-high*.8);c.stroke();}
      else if(realm==='coast'){c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+w*.05,base-high*.9,x+w*.1,base-high*.4);c.quadraticCurveTo(x+w*.15,base-high*.7,x+w*.2,base);c.fill();if(i%3===1){c.strokeStyle=p.mid;c.lineWidth=3;c.beginPath();c.moveTo(x+w*.12,base-high*.5);c.quadraticCurveTo(x+w*.13,base-high*1.1,x+w*.11,base-high*1.3);c.stroke();c.beginPath();c.ellipse(x+w*.11,base-high*1.3,w*.025,high*.12,-.3,0,Math.PI*2);c.fill();}}
      else{c.beginPath();c.ellipse(x+w*.1,base-high*.75,w*.06,high*.22,0,0,Math.PI*2);c.fill();this.polygon([[x+w*.045,base-high*.75],[x+w*.1,base-high*.15],[x+w*.155,base-high*.75]],p.mid);c.fillStyle=p.window;c.globalAlpha*=.6;c.beginPath();c.arc(x+w*.1,base-high*.85,w*.006,0,Math.PI*2);c.fill();c.globalAlpha/=.6;}
    }
    sample(seconds,cost){if(this.quality.sample(seconds,cost)){this.resize(this.w,this.h,this.requestedDPR||1);for(let i=this.quality.limits.particles;i<60;i++)this.particles[i].life=0;}}
    burst(type,lane,magnet=false){
      if(type==='answer'){this.answerGlow=.65;this.answerLane=lane;}
      if(type==='bossHit'||type==='bossFinal'){this.impact=.45;this.impactFinal=type==='bossFinal';return;}
      if(this.reduced)return;let n=type==='hit'?10:magnet?2:5;
      for(let i=0;i<this.quality.limits.particles;i++){const p=this.particles[i];if(p.life>0)continue;Object.assign(p,{dust:false,x:this.w*(magnet?.235:.165),y:this.h*(.40+.24*lane),vx:Math.random()*110-50,vy:Math.random()*100-90,life:magnet?.34:.55,max:magnet?.34:.55,color:type==='hit'?'#e9a0a4':type==='answer'?this.house.color:'#f4d186',magnet,lane});if(--n===0)break;}
    }
    dust(x,y){for(let i=0;i<this.quality.limits.particles;i++){const p=this.particles[i];if(p.life>0)continue;Object.assign(p,{dust:true,magnet:false,x,y,vx:-70-Math.random()*60,vy:-8-Math.random()*14,life:.42,max:.42,color:'#e9e1cf'});return;}}
    polygon(points,fill){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();}
    obstacle(o,x,y,time){
      const c=this.ctx,w=this.w,h=this.h,s=Math.min(34,h*.068),rx=Math.min(w*.024,35);
      c.fillStyle='#050d1788';c.beginPath();c.ellipse(x,y+s*.6,rx*1.15,s*.23,0,0,Math.PI*2);c.fill();
      c.save();c.translate(x,y);c.lineWidth=2;
      if(o.shape==='root'){
        c.strokeStyle='#a1cc88';c.lineWidth=5;c.beginPath();c.moveTo(-rx,s*.4);c.bezierCurveTo(-rx,-s*.8,rx*.6,-s*.3,rx,-s);c.moveTo(0,s*.4);c.quadraticCurveTo(rx*.5,-s*.4,-rx*.5,-s*.6);c.stroke();
      }else if(['wave','vent','eclipse'].includes(o.shape)){
        c.strokeStyle=o.shape==='wave'?'#9cf3e0':o.shape==='vent'?'#ffd48a':'#d2b9ff';c.lineWidth=4;c.beginPath();
        if(o.shape==='wave'){c.moveTo(-rx*1.3,s*.4);c.quadraticCurveTo(-rx,-s,0,-s*.35);c.quadraticCurveTo(rx*.3,s*.4,rx*1.3,s*.15);}
        else if(o.shape==='vent'){c.moveTo(-rx,s*.3);c.lineTo(rx,s*.3);c.moveTo(-rx*.4,0);c.quadraticCurveTo(-rx,-s*.4,0,-s);c.moveTo(rx*.4,0);c.quadraticCurveTo(rx,-s*.4,rx*.3,-s*.8);}
        else c.arc(0,-s*.1,s*.8,0,Math.PI*2);c.stroke();
      }else if(o.shape==='log'){
        c.fillStyle='#785747';c.strokeStyle='#c19b68';c.beginPath();c.roundRect(-rx,-s*.35,rx*2,s*.85,s*.2);c.fill();c.stroke();
        c.fillStyle='#b88e65';c.beginPath();c.ellipse(rx*.85,s*.06,rx*.22,s*.41,0,0,Math.PI*2);c.fill();c.strokeStyle='#624936';c.beginPath();c.ellipse(rx*.85,s*.06,rx*.12,s*.26,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-rx*.75,0);c.lineTo(rx*.5,-s*.12);c.stroke();
      }else if(o.shape==='boulder'){
        this.polygon([[-rx,s*.35],[-rx*.85,-s*.38],[-rx*.2,-s*.85],[rx*.7,-s*.56],[rx,s*.3],[rx*.4,s*.6]],'#758892');
        this.polygon([[-rx*.85,-s*.38],[-rx*.2,-s*.85],[rx*.7,-s*.56],[0,-s*.05]],'#a0b1b4');c.strokeStyle='#c4cecc';c.beginPath();c.moveTo(-rx*.55,-s*.34);c.lineTo(-rx*.2,-s*.6);c.stroke();
      }else if(o.shape==='gear'){
        c.translate(0,-s*.05);if(!this.reduced)c.rotate(time*-1.7);const r=s*.86,points=[];
        for(let i=0;i<24;i++){const a=i*Math.PI/12,rad=i%3===0?r*.73:r;points.push([Math.cos(a)*rad,Math.sin(a)*rad]);}this.polygon(points,'#c59d68');c.strokeStyle='#e6c791';c.beginPath();c.arc(0,0,r*.58,0,Math.PI*2);c.stroke();c.fillStyle='#283c4a';c.beginPath();c.arc(0,0,r*.31,0,Math.PI*2);c.fill();
      }else if(o.shape==='barrier'){
        this.polygon([[-rx,s*.6],[-rx*.9,-s*.6],[rx*.8,-s*.6],[rx,s*.6]],'#697285');
        c.fillStyle='#d7b97c';c.fillRect(-rx*.8,-s*.28,rx*1.6,s*.22);c.fillStyle='#293c50';c.fillRect(-rx*.2,-s*.6,rx*.4,s*1.1);this.polygon([[0,-s*.35],[rx*.21,0],[0,s*.3],[-rx*.21,0]],'#b9cde1');
      }else{
        this.polygon([[-rx,s*.5],[-rx*.45,-s*.7],[-rx*.03,s*.15],[rx*.42,-s],[rx,s*.5]],'#8c819c');this.polygon([[-rx*.45,-s*.7],[-rx*.27,s*.5],[-rx,s*.5]],'#d5b5c8');this.polygon([[rx*.42,-s],[rx*.22,s*.5],[rx,s*.5]],'#b9aecf');
      }
      c.restore();
    }
    drawBoss(run){
      const c=this.ctx,w=this.w,h=this.h,b=run.boss,info=this.bossInfo||{color:'#c4a3ef'},color=info.color;
      const arrive=Math.min(1,b.age/1.1),gone=b.defeated?Math.min(1,b.clock/2):0;
      const size=Math.min(h*.88,w*.43),x=w*(.77+(1-arrive)*.3)+(this.reduced?0:b.recoil*35),y=h*.53;
      c.save();c.globalAlpha=1-gone;
      c.fillStyle='#030b1899';c.beginPath();c.ellipse(x,y+size*.35,size*.36,size*.055,0,0,Math.PI*2);c.fill();
      const aura=c.createRadialGradient(x,y,0,x,y,size*.52);aura.addColorStop(0,color+'20');aura.addColorStop(1,color+'00');c.fillStyle=aura;c.fillRect(x-size*.53,y-size*.53,size*1.06,size*1.06);
      if(this.bossImage&&this.bossImage.complete&&this.bossImage.naturalWidth)c.drawImage(this.bossImage,x-size*.5,y-size*.5+gone*22,size,size);
      else{c.fillStyle=color;c.beginPath();c.arc(x,y,size*.3,0,Math.PI*2);c.fill();}
      if(b.state==='expose'){
        c.fillStyle='#fff0b6';c.strokeStyle='#f8d78b';c.lineWidth=2;
        c.beginPath();c.arc(x-size*.18,y,size*.032,0,Math.PI*2);c.fill();
        c.beginPath();c.arc(x-size*.18,y,size*.065,0,Math.PI*2);c.stroke();
      }
      if(this.impact>0){const t=1-this.impact/.45,rad=size*(.08+t*(this.impactFinal?.33:.16));
        c.globalAlpha=(1-gone)*(1-t);c.strokeStyle=this.impactFinal?'#fff4c7':'#f8dda2';c.lineWidth=this.impactFinal?5:3;c.beginPath();c.arc(x-size*.18,y,rad,0,Math.PI*2);c.stroke();
        if(this.impactFinal&&!this.reduced){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(x-size*.18+Math.cos(a)*rad,y+Math.sin(a)*rad);c.lineTo(x-size*.18+Math.cos(a)*(rad+12),y+Math.sin(a)*(rad+12));c.stroke();}}
      }
      if(b.recoil>0&&!this.reduced){c.strokeStyle='#ffe5a5';c.lineWidth=3;c.beginPath();c.arc(x-size*.1,y,size*.1*(1-b.recoil/.18)+8,0,Math.PI*2);c.stroke();}
      c.restore();
      const from={x:w*.205,y:h*(.4+.24*run.lanePos)},to={x:x-size*.18,y:y};
      for(const shot of b.shots){const startY=h*(.4+.24*shot.lane),t=Math.min(1,shot.age/shot.duration),sx=from.x+(to.x-from.x)*t,sy=startY+(to.y-startY)*t-Math.sin(t*Math.PI)*h*.075;
        if(shot.word){
          // Word Strike: the spelled word itself flies to the guardian.
          const fs=Math.max(16,Math.min(34,h*.07));c.save();c.font=`800 ${fs}px Georgia,"Times New Roman",serif`;c.textAlign='center';c.textBaseline='middle';
          const tw=c.measureText(shot.word).width+fs;c.fillStyle='#1b2433dd';c.strokeStyle=this.house.color;c.lineWidth=3;c.beginPath();c.roundRect(sx-tw/2,sy-fs*.8,tw,fs*1.6,fs*.5);c.fill();c.stroke();
          c.fillStyle='#fff1c4';c.fillText(shot.word,sx,sy+1);c.restore();continue;
        }
        c.strokeStyle='#f8d38888';c.lineWidth=3;c.beginPath();c.moveTo(sx-w*.035,sy+3);c.lineTo(sx,sy);c.stroke();c.fillStyle='#ffdf93';c.beginPath();c.arc(sx,sy,Math.min(8,h*.022),0,Math.PI*2);c.fill();c.fillStyle='#fff5cc';c.beginPath();c.arc(sx,sy,3,0,Math.PI*2);c.fill();}
      if(b.state==='counter'&&b.clock<.7){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(to.x,to.y,size*.13*(.6+b.clock),0,Math.PI*2);c.stroke();}
      if(b.state==='counter'&&b.attack>0){
        const ax=to.x+(from.x-to.x)*b.attack,ay=to.y+(from.y-to.y)*b.attack;
        V.projectile(c,run.island,ax,ay,Math.min(34,h*.09),b.clock,this.reduced,color);
      }
    }
    encounter(run){
      const c=this.ctx,w=this.w,h=this.h,m=run.mechanic,b=run.boss;
      const band=(lane,color,mark)=>{const y=h*(.4+.24*lane);c.fillStyle=color+'20';c.fillRect(w*.08,y-h*.10,w*.86,h*.16);c.strokeStyle=color;c.lineWidth=2;c.setLineDash([8,8]);c.strokeRect(w*.08,y-h*.10,w*.86,h*.16);c.setLineDash([]);c.fillStyle=color;c.font=`bold ${Math.max(16,h*.055)}px system-ui`;c.textAlign='center';c.fillText(mark,w*.43,y-h*.01);};
      if(m&&!m.resolved){
        const x=w*(.165+(m.at-run.distance)/1000),reward=['rune','wind','sequence'].includes(m.rule);
        if(reward){
          for(let lane=0;lane<3;lane++){
            const y=h*(.4+.24*lane);c.strokeStyle=run.config.color;c.lineWidth=3;c.globalAlpha=lane===m.lane?1:.2;
            c.beginPath();c.moveTo(x,y-h*.06);c.lineTo(x+h*.035,y);c.lineTo(x,y+h*.06);c.lineTo(x-h*.035,y);c.closePath();
            if(lane===m.lane){c.fillStyle=run.config.color;c.fill();}else c.stroke();c.globalAlpha=1;
          }
          if(m.rule==='wind'){c.strokeStyle=run.config.color;c.lineWidth=2;for(let i=0;i<3;i++){const y=h*(.4+.24*m.lane)+i*5;c.beginPath();c.moveTo(x-40,y);c.quadraticCurveTo(x-10,y-15,x+20,y);c.stroke();}}
          if(m.rule==='sequence'){c.fillStyle=run.config.color;c.font='bold 16px system-ui';c.fillText(`${m.step+1} / 3`,x,h*(.4+.24*m.lane)-h*.08);}
        }else{
          for(const lane of m.lanes){band(lane,run.config.color,'↑');this.obstacle({shape:run.config.shape},x,h*(.4+.24*lane),run.time);}
          if(m.rule==='signal'||m.rule==='eclipse')band(m.lane,'#94e0bd','✓');
        }
      }
      if(b&&['warn','strike','expose'].includes(b.state)){
        if(b.state==='expose'){
          const lane=b.weakLane,y=h*(.4+.24*lane);band(lane,'#f6da91','◆');c.strokeStyle='#ffe7a2';c.lineWidth=3;c.beginPath();c.ellipse(w*.165,y,h*.075,h*.06,0,0,Math.PI*2);c.stroke();
        }else for(const lane of b.lanes){band(lane,'#f5a7af','↑');if(b.state==='strike'){
          const x=w*(.78-.615*b.attack),y=h*(.4+.24*lane);c.fillStyle=this.bossInfo.color;c.strokeStyle=this.bossInfo.color;c.lineWidth=4;
          V.projectile(c,run.island,x,y,Math.min(24,h*.06),run.time,this.reduced,this.bossInfo.color);
        }}
      }
      if(run.gate?.choicesShown){
        // Only the choice marker moves; answer text stays still and readable.
        const x=w*(.93-.765*run.gate.ratio);c.strokeStyle='#e8d7a5aa';c.lineWidth=2;
        for(let lane=0;lane<3;lane++){const y=h*(.4+.24*lane);c.beginPath();c.moveTo(x-6,y+h*.08);c.lineTo(x,y+h*.055);c.lineTo(x+6,y+h*.08);c.stroke();}
      }
    }
    // Word Trail letter tiles: large, high-contrast and stationary in their lanes.
    letters(run){
      const c=this.ctx,w=this.w,h=this.h,t=run.trail,r=Math.max(15,Math.min(30,h*.055));
      c.save();c.font=`800 ${Math.round(r*1.15)}px Georgia,"Times New Roman",serif`;c.textAlign='center';c.textBaseline='middle';
      for(let n=t.index;n<t.steps.length;n++){
        const step=t.steps[n],dx=step.at-run.distance;if(dx>940)break;if(dx<-50)continue;
        const x=w*(.165+dx/1000),next=n===t.index;
        for(let lane=0;lane<3;lane++){
          const y=h*(.40+.24*lane);
          c.fillStyle='#0b162466';c.beginPath();c.ellipse(x,y+h*.09,r*1.05,r*.22,0,0,Math.PI*2);c.fill();
          c.fillStyle=next?'#f6e7c1':'#d9c9a3cc';c.strokeStyle=next?'#c9973f':'#9f855acc';c.lineWidth=next?3:2;
          c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();
          c.fillStyle='#24180c';c.fillText(step.letters[lane],x,y+1);
        }
      }
      c.restore();
    }
    render(run,dt){
      const c=this.ctx,w=this.w,h=this.h,detail=this.quality.limits.parallax;
      if(!run.paused){this.answerGlow=Math.max(0,(this.answerGlow||0)-dt);this.impact=Math.max(0,(this.impact||0)-dt);}
      // Colour returns with each correct answer and fully with the guardian's defeat.
      const target=run.boss?.defeated||run.status==='completed'?1:Math.min(.96,this.vividStart+(run.correct||0)*((1-this.vividStart)/6));
      if(!run.paused)this.vivid+=(target-this.vivid)*Math.min(1,dt*(this.reduced?8:1.6));
      const p=this.scenePalette(this.realm),move=!this.reduced,still=!move||detail<2;
      c.fillStyle=this.gradient('sky'+p.skyTop+h,()=>{const g=c.createLinearGradient(0,0,0,h*.42);g.addColorStop(0,p.skyTop);g.addColorStop(1,p.skyLow);return g;});c.fillRect(0,0,w,h*.42);
      if(p.stars){c.fillStyle='#ffffff';for(const st of this.stars){c.globalAlpha=(.35+.35*(move?Math.sin(run.time*1.6+st.t):.5))*(1-p.vivid*.4);c.fillRect(st.x*w,st.y*h,st.r,st.r);}c.globalAlpha=1;}
      const sunX=w*.8,sunY=h*.14,sunR=h*.075;
      c.fillStyle=this.gradient('sun'+p.sun+w+h,()=>{const g=c.createRadialGradient(sunX,sunY,0,sunX,sunY,sunR*4);g.addColorStop(0,p.sun+'aa');g.addColorStop(.25,p.sun+'44');g.addColorStop(1,p.sun+'00');return g;});c.fillRect(sunX-sunR*4,sunY-sunR*4,sunR*8,sunR*8);
      c.fillStyle=p.sun;c.beginPath();c.arc(sunX,sunY,sunR,0,Math.PI*2);c.fill();
      if(detail>1){c.fillStyle=p.cloud;for(const cl of this.clouds){const cx=((cl.x-(move?run.time*cl.speed:0))%1.2+1.2)%1.2*w-w*.1,cy=cl.y*h,r=h*.035*cl.s;c.globalAlpha=.55;c.beginPath();c.ellipse(cx,cy,r*2.6,r,0,0,Math.PI*2);c.ellipse(cx-r*1.3,cy+r*.25,r*1.5,r*.75,0,0,Math.PI*2);c.ellipse(cx+r*1.1,cy-r*.35,r*1.4,r*.85,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
      // Far ridges with a soft haze toward the horizon.
      for(let i=-1;i<7;i++){const x=i*w/6-(still?0:run.distance*.025)%(w/6),peak=h*(.13+(i%3)*.05);this.polygon([[x,h*.42],[x+w*.13,peak],[x+w*.29,h*.42]],p.far);}
      c.fillStyle=this.gradient('haze'+p.skyLow+h,()=>{const g=c.createLinearGradient(0,h*.2,0,h*.42);g.addColorStop(0,p.skyLow+'00');g.addColorStop(1,p.skyLow+'88');return g;});c.fillRect(0,h*.2,w,h*.22);
      // The island's own landmark stays recognisable above the lanes.
      V.landmarkCanvas(c,run.island,w*.68-(still?0:run.distance*.012)%(w*.12),h*.28,Math.min(h*.62,w*.26),p);
      const shift=(still?0:run.distance*.10)%(w/5);
      for(let i=-1;i<7;i++){const x=i*w/5-shift,base=h*.42,high=h*(.12+.05*((i+6)%3));this.skyline(this.realm,x,base,high,p,(i+7)%7);}
      // Ground: a lit band behind the lanes, darker toward the viewer.
      c.fillStyle=this.gradient('ground'+p.ground+h,()=>{const g=c.createLinearGradient(0,h*.41,0,h);g.addColorStop(0,mixHex(p.ground,p.skyLow,.25));g.addColorStop(.35,p.ground);g.addColorStop(1,p.near);return g;});c.fillRect(0,h*.41,w,h*.59);
      c.fillStyle=p.near;c.fillRect(0,h*.41,w,2);
      const glow=V.colors[this.house.id]||this.house.color;
      for(let lane=0;lane<3;lane++){
        const y=h*(.40+.24*lane),top=y+h*.025,depth=h*.065,current=lane===run.lane;
        c.fillStyle='#04101c55';c.fillRect(0,top+depth,w,h*.03);
        c.fillStyle=p.lane;c.fillRect(0,top,w,depth);
        c.fillStyle=p.laneTop;c.fillRect(0,top,w,Math.max(2,h*.007));
        c.fillStyle='#04101c40';c.fillRect(0,top+depth-Math.max(2,h*.008),w,Math.max(2,h*.008));
        if(current){c.fillStyle=glow;c.globalAlpha=.16;c.fillRect(0,top,w,depth);c.globalAlpha=.85;c.fillRect(0,top,w,Math.max(2,h*.005));c.globalAlpha=1;}
        if(this.answerGlow>0&&lane===this.answerLane){c.fillStyle=this.house.color;c.globalAlpha=this.answerGlow*.32;c.fillRect(0,top,w,depth);c.globalAlpha=1;}
        // Paving joints scroll with the run; tufts sit in the gaps between lanes.
        const step=75,offset=(run.distance*w/1000)%step;c.strokeStyle=p.laneTop;c.globalAlpha=.22;c.lineWidth=1;
        for(let x=-offset;x<w+20;x+=step){c.beginPath();c.moveTo(x,top+2);c.lineTo(x-14,top+depth);c.stroke();}
        c.globalAlpha=1;
        if(detail>1&&lane<2){c.fillStyle=p.foliage;c.globalAlpha=.38;const gy=top+depth+h*.075,toff=(still?0:run.distance*w/1000)%180,g=Math.max(5,h*.016);
          for(let x=-toff+60*lane;x<w+20;x+=180){c.beginPath();c.moveTo(x-g*1.2,gy);c.lineTo(x-g*.7,gy-g*1.3);c.lineTo(x-g*.2,gy);c.lineTo(x+g*.1,gy-g*1.9);c.lineTo(x+g*.5,gy);c.lineTo(x+g,gy-g*1.1);c.lineTo(x+g*1.4,gy);c.closePath();c.fill();}
          c.globalAlpha=1;}
      }
      if(run.phase==='course'){
        for(const o of run.objects){if(o.done)continue;const dx=o.at-run.distance;if(dx<-50||dx>940)continue;const x=w*(.165+dx/1000),y=h*(.40+.24*o.lane);if(x>w+60)continue;
          if(o.type==='coin'){
            const r=Math.min(13,h*.032);c.fillStyle='#111f2a99';c.beginPath();c.ellipse(x,y+h*.09,r*1.2,r*.24,0,0,Math.PI*2);c.fill();const spin=this.reduced?1:.6+.4*Math.abs(Math.cos(run.time*3+o.at*.013)),rx=r*.82*spin;c.fillStyle='#b98240';c.beginPath();c.ellipse(x+2*spin,y,rx,r,0,0,Math.PI*2);c.fill();c.fillStyle='#f4cf72';c.beginPath();c.ellipse(x,y,rx,r,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff0b8';c.lineWidth=1.4;c.stroke();this.polygon([[x,y-r*.55],[x+r*.34*spin,y],[x,y+r*.55],[x-r*.34*spin,y]],'#ad7537');c.fillStyle='#fffbe6';c.globalAlpha=.85;c.beginPath();c.ellipse(x-rx*.38,y-r*.42,rx*.16,r*.2,-.5,0,Math.PI*2);c.fill();c.globalAlpha=1;
          }else{
            this.obstacle(o,x,y,run.time);
          }
        }
      }
      this.encounter(run);
      if(run.trail&&run.trail.started&&!run.trail.done)this.letters(run);
      // A stable silhouette with a small gait; no rapid pose swapping.
      const knockout=run.boss?.state==='knockout'?Math.min(1,run.boss.clock/.8):0;
      const x=w*(.165+run.jumpForward/1000-knockout*.065),y=h*(.40+.24*run.lanePos),size=Math.min(188,h*.25,w*.18)*(this.artScale||1),hop=run.jumpHeight*Math.min(145,h*.25,Math.max(0,y-size*.8-6)),bob=this.reduced||run.paused||run.phase==='boss'?0:Math.sin(run.time*13)*Math.min(2.2,h*.006);
      c.fillStyle='#07101c99';c.beginPath();c.ellipse(x,y+size*.15,size*.37*(1-run.jumpHeight*.27),size*.063,0,0,Math.PI*2);c.fill();
      const motion=root.RunnerSpiritMotion,pose=motion?.pose(this.house.id,run,this.reduced);
      if(run.focusTime>0){c.save();c.strokeStyle=V.colors[this.house.id];c.lineWidth=run.focusShield?3:1.5;c.globalAlpha=.8;c.beginPath();c.ellipse(x,y-hop-size*.27,size*.48,size*.54,0,0,Math.PI*2);c.stroke();
        if(!this.reduced){for(let i=0;i<3;i++){const a=run.time*.9+i*Math.PI*2/3,fx=x+Math.cos(a)*size*.48,fy=y-hop-size*.27+Math.sin(a)*size*.5;V.element(c,this.house.id,fx,fy,size*.07);}}
        if(motion&&detail>1)motion.trail(c,this.house.id,x,y-hop*.45,size*1.2,run.time,this.reduced);c.restore();}
      if(motion&&detail===3&&run.phase==='course'&&!run.paused&&!run.focusTime)motion.trail(c,this.house.id,x,y-hop*.45,size,run.time,this.reduced);
      if(!this.reduced&&!run.paused&&run.phase==='course'&&run.jumpAge<0&&detail>1){this.dustClock-=dt;if(this.dustClock<=0){this.dustClock=.11;this.dust(x-size*.12,y+size*.12);}}
      if(this.lastJump>=0&&run.jumpAge<0&&!this.reduced){this.landing=.3;for(let i=0;i<3;i++)this.dust(x+(i-1)*size*.14,y+size*.13);}
      this.lastJump=run.jumpAge;if(!run.paused)this.landing=Math.max(0,(this.landing||0)-dt);
      if(this.landing>0){c.save();c.globalAlpha=this.landing*1.6;c.strokeStyle=this.house.color;c.lineWidth=2;c.beginPath();c.ellipse(x,y+size*.15,size*(.35+(.3-this.landing)),size*.08,0,0,Math.PI*2);c.stroke();c.restore();}
      c.save();c.translate(x,y-hop+(pose?pose.bob*size:bob));c.rotate(knockout?-knockout*.5:(pose?.angle||0));if(pose)c.scale(pose.sx,pose.sy);
      // Landing squash: a short, bounded settle after each jump.
      if(this.landing>0&&!this.reduced){const k=Math.sin(this.landing/.3*Math.PI)*.11;c.scale(1+k,1-k);}
      if(run.invincible>0)c.globalAlpha=.8;
      if(this.image&&this.image.complete&&this.image.naturalWidth){if(motion)motion.draw(c,this.image,size,pose,this.house.id,this.quality.limits.strips);else c.drawImage(this.image,-size*.5,-size*.8,size,size);}
      else{c.fillStyle=this.house.color;c.beginPath();c.arc(0,-size*.25,size*.25,0,Math.PI*2);c.fill();}
      c.restore();
      if(run.boss)this.drawBoss(run);
      if(run.phase==='finish'){const fx=w*(.165+(run.length-run.distance)/1000);c.strokeStyle='#c8dfb2aa';c.lineWidth=5;c.beginPath();c.moveTo(fx,h*.1);c.lineTo(fx,h*.93);c.stroke();c.fillStyle='#c8dfb244';c.fillRect(fx-6,h*.1,12,h*.83);}
      if(!run.paused)for(const z of this.particles){if(z.life<=0)continue;z.life=Math.max(0,z.life-dt);if(z.dust){z.x+=z.vx*dt;z.y+=z.vy*dt;}else if(!z.magnet){z.x+=z.vx*dt;z.y+=z.vy*dt;z.vy+=130*dt;}}
      for(const z of this.particles){if(z.life<=0)continue;const t=1-z.life/z.max;c.globalAlpha=z.life/z.max;c.fillStyle=z.color;
        if(z.magnet){const tx=z.x+(x-z.x)*t,ty=z.y+(y-hop-size*.23-z.y)*t-Math.sin(t*Math.PI)*size*.13;c.strokeStyle=z.color;c.lineWidth=1.5;c.beginPath();c.moveTo(tx+10,ty-3);c.quadraticCurveTo(tx+4,ty-8,tx,ty);c.stroke();c.beginPath();c.arc(tx,ty,3,0,Math.PI*2);c.fill();}else if(z.dust){c.globalAlpha=(z.life/z.max)*.45;c.beginPath();c.arc(z.x,z.y,2+t*6,0,Math.PI*2);c.fill();}else c.fillRect(z.x,z.y,3,3);
      }c.globalAlpha=1;
      const vignette=c.createLinearGradient(0,0,w,0);vignette.addColorStop(0,'#06132344');vignette.addColorStop(.17,'#06132300');vignette.addColorStop(.85,'#06132300');vignette.addColorStop(1,'#06132366');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    }
  }
  const api={islandSVG,Renderer,palettes};if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerScenery=api;
})(typeof globalThis!=='undefined'?globalThis:this);
