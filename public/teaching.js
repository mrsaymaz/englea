(function(root){
 'use strict';
 const KEY='englishLeague.teaching.v9';let units={},loadPromise=null;const transfers=new Map(),loadedFiles=new Set();
 function unit(key){return units[key]?JSON.parse(JSON.stringify(units[key])):null;}
 function catalog(grade){return {schema:1,grade:Number(grade),units:Object.fromEntries(Object.entries(units).filter(([key])=>Number(key[0])===Number(grade)))};}
 function accept(value,notify=true){
  if(value?.schema!==1||![5,6,7,8].includes(value.grade)||!value.units||Object.keys(value.units).length>10)throw Error('Invalid teaching catalogue.');
  const next={};for(const [key,entry]of Object.entries(value.units)){
   if(!TeachingModel.validKey(key)||Number(key[0])!==value.grade||!entry||!Number.isInteger(entry.version)||entry.version<0||! /^[a-f0-9]{64}$/.test(entry.revision))throw Error('Invalid teaching revision.');
   next[key]={content:TeachingModel.clean(entry.content),revision:entry.revision,version:entry.version};
  }
  let changed=false;for(const [key,entry]of Object.entries(next)){if(units[key]&&units[key].version>=entry.version)continue;units[key]=entry;changed=true;}
  if(changed){try{localStorage.setItem(KEY,JSON.stringify(units));}catch{}if(notify)document.dispatchEvent(new CustomEvent('teaching-content-change',{detail:{grade:value.grade}}));}return changed;
 }
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const grade of [5,6,7,8])accept({schema:1,grade,units:Object.fromEntries(Object.entries(saved).filter(([key])=>Number(key[0])===grade))},false);}catch{units={};}
 async function request(type,pin,extra={}){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);try{
  const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({type,pin,...extra}),signal:abort.signal});const data=await r.json();if(!r.ok||data.status!=='success')throw Error(data.message||'Could not confirm the request.');
  if(type.startsWith('TEACHING_'))accept({schema:1,grade:Number(data.unit[0]),units:{[data.unit]:{content:data.content,revision:data.revision,version:data.version}}});return data;
 }finally{clearTimeout(timer);}}
 function loadContent(){if(loadPromise)return loadPromise;loadPromise=(async()=>{
  const files=[...(root.RunnerContent?[]:['content.js']),...['5','6','7','8'].map(g=>'questions-grade'+g+'.js'),...['5','6','7','8'].map(g=>'variety-grade'+g+'.js'),...['5','6','7','8'].map(g=>'translate-grade'+g+'.js'),'expand-content.js'];
  for(const file of files){if(loadedFiles.has(file))continue;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./island-runner/'+file+'?v=10.5.1';script.onload=()=>{loadedFiles.add(file);resolve();};script.onerror=()=>reject(Error('Teaching materials could not load. Check your connection.'));document.head.append(script);});}return root.RunnerContent;
 })().catch(e=>{loadPromise=null;throw e;});return loadPromise;}
 function send(sendMessage,sessionId,grade){const data=JSON.stringify(catalog(grade));if(!Object.keys(catalog(grade).units).length)return;const id=crypto.randomUUID?.()||Date.now()+'-'+Math.random(),size=4000,total=Math.ceil(data.length/size);for(let i=0;i<total;i++)if(!sendMessage({type:'TEACHING_CHUNK',sessionId,id,index:i,total,chunk:data.slice(i*size,(i+1)*size)}))break;}
 function receive(message){
  const {id,index,total,chunk}=message;if(typeof id!=='string'||id.length>100||!Number.isInteger(total)||total<1||total>800||!Number.isInteger(index)||index<0||index>=total||typeof chunk!=='string'||chunk.length>4000)throw Error('Invalid teaching transfer.');
  for(const [key,value]of transfers)if(Date.now()-value.at>30000)transfers.delete(key);
  let transfer=transfers.get(id);if(!transfer){if(transfers.size>=2)transfers.delete(transfers.keys().next().value);transfer={at:Date.now(),total,parts:new Map()};transfers.set(id,transfer);}
  if(transfer.total!==total)throw Error('Teaching transfer changed.');transfer.parts.set(index,chunk);
  if(transfer.parts.size===total){transfers.delete(id);const raw=Array.from({length:total},(_,i)=>transfer.parts.get(i)).join('');return accept(JSON.parse(raw));}return false;
 }
 root.LeagueTeaching={unit,catalog,accept,request,loadContent,send,receive};
})(window);
