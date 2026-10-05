/* v10.1.0: one Teacher PIN, typed once beside the room code, signs the teacher in to Google Sheets after Allow on
   the board: the roster (student names), then the class's islands, seals, season, questions and answer log. Save
   Record, Manage and Studio reuse it. The PIN exists only in this page's memory, never in storage. */
(function(root){
 'use strict';
 let pin='',state='none',text='',hideTimer=null,ready=()=>false,remote=()=>false,dialog=null;
 const $=id=>document.getElementById(id);
 const labels={pending:'Teacher PIN ready · signs in after Allow',checking:'Signing in to Google Sheets…'};
 function render(){
  const bar=$('mobile-teacher-status');
  if(bar){clearTimeout(hideTimer);bar.textContent=text;bar.dataset.state=state;bar.hidden=state==='none';
   if(state==='ok')hideTimer=setTimeout(()=>{bar.hidden=true;},7000);}
  const button=$('mobile-teacher-btn');if(button)button.textContent=state==='ok'?'Teacher signed in ✓':'Teacher sign-in';
 }
 function set(next,message){state=next;text=message||labels[next]||'';render();document.dispatchEvent(new CustomEvent('teacher-signin-change',{detail:{state}}));}
 function start(value){pin=String(value||'').trim().slice(0,100);set(pin?'pending':'none');if(pin&&ready())signIn();}
 async function signIn(){
  if(!pin||state==='checking')return;const used=pin;set('checking');
  const result=await (root.LeagueRoster?.signIn?.(used)??Promise.resolve({ok:false,message:'Roster unavailable.'}));
  if(pin!==used)return;
  if(result.unauthorized){pin='';set('error','Teacher PIN not accepted · tap to try again');root.LeagueIslandProgress?.signIn?.('');return;}
  if(!result.ok){set('offline',result.message+' Tap to try again.');root.LeagueIslandProgress?.signIn?.(used);return;}
  set('ok','✓ Signed in · student names loaded');root.LeagueIslandProgress?.signIn?.(used);
 }
 // Another PIN prompt (Load islands, Studio, Save Record) succeeded: that PIN signs the teacher in too.
 function accepted(value,detail){
  value=String(value||'').trim();if(!value)return;const fresh=state!=='ok';pin=value;
  if(fresh&&remote())root.LeagueRoster?.signIn?.(value);
  if(detail==='islands')set('ok','✓ Signed in · names, islands, seals and season loaded');
  else if(state!=='ok')set('ok','✓ Teacher signed in');
 }
 function ask(){
  if(!dialog){dialog=document.createElement('dialog');dialog.id='teacher-signin-dialog';
   dialog.innerHTML='<form method="dialog"><h2>Teacher sign-in</h2><p>Your Google Sheets Teacher PIN loads student names, islands, seals and the season, and is used for Save Record, Manage and Studio.</p><label>Teacher PIN<input id="teacher-signin-pin" type="password" inputmode="numeric" autocomplete="off" maxlength="100" required></label><div><button type="button" id="teacher-signin-cancel">Cancel</button><button type="submit">Sign in</button></div></form>';
   document.body.append(dialog);
   dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const input=$('teacher-signin-pin'),value=input.value.trim();input.value='';if(!value)return;dialog.close();start(value);});
   $('teacher-signin-cancel').onclick=()=>dialog.close();}
  if(!dialog.open)dialog.showModal();$('teacher-signin-pin').focus();
 }
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='teacher-pin-startup'){e.preventDefault();root.startControllerMode?.();}});
 document.addEventListener('click',e=>{const bar=e.target.closest?.('#mobile-teacher-status');if(bar&&state!=='checking')ask();});
 root.LeagueTeacher={get pin(){return pin;},get state(){return state;},get waiting(){return state==='pending'||state==='checking';},
  configure(options){ready=options.ready||ready;remote=options.remote||remote;render();},start,signIn,accepted,ask,
  connected(){if(state==='pending')signIn();}};
})(window);
