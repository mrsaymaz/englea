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

 // ---- Act intros: the curtain keeps its words; Act II and III add their opening picture ----
 function introArt(curtain,act){
  curtain.querySelector('.saga-intro-art')?.remove();
  if(!act||act.act===1)return;
  const art=el('div','saga-intro-art');art.dataset.act=act.form;art.setAttribute('aria-hidden','true');
  if(act.act===2)art.innerHTML=`<svg class="saga-tear" viewBox="0 0 400 120"><path d="M8 60 L120 48 L168 18 L206 52 L246 30 L292 58 L392 60 L292 66 L246 92 L206 70 L168 104 L120 74 Z"/></svg><div class="saga-intro-eye">${eyeSvg()}</div><img class="saga-intro-form" src="./assets/animated/vixar-scarlet.webp?v=11.0.0" alt="">`;
  else art.innerHTML=`<svg class="saga-gold-crack" viewBox="0 0 400 300"><path d="M200 0 L188 46 L214 88 L194 132 L222 176 L198 222 L212 300"/></svg><img class="saga-intro-form" src="./assets/animated/vixar-gilded.webp?v=11.0.0" alt="">`;
  curtain.append(art);
 }
 function eyeSvg(){return `<svg viewBox="0 0 200 100"><defs><radialGradient id="sagaIris"><stop offset="0" stop-color="#fff1f2"/><stop offset=".25" stop-color="#fb7185"/><stop offset=".7" stop-color="#be123c"/><stop offset="1" stop-color="#4c0519"/></radialGradient></defs><path class="saga-eye-lid" d="M6 50 Q100 -12 194 50 Q100 112 6 50 Z" fill="#14010a" stroke="#fb7185" stroke-width="3"/><circle cx="100" cy="50" r="27" fill="url(#sagaIris)"/><ellipse cx="100" cy="50" rx="6" ry="22" fill="#0b0006"/></svg>`;}

 // ---- The escape (Acts I and II), about nine seconds, replacing the victory screen ----
 // 0–2 s false victory (chord and confetti) · 2–3 s the cut (silence, confetti frozen) · 3–5 s the shatter (crystal shards or
 // embers pull together and flee through a tear) · 5–8 s the eye (Act I) or a thin gold crack (Act II), with a heartbeat ·
 // 8–9 s the reward panel. Light mode and reduced motion: the shatter and the eye are two still frames.
 let escapeJob=null;
 function stopEscape(){if(!escapeJob)return;escapeJob.cancelled=true;for(const a of escapeJob.anims)try{a.cancel();}catch{}escapeJob.layer?.remove();escapeJob.overlay?.classList.remove('saga-escape','saga-cut','saga-dark');clock?.clear();escapeJob=null;}
 function escape({act,overlay,reduced=false,sound=()=>{},cut=()=>{},onDone=()=>{}}={}){
  stopEscape();
  const arena=doc.getElementById('vixar-raid-arena');if(!arena||!overlay){onDone();return null;}
  const job=escapeJob={cancelled:false,anims:new Set(),overlay,layer:el('div','saga-fx-layer')};
  const fast=()=>root.SceneRuntime?.fastForwarding;
  const still=reduced||reducedMotion();
  const play=(node,frames,opts)=>{if(job.cancelled||fast()||typeof node.animate!=='function')return null;const a=node.animate(frames,opts);job.anims.add(a);a.finished.catch(()=>{}).then(()=>job.anims.delete(a));return a;};
  job.layer.setAttribute('aria-hidden','true');job.layer.append(el('div','saga-darkness'));arena.append(job.layer);overlay.classList.add('saga-escape');overlay.dataset.escape=act.shatter;
  // Where the boss is, measured once.
  const a=arena.getBoundingClientRect(),b=doc.getElementById('vixar-boss-stage').getBoundingClientRect();
  const cx=b.left+b.width/2-a.left,cy=b.top+b.height*.48-a.top,tearX=a.width/2,tearY=Math.max(40,a.height*.08);
  const at=(ms,fn)=>after(()=>{if(!job.cancelled&&escapeJob===job)fn();},ms);
  // 0 s · false victory: confetti starts exactly as a win would.
  const confetti=[];
  if(!still){
   const colors=['#fde68a','#f472b6','#a78bfa','#38bdf8','#4ade80','#fb923c'];
   for(let i=0;i<26;i++){const c=el('i','saga-confetti');c.style.left=`${(i*37)%100}%`;c.style.background=colors[i%colors.length];job.layer.append(c);
    const anim=play(c,[{transform:'translateY(-8vh) rotate(0deg)'},{transform:`translateY(${70+(i%5)*6}vh) rotate(${(i%2?1:-1)*(240+i*9)}deg)`}],{duration:2600+(i%4)*260,delay:(i%7)*70,fill:'forwards',easing:'cubic-bezier(.3,.6,.6,1)'});if(anim)confetti.push(anim);}
  }
  // 2 s · the cut: all sound stops at once; the confetti freezes in the air.
  at(2000,()=>{cut();overlay.classList.add('saga-cut');confetti.forEach(c=>c.pause());});
  // 3 s · the shatter.
  at(3000,()=>{
   sound(act.shatter==='ember'?'shatterEmber':'shatterCrystal');
   overlay.classList.add('saga-shattered');
   const tear=el('div','saga-escape-tear');tear.innerHTML='<svg viewBox="0 0 400 120"><path d="M8 60 L120 48 L168 18 L206 52 L246 30 L292 58 L392 60 L292 66 L246 92 L206 70 L168 104 L120 74 Z"/></svg>';
   tear.style.left=`${tearX}px`;tear.style.top=`${tearY}px`;job.layer.append(tear);
   play(tear,[{transform:'translate(-50%,-50%) scaleY(.04)',opacity:0},{transform:'translate(-50%,-50%) scaleY(1)',opacity:1}],{duration:420,fill:'forwards',easing:'ease-out'});
   const count=still?14:18;
   for(let i=0;i<count;i++){
    const shard=el('i',`saga-shard saga-shard-${act.shatter}`),angle=i/count*Math.PI*2,r=60+(i%3)*28;
    shard.style.left=`${cx}px`;shard.style.top=`${cy}px`;job.layer.append(shard);
    const out=`translate(${Math.cos(angle)*r}px,${Math.sin(angle)*r}px) rotate(${i*41}deg)`;
    if(still){shard.style.transform=out;continue;}
    play(shard,[{transform:'translate(0,0) rotate(0deg) scale(.6)',opacity:1,offset:0},{transform:out+' scale(1)',opacity:1,offset:.32},{transform:'translate(0,-6px) rotate(0deg) scale(.7)',opacity:1,offset:.62},
     {transform:`translate(${tearX-cx}px,${tearY-cy}px) rotate(0deg) scale(.25,1.6)`,opacity:0,offset:1}],{duration:1800,delay:i*12,fill:'forwards',easing:'cubic-bezier(.4,0,.2,1)'});
   }
   if(still)job.layer.classList.add('still-frame');
  });
  // 5 s · the eye (Act I) or the gold crack (Act II): the arena goes dark.
  at(5000,()=>{
   overlay.classList.add('saga-dark');job.layer.querySelectorAll('.saga-shard').forEach(s=>s.remove());
   if(still)job.layer.classList.add('still-frame-2');
   if(act.act===1){
    const eye=el('div','saga-escape-eye');eye.innerHTML=`<img src="./assets/animated/vixar-scarlet.webp?v=11.0.0" alt="">${eyeSvg()}`;
    eye.style.left=`${tearX}px`;eye.style.top=`${tearY+Math.min(140,a.height*.2)}px`;job.layer.append(eye);
    const lid=eye.querySelector('svg');
    play(eye,[{opacity:0},{opacity:1}],{duration:still?300:600,fill:'forwards'});
    play(lid,[{transform:'scaleY(.05)'},{transform:'scaleY(.05)',offset:.15},{transform:'scaleY(1)',offset:.35},{transform:'scaleY(1)',offset:.8},{transform:'scaleY(.05)'}],{duration:2800,fill:'forwards',easing:'ease-in-out'});
    at(5900,()=>sound('heartbeat'));at(6900,()=>sound('heartbeat'));
   }else{
    const crack=el('div','saga-escape-crack');crack.innerHTML='<svg viewBox="0 0 1000 120" preserveAspectRatio="none"><path pathLength="100" d="M0 64 L120 58 L170 70 L260 52 L330 66 L420 44 L500 62 L590 50 L660 70 L760 54 L840 66 L1000 58"/></svg>';
    job.layer.append(crack);const path=crack.querySelector('path');
    if(still)path.style.strokeDashoffset='0';else play(path,[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:900,fill:'forwards',easing:'ease-out'});
    play(crack,[{opacity:1},{opacity:1,offset:.7},{opacity:0}],{duration:3000,fill:'forwards'});
    at(5300,()=>sound('goldCrack'));at(6100,()=>sound('heartbeat'));
   }
  });
  // 8 s · the reward.
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
  host.innerHTML=`<div class="finale-light"></div><div class="finale-stage"><div class="finale-boss"><img class="finale-cracking" src="./assets/animated/vixar-gilded-cracking.webp?v=11.0.0" alt="Gilded Vixar's armour cracking"><svg class="finale-cracks" viewBox="0 0 1100 890" aria-hidden="true">
   <path pathLength="100" d="M550 120 L532 230 L566 330 L540 430 L572 540 L548 650 L560 790"/><path pathLength="100" d="M566 330 L660 300 L760 340"/><path pathLength="100" d="M540 430 L430 470 L330 450"/><path pathLength="100" d="M572 540 L690 600 L780 590"/><path pathLength="100" d="M532 230 L440 200 L370 230"/></svg></div>
   <div class="finale-teacher"></div><div class="finale-creatures"></div><div class="finale-flakes" aria-hidden="true"></div></div>
   <div class="finale-bubble" aria-live="polite" hidden><p></p><small></small></div><section class="finale-names" hidden><h2>They carried the saga</h2><div class="finale-name-grid"></div></section>
   <figure class="finale-hug" hidden></figure><section class="finale-closing" hidden><p class="finale-closing-kicker">The Vixar Saga</p><p class="finale-closing-line"></p><p class="finale-date"></p></section>
   <footer class="finale-controls"><span class="finale-step"></span><button type="button" class="finale-continue">Continue ›</button></footer>`;
  host.querySelector('.finale-teacher').append(teacherArt('ready'));
  finale.reveal=preloadReveal(still);
  const creatures=host.querySelector('.finale-creatures');
  for(const t of options.teams||[]){const c=el('div','finale-creature');c.dataset.house=t.id;c.style.setProperty('--team-color',t.color);c.innerHTML=t.markup||'';creatures.append(c);}
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
  const bubble=host.querySelector('.finale-bubble');bubble.hidden=step!=='speech';
  host.querySelector('.finale-names').hidden=step!=='names';host.querySelector('.finale-hug').hidden=step!=='hug';host.querySelector('.finale-closing').hidden=step!=='closing';
  const teacher=host.querySelector('.saga-teacher-art');
  if(step!=='reveal')endReveal(f);
  if(step==='crack'){
   // Thin lines of light run across the armour, wider with each heartbeat.
   host.querySelectorAll('.finale-cracks path').forEach((p,i)=>{if(f.still)p.style.strokeDashoffset='0';else play(p,[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:2600,delay:i*180,fill:'forwards',easing:'ease-out'});});
   [0,1,2].forEach(i=>after(()=>{if(finale===f&&STEPS[f.step]==='crack'){f.sound?.('heartbeat');host.dataset.beat=String(i+1);}},300+i*1000));
  }else if(step==='break'){
   f.sound?.('curseBreak');
   const flakes=host.querySelector('.finale-flakes');flakes.replaceChildren();
   if(!f.still)for(let i=0;i<22;i++){const k=el('i','finale-flake');k.style.left=`${30+(i*29)%40}%`;k.style.top=`${18+(i*17)%30}%`;flakes.append(k);
    play(k,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${(i%2?1:-1)*(20+i*3)}px,${260+i*9}px) rotate(${i*37}deg)`,opacity:0}],{duration:1800+(i%5)*160,delay:(i%6)*60,fill:'forwards',easing:'ease-in'});}
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
   setTeacherPose(teacher,'support');
   const hug=host.querySelector('.finale-hug');hug.replaceChildren();const url=artUrl(manifest.hug);
   if(url){const img=new Image();img.alt='The four creatures hug Mr. Saymaz';img.src=url;img.onerror=()=>{hug.replaceChildren(hugPlaceholder(f));};hug.append(img);}else hug.append(hugPlaceholder(f));
   play(hug,[{opacity:0},{opacity:1}],{duration:1400,fill:'backwards'});
  }else if(step==='closing'){
   setTeacherPose(teacher,'bow');
   host.querySelector('.finale-closing-line').textContent=`The curse is broken. ${f.className} freed Mr. Saymaz.`;
   host.querySelector('.finale-date').textContent=f.date||'';
   play(host.querySelector('.finale-closing'),[{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:900,fill:'backwards'});
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
 function hugPlaceholder(f){
  // Until the finished illustration is added: Mr. Saymaz in the light with the four creatures close around him.
  const wrap=el('div','finale-hug-placeholder');wrap.append(teacherArt('support'));
  (f.teams||[]).forEach((t,i)=>{const c=el('div',`finale-hug-creature finale-hug-${i}`);c.innerHTML=t.markup||'';wrap.append(c);});
  return wrap;
 }
 function showLine(){
  const f=finale;if(!f)return;const bubble=f.host.querySelector('.finale-bubble'),lines=f.lines?.length?f.lines:['Thank you.'];
  const text=lines[Math.min(f.line,lines.length-1)];
  bubble.querySelector('p').textContent=text;bubble.querySelector('small').textContent=`${f.line+1} / ${lines.length}`;
  setTeacherPose(f.host.querySelector('.saga-teacher-art'),['support','proud','wave'][f.line%3]);
  play(bubble,[{opacity:0,transform:'translate(-50%,6px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:380,fill:'backwards',easing:'ease-out'});
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
 root.LeagueSagaScenes=Object.freeze({ready,introArt,escape,stopEscape,skipEscape,allyPortrait,mergedArt,mergedUrl,teacherArt,silhouette,
  finale:Object.freeze({start:startFinale,next,skip,setVoice,stop:stopFinale,view,STEPS,STEP_NAMES,get active(){return Boolean(finale);}}),
  get escaping(){return Boolean(escapeJob);},get manifest(){return JSON.parse(JSON.stringify(manifest));},get artReady(){return manifestLoaded;}});
})(window);
