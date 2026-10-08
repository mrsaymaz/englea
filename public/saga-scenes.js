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
   <radialGradient id="sbCrater" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fde68a"/><stop offset=".4" stop-color="#f97316" stop-opacity=".7"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
   <path d="M108 470 C90 420 126 392 100 350 C84 322 118 300 104 262" fill="none" stroke="#2a0507" stroke-width="40" stroke-linecap="round" opacity=".45"/>
   <path d="M1492 470 C1510 420 1474 392 1500 350 C1516 322 1482 300 1496 262" fill="none" stroke="#2a0507" stroke-width="40" stroke-linecap="round" opacity=".45"/>
   <path d="M-60 640 L10 580 L70 520 L104 482 L134 480 L170 520 L230 572 L300 610 L360 640 L360 800 L-60 800 Z" fill="url(#sbNear)"/>
   <path d="M1660 640 L1590 580 L1530 520 L1496 482 L1466 480 L1430 520 L1370 572 L1300 610 L1240 640 L1240 800 L1660 800 Z" fill="url(#sbNear)"/>
   <ellipse cx="119" cy="482" rx="40" ry="16" fill="url(#sbCrater)"/><ellipse cx="1481" cy="482" rx="40" ry="16" fill="url(#sbCrater)"/>
   <g fill="none" stroke-linecap="round"><g stroke="#f97316" stroke-opacity=".28" stroke-width="16"><path d="M112 486 C104 520 84 548 60 578"/><path d="M128 488 C142 524 168 552 200 586"/><path d="M1488 486 C1496 520 1516 548 1540 578"/><path d="M1472 488 C1458 524 1432 552 1400 586"/></g>
    <g stroke="url(#sbLava)" stroke-width="4"><path d="M112 486 C104 520 84 548 60 578"/><path d="M128 488 C142 524 168 552 200 586"/><path d="M1488 486 C1496 520 1516 548 1540 578"/><path d="M1472 488 C1458 524 1432 552 1400 586"/></g></g>
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
 const RIFT='M200 0 L178 38 L152 74 L134 118 L112 150 L106 200 L92 246 L100 300 L86 352 L104 410 L118 468 L148 520 L170 566 L200 600 L222 566 L248 524 L268 470 L294 414 L300 354 L314 296 L298 236 L304 176 L284 120 L262 72 L230 36 Z';
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
  rift.innerHTML=`<svg viewBox="0 0 400 600" preserveAspectRatio="none"><defs><clipPath id="sagaRiftClip"><path d="${RIFT}"/></clipPath><radialGradient id="sagaRiftVoid" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="${riftColor}" stop-opacity=".45"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
   <path d="${RIFT}" fill="url(#sagaRiftVoid)"/>${nextSrc?`<image href="${nextSrc}" x="-180" y="36" width="760" height="616" preserveAspectRatio="xMidYMid meet" clip-path="url(#sagaRiftClip)" opacity=".95"/>`:''}
   <path class="rim-glow" d="${RIFT}" stroke="${riftColor}"/><path class="rim" d="${RIFT}" stroke="${next?.act===3?'#fde68a':'#fecdd3'}"/></svg>`;
  const caption=el('div','saga-caption');caption.style.setProperty('--caption',next?.act===3?'#fde68a':'#fda4af');
  caption.innerHTML=`<b>${act.winTitle.toUpperCase()}</b><span>${act.act===1?'…but Vixar slipped through the rift. Something scarlet is waiting.':'…but the light behind the rift is golden now.'}</span>`;
  L.append(dark,burst,rift,form,victory,flash,top,bottom,caption);
  const ribbons=[];
  if(!still){const colors=['#fde68a','#f59e0b','#fb7185','#a78bfa','#38bdf8','#4ade80'];
   for(let i=0;i<20;i++){const r=el('i','saga-ribbon');r.style.left=`${3+(i*47)%94}%`;r.style.background=colors[i%colors.length];L.append(r);
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
 const STEPS=['crack','break','reveal','speech','names','hug','closing'];
 const STEP_NAMES={crack:'The crack',break:'The break',reveal:'The reveal',speech:'The thank-you',names:'The names',hug:'The hug',closing:'The closing card'};
 let finale=null;
 function finaleRoot(){let host=doc.getElementById('saga-finale');if(!host){host=el('div');host.id='saga-finale';host.setAttribute('aria-hidden','true');host.setAttribute('role','dialog');host.setAttribute('aria-label','The Finale');doc.body.append(host);}return host;}
 function speak(text){try{const s=root.speechSynthesis;if(!s||!text)return;s.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.9;const v=s.getVoices().find(x=>/^en(-|_)GB/i.test(x.lang))||s.getVoices().find(x=>/^en/i.test(x.lang));if(v)u.voice=v;s.speak(u);}catch{}}
 function quiet(){try{root.speechSynthesis?.cancel();}catch{}}
 // options: {className, date, lines, names:{team:[{name,gave}]}, teams:[{id,name,color,markup}], replay, voice, still, sound(name), onChange(), onEnd()}
 function startFinale(options){
  stopFinale(false);
  const host=finaleRoot(),still=Boolean(options.still)||reducedMotion();
  finale={...options,still,step:0,line:0,anims:new Set(),host,themePlayed:false};
  host.className='';host.classList.toggle('still',still);host.dataset.step='crack';
  const motes=Array.from({length:12},(_,i)=>`<i class="saga-mote" style="--x:${(6+i*8)%94}%;--dx:${(i%2?1:-1)*(14+i*3)}px;--s:${3+(i%4)}px;--t:${8+(i%5)}s;--d:${-i*1.1}s"></i>`).join('');
  host.innerHTML=`<div class="finale-sky"></div><div class="finale-light"></div><div class="finale-rays" aria-hidden="true"></div><div class="finale-motes" aria-hidden="true">${motes}</div><div class="finale-floor" aria-hidden="true"></div>
   <div class="finale-stage"><div class="finale-boss"><div class="finale-boss-glow"></div><div class="finale-boss-pieces">${PIECES.map(pts=>{const poly=[];for(let i=0;i<pts.length;i+=2)poly.push(`${pts[i]}% ${pts[i+1]}%`);return `<div class="finale-piece" style="clip-path:polygon(${poly.join(',')})"><img src="./assets/animated/vixar-gilded-cracking.webp?v=11.0.0" alt=""></div>`;}).join('')}</div>
    <svg class="finale-cracks" viewBox="0 0 1100 890" aria-hidden="true"><g class="glow"><path pathLength="100" d="M550 409 L528 196 L440 0"/><path pathLength="100" d="M550 409 L671 222 L858 0"/><path pathLength="100" d="M550 409 L836 320 L1100 303"/><path pathLength="100" d="M550 409 L803 587 L1100 712"/><path pathLength="100" d="M550 409 L671 641 L726 890"/><path pathLength="100" d="M550 409 L396 632 L308 890"/><path pathLength="100" d="M550 409 L264 552 L0 623"/><path pathLength="100" d="M550 409 L297 285 L0 214"/></g><g class="core"><path pathLength="100" d="M550 409 L528 196 L440 0"/><path pathLength="100" d="M550 409 L671 222 L858 0"/><path pathLength="100" d="M550 409 L836 320 L1100 303"/><path pathLength="100" d="M550 409 L803 587 L1100 712"/><path pathLength="100" d="M550 409 L671 641 L726 890"/><path pathLength="100" d="M550 409 L396 632 L308 890"/><path pathLength="100" d="M550 409 L264 552 L0 623"/><path pathLength="100" d="M550 409 L297 285 L0 214"/></g></svg></div>
    <div class="finale-pillar" aria-hidden="true"></div><div class="finale-teacher"></div><div class="finale-creatures"></div><div class="finale-flakes" aria-hidden="true"></div><div class="finale-hearts" aria-hidden="true"></div></div>
   <div class="finale-flash" aria-hidden="true"></div>
   <div class="finale-dialogue" aria-live="polite" hidden><span class="finale-speaker">Mr. Saymaz</span><p></p><small></small><i class="finale-more" aria-hidden="true"></i></div>
   <section class="finale-names" hidden><p class="finale-kicker">The Vixar Saga</p><h2>They carried the saga</h2><div class="finale-name-grid"></div></section>
   <figure class="finale-hug" hidden></figure>
   <section class="finale-closing" hidden><svg class="finale-ornament" viewBox="0 0 400 20" aria-hidden="true"><path d="M0 10 H184 M216 10 H400"/><path class="gem" d="M200 1 L209 10 L200 19 L191 10 Z"/></svg><p class="finale-kicker">The Vixar Saga</p><h2 class="finale-closing-title">The Curse Is Broken</h2><p class="finale-closing-line"></p><p class="finale-date"></p><p class="finale-the-end">The End</p></section>
   <footer class="finale-controls"><span class="finale-step"></span><button type="button" class="finale-continue">Continue ›</button></footer>`;
  host.querySelector('.finale-teacher').append(teacherArt('ready'));
  finale.reveal=preloadReveal(still);
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
  if(step==='crack'){
   // Seams of light run across the armour exactly where it will split, wider with each heartbeat.
   host.querySelectorAll('.finale-cracks path').forEach((p,i)=>{if(f.still)p.style.strokeDashoffset='0';else play(p,[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:2400,delay:(i%8)*160,fill:'forwards',easing:'ease-out'});});
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
   if(!f.still)for(let i=0;i<24;i++){const k=el('i','finale-flake');k.style.left=`${32+(i*29)%36}%`;k.style.top=`${16+(i*17)%34}%`;flakes.append(k);
    play(k,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${(i%2?1:-1)*(30+i*5)}px,${280+i*9}px) rotate(${i*37}deg)`,opacity:0}],{duration:1900+(i%5)*160,delay:(i%6)*60,fill:'forwards',easing:'ease-in'});}
   play(host.querySelector('.finale-pillar'),[{transform:'translateX(-50%) scaleY(0)',opacity:0},{transform:'translateX(-50%) scaleY(1)',opacity:1}],{duration:900,delay:400,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'});
   // The merged teams separate back into the four house creatures.
   host.querySelectorAll('.finale-creature').forEach((c,i)=>play(c,[{transform:`translateX(${i<2?40:-40}px) scale(.85)`,opacity:0},{transform:'none',opacity:1}],{duration:900,delay:500+i*80,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'}));
  }else if(step==='reveal'){
   play(host.querySelector('.finale-teacher'),[{opacity:0,transform:'translate(-50%,10px) scale(.94)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:1200,fill:'backwards',easing:'ease-out'});
   setTeacherPose(teacher,'ready');
   playReveal(f);
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
   play(host.querySelector('.finale-closing'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:1100,fill:'backwards',easing:'ease-out'});
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
   after(()=>{if(finale===f&&STEPS[f.step]==='reveal'){f.sound?.('heartbeat');endReveal(f,true);}},f.still?0:380);
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
 // ---- The hug: the four Celestial creatures glow and turn back into their Level 0 selves, run to Mr. Saymaz, and he
 // kneels and hugs them. Two pictures finish it when they are added (manifest: mrSaymaz.kneel and hug); until then he
 // opens his arms (the support pose) and the little ones gather close around him. About five seconds; still in Light
 // mode and with reduced motion (the last frame at once). instant: straight to the last frame (Skip, the closing card).
 function hugScene(f,instant=false){
  const host=f.host,teacher=host.querySelector('.saga-teacher-art'),creatures=[...host.querySelectorAll('.finale-creature')];
  const still=f.still||instant,kneel=artUrl(manifest.mrSaymaz?.kneel),hugUrl=artUrl(manifest.hug);
  const at=(ms,fn)=>{if(still){fn();return;}after(()=>{if(finale===f&&['hug','closing'].includes(STEPS[f.step]))fn();},ms);};
  f.hugDone=true;host.classList.remove('cubs-home','hugging','kneeling');
  // 1 · the glow and the change.
  creatures.forEach((c,i)=>{const team=(f.teams||[])[i],glow=c.querySelector('.finale-creature-glow');
   if(!still)play(glow,[{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1.15)',offset:.7},{opacity:0,transform:'scale(1.4)'}],{duration:1300,delay:i*140,easing:'ease-out'});
   at(800+i*140,()=>{const art=c.querySelector('.finale-creature-art');art.innerHTML=team?.baby||art.innerHTML;c.classList.add('is-baby');
    play(art,[{transform:'scale(.4)',opacity:.2},{transform:'scale(1.12)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});});});
  if(!still)at(700,()=>f.sound?.('mergeResolve'));
  // 2 · the little ones run to him (little hops).
  at(1900,()=>{const stageBox=host.querySelector('.finale-stage').getBoundingClientRect(),mid=stageBox.left+stageBox.width/2,spots=[-.2,-.11,.11,.2];
   creatures.forEach((c,i)=>{const r=c.getBoundingClientRect(),dx=mid+spots[i]*Math.min(stageBox.width,1100)-(r.left+r.width/2);c.style.setProperty('--home',`${dx.toFixed(0)}px`);
    if(!still)play(c,[{transform:'translateX(0)'},{transform:`translateX(${(dx*.33).toFixed(0)}px) translateY(-18px)`,offset:.2},{transform:`translateX(${(dx*.5).toFixed(0)}px)`,offset:.36},{transform:`translateX(${(dx*.75).toFixed(0)}px) translateY(-16px)`,offset:.6},{transform:`translateX(${(dx*.88).toFixed(0)}px)`,offset:.76},{transform:`translateX(${dx.toFixed(0)}px)`}],{duration:1300,delay:i*60,easing:'linear'});});
   host.classList.add('cubs-home');});
  // 3 · he kneels and opens his arms.
  at(2700,()=>{host.classList.add('kneeling');if(kneel){teacher.dataset.pose='';const img=teacher.querySelector('img');if(img)img.src=kneel;}else setTeacherPose(teacher,'support');});
  // 4 · the hug.
  at(3600,()=>{host.classList.add('hugging');f.sound?.('finaleTheme');
   const hug=host.querySelector('.finale-hug');
   if(hugUrl&&!hug.querySelector('img')){const img=new Image();img.alt='Mr. Saymaz hugs the four little creatures';img.decoding='async';img.onerror=()=>{img.remove();hug.hidden=true;};img.src=hugUrl;hug.append(img);}
   hug.hidden=!hug.querySelector('img');if(!hug.hidden)play(hug,[{opacity:0},{opacity:1}],{duration:1400,easing:'ease-out'});
   const hearts=host.querySelector('.finale-hearts');hearts.replaceChildren();
   if(!still&&hug.hidden)for(let i=0;i<7;i++){const h=el('i','finale-heart');h.style.left=`${44+(i*7)%14}%`;hearts.append(h);play(h,[{opacity:0,transform:'translateY(0) scale(.5)'},{opacity:1,transform:'translateY(-40px) scale(1)',offset:.3},{opacity:0,transform:'translateY(-150px) scale(.8)'}],{duration:2400,delay:i*260,easing:'ease-out'});}});
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
