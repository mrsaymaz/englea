/* Small bounded projectiles. Callers own effects budgets and gameplay clocks. */
(function(root){
 'use strict';
 const shapes={
  gryffindor:['<path d="M8 17Q32 12 44 27Q60 28 67 40Q58 58 37 56Q19 64 8 52L25 40Z"/>','<path d="M15 8Q75 14 69 45Q63 74 15 72Q53 52 45 39Q43 24 15 8Z"/>','<path d="M9 14L41 23 59 33 32 34ZM13 35L60 40 74 47 28 50ZM6 57L43 54 61 58 29 66Z"/>'],
  slytherin:['<path d="M8 40Q30 6 72 40Q29 73 8 40Z"/><path d="M14 40h50" stroke="#052e16" stroke-width="3"/>','<path d="M7 30L50 35 74 40 50 47 7 54 21 41Z"/>','<path d="M9 55Q43 77 59 42Q69 17 41 20Q16 23 28 43Q37 53 48 39" fill="none" stroke="currentColor" stroke-width="9"/><path d="M51 23l9-13 6 19Z"/>'],
  hufflepuff:['<path d="M12 10Q72 10 72 40Q70 68 12 70Q45 50 43 40Q44 24 12 10Z"/>','<path d="M10 29Q50 6 68 28M17 41Q53 22 64 41M24 53Q48 38 56 54M36 62l6 11 5-12" fill="none" stroke="currentColor" stroke-width="7"/>','<path d="M8 20h46l14 5-14 5H8ZM3 36h60l13 5-13 5H3ZM12 52h38l14 5-14 5H12Z"/>'],
  ravenclaw:['<path d="M12 40Q12 10 41 20L73 40 40 60Q12 70 12 40Z"/>','<path d="M6 60Q29 53 29 29Q39 4 61 21Q74 36 54 43L46 32Q40 51 75 60Z"/>','<circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" stroke-width="9"/><path d="M18 26Q42 11 60 36M20 49Q41 70 60 49" fill="none" stroke="#e0f2fe" stroke-width="3"/>']
 };
 function glyph(team,v){return `<svg viewBox="0 0 80 80" fill="currentColor" aria-hidden="true">${(shapes[team]||shapes.ravenclaw)[v%3]}</svg>`;}
 function flight({from,to,bounds,team,variant=0,duration=300,emit,large=false}){
  const r=from.getBoundingClientRect(),t=to.getBoundingClientRect(),a=bounds.getBoundingClientRect();
  const x=r.x+r.width/2-a.x,y=r.y+r.height/2-a.y,dx=t.x+t.width/2-a.x-x,dy=t.y+t.height/2-a.y-y,angle=Math.atan2(dy,dx)*180/Math.PI;
  const el=document.createElement('span');el.className=`combat-shot${large?' signature-shot':''}`;el.dataset.projectile=team;el.dataset.technique=ArenaTechniques.presets[team]?.attacks[variant]||'';el.dataset.variant=variant;el.style.left=x+'px';el.style.top=y+'px';el.style.color=ArenaTechniques.presets[team]?.color||'#c4b5fd';el.innerHTML=glyph(team,variant);
  const transform=(px,py)=>`translate(-50%,-50%) translate(${px}px,${py}px) rotate(${angle}deg)`;
  const animation=emit(el,[{opacity:0,transform:transform(0,0)},{opacity:1,offset:.08},{opacity:1,transform:transform(dx,dy),offset:duration/(duration+90)},{opacity:0,transform:transform(dx,dy)}],duration+90);
  return {el,animation,x:x+dx,y:y+dy,angle,team,variant};
 }
 function resolve(shot,outcome,emit){
  if(!shot)return;shot.animation?.cancel();shot.el.remove();
  if(outcome==='hit')return;
  const el=document.createElement('span');el.className='combat-resolution';el.dataset.outcome=outcome;el.style.left=shot.x+'px';el.style.top=shot.y+'px';el.style.color=shot.el.style.color;
  el.innerHTML=outcome==='blocked'?'<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="5"><path d="M24 30L8 13M56 30l16-17M24 50L8 68M56 50l16 18"/></svg>':glyph(shot.team,shot.variant);
  const start=`translate(-50%,-50%) rotate(${shot.angle}deg) scale(${outcome==='partial'?'.45':'.8'})`;
  const end=outcome==='evaded'?`translate(-50%,-50%) translate(${Math.cos(shot.angle*Math.PI/180)*85}px,${Math.sin(shot.angle*Math.PI/180)*85+40}px) rotate(${shot.angle+12}deg) scale(.65)`:`translate(-50%,-50%) rotate(${shot.angle}deg) scale(${outcome==='partial'?'.2':'1.3'})`;
  emit(el,[{opacity:1,transform:start},{opacity:0,transform:end}],outcome==='evaded'?300:240);
 }
 root.CombatProjectiles=Object.freeze({glyph,flight,resolve});
})(window);
