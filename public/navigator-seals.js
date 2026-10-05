/* v9.7.0 · Island Run navigator seals.
   One student navigates the champion team's Island Run for the whole session. Every island that student's runs
   complete (not practice) earns them that island's seal. Seals are kept on this device and in Google Sheets
   (the Navigator_Seals tab), are loaded with "Load islands", and appear on the student's award card. */
(function(root){
 'use strict';
 const KEY='englishLeague.navigatorSeals.v1',classes=['5-A','5-C','6-C','7-A','8-B'],teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 const bosses=['veyr','tickthorn','mirrath','rootmaw','vox','kaelis','morrow','noctryn','ferron','astrax'];
 const names=['Veyr','Tickthorn','Mirrath','Rootmaw','Vox','Kaelis','Morrow','Noctryn','Ferron','Astrax'];
 const idOk=id=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,100}$/.test(id);
 const sessionOk=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{0,120}$/.test(s);
 function clean(raw){
  const out={};
  for(const c of classes){
   const cls=raw?.[c];if(!cls||typeof cls!=='object')continue;
   for(const [id,v] of Object.entries(cls)){
    if(!idOk(id)||!v||typeof v!=='object'||!teams.includes(v.team))continue;
    const islands={};for(const [n,s] of Object.entries(v.islands||{}))if(/^(10|[1-9])$/.test(n))islands[n]=sessionOk(s)?s:'';
    if(Object.keys(islands).length)(out[c]??={})[id]={student:String(v.student||'').slice(0,70),team:v.team,islands};
   }
  }
  return out;
 }
 let store={};try{store=clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{store={};}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch{}};
 const changed=c=>document.dispatchEvent(new CustomEvent('navigator-seals-change',{detail:{className:c}}));
 function islands(c,id){return Object.keys(store[c]?.[id]?.islands||{}).map(Number).sort((a,b)=>a-b);}
 function add(c,row){
  const island=Number(row?.island);
  if(!classes.includes(c)||!idOk(row?.studentId)||!teams.includes(row?.team)||!Number.isInteger(island)||island<1||island>10)return false;
  const entry=(store[c]??={})[row.studentId]??={student:'',team:row.team,islands:{}};
  if(typeof row.student==='string'&&row.student.trim())entry.student=row.student.trim().slice(0,70);
  entry.team=row.team;
  if(entry.islands[island]!==undefined)return false;
  entry.islands[island]=sessionOk(row.sessionId)?row.sessionId:'';return true;
 }
 // Rows from Google Sheets or the other device. Only adds; a seal is never taken away.
 function merge(c,rows){
  if(!Array.isArray(rows))return false;let any=false;
  for(const row of rows.slice(0,1000))if(add(c,row))any=true;
  if(any){save();changed(c);}return any;
 }
 function rows(c){
  return Object.entries(store[c]||{}).flatMap(([studentId,v])=>Object.entries(v.islands).map(([n,sessionId])=>({studentId,student:v.student,team:v.team,island:Number(n),sessionId})))
   .sort((a,b)=>a.studentId.localeCompare(b.studentId)||a.island-b.island);
 }
 const stamp=c=>rows(c).map(r=>r.studentId+':'+r.island).join(',');
 // A finished (non-practice) run of this session's navigator.
 function award(c,student,island,sessionId){
  if(!student||!idOk(student.id))return {ok:false,added:false,count:0};
  const added=add(c,{studentId:student.id,student:student.name,team:student.team,island,sessionId});
  const count=islands(c,student.id).length;
  if(added){save();changed(c);queue.push({name:entryName(c,student),team:student.team,island:Number(island),count});announceSoon();}
  return {ok:true,added,count,name:entryName(c,student)};
 }
 const entryName=(c,student)=>store[c]?.[student.id]?.student||student.name||'';

 // The seal is earned while Island Run is open; it is announced once the class is back on the board.
 const queue=[];let waiting=0;
 const teamNames={gryffindor:'Gryffindor',hufflepuff:'Hufflepuff',slytherin:'Slytherin',ravenclaw:'Ravenclaw'};
 function announceSoon(){if(!waiting)waiting=setInterval(()=>{if(document.body.classList.contains('island-run-active'))return;clearInterval(waiting);waiting=0;announce();},400);}
 function announce(){
  const item=queue.shift();if(!item)return;
  let box=document.getElementById('passport-seal-toast');
  if(!box){box=document.createElement('div');box.id='passport-seal-toast';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.append(box);}
  box.innerHTML='';const img=new Image();img.alt='';img.src=emblem(item.island);
  const copy=document.createElement('div'),eyebrow=document.createElement('small'),title=document.createElement('strong'),line=document.createElement('span');
  eyebrow.textContent='Navigator seal earned';title.textContent=`${item.name} · Island ${item.island}`;line.textContent=`${teamNames[item.team]} · ${names[item.island-1]} defeated · ${item.count} of 10 seals`;
  copy.append(eyebrow,title,line);box.append(img,copy);box.style.setProperty('--seal-team',`var(--league-${item.team})`);
  box.classList.remove('visible');void box.offsetWidth;box.classList.add('visible');
  setTimeout(()=>{box.classList.remove('visible');setTimeout(announce,500);},5200);
 }
 const emblem=n=>`island-runner/assets/bosses/${bosses[n-1]}.webp`;
 root.LeagueNavigatorSeals=Object.freeze({islands,award,merge,rows,stamp,emblem,guardian:n=>names[n-1]||''});
})(window);
