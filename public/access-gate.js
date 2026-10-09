/* v12.0.0 · Teacher access. The server decides everything: the time code, the lockouts and the session (an HttpOnly
   cookie this page cannot read). A device that has never signed in also needs the Teacher PIN once; it is then
   trusted for 180 days. Nothing about access is kept in this browser's storage. */
(function(root){
 'use strict';
 let granted=false,busy=false,expiresAt=0,challenge='',expiryTimer=null,form,input,pinRow,pinInput,message,submit,back;
 const show=text=>{message.textContent=text;};
 const at=ms=>new Date(ms).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 const nativeFetch=root.fetch.bind(root);
 async function request(method,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await nativeFetch('/api/access-time',{method,cache:'no-store',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
   const data=await response.json();
   if(!Number.isFinite(data.serverNow))throw Error(data.error||'access');
   return data;
  }finally{clearTimeout(timer);}
 }
 function setStep(step){
  const pin=step==='pin';
  pinRow.hidden=!pin;back.hidden=!pin;input.closest('.access-code-row').hidden=pin;
  submit.textContent=pin?'Sign in this device':'Enter classroom';
  if(!pin){challenge='';pinInput.value='';}
  (pin?pinInput:input).focus();
 }
 function allowView(until){
  granted=true;expiresAt=until||0;challenge='';
  document.documentElement.classList.remove('access-locked');document.getElementById('access-screen').hidden=true;
  input.value='';pinInput.value='';
  clearTimeout(expiryTimer);if(expiresAt)expiryTimer=setTimeout(()=>lock('Your session has ended. Enter the access code to continue.'),Math.max(1000,Math.min(2147483000,expiresAt-Date.now())));
  document.dispatchEvent(new CustomEvent('league-access-change',{detail:{granted:true}}));
  document.getElementById('start-host-btn')?.focus();
 }
 // The lesson underneath stays as it is; only the screen is covered until the code is entered again.
 function lock(text){
  if(!form)return;
  const wasGranted=granted;granted=false;clearTimeout(expiryTimer);
  document.documentElement.classList.add('access-locked');document.getElementById('access-screen').hidden=false;
  setStep('code');show(text||'Enter your four-digit access code.');
  if(wasGranted&&root.LeagueScenes?.active)root.LeagueScenes.pause();
  document.dispatchEvent(new CustomEvent('league-access-change',{detail:{granted:false}}));
 }
 function respond(data){
  if(data.kind==='granted'){allowView(data.expiresAt);return;}
  if(data.kind==='pin'){challenge=data.challenge;setStep('pin');show('First time on this device: enter your Teacher PIN. This device is then remembered for 180 days.');return;}
  if(data.kind==='expired'){setStep('code');show('That step took too long. Enter the current access code again.');return;}
  if(data.kind==='invalid'){show(`Incorrect code. ${data.remaining} ${data.remaining===1?'attempt':'attempts'} remaining.`);return;}
  if(data.kind==='pin-invalid'){show(`Incorrect Teacher PIN. ${data.remaining} ${data.remaining===1?'attempt':'attempts'} remaining.`);return;}
  if(data.kind==='locked'){
   if(data.scope==='network'){setStep('code');show(`Too many attempts from new devices on this network. Try again after ${at(data.until)}, or use a board or phone that has signed in before.`);return;}
   if(data.scope==='pin'){setStep('code');show(`Too many wrong Teacher PINs. This device can try again after ${at(data.until)}.`);return;}
   show(data.unlock?'Access is locked for six hours after three incorrect attempts. An unlock code can still be entered.':`Access on this device is locked until ${at(data.until)}.`);return;
  }
  show(data.message||'Unable to verify access. Try again.');
 }
 async function submitForm(e){
  e.preventDefault();if(busy)return;
  const pinStep=Boolean(challenge);
  const value=(pinStep?pinInput:input).value.trim();
  if(!value){(pinStep?pinInput:input).focus();return;}
  busy=true;submit.disabled=true;show(pinStep?'Checking the Teacher PIN with Google Sheets…':'Checking access…');
  try{respond(await request('POST',pinStep?{challenge,pin:value}:{code:value}));}
  catch{show('Unable to verify access. Check your connection, then try again. This attempt was not counted.');}
  finally{busy=false;submit.disabled=false;input.value='';pinInput.value='';if(!granted)(challenge?pinInput:input).focus();}
 }
 // A request that finds the session gone (it ended, or the device was signed out) brings the access screen back.
 root.fetch=async(resource,init)=>{
  const response=await nativeFetch(resource,init);
  try{
   const url=new URL(typeof resource==='string'?resource:resource?.url||'',location.href);
   if(response.status===401&&url.origin===location.origin&&url.pathname.startsWith('/api/')&&url.pathname!=='/api/access-time'&&granted)lock('Your session has ended. Enter the access code to continue.');
  }catch{}
  return response;
 };
 document.addEventListener('DOMContentLoaded',async()=>{
  form=document.getElementById('access-form');input=document.getElementById('access-code');message=document.getElementById('access-message');submit=document.getElementById('access-submit');
  pinRow=document.getElementById('access-pin-row');pinInput=document.getElementById('access-pin');back=document.getElementById('access-back');
  form.addEventListener('submit',submitForm);
  back.addEventListener('click',()=>{setStep('code');show('Enter your four-digit access code.');});
  try{
   const data=await request('GET');
   if(data.session?.active)allowView(data.session.expiresAt);
   else show(data.device?.trusted?'Enter your four-digit access code.':'Enter your four-digit access code. A new device also needs the Teacher PIN once.');
  }catch{show('Connect to the internet to verify access.');}
  submit.disabled=false;if(!granted)input.focus();
 });
 root.LeagueAccess=Object.freeze({
  get granted(){return granted;},get expiresAt(){return expiresAt;},lock,
  async signOut({forget=false}={}){try{await nativeFetch('/api/access-time'+(forget?'?forget=1':''),{method:'DELETE',credentials:'same-origin',cache:'no-store'});}catch{}lock(forget?'This device was signed out and forgotten.':'Signed out. Enter the access code to continue.');}
 });
})(window);
