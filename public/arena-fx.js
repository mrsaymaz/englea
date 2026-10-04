/* v9.5.0 · Final Arena presentation: a countdown dial in the empty centre, floating damage numbers,
   short callouts and a small shake on critical hits. Visual only; HP and outcomes belong to game.js.
   Everything lives in one layer inside #battle-arena and is cleared when the battle closes. */
(function(root){
 'use strict';
 const MAX_NUMBERS=8,reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const light=()=>document.body.classList.contains('performance-light')&&!document.body.classList.contains('performance-animated');
 let layer=null,dial=null,ring=null,digits=null,callout=null,lastCallout=0,calloutPriority=0,clockObserver=null,length=30;
 const numbers=[];
 function arena(){return document.getElementById('battle-arena');}
 function ensure(){
  const host=arena();if(!host)return null;
  if(layer&&layer.isConnected)return layer;
  layer=document.createElement('div');layer.id='arena-fx-layer';layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="arena-dial"><svg viewBox="0 0 120 120"><circle class="arena-dial-track" cx="60" cy="60" r="52"/><circle class="arena-dial-ring" cx="60" cy="60" r="52" pathLength="100"/></svg><b class="arena-dial-digits">30</b><small>seconds</small></div><div class="arena-callout"></div>';
  host.append(layer);
  dial=layer.querySelector('.arena-dial');ring=layer.querySelector('.arena-dial-ring');digits=layer.querySelector('.arena-dial-digits');callout=layer.querySelector('.arena-callout');
  return layer;
 }
 // The header clock keeps its text for everything that reads it; the dial mirrors it in the centre.
 function syncClock(){
  const clock=document.getElementById('battle-clock');if(!clock||!ensure())return;
  const value=Math.max(0,parseFloat(clock.textContent)||0);
  if(value>length)length=Math.ceil(value);
  const shown=String(Math.ceil(value));if(digits.textContent!==shown)digits.textContent=shown;
  ring.style.strokeDashoffset=String(100-100*Math.min(1,value/length));
  dial.classList.toggle('final',value<=5&&value>0);
 }
 function watchClock(){
  const clock=document.getElementById('battle-clock');if(!clock||clockObserver)return;
  clockObserver=new MutationObserver(syncClock);clockObserver.observe(clock,{childList:true,characterData:true,subtree:true});
 }
 function impact(teamId,damage,options={}){
  if(!document.body.classList.contains('battle-active')||!ensure())return;
  const shell=document.getElementById('battle-shell-'+teamId),host=arena();if(!shell||!host)return;
  const s=shell.getBoundingClientRect(),a=host.getBoundingClientRect();if(!s.width)return;
  const node=document.createElement('span');
  const label=options.label||(options.blocked||damage===0?'BLOCKED':(options.critical?'CRIT ':'')+'−'+Math.round(damage));
  node.className='arena-number'+(options.critical?' critical':'')+(options.blocked||damage===0?' blocked':'');
  node.textContent=label;node.style.setProperty('--fx-color',options.color||'#fff');
  node.style.left=(s.left-a.left+s.width*(.35+Math.random()*.3))+'px';node.style.top=(s.top-a.top+s.height*.28)+'px';
  layer.append(node);numbers.push(node);
  while(numbers.length>MAX_NUMBERS)numbers.shift().remove();
  const remove=()=>{node.remove();const i=numbers.indexOf(node);if(i>=0)numbers.splice(i,1);};
  if(reduced()||light()){setTimeout(remove,700);return;}
  const rise=options.critical?-70:-46;
  const motion=node.animate([{opacity:0,transform:'translate(-50%,0) scale(.6)',easing:'cubic-bezier(.2,.9,.3,1.3)'},{opacity:1,transform:`translate(-50%,${rise*.35}px) scale(${options.critical?1.35:1.1})`,offset:.2},{opacity:1,transform:`translate(-50%,${rise*.75}px) scale(1)`,offset:.7},{opacity:0,transform:`translate(-50%,${rise}px) scale(.95)`}],{duration:options.critical?1050:820,easing:'linear'});
  motion.addEventListener('finish',remove,{once:true});motion.addEventListener('cancel',remove,{once:true});
 }
 const priorityOf=text=>/wins the Final Arena/i.test(text)?4:/knocked out/i.test(text)?3:/Final Clash|Arena Surge/i.test(text)?2:1;
 function announce(text,color){
  if(!document.body.classList.contains('battle-active')||!ensure()||!text)return;
  const now=performance.now(),priority=priorityOf(text);
  // A signature move never pushes a knockout or the result off the screen early.
  if(now-lastCallout<1100&&priority<calloutPriority)return;
  lastCallout=now;calloutPriority=priority;
  callout.textContent=text;callout.style.setProperty('--fx-color',color||'#fde68a');
  callout.getAnimations?.().forEach(a=>a.cancel());
  if(reduced()||light()){callout.style.opacity='1';clearTimeout(callout._t);callout._t=setTimeout(()=>{callout.style.opacity='0';},1500);return;}
  callout.style.opacity='';
  callout.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.7)',letterSpacing:'.32em',easing:'cubic-bezier(.2,.9,.3,1.2)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.06)',letterSpacing:'.14em',offset:.18},{opacity:1,transform:'translate(-50%,-50%) scale(1)',letterSpacing:'.12em',offset:.8},{opacity:0,transform:'translate(-50%,-62%) scale(.98)',letterSpacing:'.12em'}],{duration:priority>=3?2100:1600,easing:'linear',fill:'both'});
 }
 function shake(strength=1){
  const host=document.getElementById('battle-fighters');
  if(!host||reduced()||light()||!document.body.classList.contains('battle-active'))return;
  const d=4*strength;
  host.animate([{transform:'translate(0,0)'},{transform:`translate(${-d}px,${d*.5}px)`},{transform:`translate(${d}px,${-d*.4}px)`},{transform:`translate(${-d*.5}px,${d*.25}px)`},{transform:'translate(0,0)'}],{duration:260,easing:'ease-out'});
 }
 function clear(){numbers.splice(0).forEach(n=>n.remove());layer?.remove();layer=dial=ring=digits=callout=null;length=30;lastCallout=0;calloutPriority=0;}
 function start(){
  new MutationObserver(()=>{
   if(document.body.classList.contains('battle-active')){ensure();watchClock();syncClock();}
   else if(layer)clear();
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 root.LeagueArenaFX=Object.freeze({impact,announce,shake,clear,diagnostics:()=>({numbers:numbers.length,layer:Boolean(layer?.isConnected)})});
})(window);
