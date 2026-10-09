/* v11.0.0 · Fight feel for the Vixar raid and the Battle Arena: the small cues that make an attack read like a
   video game, kept light for old smart boards.
   - Damage numbers that pop and rise (criticals larger, heals in their own colour, blocks as a word).
   - A hit spark on impact; a short hit-stop (the attacker's motion holds for ~70 ms) on criticals; a few pixels of
     screen shake on heavy blows; a red ground telegraph under a team just before Vixar's blow lands; shields that
     shatter into shards when they break.
   Rules: transforms and opacity only (no filters, shadows or layout reads per frame), every effect is finite and
   counted against the board's effects budget (LeaguePerformance.limit), nothing runs while the scene is paused,
   hidden or fast-forwarding. Light mode and reduced motion keep only the numbers, shown still.
   Presentation only: no damage, HP or timing is read or changed here. */
(function(root){
 'use strict';
 const doc=root.document;
 const media=root.matchMedia?.('(prefers-reduced-motion: reduce)');
 const reduced=()=>Boolean(media?.matches);
 const light=()=>doc.body.classList.contains('performance-light')&&!doc.body.classList.contains('performance-animated');
 const paused=()=>doc.hidden||root.SceneRuntime?.paused||root.SceneRuntime?.fastForwarding;
 const budget=n=>root.LeaguePerformance?.limit?root.LeaguePerformance.limit(n):n;
 const level=()=>root.LeaguePerformance?.level||0;
 const live=new Set(),numbers=[];const MAX_NUMBERS=8;
 function track(node,anim,ms){
  const entry={node,anim};live.add(entry);
  const done=()=>{node.remove();live.delete(entry);};
  if(anim){anim.finished.catch(()=>{}).then(done);}else setTimeout(done,ms);
  return entry;
 }
 function layerFor(target){
  // The raid draws into its motion layer, the Arena into its own; both are cleared when the scene closes.
  if(target?.closest?.('#vixar-raid-overlay'))return doc.getElementById('raid-motion-layer');
  if(target?.closest?.('#battle-overlay'))return doc.getElementById('arena-motion-layer');
  return null;
 }
 function centre(target,layer){
  const host=layer.parentElement||layer,a=host.getBoundingClientRect(),r=target.getBoundingClientRect();
  return {x:r.left+r.width/2-a.left,y:r.top+r.height/2-a.top,w:r.width,h:r.height};
 }
 // A number that pops and rises. kind: damage | critical | heal | block | word.
 function number(target,text,{color='#fff',kind='damage'}={}){
  if(!target||!text||doc.hidden||root.SceneRuntime?.fastForwarding)return null;
  const layer=layerFor(target);if(!layer)return null;
  const p=centre(target,layer),n=doc.createElement('span');
  n.className=`fx-number fx-${kind}`;n.textContent=text;n.style.color=color;
  n.style.left=`${p.x+(Math.random()-.5)*p.w*.3}px`;n.style.top=`${p.y-p.h*.18}px`;
  layer.append(n);numbers.push(n);while(numbers.length>MAX_NUMBERS)numbers.shift().remove();
  const remove=()=>{const i=numbers.indexOf(n);if(i>=0)numbers.splice(i,1);};
  if(reduced()||light()||level()>=2||typeof n.animate!=='function'){const e=track(n,null,700);setTimeout(remove,700);return e;}
  const rise=kind==='critical'?-74:kind==='heal'?-40:-50,pop=kind==='critical'?1.45:1.12;
  const anim=n.animate([{opacity:0,transform:'translate(-50%,0) scale(.55)'},{opacity:1,transform:`translate(-50%,${rise*.3}px) scale(${pop})`,offset:.18},
   {opacity:1,transform:`translate(-50%,${rise*.7}px) scale(1)`,offset:.68},{opacity:0,transform:`translate(-50%,${rise}px) scale(.96)`}],{duration:kind==='critical'?1000:780,easing:'cubic-bezier(.2,.8,.3,1)'});
  anim.finished.catch(()=>{}).then(remove);return track(n,anim);
 }
 const allowed=()=>!reduced()&&!light()&&!paused();
 // A starburst on the point of impact.
 function spark(target,color='#fff',{big=false}={}){
  if(!target||!allowed()||live.size>=budget(14))return null;
  const layer=layerFor(target);if(!layer)return null;
  const p=centre(target,layer),s=doc.createElement('span');s.className='fx-spark'+(big?' big':'');s.style.color=color;
  s.style.left=`${p.x}px`;s.style.top=`${p.y}px`;s.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 2 37 25 60 16 41 32 62 46 37 39 32 62 27 39 4 46 23 32 6 16 27 25Z"/></svg>';
  layer.append(s);
  const anim=s.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.3) rotate(0deg)'},{opacity:1,transform:`translate(-50%,-50%) scale(${big?1.3:1}) rotate(20deg)`,offset:.35},{opacity:0,transform:`translate(-50%,-50%) scale(${big?1.6:1.25}) rotate(35deg)`}],{duration:big?260:200,easing:'ease-out'});
  return track(s,anim);
 }
 // Hit-stop: the attacker's travel holds for a few frames on a critical, then carries on. No layout work.
 function hitStop(el,ms=70){
  if(!el?.getAnimations||!allowed()||level()>=1)return false;
  const running=el.getAnimations().filter(a=>a.playState==='running');if(!running.length)return false;
  running.forEach(a=>a.pause());setTimeout(()=>running.forEach(a=>{if(a.playState==='paused')a.play();}),ms);return true;
 }
 // A few pixels of shake on a heavy blow (budget level 0 only).
 let shaking=null;
 function shake(container,strength=5,ms=240){
  if(!container?.animate||!allowed()||level()>=1)return null;
  shaking?.cancel();const s=strength;
  shaking=container.animate([{transform:'translate(0,0)'},{transform:`translate(${-s}px,${s*.4}px)`},{transform:`translate(${s*.8}px,${-s*.5}px)`},{transform:`translate(${-s*.5}px,${s*.3}px)`},{transform:'translate(0,0)'}],{duration:ms,easing:'linear'});
  shaking.finished.catch(()=>{}).then(()=>{shaking=null;});return shaking;
 }
 // A warning ring on the ground under a team just before a boss blow lands.
 function telegraph(target,color='#f43f5e',ms=420){
  if(!target||!allowed()||live.size>=budget(14))return null;
  const layer=layerFor(target);if(!layer)return null;
  const p=centre(target,layer),t=doc.createElement('span');t.className='fx-telegraph';t.style.color=color;
  t.style.left=`${p.x}px`;t.style.top=`${p.y+p.h*.32}px`;t.style.width=`${Math.max(60,p.w*.9)}px`;
  layer.append(t);
  const anim=t.animate([{opacity:0,transform:'translate(-50%,-50%) scale(1.35)'},{opacity:.95,transform:'translate(-50%,-50%) scale(1)',offset:.55},{opacity:.95,offset:.85},{opacity:0,transform:'translate(-50%,-50%) scale(.9)'}],{duration:ms,easing:'ease-in'});
  return track(t,anim);
 }
 // A shield that breaks: six shards fly out.
 function shieldBreak(target,color='#7dd3fc'){
  if(!target||!allowed())return 0;
  const layer=layerFor(target);if(!layer)return 0;
  const p=centre(target,layer),count=Math.min(6,Math.max(2,budget(14)-live.size));let made=0;
  for(let i=0;i<count;i++){
   const k=doc.createElement('i');k.className='fx-shard';k.style.color=color;k.style.left=`${p.x}px`;k.style.top=`${p.y}px`;layer.append(k);
   const a=i/count*Math.PI*2+.3,d=46+(i%3)*14;
   const anim=k.animate([{opacity:1,transform:`translate(-50%,-50%) rotate(${i*60}deg)`},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d}px)) rotate(${i*60+140}deg) scale(.6)`}],{duration:420,easing:'cubic-bezier(.2,.7,.3,1)'});
   track(k,anim);made++;
  }
  return made;
 }
 function clear(){for(const {node,anim} of [...live]){try{anim?.cancel();}catch{}node.remove();}live.clear();numbers.length=0;shaking?.cancel();shaking=null;}
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)clear();});
 doc.addEventListener('league-scene-change',()=>{if(!root.LeagueScenes?.active)clear();});
 media?.addEventListener?.('change',e=>{if(e.matches)clear();});
 root.LeagueFightFX=Object.freeze({number,spark,hitStop,shake,telegraph,shieldBreak,clear,diagnostics:()=>({live:live.size,numbers:numbers.length})});
})(window);
