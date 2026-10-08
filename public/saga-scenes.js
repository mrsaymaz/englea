/* v11.0.0 · Vixar Saga scenes on the board: the act intros, the escape (Acts I and II), the Finale and the epilogue.
   Presentation only: the stage, the level cap and every reward are decided in game.js and vixar-saga.js before a scene
   plays, so skipping, pausing or a slow board never changes an outcome.
   Light on old smart boards: a scene moves at most a few dozen small elements, with transforms and opacity only (no
   blur, no filters that animate, no per-frame script). Light mode and reduced motion keep the same order and words;
   moving steps become still frames with a short cross-fade.
   Art slots (assets/saga/manifest.json): Mr. Saymaz (portrait and five poses), his six-frame liberation reveal, the hug
   illustration and the fused teams. A slot that is not filled in shows a placeholder and downloads nothing. */
(function(root){
 'use strict';
 const doc=root.document;
 const clock=root.SceneRuntime?.create('saga');
 const after=(fn,ms)=>clock?clock.after(fn,ms):setTimeout(fn,ms);
 const reducedMotion=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const NS='http://www.w3.org/2000/svg';
 const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const TEAMS=['gryffindor','slytherin','hufflepuff','ravenclaw'];
 const NAMES={gryffindor:'Gryffindor',slytherin:'Slytherin',hufflepuff:'Hufflepuff',ravenclaw:'Ravenclaw'};

 // ---- Art slots ----
 let manifest={mrSaymaz:{},reveal:[],hug:null,merged:{}};let manifestLoaded=false;
 const ready=(async()=>{try{const r=await fetch('./assets/saga/manifest.json?v=11.0.0',{cache:'no-cache'});if(r.ok){const m=await r.json();manifest={mrSaymaz:m?.mrSaymaz||{},reveal:Array.isArray(m?.reveal)?m.reveal.slice(0,12):[],hug:m?.hug||null,merged:m?.merged||{}};}}catch{}manifestLoaded=true;
  doc.dispatchEvent(new CustomEvent('league-saga-art'));})();
 const safe=name=>typeof name==='string'&&/^[A-Za-z0-9._-]{1,80}\.(webp|png|jpg|jpeg)$/i.test(name)?name:null;
 const artUrl=name=>safe(name)?`./assets/saga/${safe(name)}?v=11.0.0`:null;
 function teacherUrl(pose){const m=manifest.mrSaymaz||{};return artUrl(m[pose])||artUrl(m.ready)||null;}
 // Placeholder until Mr. Saymaz's picture is added: a warm figure of light, clearly a person, not a caricature.
 function silhouette(label=true){
  return `<svg class="saga-silhouette" viewBox="0 0 200 260" role="img" aria-label="Mr. Saymaz"><defs><radialGradient id="sagaHalo" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#fff7d6"/><stop offset=".55" stop-color="#fde68a" stop-opacity=".55"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient><linearGradient id="sagaFigure" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#fcd34d"/></linearGradient></defs>`+
   `<circle cx="100" cy="104" r="98" fill="url(#sagaHalo)"/><circle cx="100" cy="70" r="30" fill="url(#sagaFigure)"/><path d="M38 236 C40 164 62 120 100 120 C138 120 160 164 162 236 Z" fill="url(#sagaFigure)"/><path d="M84 122 L100 150 L116 122" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linejoin="round"/>`+
   (label?`<text x="100" y="254" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="800" fill="#92400e">Mr. Saymaz</text>`:'')+`</svg>`;
 }
 function teacherArt(pose='ready'){
  const wrap=el('div','saga-teacher-art');wrap.dataset.pose=pose;const url=teacherUrl(pose);
  if(url){const img=new Image();img.alt='Mr. Saymaz';img.decoding='async';img.src=url;img.onerror=()=>{wrap.innerHTML=silhouette();};wrap.append(img);}else wrap.innerHTML=silhouette();
  return wrap;
 }
 function setTeacherPose(wrap,pose){
  if(!wrap||wrap.dataset.pose===pose)return;const url=teacherUrl(pose);wrap.dataset.pose=pose;
  if(!url)return; // the placeholder has one pose
  const img=wrap.querySelector('img');if(img)img.src=url;
 }
 // Epilogue: a small portrait of Mr. Saymaz, as an ally, where the raid sigil was.
 function allyPortrait(){
  const span=el('span','saga-ally-portrait');span.setAttribute('aria-hidden','true');
  const url=artUrl(manifest.mrSaymaz?.portrait)||teacherUrl('ready');
  if(url){const img=new Image();img.alt='';img.src=url;img.onerror=()=>{span.innerHTML=silhouette(false);};span.append(img);}else span.innerHTML=silhouette(false);
  return span;
 }
 // The fused team's own picture, once added; until then game.js shows the two Level 12 creatures together.
 const FUSED_NAMES={slyffindor:'Slyffindor',huffleclaw:'Huffleclaw'};
 const mergedUrl=pairId=>FUSED_NAMES[pairId]?artUrl(manifest.merged?.[pairId]):null;
 // In Animated mode the picture is a creature avatar, so the pose controller plays its nine-pose sheet
 // (assets/poses/slyffindor.webp, huffleclaw.webp) in the fight; in Light mode it stays a still picture.
 function mergedArt(pairId,{poses=false}={}){
  const url=mergedUrl(pairId);if(!url)return '';
  const img=`<img class="${poses?'animated-sprite':'merged-art'}" src="${url}" width="512" height="512" alt="" decoding="async" draggable="false" data-merged-art="${pairId}">`;
  return poses?`<span class="animated-avatar merged-art" data-avatar-team="${pairId}" data-avatar-level="12" role="img" aria-label="${FUSED_NAMES[pairId]}">${img}</span>`:img;
 }
 // Once the fused picture has loaded, the two stand-in creatures leave (so they are not posed or drawn behind it).
 doc?.addEventListener('load',e=>{const t=e.target;if(!t?.dataset?.mergedArt)return;const art=t.closest('.merged-fighter-art');if(!art)return;art.classList.add('has-art');art.querySelectorAll('.merged-member').forEach(m=>m.remove());},true);
 doc?.addEventListener('error',e=>{const t=e.target;if(t?.dataset?.mergedArt)(t.closest('.merged-art')||t).remove();},true);
 // When the art list arrives after the board drew the epilogue sigil, redraw it once.
 doc?.addEventListener('league-saga-art',()=>{const old=doc.querySelector('#vixar-raid-btn .saga-ally-portrait');if(old)old.replaceWith(allyPortrait());});

 // ---- Each act's world: one static picture behind the arena (Acts II and III; Act I keeps the original violet void) ----
 // A few embers or gold motes drift in Animated mode only. Built once per fight, removed with the overlay's act change.
 const ARENA={
  scarlet(){return `<svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
   <linearGradient id="sbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060103"/><stop offset=".42" stop-color="#1f030b"/><stop offset=".66" stop-color="#4a0a15"/><stop offset=".8" stop-color="#26040e"/><stop offset="1" stop-color="#0a0104"/></linearGradient>
   <radialGradient id="sbGlow" cx="800" cy="520" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f97316" stop-opacity=".34"/><stop offset=".32" stop-color="#be123c" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
   <linearGradient id="sbFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f0b16"/><stop offset="1" stop-color="#12030a"/></linearGradient>
   <linearGradient id="sbNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e040a"/><stop offset="1" stop-color="#050102"/></linearGradient>
   <linearGradient id="sbLava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset=".35" stop-color="#fb923c"/><stop offset="1" stop-color="#b91c1c" stop-opacity="0"/></linearGradient></defs>
   <rect width="1600" height="800" fill="url(#sbSky)"/><rect width="1600" height="800" fill="url(#sbGlow)"/>
   <ellipse cx="420" cy="220" rx="560" ry="54" fill="#7f1d1d" opacity=".13"/><ellipse cx="1240" cy="160" rx="500" ry="46" fill="#9f1239" opacity=".11"/><ellipse cx="820" cy="300" rx="700" ry="40" fill="#450a0a" opacity=".2"/>
   <path d="M0 505 L70 480 L130 492 L190 455 L245 470 L300 430 L350 452 L420 440 L470 470 L540 462 L600 488 L1000 488 L1060 465 L1130 472 L1190 440 L1250 455 L1300 425 L1360 448 L1420 438 L1480 462 L1540 450 L1600 470 L1600 800 L0 800 Z" fill="url(#sbFar)"/>
   <path d="M0 505 L70 480 L130 492 L190 455 L245 470 L300 430 L350 452 L420 440 L470 470 L540 462 L600 488 M1000 488 L1060 465 L1130 472 L1190 440 L1250 455 L1300 425 L1360 448 L1420 438 L1480 462 L1540 450 L1600 470" fill="none" stroke="#fb923c" stroke-opacity=".3" stroke-width="2"/>
   <linearGradient id="sbSpire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0710"/><stop offset=".55" stop-color="#14030a"/><stop offset="1" stop-color="#060102"/></linearGradient>
   <g><polygon points="18,640 52,420 70,402 96,640" fill="url(#sbSpire)"/><polygon points="70,640 118,300 136,272 170,640" fill="url(#sbSpire)"/><polygon points="150,640 196,470 212,456 240,640" fill="url(#sbSpire)"/><polygon points="228,640 252,540 262,532 284,640" fill="url(#sbSpire)"/></g>
   <g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fb923c" stroke-opacity=".55" stroke-width="2"><path d="M70 402 L96 640"/><path d="M136 272 L170 640"/><path d="M212 456 L240 640"/><path d="M262 532 L284 640"/></g><g stroke="#f97316" stroke-opacity=".3" stroke-width="10"><path d="M57 640 L65 526 L59 451"/><path d="M120 640 L130 463 L125 326"/><path d="M195 640 L206 552 L202 503"/></g><g stroke="url(#sbLava)" stroke-width="2.5"><path d="M57 640 L65 526 L59 451"/><path d="M120 640 L130 463 L125 326"/><path d="M195 640 L206 552 L202 503"/></g></g>
   <g><polygon points="1582,640 1548,420 1530,402 1504,640" fill="url(#sbSpire)"/><polygon points="1530,640 1482,300 1464,272 1430,640" fill="url(#sbSpire)"/><polygon points="1450,640 1404,470 1388,456 1360,640" fill="url(#sbSpire)"/><polygon points="1372,640 1348,540 1338,532 1316,640" fill="url(#sbSpire)"/></g>
   <g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fb923c" stroke-opacity=".55" stroke-width="2"><path d="M1530 402 L1504 640"/><path d="M1464 272 L1430 640"/><path d="M1388 456 L1360 640"/><path d="M1338 532 L1316 640"/></g><g stroke="#f97316" stroke-opacity=".3" stroke-width="10"><path d="M1543 640 L1535 526 L1541 451"/><path d="M1480 640 L1470 463 L1475 326"/><path d="M1405 640 L1394 552 L1398 503"/></g><g stroke="url(#sbLava)" stroke-width="2.5"><path d="M1543 640 L1535 526 L1541 451"/><path d="M1480 640 L1470 463 L1475 326"/><path d="M1405 640 L1394 552 L1398 503"/></g></g>
   <g fill="none" stroke="#f97316" stroke-linecap="round" opacity=".55"><path d="M560 640 L610 652 L640 646 L700 664" stroke-width="2.5"/><path d="M1040 640 L990 654 L960 648 L900 666" stroke-width="2.5"/><path d="M360 700 L420 690 L470 706" stroke-width="2"/><path d="M1240 700 L1180 690 L1130 706" stroke-width="2"/></g>
   </svg>`;},
  gilded(){
   const bars=[];for(let a=-80;a<=80;a+=10){const t=a*Math.PI/180,x=800+430*Math.sin(t),c=Math.cos(t),w=(2.5+7*c).toFixed(1),top=(96-42*c).toFixed(0),bottom=(560+46*c).toFixed(0);
    bars.push(`<rect x="${(x-w/2).toFixed(1)}" y="${top}" width="${w}" height="${bottom-top}" rx="${(w/2).toFixed(1)}" opacity="${(.35+.5*c).toFixed(2)}"/>`);}
   const cols=[];for(let x=12;x<1600;x+=48){if(x>470&&x<1130)continue;cols.push(`<rect x="${x}" y="372" width="14" height="168"/><rect x="${x-4}" y="366" width="22" height="8"/>`);}
   return `<svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
   <linearGradient id="gbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070401"/><stop offset=".48" stop-color="#1b1104"/><stop offset=".7" stop-color="#3d2607"/><stop offset="1" stop-color="#0a0602"/></linearGradient>
   <radialGradient id="gbGlow" cx="800" cy="360" r="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fde68a" stop-opacity=".3"/><stop offset=".38" stop-color="#d97706" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
   <linearGradient id="gbBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#78350f"/><stop offset=".38" stop-color="#fcd34d"/><stop offset=".52" stop-color="#fffbeb"/><stop offset=".72" stop-color="#d97706"/><stop offset="1" stop-color="#451a03"/></linearGradient>
   <linearGradient id="gbShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7" stop-opacity=".24"/><stop offset="1" stop-color="#fef3c7" stop-opacity="0"/></linearGradient></defs>
   <rect width="1600" height="800" fill="url(#gbSky)"/><rect width="1600" height="800" fill="url(#gbGlow)"/>
   <polygon points="560,0 700,0 920,800 650,800" fill="url(#gbShaft)" opacity=".75"/><polygon points="930,0 1030,0 1200,800 990,800" fill="url(#gbShaft)" opacity=".5"/><polygon points="300,0 370,0 520,800 370,800" fill="url(#gbShaft)" opacity=".35"/>
   <g fill="#6b4410" opacity=".5">${cols.join('')}</g><rect x="0" y="536" width="1600" height="6" fill="#a16207" opacity=".35"/>
   <g fill="url(#gbBar)">${bars.join('')}</g>
   <g fill="none" stroke="url(#gbBar)"><ellipse cx="800" cy="96" rx="430" ry="44" stroke-width="7" opacity=".7"/><ellipse cx="800" cy="582" rx="440" ry="58" stroke-width="9" opacity=".55"/></g>
   <path d="M800 22 L812 46 L800 70 L788 46 Z" fill="#fef3c7" opacity=".85"/>
   </svg>`;}
 };
 function arena(act){
  const host=doc.getElementById('vixar-raid-arena');if(!host)return null;
  host.querySelector('.saga-backdrop')?.remove();
  const make=ARENA[act?.form];if(!make)return null;
  const back=el('div','saga-backdrop');back.dataset.act=act.form;back.setAttribute('aria-hidden','true');back.innerHTML=make();
  const motes=el('div','saga-motes');const count=act.form==='scarlet'?14:12;
  for(let i=0;i<count;i++){const m=el('i','saga-mote');const r=k=>((i*9301+k*49297)%233280)/233280;
   m.style.setProperty('--x',`${(4+r(1)*92).toFixed(1)}%`);m.style.setProperty('--dx',`${((r(2)-.5)*120).toFixed(0)}px`);m.style.setProperty('--s',`${(3+r(3)*5).toFixed(1)}px`);
   m.style.setProperty('--t',`${(7+r(4)*6).toFixed(1)}s`);m.style.setProperty('--d',`${(-r(5)*12).toFixed(1)}s`);motes.append(m);}
  back.append(motes);host.prepend(back);return back;
 }

 // ---- The act's title card: the form looms behind the act's name (the words come from game.js) ----
 function introArt(curtain,act){
  curtain.querySelector('.saga-intro-art')?.remove();curtain.querySelector('.saga-intro-form')?.remove();
  if(!act)return;
  const form=el('div','saga-intro-form');form.setAttribute('aria-hidden','true');
  form.innerHTML=`<img src="./assets/animated/${act.art}.webp?v=${act.act>1?'11.0.0':'6.7'}" alt="" decoding="async">`;
  curtain.prepend(form);
 }

 // ---- The escape (Acts I and II), about nine seconds, in place of the victory screen ----
 // 0 s   victory: a gold VICTORY, rays and ribbons; Vixar's defeated form is still on the field.
 // 1.9 s the cut: the sound stops, the ribbons freeze in the air, VICTORY turns to stone, letterbox bars close in.
 // 2.6 s a heartbeat: the form's core glows again.
 // 3.4 s the shatter: a white flash and the form breaks into eight pieces that fly apart (crystal, or embers in Act II).
 // 4.8 s the rift tears open above; through it, the next form looks down (Scarlet Vixar, then Gilded Vixar).
 // 5.6 s the caption: the form is broken, but Vixar escaped.   7.4 s the rift snaps shut.   8.2 s the reward.
 // Light mode and reduced motion: the same beats as still frames. Opacity and transforms only.
 const PIECES=[[50,46,48,22,40,0,78,0,61,25],[50,46,61,25,78,0,100,0,100,34,76,36],[50,46,76,36,100,34,100,80,73,66],[50,46,73,66,100,80,100,100,66,100,61,72],
  [50,46,61,72,66,100,28,100,36,71],[50,46,36,71,28,100,0,100,0,70,24,62],[50,46,24,62,0,70,0,24,27,32],[50,46,27,32,0,24,0,0,40,0,48,22]];
 const RIFT='M206 0 L196 40 L214 70 L186 112 L204 140 L166 196 L148 250 L162 288 L136 340 L156 392 L176 430 L166 470 L192 520 L186 560 L200 600 L216 556 L210 512 L234 470 L228 424 L252 384 L266 330 L246 284 L260 236 L240 190 L226 140 L238 104 L218 66 L226 30 Z';
 let escapeJob=null;
 function stopEscape(){if(!escapeJob)return;escapeJob.cancelled=true;for(const a of escapeJob.anims)try{a.cancel();}catch{}escapeJob.layer?.remove();escapeJob.overlay?.classList.remove('saga-escape','saga-cut','saga-dark');clock?.clear();escapeJob=null;}
 function escape({act,overlay,reduced=false,sound=()=>{},cut=()=>{},onDone=()=>{}}={}){
  stopEscape();
  const arenaEl=doc.getElementById('vixar-raid-arena');if(!arenaEl||!overlay){onDone();return null;}
  const job=escapeJob={cancelled:false,anims:new Set(),overlay,layer:el('div','saga-fx-layer')};
  const fast=()=>root.SceneRuntime?.fastForwarding;
  const still=reduced||reducedMotion();
  const play=(node,frames,opts)=>{if(still||job.cancelled||fast()||typeof node.animate!=='function')return null;const a=node.animate(frames,opts);job.anims.add(a);a.finished.catch(()=>{}).then(()=>job.anims.delete(a));return a;};
  const set=(node,styles)=>Object.assign(node.style,styles);
  const at=(ms,fn)=>after(()=>{if(!job.cancelled&&escapeJob===job)fn();},ms);
  const next=root.LeagueSaga?.act?.(act.next)||null,glow=act.shatter==='ember'?'#fb923c':'#c4b5fd';
  const L=job.layer;L.setAttribute('aria-hidden','true');
  // Where Vixar stands, measured once: the form is drawn again here so it can break apart.
  const a=arenaEl.getBoundingClientRect(),b=(doc.getElementById('vixar-boss-animated-art')||doc.getElementById('vixar-boss-stage')).getBoundingClientRect();
  const box=b.width>40?b:doc.getElementById('vixar-boss-stage').getBoundingClientRect();
  const dark=el('div','saga-darkness'),burst=el('div','saga-burst'),flash=el('div','saga-flash');
  const top=el('div','saga-letterbox top'),bottom=el('div','saga-letterbox bottom');
  const victory=el('div','saga-victory');victory.innerHTML='<b>VICTORY</b><small>The form falls</small><div class="frozen"><b>VICTORY</b><small>The form falls</small></div>';
  const form=el('div','saga-form');set(form,{left:`${box.left-a.left}px`,top:`${box.top-a.top}px`,width:`${box.width}px`,height:`${box.height}px`});
  const src=`./assets/animated/${act.art}.webp?v=${act.act>1?'11.0.0':'6.7'}`;
  const pieces=PIECES.map(pts=>{const p=el('div','saga-piece');const poly=[];for(let i=0;i<pts.length;i+=2)poly.push(`${pts[i]}% ${pts[i+1]}%`);p.style.clipPath=`polygon(${poly.join(',')})`;
   p.innerHTML=`<img src="${src}" alt="" decoding="async">`;form.append(p);
   let cx=0,cy=0;const n=pts.length/2;for(let i=0;i<pts.length;i+=2){cx+=pts[i];cy+=pts[i+1];}p._dir=[cx/n-50,cy/n-46];return p;});
  const core=el('div','saga-core');core.style.setProperty('--glow',glow);form.append(core);
  const rift=el('div','saga-rift'),riftColor=next?.color||'#f43f5e',nextSrc=next?`./assets/animated/${next.art}.webp?v=11.0.0`:'';
  rift.style.setProperty('--rift',riftColor);
  rift.innerHTML=`<svg viewBox="0 0 400 600" preserveAspectRatio="none"><defs><clipPath id="sagaRiftClip"><path d="${RIFT}"/></clipPath><radialGradient id="sagaRiftVoid" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="${riftColor}" stop-opacity=".45"/><stop offset="1" stop-color="#000"/></radialGradient><radialGradient id="sagaRiftDepth" cx=".5" cy=".47" r=".5"><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity=".95"/></radialGradient></defs>
   <path d="${RIFT}" fill="url(#sagaRiftVoid)"/>${nextSrc?`<image href="${nextSrc}" x="-550" y="40" width="1500" height="1214" preserveAspectRatio="xMidYMid meet" clip-path="url(#sagaRiftClip)" opacity=".9"/>`:''}<path d="${RIFT}" fill="url(#sagaRiftDepth)"/>
   <path class="rim-glow" d="${RIFT}" stroke="${riftColor}"/><path class="rim" d="${RIFT}" stroke="${next?.act===3?'#fde68a':'#fecdd3'}"/></svg>`;
  const caption=el('div','saga-caption');caption.style.setProperty('--caption',next?.act===3?'#fde68a':'#fda4af');
  caption.innerHTML=`<b>${act.winTitle.toUpperCase()}</b><span>${act.act===1?'…but Vixar slipped through the rift. Something scarlet is waiting.':'…but the light behind the rift is golden now.'}</span>`;
  L.append(dark,burst,rift,form,victory,flash,top,bottom,caption);
  const ribbons=[];
  if(!still){const colors=['#fde68a','#f59e0b','#fb7185','#a78bfa','#38bdf8','#4ade80'];
   for(let i=0;i<20;i++){const r=el('i','saga-ribbon');r.style.left=`${(3+((i*37)%20)*4.7).toFixed(1)}%`;r.style.background=colors[i%colors.length];L.append(r);
    const anim=play(r,[{transform:'translateY(0) rotate(0deg) rotateY(0deg)'},{transform:`translateY(${62+(i%5)*7}vh) rotate(${(i%2?1:-1)*(200+i*11)}deg) rotateY(540deg)`}],{duration:2700+(i%4)*240,delay:(i%7)*80,fill:'forwards',easing:'cubic-bezier(.25,.6,.55,1)'});if(anim)ribbons.push(anim);}}
  arenaEl.append(L);overlay.classList.add('saga-escape');overlay.dataset.escape=act.shatter;
  // 0 s · victory.
  set(victory,{opacity:1});set(burst,{opacity:.9});
  play(victory,[{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.06)',offset:.6},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:620,easing:'cubic-bezier(.2,.8,.2,1)'});
  const rays=play(burst,[{opacity:0,transform:'translate(-50%,-50%) rotate(0deg) scale(.6)'},{opacity:.9,transform:'translate(-50%,-50%) rotate(25deg) scale(1)'}],{duration:1900,easing:'ease-out',fill:'forwards'});
  play(form,[{opacity:0},{opacity:1}],{duration:400,fill:'forwards'});
  // 1.9 s · the cut.
  at(1900,()=>{cut();overlay.classList.add('saga-cut');ribbons.forEach(r=>r.pause());try{rays?.cancel();}catch{}
   set(victory.querySelector('.frozen'),{opacity:1});set(burst,{opacity:0});set(dark,{opacity:.75});set(top,{transform:'none'});set(bottom,{transform:'none'});
   play(victory.querySelector('.frozen'),[{opacity:0},{opacity:1}],{duration:260});play(burst,[{opacity:.9},{opacity:0}],{duration:400});play(dark,[{opacity:0},{opacity:.75}],{duration:500});
   play(top,[{transform:'translateY(-100%)'},{transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});play(bottom,[{transform:'translateY(100%)'},{transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});});
  // 2.6 s · a heartbeat: the core glows again.
  at(2600,()=>{sound('heartbeat');set(core,{opacity:.85});play(core,[{opacity:0,transform:'scale(.6)'},{opacity:.9,transform:'scale(1.15)',offset:.3},{opacity:.4,transform:'scale(.9)',offset:.55},{opacity:.95,transform:'scale(1.25)',offset:.8},{opacity:.85,transform:'scale(1)'}],{duration:800});
   play(form,[{transform:'none'},{transform:'translate(-3px,1px)'},{transform:'translate(3px,-1px)'},{transform:'translate(-2px,0)'},{transform:'none'}],{duration:300,delay:500});});
  // 3.4 s · the shatter.
  at(3400,()=>{sound(act.shatter==='ember'?'shatterEmber':'shatterCrystal');overlay.classList.add('saga-shattered');
   set(flash,{opacity:0});play(flash,[{opacity:0},{opacity:.85,offset:.15},{opacity:0}],{duration:520});
   set(victory,{opacity:0});play(victory,[{opacity:1},{opacity:0}],{duration:300});ribbons.forEach(r=>{try{r.cancel();}catch{}});L.querySelectorAll('.saga-ribbon').forEach(r=>r.remove());
   set(core,{opacity:0});
   pieces.forEach((p,i)=>{const [dx,dy]=p._dir,len=Math.hypot(dx,dy)||1,dist=(still?.22:.55)*box.width,rot=(i%2?1:-1)*(18+i*7);
    const out=`translate(${(dx/len*dist).toFixed(0)}px,${(dy/len*dist).toFixed(0)}px) rotate(${rot}deg)`;
    if(still){set(p,{transform:out,opacity:.85});return;}
    set(p,{opacity:0});play(p,[{transform:'none',opacity:1},{transform:out,opacity:.95,offset:.55},{transform:`${out} scale(.85)`,opacity:0}],{duration:1500,easing:'cubic-bezier(.15,.7,.3,1)'});});
   const cx=box.left-a.left+box.width/2,cy=box.top-a.top+box.height*.46,count=still?0:16;
   for(let i=0;i<count;i++){const k=el('i',`saga-spark ${act.shatter==='ember'?'ember':'crystal'}`),ang=i/count*Math.PI*2,r=90+(i%4)*45;set(k,{left:`${cx}px`,top:`${cy}px`,opacity:0});L.append(k);
    play(k,[{transform:'translate(-50%,-50%) scale(.4)',opacity:1},{transform:`translate(calc(-50% + ${(Math.cos(ang)*r).toFixed(0)}px),calc(-50% + ${(Math.sin(ang)*r).toFixed(0)}px)) rotate(${i*40}deg) scale(1)`,opacity:1,offset:.5},
     {transform:`translate(calc(-50% + ${(Math.cos(ang)*r*.3).toFixed(0)}px),calc(-50% - ${(cy-a.height*.12).toFixed(0)}px)) scale(.3)`,opacity:0}],{duration:1600,delay:i*18,easing:'cubic-bezier(.4,0,.2,1)'});}});
  // 4.8 s · the rift: the next form looks through.
  at(4800,()=>{sound(act.act===1?'heartbeat':'goldCrack');set(rift,{transform:'translateX(-50%) scaleY(1)'});
   play(rift,[{transform:'translateX(-50%) scaleY(0)'},{transform:'translateX(-50%) scaleY(1.04)',offset:.7},{transform:'translateX(-50%) scaleY(1)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
   const img=rift.querySelector('image');if(img)play(img,[{transform:'translateY(40px)',opacity:0},{transform:'none',opacity:.9}],{duration:1600,easing:'ease-out'});
   if(still)L.classList.add('still-frame-2');});
  // 5.6 s · the caption.
  at(5600,()=>{set(caption,{opacity:1});play(caption,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:600});if(act.act===1)at(6400,()=>sound('heartbeat'));});
  // 7.4 s · the rift snaps shut.
  at(7400,()=>{set(rift,{transform:'translateX(-50%) scaleY(0)'});play(rift,[{transform:'translateX(-50%) scaleY(1)'},{transform:'translateX(-50%) scaleY(0)'}],{duration:260,easing:'ease-in'});
   play(flash,[{opacity:0},{opacity:.35,offset:.2},{opacity:0}],{duration:420});});
  // 8.2 s · the reward.
  at(8200,()=>{const done=onDone;stopEscape();done();});
  return job;
 }
 function skipEscape(){if(!escapeJob)return false;if(root.SceneRuntime?.fastForward)root.SceneRuntime.fastForward('saga',()=>!escapeJob,20000);return true;}

 // ---- The Finale: a scene, not a fight. No timers, no scores; Mr. Saymaz advances it from the phone (or here). ----
 // Colour script: the gold prison (crack) → a white flash (break) → dawn over open hills (reveal, thank-you, names)
 // → golden light (hug) → the storybook end card.
 const STEPS=['crack','break','reveal','speech','names','hug','closing'];
 const STEP_NAMES={crack:'The crack',break:'The break',reveal:'The reveal',speech:'The thank-you',names:'The names',hug:'The hug',closing:'The closing card'};
 const CAPTIONS={crack:'Light breaks through the gold…',break:'The curse shatters.',reveal:'Someone was trapped inside all along…',freed:'Mr. Saymaz is free!',hug:'The four creatures become little again…'};
 let finale=null;
 // The seams of light follow the lines along which the armour splits (the PIECES edges), with a little zigzag and a
 // few short branches, masked to the armour itself so no line runs into the air.
 const SEAMS=[[528,196,440,0],[671,222,858,0],[836,320,1100,303],[803,587,1100,712],[671,641,726,890],[396,632,308,890],[264,552,0,623],[297,285,0,214]];
 function crackPaths(){
  let k=7;const rnd=()=>{k=(k*9301+49297)%233280;return k/233280;},paths=[];
  const jag=pts=>{let d=`M${pts[0]} ${pts[1]}`;for(let i=2;i<pts.length;i+=2){const ax=pts[i-2],ay=pts[i-1],bx=pts[i],by=pts[i+1],len=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/len,ny=(bx-ax)/len,n=Math.max(2,Math.round(len/42));
   for(let j=1;j<=n;j++){const t=j/n,off=j===n?0:(rnd()-.5)*26;d+=` L${(ax+(bx-ax)*t+nx*off).toFixed(0)} ${(ay+(by-ay)*t+ny*off).toFixed(0)}`;}}return d;};
  SEAMS.forEach(([mx,my,ex,ey],i)=>{paths.push(jag([550,409,mx,my,ex,ey]));
   const a=Math.atan2(ey-my,ex-mx)+(i%2?.7:-.7),len=70+rnd()*50;paths.push(jag([mx,my,mx+Math.cos(a)*len,my+Math.sin(a)*len]));});
  const g=cls=>`<g class="${cls}">${paths.map((d,i)=>`<path pathLength="100" class="${i%2?'branch':'seam'}" d="${d}"/>`).join('')}</g>`;
  return `<svg class="finale-cracks" viewBox="0 0 1100 890" aria-hidden="true">${g('glow')}${g('core')}</svg>`;
 }
 // Dawn over open hills: the world outside the prison. One static picture.
 const DAWN=`<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
  <linearGradient id="fdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0c29"/><stop offset=".26" stop-color="#2e1a4f"/><stop offset=".44" stop-color="#7a2f63"/><stop offset=".55" stop-color="#d0605a"/><stop offset=".61" stop-color="#f59f5b"/><stop offset=".66" stop-color="#fde3a7"/></linearGradient>
  <radialGradient id="fdSun" cx="800" cy="575" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbeb"/><stop offset=".12" stop-color="#fff1c1" stop-opacity=".95"/><stop offset=".34" stop-color="#fdba74" stop-opacity=".45"/><stop offset="1" stop-color="#fb923c" stop-opacity="0"/></radialGradient>
  <linearGradient id="fdFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a24a6e"/><stop offset="1" stop-color="#6d2a55"/></linearGradient>
  <linearGradient id="fdMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2149"/><stop offset="1" stop-color="#3a1534"/></linearGradient>
  <linearGradient id="fdGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1a2e"/><stop offset=".5" stop-color="#24101f"/><stop offset="1" stop-color="#120811"/></linearGradient>
  <radialGradient id="fdCloud"><stop offset="0" stop-color="#fbcfe8" stop-opacity=".9"/><stop offset=".6" stop-color="#f9a8d4" stop-opacity=".35"/><stop offset="1" stop-color="#f9a8d4" stop-opacity="0"/></radialGradient>
  <radialGradient id="fdCloudLow"><stop offset="0" stop-color="#fff1c1" stop-opacity=".95"/><stop offset=".6" stop-color="#fdba74" stop-opacity=".35"/><stop offset="1" stop-color="#fdba74" stop-opacity="0"/></radialGradient>
  <radialGradient id="fdPool" cx="800" cy="760" r="520" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 456) scale(1 .4)"><stop offset="0" stop-color="#fcd34d" stop-opacity=".55"/><stop offset=".45" stop-color="#f59e0b" stop-opacity=".18"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="900" fill="url(#fdSky)"/><rect width="1600" height="900" fill="url(#fdSun)"/>
  <g fill="url(#fdCloud)" opacity=".5"><ellipse cx="330" cy="300" rx="300" ry="16"/><ellipse cx="470" cy="326" rx="200" ry="9"/><ellipse cx="1240" cy="268" rx="340" ry="18"/><ellipse cx="1110" cy="300" rx="190" ry="8"/></g>
  <g fill="url(#fdCloudLow)" opacity=".6"><ellipse cx="560" cy="452" rx="260" ry="11"/><ellipse cx="1060" cy="440" rx="300" ry="12"/><ellipse cx="250" cy="488" rx="200" ry="7"/></g>
  <circle cx="800" cy="578" r="74" fill="#fffbeb" opacity=".95"/>
  <path d="M0 560 C120 520 230 512 360 540 C470 562 560 548 660 560 C740 570 860 570 940 560 C1060 546 1150 520 1270 532 C1400 546 1500 520 1600 528 L1600 900 L0 900 Z" fill="url(#fdFar)"/>
  <path d="M0 610 C160 576 300 590 430 612 C560 632 680 622 760 616 C860 610 960 618 1080 604 C1220 588 1380 572 1600 600 L1600 900 L0 900 Z" fill="url(#fdMid)"/>
  <path d="M0 668 C240 640 520 650 800 652 C1080 654 1360 640 1600 664 L1600 900 L0 900 Z" fill="url(#fdGround)"/>
  <rect y="600" width="1600" height="300" fill="url(#fdPool)"/>
  <path d="M0 668 C240 640 520 650 800 652 C1080 654 1360 640 1600 664" fill="none" stroke="#fde68a" stroke-opacity=".35" stroke-width="2"/>
  </svg>`;
 function finaleRoot(){let host=doc.getElementById('saga-finale');if(!host){host=el('div');host.id='saga-finale';host.setAttribute('aria-hidden','true');host.setAttribute('role','dialog');host.setAttribute('aria-label','The Finale');doc.body.append(host);}return host;}
 function speak(text){try{const s=root.speechSynthesis;if(!s||!text)return;s.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.9;const v=s.getVoices().find(x=>/^en(-|_)GB/i.test(x.lang))||s.getVoices().find(x=>/^en/i.test(x.lang));if(v)u.voice=v;s.speak(u);}catch{}}
 function quiet(){try{root.speechSynthesis?.cancel();}catch{}}
 function caption(f,text){const c=f?.host.querySelector('.finale-caption');if(!c)return;c.textContent=text||'';c.classList.toggle('on',Boolean(text));}
 // options: {className, date, lines, names:{team:[{name,gave}]}, teams:[{id,name,color,markup,baby}], replay, voice, still, sound(name), onChange(), onEnd()}
 function startFinale(options){
  stopFinale(false);
  const host=finaleRoot(),still=Boolean(options.still)||reducedMotion();
  finale={...options,still,step:0,line:0,anims:new Set(),host,themePlayed:false};
  host.className='';host.classList.toggle('still',still);host.dataset.step='crack';delete host.dataset.beat;
  const motes=Array.from({length:12},(_,i)=>`<i class="saga-mote" style="--x:${(6+i*8)%94}%;--dx:${(i%2?1:-1)*(14+i*3)}px;--s:${3+(i%4)}px;--t:${8+(i%5)}s;--d:${-i*1.1}s"></i>`).join('');
  host.innerHTML=`<div class="finale-sky">${ARENA.gilded().replace(/gb(Sky|Glow|Bar|Shaft)/g,'fg$1')}</div><div class="finale-light">${DAWN}</div><div class="finale-rays" aria-hidden="true"></div><div class="finale-motes" aria-hidden="true">${motes}</div><div class="finale-floor" aria-hidden="true"></div>
   <div class="finale-stage"><div class="finale-boss"><div class="finale-boss-glow"></div><div class="finale-boss-pieces">${PIECES.map(pts=>{const poly=[];for(let i=0;i<pts.length;i+=2)poly.push(`${pts[i]}% ${pts[i+1]}%`);return `<div class="finale-piece" style="clip-path:polygon(${poly.join(',')})"><img src="./assets/animated/vixar-gilded-cracking.webp?v=11.0.0" alt=""></div>`;}).join('')}</div>
    ${crackPaths()}</div>
    <div class="finale-pillar" aria-hidden="true"></div><div class="finale-teacher"></div><div class="finale-creatures"></div><div class="finale-flakes" aria-hidden="true"></div><div class="finale-hearts" aria-hidden="true"></div></div>
   <div class="finale-flash" aria-hidden="true"></div>
   <p class="finale-caption" aria-live="polite"></p>
   <div class="finale-dialogue" aria-live="polite" hidden><span class="finale-speaker">Mr. Saymaz</span><p></p><small></small><i class="finale-more" aria-hidden="true"></i></div>
   <section class="finale-names" hidden><p class="finale-kicker">The Vixar Saga</p><h2>They carried the saga</h2><div class="finale-name-grid"></div></section>
   <figure class="finale-hug" hidden></figure>
   <section class="finale-closing" hidden><svg class="finale-ornament" viewBox="0 0 400 20" aria-hidden="true"><path d="M0 10 H184 M216 10 H400"/><path class="gem" d="M200 1 L209 10 L200 19 L191 10 Z"/></svg><p class="finale-kicker">The Vixar Saga</p><h2 class="finale-closing-title">The Curse Is Broken</h2><p class="finale-closing-line"></p><p class="finale-date"></p><p class="finale-the-end">The End</p></section>
   <footer class="finale-controls"><span class="finale-step"></span><button type="button" class="finale-continue">Continue ›</button></footer>`;
  host.querySelector('.finale-teacher').append(teacherArt('ready'));
  finale.reveal=preloadReveal(still);
  // The hug's poses load while the armour cracks, so they are ready when he bends down and opens his arms.
  if(!still)for(const url of [teacherUrl('bow'),teacherUrl('support'),artUrl(manifest.mrSaymaz?.kneel)])if(url){const img=new Image();img.decoding='async';img.src=url;}
  const creatures=host.querySelector('.finale-creatures');
  for(const t of options.teams||[]){const c=el('div','finale-creature');c.dataset.house=t.id;c.style.setProperty('--team-color',t.color);c.innerHTML=`<div class="finale-creature-art">${t.markup||''}</div><i class="finale-creature-glow"></i>`;creatures.append(c);}
  host.querySelector('.finale-continue').onclick=()=>next();
  host.classList.add('visible');host.setAttribute('aria-hidden','false');
  root.LeagueScenes?.enter?.('finale','crack');
  enterStep();
  return true;
 }
 function play(node,frames,opts){if(!finale||finale.still||root.SceneRuntime?.fastForwarding||typeof node?.animate!=='function')return null;const a=node.animate(frames,opts);finale.anims.add(a);a.finished.catch(()=>{}).then(()=>finale?.anims.delete(a));return a;}
 function enterStep(){
  const f=finale;if(!f)return;const step=STEPS[f.step],host=f.host;
  host.dataset.step=step;root.LeagueScenes?.phase?.('finale',step);
  host.querySelector('.finale-step').textContent=f.replay?`Replay · ${STEP_NAMES[step]}`:STEP_NAMES[step];
  const bubble=host.querySelector('.finale-dialogue');bubble.hidden=step!=='speech';
  host.querySelector('.finale-names').hidden=step!=='names';host.querySelector('.finale-closing').hidden=step!=='closing';
  host.querySelector('.finale-hug').hidden=!(step==='hug'||step==='closing')||!host.querySelector('.finale-hug img');
  const teacher=host.querySelector('.saga-teacher-art');
  if(step!=='reveal')endReveal(f);
  caption(f,CAPTIONS[step]);
  if(step!=='hug'&&step!=='closing')host.classList.remove('cubs-home','kneeling','hugging','hug-zoom');
  if(step==='crack'){
   // Seams of light run across the armour exactly where it will split, wider with each heartbeat.
   host.querySelectorAll('.finale-cracks path').forEach((p,i)=>{const n=i%16,branch=n%2===1;if(f.still)p.style.strokeDashoffset='0';else play(p,[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:branch?900:2200,delay:branch?1300+(n>>1)*220:(n>>1)*180,fill:'forwards',easing:'ease-out'});});
   const boss=host.querySelector('.finale-boss'),glow=host.querySelector('.finale-boss-glow');
   [0,1,2].forEach(i=>after(()=>{if(finale===f&&STEPS[f.step]==='crack'){f.sound?.('heartbeat');host.dataset.beat=String(i+1);
    play(boss,[{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.025)',offset:.25},{transform:'translateX(-50%) scale(1)'}],{duration:520,easing:'ease-out'});
    play(glow,[{opacity:.25+i*.2},{opacity:.6+i*.15,offset:.25},{opacity:.25+i*.2}],{duration:700,easing:'ease-out'});}},300+i*1000));
  }else if(step==='break'){
   f.sound?.('curseBreak');
   // A white flash; the armour bursts along its seams; gold flakes fall; a pillar of light comes down.
   play(host.querySelector('.finale-flash'),[{opacity:0},{opacity:.9,offset:.12},{opacity:0}],{duration:900,easing:'ease-out'});
   host.querySelectorAll('.finale-piece').forEach((piece,i)=>{const pts=PIECES[i];let cx=0,cy=0;for(let k=0;k<pts.length;k+=2){cx+=pts[k];cy+=pts[k+1];}cx=cx/(pts.length/2)-50;cy=cy/(pts.length/2)-46;const len=Math.hypot(cx,cy)||1;
    const out=`translate(${(cx/len*46).toFixed(0)}vw,${(cy/len*46+20).toFixed(0)}vh) rotate(${(i%2?1:-1)*(30+i*9)}deg)`;
    if(f.still)piece.style.opacity='0';else play(piece,[{transform:'none',opacity:1},{transform:out,opacity:0}],{duration:1400,delay:i*25,fill:'forwards',easing:'cubic-bezier(.2,.6,.35,1)'});});
   const flakes=host.querySelector('.finale-flakes');flakes.replaceChildren();
   if(!f.still)for(let i=0;i<24;i++){const k=el('i','finale-flake'),r=n=>((i*9301+n*49297)%233280)/233280;k.style.left=`${(30+r(1)*40).toFixed(1)}%`;k.style.top=`${(10+r(2)*46).toFixed(1)}%`;flakes.append(k);
    play(k,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${(i%2?1:-1)*(30+i*5)}px,${280+i*9}px) rotate(${i*37}deg)`,opacity:0}],{duration:1900+(i%5)*160,delay:(i%6)*60,fill:'forwards',easing:'ease-in'});}
   play(host.querySelector('.finale-pillar'),[{transform:'translateX(-50%) scaleY(0)',opacity:0},{transform:'translateX(-50%) scaleY(1)',opacity:1}],{duration:900,delay:400,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'});
   // The merged teams separate back into the four house creatures.
   host.querySelectorAll('.finale-creature').forEach((c,i)=>play(c,[{transform:`translateX(${i<2?40:-40}px) scale(.85)`,opacity:0},{transform:'none',opacity:1}],{duration:900,delay:500+i*80,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'}));
  }else if(step==='reveal'){
   play(host.querySelector('.finale-teacher'),[{opacity:0,transform:'translate(-50%,10px) scale(.94)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:1200,fill:'backwards',easing:'ease-out'});
   setTeacherPose(teacher,'ready');
   playReveal(f);
   if(!f.reveal||f.reveal.failed)after(()=>{if(finale===f&&STEPS[f.step]==='reveal')caption(f,CAPTIONS.freed);},f.still?0:1400);
  }else if(step==='speech'){
   if(!f.themePlayed){f.themePlayed=true;f.sound?.('finaleTheme');}
   showLine();
  }else if(step==='names'){
   setTeacherPose(teacher,'proud');quiet();
   const grid=host.querySelector('.finale-name-grid');grid.replaceChildren();
   for(const t of f.teams||[]){const col=el('div','finale-house');col.style.setProperty('--team-color',t.color);col.append(el('h3','',t.name));
    const list=f.names?.[t.id]||[];
    if(!list.length)col.append(el('p','finale-house-all',`Every ${t.name} student`));
    for(const p of list){const row=el('p','finale-person');row.append(el('strong','',p.name),el('small','',p.gave.join(' · ')));col.append(row);}
    grid.append(col);}
  }else if(step==='hug'){
   hugScene(f);
  }else if(step==='closing'){
   if(!f.hugDone)hugScene(f,true);
   host.querySelector('.finale-closing-line').textContent=`${f.className} freed Mr. Saymaz.`;
   host.querySelector('.finale-date').textContent=f.date||'';
   play(host.querySelector('.finale-closing'),[{opacity:0,transform:'translate(-50%,12px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:1100,fill:'backwards',easing:'ease-out'});
  }
  host.querySelector('.finale-continue').textContent=step==='closing'?'Finish ✓':'Continue ›';
  f.onChange?.();
 }
 // ---- The reveal: Mr. Saymaz, bound in the cursed gown, breaks free (six frames on one canvas, so they stay registered),
 // then a soft flash and he stands in his own clothes. Opacity only; every frame is already decoded when the step starts
 // (they load while the armour cracks). Light mode and reduced motion: the identity frame, then the standing pose.
 const REVEAL_HOLD=900,REVEAL_FADE=380,REVEAL_SOUNDS={1:'shatterMetal',3:'shatterCrystal',4:'goldCrack'};
 function preloadReveal(still){
  const names=(manifest.reveal||[]).map(artUrl);if(names.length<2||names.some(u=>!u))return null;
  const urls=still?[names[names.length-1]]:names,r={frames:[],failed:false,index:-1,done:false};
  for(const url of urls){const img=new Image();img.className='finale-reveal-frame';img.alt='';img.decoding='async';img.onerror=()=>{r.failed=true;};img.src=url;img.decode?.().catch(()=>{});r.frames.push(img);}
  return r;
 }
 function revealFrame(f,i){
  const r=f.reveal,img=r?.frames[i],prev=r?.frames[r.index];if(!img||finale!==f||STEPS[f.step]!=='reveal')return;
  if(r.failed){endReveal(f,true);return;} // a frame that did not load: straight to his standing pose
  img.style.opacity='1';play(img,[{opacity:0},{opacity:1}],{duration:REVEAL_FADE,easing:'ease-out'});
  if(prev&&prev!==img){prev.style.opacity='0';play(prev,[{opacity:1},{opacity:0}],{duration:REVEAL_FADE,easing:'ease-in'});}
  r.index=i;if(!f.still&&REVEAL_SOUNDS[i])f.sound?.(REVEAL_SOUNDS[i]);f.onChange?.();
 }
 function playReveal(f){
  const r=f.reveal,wrap=f.host.querySelector('.finale-teacher');if(!r||r.failed||!wrap)return;
  const layer=el('div','finale-reveal');layer.setAttribute('aria-hidden','true');
  r.frames.forEach(img=>{img.style.opacity='0';layer.append(img);});
  layer.append(el('div','finale-reveal-flash'));wrap.append(layer);wrap.classList.add('revealing');r.index=-1;r.done=false;
  revealFrame(f,0);
  const last=r.frames.length-1;
  for(let i=1;i<=last;i++)after(()=>revealFrame(f,i),(f.still?0:1500)+(i-1)*REVEAL_HOLD);
  // The flash covers the change from the gown to his own clothes.
  after(()=>{
   if(finale!==f||STEPS[f.step]!=='reveal')return;
   play(layer.querySelector('.finale-reveal-flash'),[{opacity:0},{opacity:.92,offset:.45},{opacity:0}],{duration:900,easing:'ease-in-out'});
   after(()=>{if(finale===f&&STEPS[f.step]==='reveal'){f.sound?.('heartbeat');endReveal(f,true);caption(f,CAPTIONS.freed);}},f.still?0:380);
  },f.still?1800:1500+last*REVEAL_HOLD+600);
 }
 function endReveal(f,fade=false){
  const wrap=f?.host.querySelector('.finale-teacher'),layer=wrap?.querySelector('.finale-reveal');
  if(f?.reveal){f.reveal.done=true;f.reveal.index=-1;}
  if(!layer){wrap?.classList.remove('revealing');return;}
  wrap.classList.remove('revealing');
  if(fade){play(wrap.querySelector('.saga-teacher-art'),[{opacity:0},{opacity:1}],{duration:520,easing:'ease-out'});const a=play(layer,[{opacity:1},{opacity:0}],{duration:520,easing:'ease-out'});if(a){a.finished.catch(()=>{}).then(()=>layer.remove());f.onChange?.();return;}}
  layer.remove();f.onChange?.();
 }
 // ---- The hug: the four Celestial creatures glow and turn back into their Level 0 selves, run to Mr. Saymaz, he bends
 // down to them, opens his arms, the camera moves in and the little ones jump into his arms. About six seconds; Light
 // mode and reduced motion show the last frame at once (instant: the same, for Skip and the closing card).
 // Two pictures replace the stand-ins when they are added (manifest: mrSaymaz.kneel, then hug).
 // Where each little one lands, as fractions of his picture (640 × 1120): two in front at his waist, two at his shoulders.
 const ARMS={gryffindor:{x:.37,y:.45,h:.21,z:4},hufflepuff:{x:.64,y:.46,h:.21,z:4},slytherin:{x:.27,y:.31,h:.2,z:3},ravenclaw:{x:.74,y:.3,h:.2,z:3}};
 const KNEEL_DROP=.22; // a kneeling picture holds them lower
 function hugScene(f,instant=false){
  const host=f.host,stage=host.querySelector('.finale-stage'),box=host.querySelector('.finale-teacher'),teacher=host.querySelector('.saga-teacher-art'),creatures=[...host.querySelectorAll('.finale-creature')];
  const still=f.still||instant,kneel=artUrl(manifest.mrSaymaz?.kneel),hugUrl=artUrl(manifest.hug);
  const at=(ms,fn)=>{if(still){fn();return;}after(()=>{if(finale===f&&['hug','closing'].includes(STEPS[f.step]))fn();},ms);};
  f.hugDone=true;host.classList.remove('cubs-home','hugging','kneeling','hug-zoom');
  creatures.forEach(c=>{c.style.transform='';c.style.transformOrigin='';c.style.zIndex='';});
  // 1 · the glow and the change.
  creatures.forEach((c,i)=>{const team=(f.teams||[])[i],glow=c.querySelector('.finale-creature-glow');
   if(!still)play(glow,[{opacity:0,transform:'translate(-50%,-50%) scale(.6)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.15)',offset:.7},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:1300,delay:i*140,easing:'ease-out'});
   at(800+i*140,()=>{const art=c.querySelector('.finale-creature-art');if(!c.classList.contains('is-baby')){art.innerHTML=team?.baby||art.innerHTML;c.classList.add('is-baby');}
    play(art,[{transform:'scale(.4)',opacity:.2},{transform:'scale(1.12)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});});});
  if(!still)at(700,()=>f.sound?.('mergeResolve'));
  // 2 · the little ones run to his feet (little hops) and he bends down to them.
  at(1900,()=>{const stageBox=stage.getBoundingClientRect(),mid=stageBox.left+stageBox.width/2,t=box.getBoundingClientRect(),spots=[-.62,-.3,.3,.62];
   creatures.forEach((c,i)=>{const r=c.getBoundingClientRect(),dx=mid+spots[i]*Math.max(t.width,160)-(r.left+r.width/2);c.style.setProperty('--home',`${dx.toFixed(0)}px`);
    if(!still)play(c,[{transform:'translateX(0)'},{transform:`translateX(${(dx*.33).toFixed(0)}px) translateY(-18px)`,offset:.2},{transform:`translateX(${(dx*.5).toFixed(0)}px)`,offset:.36},{transform:`translateX(${(dx*.75).toFixed(0)}px) translateY(-16px)`,offset:.6},{transform:`translateX(${(dx*.88).toFixed(0)}px)`,offset:.76},{transform:`translateX(${dx.toFixed(0)}px)`}],{duration:1300,delay:i*60,easing:'linear'});});
   host.classList.add('cubs-home');});
  at(2500,()=>setTeacherPose(teacher,'bow'));
  // 3 · he kneels and opens his arms; the camera moves in; they jump into his arms.
  at(3500,()=>{
   if(kneel){teacher.dataset.pose='kneel';const img=teacher.querySelector('img');if(img)img.src=kneel;}else setTeacherPose(teacher,'support');
   host.classList.add('kneeling');
   // Measured once on the un-zoomed stage: his picture (contain, centred) and each little one's picture.
   const prev=stage.style.transform;stage.style.transform='none';
   const s=stage.getBoundingClientRect(),t=box.getBoundingClientRect(),ih=t.height,iw=Math.min(t.width,ih*640/1120),ix=t.left+(t.width-iw)/2,iy=t.top,drop=kneel?KNEEL_DROP:0;
   creatures.forEach(c=>{const spot=ARMS[c.dataset.house];if(!spot)return;const saved=c.style.transform;c.style.transform='none';
    const cb=c.getBoundingClientRect(),ab=c.querySelector('.finale-creature-art').getBoundingClientRect();c.style.transform=saved;
    const ox=ab.left-cb.left+ab.width/2,oy=ab.top-cb.top+ab.height/2,scale=spot.h*ih/Math.max(ab.height,1);
    const dx=ix+spot.x*iw-(cb.left+ox),dy=iy+(spot.y+drop)*ih-(cb.top+oy),home=parseFloat(c.style.getPropertyValue('--home'))||0;
    const end=`translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) scale(${scale.toFixed(3)})`;
    c.style.transformOrigin=`${ox.toFixed(0)}px ${oy.toFixed(0)}px`;c.style.zIndex=String(spot.z);
    if(!still)play(c,[{transform:`translateX(${home}px)`},{transform:`translate(${((home+dx)/2).toFixed(0)}px,${(Math.min(0,dy)-70).toFixed(0)}px) scale(${((1+scale)/2).toFixed(3)})`,offset:.5},{transform:end}],{duration:760,delay:200+(spot.z===4?0:160),easing:'cubic-bezier(.3,.7,.4,1)',fill:'backwards'});
    c.style.transform=end;});
   // The camera: his chest moves to the middle of the screen, 1.55× closer; for the end card, lower and less close.
   const cx=ix+iw*.5-s.left,cy=iy+ih*(.36+drop*.6)-s.top,W=root.innerWidth||s.width,H=root.innerHeight||s.height;
   host.style.setProperty('--zox',`${cx.toFixed(0)}px`);host.style.setProperty('--zoy',`${cy.toFixed(0)}px`);
   host.style.setProperty('--zx',`${(W/2-s.left-cx).toFixed(0)}px`);host.style.setProperty('--zy',`${(H*.46-s.top-cy).toFixed(0)}px`);host.style.setProperty('--zy2',`${(H*.67-s.top-cy).toFixed(0)}px`);
   stage.style.transform=prev;host.classList.add('hug-zoom');
   host.querySelectorAll('.finale-hearts').forEach(h=>{h.style.setProperty('--hx',`${cx.toFixed(0)}px`);h.style.setProperty('--hy',`${cy.toFixed(0)}px`);});});
  // 4 · the hug.
  at(4500,()=>{host.classList.add('hugging');f.sound?.('finaleTheme');caption(f,'');
   creatures.forEach((c,i)=>play(c.querySelector('.finale-creature-art'),[{transform:'scale(1)'},{transform:'scale(1.07,.94)',offset:.4},{transform:'scale(1)'}],{duration:620,delay:i*90,easing:'ease-out'}));
   const hearts=host.querySelector('.finale-hearts');hearts.replaceChildren();
   if(!still)for(let i=0;i<9;i++){const h=el('i','finale-heart');h.style.setProperty('--off',`${((i%2?1:-1)*(16+(i*37)%120))}px`);hearts.append(h);play(h,[{opacity:0,transform:'translateY(0) scale(.5)'},{opacity:1,transform:'translateY(-50px) scale(1)',offset:.3},{opacity:0,transform:'translateY(-190px) scale(.8)'}],{duration:2600,delay:300+i*260,easing:'ease-out'});}});
  // 5 · the hug illustration, when it is added, takes over the screen.
  at(5600,()=>{const hug=host.querySelector('.finale-hug');
   if(hugUrl&&!hug.querySelector('img')){const img=new Image();img.alt='Mr. Saymaz hugs the four little creatures';img.decoding='async';img.onerror=()=>{img.remove();hug.hidden=true;};img.src=hugUrl;hug.append(img);}
   hug.hidden=!hug.querySelector('img');if(!hug.hidden)play(hug,[{opacity:0},{opacity:1}],{duration:1400,easing:'ease-out'});});
  f.onChange?.();
 }
 function showLine(){
  const f=finale;if(!f)return;const bubble=f.host.querySelector('.finale-dialogue'),lines=f.lines?.length?f.lines:['Thank you.'];
  const text=lines[Math.min(f.line,lines.length-1)];
  bubble.querySelector('p').textContent=text;bubble.querySelector('small').textContent=`${f.line+1} / ${lines.length}`;
  setTeacherPose(f.host.querySelector('.saga-teacher-art'),['support','proud','wave'][f.line%3]);
  play(bubble.querySelector('p'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:360,fill:'backwards',easing:'ease-out'});
  if(f.voice)speak(text);
 }
 // Continue: the next line of the speech, or the next step. The closing card's Continue ends the Finale.
 function next(){
  const f=finale;if(!f)return {ok:false,message:'The Finale is not open'};
  const step=STEPS[f.step];
  if(step==='speech'&&f.line<(f.lines?.length||1)-1){f.line++;showLine();f.onChange?.();return {ok:true};}
  if(f.step>=STEPS.length-1){stopFinale(true);return {ok:true,ended:true};}
  f.step++;f.line=0;enterStep();return {ok:true};
 }
 function skip(){const f=finale;if(!f)return;f.step=STEPS.length-1;f.line=0;quiet();enterStep();}
 function setVoice(on){if(!finale)return {ok:false};finale.voice=Boolean(on);if(!on)quiet();else if(STEPS[finale.step]==='speech')showLine();finale.onChange?.();return {ok:true,message:on?'Voice on':'Voice off'};}
 function stopFinale(ended=false){
  const f=finale;if(!f)return;finale=null;quiet();clock?.clear();
  for(const a of f.anims)try{a.cancel();}catch{}
  f.host.classList.remove('visible');f.host.setAttribute('aria-hidden','true');f.host.replaceChildren();
  root.LeagueScenes?.leave?.('finale');
  if(ended)f.onEnd?.();f.onChange?.();
 }
 function view(){
  const f=finale;if(!f)return null;const step=STEPS[f.step];
  return {step,name:STEP_NAMES[step],index:f.step,total:STEPS.length,line:step==='speech'?f.line+1:0,lines:f.lines?.length||0,
   text:step==='speech'?(f.lines?.[f.line]||''):'',voice:Boolean(f.voice),replay:Boolean(f.replay),last:step==='closing',
   reveal:step==='reveal'&&f.reveal&&!f.reveal.done&&f.reveal.index>=0?{frame:f.reveal.index+1,frames:f.reveal.frames.length}:null};
 }
 root.LeagueSagaScenes=Object.freeze({ready,arena,introArt,escape,stopEscape,skipEscape,allyPortrait,mergedArt,mergedUrl,teacherArt,silhouette,
  finale:Object.freeze({start:startFinale,next,skip,setVoice,stop:stopFinale,view,STEPS,STEP_NAMES,get active(){return Boolean(finale);}}),
  get escaping(){return Boolean(escapeJob);},get manifest(){return JSON.parse(JSON.stringify(manifest));},get artReady(){return manifestLoaded;}});
})(window);
