/* v10.5: shared presentation only. Gameplay remains the sole authority for points and HP. */
(function(root){
 'use strict';
 const teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 const bosses=['veyr','tickthorn','mirrath','rootmaw','vox','kaelis','morrow','noctryn','ferron','astrax'];
 const teamStates=['ready','attack','guard','hit','proud','support','runA','runB','jump'];
 const bossStates=['ready','attack','guard','hit','exposed','defeat'];
 const vixarStates=['ready','charge','cast','guard','exposed','hit','ultimate','defeat','proud'];
 const level=n=>Math.max(0,Math.min(12,Math.floor(Number(n)||0)));
 // v11.0.0: Scarlet and Gilded Vixar use the Vixar states. Slyffindor and Huffleclaw (the Merge Spell's fused teams)
 // use the team states once their sheets are added; until then the two Level 12 creatures act together.
 const vixarForms=['vixar','vixar-scarlet','vixar-gilded'],merged=['slyffindor','huffleclaw'];
 const base=root.document?new URL('./assets/poses/',document.currentScript?.src||document.baseURI).href:'./assets/poses/';
 // Ten pose sheets stay decoded: four teams at their current and next level (8), plus an island boss and Vixar.
 const MAX_SHEETS=10;
 const cache=new Map(),jobs=new WeakMap(),health=new WeakMap(),live=new Set();let serial=0,epoch=0,resultEpoch=0;
 const now=()=>root.SceneRuntime?.now?.()??performance.now();
 const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const squareByCSS=Boolean(root.CSS?.supports?.('aspect-ratio','1 / 1'));
 const clock=root.SceneRuntime?.create('creature-poses',{pause:()=>clear()});
 function pack(id,n=0){
  if(teams.includes(id))return {key:id+'-'+level(n),cols:3,rows:3,states:teamStates};
  if(bosses.includes(id))return {key:id,cols:3,rows:2,states:bossStates};
  if(merged.includes(id))return {key:id,cols:3,rows:3,states:teamStates};
  return vixarForms.includes(id)?{key:id,cols:3,rows:3,states:vixarStates}:null;
 }
 // The tag of each picture: the v10.5.0 sheets keep theirs, so boards that already have them do not download them again.
 const tag=key=>/^vixar-(scarlet|gilded)$/.test(key)?'11.0.0-art1':/-1[12]$|^slyffindor$|^huffleclaw$/.test(key)?'11.0.0':'10.5.0';
 function load(id,n){
  const p=pack(id,n);if(!p||typeof root.Image!=='function')return Promise.resolve(null);
  let e=cache.get(p.key);if(e){cache.delete(p.key);cache.set(p.key,e);return e.promise;}
  const img=new root.Image();e={...p,img,url:base+p.key+'.webp?v='+tag(p.key),ready:false,promise:null};
  // A Level 11 or 12 sheet that fails to load falls back to the Level 10 sheet; the original avatar stays visible meanwhile.
  const fallback=teams.includes(id)&&level(n)>10;
  e.promise=new Promise(resolve=>{img.onload=()=>{(img.decode?.()||Promise.resolve()).catch(()=>{}).then(()=>{e.ready=true;resolve(e);});};
   img.onerror=()=>{if(cache.get(p.key)===e)cache.delete(p.key);if(fallback){e.fallback=10;load(id,10).then(resolve);}else resolve(null);};});
  cache.set(p.key,e);img.src=e.url;while(cache.size>MAX_SHEETS)cache.delete(cache.keys().next().value);return e.promise;
 }
 function loaded(id,n){const p=pack(id,n),e=p&&cache.get(p.key);return e?.ready?e:null;}
 function canonical(p,state){if(p.states.includes(state))return state;return ({charge:'ready',cast:'attack',revive:'proud',knockout:vixarForms.includes(p.key)||bosses.includes(p.key)?'defeat':'hit',fatigue:'guard',landing:'guard',acknowledge:'support',arrive:'ready',ultimate:'attack'})[state]||'ready';}
 function index(p,state){return Math.max(0,p.states.indexOf(canonical(p,state)));}
 function frame(e,state){const i=index(e,state),w=e.img.naturalWidth/e.cols,h=e.img.naturalHeight/e.rows;return {x:i%e.cols*w,y:Math.floor(i/e.cols)*h,w,h};}
 function draw(ctx,e,state,x,y,w,h,flip=false){
  if(!e?.ready)return false;const f=frame(e,state);
  if(flip){ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(e.img,f.x,f.y,f.w,f.h,0,0,w,h);ctx.restore();}
  else ctx.drawImage(e.img,f.x,f.y,f.w,f.h,x,y,w,h);return true;
 }
 function after(fn,ms){return clock?clock.after(fn,ms):setTimeout(fn,ms);}
 function cancel(timer){if(clock)clock.cancel(timer);else clearTimeout(timer);}
 function reset(el){const j=jobs.get(el);if(j){cancel(j.timer);jobs.delete(el);}live.delete(el);el?.querySelector?.(':scope > .creature-pose-layer')?.remove();if(el){delete el.dataset.creaturePose;delete el.dataset.creatureFacing;}}
 function clear(host){epoch++;for(const el of [...live])if(!host||host===el||host.contains(el))reset(el);if(!host)clock?.clear();}
 function show(el,state,options={}){
  if(!el?.isConnected||root.document?.hidden||root.SceneRuntime?.fastForwarding||root.SceneRuntime?.paused)return false;
  const id=options.id||el.dataset.avatarTeam,n=options.level??el.dataset.avatarLevel,p=pack(id,n);if(!p)return false;
  const priority=options.priority??({hit:60,knockout:100,defeat:100,guard:70,attack:50,ultimate:90}[state]||20),old=jobs.get(el);
  if(old&&old.priority>priority&&old.until>now())return false;if(old)cancel(old.timer);
  const duration=Math.max(100,options.duration??750),j={token:++serial,priority,until:now()+duration,timer:null};jobs.set(el,j);live.add(el);
  const apply=e=>{
   if(!e||jobs.get(el)!==j||!el.isConnected||now()>=j.until)return;
   let layer=el.querySelector(':scope > .creature-pose-layer');if(!layer){layer=document.createElement('span');layer.className='creature-pose-layer';layer.setAttribute('aria-hidden','true');el.appendChild(layer);}
   // The layer is square and fitted inside the avatar box by CSS (aspect-ratio), so showing a pose never measures
   // the page. Browsers without aspect-ratio (before Chrome 88 / Safari 15) still measure once.
   if(!squareByCSS){const side=Math.min(el.clientWidth,el.clientHeight);if(side>0){layer.style.width=side+'px';layer.style.height=side+'px';}}
   const i=index(e,state);layer.style.backgroundImage=`url("${e.url}")`;layer.style.backgroundSize=`${e.cols*100}% ${e.rows*100}%`;
   layer.style.backgroundPosition=`${i%e.cols/(e.cols-1)*100}% ${Math.floor(i/e.cols)/(e.rows-1)*100}%`;
   el.dataset.creaturePose=canonical(e,state);if(options.facing)el.dataset.creatureFacing=options.facing;else delete el.dataset.creatureFacing;
  };
  const e=loaded(id,n);if(e)apply(e);else load(id,n).then(apply);
  j.timer=after(()=>{if(jobs.get(el)===j)reset(el);},duration);return true;
 }
 function avatars(host){return host?[...(host.matches?.('.animated-avatar')?[host]:[]),...host.querySelectorAll('.animated-avatar')]:[];}
 function act(host,state,options){avatars(host).forEach(el=>show(el,state,options));}
 function exchange(host,impact=420){const ticket=epoch;act(host,'ready',{duration:impact,priority:45});after(()=>{if(epoch===ticket)act(host,'attack',{duration:Math.max(260,impact-60),priority:50});},Math.min(120,impact*.3));}
 function board(id,kind){if(root.LeagueScenes?.active&&root.LeagueScenes.active!=='evolution')return;const state=/negative|debuff/.test(kind)?'hit':/shield/.test(kind)?'guard':/leader|rank|evolution|large|relic/.test(kind)?'proud':'support';act(document.getElementById('mascot-'+id),state,{duration:state==='proud'?1450:850});}
 function boardLater(id,kind,delay=830){const ticket=epoch;after(()=>{if(epoch===ticket)board(id,kind);},delay);}
 function arena(id,kind,impact){const host=document.getElementById('battle-shell-'+id);if(kind==='revive')clear(host);if(kind==='attack')exchange(host,impact);else act(host,kind,{duration:kind==='knockout'?60000:kind==='guard'?650:kind==='revive'?1100:500});}
 // Read health only. One bracing response on entering the low-HP band, never a per-tick animation.
 function healthChanged(scene,id,hp,maxHP){const host=document.getElementById((scene==='arena'?'battle-shell-':'vixar-avatar-shell-')+id);if(!host||!maxHP)return;const low=hp>0&&hp/maxHP<=.25,was=health.get(host);health.set(host,low);if(low&&!was)act(host,'fatigue',{duration:1100,priority:15});}
 function raid(id,kind,impact,options={}){
  if(id==='guardian')return;
  if(id==='boss'){
   const el=document.getElementById('vixar-animated-actor');if(!el||(!document.body.classList.contains('performance-animated')&&!document.getElementById('vixar-raid-overlay')?.classList.contains('saga-form-art')))return;
   const state=kind==='attack'?'cast':kind==='cast'?'charge':kind==='arrive'?'ready':kind;
   const poseOptions={id:el.dataset.poseId||'vixar',duration:options.duration||(kind==='knockout'?12000:kind==='ultimate'?1450:kind==='guard'?800:kind==='hit'?310:650),priority:({attack:55,cast:35,hit:60,guard:70,ultimate:90,knockout:100})[kind]||20};
   if(kind==='attack'&&options.releaseAt){
    const ticket=epoch,release=Math.max(20,options.releaseAt);
    if(show(el,'charge',{...poseOptions,duration:release}))after(()=>{if(ticket===epoch)show(el,'cast',{...poseOptions,duration:Math.max(100,poseOptions.duration-release)});},release);
   }else show(el,state,poseOptions);
  }else{const host=document.getElementById('vixar-avatar-shell-'+id);if(kind==='revive')clear(host);if(kind==='attack')exchange(host,impact||520);else act(host,kind,{duration:kind==='knockout'?60000:kind==='revive'?1100:650});}
 }
 function bossState(b,hit=false){return b?.defeated||b?.state==='defeated'?'defeat':hit?'hit':({arrive:'ready',warn:'ready',strike:'attack',expose:'exposed',counter:'guard',knockout:'attack'})[b?.state]||'ready';}
 function runnerState(run,impact=false,landing=0,quiet=false){
  if(run.boss?.state==='knockout')return 'hit';if(run.jumpAge>=0)return 'jump';if(impact)return 'hit';if(landing>.16)return 'landing';
  if(run.boss?.defeated||run.phase==='won')return 'proud';if(run.phase==='boss')return run.boss?.shots?.some(s=>s.age<.22)?'attack':run.focusShield?'guard':'ready';
  if(run.phase!=='course')return 'ready';if(run.paused||quiet||reduced())return 'runA';return Math.floor(run.time*(run.gate?1.15:1.8))%2?'runB':'runA';
 }
 function resultPlan(rows,arenaId,leagueIds){
  if(!rows.length)return [];const events=[{at:200,kind:'champions',ids:[...new Set([...leagueIds,arenaId].filter(Boolean))]}],max=Math.max(...rows.map(t=>t.points)),min=Math.min(...rows.map(t=>t.points));
  if(max===min){events.push({at:2400,kind:'together',ids:rows.map(t=>t.id)});return events;}
  const groups=new Map();rows.forEach(t=>{const g=groups.get(t.points)||[];g.push(t.id);groups.set(t.points,g);});let at=2400;
  for(const ids of groups.values())if(ids.length>1){events.push({at,kind:'tie',ids});at+=2400;}
  const lows=rows.filter(t=>t.points===min).map(t=>t.id),supporter=rows.find(t=>t.points>min&&t.id!==arenaId)?.id||rows.find(t=>t.points>min)?.id;
  if(supporter)events.push({at,kind:'encourage',ids:[supporter,...lows]});return events;
 }
 let resultTimers=new Set();
 function stopResults(){resultEpoch++;resultTimers.forEach(cancel);resultTimers.clear();if(root.document)clear(document.getElementById('winner-overlay'));}
 function results(rows,arenaId,leagueIds){
  stopResults();const ticket=resultEpoch,plan=resultPlan(rows,arenaId,leagueIds),host=document.getElementById('winner-overlay');if(!host)return;
  const actors=(id,small=false)=>[...host.querySelectorAll(`${small?'#all-team-recognition-grid ':''}.animated-avatar[data-avatar-team="${id}"]`)];
  const queue=(fn,at)=>{let timer=after(()=>{resultTimers.delete(timer);if(ticket===resultEpoch&&root.LeagueScenes?.active==='results'&&!root.LeagueIslandRun?.isOpen)fn();},at);resultTimers.add(timer);};
  for(const e of plan)queue(()=>{
   if(e.kind==='champions'){e.ids.forEach(id=>actors(id).forEach(el=>show(el,'proud',{duration:1900})));return;}
   if(e.kind==='together'){e.ids.forEach(id=>actors(id,true).forEach(el=>show(el,'support',{duration:1900})));return;}
   if(e.kind==='tie'){
    const tied=e.ids.flatMap(id=>actors(id,true)),middle=tied.reduce((sum,el)=>sum+el.getBoundingClientRect().left,0)/Math.max(1,tied.length);
    tied.forEach(el=>show(el,'ready',{duration:900,facing:el.getBoundingClientRect().left>middle?'left':'right'}));
    queue(()=>e.ids.forEach(id=>actors(id,true).forEach(el=>show(el,'support',{duration:1100}))),950);return;
   }
   const [source,...recipients]=e.ids,from=actors(source,true)[0];
   recipients.forEach(id=>actors(id,true).forEach(el=>show(el,'ready',{duration:1100,facing:from&&el.getBoundingClientRect().left>from.getBoundingClientRect().left?'left':'right'})));
   actors(source,true).forEach(el=>{const target=actors(recipients[0],true)[0];show(el,'support',{duration:1300,facing:target&&target.getBoundingClientRect().left<el.getBoundingClientRect().left?'left':'right'});});
   queue(()=>recipients.forEach(id=>actors(id,true).forEach(el=>show(el,'proud',{duration:1500}))),1400);
  },e.at);
 }
 root.document?.addEventListener('league-scene-change',()=>{clear();if(root.LeagueScenes?.active!=='results')stopResults();});
 root.document?.addEventListener('visibilitychange',()=>{if(document.hidden){clear();stopResults();}});
 root.document?.addEventListener('league-pause-change',()=>{if(root.SceneRuntime?.paused){clear();stopResults();}});
 root.addEventListener?.('pagehide',()=>{clear();stopResults();cache.clear();});
 root.addEventListener?.('resize',()=>clear());
 const api={pack,load,preload:load,loaded,frame,draw,show,act,clear,board,boardLater,arena,raid,healthChanged,results,stopResults,bossState,runnerState,resultPlan,diagnostics:()=>({maxSheets:MAX_SHEETS,cached:cache.size,active:live.size,results:resultTimers.size})};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.CreaturePoses=api;
})(typeof globalThis!=='undefined'?globalThis:this);
