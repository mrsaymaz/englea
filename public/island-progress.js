/* Class/team progress survives session resets. PINs exist only in memory. */
(function(root){
 'use strict';
 const KEY='english-league-island-runner-v1',classes=['5-A','5-C','6-C','7-A','8-B'],teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 let memory={},pin='',adapter=null,current=null,loading=false;const attempted=new Set(),confirmed=new Map();
 const valid=c=>classes.includes(c);
 function bestResult(a,b){const out={score:Math.max(a.score,b.score),stars:Math.max(a.stars,b.stars)},coins=[a.coinPercent,b.coinPercent].filter(v=>Number.isInteger(v)&&v>=0&&v<=100);if(coins.length)out.coinPercent=Math.max(...coins);if(a.hardClear===true||b.hardClear===true)out.hardClear=true;return out;}
 function clean(raw,c){const out={};for(const team of teams){const key=c+'|'+team;out[key]={};for(const [id,v] of Object.entries(raw?.[key]||{})){if(/^(10|[1-9])$/.test(id)&&v&&Number.isInteger(v.score)&&v.score>=0&&v.score<=100000&&Number.isInteger(v.stars)&&v.stars>=1&&v.stars<=3)out[key][id]=bestResult({score:0,stars:0},v);}}return out;}
 function combine(raw,c){let changed=false;for(const [key,levels] of Object.entries(clean(raw,c))){memory[key]??={};for(const [id,v]of Object.entries(levels)){const old=memory[key][id]||{score:0,stars:0},best=bestResult(old,v);if(JSON.stringify(best)!==JSON.stringify(old)){memory[key][id]=best;changed=true;}}}return changed;}
 function disk(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
 function snapshot(c){if(!valid(c))return {};combine(disk()?.progress,c);return clean(memory,c);}
 function merge(raw,c){if(!valid(c))return false;const fromDisk=combine(disk()?.progress,c);const changed=combine(raw,c)||fromDisk;if(changed){
  const state=disk()||{schema:'english-league-island-runner',version:3,contentRevision:3,settings:{},progress:{},overrides:{},seen:{}};
  state.progress={...(state.progress||{}),...memory};try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
  document.dispatchEvent(new CustomEvent('island-progress-change',{detail:{className:c}}));
 }render();return changed;}
 function label(c){if(!valid(c))return 'Choose a class to load islands';const stamp=JSON.stringify(snapshot(c));return confirmed.get(c)===stamp?'Island progress saved online':'Island progress · load / save online';}
 function render(){for(const id of ['board-island-progress','mobile-island-progress']){const b=document.getElementById(id);if(b){b.textContent=loading?'Loading islands…':'Load islands';b.title=label(current);b.disabled=loading||!valid(current);}}const el=document.getElementById('island-progress-status');if(el)el.textContent=label(current);}
 async function request(data){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);try{const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:abort.signal});const result=await r.json();if(!r.ok||result.status!=='success')throw Error(result.message||'Could not load island progress.');return result;}finally{clearTimeout(timer);}}
 function acknowledge(c,raw){confirmed.set(c,JSON.stringify(clean(raw,c)));merge(raw,c);render();}
 async function load(c,entered){if(loading||!valid(c))return;loading=true;const dialog=document.getElementById('island-cloud-dialog');dialog.dataset.className=c;document.getElementById('island-cloud-title').textContent='Load islands · '+c;render();const status=document.getElementById('island-cloud-message');try{
  const result=await request({type:'ISLAND_GET',className:c,pin:entered});pin=entered;root.LeagueTeacher?.accepted(entered,'islands');acknowledge(c,result.islandProgress);if(result.teaching)root.LeagueTeaching?.accept(result.teaching);if(Array.isArray(result.questionLog))root.LeagueQuestionLog?.merge(c,result.questionLog);if(Array.isArray(result.navigatorSeals))root.LeagueNavigatorSeals?.merge(c,result.navigatorSeals);if(result.season)root.LeagueSeason?.accept(result.season);else root.LeagueSeason?.outdated();if(result.lastSession)root.LeagueHalo?.accept(c,result.lastSession);
  // v11.0.0: the class's Vixar Saga row, the Finale's data and the speech lines (Apps Script v11.0.0).
  if(result.saga||result.sagaExtras||result.finaleLines)document.dispatchEvent(new CustomEvent('league-saga-loaded',{detail:{className:c,saga:result.saga||null,extras:result.sagaExtras||null,lines:result.finaleLines||null}}));
  adapter?.loaded?.(c,snapshot(c));document.getElementById('island-cloud-dialog')?.close();
 }catch(e){if(status)status.textContent=e.message;const dialog=document.getElementById('island-cloud-dialog');if(dialog&&!dialog.open)dialog.showModal();}finally{loading=false;render();if(current!==c&&valid(current))select(current);}}
 function open(c=current){if(!valid(c))return;const d=document.getElementById('island-cloud-dialog');d.dataset.className=c;document.getElementById('island-cloud-title').textContent='Load islands · '+c;document.getElementById('island-cloud-message').textContent='Load saved team progress from Google Sheets. Your local progress will also be kept.';document.getElementById('island-cloud-pin').value='';if(!d.open)d.showModal();}
 function select(c,automatic=true){if(!adapter)return;if(!valid(c)){current=null;render();return;}current=c;render();if(!automatic||loading||attempted.has(c)||root.LeagueTeacher?.waiting)return;attempted.add(c);if(pin)load(c,pin);else open(c);}
 function configure(a){adapter=a;
  const d=document.createElement('dialog');d.id='island-cloud-dialog';d.innerHTML='<form method="dialog"><h2 id="island-cloud-title">Load islands</h2><p id="island-cloud-message" role="status"></p><label>Teacher PIN<input id="island-cloud-pin" type="password" inputmode="numeric" autocomplete="off" required></label><div><button type="button" id="island-cloud-offline">Continue offline</button><button type="submit">Load progress</button></div></form>';document.body.append(d);
  d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('island-cloud-pin'),value=input.value.trim();input.value='';if(value)load(d.dataset.className,value);});document.getElementById('island-cloud-offline').onclick=()=>d.close();
  for(const [id,anchor]of [['board-island-progress',document.getElementById('board-selected-class')?.closest('button')],['mobile-island-progress',document.getElementById('mobile-save-status')]])if(anchor){const b=document.createElement('button');b.id=id;b.type='button';b.className='island-cloud-button';b.onclick=()=>pin&&valid(current)?load(current,pin):open();anchor.after(b);}
  const status=document.createElement('p');status.id='island-progress-status';status.setAttribute('role','status');document.getElementById('mobile-save-status')?.before(status);render();
 }
 root.LeagueIslandProgress={valid,clean,snapshot,merge,configure,select,open,acknowledge,rememberPin:value=>{pin=value;},
  // v10.1.0: the phone's Teacher sign-in hands its PIN over and loads the chosen class straight away.
  signIn(value){pin=value||'';if(valid(current)){attempted.delete(current);select(current);}},label};
})(window);
