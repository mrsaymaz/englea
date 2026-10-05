/* v10.0 · School League Season.
   Every class at the school plays in one season. A team wins once for each League title (a shared title gives
   each tied team one win) and once for each Final Arena; a Grand Champion therefore wins twice. The totals come
   from Google Sheets (Load islands and every save), counting every session already in the Sheet. On the
   Champions screen the panel adds this session's wins, marked "saving" until the Sheet has them. */
(function(root){
 'use strict';
 const KEY='englishLeague.season.v1',teams=['gryffindor','slytherin','hufflepuff','ravenclaw'];
 const names={gryffindor:'Gryffindor',slytherin:'Slytherin',hufflepuff:'Hufflepuff',ravenclaw:'Ravenclaw'};
 const colors={gryffindor:'#fb7185',slytherin:'#34d399',hufflepuff:'#fbbf24',ravenclaw:'#38bdf8'};
 let season=null,getSession=()=>null,outdatedScript=false;
 function clean(raw){
  if(!raw||typeof raw!=='object'||!raw.wins||typeof raw.wins!=='object')return null;
  const wins={};for(const t of teams){const n=Number(raw.wins[t]);if(!Number.isInteger(n)||n<0||n>1000000)return null;wins[t]=n;}
  const sessions=Number.isInteger(raw.sessions)&&raw.sessions>=0?raw.sessions:0;
  const classes=Array.isArray(raw.classes)?raw.classes.filter(c=>typeof c==='string'&&c.length<=20).slice(0,40):[];
  const recent=Array.isArray(raw.recent)?raw.recent.filter(s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(s)).slice(-1000):[];
  return {wins,sessions,classes,recent,at:Number(raw.at)||Date.now()};
 }
 try{season=clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{season=null;}
 // Totals passed on from the other device carry the time they were loaded; an older copy never replaces a newer one.
 function accept(raw){
  const next=clean(raw);if(!next)return false;
  if(season&&Number.isFinite(Number(raw.at))&&next.at<season.at)return false;
  const same=season&&JSON.stringify({...season,at:0})===JSON.stringify({...next,at:0});
  season=next;outdatedScript=false;try{localStorage.setItem(KEY,JSON.stringify(season));}catch{}
  render();if(!same)document.dispatchEvent(new CustomEvent('league-season-change'));return true;
 }
 // This session's wins: one per League title holder, one for the Arena champion.
 function sessionWins(s){
  const out=Object.fromEntries(teams.map(t=>[t,0]));if(!s)return out;
  for(const t of new Set(s.league||[]))if(teams.includes(t))out[t]++;
  if(teams.includes(s.arena))out[s.arena]++;
  return out;
 }
 function standings(){
  const s=getSession(),add=sessionWins(s),saved=Boolean(s&&season?.recent.includes(s.sessionId));
  const rows=teams.map(t=>({team:t,wins:(season?.wins[t]||0)+(saved?0:add[t]),delta:add[t]}));
  rows.sort((a,b)=>b.wins-a.wins||teams.indexOf(a.team)-teams.indexOf(b.team));
  let rank=0,last=null;rows.forEach((r,i)=>{if(r.wins!==last)rank=i+1;last=r.wins;r.rank=rank;});
  return {rows,saved,known:Boolean(season),session:s};
 }
 function panel(){
  const host=document.getElementById('winner-overlay');if(!host)return null;
  let el=document.getElementById('league-season-panel');
  if(!el){
   el=document.createElement('aside');el.id='league-season-panel';el.setAttribute('aria-label','School League Season');
   el.innerHTML='<div class="season-head"><small>SCHOOL LEAGUE</small><strong>Season Wins</strong></div><ol class="season-rows"></ol><p class="season-foot"></p>';
   host.append(el);
  }
  return el;
 }
 function render(){
  const el=panel();if(!el)return;
  const state=standings();
  el.hidden=!state.session;if(!state.session)return;
  const list=el.querySelector('.season-rows');
  list.replaceChildren(...state.rows.map(r=>{
   const li=document.createElement('li');li.className='season-row'+(r.rank===1&&r.wins>0?' leader':'');
   const rank=document.createElement('span');rank.className='season-rank';rank.textContent=String(r.rank);
   const team=document.createElement('span');team.className='season-team';const dot=document.createElement('i');dot.style.setProperty('--team',colors[r.team]);team.append(dot,names[r.team]);
   const wins=document.createElement('b');wins.className='season-wins';wins.textContent=String(r.wins);
   const delta=document.createElement('span');delta.className='season-delta'+(state.saved?'':' pending');delta.textContent=r.delta?`+${r.delta}`:'';
   if(r.delta)delta.title=state.saved?'This session · saved':'This session · saving to Google Sheets';
   li.append(rank,team,wins,delta);li.setAttribute('aria-label',`${names[r.team]}: ${r.wins} season wins${r.delta?`, ${r.delta} today`:''}`);return li;
  }));
  const foot=el.querySelector('.season-foot');
  foot.textContent=!state.known?(outdatedScript?'Update Apps Script to v10.0.0 to count the whole school’s season.':'Load islands to add the whole school’s season.'):
   `${season.sessions} session${season.sessions===1?'':'s'} · ${season.classes.length?season.classes.join(', '):'all classes'}${state.saved?'':' · today’s wins are saved with Save Record'}`;
 }
 // Load islands answered without a season: the Sheet still runs an older script.
 function outdated(){if(!season){outdatedScript=true;render();document.dispatchEvent(new CustomEvent('league-season-outdated'));}}
 function configure(options){if(typeof options?.session==='function')getSession=options.session;render();}
 document.addEventListener('league-scene-change',()=>render());
 root.LeagueSeason=Object.freeze({configure,accept,outdated,render,standings,sessionWins,get data(){return season?JSON.parse(JSON.stringify(season)):null;},get loadedAt(){return season?season.at:0;},get outdatedScript(){return outdatedScript;}});
})(window);
