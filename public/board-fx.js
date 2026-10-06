/* v9.6.0 · Board presentation effects. Visual only: scores, ranks and rewards belong to game.js.
   The leader comes from the body.leader-* class game.js already maintains; nothing here writes state.
   v9.6.0 removes the "takes the lead" banner and the flying point bubbles (board and remote). */
(function(root){
 'use strict';
 const teams=['gryffindor','slytherin','hufflepuff','ravenclaw'];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Animated mode also carries performance-light (it shares the lean renderer); only real Light skips effects.
 const light=()=>document.body.classList.contains('performance-light')&&!document.body.classList.contains('performance-animated');
 const animated=()=>document.body.classList.contains('performance-animated');
 const sceneOpen=()=>/\b(battle-active|winner-active|vixar-raid-active|unity-event-active|island-run-active)\b/.test(document.body.className);
 const leaderOf=()=>(document.body.className.match(/\bleader-(gryffindor|slytherin|hufflepuff|ravenclaw)\b/)||[])[1]||null;

 // Board CSS animations are switched off in the lean modes, so short one-shot cues use the
 // Web Animations API, which those rules do not touch. Transform and opacity only.
 const presets={
  delta:[[{opacity:0,transform:'translateY(-10%) scale(.6)',easing:'cubic-bezier(.2,.9,.3,1.3)'},{opacity:1,transform:'translateY(-60%) scale(1.18)',offset:.22},{opacity:1,transform:'translateY(-65%) scale(1)',offset:.7},{opacity:0,transform:'translateY(-110%) scale(.96)'}],{duration:1000,easing:'linear'}],
  chip:[[{opacity:0,transform:'scale(.72)',easing:'ease-out'},{opacity:1,transform:'scale(1)',offset:.24},{opacity:1,transform:'scale(1)',offset:.68},{opacity:0,transform:'scale(.92)'}],{duration:920,easing:'linear'}],
  crown:[[{transform:'translateY(-6px) scale(1.25) rotate(-8deg)'},{transform:'translateY(0) scale(1) rotate(0)'}],{duration:620,easing:'cubic-bezier(.2,1.4,.3,1)'}]
 };
 function flash(el,kind,delay=0){
  if(!el||light()||reduced()||!presets[kind]||typeof el.animate!=='function')return null;
  const [frames,options]=presets[kind];
  try{return el.animate(frames,{...options,delay});}catch{return null;}
 }

 // ---- A new leader: the crown quietly drops onto its card. No banner, no text. ----
 let crowned=null,ready=false;
 function onLeader(){
  const team=leaderOf();
  if(!ready||!team||team===crowned)return;
  crowned=team;
  if(sceneOpen()||light()||reduced())return;
  // v10.3.0: started just after the next frame is drawn: animating the ::before crown makes the browser resolve
  // the whole board's styles, which costs nothing once the frame is drawn but a lot in the middle of an award.
  requestAnimationFrame(()=>setTimeout(()=>{if(crowned!==team||sceneOpen())return;
   const title=document.querySelector('#team-'+team+' .team-card-title');
   if(title)try{const [frames,options]=presets.crown;title.animate(frames,{...options,pseudoElement:'::before'});}catch{}},0));
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

 // ---- Teacher remote: the leader's card wears the crown; a changed score gives one short pulse ----
 const parseScore=text=>{const t=String(text||'').trim();if(!/^-?[\d.,\s]+$/.test(t))return null;const n=parseInt(t.replace(/[^\d-]/g,''),10);return Number.isFinite(n)?n:null;};
 const remoteScores=new Map();
 function remoteLeader(){
  const values=teams.map(id=>[id,parseScore(document.getElementById('mobile-score-'+id)?.textContent)]);
  const max=Math.max(...values.map(([,v])=>v??-Infinity)),leaders=values.filter(([,v])=>v===max&&max>0);
  for(const [id] of values)document.getElementById('mobile-score-'+id)?.closest('.mobile-team-card')?.classList.toggle('mobile-leader',leaders.length===1&&leaders[0][0]===id);
 }
 function remoteScoreChanged(id){
  const el=document.getElementById('mobile-score-'+id);if(!el)return;
  const now=parseScore(el.textContent),before=remoteScores.get(id);remoteScores.set(id,now);remoteLeader();
  if(before==null||now==null||now===before||reduced()||document.getElementById('mobile-controller')?.classList.contains('hidden'))return;
  try{el.animate([{transform:'scale(1)'},{transform:'scale(1.18)',offset:.3},{transform:'scale(1)'}],{duration:400,easing:'cubic-bezier(.2,1.3,.3,1)'});}catch{}
 }
 function watchRemote(){
  for(const id of teams){const el=document.getElementById('mobile-score-'+id);if(!el)continue;remoteScores.set(id,parseScore(el.textContent));
   new MutationObserver(()=>remoteScoreChanged(id)).observe(el,{childList:true,characterData:true,subtree:true});}
  remoteLeader();
 }

 function start(){
  watchPills();watchRemote();
  new MutationObserver(onLeader).observe(document.body,{attributes:true,attributeFilter:['class']});
  // Recovery and class selection settle first; the leader at that moment gets no animation.
  setTimeout(()=>{crowned=leaderOf();ready=true;},1500);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 root.LeagueBoardFX=Object.freeze({leaderOf,flash,animated});
})(window);
