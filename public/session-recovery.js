/* Atomic session checkpoints; generated artwork and secrets are excluded by the game adapter. */
(function(root){
    'use strict';
    const KEY='englishLeague.session.v7',IDS=['gryffindor','slytherin','hufflepuff','ravenclaw'];
    const uid=()=>crypto.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    function valid(s){
        return s&&s.schema===7&&typeof s.sessionId==='string'&&s.sessionId.length<120&&Number.isFinite(s.savedAt)
            &&Array.isArray(s.teams)&&s.teams.length===4&&new Set(s.teams.map(t=>t.id)).size===4
            &&s.teams.every(t=>IDS.includes(t.id)&&Number.isFinite(t.points)&&Number.isInteger(t.level)&&t.level>=0&&t.level<=12&&Array.isArray(t.traits)&&t.traits.length<=12)
            &&Array.isArray(s.pointSliderValues)&&s.pointSliderValues.length===4&&s.pointSliderValues.every(n=>Number.isFinite(n)&&n>0)
            &&s.classMission&&Number.isFinite(s.classMission.progress)&&Number.isFinite(s.classMission.target)&&s.classMission.target>0;
    }
    function read(){try{const text=localStorage.getItem(KEY);if(!text||text.length>1500000)return null;const s=JSON.parse(text);return valid(s)?s:null;}catch{return null;}}
    function save(state){try{const s={...state,schema:7,savedAt:Date.now()};if(!valid(s))return false;localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
    function available(){try{const key=KEY+'.probe';localStorage.setItem(key,'1');localStorage.removeItem(key);return true;}catch{return false;}}
    root.LeagueRecovery={uid,read,save,available};
})(window);
