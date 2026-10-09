/* v12.0.0 test fixtures: the fictional class roster (tests/fixtures/class-roster.json) and signed-in requests for the
   Netlify functions (a trusted device and a teacher session, signed with a test secret in a memory store). */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const roster=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/class-roster.json'),'utf8'));
const TEST_PIN='8642',SERVER_KEY='test-server-key-0123456789abcdef',SECRET='test-session-secret-0123456789abcdef';
const ROSTER_KEY='englishLeague.roster.v1';
const revision=students=>crypto.createHash('sha256').update(JSON.stringify(students)).digest('hex');
const catalog=(students=roster)=>({schema:1,version:1,revision:revision(students),students:students.map(p=>({...p}))});
// The Roster tab as a teacher's sheet holds it (what earlier versions seeded from names in the Apps Script).
function seedGasRoster(gas,students=roster){
 const sheet=gas.ss.getSheetByName('Roster')||gas.ss.insertSheet('Roster');
 sheet.rows=[['Student ID','Class','Student','Team','Active'],...students.map(p=>[p.id,p.className,p.name,p.teamId[0].toUpperCase()+p.teamId.slice(1),p.active])];
 return sheet;
}
async function auth(){
 const mod=await import('../netlify/shared/auth.mjs');
 const store=mod.memoryStore(),env={LEAGUE_SERVER_KEY:SERVER_KEY},now=()=>Date.now();
 const device={t:'d',id:'test-device-0123456789',trusted:true,iat:now(),exp:now()+86400000};
 const session={t:'s',d:device.id,k:'normal',iat:now(),exp:now()+3600000};
 const cookieHeader=`league_device=${encodeURIComponent(mod.sign(device,SECRET))}; league_session=${encodeURIComponent(mod.sign(session,SECRET))}`;
 const secureCookieHeader=cookieHeader.replace('league_device=','__Host-league_device=').replace('league_session=','__Host-league_session=');
 // A request from the signed-in board or phone (https on the site, http in the browser tests).
 const signed=(url,init={})=>{const headers=new Headers(init.headers||{});headers.set('cookie',url.startsWith('https:')?secureCookieHeader:cookieHeader);return new Request(url,{...init,headers});};
 return {mod,store,env,secret:SECRET,deps:{store,secret:SECRET,env},signed,device};
}
// A pretend Apps Script for the access check: the Teacher PIN with the server key.
const authCheck=data=>data.serverKey!==SERVER_KEY?{status:'error',code:'server-key',message:'server key'}:String(data.pin)!==TEST_PIN?{status:'unauthorized',message:'Invalid PIN'}:{status:'success',authVersion:1};
module.exports={roster,catalog,seedGasRoster,auth,authCheck,TEST_PIN,SERVER_KEY,SECRET,ROSTER_KEY};
