const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../public');
const hook=`
window.__qa={
 start:window.startHostMode,
 state(){return {powerupsByTeam:Object.fromEntries(teamsData.map(t=>[t.id,{...t.powerups}])),pointsByTeam:Object.fromEntries(teamsData.map(t=>[t.id,t.points])),levelsByTeam:Object.fromEntries(teamsData.map(t=>[t.id,t.level])),sessionId,secretAgents,selectedClass,studentContributions,remoteStudentClass,remoteStudentContributions,pointValue:currentPointValue,tierIndex:selectedPointTierIndex,mode:performanceMode,scene:LeagueScenes.active,paused:LeagueScenes.paused,points:teamsData.map(t=>t.points),levels:teamsData.map(t=>t.level),mission:{...classMission},wave:unityAscensionState?.wave,tiers:[...pointSliderValues],combo:comboCount,wheels:pendingAnimatedWheels.length,activeWheel:activeAnimatedWheel,spin:Boolean(activeWheelSpin),wheelSettled:Boolean(activeWheelSpin?.settled),wheelResult:document.getElementById('wheel-result-card')?.classList.contains('revealed')?document.getElementById('wheel-result')?.textContent:null,wheelTimer:Boolean(wheelAdvanceTimer),wheelMilestones:Object.fromEntries(teamsData.map(t=>[t.id,[...t.wheelMilestonesReached]])),pendingFinish:pendingAnimatedFinish,held:presentationHeld,clocks:SceneRuntime.diagnostics(),ledger:commandLedger,boardSummaries,remoteRecords:{cachedLeaderboardRecord,cachedBattleRecord},remotePending:remoteCommands.pending,battle:battleState&&{running:battleState.running,hp:battleState.fighters.map(f=>f.hp),max:battleState.fighters.map(f=>f.maxHP)},raid:vixarRaidState&&{running:vixarRaidState.running,completed:vixarRaidState.completed,stage:vixarRaidState.finaleStage,hp:vixarRaidState.boss.hp,finalAttack:vixarRaidState.finalAttackUsed,guardian:vixarRaidState.guardianJoined,seals:Object.values(vixarRaidState.seals).map(s=>({broken:s.broken,locked:s.locked})),damage:vixarRaidState.fighters.map(f=>f.raidDamage),fighters:vixarRaidState.fighters.map(f=>({hp:f.hp,max:f.maxHP,alive:f.alive,revived:f.revived}))}};},
 mode:setPerformanceMode,points:id=>teamsData.find(t=>t.id===id).points,
 seed(level=10,points=1000){abandonScenes();cancelAnimatedPresentation();currentEvent=null;recoveryRestoring=true;teamsData.forEach(t=>{LeagueRules.resetTeam(t);t.level=level;t.traits=teamTraits[t.id].slice(0,level).map(v=>v.id);t.points=points;t.hasRelic=level>=5;t.cachedSVG='';});updateGameState(true);recoveryRestoring=false;checkpointNow();},
 selectClass:setSessionClass,resetTeam:resetTeamAction,studentAward:(team,id)=>applyTeamAward(team,{studentId:id}),custom:applyCustomPoints,renderContributors:renderChampionContributors,
 creditCustom:(teamId,id,points)=>applyCustomPoints(teamsData.find(t=>t.id===teamId),points,LeagueStudents.student(selectedClass,teamId,id)),
 award:applyTeamAward,reset:resetSessionState,checkpoint:checkpointNow,
 mission(){setSessionClass(selectedClass||'5-A');LeagueStudents.teams.flatMap(id=>LeagueStudents.members(selectedClass,id)).slice(0,15).forEach(person=>LeagueStudents.credit(studentContributions,person,10));syncParticipationMission();},
 queue(){queueSubjectWheel('gryffindor',5);queueSubjectWheel('slytherin',5);queueSubjectWheel('hufflepuff',5);},closeWheel:requestWheelClose,
 arena:startFinalBattle,
 arenaOutcome(kind){const [a,b]=battleState.fighters;b.hp=b.maxHP;b.alive=true;b.guardUntil=kind==='partial'?SceneRuntime.now()+2000:0;b.invulnerableUntil=kind==='blocked'?SceneRuntime.now()+2000:0;b.shieldHP=0;ArenaMotion.attack(a,b,{impact:420});scheduleBattleTask(()=>kind==='evaded'?performEvade(b,a.id):applyBattleDamage(a,b,20),420);return b.id;},
 raidVisual(id){const target=document.getElementById('vixar-boss-stage');RaidMotion.move(id,'attack',target);RaidMotion.bolt(RaidMotion.node(id),target,'#fff',500);},

 raid(mission=true){Object.assign(classMission,{completed:mission,rewardGranted:mission,progress:mission?15:0});updateClassMissionUI();startVixarRaid();},
 unityReward(){Object.assign(classMission,{completed:true,rewardGranted:false,progress:15});startUnityEvent(false);},
 unityReplay(){Object.assign(classMission,{completed:true,rewardGranted:true});startUnityEvent(true);},
 raidHit(breakSeals=false){raidClock.clear();if(breakSeals)Object.values(vixarRaidState.seals).forEach(s=>{s.broken=true;s.hp=0;});vixarRaidState.boss.shieldHP=0;return vixarApplyBossDamage(vixarRaidState.fighters[0],100);},
 raidThreshold(){Object.values(vixarRaidState.seals).forEach(s=>{s.broken=true;s.hp=0;});vixarRaidState.boss.hp=420;beginVixarFinalAttack();},
 connect(role){remoteRole=role;const conn={open:true,_stateReady:true,_syncToken:'test-token',on(event,handler){if(event==='data')window.__receive=handler;},send(message){window.__messages.push(message);window.__send?.(message);}};window.__messages=[];window.remoteConnection=conn;window.setupConnectionData(conn,role);setRemoteConnectionStatus('connected');if(role==='host')window.syncStateToController();},
 command(action,team,sequence=1,clientId='test-client',sid=sessionId,extra={}){window.__receive({className:selectedClass,studentId:LeagueStudents.members(selectedClass,team)[0]?.id,...extra,type:'ACTION',protocol:7,sessionId:sid,action,team,clientId,sequence,commandId:clientId+':'+sequence});},
 phone(action,team){return window.sendRemoteAction(action,team);},remoteSession(){return latestRemoteSessionId;},
 disconnect(){remoteCommands.disconnect();window.remoteConnection=null;},
 failedConnection(){
  remoteRole='controller';activeRoomCode='1234';window.remoteConnection=null;controllerConnectInProgress=false;
  const handlers={};const conn={open:false,on(name,callback){handlers[name]=callback;},close(){this.open=false;handlers.close?.();}};
  window.peer={connect(){return conn;}};connectControllerToHost();handlers.error(new Error('simulated channel failure'));
  const retried=Boolean(reconnectTimer)&&!controllerConnectInProgress&&pendingControllerConnection===null;
  conn.open=true;handlers.open();const lateIgnored=window.remoteConnection===null&&!conn.open;
  clearReconnectTimer();return {retried,lateIgnored,state:remoteConnectionState};
 },
 record(){window.broadcastMatchSummaryToController('LEADERBOARD_FINAL');},
 finish:finishFinalBattle,
 settleScene(){LeagueScenes.skip();},
 hidden(value){Object.defineProperty(document,'hidden',{configurable:true,value});document.dispatchEvent(new Event('visibilitychange'));}
};`;
async function setup({autoUnlock=true,time=null,rosterHandler=null}={}){
 const access=await import('../netlify/functions/access-time.mjs');let serverTime=time;
 const server=http.createServer(async(req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/api/roster'&&rosterHandler){let body='';for await(const chunk of req)body+=chunk;const reply=await rosterHandler(new Request('http://localhost'+url,{method:req.method,headers:{'Content-Type':'application/json'},body}));res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(await reply.text());return;}
  if(url==='/api/access-time'){let body='';for await(const chunk of req)body+=chunk;const reply=await access.handleAt(new Request('http://localhost'+url,{method:req.method,...(req.method==='POST'?{body,headers:{'Content-Type':'application/json'}}:{})}),serverTime??Date.now());res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(await reply.text());return;}
  if(url==='/api/turn-credentials'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({iceServers:[{urls:['stun:example.invalid']},{urls:['turn:example.invalid'],username:'test',credential:'test'}],expiresIn:21600}));return;}
  const file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  let data=fs.readFileSync(file);if(file.endsWith('/game.js')){const str=data.toString(),i=str.lastIndexOf('    });');data=Buffer.from(str.slice(0,i)+hook+str.slice(i));}
  if(file.endsWith('/vendor/peerjs.min.js'))data=Buffer.from('window.Peer=class {constructor(){setTimeout(()=>this.handlers?.open?.("test"),10)} on(n,f){this.handlers??={};this.handlers[n]=f} connect(){return {open:false,on(){}}} reconnect(){} };');
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(data);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const launchOptions={headless:true};
 if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 if(process.env.PLAYWRIGHT_CHROMIUM_ARGS)launchOptions.args=JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS);
 const browser=await chromium.launch(launchOptions);
 const errors=[],missing=[];
 async function page(context=null){const ctx=context||await browser.newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await p.goto(base);await p.waitForFunction(()=>Boolean(window.__qa));if(autoUnlock){await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);await p.locator('#access-code').fill(access.codesAt(serverTime??Date.now()).normal);await p.locator('#access-submit').click();await p.waitForFunction(()=>LeagueAccess.granted);}return p;}
 return {browser,server,base,page,errors,missing,setTime:n=>{serverTime=n;},codes:()=>access.codesAt(serverTime??Date.now()),close:async()=>{await browser.close();server.close();}};
}
module.exports={setup,root};
