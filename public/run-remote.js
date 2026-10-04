/* v9.3.0 teacher remote: the More sheet and the Island Run panel. Commands travel through the existing receipts. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  let send=()=>false,state={open:false,ready:false,options:{listening:true,pictures:false},navigator:'',audio:false},connected=false,lastFocus=null;
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
    if(name){name.textContent=state.navigator||(state.ready?'Starts with the first question':'Waiting for the board');name.classList.toggle('empty',!state.navigator);}
    const nextButton=$('mobile-run-next');if(nextButton)nextButton.disabled=!connected||!state.navigator;
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
    $('mobile-more-btn')?.addEventListener('click',openSheet);
    $('mobile-more-close')?.addEventListener('click',closeSheet);
    $('mobile-more-sheet')?.addEventListener('click',event=>{if(event.target.id==='mobile-more-sheet')closeSheet();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSheet();});
    // Manage and the visual modes close the sheet so their own dialogs are not hidden behind it.
    for(const button of document.querySelectorAll('#mobile-more-sheet [data-closes-sheet]'))button.addEventListener('click',closeSheet);
    for(const button of document.querySelectorAll('[data-run-option]'))button.addEventListener('click',()=>toggle(button.dataset.runOption));
    $('mobile-run-next')?.addEventListener('click',()=>{if(connected)send('RUN_NAVIGATOR',{});});
    $('mobile-run-repeat')?.addEventListener('click',()=>{if(connected)send('RUN_REPEAT',{});});
    render(null,false);
  }
  root.LeagueRunRemote=Object.freeze({configure,render,openSheet,closeSheet});
})(window);
