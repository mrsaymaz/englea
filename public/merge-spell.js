/* v11.0.0 · The Merge Spell (Act III). Gilded Vixar casts the Edict of Separation; the class answers by joining together.
   Old rivals answer English questions in turn until their creatures fuse: Gryffindor + Slytherin become Slyffindor,
   Hufflepuff + Ravenclaw become Huffleclaw.
   - Fixed turn order: Gryffindor, Hufflepuff, Slytherin, Ravenclaw, then again. Each pair needs 4 correct answers,
     2 from each house; a house that has given its 2 (or whose pair has fused) is passed over.
   - A wrong answer fills nothing and passes the turn to the partner house, which gets a new question: the partner can
     rescue the pair, so a miss is never the end. (A missed rescue goes back to the fixed order.)
   - The ritual circle is the saga's only timer: 120 s for the whole spell, shared by the class, shown as a draining
     ring with no seconds. If it empties first, Vixar shatters the spell once: one second casting of 60 s for any pair
     not yet fused (a fused pair stays fused). If that runs out too, the unfused pair fights on as two teams.
   - The phone suggests the student with the fewest contributions; Mr. Saymaz can change them. A student answers at
     most once per spell while their house has others left.
   The engine has no clock of its own: game.js passes the time and owns the scene's timers. */
(function(root){
 'use strict';
 const ORDER=Object.freeze(['gryffindor','hufflepuff','slytherin','ravenclaw']);
 const PAIRS=Object.freeze({
  slyffindor:Object.freeze({id:'slyffindor',name:'Slyffindor',houses:Object.freeze(['gryffindor','slytherin']),elements:'fire + nature',colors:Object.freeze(['#f97316','#22c55e'])}),
  huffleclaw:Object.freeze({id:'huffleclaw',name:'Huffleclaw',houses:Object.freeze(['hufflepuff','ravenclaw']),elements:'air + water',colors:Object.freeze(['#facc15','#38bdf8'])})
 });
 const NAMES=Object.freeze({gryffindor:'Gryffindor',slytherin:'Slytherin',hufflepuff:'Hufflepuff',ravenclaw:'Ravenclaw'});
 const NEEDED=2;
 const pairOf=house=>house==='gryffindor'||house==='slytherin'?'slyffindor':'huffleclaw';
 const partner=house=>({gryffindor:'slytherin',slytherin:'gryffindor',hufflepuff:'ravenclaw',ravenclaw:'hufflepuff'})[house];
 function create({now=0,circleMs=120000,secondMs=60000}={}){
  return {casting:1,circleMs,secondMs,startedAt:now,endsAt:now+circleMs,done:false,success:false,shattered:false,
   pairs:{slyffindor:{merged:false,mergedAt:0,correct:{gryffindor:0,slytherin:0}},huffleclaw:{merged:false,mergedAt:0,correct:{hufflepuff:0,ravenclaw:0}}},
   pointer:-1,turn:null,turns:0,answered:[],log:[]};
 }
 const needs=(s,house)=>!s.pairs[pairOf(house)].merged&&s.pairs[pairOf(house)].correct[house]<NEEDED;
 const meter=(s,pair)=>Object.values(s.pairs[pair].correct).reduce((a,b)=>a+b,0);
 function finish(s,success){s.done=true;s.success=success;s.turn=null;return null;}
 function nextRegular(s){
  for(let k=1;k<=ORDER.length;k++){const i=(s.pointer+k)%ORDER.length,house=ORDER[i];if(needs(s,house)){s.pointer=i;s.turn={house,rescue:false,n:++s.turns};return house;}}
  return finish(s,Object.values(s.pairs).every(p=>p.merged));
 }
 function start(s){return s.done?null:nextRegular(s);}
 // One answer for the current turn. Returns what happened, for the board's motion and the phone.
 function answer(s,ok,{studentId='',student='',at=0}={}){
  if(s.done||!s.turn)return {ok:false};
  const {house,rescue}=s.turn,pair=pairOf(house);
  if(studentId&&!s.answered.includes(studentId))s.answered.push(studentId);
  s.log.push({house,studentId,student,ok:Boolean(ok),at,casting:s.casting,rescue});
  let fused=null,rescueBy=null;
  if(ok){
   s.pairs[pair].correct[house]+=1;
   if(meter(s,pair)>=NEEDED*2){s.pairs[pair].merged=true;s.pairs[pair].mergedAt=at;fused=pair;}
   if(Object.values(s.pairs).every(p=>p.merged)){finish(s,true);return {ok:true,correct:true,fused,next:null,done:true};}
   return {ok:true,correct:true,fused,next:nextRegular(s),done:s.done};
  }
  const p=partner(house);
  if(!rescue&&needs(s,p)){s.turn={house:p,rescue:true,n:++s.turns};rescueBy=p;return {ok:true,correct:false,rescueBy,next:p,done:false};}
  return {ok:true,correct:false,next:nextRegular(s),done:s.done};
 }
 // The circle has emptied: Vixar shatters the spell once (one second casting for the unfused pairs), then it ends.
 function expire(s,now=0){
  if(s.done)return {done:true,success:s.success};
  if(Object.values(s.pairs).every(p=>p.merged)){finish(s,true);return {done:true,success:true};}
  if(s.casting===1){s.casting=2;s.shattered=true;s.endsAt=now+s.secondMs;s.turn=null;s.pointer=-1;nextRegular(s);return {done:s.done,second:true,success:s.success};}
  finish(s,false);return {done:true,success:false};
 }
 const remaining=(s,now)=>Math.max(0,s.endsAt-now);
 function shift(s,delta){if(s&&!s.done&&Number.isFinite(delta))s.endsAt+=delta;}
 const result=s=>({merged:Object.keys(PAIRS).filter(p=>s.pairs[p].merged),unmerged:Object.keys(PAIRS).filter(p=>!s.pairs[p].merged)});
 // The suggested student: the first in "Next to invite" order (fewest contributions first) who has not answered in
 // this spell; once everyone in the house has answered, anyone may answer again.
 function suggest(s,ordered){const fresh=ordered.filter(p=>!s.answered.includes(p.id));return (fresh[0]||ordered[0])||null;}
 function choices(s,ordered){const fresh=ordered.filter(p=>!s.answered.includes(p.id));return (fresh.length?fresh:ordered).map(p=>({id:p.id,name:p.name,awards:p.awards||0}));}

 // ---- Board view: built once per spell, then updated in place. Only transforms, opacity and one ring animate. ----
 const el=(tag,cls,text)=>{const n=root.document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 let board=null;
 function mount(host,{avatar,fusedArt,onChoose}={}){
  unmount();if(!host)return null;
  const wrap=el('section','merge-spell');wrap.id='merge-spell';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-label','The Merge Spell');
  wrap.innerHTML='<header class="merge-head"><small>The Edict of Separation</small><h2>The Merge Spell</h2><p>Answer together. Two right answers from each house fuse the pair.</p></header>';
  const stage=el('div','merge-stage');
  for(const [id,pair] of Object.entries(PAIRS)){
   const side=el('div',`merge-pair merge-${id}`);side.dataset.pair=id;side.style.setProperty('--merge-a',pair.colors[0]);side.style.setProperty('--merge-b',pair.colors[1]);
   const creatures=el('div','merge-creatures');
   pair.houses.forEach((house,i)=>{const c=el('div',`merge-creature merge-creature-${i}`);c.dataset.house=house;c.innerHTML=avatar?.(house)||'';creatures.append(c);});
   const orbit=el('div','merge-orbit');orbit.append(el('i','merge-orb merge-orb-a'),el('i','merge-orb merge-orb-b'));creatures.append(orbit);
   const url=fusedArt?.(id);
   if(url){const img=new root.Image();img.className='merge-fused-art';img.alt=pair.name;img.decoding='async';img.onload=()=>side.classList.add('has-fused-art');img.onerror=()=>img.remove();img.src=url;creatures.append(img);}
   const meterEl=el('div','merge-meter');meterEl.setAttribute('role','meter');meterEl.setAttribute('aria-valuemin','0');meterEl.setAttribute('aria-valuemax','4');meterEl.setAttribute('aria-label',pair.name+' merge meter');
   for(let i=0;i<4;i++)meterEl.append(el('i','merge-step'));
   const label=el('p','merge-name');pair.houses.forEach((h,i)=>{label.append(el('span',`merge-house merge-house-${i}`,NAMES[h]));if(!i)label.append(' + ');});
   const fusedName=el('strong','merge-fused-name');fusedName.append(el('span','merge-fused-a',pair.name.slice(0,Math.ceil(pair.name.length/2))),el('span','merge-fused-b',pair.name.slice(Math.ceil(pair.name.length/2))));
   side.append(creatures,meterEl,label,fusedName);stage.append(side);
  }
  const ring=el('div','merge-circle');ring.setAttribute('role','img');ring.setAttribute('aria-label','Ritual circle');
  ring.innerHTML='<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="merge-circle-track" cx="60" cy="60" r="52"/><circle class="merge-circle-ring" cx="60" cy="60" r="52" pathLength="100"/><path class="merge-circle-rune" d="M60 18 71 48 102 48 77 66 86 96 60 78 34 96 43 66 18 48 49 48Z"/></svg><span class="merge-circle-note"></span>';
  stage.insertBefore(ring,stage.children[1]);
  const turn=el('div','merge-turn');turn.setAttribute('aria-live','polite');
  const card=el('div','merge-card');card.hidden=true;
  wrap.append(stage,turn,card);host.append(wrap);
  board={wrap,stage,ring,turn,card,onChoose,casting:0,cardId:null};
  return wrap;
 }
 function unmount(){board?.drain?.cancel();board?.wrap?.remove();board=null;}
 // view: {casting, remainingMs, totalMs, pairs:{id:{meter,merged}}, turn:{house,rescue,student,n}, card:{id,type,icon,prompt,context,instruction,options}, outcome, message, shattered, done}
 function update(view){
  if(!board||!view)return;const {wrap,ring,turn,card}=board;
  wrap.dataset.casting=String(view.casting);wrap.classList.toggle('merge-done',Boolean(view.done));
  for(const [id,p] of Object.entries(view.pairs||{})){
   const side=wrap.querySelector(`.merge-${id}`);if(!side)continue;
   side.style.setProperty('--merge-progress',String(p.meter));side.dataset.meter=String(p.meter);
   side.querySelectorAll('.merge-step').forEach((s,i)=>s.classList.toggle('on',i<p.meter));
   side.querySelector('.merge-meter').setAttribute('aria-valuenow',String(p.meter));
   if(p.merged&&!side.classList.contains('fused')){side.classList.add('fused');}
   side.classList.toggle('active',Boolean(view.turn&&pairOf(view.turn.house)===id));
  }
  // The ring drains by itself: one animation per casting, started only when a casting starts (a paused scene pauses it).
  if(board.casting!==view.casting&&!view.done){
   board.casting=view.casting;const r=ring.querySelector('.merge-circle-ring'),from=Math.max(0,Math.min(100,100-100*view.remainingMs/view.totalMs));
   board.drain?.cancel();r.style.strokeDashoffset=String(from);
   if(typeof r.animate==='function')board.drain=r.animate([{strokeDashoffset:from},{strokeDashoffset:100}],{duration:Math.max(1,view.remainingMs),fill:'forwards',easing:'linear'});
  }
  if(view.done){board.drain?.pause();}
  ring.classList.toggle('second',view.casting===2);
  ring.querySelector('.merge-circle-note').textContent=view.done?(view.success?'Fused':'The spell has ended'):view.casting===2?'Second casting':'';
  turn.replaceChildren();
  if(view.turn&&!view.done){
   turn.style.setProperty('--merge-house',`var(--league-${view.turn.house})`);
   turn.append(el('small','',view.turn.rescue?`${NAMES[view.turn.house]} can rescue the pair!`:`${NAMES[view.turn.house]}'s turn`),el('strong','',view.turn.student||NAMES[view.turn.house]));
  }else if(view.message)turn.append(el('strong','',view.message));
  renderCard(card,view);
 }
 function renderCard(host,view){
  const k=view.card;
  if(!k||view.done){host.hidden=true;host.replaceChildren();board.cardId=null;return;}
  if(board.cardId===k.id&&host.dataset.outcome===(view.outcome||''))return;
  board.cardId=k.id;host.dataset.outcome=view.outcome||'';host.hidden=false;host.replaceChildren();
  host.append(el('p','merge-card-type',`${k.icon||'✦'} ${k.type}`));
  if(k.context)host.append(el('p','merge-card-context',k.context));
  host.append(el('p','merge-card-prompt',k.type==='Ask a Question'?`Answer: ${k.prompt}`:k.prompt),el('p','merge-card-instruction',k.instruction||''));
  const list=el('div','merge-card-options');
  k.options.forEach((text,i)=>{const b=el('button','merge-option');b.type='button';b.append(el('b','','ABC'[i]),el('span','',text));
   if(view.outcome){b.disabled=true;if(i===view.answer)b.classList.add('right');else if(i===view.chosen)b.classList.add('wrong');}
   else b.onclick=()=>board?.onChoose?.(k.id,i);list.append(b);});
  host.append(list);
  if(view.outcome)host.append(el('p',`merge-card-result ${view.outcome}`,view.outcome==='right'?'✓ Right!':`✗ Not this time${view.answerText?` — the answer is “${view.answerText}”`:''}`));
 }
 function flash(pair){
  if(!board)return;const side=board.wrap.querySelector(`.merge-${pair}`);if(!side)return;
  side.classList.remove('fusing');void side.offsetWidth;side.classList.add('fusing');
 }
 function shatter(){if(!board)return;board.ring.classList.remove('shatter');void board.ring.offsetWidth;board.ring.classList.add('shatter');}

 // ---- Phone view: the teacher's panel (student, change student, options to tap, meters, circle) ----
 function renderRemote(host,view,send){
  if(!host)return;host.hidden=!view;host.replaceChildren();if(!view)return;
  const add=(tag,cls,text)=>{const n=el(tag,cls,text);host.append(n);return n;};
  add('p','saga-remote-kicker','The Merge Spell'+(view.casting===2?' · second casting':''));
  const meters=add('div','saga-remote-meters');
  for(const [id,p] of Object.entries(view.pairs||{})){const m=el('div','saga-remote-meter'+(p.merged?' fused':''));m.append(el('span','',PAIRS[id].name),el('b','',p.merged?'Fused ✓':`${p.meter} / 4`));meters.append(m);}
  const circle=add('div','saga-remote-circle');const fill=el('i');fill.style.width=`${Math.round(100*Math.max(0,view.remainingMs)/Math.max(1,view.totalMs))}%`;circle.append(fill);circle.setAttribute('aria-label','Ritual circle');
  if(view.done){add('p','saga-remote-note',view.success?'Both pairs fused. The fight goes on.':view.message||'The spell has ended. The fight goes on.');return;}
  if(!view.turn)return;
  add('p','saga-remote-turn',view.turn.rescue?`${NAMES[view.turn.house]} can rescue the pair`:`${NAMES[view.turn.house]}'s turn`);
  const who=add('div','saga-remote-student');who.append(el('strong','',view.turn.student||'Choose a student'));
  const change=el('button','saga-remote-btn ghost','Change student');change.type='button';who.append(change);
  const list=add('div','saga-remote-students');list.hidden=true;
  change.onclick=()=>{list.hidden=!list.hidden;};
  for(const p of view.students||[]){const b=el('button','saga-remote-btn option',`${p.name}${p.awards?` · ${p.awards}`:''}`);b.type='button';if(p.id===view.turn.studentId)b.classList.add('selected');b.onclick=()=>send('MERGE_STUDENT',{studentId:p.id,turn:view.turn.n});list.append(b);}
  const k=view.card;if(!k)return;
  add('p','saga-remote-card',`${k.icon||'✦'} ${k.type}`);
  if(k.context)add('p','saga-remote-note',k.context);
  add('p','saga-remote-prompt',k.type==='Ask a Question'?`Answer: ${k.prompt}`:k.prompt);
  k.options.forEach((text,i)=>{const b=el('button','saga-remote-btn option',`${'ABC'[i]}) ${text}`);b.type='button';
   if(view.outcome){b.disabled=true;if(i===view.answer)b.classList.add('right');else if(i===view.chosen)b.classList.add('wrong');}
   else b.onclick=()=>send('MERGE_CHOOSE',{card:k.id,index:i});host.append(b);});
 }
 const api={ORDER,PAIRS,NAMES,NEEDED,pairOf,partner,create,start,answer,expire,remaining,shift,result,needs,meter,suggest,choices,mount,unmount,update,flash,shatter,renderRemote,get mounted(){return Boolean(board);}};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LeagueMergeSpell=api;
})(typeof globalThis!=='undefined'?globalThis:this);
