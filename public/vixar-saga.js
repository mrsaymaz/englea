/* v11.0.0 · The Vixar Saga. Each class plays three fights and one closing scene, whenever Mr. Saymaz opens the Rift:
   Violet Vixar (Act I), Scarlet Vixar (Act II), Gilded Vixar (Act III) and the Finale, where the class frees Mr. Saymaz.
   - A class's stage is permanent and raises the level cap for all four teams: 10 at Violet, 11 at Scarlet, 12 at Gilded
     and Freed. A won stage is never taken back; only the PIN-protected Set stage (a teacher's correction) moves it.
   - The board keeps a copy of every class's row, the phone loads the row from Google Sheets (Vixar_Saga tab) and
     passes it on; the furthest stage wins unless a newer teacher correction says otherwise.
   - Nothing here opens a fight: the Rift is opened by hand, one session at a time (game.js).
   This file holds data and rules only (no timers, no drawing), so it also runs in the tests. */
(function(root){
 'use strict';
 const KEY='englishLeague.saga.v1',LINES_KEY='englishLeague.finaleLines.v1';
 const CLASSES=['5-A','5-C','6-C','7-A','8-B'],TEAMS=['gryffindor','slytherin','hufflepuff','ravenclaw'];
 const STAGES=Object.freeze(['Violet','Scarlet','Gilded','Freed']);
 const CAPS=Object.freeze({Violet:10,Scarlet:11,Gilded:12,Freed:12});
 // Starting values for the balance lab (tests/saga-balance.cjs): a class that meets every requirement wins 8 or more
 // fights in 10. Higher stakes mean a harder fight, never a harsher penalty.
 const ACTS=Object.freeze({
  Violet:Object.freeze({act:1,stage:'Violet',form:'violet',level:10,bossHP:4200,sealHP:240,duration:85000,pace:1,armor:108,
   phases:['Cosmic Dominion','Edict of Separation','The Fifth Silence'],art:'vixar',poses:true,title:'VIXAR',epithet:'The Sovereign Beyond the Empty Crown',
   kicker:'Act I · Violet Vixar',winTitle:'The Violet Form Is Broken',winLine:'Vixar’s first form is broken',lossTitle:'The Empty Crown Endures',
   next:'Scarlet',color:'#a78bfa',shatter:'crystal',escape:true}),
  Scarlet:Object.freeze({act:2,stage:'Scarlet',form:'scarlet',level:11,bossHP:5600,sealHP:300,duration:95000,pace:.9,armor:112,
   phases:['Crimson Dominion','Edict of Separation','The Fifth Silence'],art:'vixar-scarlet',poses:false,title:'SCARLET VIXAR',epithet:'The Crown Reforged in Embers',
   kicker:'Act II · Scarlet Vixar',winTitle:'The Scarlet Form Is Broken',winLine:'Vixar’s second form is broken',lossTitle:'The Scarlet Crown Endures',
   next:'Gilded',color:'#f43f5e',shatter:'ember',escape:true,brand:true}),
  Gilded:Object.freeze({act:3,stage:'Gilded',form:'gilded',level:12,bossHP:7000,sealHP:360,duration:110000,pace:.86,armor:116,
   phases:['Gilded Dominion','Edict of Separation','The Fifth Silence'],art:'vixar-gilded',poses:false,title:'GILDED VIXAR',epithet:'The Golden Prison',
   kicker:'Act III · Gilded Vixar',winTitle:'The Curse Is Broken',winLine:'Mr. Saymaz is free',lossTitle:'The Gilded Crown Endures',
   next:'Freed',color:'#fbbf24',shatter:'metal',escape:false,merge:true})
 });
 const FORM_NAMES=Object.freeze({Violet:'Violet Vixar',Scarlet:'Scarlet Vixar',Gilded:'Gilded Vixar',Freed:'Freed'});
 const TIERS=Object.freeze({10:'Legendary',11:'Mythic',12:'Celestial'});
 const sessionOk=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(s);
 const time=v=>{const n=Number(v);return Number.isFinite(n)&&n>1.4e12&&n<4.2e12?Math.round(n):0;};
 const validClass=c=>CLASSES.includes(c);
 const index=stage=>STAGES.indexOf(stage);
 function blank(c){return {className:c,stage:'Violet',attempts:0,won:{Violet:0,Scarlet:0,Gilded:0},lastSessionId:'',fightSessions:[],corrections:[],updatedAt:0,correctedAt:0};}
 function clean(raw,c){
  const row=blank(c);if(!raw||typeof raw!=='object')return row;
  if(STAGES.includes(raw.stage))row.stage=raw.stage;
  const attempts=Number(raw.attempts);row.attempts=Number.isInteger(attempts)&&attempts>=0&&attempts<=1000?attempts:0;
  for(const s of ['Violet','Scarlet','Gilded'])row.won[s]=time(raw.won?.[s]);
  row.lastSessionId=sessionOk(raw.lastSessionId)?raw.lastSessionId:'';
  row.fightSessions=Array.isArray(raw.fightSessions)?[...new Set(raw.fightSessions.filter(sessionOk))].slice(-40):[];
  row.corrections=Array.isArray(raw.corrections)?raw.corrections.filter(x=>x&&time(x.at)&&STAGES.includes(x.to)).map(x=>({at:time(x.at),from:STAGES.includes(x.from)?x.from:'',to:x.to,note:String(x.note||'').slice(0,80)})).slice(-20):[];
  row.updatedAt=time(raw.updatedAt);row.correctedAt=time(raw.correctedAt);
  return row;
 }
 const storage=()=>{try{return root.localStorage||null;}catch{return null;}};
 let store={};
 try{const saved=JSON.parse(storage()?.getItem(KEY)||'{}');for(const c of CLASSES)if(saved?.[c])store[c]=clean(saved[c],c);}catch{store={};}
 function persist(){try{storage()?.setItem(KEY,JSON.stringify(store));}catch{}}
 function changed(c){try{root.document?.dispatchEvent(new CustomEvent('league-saga-change',{detail:{className:c}}));}catch{}}
 const get=c=>validClass(c)?JSON.parse(JSON.stringify(store[c]||blank(c))):null;
 const stageOf=c=>validClass(c)?(store[c]?.stage||'Violet'):'Violet';
 const cap=stage=>CAPS[STAGES.includes(stage)?stage:'Violet'];
 const act=stage=>ACTS[stage]||null;
 // What changes when a row is saved or compared (the phone saves a row once per change).
 function stamp(row){if(!row)return '';const {className,stage,attempts,won,lastSessionId,fightSessions,corrections,correctedAt}=row;return JSON.stringify({className,stage,attempts,won,lastSessionId,fightSessions,corrections,correctedAt});}
 function put(c,row,at){row.updatedAt=Math.max(row.updatedAt||0,at||Date.now());store[c]=clean(row,c);persist();changed(c);return get(c);}
 // A finished fight (never an interrupted one). A win advances the stage once: a second report of the same win
 // (a re-save, a duplicated message) finds the stage already advanced and changes nothing.
 function recordFight(c,{sessionId,won,stage,at=Date.now()}={}){
  if(!validClass(c)||!sessionOk(sessionId))return {ok:false,row:get(c)};
  const row=get(c);if(stage&&stage!==row.stage)return {ok:false,stale:true,row};
  const fought=ACTS[row.stage];if(!fought)return {ok:false,row};
  if(won&&row.won[row.stage])return {ok:false,duplicate:true,row};
  if(!row.fightSessions.includes(sessionId))row.fightSessions.push(sessionId);
  row.lastSessionId=sessionId;
  let advanced=false;
  if(won){row.won[row.stage]=at;row.stage=fought.next;row.attempts=0;advanced=true;}else row.attempts+=1;
  return {ok:true,advanced,from:fought.stage,to:row.stage,row:put(c,row,at)};
 }
 // Set stage (Manage, PIN): moves a class to any stage to fix a misclick or a test run. It is logged.
 function setStage(c,stage,{note='Set by teacher',at=Date.now()}={}){
  if(!validClass(c)||!STAGES.includes(stage))return {ok:false};
  const row=get(c),from=row.stage;
  row.stage=stage;row.attempts=0;row.correctedAt=at;
  for(const s of ['Violet','Scarlet','Gilded'])if(index(s)>=index(stage))row.won[s]=0;
  row.corrections.push({at,from,to:stage,note:String(note||'').slice(0,80)});row.corrections=row.corrections.slice(-20);
  return {ok:true,from,to:stage,row:put(c,row,at)};
 }
 // A row from Google Sheets or the other device. The furthest stage is kept, so nothing that arrives can take an earned
 // stage back; a teacher correction newer than this copy's own wins instead.
 function merge(local,incoming){
  const a=local,b=incoming;
  // A correction is newer than everything the other copy did (a fight won after it still counts).
  if(b.correctedAt>a.correctedAt&&b.correctedAt>=a.updatedAt)return {...b,fightSessions:[...new Set([...a.fightSessions,...b.fightSessions])].slice(-40),corrections:union(a.corrections,b.corrections)};
  if(a.correctedAt>b.correctedAt&&a.correctedAt>=b.updatedAt)return {...a,fightSessions:[...new Set([...a.fightSessions,...b.fightSessions])].slice(-40),corrections:union(a.corrections,b.corrections)};
  const ahead=index(b.stage)>index(a.stage)?b:index(a.stage)>index(b.stage)?a:(b.attempts>a.attempts?b:a);
  const won={};for(const s of ['Violet','Scarlet','Gilded']){const x=[a.won[s],b.won[s]].filter(Boolean);won[s]=index(s)<index(ahead.stage)&&x.length?Math.min(...x):0;}
  return {...ahead,won,lastSessionId:(b.updatedAt>a.updatedAt?b:a).lastSessionId||ahead.lastSessionId,
   fightSessions:[...new Set([...a.fightSessions,...b.fightSessions])].slice(-40),corrections:union(a.corrections,b.corrections),updatedAt:Math.max(a.updatedAt,b.updatedAt)};
 }
 function union(x,y){const seen=new Map();for(const e of [...x,...y])seen.set(e.at+'|'+e.to,e);return [...seen.values()].sort((p,q)=>p.at-q.at).slice(-20);}
 function accept(c,raw){
  if(!validClass(c)||!raw||typeof raw!=='object')return false;
  const local=get(c),next=merge(local,clean({...raw,className:c},c));
  if(stamp(next)===stamp(local))return false;
  store[c]=clean(next,c);persist();changed(c);return true;
 }
 // The readiness line on the phone: how many teams have reached this act's level, and the Class Mission.
 function readiness(stage,levels,missionComplete){
  const a=ACTS[stage];if(!a)return {level:null,ready:0,total:4,mission:Boolean(missionComplete),complete:false};
  const ready=TEAMS.filter(t=>Number(levels?.[t])>=a.level).length;
  return {level:a.level,ready,total:4,mission:Boolean(missionComplete),complete:ready===4&&Boolean(missionComplete)};
 }
 const tierName=level=>TIERS[Math.min(12,Math.max(10,Math.floor(Number(level)||0)))]||'';

 // ---- The Finale's names: up to three students per house, named only for what they gave ----
 // contributions: [{team, name, contributions}] from the saga sessions (Google Sheets and this session);
 // navigators: [{team, student}]; merge: [{team, student, result:'right'}] (Merge Spell answers).
 function finaleNames({contributions=[],navigators=[],merge=[]}={}){
  const houses=Object.fromEntries(TEAMS.map(t=>[t,new Map()]));
  const entry=(team,name)=>{if(!houses[team]||typeof name!=='string'||!name.trim())return null;const key=name.trim().toLocaleLowerCase('tr');
   let e=houses[team].get(key);if(!e){e={name:name.trim().slice(0,70),team,contributions:0,merge:0,navigator:false};houses[team].set(key,e);}return e;};
  for(const r of contributions){const e=entry(r?.team,r?.name);const n=Number(r?.contributions);if(e&&Number.isFinite(n)&&n>0)e.contributions+=Math.round(n);}
  for(const r of navigators){const e=entry(r?.team,r?.student);if(e)e.navigator=true;}
  for(const r of merge){if(r?.result!=='right')continue;const e=entry(r?.team,r?.student);if(e)e.merge+=1;}
  return Object.fromEntries(TEAMS.map(t=>{
   const list=[...houses[t].values()].filter(e=>e.contributions>0||e.merge>0||e.navigator)
    .sort((a,b)=>(b.contributions+b.merge*3+(b.navigator?2:0))-(a.contributions+a.merge*3+(a.navigator?2:0))||a.name.localeCompare(b.name,'tr')).slice(0,3)
    .map(e=>({name:e.name,gave:[e.contributions?`${e.contributions} contribution${e.contributions===1?'':'s'}`:'',e.merge?'Merge Spell':'',e.navigator?'Island Run navigator':''].filter(Boolean)}));
   return [t,list];
  }));
 }

 // ---- The thank-you speech: default lines per grade, editable in Studio (kept in Google Sheets and on each device) ----
 const DEFAULT_LINES=Object.freeze({
  5:Object.freeze(['Thank you!','You are very brave.','You helped me.','You worked together, every team.','You are my heroes.']),
  6:Object.freeze(['Thank you, everyone.','I was a prisoner in that armour, but you never stopped.','Every right answer made the gold weaker.','Old rivals became partners today.','I am so proud of you.']),
  7:Object.freeze(['For months I couldn’t speak.','You broke the curse because you worked together.','Gryffindor and Slytherin, Hufflepuff and Ravenclaw — side by side.','That is the real magic of this class.','Thank you for bringing me back.']),
  8:Object.freeze(['I have been trapped since September, and you have finally set me free.','Thank you.','You did not win because one team was the strongest.','You won because every team helped the others.','Never forget what you can do together.'])
 });
 function cleanLines(list){return Array.isArray(list)?list.map(s=>String(s??'').replace(/\s+/g,' ').trim()).filter(Boolean).map(s=>s.slice(0,160)).slice(0,10):[];}
 let lineStore={};try{const saved=JSON.parse(storage()?.getItem(LINES_KEY)||'{}');for(const g of [5,6,7,8]){const l=cleanLines(saved?.[g]?.lines);if(l.length)lineStore[g]={lines:l,at:time(saved[g].at)};}}catch{lineStore={};}
 function lines(grade){const g=Number(grade);return [...(lineStore[g]?.lines||DEFAULT_LINES[g]||DEFAULT_LINES[5])];}
 function acceptLines(grade,list,at=Date.now()){
  const g=Number(grade),l=cleanLines(list);if(![5,6,7,8].includes(g)||!l.length)return false;
  const t=time(at)||Date.now();if(lineStore[g]&&lineStore[g].at>t)return false;
  if(JSON.stringify(lineStore[g]?.lines)===JSON.stringify(l))return false;
  lineStore[g]={lines:l,at:t};try{storage()?.setItem(LINES_KEY,JSON.stringify(lineStore));}catch{}
  try{root.document?.dispatchEvent(new CustomEvent('league-saga-lines',{detail:{grade:g}}));}catch{}return true;
 }
 const linesStamp=grade=>JSON.stringify(lineStore[Number(grade)]||null);

 // ---- What the Finale needs from Google Sheets: the class's contributions in its saga sessions, its Island Run
 // navigators and its Merge Spell answers (kept on each device, refreshed at each sign-in) ----
 const EXTRAS_KEY='englishLeague.sagaExtras.v1';
 const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 function cleanExtras(raw){
  const team=t=>{const n=String(t||'').toLowerCase();return TEAMS.includes(n)?n:null;};
  const contributions=(Array.isArray(raw?.contributions)?raw.contributions:[]).map(r=>({team:team(r?.team),name:text(r?.name,70),contributions:Math.max(0,Math.min(100000,Math.round(Number(r?.contributions)||0))),sessionId:sessionOk(r?.sessionId)?r.sessionId:''})).filter(r=>r.team&&r.name&&r.contributions>0).slice(-2000);
  const navigators=(Array.isArray(raw?.navigators)?raw.navigators:[]).map(r=>({team:team(r?.team),student:text(r?.student,70)})).filter(r=>r.team&&r.student).slice(-500);
  const merge=(Array.isArray(raw?.merge)?raw.merge:[]).map(r=>({id:text(r?.id,140),team:team(r?.team),student:text(r?.student,70),result:r?.result==='right'?'right':'wrong'})).filter(r=>r.team).slice(-500);
  return {contributions,navigators,merge,at:time(raw?.at)||0};
 }
 let extrasStore={};try{const saved=JSON.parse(storage()?.getItem(EXTRAS_KEY)||'{}');for(const c of CLASSES)if(saved?.[c])extrasStore[c]=cleanExtras(saved[c]);}catch{extrasStore={};}
 function acceptExtras(c,raw){if(!validClass(c)||!raw)return false;const next=cleanExtras(raw);if(extrasStore[c]&&extrasStore[c].at>next.at&&next.at)return false;extrasStore[c]={...next,at:next.at||Date.now()};try{storage()?.setItem(EXTRAS_KEY,JSON.stringify(extrasStore));}catch{}return true;}
 const extras=c=>validClass(c)?JSON.parse(JSON.stringify(extrasStore[c]||cleanExtras({}))):cleanExtras({});

 const api=Object.freeze({STAGES,CAPS,ACTS,FORM_NAMES,CLASSES,TEAMS,validClass,blank,clean,get,stageOf,cap,act,index,stamp,merge,accept,recordFight,setStage,readiness,tierName,
  finaleNames,DEFAULT_LINES,lines,acceptLines,linesStamp,cleanLines,acceptExtras,extras,cleanExtras,rows:()=>Object.fromEntries(CLASSES.map(c=>[c,get(c)])),
  reset(){store={};lineStore={};extrasStore={};persist();try{storage()?.removeItem(LINES_KEY);storage()?.removeItem(EXTRAS_KEY);}catch{}}});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LeagueSaga=api;
})(typeof globalThis!=='undefined'?globalThis:this);
