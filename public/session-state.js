/* Bounded Undo history; generated artwork and credentials are excluded. */
(function(root){
    'use strict';
    function push(history,value){const snapshot={schemaVersion:1,...value,teamsData:value.teamsData.map(t=>({...t,cachedSVG:''}))};history.push(JSON.stringify(snapshot));if(history.length>20)history.shift();return snapshot;}
    function pop(history){return history.length?JSON.parse(history.pop()):null;}
    root.LeagueSession=Object.freeze({push,pop});
})(window);
