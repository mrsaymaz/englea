(function(root){
 'use strict';let getContext=()=>null,baselines={};const KEY='englishLeague.expeditionBaselines.v9';
 try{baselines=JSON.parse(sessionStorage.getItem(KEY)||'{}');if(!baselines||typeof baselines!=='object'||Array.isArray(baselines))baselines={};}catch{}
 function begin(sessionId,className,progress){const key=sessionId+'|'+className;if(baselines[key])return;baselines[key]=JSON.parse(JSON.stringify(progress));const entries=Object.entries(baselines).slice(-8);baselines=Object.fromEntries(entries);try{sessionStorage.setItem(KEY,JSON.stringify(baselines));}catch{}render();}
 function render(){
  const c=getContext(),section=document.getElementById('expedition-recap');if(!section)return;section.hidden=!c?.className;if(!c?.className)return;
  const data=LeagueAdventure.summary(c.progress,c.className,baselines[c.sessionId+'|'+c.className]||c.progress);
  document.getElementById('expedition-recap-title').textContent=c.className+' · Our living islands';
  document.getElementById('expedition-recap-line').textContent=(data.today?data.today+' new team '+(data.today===1?'completion':'completions')+' today · ':'')+data.restored+' / 10 islands restored together';
  document.getElementById('expedition-recap-teams').replaceChildren(...data.teams.map(team=>{const item=document.createElement('span');item.style.setProperty('--team-color',LeagueAdventure.colors[team.team]);item.textContent=LeagueAdventure.marks[team.team]+' '+team.name+' · '+team.completed+'/10'+(team.today?' (+'+team.today+')':'');return item;}));
  const next=LeagueAdventure.nextIsland(c.progress,c.className,c.house||'gryffindor'),unit=root.RunnerContent?.grades?.[Number(c.className[0])]?.[next-1];
  document.getElementById('expedition-recap-next').textContent=next>10?'Every island is open to your champion. The next adventure is yours to choose.':'Next adventure: '+(unit?unit.title+' · '+unit.theme:'Island '+next)+' awaits '+LeagueAdventure.names[c.house||'gryffindor']+'.';
 }
 document.addEventListener('league-scene-change',render);
 root.LeagueRecap={begin,render,configure(callback){getContext=callback;}};
})(window);
