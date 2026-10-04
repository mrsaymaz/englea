(function(root){
 'use strict';
 const teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 const colors={gryffindor:'#fb7185',hufflepuff:'#fbbf24',slytherin:'#34d399',ravenclaw:'#38bdf8'};
 const names={gryffindor:'Gryffindor',hufflepuff:'Hufflepuff',slytherin:'Slytherin',ravenclaw:'Ravenclaw'};
 const marks={gryffindor:'◆',hufflepuff:'≋',slytherin:'❧',ravenclaw:'◈'};
 const count=(progress,c,team)=>Object.keys(progress?.[c+'|'+team]||{}).filter(id=>/^(10|[1-9])$/.test(id)&&progress[c+'|'+team][id]?.stars>0).length;
 function restoration(progress,c,island){const done=teams.filter(team=>progress?.[c+'|'+team]?.[island]?.stars>0);return {teams:done,stage:done.length,restored:done.length>0};}
 function nextIsland(progress,c,team){let n=1;while(n<=10&&progress?.[c+'|'+team]?.[n]?.stars>0)n++;return n;}
 function summary(progress,c,before={}){const totals=teams.map(team=>({team,name:names[team],completed:count(progress,c,team),today:Math.max(0,count(progress,c,team)-count(before,c,team))}));return {teams:totals,restored:Array.from({length:10},(_,i)=>restoration(progress,c,i+1)).filter(v=>v.restored).length,today:totals.reduce((s,t)=>s+t.today,0)};}
 function restorationText(realm,stage){
  const states={forest:['The woodland is dark.','The first lanterns return.','The forest paths glow.','Ancient roots awaken.','The whole forest shines.'],harbour:['The harbour lies silent.','The beacon is lit.','The dock is repaired.','The sails return.','The harbour welcomes every team.'],sky:['The observatory is silent.','The telescope awakens.','Its lens catches starlight.','The constellations return.','All four elements light the sky.'],coast:['The crossing is broken.','The bridge is restored.','The coast lights up.','Safe waters return.','The crossing belongs to all four teams.']};
  return (states[realm]||['The old stronghold waits.','Its gates reopen.','Its windows glow.','The banners rise.','All four teams have restored the stronghold.'])[Math.max(0,Math.min(4,stage))];
 }
 const api={teams,colors,names,marks,count,restoration,nextIsland,summary,restorationText};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LeagueAdventure=api;
})(typeof globalThis!=='undefined'?globalThis:this);
