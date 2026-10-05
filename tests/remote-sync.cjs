const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require.resolve('../public/game.js'),'utf8');
const block=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const {wire}=require('./peerjs-wire.cjs');
const rosterContext={};rosterContext.window=rosterContext;vm.createContext(rosterContext);vm.runInContext(fs.readFileSync(require.resolve('../public/student-rosters.js'),'utf8'),rosterContext);
const students=rosterContext.LeagueStudents.defaults(),catalog={schema:1,version:1,revision:'a'.repeat(64),students};
assert.match(source,/peer\.connect\('class6d-' \+ activeRoomCode, \{ reliable:true, serialization:'binary' \}\)/);
const jobs=[],messages=[];let dropState=2,dropAck=1;
function environment(role){
 const timers=new Map();let timerId=0,handler;const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{innerText:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){}});return nodes.get(id);};
 const connection={open:true,_syncToken:role+'-token',_stateReady:false,on(name,f){if(name==='data')handler=f;},send(data){messages.push({role,data});if(data.type==='STATE_SYNC'&&dropState-->0)return;if(data.type==='STATE_SYNC_ACK'&&dropAck-->0)return;transport.send(data);transport.flush();},close(){this.open=false;}};let peer;const transport=wire(data=>jobs.push(()=>peer.receive(data)));

 const c={console:{...console,warn(){}},REMOTE_BUILD:'9.6.0',remoteRole:role,remoteConnection:connection,boardSyncPatched:true,wheelObserverPatched:true,
 setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id),document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},hidden:false},
 remoteConnectionState:'connecting',latestRemoteSessionId:null,lastRemoteActivityAt:0,sessionId:'lesson-1',selectedClass:null,studentContributions:{},secretAgents:{},remoteStudentClass:null,
 teamsData:['gryffindor','slytherin','hufflepuff','ravenclaw'].map((id,i)=>({id,points:i*10,level:0,pendingEvolution:false})),
 classMission:{target:15,progress:0},unityEventRunning:false,unityEventQueued:false,currentPointValue:10,performanceMode:'light',deferredPerformanceMode:null,activeWheelSpin:null,
 LeagueScenes:{active:null,paused:false},LeagueIslandRun:{state:{}},LeagueStudents:{snapshot:()=>students},LeagueRoster:{current:()=>catalog},LeagueIslandProgress:{snapshot:()=>({}),merge(){},valid:()=>false},
 LeagueAgent:{close(){}},LeagueStudentUI:{close(){}},shownAgentRequest:null,pendingRemoteClassSelection:null,cachedLeaderboardRecord:null,cachedBattleRecord:null,pendingRemoteFinish:false,
 closeParticipationSummary(){},updateMobileRecordAvailability(){},updateRemoteSceneControls(){},syncStudentState(){return true;},syncRemoteAgents(){},visualModeNames:{light:'Light'},updateMobileClassMissionUI(){},
 remoteCommands:{sync(){c.commandReady=true;},acknowledge(){}},lastMatchSummaryPayload:null,lastMatchSummaryAcknowledged:false,summaryRetryTimer:null,summaryRetryAttempts:0,turnRelayConfigured:true,
 setRemoteConnectionStatus(state,detail){c.remoteConnectionState=state;c.detail=detail;},setSummaryDeliveryStatus(){},sendMatchSummaryWithRetry(){},persistMobileRecords(){},remoteFinishTimeout:null,
 handleDataConnectionEnded(conn){conn._endHandled=true;c.ended=true;},createControllerPeer(){},connectControllerToHost(){},location:{reload(){}},
 LeagueRemote:{receive(){c.actions=(c.actions||0)+1;return {type:'ACTION_ACK'};}},commandLedger:{},applyRemoteCommand(){},checkpointNow(){}
 };c.window=c;
 c.safeRemoteSend=(data,conn=connection)=>{if(!conn.open)return false;conn.send(data);return true;};
 vm.createContext(c);
 vm.runInContext(block('        // A live data channel','        function stopRemoteHeartbeat'),c);
 vm.runInContext(block('        window.setupConnectionData = function','        window.syncStateToController = function'),c);
 vm.runInContext(block('        window.syncStateToController = function','        window.sendRemoteAction = function'),c);
 return {c,connection,timers,setup(){c.setupConnectionData(connection,role);},receive:data=>handler(data),link:p=>peer=p,tick(){const list=[...timers.values()];timers.clear();list.forEach(f=>f());},el};
}
const phone=environment('controller'),board=environment('host');phone.link(board);board.link(phone);phone.setup();board.setup();
function flush(){let n=0;while(jobs.length){assert(++n<500,'message loop');jobs.shift()();}}
phone.c.startRemoteStateSync(phone.connection,'controller');board.c.startRemoteStateSync(board.connection,'host');flush();
for(let i=0;i<3;i++){phone.tick();board.tick();flush();}
assert.equal(board.c.remoteConnectionState,'connected');assert.equal(phone.c.remoteConnectionState,'connected');assert.equal(phone.c.commandReady,true);assert.equal(phone.el('mobile-score-ravenclaw').innerText,'30');assert.equal(board.timers.size,0);assert.equal(phone.timers.size,0);
// Late approval cannot disable a synchronized phone.
phone.receive({type:'CONNECTION_APPROVED',build:'9.6.0'});assert.equal(phone.c.remoteConnectionState,'connected');flush();
// A stale receipt cannot make a different session/connection ready.
board.connection._stateReady=false;board.c.remoteConnectionState='connecting';board.receive({type:'STATE_SYNC_ACK',build:'9.6.0',sessionId:'old',syncToken:'host-token'});assert.equal(board.connection._stateReady,false);
board.receive({type:'STATE_SYNC_ACK',build:'9.6.0',sessionId:'lesson-1',syncToken:'wrong-token'});assert.equal(board.connection._stateReady,false);
board.receive({type:'ACTION',action:'ADD'});assert.equal(board.c.actions,undefined);flush();
// Applying a state must succeed before controls/commands become ready.
phone.c.syncStudentState=()=>false;phone.receive({type:'STATE_SYNC',build:'9.6.0',protocol:7,sessionId:'lesson-1',syncToken:'host-token',scores:{gryffindor:0,slytherin:10,hufflepuff:20,ravenclaw:30}});assert.equal(phone.c.remoteConnectionState,'connecting');assert.equal(phone.connection._stateReady,false);
phone.c.syncStudentState=()=>true;phone.tick();flush();assert.equal(phone.c.remoteConnectionState,'connected');
// Mixed builds show a specific failure instead of leaving buttons unexplained.
phone.receive({type:'STATE_SYNC',protocol:7,sessionId:'lesson-1'});assert.equal(phone.c.remoteConnectionState,'failed');assert.match(phone.c.detail,/Version mismatch/);assert.equal(phone.timers.size,0);flush();
// Live-but-silent transport times out even if PING/PONG continues.
const silent=environment('controller');silent.link({receive(){}});silent.setup();silent.c.startRemoteStateSync(silent.connection,'controller');for(let i=0;i<11;i++){silent.tick();flush();}assert.equal(silent.c.ended,true);assert.equal(silent.connection.open,false);
assert(messages.some(m=>m.data.type==='STATE_SYNC'&&Buffer.byteLength(JSON.stringify(m.data))>16300));
console.log('PASS full-roster sync through shipped binary serializer and real state handlers: dropped initial states/receipt recover, stale receipts/actions rejected, late approval stays connected, apply failures retry, mixed builds fail clearly, and silent live transport times out.');
