(function(root){
  'use strict';
  /* v9.6.0 renderer. Everything that does not change from frame to frame (sky, ridges, skyline, lane rows,
     coins, obstacles, letter medallions, glows) is drawn once into small cached canvases and then copied
     with drawImage. That is both richer to look at and cheaper than drawing paths every frame. When no
     offscreen canvas can be created (the Node test harness), the same drawing functions run directly. */
  const V=typeof module==='object'&&module.exports?require('./visual-kit.js'):root.RunnerVisuals;
  const TAU=Math.PI*2;
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
  // Lane surface of each realm: what the team runs on.
  const laneStyles={academy:'cobble',village:'plank',city:'tile',coast:'boardwalk',harbour:'plate',forest:'flagstone',sky:'crystal'};
  const laneColours=['#f3c96b','#7fd8c9','#b9a6f6'];
  const hexCache=new Map();
  function rgb(hex){let v=hexCache.get(hex);if(!v){const n=parseInt(hex.slice(1,7),16);v=[n>>16&255,n>>8&255,n&255];hexCache.set(hex,v);}return v;}
  function hex([r,g,b]){return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');}
  // Unrestored colour: closer to grey and a little darker; v=1 is the full palette.
  function fade(color,v){const [r,g,b]=rgb(color),grey=r*.3+g*.55+b*.15,k=(1-v)*.78,d=1-(1-v)*.22;return hex([(r+(grey-r)*k)*d,(g+(grey-g)*k)*d,(b+(grey-b)*k)*d]);}
  function mixHex(a,b,t){const x=rgb(a),y=rgb(b);return hex(x.map((n,i)=>n+(y[i]-n)*t));}
  const shade=(c,t)=>mixHex(c,'#000000',t),tint=(c,t)=>mixHex(c,'#ffffff',t);
  function prng(seed){let s=(seed>>>0)%2147483647||1;return()=>(s=(s*16807)%2147483647)/2147483647;}
  function rrect(g,x,y,w,h,r){g.beginPath();if(typeof g.roundRect==='function')g.roundRect(x,y,w,h,r);else{g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();}}
  function poly(g,points,fill){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}}
  function defaultCanvas(w,h){
    if(typeof document!=='undefined'&&document&&typeof document.createElement==='function'){const c=document.createElement('canvas');if(c&&typeof c.getContext==='function'){c.width=w;c.height=h;return c;}}
    if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(w,h);
    return null;
  }

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

  // ---------- Scenery layers. Each draws a full, horizontally tileable layer in local units (0..W, 0..H). ----------
  function drawSky(g,W,H,p){
    const grad=g.createLinearGradient(0,0,0,H);grad.addColorStop(0,p.skyTop);grad.addColorStop(.6,mixHex(p.skyTop,p.skyLow,.55));grad.addColorStop(1,p.skyLow);
    g.fillStyle=grad;g.fillRect(0,0,W,H);
    // High, thin cloud bands for depth.
    g.globalAlpha=.1;g.fillStyle=p.cloud;for(const [x,y,rx,ry] of [[.18,.22,.22,.022],[.52,.12,.3,.018],[.7,.42,.26,.02],[.32,.55,.34,.016]]){g.beginPath();g.ellipse(W*x,H*y,W*rx,H*ry,0,0,TAU);g.fill();}
    g.globalAlpha=1;
    if(p.stars){const r=prng(97);g.fillStyle='#ffffff';for(let i=0;i<70;i++){g.globalAlpha=.25+r()*.5;const s=.6+r()*1.2;g.fillRect(r()*W,r()*H*.8,s,s);}g.globalAlpha=1;}
    const sx=W*.8,sy=H*.333,sr=H*.178;
    const glow=g.createRadialGradient(sx,sy,0,sx,sy,sr*4.4);glow.addColorStop(0,p.sun+'cc');glow.addColorStop(.18,p.sun+'5a');glow.addColorStop(.5,p.sun+'18');glow.addColorStop(1,p.sun+'00');
    g.fillStyle=glow;g.fillRect(sx-sr*4.4,sy-sr*4.4,sr*8.8,sr*8.8);
    const disc=g.createRadialGradient(sx-sr*.3,sy-sr*.3,sr*.1,sx,sy,sr);disc.addColorStop(0,'#ffffff');disc.addColorStop(.6,p.sun);disc.addColorStop(1,mixHex(p.sun,p.skyLow,.3));
    g.fillStyle=disc;g.beginPath();g.arc(sx,sy,sr,0,TAU);g.fill();
  }
  function drawRidges(g,W,H,p,realm){
    const r=prng(31+realm.length*7),n=7,round=realm==='coast'||realm==='harbour'||realm==='village';
    const lit=mixHex(p.far,p.skyLow,.28),dark=mixHex(p.far,p.skyTop,.3),snow=tint(p.far,.55);
    const peaks=Array.from({length:n},(_,i)=>({x:(i+.15+r()*.7)*W/n,h:H*(.42+r()*.5),w:W/n*(1+r()*.5)}));
    for(const k of [-1,0,1])for(const m of peaks){const x=m.x+k*W,top=H-m.h,half=m.w*.7;
      if(round){const grad=g.createLinearGradient(0,top,0,H);grad.addColorStop(0,lit);grad.addColorStop(1,dark);g.fillStyle=grad;g.beginPath();g.moveTo(x-half*1.3,H);g.bezierCurveTo(x-half*.6,top,x+half*.6,top,x+half*1.3,H);g.closePath();g.fill();}
      else{poly(g,[[x-half,H],[x,top],[x+half*.15,H]],lit);poly(g,[[x,top],[x+half,H],[x+half*.15,H]],dark);
        if(m.h>H*.65){g.fillStyle=snow;g.globalAlpha=.75;poly(g,[[x,top],[x-half*.18,top+m.h*.16],[x-half*.04,top+m.h*.12],[x+half*.08,top+m.h*.17],[x+half*.16,top+m.h*.14]]);g.fill();g.globalAlpha=1;}}
    }
    const haze=g.createLinearGradient(0,H*.35,0,H);haze.addColorStop(0,p.skyLow+'00');haze.addColorStop(1,p.skyLow+'aa');g.fillStyle=haze;g.fillRect(0,H*.35,W,H*.65);
  }
  // Mid-distance silhouettes: five tiles across the strip; tiles -1 and 5 repeat 4 and 0 so the strip tiles seamlessly.
  function drawSkyline(g,W,H,p,realm){
    const T=W/5,lit=tint(p.mid,.14),dark=shade(p.mid,.12);
    const win=(x,y,w,h,on)=>{g.fillStyle=on?p.window:shade(p.mid,.25);g.globalAlpha=on?.85:.6;g.fillRect(x,y,w,h);g.globalAlpha=1;};
    for(let i=-1;i<=5;i++){const t=(i+5)%5,x=i*T,base=H,high=H*(.3+.13*((t+6)%3)),r=prng(t*53+11);
      if(realm==='forest'){for(const [dx,s] of [[.15,.9],[.42,1.2],[.72,1]]){const cx=x+T*dx,ch=high*s;g.fillStyle=shade(p.mid,.3);g.fillRect(cx-2,base-ch*.4,4,ch*.4);
          const grad=g.createLinearGradient(cx-T*.12,0,cx+T*.12,0);grad.addColorStop(0,lit);grad.addColorStop(1,dark);g.fillStyle=grad;g.beginPath();g.ellipse(cx,base-ch*.62,T*.13*s,ch*.42,0,0,TAU);g.fill();
          g.fillStyle=tint(p.mid,.22);g.globalAlpha=.5;g.beginPath();g.ellipse(cx-T*.04,base-ch*.74,T*.05*s,ch*.14,-.4,0,TAU);g.fill();g.globalAlpha=1;}}
      else if(realm==='village'){g.fillStyle=dark;g.beginPath();g.ellipse(x+T*.5,base+H*.05,T*.62,high*.5,0,Math.PI,0);g.fill();
        for(const [dx,s] of [[.22,1],[.62,.82]]){const cx=x+T*dx,bw=T*.22*s,bh=high*.42*s;g.fillStyle=lit;g.fillRect(cx-bw/2,base-bh,bw,bh);poly(g,[[cx-bw*.62,base-bh],[cx,base-bh-high*.32*s],[cx+bw*.62,base-bh]],shade(p.mid,.35));
          g.fillStyle=shade(p.mid,.2);g.fillRect(cx+bw*.2,base-bh-high*.3*s,bw*.12,high*.14*s);win(cx-bw*.18,base-bh*.62,bw*.16,bh*.22,r()>.2);win(cx+bw*.06,base-bh*.62,bw*.16,bh*.22,r()>.4);}}
      else if(realm==='academy'){g.fillStyle=lit;g.fillRect(x+T*.04,base-high*.62,T*.52,high*.62);poly(g,[[x+T*.0,base-high*.62],[x+T*.3,base-high*.98],[x+T*.6,base-high*.62]],dark);
        for(let k=0;k<4;k++)win(x+T*(.1+k*.12),base-high*.42,T*.05,high*.16,r()>.25);
        if(t%2===0){g.fillStyle=dark;g.fillRect(x+T*.66,base-high*1.3,T*.14,high*1.3);poly(g,[[x+T*.63,base-high*1.3],[x+T*.73,base-high*1.62],[x+T*.83,base-high*1.3]],shade(p.mid,.3));
          g.fillStyle=p.window;g.globalAlpha=.9;g.beginPath();g.arc(x+T*.73,base-high*1.1,T*.035,0,TAU);g.fill();g.globalAlpha=1;}}
      else if(realm==='city'){for(const [dx,tw,th] of [[0,.22,1.15],[.25,.17,.82],[.45,.24,1.45],[.72,.15,.95]]){const bx=x+T*dx,bw=T*tw,bh=high*th;
          const grad=g.createLinearGradient(bx,0,bx+bw,0);grad.addColorStop(0,lit);grad.addColorStop(1,dark);g.fillStyle=grad;g.fillRect(bx,base-bh,bw,bh);
          g.fillStyle=tint(p.mid,.35);g.fillRect(bx,base-bh,bw,Math.max(1.5,bh*.02));
          for(let row=1;row<th*6;row++)for(let col=0;col<3;col++)win(bx+bw*(.15+col*.27),base-bh+row*high*.15,bw*.14,high*.06,r()>.42);}}
      else if(realm==='harbour'){g.fillStyle=dark;g.beginPath();g.ellipse(x+T*.5,base+H*.02,T*.6,high*.28,0,Math.PI,0);g.fill();
        g.strokeStyle=lit;g.lineWidth=Math.max(2,T*.018);g.beginPath();g.moveTo(x+T*.3,base);g.lineTo(x+T*.3,base-high*1.35);g.lineTo(x+T*.78,base-high*1.35);g.moveTo(x+T*.68,base-high*1.35);g.lineTo(x+T*.68,base-high*.9);g.moveTo(x+T*.3,base-high*1.1);g.lineTo(x+T*.48,base-high*1.35);g.stroke();
        g.fillStyle=lit;g.fillRect(x+T*.62,base-high*.9,T*.12,high*.14);win(x+T*.12,base-high*.2,T*.05,high*.08,true);}
      else if(realm==='coast'){const grad=g.createLinearGradient(0,base-high,0,base);grad.addColorStop(0,lit);grad.addColorStop(1,dark);g.fillStyle=grad;g.beginPath();g.moveTo(x,base);g.quadraticCurveTo(x+T*.25,base-high*.85,x+T*.5,base-high*.38);g.quadraticCurveTo(x+T*.75,base-high*.66,x+T,base);g.fill();
        if(t%2===1){const px=x+T*.62;g.strokeStyle=shade(p.mid,.25);g.lineWidth=Math.max(2.5,T*.02);g.beginPath();g.moveTo(px,base-high*.45);g.quadraticCurveTo(px+T*.05,base-high*1.05,px-T*.04,base-high*1.3);g.stroke();
          g.fillStyle=shade(p.mid,.15);for(const a of [-.9,-.3,.3,.9,1.6]){g.beginPath();g.ellipse(px-T*.04+Math.cos(a)*T*.07,base-high*1.3+Math.sin(a)*high*.05,T*.08,high*.035,a,0,TAU);g.fill();}}}
      else{const cx=x+T*.5,grad=g.createLinearGradient(cx-T*.3,0,cx+T*.3,0);grad.addColorStop(0,lit);grad.addColorStop(1,dark);g.fillStyle=grad;g.beginPath();g.ellipse(cx,base-high*.85,T*.3,high*.2,0,0,TAU);g.fill();
        poly(g,[[cx-T*.28,base-high*.85],[cx,base-high*.05],[cx+T*.28,base-high*.85]],dark);
        g.fillStyle=tint(p.mid,.35);g.globalAlpha=.8;poly(g,[[cx-T*.05,base-high*.95],[cx,base-high*1.45],[cx+T*.05,base-high*.95]]);g.fill();g.globalAlpha=1;win(cx-T*.02,base-high*.9,T*.04,high*.06,true);}
    }
  }
  // One lane row: the running surface, its front face and the ground beneath it, tileable along x.
  function drawRow(g,W,H,p,style,m){
    const D=m.depth,F=m.face,G=H-D-F,r=prng(style.length*91+7);
    // Ground under the lane.
    const ground=g.createLinearGradient(0,D+F,0,H);ground.addColorStop(0,shade(p.ground,.45));ground.addColorStop(.32,p.ground);ground.addColorStop(1,shade(p.ground,.12));
    g.fillStyle=ground;g.fillRect(0,D+F,W,G);
    // Ground details: grass, flowers or pebbles, all repeating within the strip.
    const n=Math.max(6,Math.round(W/70));
    for(let i=0;i<n;i++){const x=(i+r())*W/n,y=D+F+G*(.55+r()*.38),s=Math.max(4,H*.035)*(.7+r()*.6);
      for(const k of [-1,0,1]){const gx=x+k*W;
        if(style==='plate'||style==='tile'||style==='boardwalk'){g.fillStyle=tint(p.ground,.18);g.globalAlpha=.55;g.beginPath();g.ellipse(gx,y,s*.55,s*.28,0,0,TAU);g.fill();g.globalAlpha=1;}
        else{g.fillStyle=p.foliage;g.globalAlpha=.55;poly(g,[[gx-s,y],[gx-s*.6,y-s*1.1],[gx-s*.2,y],[gx+s*.1,y-s*1.6],[gx+s*.4,y],[gx+s*.8,y-s],[gx+s*1.1,y]]);g.fill();g.globalAlpha=1;
          if(r()>.6){g.fillStyle=[p.window,'#fda4af','#f8fafc'][i%3];g.beginPath();g.arc(gx+s*.1,y-s*1.5,Math.max(1.4,s*.16),0,TAU);g.fill();}}}}
    // Running surface.
    const top=g.createLinearGradient(0,0,0,D);top.addColorStop(0,tint(p.lane,.16));top.addColorStop(1,shade(p.lane,.08));g.fillStyle=top;g.fillRect(0,0,W,D);
    g.save();g.beginPath();g.rect(0,0,W,D);g.clip();
    if(style==='cobble'){const cw=Math.max(22,D*.62),rows=2,ch=D/rows;for(let row=0;row<rows;row++){const count=Math.round(W/cw),bw=W/count;for(let i=-1;i<=count;i++){const bx=i*bw+(row%2?bw/2:0),pr=prng(i*7+row*13+3)();g.fillStyle=mixHex(p.lane,p.laneTop,.12+pr*.22);rrect(g,bx+1.5,row*ch+1.5,bw-3,ch-3,Math.min(6,ch*.3));g.fill();g.fillStyle=tint(p.laneTop,.25);g.globalAlpha=.25;g.fillRect(bx+3,row*ch+2.5,bw-6,Math.max(1,ch*.12));g.globalAlpha=1;}}}
    else if(style==='plank'||style==='boardwalk'){const count=Math.round(W/Math.max(26,D*.75)),bw=W/count;for(let i=0;i<count;i++){const bx=i*bw,pr=prng(i*17+5);g.fillStyle=mixHex(p.lane,style==='boardwalk'?p.window:p.laneTop,.12+pr()*.18);g.fillRect(bx+1,0,bw-2,D);
        g.strokeStyle=shade(p.lane,.25);g.globalAlpha=.35;g.lineWidth=1;g.beginPath();g.moveTo(bx+bw*.3,D*.15);g.quadraticCurveTo(bx+bw*.55,D*.5,bx+bw*.35,D*.85);g.stroke();g.globalAlpha=1;
        g.fillStyle=shade(p.lane,.45);g.beginPath();g.arc(bx+bw*.5,D*.18,Math.max(1,D*.035),0,TAU);g.arc(bx+bw*.5,D*.82,Math.max(1,D*.035),0,TAU);g.fill();}}
    else if(style==='tile'){const count=Math.round(W/Math.max(34,D*1.1)),bw=W/count;for(let i=0;i<count;i++){const bx=i*bw;g.fillStyle=mixHex(p.lane,p.laneTop,.1+(i%2)*.08);g.fillRect(bx+1,1,bw-2,D-2);}
      g.strokeStyle=p.laneTop;g.globalAlpha=.55;g.lineWidth=1;for(let i=0;i<count;i++){g.beginPath();g.moveTo(i*W/count,0);g.lineTo(i*W/count,D);g.stroke();}g.beginPath();g.moveTo(0,D*.5);g.lineTo(W,D*.5);g.stroke();g.globalAlpha=1;}
    else if(style==='plate'){const count=Math.round(W/Math.max(40,D*1.3)),bw=W/count;for(let i=0;i<count;i++){const bx=i*bw;g.fillStyle=mixHex(p.lane,p.laneTop,.14+(i%2)*.06);g.fillRect(bx+1,1,bw-2,D-2);
        g.strokeStyle=tint(p.laneTop,.2);g.globalAlpha=.18;g.lineWidth=1;for(let k=0;k<4;k++){g.beginPath();g.moveTo(bx+bw*(.1+k*.22),D*.75);g.lineTo(bx+bw*(.2+k*.22),D*.25);g.stroke();}g.globalAlpha=1;
        g.fillStyle=tint(p.laneTop,.35);for(const [rx,ry] of [[.08,.2],[.92,.2],[.08,.8],[.92,.8]]){g.beginPath();g.arc(bx+bw*rx,D*ry,Math.max(1,D*.04),0,TAU);g.fill();}}}
    else if(style==='flagstone'){const count=Math.round(W/Math.max(30,D*.95)),bw=W/count;for(let i=0;i<count;i++){const pr=prng(i*29+1),bx=i*bw;g.fillStyle=mixHex(p.lane,p.laneTop,.1+pr()*.2);poly(g,[[bx+2,2+pr()*3],[bx+bw-2,1+pr()*3],[bx+bw-1-pr()*3,D-2],[bx+1+pr()*3,D-1]]);g.fill();
        if(pr()>.45){g.fillStyle=p.foliage;g.globalAlpha=.35;g.beginPath();g.ellipse(bx+bw*(.2+pr()*.6),D*(.2+pr()*.6),bw*.16,D*.12,0,0,TAU);g.fill();g.globalAlpha=1;}}}
    else{const count=Math.round(W/Math.max(30,D*.9)),bw=W/count;for(let i=0;i<count;i++){const bx=i*bw;const grad=g.createLinearGradient(bx,0,bx+bw,D);grad.addColorStop(0,tint(p.lane,.22));grad.addColorStop(.5,p.lane);grad.addColorStop(1,tint(p.laneTop,.1));g.fillStyle=grad;poly(g,[[bx+bw*.15,1],[bx+bw*.85,1],[bx+bw-1,D/2],[bx+bw*.85,D-1],[bx+bw*.15,D-1],[bx+1,D/2]]);g.fill();
        g.strokeStyle=p.laneTop;g.globalAlpha=.6;g.lineWidth=1;g.stroke();g.globalAlpha=1;}}
    g.restore();
    // Lit top edge and the front face with small lights.
    g.fillStyle=tint(p.laneTop,.25);g.fillRect(0,0,W,Math.max(2,D*.07));
    const face=g.createLinearGradient(0,D,0,D+F);face.addColorStop(0,shade(p.lane,.35));face.addColorStop(1,shade(p.lane,.6));g.fillStyle=face;g.fillRect(0,D,W,F);
    g.fillStyle=shade(p.lane,.7);g.fillRect(0,D,W,Math.max(1,F*.12));
    // Small brass studs along the face, a few warm ones lit.
    const studs=Math.max(4,Math.round(W/120));for(let i=0;i<studs;i++){const lx=(i+.5)*W/studs,ly=D+F*.5,lit=i%3===1;
      if(lit){const glow=g.createRadialGradient(lx,ly,0,lx,ly,F*.95);glow.addColorStop(0,p.window+'88');glow.addColorStop(1,p.window+'00');g.fillStyle=glow;g.fillRect(lx-F,ly-F,F*2,F*2);}
      g.fillStyle=lit?tint(p.window,.35):mixHex(p.laneTop,p.window,.35);g.globalAlpha=lit?1:.55;g.beginPath();g.arc(lx,ly,Math.max(1,F*(lit?.15:.11)),0,TAU);g.fill();g.globalAlpha=1;}
  }
  // ---------- Objects ----------
  function coinVector(g,cx,cy,r,s){
    const rx=Math.max(r*.18,r*s),edge=Math.max(1,r*.18*(1-s)+r*.06);
    g.fillStyle='#9a6526';g.beginPath();g.ellipse(cx+edge*.6,cy,rx,r,0,0,TAU);g.fill();
    const face=g.createRadialGradient(cx-rx*.35,cy-r*.4,r*.1,cx,cy,r*1.05);face.addColorStop(0,'#fff6cf');face.addColorStop(.45,'#f4cd68');face.addColorStop(1,'#c18a35');
    g.fillStyle=face;g.beginPath();g.ellipse(cx,cy,rx,r,0,0,TAU);g.fill();
    g.strokeStyle='#fff1bd';g.globalAlpha=.75;g.lineWidth=Math.max(1,r*.1);g.beginPath();g.ellipse(cx,cy,rx*.74,r*.74,0,0,TAU);g.stroke();g.globalAlpha=1;
    if(s>.35){poly(g,[[cx,cy-r*.46],[cx+rx*.32,cy],[cx,cy+r*.46],[cx-rx*.32,cy]],'#b07534');poly(g,[[cx,cy-r*.46],[cx+rx*.32,cy],[cx,cy]],'#ffe39a');}
    g.fillStyle='#ffffff';g.globalAlpha=.8;g.beginPath();g.ellipse(cx-rx*.38,cy-r*.45,Math.max(.8,rx*.16),r*.18,-.5,0,TAU);g.fill();g.globalAlpha=1;
  }
  function sparkVector(g,cx,cy,r,color){
    const glow=g.createRadialGradient(cx,cy,0,cx,cy,r);glow.addColorStop(0,color);glow.addColorStop(.3,color+'88');glow.addColorStop(1,color+'00');g.fillStyle=glow;g.fillRect(cx-r,cy-r,r*2,r*2);
    g.fillStyle='#ffffff';poly(g,[[cx,cy-r*.9],[cx+r*.14,cy-r*.14],[cx+r*.9,cy],[cx+r*.14,cy+r*.14],[cx,cy+r*.9],[cx-r*.14,cy+r*.14],[cx-r*.9,cy],[cx-r*.14,cy-r*.14]]);g.fill();
  }
  function glowVector(g,cx,cy,rx,ry,color,core=.55){const grad=g.createRadialGradient(cx,cy,0,cx,cy,1);grad.addColorStop(0,color+'cc');grad.addColorStop(core*.5,color+'66');grad.addColorStop(1,color+'00');g.save();g.translate(cx,cy);g.scale(rx,ry);g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,TAU);g.fill();g.restore();}
  function shadowVector(g,cx,cy,rx,ry,alpha=.5){const grad=g.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,`rgba(3,9,18,${alpha})`);grad.addColorStop(.6,`rgba(3,9,18,${alpha*.55})`);grad.addColorStop(1,'rgba(3,9,18,0)');g.save();g.translate(cx,cy);g.scale(rx,ry);g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,TAU);g.fill();g.restore();}
  // Obstacles, shaded and outlined, drawn around (0,0): x in ±1.35·rx, y from -1.05·s to +0.65·s.
  function obstacleVector(g,shape,s,rx){
    const lin=(x0,y0,x1,y1,stops)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>gr.addColorStop(o,c));return gr;};
    g.lineJoin='round';g.lineCap='round';
    if(shape==='root'){
      g.strokeStyle=lin(-rx,s*.4,rx,-s,[[0,'#4b3426'],[.5,'#7a5a3c'],[1,'#a1cc88']]);g.lineWidth=Math.max(4,s*.2);g.beginPath();g.moveTo(-rx,s*.4);g.bezierCurveTo(-rx,-s*.8,rx*.6,-s*.3,rx,-s);g.moveTo(0,s*.42);g.quadraticCurveTo(rx*.5,-s*.4,-rx*.5,-s*.6);g.stroke();
      g.fillStyle='#d9f99d';for(const [x,y] of [[rx*.55,-s*.68],[-rx*.3,-s*.5],[rx*.15,-s*.1]]){poly(g,[[x,y],[x+s*.12,y-s*.1],[x+s*.04,y+s*.06]]);g.fill();}
    }else if(shape==='wave'){
      g.strokeStyle=lin(-rx,0,rx,0,[[0,'#2fb5a7'],[.6,'#9cf3e0'],[1,'#e8fffb']]);g.lineWidth=Math.max(4,s*.22);g.beginPath();g.moveTo(-rx*1.3,s*.4);g.quadraticCurveTo(-rx,-s,0,-s*.35);g.quadraticCurveTo(rx*.3,s*.4,rx*1.3,s*.15);g.stroke();
      g.fillStyle='#ffffff';for(const [x,y,r] of [[-rx*.62,-s*.62,.09],[-rx*.2,-s*.62,.07],[-rx*.95,-s*.2,.06]]){g.beginPath();g.arc(x,y,s*r,0,TAU);g.fill();}
    }else if(shape==='vent'){
      g.fillStyle=lin(0,0,0,s*.6,[[0,'#5b4a3a'],[1,'#2b221b']]);rrect(g,-rx,s*.12,rx*2,s*.45,s*.12);g.fill();g.fillStyle='#ff9d3c';g.globalAlpha=.85;rrect(g,-rx*.7,s*.2,rx*1.4,s*.14,s*.07);g.fill();g.globalAlpha=1;
      g.strokeStyle=lin(0,-s,0,s*.1,[[0,'rgba(255,240,210,0)'],[1,'#ffd48a']]);g.lineWidth=Math.max(3,s*.16);g.beginPath();g.moveTo(-rx*.4,s*.1);g.quadraticCurveTo(-rx,-s*.4,-rx*.1,-s);g.moveTo(rx*.4,s*.1);g.quadraticCurveTo(rx,-s*.4,rx*.3,-s*.8);g.stroke();
    }else if(shape==='eclipse'){
      const corona=g.createRadialGradient(0,-s*.1,s*.3,0,-s*.1,s*1.05);corona.addColorStop(0,'#d2b9ff');corona.addColorStop(.55,'#8b5cf688');corona.addColorStop(1,'#8b5cf600');g.fillStyle=corona;g.beginPath();g.arc(0,-s*.1,s*1.05,0,TAU);g.fill();
      g.fillStyle='#120b24';g.beginPath();g.arc(0,-s*.1,s*.62,0,TAU);g.fill();g.strokeStyle='#efe6ff';g.lineWidth=Math.max(2,s*.07);g.beginPath();g.arc(0,-s*.1,s*.64,-.6,1.4);g.stroke();
    }else if(shape==='log'){
      g.fillStyle=lin(0,-s*.35,0,s*.5,[[0,'#a07a58'],[.45,'#785747'],[1,'#4a3328']]);rrect(g,-rx,-s*.35,rx*2,s*.85,s*.22);g.fill();g.strokeStyle='#3a271d';g.lineWidth=Math.max(1.5,s*.06);g.stroke();
      g.strokeStyle='#5b3f2e';g.globalAlpha=.6;g.lineWidth=Math.max(1,s*.04);g.beginPath();g.moveTo(-rx*.8,-s*.05);g.lineTo(rx*.45,-s*.15);g.moveTo(-rx*.6,s*.2);g.lineTo(rx*.4,s*.12);g.stroke();g.globalAlpha=1;
      const end=g.createRadialGradient(rx*.85,s*.07,0,rx*.85,s*.07,s*.42);end.addColorStop(0,'#e4c48d');end.addColorStop(1,'#a67b4f');g.fillStyle=end;g.beginPath();g.ellipse(rx*.85,s*.07,rx*.24,s*.42,0,0,TAU);g.fill();
      g.strokeStyle='#7d5838';g.lineWidth=1;for(const k of [.32,.6,.85]){g.beginPath();g.ellipse(rx*.85,s*.07,rx*.24*k,s*.42*k,0,0,TAU);g.stroke();}
      g.fillStyle='#86b56a';g.beginPath();g.ellipse(-rx*.35,-s*.33,rx*.3,s*.1,0,0,TAU);g.fill();
    }else if(shape==='boulder'){
      const body=[[-rx,s*.35],[-rx*.88,-s*.38],[-rx*.2,-s*.88],[rx*.72,-s*.58],[rx,s*.3],[rx*.4,s*.6],[-rx*.5,s*.58]];
      g.fillStyle=lin(-rx,-s,rx,s*.6,[[0,'#b9c6c8'],[.5,'#7d8f98'],[1,'#4c5c66']]);poly(g,body);g.fill();g.strokeStyle='#2f3b44';g.lineWidth=Math.max(1.5,s*.05);g.stroke();
      poly(g,[[-rx*.88,-s*.38],[-rx*.2,-s*.88],[rx*.72,-s*.58],[0,-s*.08]],'rgba(255,255,255,.22)');
      g.strokeStyle='#3c4a53';g.lineWidth=Math.max(1,s*.04);g.beginPath();g.moveTo(-rx*.1,-s*.4);g.lineTo(rx*.1,-s*.05);g.lineTo(-rx*.05,s*.25);g.stroke();
      g.fillStyle='#8fc07a';g.globalAlpha=.8;g.beginPath();g.ellipse(-rx*.55,s*.4,rx*.28,s*.1,.2,0,TAU);g.fill();g.globalAlpha=1;
    }else if(shape==='gear'){
      const r=s*.86,pts=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,rad=i%3===0?r*.74:r;pts.push([Math.cos(a)*rad,Math.sin(a)*rad]);}
      g.fillStyle=lin(-r,-r,r,r,[[0,'#f3d39b'],[.5,'#c59d68'],[1,'#7d5b33']]);poly(g,pts);g.fill();g.strokeStyle='#5b4124';g.lineWidth=Math.max(1.5,s*.05);g.stroke();
      g.strokeStyle='#f6e2b5';g.lineWidth=Math.max(1.5,s*.06);g.beginPath();g.arc(0,0,r*.58,0,TAU);g.stroke();
      g.fillStyle='#1f2f3b';g.beginPath();g.arc(0,0,r*.3,0,TAU);g.fill();g.fillStyle='#75d6d3';g.beginPath();g.arc(0,0,r*.14,0,TAU);g.fill();
      g.fillStyle='#5b4124';for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;g.beginPath();g.arc(Math.cos(a)*r*.44,Math.sin(a)*r*.44,r*.06,0,TAU);g.fill();}
    }else if(shape==='barrier'){
      g.fillStyle=lin(0,-s*.6,0,s*.6,[[0,'#8a93a8'],[1,'#4b5366']]);poly(g,[[-rx,s*.6],[-rx*.9,-s*.6],[rx*.8,-s*.6],[rx,s*.6]]);g.fill();g.strokeStyle='#2a3142';g.lineWidth=Math.max(1.5,s*.05);g.stroke();
      g.save();g.beginPath();g.rect(-rx*.82,-s*.32,rx*1.64,s*.3);g.clip();for(let i=-4;i<5;i++){g.fillStyle=i%2?'#f3bb63':'#2a2f3d';poly(g,[[i*rx*.28-rx*.2,s*.0],[i*rx*.28,-s*.32],[i*rx*.28+rx*.28,-s*.32],[i*rx*.28+rx*.08,s*0]]);g.fill();}g.restore();
      const gem=g.createRadialGradient(0,s*.1,0,0,s*.1,s*.3);gem.addColorStop(0,'#fff3c4');gem.addColorStop(1,'#f3bb6300');g.fillStyle=gem;g.beginPath();g.arc(0,s*.1,s*.3,0,TAU);g.fill();
      poly(g,[[0,-s*.06],[rx*.2,s*.12],[0,s*.32],[-rx*.2,s*.12]],'#fde68a');
    }else{
      const shards=[[[-rx,s*.5],[-rx*.45,-s*.7],[-rx*.03,s*.15]],[[-rx*.2,s*.5],[rx*.42,-s],[rx,s*.5]],[[-rx*.62,s*.5],[-rx*.1,-s*.35],[rx*.2,s*.5]]];
      shards.forEach((pts,i)=>{g.fillStyle=lin(pts[1][0]-rx*.2,pts[1][1],pts[2][0],pts[2][1],[[0,'#f5e8ff'],[.45,['#b9aecf','#c5a0ff','#a78bfa'][i]],[1,'#5b4a7a']]);poly(g,pts);g.fill();g.strokeStyle='#efe3ff';g.globalAlpha=.7;g.lineWidth=1;g.stroke();g.globalAlpha=1;});
      g.fillStyle='#ffffff';g.globalAlpha=.75;poly(g,[[rx*.42,-s],[rx*.32,-s*.2],[rx*.5,-s*.45]]);g.fill();g.globalAlpha=1;
    }
  }
  // Word Trail letter medallion: gold rim, ivory face, engraved letter.
  function medallionVector(g,cx,cy,r,letter,next){
    if(next){const glow=g.createRadialGradient(cx,cy,r*.8,cx,cy,r*1.45);glow.addColorStop(0,'#ffe7a3aa');glow.addColorStop(1,'#ffe7a300');g.fillStyle=glow;g.beginPath();g.arc(cx,cy,r*1.45,0,TAU);g.fill();}
    const rim=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);rim.addColorStop(0,'#fff1c1');rim.addColorStop(.45,next?'#e5b153':'#c79a52');rim.addColorStop(1,'#7c5320');
    g.fillStyle=rim;g.beginPath();g.arc(cx,cy,r,0,TAU);g.fill();
    const face=g.createRadialGradient(cx-r*.3,cy-r*.35,r*.1,cx,cy,r*.86);face.addColorStop(0,'#fffaf0');face.addColorStop(1,next?'#efd9a6':'#d9c7a0');
    g.fillStyle=face;g.beginPath();g.arc(cx,cy,r*.82,0,TAU);g.fill();
    g.strokeStyle='#a87a33';g.globalAlpha=.6;g.lineWidth=Math.max(1,r*.05);g.beginPath();g.arc(cx,cy,r*.7,0,TAU);g.stroke();g.globalAlpha=1;
    g.font=`800 ${Math.round(r*1.12)}px Georgia,"Times New Roman",serif`;g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#ffffffb0';g.fillText(letter,cx+r*.04,cy+r*.1);g.fillStyle=next?'#2a1806':'#4a3416';g.fillText(letter,cx,cy+r*.05);
  }
  // Realm ambience: small, sparse and drawn from cached glow sprites (no per-frame gradients).
  const ambienceKinds={
    forest:{type:'mote',count:14,color:'#d9f99d',top:.42,bottom:.96,drift:.05},
    village:{type:'mote',count:10,color:'#fde68a',top:.42,bottom:.96,drift:.05},
    academy:{type:'mote',count:9,color:'#fff7d6',top:.18,bottom:.9,drift:.03},
    city:{type:'mote',count:8,color:'#a5f3fc',top:.2,bottom:.9,drift:.02},
    coast:{type:'bird',count:3,color:'#e2f5f2',top:.08,bottom:.22,drift:0},
    harbour:{type:'bird',count:3,color:'#fde7cf',top:.07,bottom:.2,drift:0},
    sky:{type:'mote',count:10,color:'#e9d5ff',top:.1,bottom:.9,drift:.02}
  };

  class Renderer {
    constructor(canvas,options={}){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.makeCanvas=options.makeCanvas||defaultCanvas;this.w=1000;this.h=500;this.dpr=1;this.particles=Array.from({length:60},()=>({life:0}));this.quality=new V.Quality();this.house=null;this.image=null;this.realm='academy';this.reduced=false;this.sprites=new Map();this.layers=null;this.layerKey='';this.gradients=new Map();this.bakes=new Map();this.shown=this.next=null;this.mix=0;this.bakeDPR=0;}
    resize(w,h,dpr=1){
      if(w<1||h<1)return;this.w=w;this.h=h;this.requestedDPR=dpr;dpr=Math.min(dpr*(this.quality.limits.scale||1),2,Math.sqrt(this.quality.limits.pixels/(w*h)));
      const cw=Math.max(1,Math.floor(w*dpr)),ch=Math.max(1,Math.floor(h*dpr));
      // Reassigning the same size would clear and reallocate the canvas; skip it.
      if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch;}
      this.dpr=dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    setup(house,image,realm,reduced,bossImage,bossInfo,light=false,level=0){
      this.creatureLevel=level;this.creaturePack=null;this.bossPack=null;this.creatureToken=(this.creatureToken||0)+1;const token=this.creatureToken;
      root.CreaturePoses?.load(house.id,level).then(p=>{if(token===this.creatureToken)this.creaturePack=p;});
      root.CreaturePoses?.load(bossInfo?.id).then(p=>{if(token===this.creatureToken)this.bossPack=p;});
      this.bossImage=bossImage;this.bossInfo=bossInfo;this.house=house;this.image=image;this.realm=realm;this.reduced=reduced;this.quality.reset(light);this.particles.forEach(p=>p.life=0);this.lastJump=-1;this.landing=0;this.answerGlow=0;this.impact=0;this.impactFinal=false;
      // Scene colour returns with correct answers; already-restored islands start brighter.
      this.vivid=this.vividStart=0.46;this.vividCache=new Map();this.dustClock=0;this.gradients=new Map();this.layerKey='';
      let seed=(realm||'').length*97+7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
      this.clouds=Array.from({length:6},(_,i)=>({x:i/6+rnd()*.12,y:.06+rnd()*.2,s:.6+rnd()*.7,speed:.004+rnd()*.006,v:i%3}));
      this.stars=Array.from({length:42},()=>({x:rnd(),y:rnd()*.34,r:.6+rnd()*1.3,t:rnd()*6}));
      // v9.5 presentation layers: floating numbers, shockwave rings, boss flash and realm ambience.
      this.floats=[];this.rings=[];this.bossFlash=0;this.bossPoint=null;this.runnerPoint=null;this.meteor=null;this.meteorClock=2.5;
      const kind=ambienceKinds[realm]||ambienceKinds.academy;
      this.ambient=Array.from({length:kind.count},()=>({x:rnd(),y:kind.top+rnd()*(kind.bottom-kind.top),phase:rnd()*6.28,speed:.4+rnd()*.8,size:.6+rnd()*.8}));this.ambientKind=kind;}
    restoredStart(stage){this.vivid=this.vividStart=Math.min(.82,.46+(stage||0)*.09);}
    scenePalette(realm){
      const q=Math.round(this.vivid*20)/20,key=realm+q;let p=this.vividCache.get(key);
      if(!p){p=this.paletteAt(realm,q);this.vividCache.set(key,p);}
      return p;
    }
    paletteAt(realm,v){const base=palettes[realm]||palettes.academy,p={stars:base.stars,vivid:v};for(const [k,c] of Object.entries(base))if(typeof c==='string')p[k]=fade(c,v);return p;}
    levelPalette(level){const key='L'+this.realm+level;let p=this.vividCache.get(key);if(!p){p=this.paletteAt(this.realm,level/100);this.vividCache.set(key,p);}return p;}
    gradient(key,make){let g=this.gradients.get(key);if(!g){if(this.gradients.size>40)this.gradients.clear();g=make();this.gradients.set(key,g);}return g;}
    // ---------- Sprite cache ----------
    // An offscreen canvas holding one drawing at device resolution, or null when none can be made.
    bakeCanvas(w,h,draw,scale=1){
      const k=this.dpr*scale,img=this.makeCanvas(Math.max(1,Math.ceil(w*k)),Math.max(1,Math.ceil(h*k))),g=img&&img.getContext?img.getContext('2d'):null;
      if(!g)return null;g.setTransform(k,0,0,k,0,0);draw(g);return {img,w,h};
    }
    sprite(key,w,h,draw,scale=1){
      if(this.sprites.has(key))return this.sprites.get(key);
      const s=this.bakeCanvas(w,h,draw,scale);
      // Bounded: the oldest sprites go first, so a long run never redraws everything in one frame.
      if(this.sprites.size>=240){let n=0;for(const old of this.sprites.keys()){this.sprites.delete(old);if(++n>=60)break;}}
      this.sprites.set(key,s);return s;
    }
    // Draws a cached sprite anchored at (x,y); without offscreen canvases the same drawing runs directly.
    stamp(key,w,h,ax,ay,draw,x,y,alpha=1){
      const s=this.sprite(key,w,h,g=>draw(g,ax,ay)),c=this.ctx;if(alpha<=0)return;if(alpha<1)c.globalAlpha=alpha;
      if(s)c.drawImage(s.img,x-ax,y-ay,w,h);else{c.save();c.translate(x-ax,y-ay);draw(c,ax,ay);c.restore();}
      if(alpha<1)c.globalAlpha=1;
    }
    // ---------- Scenery layers ----------
    stripWidth(){return Math.ceil(this.w*this.dpr)/this.dpr;}
    // Layer geometry and the sprites that never change colour. Colour levels are baked separately (bakeLevel).
    // A lower device-pixel ratio from the quality governor keeps the sharper bakes instead of redrawing mid-run.
    ensureLayers(run){
      const key=[this.w,this.h,this.realm,this.vividStart,run.island].join('|');
      if(key===this.layerKey&&this.dpr<=this.bakeDPR*1.05)return;
      this.layerKey=key;this.bakeDPR=this.dpr;this.sprites.clear();this.bakes=new Map();this.shown=this.next=null;this.mix=0;this.layers=null;
      const h=this.h,w=this.w,size=Math.min(h*.62,w*.26),edge=(side,bw)=>this.bakeCanvas(bw,h,g=>{const v=g.createLinearGradient(side?bw:0,0,side?0:bw,0);v.addColorStop(0,'rgba(6,19,35,.42)');v.addColorStop(1,'rgba(6,19,35,0)');g.fillStyle=v;g.fillRect(0,0,bw,h);},.25);
      const left=edge(0,w*.16);if(!left)return;
      this.layers={landmarkSize:size,left,right:edge(1,w*.13),
        landmark:root.Path2D?this.bakeCanvas(size,size,g=>{const q=this.paletteAt(this.realm,.75);V.landmarkCanvas(g,run.island,size*.5,size*.47,size,{...q,stone:mixHex(q.stone,q.skyLow,.35),mist:mixHex(q.mist,q.skyLow,.3)});}):null};
    }
    // One colour level of the four scenery layers, baked a layer at a time so a new level never costs a whole frame.
    bakeLevel(level,budget){
      let b=this.bakes.get(level);if(!b){b={parts:{},done:0};this.bakes.set(level,b);}
      const W=this.stripWidth(),h=this.h,realm=this.realm,p=this.paletteAt(realm,level/100);
      while(b.done<4&&budget-->0){const name=['sky','ridges','skyline','row'][b.done++];
        b.parts[name]=name==='sky'?this.bakeCanvas(W,h*.42,g=>drawSky(g,W,h*.42,p),.5)
          :name==='ridges'?this.bakeCanvas(W,h*.32,g=>drawRidges(g,W,h*.32,p,realm))
          :name==='skyline'?this.bakeCanvas(W,h*.36,g=>drawSkyline(g,W,h*.36,p,realm))
          :this.bakeCanvas(W,h*.24,g=>drawRow(g,W,h*.24,p,laneStyles[realm]||'cobble',{depth:h*.065,face:h*.024}));}
      return b.done===4;
    }
    // Colour returns in levels: the shown level is one copy per layer; only while the next level fades in are there two.
    updateLevels(goal,dt,paused){
      if(this.shown===null){this.bakeLevel(goal,4);this.shown=goal;return;}
      if(goal===this.shown){if(this.next!==null){this.bakes.delete(this.next);this.next=null;this.mix=0;}return;}
      if(goal!==this.next){
        if(this.next!==null&&this.mix>=.5){this.bakes.delete(this.shown);this.shown=this.next;}else if(this.next!==null)this.bakes.delete(this.next);
        this.next=goal===this.shown?null:goal;this.mix=0;if(this.next===null)return;
      }
      if(this.bakeLevel(this.next,1)&&!paused)this.mix=Math.min(1,this.mix+dt/(this.reduced?.25:1.1));
      if(this.mix>=1){this.bakes.delete(this.shown);this.shown=this.next;this.next=null;this.mix=0;}
    }
    // Copies a tileable strip twice so it wraps seamlessly; device-pixel rounding avoids a seam.
    blitStrip(s,offset,y,alpha=1){
      if(!s||alpha<=0)return;const c=this.ctx,W=s.w;let x=-(((offset%W)+W)%W);x=Math.round(x*this.dpr)/this.dpr;
      if(alpha<1)c.globalAlpha=alpha;c.drawImage(s.img,x,y,W,s.h);if(x+W<this.w)c.drawImage(s.img,x+W,y,W,s.h);if(alpha<1)c.globalAlpha=1;
    }
    layer(name,offset,y){
      const a=this.bakes?.get(this.shown)?.parts[name];if(!a)return false;this.blitStrip(a,offset,y);
      if(this.next!==null&&this.mix>0){const b=this.bakes.get(this.next)?.parts[name],t=this.mix*this.mix*(3-2*this.mix);if(b)this.blitStrip(b,offset,y,t);}
      return true;
    }
    // Direct drawing when no offscreen canvas exists (test harness).
    vectorStrip(offset,y,W,H,draw){const c=this.ctx,x=-(((offset%W)+W)%W);c.save();c.translate(x,y);draw(c,W,H);c.translate(W,0);draw(c,W,H);c.restore();}
    sample(seconds,cost){if(this.quality.sample(seconds,cost)){this.resize(this.w,this.h,this.requestedDPR||1);for(let i=this.quality.limits.particles;i<60;i++)this.particles[i].life=0;}}
    burst(type,lane,magnet=false){
      if(type==='answer'){this.answerGlow=.65;this.answerLane=lane;}
      if(type==='bossHit'||type==='bossFinal'){this.impact=.45;this.impactFinal=type==='bossFinal';this.bossFlash=.16;return;}
      if(this.reduced)return;let n=type==='hit'?10:magnet?2:5;
      for(let i=0;i<this.quality.limits.particles;i++){const p=this.particles[i];if(p.life>0)continue;Object.assign(p,{dust:false,x:this.w*(magnet?.235:.165),y:this.h*(.40+.24*lane),vx:Math.random()*110-50,vy:Math.random()*100-90,life:magnet?.34:.55,max:magnet?.34:.55,color:type==='hit'?'#e9a0a4':type==='answer'?this.house.color:'#f4d186',magnet,lane});if(--n===0)break;}
    }
    float(text,x,y,color='#fff1c4',size=1,life=1){if(this.reduced&&this.floats.length>2)this.floats.shift();this.floats.push({text,x,y,color,size,life,max:life});while(this.floats.length>8)this.floats.shift();}
    // Cues that arrive together stack upward instead of printing over each other.
    floatAtRunner(text,color,size=1){const p=this.runnerPoint;if(!p)return;const fresh=this.floats.filter(f=>f.runner&&f.life>f.max*.55).length;this.float(text,p.x,p.y-p.size*.55-fresh*Math.max(22,this.h*.065),color,size);this.floats[this.floats.length-1].runner=true;}
    floatAtBoss(text,color,size=1){const p=this.bossPoint;if(p)this.float(text,p.x+(Math.random()-.5)*p.size*.25,p.y-p.size*.18,color,size);}
    ring(x,y,color,max=1){if(this.reduced)return;this.rings.push({x,y,color,age:0,life:.55,max});while(this.rings.length>6)this.rings.shift();}
    ringAtRunner(color,max=1){const p=this.runnerPoint;if(p)this.ring(p.x,p.y,color,max);}
    drawFx(dt,paused){
      const c=this.ctx,h=this.h;
      for(const r of this.rings){if(!paused)r.age+=dt;const t=Math.min(1,r.age/r.life);c.globalAlpha=(1-t)*.85;c.strokeStyle=r.color;c.lineWidth=Math.max(1,5*(1-t));c.beginPath();c.ellipse(r.x,r.y,(20+t*110)*r.max,(12+t*60)*r.max,0,0,TAU);c.stroke();}
      this.rings=this.rings.filter(r=>r.age<r.life);
      if(this.floats.length){c.save();c.textAlign='center';c.textBaseline='middle';
        for(const f of this.floats){if(!paused)f.life-=dt;const t=1-Math.max(0,f.life)/f.max,pop=t<.15?.6+t/.15*.55:1.15-Math.min(.15,(t-.15)*.4),rise=this.reduced?0:t*h*.09;
          const size=Math.round(Math.max(16,Math.min(40,h*.06))*f.size*(this.reduced?1:pop));c.font=`900 ${size}px system-ui,-apple-system,"Segoe UI",sans-serif`;
          c.globalAlpha=t>.75?Math.max(0,(1-t)/.25):1;c.lineWidth=Math.max(3,size*.16);c.strokeStyle='#071222';c.lineJoin='round';c.strokeText(f.text,f.x,f.y-rise);c.fillStyle=f.color;c.fillText(f.text,f.x,f.y-rise);}
        c.restore();this.floats=this.floats.filter(f=>f.life>0);}
      c.globalAlpha=1;
    }
    drawAmbience(run,dt,p){
      const k=this.ambientKind;if(!k||this.reduced||this.quality.limits.parallax<2)return;
      const c=this.ctx,w=this.w,h=this.h,t=run.time;
      if(k.type==='mote'){
        for(const m of this.ambient){const x=((m.x-run.distance*k.drift/1000)%1+1)%1*w+Math.sin(t*m.speed+m.phase)*w*.012,y=m.y*h+Math.cos(t*m.speed*.8+m.phase)*h*.02,s=h*.03*m.size*(.75+.25*Math.sin(t*2.2+m.phase));
          this.stamp('mote|'+k.color,32,32,16,16,(g,cx,cy)=>glowVector(g,cx,cy,16,16,k.color,.3),x,y,(.35+.3*Math.sin(t*1.7+m.phase))*Math.max(.35,p.vivid)*Math.min(1,s/12));}
      }else if(k.type==='bird'){c.strokeStyle=k.color;c.lineWidth=Math.max(1.4,h*.004);c.lineCap='round';
        for(const b of this.ambient){const x=((b.x+t*.012*b.speed)%1.2)*w-w*.1,y=b.y*h+Math.sin(t*.9+b.phase)*h*.01,s=h*.018*b.size,flap=Math.sin(t*6*b.speed+b.phase)*s*.5;
          c.globalAlpha=.6;c.beginPath();c.moveTo(x-s,y-flap);c.quadraticCurveTo(x-s*.4,y-s*.2,x,y);c.quadraticCurveTo(x+s*.4,y-s*.2,x+s,y-flap);c.stroke();}
        c.globalAlpha=1;
      }
      if(this.realm==='sky'){
        if(!run.paused)this.meteorClock-=dt;
        if(!this.meteor&&this.meteorClock<=0){this.meteor={x:.2+Math.random()*.6,y:.04+Math.random()*.12,age:0};this.meteorClock=4+Math.random()*4;}
        const m=this.meteor;if(m){if(!run.paused)m.age+=dt;const q=m.age/.9,x=(m.x+q*.18)*w,y=(m.y+q*.07)*h;c.globalAlpha=Math.max(0,1-q);c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-w*.06,y-h*.025);c.stroke();c.globalAlpha=1;if(q>=1)this.meteor=null;}
      }
    }
    drawShafts(run,p){
      if(this.reduced||this.quality.limits.parallax<3)return;
      const c=this.ctx,w=this.w,h=this.h,sx=w*.8,sy=h*.14,t=run.time*.05;
      c.save();c.globalAlpha=.04+.05*p.vivid;c.fillStyle=p.sun;
      for(let i=0;i<4;i++){const a=2.15+i*.28+Math.sin(t+i)*.04,len=h*1.05,spread=.05+i%2*.03;
        c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+Math.cos(a-spread)*len,sy+Math.sin(a-spread)*len);c.lineTo(sx+Math.cos(a+spread)*len,sy+Math.sin(a+spread)*len);c.closePath();c.fill();}
      c.restore();
    }
    dust(x,y){for(let i=0;i<this.quality.limits.particles;i++){const p=this.particles[i];if(p.life>0)continue;Object.assign(p,{dust:true,magnet:false,x,y,vx:-70-Math.random()*60,vy:-8-Math.random()*14,life:.42,max:.42,color:'#e9e1cf'});return;}}
    polygon(points,fill){poly(this.ctx,points,fill);}
    obstacleMetrics(){return {s:Math.min(34,this.h*.068),rx:Math.min(this.w*.024,35)};}
    obstacle(o,x,y,time){
      const {s,rx}=this.obstacleMetrics(),bw=rx*2.9,bh=s*1.9;
      this.stamp('shadow|'+Math.round(rx),rx*2.6,s*.7,rx*1.3,s*.35,(g,cx,cy)=>shadowVector(g,cx,cy,rx*1.25,s*.3,.6),x,y+s*.6);
      if(o.shape==='gear'){const c=this.ctx;c.save();c.translate(x,y-s*.05);if(!this.reduced)c.rotate(time*-1.7);this.stamp('obs|gear|'+Math.round(s),s*1.9,s*1.9,s*.95,s*.95,(g,cx,cy)=>{g.translate(cx,cy);obstacleVector(g,'gear',s,rx);},0,0);c.restore();return;}
      this.stamp('obs|'+o.shape+'|'+Math.round(s)+'|'+Math.round(rx),bw,bh,bw/2,s*1.1,(g,cx,cy)=>{g.translate(cx,cy);obstacleVector(g,o.shape,s,rx);},x,y);
    }
    coin(o,x,y,time){
      const h=this.h,r=Math.min(13,h*.032),size=Math.ceil(r*2+6);
      const phase=this.reduced?0:time*2.4+o.at*.013,s=Math.abs(Math.cos(phase)),frame=Math.min(7,Math.floor(s*8));
      this.stamp('cshadow|'+Math.round(r),r*2.6,r*.7,r*1.3,r*.35,(g,cx,cy)=>shadowVector(g,cx,cy,r*1.2,r*.26,.55),x,y+h*.09);
      this.stamp('coin|'+Math.round(r)+'|'+frame,size,size,size/2,size/2,(g,cx,cy)=>coinVector(g,cx,cy,r,.25+.75*(frame/7)),x,y);
      if(!this.reduced&&s>.97&&Math.sin(o.at*.7)>.4)this.stamp('spark|#fff6cf',24,24,12,12,(g,cx,cy)=>sparkVector(g,cx,cy,12,'#fff6cf'),x-r*.35,y-r*.45,.9);
    }
    // ---------- Formations: telegraphed attacks, the gold firing lane, safe lanes ----------
    corridor(lane,color,kind,time){
      const c=this.ctx,w=this.w,h=this.h,y=h*(.4+.24*lane),top=y-h*.10,bh=h*.16,x0=w*.08,bw=w*.86;
      // Bold enough to read from the back of the classroom: a tinted band, a brighter core and two rails.
      this.stamp('band|'+color+'|'+Math.round(bw)+'|'+Math.round(bh),bw,bh,0,0,g=>{const gr=g.createLinearGradient(0,0,bw,0);gr.addColorStop(0,color+'1c');gr.addColorStop(.5,color+'40');gr.addColorStop(1,color+'26');g.fillStyle=gr;rrect(g,0,0,bw,bh,bh*.3);g.fill();
        const core=g.createLinearGradient(0,bh*.3,0,bh*.7);core.addColorStop(0,color+'00');core.addColorStop(.5,color+'2e');core.addColorStop(1,color+'00');g.fillStyle=core;g.fillRect(bh*.3,bh*.3,bw-bh*.6,bh*.4);
        g.strokeStyle=color;g.globalAlpha=.95;g.lineWidth=2.5;g.beginPath();g.moveTo(bh*.3,1.5);g.lineTo(bw-bh*.3,1.5);g.moveTo(bh*.3,bh-1.5);g.lineTo(bw-bh*.3,bh-1.5);g.stroke();g.globalAlpha=1;},x0,top);
      // One group of three chevrons sweeps along the corridor: toward the runner for an attack, toward the guardian for the firing lane.
      const toward=kind==='fire'?1:-1,inset=bh*.3,span=bw-inset*2,sweep=this.reduced?.55:(time*.62+lane*.21)%1,head=toward>0?x0+inset+sweep*span:x0+bw-inset-sweep*span;
      for(let i=0;i<3;i++){const cx=head-toward*i*bh*.4;if(cx<x0+inset||cx>x0+bw-inset)continue;
        const fadeIn=Math.min(1,Math.min(cx-x0-inset,x0+bw-inset-cx)/(bh*1.2));
        this.stamp('chev|'+color+'|'+toward+'|'+Math.round(bh),bh*.5,bh*.6,bh*.25,bh*.3,(g,cx2,cy2)=>{g.strokeStyle=color;g.lineWidth=Math.max(2.5,bh*.09);g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(cx2-toward*bh*.12,cy2-bh*.2);g.lineTo(cx2+toward*bh*.12,cy2);g.lineTo(cx2-toward*bh*.12,cy2+bh*.2);g.stroke();},cx,y-h*.02,(1-i*.28)*fadeIn);}
      if(kind==='danger'){const ix=w*.43,iy=y-h*.02,ir=Math.max(12,h*.035);this.stamp('jumpicon|'+color+'|'+Math.round(ir),ir*2.4,ir*2.4,ir*1.2,ir*1.2,(g,cx,cy)=>{g.fillStyle='rgba(6,14,28,.75)';g.beginPath();g.arc(cx,cy,ir,0,TAU);g.fill();g.strokeStyle=color;g.lineWidth=2;g.stroke();g.lineWidth=Math.max(2,ir*.18);g.lineCap='round';g.beginPath();g.moveTo(cx,cy+ir*.5);g.lineTo(cx,cy-ir*.45);g.moveTo(cx-ir*.4,cy-ir*.05);g.lineTo(cx,cy-ir*.5);g.lineTo(cx+ir*.4,cy-ir*.05);g.stroke();},ix,iy,.95);}
    }
    drawBoss(run){
      const c=this.ctx,w=this.w,h=this.h,b=run.boss,info=this.bossInfo||{color:'#c4a3ef'},color=info.color;
      const arrive=Math.min(1,b.age/1.1),gone=b.defeated?Math.min(1,b.clock/2):0;
      const size=Math.min(h*.88,w*.43),x=w*(.77+(1-arrive)*.3)+(this.reduced?0:b.recoil*35),y=h*.53,tx=x-size*.18;
      c.save();c.globalAlpha=1-gone;
      this.stamp('bshadow|'+Math.round(size),size*.9,size*.2,size*.45,size*.1,(g,cx,cy)=>shadowVector(g,cx,cy,size*.4,size*.07,.7),x,y+size*.35,1-gone);
      this.stamp('aura|'+color+'|'+Math.round(size),size*1.1,size*1.1,size*.55,size*.55,(g,cx,cy)=>glowVector(g,cx,cy,size*.55,size*.55,color,.4),x,y,(1-gone)*(.55+(this.reduced?0:.15*Math.sin(run.time*2))));
      this.bossPoint={x,y,size};
      const bossPose=root.CreaturePoses?.bossState(b,this.bossFlash>0);
      const drawBossArt=()=>root.CreaturePoses?.draw(c,this.bossPack,bossPose,x-size*.5,y-size*.5+gone*22,size,size)||c.drawImage(this.bossImage,x-size*.5,y-size*.5+gone*22,size,size);
      if(this.bossImage&&this.bossImage.complete&&this.bossImage.naturalWidth){c.globalAlpha=1-gone;drawBossArt();
        // A struck guardian flashes once; additive, bounded and skipped with reduced motion.
        if(this.bossFlash>0&&!this.reduced){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-gone)*Math.min(1,this.bossFlash/.16)*.55;drawBossArt();c.restore();}}
      else{c.fillStyle=color;c.beginPath();c.arc(x,y,size*.3,0,TAU);c.fill();}
      // Weak point: a rotating gold reticle while the firing window is open.
      if(b.state==='expose'){const r0=size*.075,spin=this.reduced?0:run.time*2.4;c.globalAlpha=1-gone;
        this.stamp('reticleglow|'+Math.round(r0),r0*5,r0*5,r0*2.5,r0*2.5,(g,cx,cy)=>glowVector(g,cx,cy,r0*2.5,r0*2.5,'#ffe7a3',.3),tx,y,.8);
        c.strokeStyle='#fff0b6';c.lineWidth=Math.max(2,size*.008);for(let i=0;i<4;i++){const a=spin+i*Math.PI/2;c.beginPath();c.arc(tx,y,r0*1.6,a+.25,a+Math.PI/2-.25);c.stroke();}
        c.lineWidth=Math.max(1.5,size*.006);c.beginPath();c.arc(tx,y,r0*.9,0,TAU);c.stroke();c.fillStyle='#fff6cf';c.beginPath();c.arc(tx,y,r0*.3*(1+(this.reduced?0:.2*Math.sin(run.time*8))),0,TAU);c.fill();}
      if(this.impact>0){const t=1-this.impact/.45,rad=size*(.08+t*(this.impactFinal?.33:.16));
        c.globalAlpha=(1-gone)*(1-t);c.strokeStyle=this.impactFinal?'#fff4c7':'#f8dda2';c.lineWidth=this.impactFinal?5:3;c.beginPath();c.arc(tx,y,rad,0,TAU);c.stroke();
        if(this.impactFinal&&!this.reduced){for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(tx+Math.cos(a)*rad,y+Math.sin(a)*rad);c.lineTo(tx+Math.cos(a)*(rad+16),y+Math.sin(a)*(rad+16));c.stroke();}}
      }
      if(b.recoil>0&&!this.reduced){c.globalAlpha=1-gone;c.strokeStyle='#ffe5a5';c.lineWidth=3;c.beginPath();c.arc(x-size*.1,y,size*.1*(1-b.recoil/.18)+8,0,TAU);c.stroke();}
      c.restore();
      const from={x:w*.205,y:h*(.4+.24*run.lanePos)},to={x:tx,y};
      for(const shot of b.shots){const startY=h*(.4+.24*shot.lane),t=Math.min(1,shot.age/shot.duration),sx=from.x+(to.x-from.x)*t,sy=startY+(to.y-startY)*t-Math.sin(t*Math.PI)*h*.075;
        if(shot.word){
          // Word Strike: the spelled word itself flies to the guardian.
          const fs=Math.max(16,Math.min(34,h*.07));c.save();c.font=`800 ${fs}px Georgia,"Times New Roman",serif`;c.textAlign='center';c.textBaseline='middle';
          const tw=c.measureText(shot.word).width+fs*1.2;this.stamp('wsglow|'+Math.round(fs),fs*6,fs*3,fs*3,fs*1.5,(g,cx,cy)=>glowVector(g,cx,cy,fs*3,fs*1.5,this.house.color,.35),sx,sy,.9);
          const pl=c.createLinearGradient(0,sy-fs,0,sy+fs);pl.addColorStop(0,'#2a3550');pl.addColorStop(1,'#141b2b');c.fillStyle=pl;c.strokeStyle=this.house.color;c.lineWidth=3;rrect(c,sx-tw/2,sy-fs*.82,tw,fs*1.64,fs*.55);c.fill();c.stroke();
          c.fillStyle='#fff1c4';c.fillText(shot.word,sx,sy+1);c.restore();continue;
        }
        // Coin volley: the coins themselves fly, with a short trail.
        const r=Math.min(13,h*.032),size2=Math.ceil(r*2+6);
        for(let k=3;k>=0;k--){const tk=Math.max(0,t-k*.06),kx=from.x+(to.x-from.x)*tk,ky=startY+(to.y-startY)*tk-Math.sin(tk*Math.PI)*h*.075;
          this.stamp('coin|'+Math.round(r)+'|7',size2,size2,size2/2,size2/2,(g,cx,cy)=>coinVector(g,cx,cy,r,1),kx,ky,k?.22*(4-k)/3:1);}
        this.stamp('spark|#ffe7a3',24,24,12,12,(g,cx,cy)=>sparkVector(g,cx,cy,12,'#ffe7a3'),sx,sy,.7);}
      if(b.state==='counter'&&b.clock<.7){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(to.x,to.y,size*.13*(.6+b.clock),0,TAU);c.stroke();}
      if(b.state==='counter'&&b.attack>0){
        const ax=to.x+(from.x-to.x)*b.attack,ay=to.y+(from.y-to.y)*b.attack,pr=Math.min(34,h*.09);
        this.stamp('pglow|'+color+'|'+Math.round(pr),pr*4,pr*4,pr*2,pr*2,(g,cx,cy)=>glowVector(g,cx,cy,pr*2,pr*2,color,.35),ax,ay,.8);
        V.projectile(c,run.island,ax,ay,pr,b.clock,this.reduced,color);
      }
    }
    encounter(run){
      const c=this.ctx,w=this.w,h=this.h,m=run.mechanic,b=run.boss;
      if(m&&!m.resolved){
        const x=w*(.165+(m.at-run.distance)/1000),reward=['rune','wind','sequence'].includes(m.rule),color=run.config.color;
        if(reward){
          for(let lane=0;lane<3;lane++){
            const y=h*(.4+.24*lane),on=lane===m.lane,r=h*.06;
            if(on)this.stamp('rglow|'+color+'|'+Math.round(r),r*4,r*4,r*2,r*2,(g,cx,cy)=>glowVector(g,cx,cy,r*2,r*2,color,.35),x,y,.85);
            c.strokeStyle=color;c.lineWidth=3;c.globalAlpha=on?1:.22;
            c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.58,y);c.lineTo(x,y+r);c.lineTo(x-r*.58,y);c.closePath();
            if(on){const gr=c.createLinearGradient(x-r,y-r,x+r,y+r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,color);gr.addColorStop(1,shade(color,.3));c.fillStyle=gr;c.fill();}c.stroke();c.globalAlpha=1;
          }
          if(m.rule==='wind'){c.strokeStyle=color;c.lineWidth=2;for(let i=0;i<3;i++){const y=h*(.4+.24*m.lane)+i*5;c.beginPath();c.moveTo(x-40,y);c.quadraticCurveTo(x-10,y-15,x+20,y);c.stroke();}}
          if(m.rule==='sequence'){c.fillStyle=color;c.font='bold 16px system-ui';c.textAlign='center';c.fillText(`${m.step+1} / 3`,x,h*(.4+.24*m.lane)-h*.08);}
        }else{
          for(const lane of m.lanes){this.corridor(lane,color,'danger',run.time);this.obstacle({shape:run.config.shape},x,h*(.4+.24*lane),run.time);}
          if(m.rule==='signal'||m.rule==='eclipse')this.corridor(m.lane,'#94e0bd','fire',run.time);
        }
      }
      if(b&&['warn','strike','expose'].includes(b.state)){
        if(b.state==='expose'){this.corridor(b.weakLane,'#f6da91','fire',run.time);const y=h*(.4+.24*b.weakLane);c.strokeStyle='#ffe7a2';c.lineWidth=3;c.beginPath();c.ellipse(w*.165,y,h*.075,h*.06,0,0,TAU);c.stroke();}
        else for(const lane of b.lanes){this.corridor(lane,'#f87171','danger',run.time);if(b.state==='strike'){
          const x=w*(.78-.615*b.attack),y=h*(.4+.24*lane),pr=Math.min(24,h*.06);
          this.stamp('pglow|'+this.bossInfo.color+'|'+Math.round(pr),pr*4,pr*4,pr*2,pr*2,(g,cx,cy)=>glowVector(g,cx,cy,pr*2,pr*2,this.bossInfo.color,.35),x,y,.85);
          c.fillStyle=this.bossInfo.color;c.strokeStyle=this.bossInfo.color;c.lineWidth=4;
          V.projectile(c,run.island,x,y,pr,run.time,this.reduced,this.bossInfo.color);
        }}
      }
      if(run.gate?.choicesShown){
        // The answer gate arrives as a curtain of light with a post in each lane's colour; the answer text stays still.
        const x=w*(.93-.765*run.gate.ratio),top=h*.3,bh=h*.66;
        this.stamp('gatebeam|'+Math.round(bh),30,bh,15,0,(g,cx)=>{const gr=g.createLinearGradient(0,0,30,0);gr.addColorStop(0,'rgba(255,240,200,0)');gr.addColorStop(.5,'rgba(255,240,200,.32)');gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(0,0,30,bh);},x,top,.9);
        for(let lane=0;lane<3;lane++){const y=h*(.4+.24*lane),r=Math.max(6,h*.016);this.stamp('post|'+lane+'|'+Math.round(r),r*4,r*4,r*2,r*2,(g,cx,cy)=>{glowVector(g,cx,cy,r*2,r*2,laneColours[lane],.4);g.fillStyle=laneColours[lane];g.beginPath();g.moveTo(cx,cy-r);g.lineTo(cx+r*.7,cy);g.lineTo(cx,cy+r);g.lineTo(cx-r*.7,cy);g.closePath();g.fill();g.strokeStyle='#ffffff';g.lineWidth=1.2;g.stroke();},x,y+h*.06);}
      }
    }
    // Word Trail letter tiles: gold medallions, large and stationary in their lanes.
    letters(run){
      const w=this.w,h=this.h,t=run.trail,r=Math.max(15,Math.min(30,h*.055)),size=Math.ceil(r*3);
      for(let n=t.index;n<t.steps.length;n++){
        const step=t.steps[n],dx=step.at-run.distance;if(dx>940)break;if(dx<-50)continue;
        const x=w*(.165+dx/1000),next=n===t.index,bob=this.reduced||!next?0:Math.sin(run.time*3+n)*h*.006;
        for(let lane=0;lane<3;lane++){
          const y=h*(.40+.24*lane);
          this.stamp('lshadow|'+Math.round(r),r*2.4,r*.6,r*1.2,r*.3,(g,cx,cy)=>shadowVector(g,cx,cy,r*1.05,r*.22,.5),x,y+h*.09);
          this.stamp('letter|'+step.letters[lane]+'|'+(next?1:0)+'|'+Math.round(r),size,size,size/2,size/2,(g,cx,cy)=>medallionVector(g,cx,cy,r,step.letters[lane],next),x,y+bob,next?1:.86);
        }
      }
    }
    render(run,dt){
      const c=this.ctx,w=this.w,h=this.h,detail=this.quality.limits.parallax;
      if(!run.paused){this.answerGlow=Math.max(0,(this.answerGlow||0)-dt);this.impact=Math.max(0,(this.impact||0)-dt);this.bossFlash=Math.max(0,(this.bossFlash||0)-dt);}
      // Colour returns with each correct answer and fully with the guardian's defeat.
      const target=run.boss?.defeated||run.status==='completed'?1:Math.min(.96,this.vividStart+(run.correct||0)*((1-this.vividStart)/6));
      if(!run.paused)this.vivid+=(target-this.vivid)*Math.min(1,dt*(this.reduced?8:1.6));
      const p=this.scenePalette(this.realm);
      // Far layers stay still only with reduced motion; slower boards drop decoration, never the movement.
      const still=this.reduced,d=still?0:run.distance;
      this.ensureLayers(run);const L=this.layers;
      if(L)this.updateLevels(Math.round(target*100),dt,run.paused);
      if(!(L&&this.layer('sky',0,0)))drawSky(c,w,h*.42,p);
      if(p.stars&&!this.reduced){c.fillStyle='#ffffff';for(let i=0;i<14;i++){const st=this.stars[i];c.globalAlpha=(.25+.35*Math.sin(run.time*1.6+st.t))*(1-p.vivid*.4);c.fillRect(st.x*w,st.y*h,st.r*1.3,st.r*1.3);}c.globalAlpha=1;}
      if(detail>1){const cr=h*.035,level=L&&this.shown!==null?this.shown:Math.round(this.vivid*20)*5,cp=this.levelPalette(level);
        for(const cl of this.clouds){const cx=((cl.x-(this.reduced?0:run.time*cl.speed))%1.2+1.2)%1.2*w-w*.1,cy=cl.y*h,r=cr*cl.s;
          this.stamp('cloud|'+cl.v+'|'+Math.round(r)+'|'+level,r*6,r*2.6,r*3,r*1.4,(g,x0,y0)=>{const gr=g.createLinearGradient(0,y0-r*1.2,0,y0+r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.55,cp.cloud);gr.addColorStop(1,mixHex(cp.cloud,cp.skyTop,.3));g.fillStyle=gr;g.beginPath();g.ellipse(x0,y0,r*2.6,r,0,0,TAU);g.ellipse(x0-r*1.3,y0+r*.25,r*1.5,r*.75,0,0,TAU);g.ellipse(x0+r*1.1-cl.v*r*.2,y0-r*.35,r*1.4,r*.85,0,0,TAU);g.fill();},cx,cy,.62);}}
      if(!(L&&this.layer('ridges',d*.025,h*.1)))this.vectorStrip(d*.025,h*.1,w,h*.32,(g,a,b)=>drawRidges(g,a,b,p,this.realm));
      // The island's own landmark drifts slowly across the horizon; it never snaps back.
      const ls=L?L.landmarkSize:Math.min(h*.62,w*.26),lx=w*.72-(still?0:Math.min(w*.35,run.distance*.012));
      if(L&&L.landmark){c.globalAlpha=.75;c.drawImage(L.landmark.img,lx-ls*.5,h*.28-ls*.47,ls,ls);c.globalAlpha=1;}else if(!L)V.landmarkCanvas(c,run.island,lx,h*.28,ls,p);
      if(!(L&&this.layer('skyline',d*.10,h*.06)))this.vectorStrip(d*.10,h*.06,w,h*.36,(g,a,b)=>drawSkyline(g,a,b,p,this.realm));
      this.drawShafts(run,p);
      c.fillStyle=p.ground;c.fillRect(0,h*.405,w,h*.03);
      // Lane rows: running surface, front face and the ground under each lane, all scrolling with the run.
      const laneOffset=run.distance*w/1000,glow=V.colors[this.house.id]||this.house.color,metrics={depth:h*.065,face:h*.024};
      for(let lane=0;lane<3;lane++){
        const y=h*(.40+.24*lane),top=y+h*.025,depth=metrics.depth;
        if(!(L&&this.layer('row',laneOffset,top)))this.vectorStrip(laneOffset,top,w,h*.24,(g,a,b)=>drawRow(g,a,b,p,laneStyles[this.realm]||'cobble',metrics));
        if(lane){c.fillStyle='rgba(4,10,20,'+(.07*lane)+')';c.fillRect(0,top+depth+metrics.face,w,h*.24-depth-metrics.face);}
        if(lane===run.lane){c.fillStyle=glow;c.globalAlpha=.18;c.fillRect(0,top,w,depth);c.globalAlpha=.9;c.fillRect(0,top,w,Math.max(2,h*.005));c.globalAlpha=1;}
        if(this.answerGlow>0&&lane===this.answerLane){c.fillStyle=this.house.color;c.globalAlpha=this.answerGlow*.32;c.fillRect(0,top,w,depth);c.globalAlpha=1;}
      }
      this.drawAmbience(run,dt,p);
      if(run.phase==='course'){
        for(const o of run.objects){if(o.done)continue;const dx=o.at-run.distance;if(dx<-50||dx>940)continue;const x=w*(.165+dx/1000),y=h*(.40+.24*o.lane);if(x>w+60)continue;
          if(o.type==='coin')this.coin(o,x,y,run.time);else this.obstacle(o,x,y,run.time);
        }
      }
      this.encounter(run);
      if(run.trail&&run.trail.started&&!run.trail.done)this.letters(run);
      // A stable silhouette with a small gait; no rapid pose swapping.
      const knockout=run.boss?.state==='knockout'?Math.min(1,run.boss.clock/.8):0;
      const x=w*(.165+run.jumpForward/1000-knockout*.065),y=h*(.40+.24*run.lanePos),size=Math.min(188,h*.25,w*.18)*(this.artScale||1),hop=run.jumpHeight*Math.min(145,h*.25,Math.max(0,y-size*.8-6)),bob=this.reduced||run.paused||run.phase==='boss'?0:Math.sin(run.time*13)*Math.min(2.2,h*.006);
      this.stamp('rshadow|'+Math.round(size),size*.9,size*.2,size*.45,size*.1,(g,cx,cy)=>shadowVector(g,cx,cy,size*.4,size*.075,.62),x,y+size*.15,1-run.jumpHeight*.45);
      this.runnerPoint={x,y:y-hop,size};
      // An answer streak lights the runner from below; brighter with each correct answer in a row.
      if((run.combo||0)>=2&&!this.reduced&&detail>1){const k=Math.min(run.combo,5)/5,r=size*(.55+.25*k)*(1+.05*Math.sin(run.time*6));this.stamp('streak|'+this.house.id+'|'+Math.round(size),size*2,size*1.6,size,size*.8,(g,cx,cy)=>glowVector(g,cx,cy,size,size*.8,glow,.4),x,y-hop-size*.3,(.35+.35*k)*r/size);}
      const motion=root.RunnerSpiritMotion,pose=motion?.pose(this.house.id,run,this.reduced);
      if(run.focusTime>0){
        // Elemental Focus: a soft halo; with the shield it becomes a bright shell.
        this.stamp('focus|'+this.house.id+'|'+Math.round(size),size*1.3,size*1.4,size*.65,size*.7,(g,cx,cy)=>{glowVector(g,cx,cy,size*.62,size*.68,glow,.75);},x,y-hop-size*.27,run.focusShield?.85:.5);
        c.save();c.strokeStyle=glow;c.lineWidth=run.focusShield?3:1.5;c.globalAlpha=.85;c.beginPath();c.ellipse(x,y-hop-size*.27,size*.48,size*.54,0,0,TAU);c.stroke();
        if(!this.reduced){for(let i=0;i<3;i++){const a=run.time*.9+i*TAU/3,fx=x+Math.cos(a)*size*.48,fy=y-hop-size*.27+Math.sin(a)*size*.5;V.element(c,this.house.id,fx,fy,size*.07);}}
        if(motion&&detail>1)motion.trail(c,this.house.id,x,y-hop*.45,size*1.2,run.time,this.reduced);c.restore();}
      if(motion&&detail===3&&run.phase==='course'&&!run.paused&&!run.focusTime)motion.trail(c,this.house.id,x,y-hop*.45,size,run.time,this.reduced);
      if(!this.reduced&&!run.paused&&run.phase==='course'&&run.jumpAge<0&&detail>1){this.dustClock-=dt;if(this.dustClock<=0){this.dustClock=.11;this.dust(x-size*.12,y+size*.12);}}
      if(this.lastJump>=0&&run.jumpAge<0&&!this.reduced){this.landing=.3;for(let i=0;i<3;i++)this.dust(x+(i-1)*size*.14,y+size*.13);}
      this.lastJump=run.jumpAge;if(!run.paused)this.landing=Math.max(0,(this.landing||0)-dt);
      if(this.landing>0){c.save();c.globalAlpha=this.landing*1.6;c.strokeStyle=this.house.color;c.lineWidth=2;c.beginPath();c.ellipse(x,y+size*.15,size*(.35+(.3-this.landing)),size*.08,0,0,TAU);c.stroke();c.restore();}
      c.save();c.translate(x,y-hop+(pose?pose.bob*size:bob));c.rotate(knockout?-knockout*.5:(pose?.angle||0));if(pose)c.scale(pose.sx,pose.sy);
      // Landing squash: a short, bounded settle after each jump.
      if(this.landing>0&&!this.reduced){const k=Math.sin(this.landing/.3*Math.PI)*.11;c.scale(1+k,1-k);}
      if(run.invincible>0)c.globalAlpha=.8;
      const artPose=root.CreaturePoses?.runnerState(run,run.invincible>0&&!run.focusShield,this.landing,this.reduced);
      if(root.CreaturePoses?.draw(c,this.creaturePack,artPose,-size*.5,-size*.8,size,size)){}
      else if(this.image&&this.image.complete&&this.image.naturalWidth){if(motion)motion.draw(c,this.image,size,pose,this.house.id,this.quality.limits.strips);else c.drawImage(this.image,-size*.5,-size*.8,size,size);}
      else{c.fillStyle=this.house.color;c.beginPath();c.arc(0,-size*.25,size*.25,0,TAU);c.fill();}
      c.restore();
      if(run.boss)this.drawBoss(run);
      if(run.phase==='finish'){
        // The finish: two lit posts and a gold ribbon.
        const fx=w*(.165+(run.length-run.distance)/1000);
        for(const py of [h*.36,h*.94]){this.stamp('fpost|'+Math.round(h),18,h*.7,9,h*.7,g=>{const gr=g.createLinearGradient(0,0,18,0);gr.addColorStop(0,'#8a6a2a');gr.addColorStop(.5,'#fff1c4');gr.addColorStop(1,'#8a6a2a');g.fillStyle=gr;g.fillRect(5,0,8,h*.7);},fx,py);}
        c.fillStyle='#f3c96b';c.globalAlpha=.9;c.fillRect(fx-4,h*.24,8,h*.7);c.globalAlpha=.25;c.fillRect(fx-14,h*.24,28,h*.7);c.globalAlpha=1;
      }
      if(!run.paused)for(const z of this.particles){if(z.life<=0)continue;z.life=Math.max(0,z.life-dt);if(z.dust){z.x+=z.vx*dt;z.y+=z.vy*dt;}else if(!z.magnet){z.x+=z.vx*dt;z.y+=z.vy*dt;z.vy+=130*dt;}}
      for(const z of this.particles){if(z.life<=0)continue;const t=1-z.life/z.max,a=z.life/z.max;
        if(z.magnet){const tx=z.x+(x-z.x)*t,ty=z.y+(y-hop-size*.23-z.y)*t-Math.sin(t*Math.PI)*size*.13;this.stamp('spark|'+z.color,24,24,12,12,(g,cx,cy)=>sparkVector(g,cx,cy,12,z.color),tx,ty,a);}
        else if(z.dust){this.stamp('dust',20,20,10,10,(g,cx,cy)=>glowVector(g,cx,cy,10,10,'#e9e1cf',.6),z.x,z.y,a*.5*(1+t));}
        else this.stamp('spark|'+z.color,24,24,12,12,(g,cx,cy)=>sparkVector(g,cx,cy,12,z.color),z.x,z.y,a);
      }c.globalAlpha=1;
      this.drawFx(dt,run.paused);
      // Edge vignette: two narrow cached bands rather than a full-screen overlay.
      if(L){c.drawImage(L.left.img,0,0,L.left.w,h);if(L.right)c.drawImage(L.right.img,w-L.right.w,0,L.right.w,h);}
      else{const vg=this.gradient('vignette'+w,()=>{const v=c.createLinearGradient(0,0,w,0);v.addColorStop(0,'#06132344');v.addColorStop(.17,'#06132300');v.addColorStop(.85,'#06132300');v.addColorStop(1,'#06132366');return v;});c.fillStyle=vg;c.fillRect(0,0,w,h);}
    }
  }
  const api={islandSVG,Renderer,palettes,laneStyles};if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerScenery=api;
})(typeof globalThis!=='undefined'?globalThis:this);
