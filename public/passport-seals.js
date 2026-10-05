/* v9.4.0 → v9.7.0: Island Run passport seals.
   v9.7.0 moves seals from the team cards to the students who earned them as navigator (navigator-seals.js,
   shown on the student's award card). The team passport itself still unlocks islands and restores the map;
   this module only reads it. */
(function(root){
 'use strict';
 function sealsFor(className,team){
  const levels=root.LeagueIslandProgress?.snapshot(className)?.[className+'|'+team]||{};
  return Object.keys(levels).map(Number).filter(n=>n>=1&&n<=10).sort((a,b)=>a-b).map(n=>({island:n,stars:levels[n].stars||1}));
 }
 // Team cards no longer carry a seal chip; remove any left by an earlier version of this page.
 function render(){for(const el of document.querySelectorAll?.('.passport-seals,.mobile-passport-seals')||[])el.remove();}
 function configure(){render();}
 root.LeaguePassportSeals=Object.freeze({configure,render,sealsFor,fromRun(){}});
})(window);
