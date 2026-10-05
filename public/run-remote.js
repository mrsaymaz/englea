/* v9.3.0 teacher remote: the More sheet and the Island Run panel. Commands travel through the existing receipts.
   v9.7.0: a large student controller pops up when a run starts. A Bluetooth keyboard paired with this phone steers
   the runner too (↑ ↓ change lanes, → or Space jumps), so a student can play from their seat without seeing the
   teacher's screen. Steering travels as light messages (sendRunControl in game.js), not confirmed commands. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  let send=()=>false,control=()=>false,state={open:false,ready:false,options:{listening:true,pictures:false},navigator:'',audio:false},connected=false,lastFocus=null;
  let wasRunning=false,padClosedByTeacher=false,wakeLock=null;
  const running=()=>Boolean(state.open&&state.ready&&state.canPause);
  // Keep the phone awake while Island Run is open, so a student's keyboard keeps working with the screen untouched.
  async function keepAwake(on){
    try{
      if(on&&!wakeLock&&navigator.wakeLock&&document.visibilityState==='visible'){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener?.('release',()=>{wakeLock=null;});}
      else if(!on&&wakeLock){const lock=wakeLock;wakeLock=null;await lock.release();}
    }catch{wakeLock=null;}
  }
  function openPad(){const pad=$('mobile-run-pad');if(!pad||!state.open)return;padClosedByTeacher=false;
    if(pad.hidden){lastFocus=document.activeElement;pad.hidden=false;document.body.classList.add('run-pad-open');
      // Take focus away from any field, so the keyboard's arrows always reach the runner.
      if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur?.();pad.focus?.({preventScroll:true});}
    renderPad();keepAwake(true);}
  function closePad(byTeacher=false){const pad=$('mobile-run-pad');if(!pad||pad.hidden)return;pad.hidden=true;document.body.classList.remove('run-pad-open');if(byTeacher)padClosedByTeacher=true;(lastFocus||$('mobile-run-pad-open'))?.focus?.({preventScroll:true});}
  function renderPad(){
    const name=$('mobile-run-pad-navigator');if(name)name.textContent=state.navigator?`Navigator · ${state.navigator}`:'Island Run';
    const status=$('mobile-run-pad-status');
    if(status)status.textContent=!connected?'Reconnecting to the board…':!state.open?'Island Run is closed on the board':!state.ready?'Island Run is opening…':state.paused?'Paused on the board':running()?'Run in progress · steer with the buttons or the keyboard':'Choose an island on the board';
    for(const button of document.querySelectorAll('[data-run-control]'))button.disabled=!connected||!running()||state.paused;
  }
  function flash(action){const button=document.querySelector(`[data-run-control="${action}"]`);if(!button)return;button.classList.add('pressed');clearTimeout(button._t);button._t=setTimeout(()=>button.classList.remove('pressed'),150);}
  function steer(action){if(!connected||!running()||state.paused)return false;const sent=control(action)!==false;if(sent)flash(action);return sent;}
  function switches(){
    for(const button of document.querySelectorAll('[data-run-option]')){
      const on=Boolean(state.options?.[button.dataset.runOption]);
      button.setAttribute('aria-checked',on?'true':'false');button.disabled=!connected;
      const label=button.querySelector('.remote-switch-state');if(label)label.textContent=on?'On':'Off';
    }
  }
  function render(next,isConnected){
    if(next&&typeof next==='object')state={...state,...next,options:{...state.options,...(next.options||{})}};
    connected=Boolean(isConnected);
    const controller=$('mobile-controller'),panel=$('mobile-run-panel');
    const inRun=Boolean(state.open);
    controller?.classList.toggle('remote-island-run',inRun);
    if(panel)panel.hidden=!inRun;
    const name=$('mobile-run-navigator');
    if(name){name.textContent=state.navigator||(state.ready?'No team list for this class':'Waiting for the board');name.classList.toggle('empty',!state.navigator);}
    const padButton=$('mobile-run-pad-open');if(padButton)padButton.disabled=!connected||!state.open;
    // The controller pops up each time a run starts, unless the teacher closed it during this run.
    const now=running();
    if(now&&!wasRunning&&connected&&!padClosedByTeacher)openPad();
    if(!now&&wasRunning)padClosedByTeacher=false;
    wasRunning=now;
    if(!inRun){closePad();keepAwake(false);}else keepAwake(true);
    renderPad();
    const repeat=$('mobile-run-repeat');if(repeat)repeat.disabled=!connected||!state.audio||!state.options.listening;
    const voiceNote=$('mobile-run-voice');
    if(voiceNote)voiceNote.textContent=!state.voice?'':state.voice==='none'?'Board voice: no English voice installed. Listening words appear as text.':state.voice==='unsupported'?'Board voice: this browser cannot speak.':'Board voice: '+state.voice;
    switches();
  }
  function toggle(option){
    if(!connected)return;
    const value=!state.options[option];
    if(send('RUN_OPTIONS',{options:{[option]:value}})!==false){state.options={...state.options,[option]:value};switches();}
  }
  function openSheet(){const sheet=$('mobile-more-sheet');if(!sheet)return;lastFocus=document.activeElement;sheet.hidden=false;$('mobile-more-btn')?.setAttribute('aria-expanded','true');sheet.querySelector('button')?.focus();}
  function closeSheet(){const sheet=$('mobile-more-sheet');if(!sheet||sheet.hidden)return;sheet.hidden=true;$('mobile-more-btn')?.setAttribute('aria-expanded','false');(lastFocus||$('mobile-more-btn'))?.focus?.();}
  function configure(adapter){
    send=typeof adapter?.send==='function'?adapter.send:send;
    control=typeof adapter?.control==='function'?adapter.control:control;
    $('mobile-run-pad-open')?.addEventListener('click',openPad);
    $('mobile-run-pad-close')?.addEventListener('click',()=>closePad(true));
    for(const button of document.querySelectorAll('[data-run-control]'))
      button.addEventListener('pointerdown',event=>{event.preventDefault();steer(button.dataset.runControl);});
    for(const button of document.querySelectorAll('[data-run-control]'))
      button.addEventListener('click',event=>{if(event.detail===0)steer(button.dataset.runControl);});
    // Bluetooth keyboard: arrow keys and Space steer whenever Island Run is open, even with the pad closed.
    document.addEventListener('keydown',event=>{
      if(!state.open||!connected)return;
      const target=event.target,padOpen=$('mobile-run-pad')?.hidden===false;
      // Typing into a visible field on the teacher screen is left alone; a hidden field that kept focus is not typing.
      const typing=(['INPUT','TEXTAREA','SELECT'].includes(target?.tagName)||target?.isContentEditable)&&target.getClientRects?.().length>0&&!target.closest?.('dialog:not([open]),[hidden]');
      if((typing&&!padOpen)||event.ctrlKey||event.metaKey||event.altKey)return;
      const action={ArrowUp:'up',ArrowDown:'down',ArrowRight:'jump',' ':'jump',Spacebar:'jump'}[event.key];
      if(!action)return;
      event.preventDefault();event.stopPropagation();
      if(event.repeat&&action!=='jump')return;
      steer(action);
    },true);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.open)keepAwake(true);});
    $('mobile-more-btn')?.addEventListener('click',openSheet);
    $('mobile-more-close')?.addEventListener('click',closeSheet);
    $('mobile-more-sheet')?.addEventListener('click',event=>{if(event.target.id==='mobile-more-sheet')closeSheet();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSheet();});
    // Manage and the visual modes close the sheet so their own dialogs are not hidden behind it.
    for(const button of document.querySelectorAll('#mobile-more-sheet [data-closes-sheet]'))button.addEventListener('click',closeSheet);
    for(const button of document.querySelectorAll('[data-run-option]'))button.addEventListener('click',()=>toggle(button.dataset.runOption));
    $('mobile-run-repeat')?.addEventListener('click',()=>{if(connected)send('RUN_REPEAT',{});});
    render(null,false);
  }
  root.LeagueRunRemote=Object.freeze({configure,render,openSheet,closeSheet,openPad,closePad,steer});
})(window);
