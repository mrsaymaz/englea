/* Online roster catalogue. Session snapshots are managed by game.js, never by this editor.
   v12.0.0: the real class lists come only from Google Sheets, through the signed-in /api/roster request with the Teacher
   PIN; this device keeps its own copy (englishLeague.roster.v1) for offline lessons. Until then the board shows example names. */
(function(root){
 'use strict';
 const KEY='englishLeague.roster.v1',labels={gryffindor:'Gryffindor',slytherin:'Slytherin',hufflepuff:'Hufflepuff',ravenclaw:'Ravenclaw'};
 let embedded=null;
 let catalog=null,storageOK=true,onSaved=()=>{},getClass=()=>null,dialog,body,status,closeButton,pin='',busy=false,editBase=null,chosenClass='5-A',showRemoved=false;
 const clone=value=>JSON.parse(JSON.stringify(value));
 function valid(value){
  if(value?.schema!==1||!Number.isSafeInteger(value.version)||value.version<1||! /^[a-f0-9]{64}$/.test(value.revision))throw Error('Update the Apps Script deployment to v8.7.0, then Reload online.');
  return {schema:1,version:value.version,revision:value.revision,students:LeagueStudents.validateRoster(value.students)};
 }
 function accept(value){
  const next=valid(value);
  if(catalog&&next.version<catalog.version)return false;
  catalog=next;try{localStorage.setItem(KEY,JSON.stringify(catalog));storageOK=true;}catch{storageOK=false;}
  return true;
 }
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved)accept(saved);}catch{storageOK=false;}
 if(catalog)LeagueStudents.useRoster(catalog.students);
 const el=(tag,text,cls='')=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;n.className=cls;return n;};
 function button(text,handler,cls=''){const b=el('button',text,cls);b.type='button';b.onclick=handler;return b;}
 function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
 function setBusy(value){busy=value;dialog.setAttribute('aria-busy',String(value));(embedded||dialog).querySelectorAll('button,input,select').forEach(n=>n.disabled=value);}
 function close(){if(busy)return;pin='';editBase=null;body.replaceChildren();dialog.close();document.getElementById('mobile-manage-btn')?.focus();}
 function ensure(){
  if(dialog)return;dialog=el('dialog',undefined,'roster-manager');dialog.id='roster-manager';dialog.setAttribute('aria-labelledby','roster-title');
  const header=el('header'),title=el('h2','Manage');title.id='roster-title';closeButton=button('Close',close);header.append(title,closeButton);
  status=el('p','','roster-status');status.id='roster-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  body=el('div',undefined,'roster-body');dialog.append(header,status,body);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dialog);
 }
 async function request(type,extra={},key=pin){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch('/api/roster',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:controller.signal,body:JSON.stringify({type,pin:key,...extra})});
   const result=await response.json();
   if(!response.ok||result.status!=='success')throw Object.assign(Error(result.message||result.error||(result.status==='unauthorized'?'Incorrect Teacher PIN.':'Update the Apps Script deployment, then reload.')),{unauthorized:result.status==='unauthorized'});
   return valid(result);
  }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw Object.assign(Error('Connection interrupted. Saving was not confirmed. Reload online before retrying.'),{offline:true});throw error;}
  finally{clearTimeout(timer);}
 }
 async function load(){
  setBusy(true);message('Loading the online roster…');
  try{const data=await request('ROSTER_GET');accept(data);editBase=data;onSaved(data);renderList();message('Online roster loaded. Edits apply to the next session.'+(!storageOK?' This browser could not keep an offline copy.':''));}
  catch(error){message(error.message,true);}
  finally{setBusy(false);}
 }
 function auth(){
  body.replaceChildren();const form=el('form'),label=el('label','Teacher PIN'),input=el('input');input.id='roster-pin';input.type='password';input.autocomplete='off';input.inputMode='numeric';input.maxLength=100;label.htmlFor=input.id;
  const submit=el('button','Load online');submit.id='roster-load';submit.type='submit';form.append(label,input,submit);form.onsubmit=e=>{e.preventDefault();pin=input.value.trim();if(!pin){message('Enter the same Teacher PIN used to save results.',true);return;}load();};
  body.append(el('p','Use the Teacher PIN for Google Sheets, not the changing screen-access code.'),form);
  message(catalog?'A saved roster is available for lessons. Load online to edit the latest version.':'Your class lists are kept in the Roster tab of your Google Sheet. Load online to bring them to this device.');input.focus();
 }
 function renderList(){
  body.replaceChildren();const bar=el('div',undefined,'roster-bar'),select=el('select');select.id='roster-class';select.setAttribute('aria-label','Class');
  LeagueStudents.classes.forEach(c=>{const option=el('option',c);option.value=c;select.append(option);});select.value=chosenClass;select.onchange=()=>{chosenClass=select.value;renderList();};
  const add=button('+ Add Student',()=>renderEdit(null));add.id='roster-add';const reload=button('Reload online',load);reload.id='roster-reload';bar.append(select,add,reload);body.append(bar);
  const removed=el('label',undefined,'roster-removed-toggle'),check=el('input');check.type='checkbox';check.checked=showRemoved;check.onchange=()=>{showRemoved=check.checked;renderList();};removed.append(check,document.createTextNode('Show removed students'));body.append(removed);
  for(const team of LeagueStudents.teams){
   const section=el('section'),list=el('div',undefined,'roster-names');section.dataset.team=team;section.append(el('h3',labels[team]));
   const students=editBase.students.filter(p=>p.className===chosenClass&&p.teamId===team&&(p.active||showRemoved));
   for(const person of students){const b=button(person.name+(person.active?'':' · Removed'),()=>renderEdit(person),'roster-student');b.dataset.studentId=person.id;list.append(b);}
   if(!students.length)list.append(el('p','No students.','roster-empty'));section.append(list);body.append(section);
  }
 }
 function renderEdit(person){
  body.replaceChildren();const form=el('form'),nameLabel=el('label','Student name'),name=el('input');name.id='roster-name';name.maxLength=70;name.autocomplete='off';name.value=person?.name||'';name.required=true;nameLabel.htmlFor=name.id;
  const classLabel=el('label','Class'),cls=el('select');cls.id='roster-edit-class';classLabel.htmlFor=cls.id;LeagueStudents.classes.forEach(c=>{const o=el('option',c);o.value=c;cls.append(o);});cls.value=person?.className||chosenClass;
  const teamLabel=el('label','Team'),team=el('select');team.id='roster-team';teamLabel.htmlFor=team.id;LeagueStudents.teams.forEach(t=>{const o=el('option',labels[t]);o.value=t;team.append(o);});team.value=person?.teamId||'gryffindor';
  const save=el('button','Save online');save.id='roster-save';save.type='submit';
  form.append(nameLabel,name,classLabel,cls,teamLabel,team,save);
  const id=person?.id||'student-'+crypto.randomUUID();
  async function commit(active){
   const next={id,name:name.value.trim(),className:cls.value,teamId:team.value,active};let rows=editBase.students.map(p=>p.id===id?next:p);if(!person)rows.push(next);
   try{rows=LeagueStudents.validateRoster(rows);}catch(error){message(error.message,true);return;}
   setBusy(true);message('Saving online…');
   try{const result=await request('ROSTER_SAVE',{students:rows,revision:editBase.revision});accept(result);editBase=result;chosenClass=next.className;onSaved(result);renderList();message('Saved online ✓ Changes apply to the next session.'+(!storageOK?' Offline copy unavailable.':''));}
   catch(error){message(error.message,true);}
   finally{setBusy(false);}
  }
  form.onsubmit=e=>{e.preventDefault();commit(person?.active??true);};
  body.append(el('h3',person?'Edit student':'Add student'),el('p','The current lesson’s names, teams and participation stay unchanged.'),form);
  if(person){let confirmed=false;const remove=button(person.active?'Remove from roster':'Restore student',()=>{
    if(person.active&&!confirmed){confirmed=true;remove.textContent='Confirm removal for future sessions';return;}commit(!person.active);
   },'roster-remove');remove.id='roster-remove';body.append(remove);}
  body.append(button('Back',()=>{renderList();message('Edits not saved.');}),button('Reload online',load));name.focus();
 }
 root.LeagueRoster={get busy(){return busy;},mount(container,teacherPin,className){ensure();embedded=container;container.classList.add('roster-manager','roster-embedded');container.append(status,body);chosenClass=className||getClass()||'5-A';pin=teacherPin;load();},unmount(){if(embedded){dialog.append(status,body);embedded=null;pin='';editBase=null;}},current:()=>catalog?clone(catalog):null,accept,configure(options){onSaved=options.onSaved;getClass=options.getClass;},open(){ensure();pin='';editBase=null;chosenClass=getClass()||'5-A';if(!dialog.open)dialog.showModal();auth();if(root.LeagueTeacher?.pin){pin=root.LeagueTeacher.pin;load();}},
  // v10.1.0 Teacher sign-in: load the online roster with the PIN typed when the phone connected.
  async signIn(key){try{const data=await request('ROSTER_GET',{},key);accept(data);onSaved(data,{signIn:true});return {ok:true};}catch(error){return {ok:false,unauthorized:Boolean(error.unauthorized),message:error.offline?'Google Sheets could not be reached.':error.message};}},get storageOK(){return storageOK;}};
})(window);
