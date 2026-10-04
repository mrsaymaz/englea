(function(root){
 'use strict';
 const KEY='englishLeague.access.v1',GRANT='englishLeague.accessTab.v1',SIX_HOURS=21600000;
 let granted=false,busy=false,form,input,message,submit;
 function read(){const s=JSON.parse(localStorage.getItem(KEY)||'{}');return {failures:Number.isInteger(s.failures)?Math.max(0,Math.min(3,s.failures)):0,lockedUntil:Number.isFinite(s.lockedUntil)?s.lockedUntil:0};}
 const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
 function show(text){message.textContent=text;}
 function grant(now){write({failures:0,lockedUntil:0});sessionStorage.setItem(GRANT,String(now+SIX_HOURS));allowView();}
 function allowView(){granted=true;document.documentElement.classList.remove('access-locked');document.getElementById('access-screen').hidden=true;input.value='';document.getElementById('start-host-btn')?.focus();}
 async function request(code){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch('/api/access-time',{method:code===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',headers:code===undefined?{}:{'Content-Type':'application/json'},body:code===undefined?undefined:JSON.stringify({code}),signal:controller.signal});if(!response.ok)throw Error('time');const data=await response.json();if(!Number.isFinite(data.serverNow)||(code!==undefined&&!['normal','master','invalid'].includes(data.kind)))throw Error('time');return data;}finally{clearTimeout(timer);}
 }
 async function verify(code){
  const data=await request(code),now=data.serverNow;
  let s=read();
  if(data.kind==='master'){grant(now);return;}
  if(s.lockedUntil>now){show('Access is locked for six hours after three incorrect attempts. An unlock code can still be entered.');return;}
  if(s.lockedUntil){s={failures:0,lockedUntil:0};write(s);}
  if(data.kind==='normal'){grant(now);return;}
  s.failures++;
  if(s.failures>=3){s.lockedUntil=now+SIX_HOURS;sessionStorage.removeItem(GRANT);}
  write(s);show(s.lockedUntil?'Three incorrect attempts. Access is locked for six hours. An unlock code can still be entered.':`Incorrect code. ${3-s.failures} ${3-s.failures===1?'attempt':'attempts'} remaining.`);
 }
 document.addEventListener('DOMContentLoaded',async()=>{
  form=document.getElementById('access-form');input=document.getElementById('access-code');message=document.getElementById('access-message');submit=document.getElementById('access-submit');
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;busy=true;submit.disabled=true;
   const code=input.value.trim();show('Checking access…');
   try{if(navigator.locks)await navigator.locks.request(KEY,()=>verify(code));else await verify(code);}
   catch{show('Unable to verify access. Check your connection and browser storage, then try again. This attempt was not counted if time verification failed.');}
   finally{busy=false;submit.disabled=false;input.value='';if(!granted)input.focus();}
  });
  try{
   const {serverNow}=await request();const s=read();
   if(s.lockedUntil>serverNow)show('Access is locked for six hours after three incorrect attempts. An unlock code can still be entered.');
   else if(Number(sessionStorage.getItem(GRANT))>serverNow)allowView();
   else show('Enter your four-digit access code.');
  }catch{show('Connect to the internet to verify access.');}
  submit.disabled=false;if(!granted)input.focus();
 });
 addEventListener('storage',e=>{if(e.key===KEY){try{if(read().lockedUntil){granted=false;sessionStorage.removeItem(GRANT);document.documentElement.classList.add('access-locked');document.getElementById('access-screen').hidden=false;show('Access is locked. Enter an unlock code or wait for the lock to expire.');if(root.LeagueScenes?.active)root.LeagueScenes.pause();}}catch{}}});
 root.LeagueAccess=Object.freeze({get granted(){return granted;}});
})(window);
