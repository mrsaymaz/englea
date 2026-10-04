/* v9.5.0 · Board presentation effects. Visual only: scores, ranks and rewards belong to game.js.
   Lead changes come from the body.leader-* class game.js already maintains; nothing here writes state. */
(function(root){
 'use strict';
 const teams={gryffindor:['Gryffindor','#fb7185'],slytherin:['Slytherin','#34d399'],hufflepuff:['Hufflepuff','#fbbf24'],ravenclaw:['Ravenclaw','#60a5fa']};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Animated mode also carries performance-light (it shares the lean renderer); only real Light skips effects.
 const light=()=>document.body.classList.contains('performance-light')&&!document.body.classList.contains('performance-animated');
 const animated=()=>document.body.classList.contains('performance-animated');
 const sceneOpen=()=>/\b(battle-active|winner-active|vixar-raid-active|unity-event-active|island-run-active)\b/.test(document.body.className);
 const leaderOf=()=>(document.body.className.match(/\bleader-(gryffindor|slytherin|hufflepuff|ravenclaw)\b/)||[])[1]||null;

 // ---- Lead change ----
 let announced=null,ready=false,bannerTimer=0;
 function banner(team){
  let box=document.getElementById('lead-change-banner');
  if(!box){box=document.createElement('div');box.id='lead-change-banner';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
   box.innerHTML='<div class="lead-strip"><span class="lead-crown" aria-hidden="true"></span><span class="lead-team"></span><span class="lead-copy">takes the lead</span></div>';document.body.append(box);}
  const grid=document.getElementById('teams-grid'),top=grid?Math.max(8,grid.getBoundingClientRect().top-22):80;
  box.style.top=top+'px';box.style.setProperty('--lead-color',teams[team][1]);box.querySelector('.lead-team').textContent=teams[team][0];
  box.classList.remove('playing');void box.offsetWidth;box.classList.add('playing');
  clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>box.classList.remove('playing'),2300);
  // The crown on the new leader's card drops into place.
  const title=document.querySelector('#team-'+team+' .team-card-title');
  if(title&&!light()&&!reduced())try{const [frames,options]=presets.crown;title.animate(frames,{...options,pseudoElement:'::before'});}catch{}
 }
 function onLeader(){
  const team=leaderOf();
  if(!ready||!team||team===announced)return;
  announced=team;
  // A change during the arena, results or Island Run is not shown; the board shows it on return.
  if(!sceneOpen())banner(team);
 }

 // ---- Status pills: shown while something changes, then they step aside ----
 const quietTimers=new Map();
 function settle(el,ms,stayOpen){
  if(!el)return;clearTimeout(quietTimers.get(el));el.classList.remove('board-quiet');
  if(stayOpen?.())return;
  quietTimers.set(el,setTimeout(()=>{if(!stayOpen?.())el.classList.add('board-quiet');},ms));
 }
 function watchPills(){
  const remote=document.getElementById('remote-connection-indicator'),mode=document.getElementById('performance-mode-indicator');
  const troubled=()=>/^(failed|reconnecting|connecting|preparing)$/.test(remote?.dataset.remoteState||'');
  if(remote){settle(remote,7000,troubled);new MutationObserver(()=>settle(remote,7000,troubled)).observe(remote,{attributes:true,attributeFilter:['data-remote-state'],childList:true,subtree:true,characterData:true});}
  if(mode){settle(mode,5000);new MutationObserver(()=>settle(mode,5000)).observe(mode,{childList:true,characterData:true,subtree:true});}
 }

 // ---- Award points fly into the team's score ----
 function flyPoints(source,teamId,color){
  const panel=document.getElementById('score-panel-'+teamId);
  if(!source||!panel||light()||reduced()||sceneOpen())return;
  const from=source.getBoundingClientRect(),to=panel.getBoundingClientRect();
  if(!from.width||!to.width)return;
  const chip=document.createElement('div');chip.className='score-fly';chip.textContent=(source.textContent||'').split(' · ')[0];
  chip.style.setProperty('--fly-color',color||'#facc15');chip.style.left=from.left+'px';chip.style.top=from.top+'px';document.body.append(chip);
  const dx=to.left+to.width/2-from.left-from.width/2,dy=to.top+to.height/2-from.top-from.height/2;
  const motion=chip.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.55}px,${dy*.55-28}px) scale(1.15)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.55)`,opacity:.15}],{duration:720,delay:260,easing:'cubic-bezier(.45,0,.2,1)',fill:'both'});
  const done=()=>{chip.remove();flash(panel,'hit');};
  motion.addEventListener('finish',done,{once:true});motion.addEventListener('cancel',()=>chip.remove(),{once:true});
 }

 // Board CSS animations are switched off in the lean modes, so short one-shot cues use the
 // Web Animations API, which those rules do not touch. Transform and opacity only, except the
 // panel ring, which is a single half-second box-shadow.
 const presets={
  delta:[[{opacity:0,transform:'translateY(-10%) scale(.6)',easing:'cubic-bezier(.2,.9,.3,1.3)'},{opacity:1,transform:'translateY(-60%) scale(1.18)',offset:.22},{opacity:1,transform:'translateY(-65%) scale(1)',offset:.7},{opacity:0,transform:'translateY(-110%) scale(.96)'}],{duration:1000,easing:'linear'}],
  chip:[[{opacity:0,transform:'scale(.72)',easing:'ease-out'},{opacity:1,transform:'scale(1)',offset:.24},{opacity:1,transform:'scale(1)',offset:.68},{opacity:0,transform:'scale(.92)'}],{duration:920,easing:'linear'}],
  hit:[[{boxShadow:'0 0 0 0 rgba(255,255,255,0)'},{boxShadow:'0 0 0 3px rgba(255,255,255,.85),0 0 24px rgba(255,255,255,.45)',offset:.35},{boxShadow:'0 0 0 0 rgba(255,255,255,0)'}],{duration:520,easing:'ease-out'}],
  crown:[[{transform:'translateY(-6px) scale(1.25) rotate(-8deg)'},{transform:'translateY(0) scale(1) rotate(0)'}],{duration:620,easing:'cubic-bezier(.2,1.4,.3,1)'}]
 };
 function flash(el,kind,delay=0){
  if(!el||light()||reduced()||!presets[kind]||typeof el.animate!=='function')return null;
  const [frames,options]=presets[kind];
  try{return el.animate(frames,{...options,delay});}catch{return null;}
 }

 // ---- Teacher remote: the leader's card wears the crown and new points pop on the score ----
 const parseScore=text=>{const t=String(text||'').trim();if(!/^-?[\d.,\s]+$/.test(t))return null;const n=parseInt(t.replace(/[^\d-]/g,''),10);return Number.isFinite(n)?n:null;};
 const remoteScores=new Map();
 function remoteLeader(){
  const values=Object.keys(teams).map(id=>[id,parseScore(document.getElementById('mobile-score-'+id)?.textContent)]);
  const max=Math.max(...values.map(([,v])=>v??-Infinity)),leaders=values.filter(([,v])=>v===max&&max>0);
  for(const [id] of values)document.getElementById('mobile-score-'+id)?.closest('.mobile-team-card')?.classList.toggle('mobile-leader',leaders.length===1&&leaders[0][0]===id);
 }
 function remoteScoreChanged(id){
  const el=document.getElementById('mobile-score-'+id);if(!el)return;
  const now=parseScore(el.textContent),before=remoteScores.get(id);remoteScores.set(id,now);remoteLeader();
  if(before==null||now==null||now===before||reduced()||document.getElementById('mobile-controller')?.classList.contains('hidden'))return;
  const card=el.closest('.mobile-team-card'),delta=now-before;
  try{el.animate([{transform:'scale(1)'},{transform:'scale(1.22)',offset:.3},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.2,1.3,.3,1)'});}catch{}
  if(!card)return;const chip=document.createElement('span');chip.className='mobile-score-pop'+(delta<0?' negative':'');chip.textContent=(delta>0?'+':'−')+Math.abs(delta).toLocaleString('en-US');
  card.append(chip);
  try{const m=chip.animate([{opacity:0,transform:'translateY(6px) scale(.8)'},{opacity:1,transform:'translateY(-4px) scale(1.05)',offset:.25},{opacity:1,transform:'translateY(-10px) scale(1)',offset:.7},{opacity:0,transform:'translateY(-18px)'}],{duration:1100,easing:'linear'});m.addEventListener('finish',()=>chip.remove(),{once:true});m.addEventListener('cancel',()=>chip.remove(),{once:true});}catch{chip.remove();}
 }
 function watchRemote(){
  for(const id of Object.keys(teams)){const el=document.getElementById('mobile-score-'+id);if(!el)continue;remoteScores.set(id,parseScore(el.textContent));
   new MutationObserver(()=>remoteScoreChanged(id)).observe(el,{childList:true,characterData:true,subtree:true});}
  remoteLeader();
 }

 function start(){
  watchPills();watchRemote();
  new MutationObserver(onLeader).observe(document.body,{attributes:true,attributeFilter:['class']});
  // Recovery and class selection settle first; the leader at that moment is not announced.
  setTimeout(()=>{announced=leaderOf();ready=true;},1500);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 root.LeagueBoardFX=Object.freeze({flyPoints,banner,leaderOf,flash,animated});
})(window);
