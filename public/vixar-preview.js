/* v11.0.0 · The Vixar fight preview: try Act I, II or III (or the Finale) with the real fight, then throw it away.
   Opened as index.html#preview-act1 … #preview-act3, #preview-finale (add -light for Light mode). Loaded first, before
   every other script, and does nothing without that address.
   - Nothing is saved: localStorage and sessionStorage are replaced by in-memory copies for this tab, so the classes'
     saga, sessions, contributions and settings are never read or written. Only the access-code grant passes through,
     so the board's own access check still applies (and is remembered as usual).
   - Nothing is sent: the board's server calls (/api/…, Google Sheets) are refused, apart from the access check, and no
     phone room is opened.
   - Confirmations answer yes (the preview has nothing to protect).
   game.js reads LeagueVixarPreview and sets up the fight. */
(function(root){
 'use strict';
 const match=/^#preview-(act1|act2|act3|finale)(-light)?$/.exec(root.location?.hash||'');
 if(!match)return;
 const PASS={local:['englishLeague.access.v1'],session:['englishLeague.accessTab.v1']};
 function memory(kind){
  let real=null;try{real=root[kind==='local'?'localStorage':'sessionStorage'];}catch{}
  const map=new Map(),pass=k=>PASS[kind].includes(String(k))&&real;
  const store={
   getItem(k){k=String(k);if(pass(k)){try{return real.getItem(k);}catch{return null;}}return map.has(k)?map.get(k):null;},
   setItem(k,v){k=String(k);if(pass(k)){try{real.setItem(k,String(v));}catch{}return;}map.set(k,String(v));},
   removeItem(k){k=String(k);if(pass(k)){try{real.removeItem(k);}catch{}return;}map.delete(k);},
   clear(){map.clear();},
   key(i){return [...map.keys()][i]??null;},
   get length(){return map.size;}
  };
  return store;
 }
 for(const kind of ['local','session']){const store=memory(kind);try{Object.defineProperty(root,kind==='local'?'localStorage':'sessionStorage',{configurable:true,get:()=>store});}catch{}}
 const realFetch=root.fetch?.bind(root);
 // The access check (/api/access-time) still runs; every other server call is refused.
 root.fetch=(input,init)=>{const path=new URL(String(input?.url||input),root.location.href).pathname;if(/\/api\//.test(path)&&!/\/api\/access-time$/.test(path))return Promise.reject(new TypeError('The fight preview works offline: nothing is sent.'));return realFetch(input,init);};
 root.confirm=()=>true;root.alert=()=>{};
 root.document.documentElement.classList.add('vixar-preview');
 root.LeagueVixarPreview=Object.freeze({active:true,act:match[1],mode:match[2]?'light':'animated',
  home:root.VIXAR_PREVIEW_HOME||'vixar-preview.html',
  go(act,mode){root.location.replace(`${root.location.pathname}${root.location.search}#preview-${act}${mode==='light'?'-light':''}`);root.location.reload();}});
})(window);
