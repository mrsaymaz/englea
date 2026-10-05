/* v10.1.0 dependency-free checks: the one-step Teacher sign-in (PIN beside the room code, used after Allow) and
   every place that reuses it. The full phone + board flow runs in Chromium in teacher-signin.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
function teacher({roster,connected=false,remote=true}={}){
 const listeners={},calls={roster:[],islands:[]},nodes={};
 const node=id=>nodes[id]??={id,hidden:true,textContent:'',dataset:{}};
 const window={LeagueRoster:{signIn:async pin=>{calls.roster.push(pin);return roster(pin);}},LeagueIslandProgress:{signIn:pin=>calls.islands.push(pin)}};
 const ctx={window,setTimeout:()=>0,clearTimeout:()=>{},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail;}},Promise,String,Boolean,
  document:{getElementById:node,addEventListener:(k,f)=>{(listeners[k]??=[]).push(f);},dispatchEvent:()=>{}}};
 vm.createContext(ctx);vm.runInContext(pub('teacher-signin.js'),ctx);
 const T=window.LeagueTeacher;T.configure({ready:()=>connected,remote:()=>remote});return {T,calls,node,connect(){connected=true;T.connected();}};
}
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
await test('The PIN waits for Allow, then signs in once: names first, then the class’s islands, seals and season',async()=>{
 const t=teacher({roster:()=>({ok:true})});
 t.T.start(' 2595 ');assert.equal(t.T.state,'pending');assert.equal(t.T.waiting,true,'Load islands does not ask while the sign-in is waiting');assert.deepEqual(t.calls.roster,[]);
 assert.match(t.node('mobile-teacher-status').textContent,/signs in after Allow/);
 t.connect();await flush();assert.deepEqual(t.calls.roster,['2595']);assert.deepEqual(t.calls.islands,['2595']);assert.equal(t.T.state,'ok');assert.equal(t.T.pin,'2595');
 t.T.connected();await flush();assert.equal(t.calls.roster.length,1,'a reconnect does not sign in again');
 t.T.accepted('2595','islands');assert.match(t.node('mobile-teacher-status').textContent,/names, islands, seals and season loaded/);assert.equal(t.node('mobile-teacher-btn').textContent,'Teacher signed in ✓');
});
await test('A wrong PIN is forgotten and asked for again; an unreachable Sheet keeps the PIN; no PIN changes nothing',async()=>{
 let t=teacher({roster:()=>({ok:false,unauthorized:true,message:'Incorrect Teacher PIN.'}),connected:true});
 t.T.start('1111');await flush();assert.equal(t.T.state,'error');assert.equal(t.T.pin,'');assert.deepEqual(t.calls.islands,['']);assert.equal(t.T.waiting,false);
 assert.match(t.node('mobile-teacher-status').textContent,/not accepted · tap to try again/);
 t.T.accepted('2595','islands');await flush();assert.equal(t.T.state,'ok');assert.deepEqual(t.calls.roster,['1111','2595'],'the PIN typed in Load islands loads the names too');
 t=teacher({roster:()=>({ok:false,message:'Google Sheets could not be reached.'}),connected:true});
 t.T.start('2595');await flush();assert.equal(t.T.state,'offline');assert.equal(t.T.pin,'2595');assert.deepEqual(t.calls.islands,['2595']);
 t=teacher({roster:()=>({ok:true}),connected:true});t.T.start('');await flush();assert.equal(t.T.state,'none');assert.equal(t.T.waiting,false);assert.deepEqual(t.calls.roster,[]);
 t=teacher({roster:()=>({ok:true}),remote:false});t.T.accepted('2595');assert.deepEqual(t.calls.roster,[],'the board does not load the roster on its own');
});
await test('Every PIN prompt reuses the sign-in: Load islands, Save Record, saved-result retry, Studio and Manage',()=>{
 const game=pub('game.js'),islands=pub('island-progress.js'),roster=pub('roster-manager.js'),studio=pub('teacher-studio.js');
 assert.match(game,/const teacherPin=document\.getElementById\('teacher-pin-startup'\);globalThis\.LeagueTeacher\?\.start\(teacherPin\?\.value\);if\(teacherPin\)teacherPin\.value='';/,'Connect Phone reads and clears the PIN box');
 assert.match(game,/remoteCommands\.sync\(data\.sessionId\);\s*globalThis\.LeagueTeacher\?\.connected\(\);/,'sign-in starts once the board’s state has arrived (after Allow)');
 assert.match(game,/document\.getElementById\('teacher-pin-input'\)\.value = globalThis\.LeagueTeacher\?\.pin\|\|'';/,'Save Record is prefilled');
 assert.match(game,/const pin=document\.getElementById\('teacher-pin-input'\)\.value\.trim\(\)\|\|globalThis\.LeagueTeacher\?\.pin\|\|'';/,'saved-result retry');
 assert.match(game,/safeRemoteSend\(\{type:'ROSTER_CATALOG',catalog,signIn:options\?\.signIn===true\}\)/);
 assert.match(game,/const lessonOpen=data\.signIn===true&&!LeagueStudents\.hasCredits\(studentContributions\)/,'fresh names reach a lesson only before anyone is awarded');
 assert.match(islands,/attempted\.has\(c\)\|\|root\.LeagueTeacher\?\.waiting\)return;/);assert.match(islands,/b\.onclick=\(\)=>pin&&valid\(current\)\?load\(current,pin\):open\(\);/);
 assert.match(islands,/pin=entered;root\.LeagueTeacher\?\.accepted\(entered,'islands'\);/);
 assert.match(roster,/async signIn\(key\)\{try\{const data=await request\('ROSTER_GET',\{\},key\);accept\(data\);onSaved\(data,\{signIn:true\}\);/);
 assert.match(roster,/auth\(\);if\(root\.LeagueTeacher\?\.pin\)\{pin=root\.LeagueTeacher\.pin;load\(\);\}/);
 assert.match(studio,/if\(root\.LeagueTeacher\?\.pin\)\{pin=root\.LeagueTeacher\.pin;loadUnit\(\);\}return true;/);
 assert.doesNotMatch(pub('teacher-signin.js'),/localStorage|sessionStorage|indexedDB/,'the PIN stays in memory only');
});
await test('The opening screen has the Teacher PIN box under the room code; the remote has the status pill and a More-sheet sign-in',()=>{
 const html=pub('index.html'),code=html.indexOf('id="room-code-input"'),pinBox=html.indexOf('id="teacher-pin-startup"'),connect=html.indexOf('id="connect-phone-btn"');
 assert(code>0&&code<pinBox&&pinBox<connect,'room code, Teacher PIN, Connect Phone');
 assert.match(html,/id="teacher-pin-startup" inputmode="numeric" autocomplete="off"/);assert.match(html,/<input type="password" id="teacher-pin-startup"/);
 assert(html.includes('id="mobile-teacher-status"')&&html.includes('onclick="LeagueTeacher.ask()"'));
 const tag=(html.match(/Island Run Edition · v(10\.\d+\.\d+)/)||[])[1];assert.match(tag,/^10\.1\.\d+$/);assert(html.includes('teacher-signin.js?v='+tag));
 assert(html.indexOf('teacher-signin.js')<html.indexOf('game.js?v='),'loaded before game.js');
});
await test('v10.1.1 one student card at a time: no function name is declared twice in student-ui.js (a second declaration silently replaces the first)',()=>{
 const ui=pub('student-ui.js'),names=[...ui.matchAll(/^\s*function (\w+)\s*\(/gm)].map(m=>m[1]);
 assert.deepEqual(names.filter((n,i)=>names.indexOf(n)!==i),[]);
 assert.match(ui,/function beforeSlide\(duration\)/);assert.match(pub('game.js'),/const hold = LeagueStudentUI\.beforeSlide\(duration\);/);
 assert.match(pub('game.js'),/delay:hold,\s*fill:'backwards',/,'the ranking slide waits for the card to fade');
});
console.log(JSON.stringify({checks}));
})().catch(error=>{console.error(error);process.exit(1);});
