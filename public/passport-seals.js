/* v9.4.0: Island Run passport seals on the board cards and the remote.
   A seal appears only after a successful (non-practice) run has stamped the team's passport;
   the progress itself still lives in LeagueIslandProgress, so this module only reads it. */
(function(root){
 'use strict';
 const teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 const bosses=['veyr','tickthorn','mirrath','rootmaw','vox','kaelis','morrow','noctryn','ferron','astrax'];
 const names=['Veyr','Tickthorn','Mirrath','Rootmaw','Vox','Kaelis','Morrow','Noctryn','Ferron','Astrax'];
 let getClass=()=>null,seen=new Map(),runPending=false;
 function sealsFor(className,team){
  const levels=root.LeagueIslandProgress?.snapshot(className)?.[className+'|'+team]||{};
  return Object.keys(levels).map(Number).filter(n=>n>=1&&n<=10).sort((a,b)=>a-b).map(n=>({island:n,stars:levels[n].stars||1}));
 }
 function chip(team){
  const card=document.querySelector('#team-'+team+' .mascot-area');if(!card)return null;
  let el=document.getElementById('passport-seals-'+team);
  if(!el){
   el=document.createElement('div');el.id='passport-seals-'+team;el.className='passport-seals';el.setAttribute('role','img');
   el.innerHTML='<span class="passport-seal-emblem"><img alt="" decoding="async"></span><span class="passport-seal-count"><b></b><small>seals</small></span>';
   card.append(el);
  }
  return el;
 }
 function remoteChip(team){
  const header=document.getElementById('mobile-score-'+team)?.closest('.mobile-team-card')?.querySelector('.mobile-team-header');if(!header)return null;
  let el=document.getElementById('mobile-passport-seals-'+team);
  if(!el){el=document.createElement('span');el.id='mobile-passport-seals-'+team;el.className='mobile-passport-seals';header.querySelector('.mobile-team-name')?.after(el);}
  return el;
 }
 function render(){
  const c=getClass(),valid=Boolean(c&&root.LeagueIslandProgress?.valid(c));
  for(const team of teams){
   const seals=valid?sealsFor(c,team):[],latest=seals[seals.length-1],key=c+'|'+team,count=seals.length;
   const label=count?`${count} of 10 Island Run seals. Latest: island ${latest.island}, ${names[latest.island-1]}.`:'No Island Run seals yet';
   const el=chip(team);
   if(el){
    el.hidden=!count;el.setAttribute('aria-label',label);el.title=label;
    if(count){
     const img=el.querySelector('img'),src=`island-runner/assets/bosses/${bosses[latest.island-1]}.webp`;
     if(img.getAttribute('src')!==src)img.setAttribute('src',src);
     el.querySelector('b').textContent=count;el.style.setProperty('--seal-stars',latest.stars);
    }
    // Celebrate only a seal that arrives while this class is on screen, never the first paint.
    const before=seen.get(key);
    if(before!==undefined&&count>before&&runPending){el.classList.add('new-seal');queue.push({team,island:latest.island,count});announceSoon();}
    seen.set(key,count);
   }
   const mobile=remoteChip(team);
   if(mobile){mobile.hidden=!count;mobile.textContent=count?`✦ ${count}`:'';mobile.title=label;mobile.setAttribute('aria-label',label);}
  }
  runPending=false;
 }
 // The seal is stamped while Island Run is still open; announce it once the class is back on the board.
 const queue=[];let waiting=0;
 const teamNames={gryffindor:'Gryffindor',hufflepuff:'Hufflepuff',slytherin:'Slytherin',ravenclaw:'Ravenclaw'};
 function announceSoon(){if(!waiting)waiting=setInterval(()=>{if(document.body.classList.contains('island-run-active'))return;clearInterval(waiting);waiting=0;announce();},400);}
 function announce(){
  const item=queue.shift();if(!item)return;
  let box=document.getElementById('passport-seal-toast');
  if(!box){box=document.createElement('div');box.id='passport-seal-toast';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.append(box);}
  box.innerHTML='';const img=new Image();img.alt='';img.src=`island-runner/assets/bosses/${bosses[item.island-1]}.webp`;
  const copy=document.createElement('div'),eyebrow=document.createElement('small'),title=document.createElement('strong'),line=document.createElement('span');
  eyebrow.textContent='Passport seal added';title.textContent=`${teamNames[item.team]} · Island ${item.island}`;line.textContent=`${names[item.island-1]} defeated · ${item.count} of 10 seals`;
  copy.append(eyebrow,title,line);box.append(img,copy);box.style.setProperty('--seal-team',`var(--league-${item.team})`);
  box.classList.remove('visible');void box.offsetWidth;box.classList.add('visible');
  const chipEl=document.getElementById('passport-seals-'+item.team);if(chipEl){chipEl.classList.remove('fresh');void chipEl.offsetWidth;chipEl.classList.add('fresh');setTimeout(()=>chipEl.classList.remove('fresh'),2600);}
  setTimeout(()=>{box.classList.remove('visible');setTimeout(announce,500);},5200);
 }
 function configure(options){if(options?.getClass)getClass=options.getClass;render();}
 document.addEventListener('island-progress-change',()=>render());
 // Island Run calls this just before it merges a finished run, so cloud loads never look like new seals.
 root.LeaguePassportSeals=Object.freeze({configure,render,sealsFor,fromRun(){runPending=true;setTimeout(()=>{runPending=false;},0);}});
})(window);
