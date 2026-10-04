(function(root){
  'use strict';
  const V=typeof module==='object'&&module.exports?require('./visual-kit.js'):root.RunnerVisuals;
  const palettes={
    academy:{sky:'#152439',mist:'#3b5b6a',hill:'#203e4e',stone:'#536473',moss:'#71998e',light:'#c8b477'},
    village:{sky:'#172b30',mist:'#385d57',hill:'#24433d',stone:'#506568',moss:'#91a274',light:'#ebc282'},
    city:{sky:'#172039',mist:'#344c6e',hill:'#263955',stone:'#58677c',moss:'#6d9bb0',light:'#9bd8e8'},
    coast:{sky:'#142f3d',mist:'#337075',hill:'#245859',stone:'#5a7581',moss:'#9dbbb0',light:'#dace9d'},
    harbour:{sky:'#1d283c',mist:'#535d6b',hill:'#354857',stone:'#6a6a76',moss:'#a0a482',light:'#f1c481'},
    forest:{sky:'#102c2c',mist:'#30554b',hill:'#1c423c',stone:'#4f6763',moss:'#7eab79',light:'#b8d5a0'},
    sky:{sky:'#1d2341',mist:'#45476b',hill:'#323752',stone:'#6b7392',moss:'#8b9ba3',light:'#dad3a0'}
  };
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
    setup(house,image,realm,reduced,bossImage,bossInfo,light=false){this.bossImage=bossImage;this.bossInfo=bossInfo;this.house=house;this.image=image;this.realm=realm;this.reduced=reduced;this.quality.reset(light);this.particles.forEach(p=>p.life=0);this.lastJump=-1;this.landing=0;this.answerGlow=0;this.impact=0;this.impactFinal=false;}
    sample(seconds,cost){if(this.quality.sample(seconds,cost)){this.resize(this.w,this.h,this.requestedDPR||1);for(let i=this.quality.limits.particles;i<60;i++)this.particles[i].life=0;}}
    burst(type,lane,magnet=false){
      if(type==='answer'){this.answerGlow=.65;this.answerLane=lane;}
      if(type==='bossHit'||type==='bossFinal'){this.impact=.45;this.impactFinal=type==='bossFinal';return;}
      if(this.reduced)return;let n=type==='hit'?10:magnet?2:5;
      for(let i=0;i<this.quality.limits.particles;i++){const p=this.particles[i];if(p.life>0)continue;Object.assign(p,{x:this.w*(magnet?.235:.165),y:this.h*(.40+.24*lane),vx:Math.random()*110-50,vy:Math.random()*100-90,life:magnet?.34:.55,max:magnet?.34:.55,color:type==='hit'?'#e9a0a4':type==='answer'?this.house.color:'#f4d186',magnet,lane});if(--n===0)break;}
    }
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
      const c=this.ctx,w=this.w,h=this.h,p=palettes[this.realm]||palettes.academy,detail=this.quality.limits.parallax;
      if(!run.paused){this.answerGlow=Math.max(0,(this.answerGlow||0)-dt);this.impact=Math.max(0,(this.impact||0)-dt);}
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,p.sky);sky.addColorStop(.7,p.hill);sky.addColorStop(1,'#102031');c.fillStyle=sky;c.fillRect(0,0,w,h);
      // Distant terrain scrolls slowly; scenery never competes with answer text.
      c.globalAlpha=.27;
      for(let i=-1;i<7;i++){const x=i*w/6-(this.reduced||detail<3?0:run.distance*.025)%(w/6),peak=h*(.06+(i%3)*.055);this.polygon([[x,h*.55],[x+w*.13,peak],[x+w*.29,h*.55]],p.mist);}
      c.globalAlpha=1;
      const moonX=w*.83,moonY=h*.09;c.fillStyle='#d5d8be18';c.beginPath();c.arc(moonX,moonY,h*.14,0,Math.PI*2);c.fill();c.fillStyle='#ccdab735';c.beginPath();c.arc(moonX,moonY,h*.07,0,Math.PI*2);c.fill();
      // A second depth plane: the recognisable landmark is above the running lanes.
      V.landmarkCanvas(c,run.island,w*.68-(this.reduced||detail<2?0:run.distance*.012)%(w*.12),h*.28,Math.min(h*.62,w*.26),p);
      const shift=(this.reduced||detail<2?0:run.distance*.10)%(w/5);
      for(let i=-1;i<7;i++){
        const x=i*w/5-shift,base=h*.39,high=h*(.12+.08*((i+6)%3));
        c.fillStyle=p.hill;
        if(this.realm==='forest'||this.realm==='village'){this.polygon([[x,base],[x+w*.04,base-high],[x+w*.08,base]],p.hill);this.polygon([[x+w*.05,base],[x+w*.1,base-high*1.25],[x+w*.15,base]],p.hill);}
        else if(this.realm==='city'||this.realm==='academy'){c.fillRect(x,base-high,w*.045,high);c.fillRect(x+w*.05,base-high*.7,w*.06,high*.7);c.fillStyle=p.light+'22';c.fillRect(x+w*.012,base-high+9,4,9);c.fillRect(x+w*.068,base-high*.7+12,4,9);}
        else{this.polygon([[x,base],[x+w*.07,base-high],[x+w*.09,base-high*.6],[x+w*.15,base-high*.85],[x+w*.2,base]],p.hill);}
      }
      // Near-edge foliage gives the third depth plane without covering a coin or a choice.
      if(detail===3)for(let i=-1;i<5;i++){const x=i*w*.3-(this.reduced?0:run.distance*.22)%(w*.3);c.strokeStyle=p.moss+'55';c.lineWidth=2;c.beginPath();c.moveTo(x,h);c.quadraticCurveTo(x+10,h*.96,x+32,h*.965);c.moveTo(x+8,h);c.quadraticCurveTo(x-8,h*.94,x-22,h*.96);c.stroke();}
      for(let lane=0;lane<3;lane++){
        const y=h*(.40+.24*lane),top=y+h*.025,depth=h*.065;
        c.fillStyle=lane===run.lane?'#3c6472aa':'#284755aa';c.fillRect(0,top,w,depth);
        c.fillStyle='#0a1d2eaa';c.fillRect(0,top+depth,w,h*.025);
        c.strokeStyle=lane===run.lane?'#9bbaba88':'#7698ad44';c.lineWidth=1;c.beginPath();c.moveTo(0,top);c.lineTo(w,top);c.stroke();
        c.strokeStyle='#162a3f88';c.lineWidth=1;
        if(this.answerGlow>0&&lane===this.answerLane){c.fillStyle=this.house.color;c.globalAlpha=this.answerGlow*.27;c.fillRect(0,top,w,depth);c.globalAlpha=1;}
        const step=75,offset=(run.distance*w/1000)%step;
        for(let x=-offset;x<w;x+=step){c.beginPath();c.moveTo(x,top);c.lineTo(x-17,top+depth);c.lineTo(x-17,top+depth+h*.024);c.stroke();}
        c.setLineDash([16,25]);c.lineDashOffset=(run.distance*w/1000)%41;c.strokeStyle='#9ab4ba18';c.beginPath();c.moveTo(0,top+depth*.5);c.lineTo(w,top+depth*.5);c.stroke();c.setLineDash([]);
      }
      if(run.phase==='course'){
        for(const o of run.objects){if(o.done)continue;const dx=o.at-run.distance;if(dx<-50||dx>940)continue;const x=w*(.165+dx/1000),y=h*(.40+.24*o.lane);if(x>w+60)continue;
          if(o.type==='coin'){
            const r=Math.min(13,h*.032);c.fillStyle='#111f2a99';c.beginPath();c.ellipse(x,y+h*.09,r*1.2,r*.24,0,0,Math.PI*2);c.fill();c.fillStyle='#bd8945';c.beginPath();c.ellipse(x+2,y,r*.82,r,0,0,Math.PI*2);c.fill();c.fillStyle='#f1cb74';c.beginPath();c.ellipse(x,y,r*.82,r,0,0,Math.PI*2);c.fill();c.strokeStyle='#ffedb1';c.lineWidth=1.4;c.stroke();this.polygon([[x,y-r*.55],[x+r*.34,y],[x,y+r*.55],[x-r*.34,y]],'#ae773c');
          }else{
            this.obstacle(o,x,y,run.time);
          }
        }
      }
      this.encounter(run);
      if(run.trail&&run.trail.started&&!run.trail.done)this.letters(run);
      // A stable silhouette with a small gait; no rapid pose swapping.
      const knockout=run.boss?.state==='knockout'?Math.min(1,run.boss.clock/.8):0;
      const x=w*(.165+run.jumpForward/1000-knockout*.065),y=h*(.40+.24*run.lanePos),size=Math.min(188,h*.25,w*.18),hop=run.jumpHeight*Math.min(145,h*.25,Math.max(0,y-size*.8-6)),bob=this.reduced||run.paused||run.phase==='boss'?0:Math.sin(run.time*13)*Math.min(2.2,h*.006);
      c.fillStyle='#07101c99';c.beginPath();c.ellipse(x,y+size*.15,size*.37*(1-run.jumpHeight*.27),size*.063,0,0,Math.PI*2);c.fill();
      const motion=root.RunnerSpiritMotion,pose=motion?.pose(this.house.id,run,this.reduced);
      if(run.focusTime>0){c.save();c.strokeStyle=V.colors[this.house.id];c.lineWidth=run.focusShield?3:1.5;c.globalAlpha=.8;c.beginPath();c.ellipse(x,y-hop-size*.27,size*.48,size*.54,0,0,Math.PI*2);c.stroke();
        if(!this.reduced){for(let i=0;i<3;i++){const a=run.time*.9+i*Math.PI*2/3,fx=x+Math.cos(a)*size*.48,fy=y-hop-size*.27+Math.sin(a)*size*.5;V.element(c,this.house.id,fx,fy,size*.07);}}
        if(motion&&detail>1)motion.trail(c,this.house.id,x,y-hop*.45,size*1.2,run.time,this.reduced);c.restore();}
      if(motion&&detail===3&&run.phase==='course'&&!run.paused&&!run.focusTime)motion.trail(c,this.house.id,x,y-hop*.45,size,run.time,this.reduced);
      if(this.lastJump>=0&&run.jumpAge<0&&!this.reduced)this.landing=.3;
      this.lastJump=run.jumpAge;if(!run.paused)this.landing=Math.max(0,(this.landing||0)-dt);
      if(this.landing>0){c.save();c.globalAlpha=this.landing*1.6;c.strokeStyle=this.house.color;c.lineWidth=2;c.beginPath();c.ellipse(x,y+size*.15,size*(.35+(.3-this.landing)),size*.08,0,0,Math.PI*2);c.stroke();c.restore();}
      c.save();c.translate(x,y-hop+(pose?pose.bob*size:bob));c.rotate(knockout?-knockout*.5:(pose?.angle||0));if(pose)c.scale(pose.sx,pose.sy);
      if(run.invincible>0)c.globalAlpha=.8;
      if(this.image&&this.image.complete&&this.image.naturalWidth){if(motion)motion.draw(c,this.image,size,pose,this.house.id,this.quality.limits.strips);else c.drawImage(this.image,-size*.5,-size*.8,size,size);}
      else{c.fillStyle=this.house.color;c.beginPath();c.arc(0,-size*.25,size*.25,0,Math.PI*2);c.fill();}
      c.restore();
      if(run.boss)this.drawBoss(run);
      if(run.phase==='finish'){const fx=w*(.165+(run.length-run.distance)/1000);c.strokeStyle='#c8dfb2aa';c.lineWidth=5;c.beginPath();c.moveTo(fx,h*.1);c.lineTo(fx,h*.93);c.stroke();c.fillStyle='#c8dfb244';c.fillRect(fx-6,h*.1,12,h*.83);}
      if(!run.paused)for(const z of this.particles){if(z.life<=0)continue;z.life=Math.max(0,z.life-dt);if(!z.magnet){z.x+=z.vx*dt;z.y+=z.vy*dt;z.vy+=130*dt;}}
      for(const z of this.particles){if(z.life<=0)continue;const t=1-z.life/z.max;c.globalAlpha=z.life/z.max;c.fillStyle=z.color;
        if(z.magnet){const tx=z.x+(x-z.x)*t,ty=z.y+(y-hop-size*.23-z.y)*t-Math.sin(t*Math.PI)*size*.13;c.strokeStyle=z.color;c.lineWidth=1.5;c.beginPath();c.moveTo(tx+10,ty-3);c.quadraticCurveTo(tx+4,ty-8,tx,ty);c.stroke();c.beginPath();c.arc(tx,ty,3,0,Math.PI*2);c.fill();}else c.fillRect(z.x,z.y,3,3);
      }c.globalAlpha=1;
      const vignette=c.createLinearGradient(0,0,w,0);vignette.addColorStop(0,'#06132344');vignette.addColorStop(.17,'#06132300');vignette.addColorStop(.85,'#06132300');vignette.addColorStop(1,'#06132366');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    }
  }
  const api={islandSVG,Renderer,palettes};if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerScenery=api;
})(typeof globalThis!=='undefined'?globalThis:this);
