/* Secret Agent: score-only transfers and teacher-private selection UI. */
(function(root){
 'use strict';
 const icon='<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M5 13h22M9 13l3-8 4 2 4-2 3 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="21" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="22" cy="21" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 20h2" stroke="currentColor" stroke-width="2.5"/></svg>';
 const fresh=()=>({assignments:{},request:null,reveal:null});
 function person(className,id){return LeagueStudents.teams.flatMap(t=>LeagueStudents.members(className,t)).find(p=>p.id===id);}
 function restore(className,saved){
  const state=fresh(),used=new Set();
  if(!LeagueStudents.validClass(className))return state;
  for(const teamId of LeagueStudents.teams){
   const a=saved?.assignments?.[teamId],p=person(className,a?.studentId);
   if(!p||p.teamId===teamId||used.has(p.id)||!['active','revealed'].includes(a.status))continue;
   state.assignments[teamId]={studentId:p.id,sourceTeam:p.teamId,status:a.status,blocked:Boolean(a.blocked),points:a.status==='revealed'&&Number.isFinite(a.points)?Math.max(0,a.points):0};used.add(p.id);
  }
  const r=saved?.request;
  if(r&&LeagueStudents.teams.includes(r.teamId)&&!state.assignments[r.teamId]&&typeof r.id==='string')state.request={teamId:r.teamId,id:r.id};
  const ids=Array.isArray(saved?.reveal?.teams)?saved.reveal.teams.filter(id=>state.assignments[id]?.status==='revealed'):[];
  if(ids?.length)state.reveal={teams:[...new Set(ids)],finish:Boolean(saved.reveal.finish)};
  return state;
 }
 function assign(state,className,teamId,studentId,requestId){
  if(state.request?.id!==requestId||state.request?.teamId!==teamId)return {ok:false,message:'This selection has expired. Open Secret Agent again.'};
  const p=person(className,studentId);
  if(!p||p.teamId===teamId)return {ok:false,message:'Choose a student from another team in this class.'};
  if(state.assignments[teamId]||Object.values(state.assignments).some(a=>a.studentId===studentId))return {ok:false,message:'This agent is already assigned.'};
  state.assignments[teamId]={studentId,sourceTeam:p.teamId,status:'active',points:0};state.request=null;
  return {ok:true};
 }
 function transfer(state,teamIds,teams,totals){
  const deltas=Object.fromEntries(teams.map(t=>[t.id,0])),revealed=[];
  for(const id of new Set(teamIds)){
   const a=state.assignments[id];if(a?.status!=='active')continue;
   const raw=totals[a.studentId]?.points,points=!a.blocked&&Number.isFinite(raw)?Math.max(0,raw):0;
   deltas[a.sourceTeam]-=points;deltas[id]+=points;
   a.status='revealed';a.points=points;revealed.push(id);
  }
  // Apply all deltas together. Negative balances are intentional, including after a reset.
  for(const team of teams)team.points+=deltas[team.id];
  return revealed;
 }
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 let dialog=null,cancel=null;
 function close(){if(dialog?.open)dialog.close();cancel=null;}
 function open(title,copy,onCancel){
  if(!dialog){dialog=node('dialog','agent-picker');dialog.id='agent-picker';dialog.setAttribute('aria-labelledby','agent-picker-title');document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();const cb=cancel;close();cb?.();});}
  dialog.replaceChildren();cancel=onCancel;
  const header=node('header','agent-picker-header'),heading=node('div','');
  const h=node('h2','',title);h.id='agent-picker-title';heading.append(h,node('p','',copy));
  const exit=node('button','agent-picker-close','×');exit.type='button';exit.setAttribute('aria-label','Close Secret Agent');exit.onclick=()=>{const cb=cancel;close();cb?.();};
  header.append(heading,exit);const body=node('div','agent-picker-body');dialog.append(header,body);return body;
 }
 function choose({className,team,teams,state,onSelect,onCancel}){
  const body=open(`${team.name} · Secret Agent`,'Private choice · select a student from another team.',onCancel);
  const used=new Set(Object.values(state.assignments).map(a=>a.studentId));
  for(const source of teams.filter(t=>t.id!==team.id)){
   const section=node('section','agent-pick-team');section.style.setProperty('--agent-color',source.color);
   section.append(node('h3','',source.name));const grid=node('div','agent-name-grid');
   for(const p of LeagueStudents.members(className,source.id)){
    const b=node('button','agent-name-choice',p.name);b.type='button';b.dataset.agentStudent=p.id;b.disabled=used.has(p.id);
    if(b.disabled){b.append(node('small','','Already assigned'));}
    b.onclick=()=>{close();onSelect(p);};grid.append(b);
   }section.append(grid);body.append(section);
  }
  if(!dialog.open)dialog.showModal();dialog.querySelector('.agent-picker-close').focus();
 }
 function details({className,team,assignment,onReveal}){
  const p=person(className,assignment.studentId),body=open(`${team.name} · Secret Agent`,'Teacher only · identity stays hidden on the board.');
  body.append(node('h3','agent-private-name',p?.name||''),node('p','',assignment.status==='active'?'Reveal now or wait until Finish Session.':`${assignment.points.toLocaleString()} points transferred. This power-up is complete.`));
  if(assignment.blocked)body.append(node('p','agent-blocked-note','Shield intercepted this agent when selected. No points will transfer. This team’s Secret Agent attempt has been used.'));
  if(assignment.status==='active'){const b=node('button','agent-primary','Reveal Agent');b.type='button';b.id='agent-reveal-now';b.onclick=()=>{close();onReveal();};body.append(b);}
  if(!dialog.open)dialog.showModal();dialog.querySelector('.agent-picker-close').focus();
 }
 function mount(onContinue,onRemoteContinue){
  const overlay=node('div','agent-reveal-overlay');overlay.id='agent-reveal-overlay';overlay.setAttribute('aria-hidden','true');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','agent-reveal-title');
  const panel=node('div','agent-reveal-panel'),badge=node('div','agent-reveal-icon');badge.innerHTML=icon;
  const title=node('h2','','Secret Agent Revealed');title.id='agent-reveal-title';const cards=node('div','agent-reveal-cards');cards.id='agent-reveal-cards';
  const next=node('button','agent-primary','Continue');next.type='button';next.id='agent-continue';next.onclick=onContinue;
  panel.append(badge,title,cards,node('p','agent-reveal-note','Team scores change. Levels and participation stay earned.'),next);overlay.append(panel);document.body.append(overlay);
  const remote=node('div','agent-remote-reveal');remote.id='agent-remote-reveal';remote.hidden=true;
  remote.append(node('h2','','Secret Agent Revealed'),node('p','','The full transfer is complete. Continue when the class is ready.'));
  const b=node('button','agent-primary mobile-remote-action','Continue');b.id='agent-remote-continue';b.type='button';b.onclick=onRemoteContinue;remote.append(b);document.getElementById('mobile-controller').append(remote);
 }
 function renderReveal(state,className,teams,avatar){
  const cards=document.getElementById('agent-reveal-cards');cards.replaceChildren();
  cards.closest('.agent-reveal-panel').classList.toggle('many-agents',(state.reveal?.teams.length||0)>2);
  for(const id of state.reveal?.teams||[]){
   const a=state.assignments[id],p=person(className,a.studentId),source=teams.find(t=>t.id===a.sourceTeam),target=teams.find(t=>t.id===id);
   const card=node('section','agent-reveal-card');card.style.setProperty('--agent-color',target.color);
   card.append(node('h3','agent-reveal-name',p.name));
   const route=node('div','agent-transfer-route');
   const teamBadge=t=>{const badge=node('div','agent-team-badge');if(avatar){const art=node('div','agent-team-avatar');art.setAttribute('aria-hidden','true');art.innerHTML=avatar(t);badge.append(art);}badge.append(node('span','',t.name));return badge;};
   route.append(teamBadge(source),node('span','agent-trail','••• →'),teamBadge(target));
   card.append(route,node('strong','agent-transfer-points',a.blocked?'Shield protected this team · 0 points transferred':`${a.points.toLocaleString()} points transferred`));cards.append(card);
  }
 }
 root.LeagueAgent={icon,fresh,restore,assign,transfer,person,choose,details,close,mount,renderReveal};
})(window);
