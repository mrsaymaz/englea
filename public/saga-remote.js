/* v11.0.0 · The phone's Vixar Saga panel (More controls) and the live saga controls.
   - Stage line, readiness line ("Level 11: 3 of 4 teams · Class Mission ✓"), Open the Rift (a 1.5-second hold; a short
     tap does nothing), Close the Rift, Replay the Finale, and Set stage (Manage, PIN) for corrections.
   - Earned stages are saved automatically: whenever the board's copy of the class's row changes, the phone queues it in
     the Sheets outbox (Vixar_Saga tab) and sends it with the Teacher sign-in. Offline, it waits and is sent later.
   - The class's row, Finale data and speech lines loaded from Google Sheets at sign-in are passed on to the board.
   - During Act III the panel shows the Merge Spell (student, change student, the card's options); during the Finale,
     Continue and the optional English voice. */
(function(root){
 'use strict';
 const $=id=>document.getElementById(id);
 const SAVED_KEY='englishLeague.sagaSaved.v1',HOLD_MS=1500;
 let view=null,ctx=null,holdTimer=0,setOpen=false,sentFor='',voice=false;
 let saved={};try{saved=JSON.parse(localStorage.getItem(SAVED_KEY)||'{}')||{};}catch{saved={};}
 const remember=()=>{try{localStorage.setItem(SAVED_KEY,JSON.stringify(saved));}catch{}};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const signedIn=()=>root.LeagueTeacher?.state==='ok';
 const command=(action,extra={})=>ctx?.command?.(action,extra);

 // ---- Saving the class's row (Vixar_Saga) ----
 function entryId(c){return 'saga:'+c;}
 function queueSave(state){
  if(!state?.row?.updatedAt||!root.LeagueOutbox)return;
  const c=state.className;if(saved[c]===state.stamp)return;
  try{root.LeagueOutbox.add(entryId(c),{type:'SAGA_SAVE',className:c,sessionId:ctx?.sessionId||'',saga:state.row,mergeLog:state.mergeLog||[],stamp:state.stamp},{refresh:true});}catch{return;}
  flush(c);
 }
 async function flush(c){
  const pin=root.LeagueTeacher?.pin;if(!pin||!root.LeagueOutbox)return;
  const entry=root.LeagueOutbox.find(entryId(c));if(!entry||entry.state!=='waiting')return;
  const stamp=entry.payload.stamp;
  const done=await root.LeagueOutbox.send(entry,pin);
  if(done?.state==='sent'){saved[c]=stamp;remember();render();}
 }
 document.addEventListener('teacher-signin-change',e=>{if(e.detail?.state==='ok')for(const entry of root.LeagueOutbox?.list()||[])if(entry.payload?.type==='SAGA_SAVE')flush(entry.payload.className);render();});
 addEventListener('online',()=>{for(const entry of root.LeagueOutbox?.list()||[])if(entry.payload?.type==='SAGA_SAVE')flush(entry.payload.className);});

 // ---- Rows, Finale data and lines from Google Sheets go to the board ----
 const loaded=new Map();
 document.addEventListener('league-saga-loaded',e=>{
  const d=e.detail||{};if(!root.LeagueSaga?.validClass(d.className))return;
  if(d.saga)root.LeagueSaga.accept(d.className,d.saga);
  if(d.extras)root.LeagueSaga.acceptExtras(d.className,{...d.extras,at:Date.now()});
  if(d.lines?.lines?.length)root.LeagueSaga.acceptLines(d.lines.grade,d.lines.lines,d.lines.at);
  loaded.set(d.className,true);sentFor='';pass(d.className);render();
 });
 function pass(c){
  if(!ctx?.send||!ctx.sessionId||!root.LeagueSaga?.validClass(c))return;
  const grade=Number(c[0]),key=ctx.sessionId+'|'+c+'|'+root.LeagueSaga.stamp(root.LeagueSaga.get(c))+'|'+root.LeagueSaga.linesStamp(grade);
  if(sentFor===key)return;sentFor=key;
  ctx.send({type:'SAGA_DATA',sessionId:ctx.sessionId,className:c,row:root.LeagueSaga.get(c),extras:root.LeagueSaga.extras(c),
   lines:{grade,lines:root.LeagueSaga.lines(grade),at:JSON.parse(root.LeagueSaga.linesStamp(grade)||'null')?.at||0}});
 }

 // ---- The board's view arrives with every state sync ----
 function sync(state,context){
  ctx=context;view=state;
  if(state?.row){root.LeagueSaga?.accept(state.className,state.row);queueSave(state);}
  if(state?.className&&(loaded.get(state.className)||root.LeagueSaga?.get(state.className)?.updatedAt))pass(state.className);
  render();renderLive();
 }

 // ---- More controls: the Vixar Saga panel ----
 function render(){
  const host=$('mobile-saga-panel');if(!host)return;host.replaceChildren();
  host.append(el('h3','','Vixar Saga'));
  const v=view;
  if(!v){host.append(el('p','saga-remote-note','Choose the class on the board to see its saga.'));return;}
  const row=v.row,forms={Violet:'Violet Vixar',Scarlet:'Scarlet Vixar',Gilded:'Gilded Vixar',Freed:'Freed · the curse is broken'};
  const line=el('p','saga-stage-line');line.dataset.stage=v.stage;
  line.append(el('strong','',`${v.className} · ${forms[v.stage]}`),el('span','',v.stage==='Freed'?'':` · attempt ${row.attempts+1}`));host.append(line);
  const status=el('p','saga-remote-note');
  status.textContent=signedIn()?(saved[v.className]===v.stamp||!row.updatedAt?'Saved in Google Sheets':'Saving to Google Sheets…'):'Offline · the board’s saved copy. Teacher sign-in saves it to Google Sheets.';
  host.append(status);
  if(v.stage!=='Freed'&&v.readiness?.level){
   const r=v.readiness,ready=el('p','saga-readiness'+(r.complete?' complete':''));
   ready.textContent=`Level ${r.level}: ${r.ready} of 4 teams · Class Mission ${r.mission?'✓':'not yet'}`;host.append(ready);
  }
  const actions=el('div','saga-remote-actions');host.append(actions);
  if(v.stage==='Freed'){
   const replay=el('button','saga-remote-btn','Replay the Finale');replay.type='button';replay.disabled=Boolean(v.fighting||v.finale);replay.onclick=()=>command('FINALE_REPLAY');actions.append(replay);
  }else if(v.fought){
   actions.append(el('p','saga-remote-note',`${v.className} has fought today · open the Rift in a later session.`));
  }else if(v.riftOpen){
   const rift=el('p','saga-rift-state open',v.fighting?'The Rift is open · the fight is on':'The Rift is open for this session');actions.append(rift);
   if(!v.fighting){const close=el('button','saga-remote-btn ghost','Close the Rift');close.type='button';close.onclick=()=>command('RIFT_CLOSE');actions.append(close);}
   if(v.progressionMode==='hard'&&!v.fighting){
    const tip=el('div','saga-tip');tip.append(el('span','',`Hard mode rarely fits a raid day: every team needs Level ${v.readiness?.level||10} this lesson.`));
    const soft=el('button','saga-remote-btn ghost','Switch to Soft');soft.type='button';soft.onclick=()=>command('SET_PROGRESSION',{mode:'soft'});tip.append(soft);actions.append(tip);
   }
  }else actions.append(holdButton());
  const set=el('button','saga-remote-btn ghost small','Set stage (Manage, PIN)');set.type='button';set.onclick=()=>{setOpen=!setOpen;render();};actions.append(set);
  if(setOpen)host.append(setForm(v));
 }
 // Open the Rift: a 1.5-second hold. A short tap does nothing.
 function holdButton(){
  const b=el('button','saga-remote-btn saga-hold');b.type='button';b.append(el('span','saga-hold-fill'),el('span','saga-hold-label','Hold to open the Rift'));
  b.setAttribute('aria-label','Open the Rift for this session: press and hold for one and a half seconds');
  const start=e=>{if(e.type==='keydown'&&(e.repeat||![' ','Enter'].includes(e.key)))return;e.preventDefault();cancel();b.classList.add('holding');
   holdTimer=setTimeout(()=>{holdTimer=0;b.classList.remove('holding');b.classList.add('opened');command('RIFT_OPEN');},HOLD_MS);};
  const cancel=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=0;}b.classList.remove('holding');};
  b.addEventListener('pointerdown',start);b.addEventListener('keydown',start);
  for(const name of ['pointerup','pointerleave','pointercancel','keyup','blur'])b.addEventListener(name,cancel);
  b.addEventListener('click',e=>e.preventDefault());b.addEventListener('contextmenu',e=>e.preventDefault());
  return b;
 }
 function setForm(v){
  const form=el('form','saga-set-form');
  const select=el('select');for(const s of ['Violet','Scarlet','Gilded','Freed']){const o=el('option','',s);o.value=s;if(s===v.stage)o.selected=true;select.append(o);}
  const pin=el('input');pin.type='password';pin.inputMode='numeric';pin.autocomplete='off';pin.placeholder='Teacher PIN';pin.value=root.LeagueTeacher?.pin||'';
  const go=el('button','saga-remote-btn','Set stage');go.type='submit';const msg=el('p','saga-remote-note','Fixes a misclick or a test run in the wrong class. Logged in Google Sheets.');
  const label=el('label','','Stage');label.append(select);
  form.append(label,pin,go,msg);
  form.onsubmit=async e=>{e.preventDefault();const stage=select.value,p=pin.value.trim();if(!p){msg.textContent='Enter your Teacher PIN.';return;}
   if(stage===v.stage){msg.textContent=`${v.className} is already at ${stage}.`;return;}
   if(!window.confirm(`Move ${v.className} from ${v.stage} to ${stage}? This changes the class's level cap.`))return;
   go.disabled=true;msg.textContent='Saving the correction to Google Sheets…';const at=Date.now(),note=`Set to ${stage} by teacher`;
   try{
    const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'SAGA_SET',className:v.className,stage,note,at,pin:p})});
    const result=await r.json();if(!r.ok||result.status!=='success')throw Error(result.message||'The correction was not saved.');
    root.LeagueTeacher?.accepted(p);root.LeagueSaga?.setStage(v.className,stage,{note,at});
    command('SAGA_SET',{className:v.className,stage,note,at});setOpen=false;msg.textContent=`${v.className} set to ${stage}.`;render();
   }catch(error){msg.textContent=error.message||'Could not reach Google Sheets. Try again.';go.disabled=false;}
  };
  return form;
 }
 // ---- Live controls on the main screen: the Merge Spell and the Finale ----
 function renderLive(){
  const host=$('mobile-saga-live');if(!host)return;
  const v=view;
  if(v?.merge){host.hidden=false;host.dataset.mode='merge';root.LeagueMergeSpell?.renderRemote(host,v.merge,(action,extra)=>command(action,extra));return;}
  if(v?.finale){
   host.hidden=false;host.dataset.mode='finale';host.replaceChildren();const f=v.finale;voice=f.voice;
   host.append(el('p','saga-remote-kicker',f.replay?'Replay the Finale':'The Finale'),el('p','saga-remote-turn',`${f.name}${f.lines&&f.line?` · line ${f.line} of ${f.lines}`:''}`));
   if(f.text)host.append(el('p','saga-remote-prompt',f.text));
   const next=el('button','saga-remote-btn primary',f.last?'Finish the Finale':'Continue');next.type='button';next.onclick=()=>command('FINALE_NEXT');host.append(next);
   const speak=el('button','saga-remote-btn ghost',voice?'English voice: on':'English voice: off');speak.type='button';speak.setAttribute('aria-pressed',String(voice));speak.onclick=()=>command('FINALE_VOICE',{on:!voice});host.append(speak);
   return;
  }
  host.hidden=true;host.replaceChildren();delete host.dataset.mode;
 }
 root.LeagueSagaRemote=Object.freeze({sync,render,renderLive,flush,get view(){return view;}});
})(window);
