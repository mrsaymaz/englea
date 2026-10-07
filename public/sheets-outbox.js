/* Apps Script v8.9.0 confirms writes and deduplicates session IDs. Persist payloads without PINs. Never retry an ambiguous POST automatically. */
(function(root){
    'use strict';
    const KEY='englishLeague.sheets.v7';let entries=[],storageOK=true;
    try{const stored=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(stored))entries=stored.filter(e=>e&&typeof e.id==='string'&&e.payload&&typeof e.payload==='object'&&!('pin' in e.payload)).slice(-30);}catch{storageOK=false;}
    // A tab closed during POST cannot know whether the server stored the row.
    entries.forEach(e=>{if(e.state==='sending'||(e.state==='sent'&&!e.confirmed))e.state='uncertain';});
    const pins=new Map(),inFlight=new Set();let endpoint='',onChange=()=>{};
    function persist(){try{localStorage.setItem(KEY,JSON.stringify(entries));storageOK=true;}catch{storageOK=false;}onChange();}
    function add(id,payload,{refresh=false}={}){
        let entry=entries.find(e=>e.id===id);if(entry){if(refresh&&!inFlight.has(id)){const {pin,...safe}=payload;entry.payload=safe;entry.state='waiting';entry.confirmed=false;entry.error='';persist();}return entry;}
        const {pin,...safe}=payload;
        if(entries.length>=30){const removable=entries.findIndex(e=>e.state==='sent');if(removable<0)throw new Error('The result outbox is full. Save the pending lessons first.');entries.splice(removable,1);}
        entry={id,payload:safe,state:'waiting',createdAt:Date.now(),updatedAt:Date.now()};entries.push(entry);persist();return entry;
    }
    async function send(entry,pin,{retry=false}={}){
        if(!entry||!pin||inFlight.has(entry.id))return entry;
        if(['sent','uncertain'].includes(entry.state)&&!retry)return entry;
        pins.set(entry.id,pin);
        if(navigator.onLine===false){entry.state='waiting';persist();return entry;}
        inFlight.add(entry.id);entry.error='';entry.state='sending';entry.updatedAt=Date.now();persist();
        const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),28000);
        try{
            const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...entry.payload,pin}),signal:abort.signal});
            const result=await response.json();
            if(!response.ok||result.status!=='success'){entry.state=result.uncertain?'uncertain':'waiting';entry.error=result.message||'Save failed. Check your PIN and retry.';}
            else {entry.state='sent';entry.confirmed=true;entry.error='';root.LeagueIslandProgress?.rememberPin(pin);if(result.islandProgress)root.LeagueIslandProgress?.acknowledge(entry.payload.className,result.islandProgress);if(Array.isArray(result.navigatorSeals))root.LeagueNavigatorSeals?.merge(entry.payload.className,result.navigatorSeals);if(result.season)root.LeagueSeason?.accept(result.season);if(result.saga)document.dispatchEvent(new CustomEvent('league-saga-loaded',{detail:{className:entry.payload.className,saga:result.saga}}));}
        }catch{entry.state='uncertain';}
        finally{clearTimeout(timer);inFlight.delete(entry.id);pins.delete(entry.id);entry.updatedAt=Date.now();persist();}
        return entry;
    }
    addEventListener('online',()=>{for(const entry of entries)if(entry.state==='waiting'&&pins.has(entry.id))send(entry,pins.get(entry.id));});
    root.LeagueOutbox={configure(url,listener){endpoint=url;onChange=listener;persist();},add,send,find:id=>entries.find(e=>e.id===id),list:()=>entries.map(e=>({...e})),get storageOK(){return storageOK;},labels:{waiting:'Saved locally · waiting to send',sending:'Sending…',sent:'Saved to Google Sheets',uncertain:'Delivery uncertain · check before retrying'}};
})(window);
