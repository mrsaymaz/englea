const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require.resolve('../public/game.js'),'utf8');
function env(){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerText:'0',textContent:'',style:{},classList:{remove(){},add(){}},disabled:false});return nodes.get(id);};
 const store=new Map(),requests=[],acks=[];let reply={status:'success',islandProgress:{'5-A|gryffindor':{1:{score:800,stars:3}}}},fail=false;
 const ctx={console,JSON,Map,Set,Date,Math,AbortController,setTimeout,clearTimeout,navigator:{onLine:true},addEventListener(){},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:get},
 fetch:async(url,options)=>{requests.push({url,data:JSON.parse(options.body)});if(fail)throw Error('offline');return {ok:true,json:async()=>reply};},
 LeagueIslandProgress:{snapshot:()=>ctx.progress,rememberPin(){},acknowledge:(c,p)=>acks.push({c,p})},
 progress:{'5-A|gryffindor':{1:{score:800,stars:3}}},cachedLeaderboardRecord:{className:'5-A',sessionId:'test-session',standings:[],studentContributions:{teams:{}}},cachedBattleRecord:{className:'5-A',sessionId:'test-session',winner:'Gryffindor'},latestRemoteSessionId:'test-session'};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../public/student-rosters.js'),'utf8'),ctx);ctx.LeagueStudents=ctx.window.LeagueStudents;vm.runInContext(fs.readFileSync(require.resolve('../public/sheets-outbox.js'),'utf8'),ctx);ctx.LeagueOutbox.configure('/api/session',()=>{});
 const start=source.indexOf('        window.submitOfficialRecordFromMobile = async function()');const end=source.indexOf('        // v7 classroom integration',start);vm.runInContext(source.slice(start,end),ctx);
 get('teacher-class-input').value='5-A';get('teacher-record-type').value='FULL_SESSION';
 return {ctx,get,store,requests,acks,setReply:r=>reply=r,setFail:f=>fail=f};
}
(async()=>{
 const e=env();e.get('teacher-pin-input').value='8642';await e.ctx.submitOfficialRecordFromMobile();
 assert.equal(e.requests[0].url,'/api/session');assert.equal(e.requests[0].data.sessionId,'test-session');assert.equal(e.ctx.LeagueOutbox.list()[0].state,'sent');assert.equal(e.acks.length,1);
 assert(![...e.store.values()].join('').includes('8642'));
 e.ctx.progress['5-A|gryffindor'][2]={score:920,stars:2};e.get('teacher-pin-input').value='8642';await e.ctx.submitOfficialRecordFromMobile();
 assert.equal(e.requests[1].data.islandProgress['5-A|gryffindor'][2].score,920);assert.equal(e.ctx.LeagueOutbox.list().length,1);assert.equal(e.requests[0].data.sessionId,e.requests[1].data.sessionId);
 e.setReply({status:'unauthorized',message:'Invalid PIN'});e.get('teacher-pin-input').value='wrong';await e.ctx.submitOfficialRecordFromMobile();assert.equal(e.ctx.LeagueOutbox.list()[0].state,'waiting');assert.match(e.get('mobile-save-status').textContent,/Invalid PIN/);
 e.setFail(true);e.get('teacher-pin-input').value='8642';await e.ctx.submitOfficialRecordFromMobile();assert.equal(e.ctx.LeagueOutbox.list()[0].state,'uncertain');
 e.setFail(false);e.setReply({status:'success'});e.get('teacher-class-input').value='6-C';e.get('teacher-pin-input').value='8642';const count=e.requests.length;await e.ctx.submitOfficialRecordFromMobile();assert.equal(e.requests.length,count);assert.match(e.get('mobile-save-status').textContent,/5-A/);
 console.log('PASS actual remote save uses latest post-Arena progress, refreshes the same outbox record, confirms server results, rejects a wrong class, and never persists PINs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
