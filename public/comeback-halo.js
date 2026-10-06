/* v10.2.0 Comeback Halo. In a class's next session, every team that won neither the League title nor the Final
   Arena in that class's last session earns double points. The board shows it as a golden halo with "×2" above the
   team avatar's head. The halo follows the avatar: each of the 44 Animated evolution images and each Light avatar
   has its own head position, so the halo stays on the head as the creature evolves.
   The last result of each class is kept on this board and also comes from Google Sheets (Load islands), so a class
   that moves to another board keeps its halo. */
(function(root){
 'use strict';
 const KEY='englishLeague.lastResults.v1',TEAMS=['gryffindor','slytherin','hufflepuff','ravenclaw'],CLASSES=['5-A','5-C','6-C','7-A','8-B'];
 // Head of each Animated avatar image (levels 0–10), in % of the square image: [centre x, top of the head, halo width].
 const ANCHORS={
  gryffindor:[[36,13.5,34],[34,8.5,34],[37,8,32],[64,7,30],[65,7,30],[59,9.5,30],[67,9,30],[67,13,30],[68,10,30],[66,12.5,30],[65,14,28]],
  slytherin:[[40,6.5,28],[47,5.5,26],[51,6.5,26],[60,6,26],[60,7,26],[59,6,26],[61,6.5,28],[65,8,28],[55,7,26],[52,6.5,26],[52,8,26]],
  hufflepuff:[[53,14,36],[57,6.5,32],[54,6.5,30],[56,7,28],[65,12,26],[63,11,26],[65,9.5,28],[63,7,28],[62,10.5,28],[62,12.5,28],[65,15,26]],
  ravenclaw:[[71,7,26],[70,20.5,22],[72,17.5,22],[70,19,22],[71,13.5,22],[69,14,22],[67,12,24],[67,11.5,24],[68,12.5,24],[64,9.5,24],[60,9,24]]
 };
 // Light avatars (drawn on a 200 × 200 grid, head centred): the top of the head rises with some traits.
 const LIGHT={
  gryffindor:{x:50,y:15,w:36,traits:{mane_ice:5,mane_fire:7,crown_celestial:2.5}},
  slytherin:{x:50,y:25,w:32,traits:{hood_cobra:10,horns_dragon:21}},
  hufflepuff:{x:50,y:30,w:40,traits:{spikes_rock:15}},
  ravenclaw:{x:50,y:15,w:32,traits:{crown_stars:2.5}}
 };
 let store={},storageOK=true;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const [c,r] of Object.entries(saved||{})){const v=clean(r);if(CLASSES.includes(c)&&v)store[c]=v;}}catch{storageOK=false;}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(store));storageOK=true;}catch{storageOK=false;}}
 // A result: the session, when it ended (ms), the League title holder(s) and the Arena champion.
 function clean(r){
  if(!r||typeof r!=='object')return null;
  const sessionId=String(r.sessionId||'');if(!/^[A-Za-z0-9_-]{1,120}$/.test(sessionId))return null;
  const at=Number(r.at);if(!Number.isFinite(at)||at<0)return null;
  const league=Array.isArray(r.league)?TEAMS.filter(t=>r.league.includes(t)):[];
  const arena=TEAMS.includes(r.arena)?r.arena:null;
  if(!league.length&&!arena)return null;
  return {sessionId,at,league,arena};
 }
 function changed(c){document.dispatchEvent(new CustomEvent('league-halo-result',{detail:{className:c}}));}
 // The board finished a session for this class.
 function record(c,r){const v=clean(r);if(!CLASSES.includes(c)||!v)return false;store[c]=v;save();changed(c);return true;}
 // A result from Google Sheets (or passed on by the phone): kept unless this board already knows a later session.
 function accept(c,r){
  const v=clean(r),old=store[c];if(!CLASSES.includes(c)||!v)return false;
  if(old&&old.sessionId!==v.sessionId&&old.at>v.at)return false;
  if(old&&JSON.stringify(old)===JSON.stringify(v))return false;
  store[c]=v;save();changed(c);return true;
 }
 // Teams that won neither title in the class's last session (none for a first session, or if every team won).
 function teams(c,currentSessionId){
  const r=store[c];if(!r||r.sessionId===currentSessionId)return [];
  const winners=new Set([...r.league,r.arena].filter(Boolean));
  return TEAMS.filter(t=>!winners.has(t));
 }

 // ---- Drawing: one small SVG laid over the avatar. Its 100 × 100 grid matches the avatar picture exactly
 // (both are fitted and centred in the same box), so the head positions above are used as they are. ----
 const NS='http://www.w3.org/2000/svg',watched=new Map(),active=new Map();
 function anchorFor(mascot,team){
  const avatar=mascot.querySelector('.animated-avatar:not(.animated-previous)');
  if(avatar){const level=Math.max(0,Math.min(10,Math.floor(Number(avatar.dataset.avatarLevel)||0)));const [x,y,w]=ANCHORS[team.id][level];return {x,y,w};}
  if(!mascot.querySelector(':scope>svg:not(.halo-svg)'))return null;
  const light=LIGHT[team.id];let y=light.y;for(const trait of team.traits||[])if(light.traits[trait]!==undefined)y=Math.min(y,light.traits[trait]);
  return {x:light.x,y,w:light.w};
 }
 function build(teamId){
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('class','halo-svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('role','img');svg.setAttribute('aria-label','Comeback halo: double points this session');
  const g=`halo-gold-${teamId}`;
  // Drawn for a 30-wide halo centred on 0,0, then moved and scaled onto the head.
  svg.innerHTML=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b7791f"/><stop offset=".3" stop-color="#ffe9a3"/><stop offset=".55" stop-color="#f6c453"/><stop offset=".8" stop-color="#fff4c7"/><stop offset="1" stop-color="#b7791f"/></linearGradient></defs>`+
   `<g class="halo-place"><g class="halo-float">`+
   `<ellipse class="halo-glow" cx="0" cy="0" rx="15" ry="4.6" fill="none" stroke="#ffe08a" stroke-opacity=".38" stroke-width="3.4"/>`+
   `<ellipse class="halo-ring" cx="0" cy="0" rx="15" ry="4.6" fill="none" stroke="url(#${g})" stroke-width="1.9"/>`+
   `<ellipse class="halo-shine" cx="0" cy="-.5" rx="12.5" ry="3.4" fill="none" stroke="#fffbe8" stroke-opacity=".75" stroke-width=".55"/>`+
   `<g class="halo-badge"><rect x="-7" y="-4.6" width="14" height="9.2" rx="4.6" fill="#2a1a03" stroke="url(#${g})" stroke-width="1.1"/>`+
   `<text x="0" y="2.6" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="7.4" font-weight="900" fill="#ffe9a8">×2</text></g>`+
   `</g></g>`;
  return svg;
 }
 function place(svg,a){
  const s=a.w*1.12/30,ry=4.6*s,cy=a.y-1.2-ry; // a little wider than the head, readable from the back of the room
  svg.querySelector('.halo-place').setAttribute('transform',`translate(${a.x} ${cy.toFixed(2)}) scale(${s.toFixed(3)})`);
  // When the head is near the top of the picture, the avatar (and the halo with it) shrinks just enough, from the
  // feet, for the "×2" to stay inside the picture and clear of the team name.
  const top=cy-5.2*s;return top<1?Math.max(.85,99/(100-top)):1;
 }
 function room(mascot,k){const value=k<1?k.toFixed(3):'';if(mascot.style.getPropertyValue('--halo-k')!==value){if(value)mascot.style.setProperty('--halo-k',value);else mascot.style.removeProperty('--halo-k');}}
 function paint(team,on){
  const mascot=document.getElementById('mascot-'+team.id);if(!mascot)return;
  active.set(team.id,{team,on:Boolean(on)});
  let svg=mascot.querySelector(':scope>.halo-svg');
  mascot.closest('.team-container')?.classList.toggle('halo-active',Boolean(on));
  if(!on){svg?.remove();room(mascot,1);return;}
  watch(mascot,team.id);
  const a=anchorFor(mascot,team);if(!a){svg?.remove();room(mascot,1);return;}
  const key=`${a.x}|${a.y}|${a.w}`;
  if(!svg){svg=build(team.id);mascot.append(svg);}
  if(svg.dataset.key!==key){svg.dataset.room=String(place(svg,a));svg.dataset.key=key;}
  room(mascot,Number(svg.dataset.room)||1);
 }
 // The avatar is redrawn when the team evolves (and crossfades in Animated mode): put the halo back on the new head.
 function watch(mascot,teamId){
  if(watched.get(teamId)===mascot||typeof MutationObserver!=='function')return;
  watched.get(teamId)?._haloObserver?.disconnect();
  const observer=new MutationObserver(()=>{const s=active.get(teamId);if(s?.on)paint(s.team,true);});
  observer.observe(mascot,{childList:true,subtree:true,attributes:true,attributeFilter:['data-avatar-level']});
  mascot._haloObserver=observer;watched.set(teamId,mascot);
 }
 root.LeagueHalo=Object.freeze({record,accept,teams,paint,result:c=>store[c]?{...store[c],league:[...store[c].league]}:null,
  get storageOK(){return storageOK;},anchors:ANCHORS,light:LIGHT,clean});
})(window);
