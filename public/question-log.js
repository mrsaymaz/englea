/* v9.3.0 Island Run answer log. Rows are team answers, never individual student results.
   The review list is derived from the log, so merging logs from the board, phone and Sheet is a simple union. */
(function(root){
  'use strict';
  const KEY='englishLeague.questionLog.v1',LIMIT=600;
  const classes=['5-A','5-C','6-C','7-A','8-B'],teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
  const formats=['text','listen','picture','spell'],kinds=['word','gap','question','spell'];
  const text=(v,max)=>typeof v==='string'&&v.length<=max;
  function clean(r){
    if(!r||typeof r!=='object')return null;
    if(!text(r.id,140)||!/^[A-Za-z0-9:_.-]{3,140}$/.test(r.id)||!classes.includes(r.c)||!teams.includes(r.h))return null;
    const g=Number(r.g),i=Number(r.i),t=Number(r.t);
    if(![5,6,7,8].includes(g)||Number(r.c[0])!==g||!Number.isInteger(i)||i<1||i>10||!Number.isFinite(t)||t<1.5e12||t>4e12)return null;
    if(!text(r.q,100)||!r.q||!text(r.k,100)||!r.k||!kinds.includes(r.y)||!formats.includes(r.f)||typeof r.ok!=='boolean')return null;
    for(const [k,max] of [['p',80],['a',80],['x',160],['s',120]])if(r[k]!==undefined&&!text(r[k],max))return null;
    return {id:r.id,t:Math.round(t),s:r.s||'',c:r.c,h:r.h,g,i,q:r.q,k:r.k,y:r.y,f:r.f,ok:r.ok,e:r.e===true,v:r.v===true,m:r.m===true,p:r.p||'',a:r.a||'',x:r.x||''};
  }
  let state={schema:1,classes:{},cleared:{}};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.schema===1){for(const c of classes){const rows=Array.isArray(saved.classes?.[c])?saved.classes[c].map(clean).filter(Boolean):[];if(rows.length)state.classes[c]=rows;if(Number.isFinite(saved.cleared?.[c]))state.cleared[c]=saved.cleared[c];}}}catch{}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
  function changed(className){try{document.dispatchEvent(new CustomEvent('question-log-change',{detail:{className}}));}catch{}}
  // Union by row ID; the newest rows win when a class exceeds its local limit.
  function merge(className,rows){
    if(!classes.includes(className)||!Array.isArray(rows))return 0;
    const current=state.classes[className]||[],ids=new Set(current.map(r=>r.id));let added=0;
    for(const raw of rows.slice(0,2000)){const r=clean(raw);if(r&&r.c===className&&!ids.has(r.id)){current.push(r);ids.add(r.id);added++;}}
    if(!added)return 0;
    current.sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id));state.classes[className]=current.slice(-LIMIT);persist();changed(className);return added;
  }
  function record(rows){const byClass={};for(const r of rows||[]){const c=clean(r);if(c)(byClass[c.c]??=[]).push(c);}let n=0;for(const [c,list] of Object.entries(byClass))n+=merge(c,list);return n;}
  function rows(className,{sessionId}={}){const list=(state.classes[className]||[]).map(r=>({...r}));return sessionId?list.filter(r=>r.s===sessionId):list;}
  function stamp(className){const list=state.classes[className]||[];return list.length?list.length+':'+list[list.length-1].id:'0';}
  const runOf=id=>id.slice(0,id.lastIndexOf(':'));
  /* A concept enters review when answered wrong. It leaves after correct answers in two separate later runs.
     Second-chance answers and Word Trail letters are logged but never move a concept in or out of review. */
  function review(className,grade){
    const since=state.cleared[className]||0,concepts=new Map();
    for(const r of state.classes[className]||[]){
      if(r.t<=since||r.e||r.f==='spell'||(grade&&r.g!==grade))continue;
      const entry=concepts.get(r.k)||{concept:r.k,grade:r.g,island:r.i,ids:[],misses:0,attempts:0,inReview:false,runs:new Set(),last:0,prompt:''};
      entry.attempts++;
      if(!r.ok){entry.inReview=true;entry.runs=new Set();entry.misses++;entry.island=r.i;entry.last=r.t;entry.prompt=r.x||entry.prompt;if(!entry.ids.includes(r.q))entry.ids.push(r.q);}
      else if(entry.inReview){entry.runs.add(runOf(r.id));if(entry.runs.size>=2)entry.inReview=false;}
      concepts.set(r.k,entry);
    }
    return [...concepts.values()].filter(e=>e.inReview).sort((a,b)=>b.last-a.last)
      .map(({runs,inReview,...e})=>({...e,ids:e.ids.slice(-4),correctRuns:runs.size}));
  }
  function clearReview(className){if(!classes.includes(className))return;state.cleared[className]=Date.now();persist();changed(className);}
  root.LeagueQuestionLog=Object.freeze({clean,merge,record,rows,stamp,review,clearReview,limit:LIMIT});
})(typeof window!=='undefined'?window:globalThis);
