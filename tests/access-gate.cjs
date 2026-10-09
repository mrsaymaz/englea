/* v12.0.0 teacher access, decided on the server: time codes (Turkey time, server clock), lockouts kept on the server
   (per device; for devices not yet trusted also per network and site-wide), the Teacher PIN once per new device,
   signed HttpOnly session cookies, and the session check on every API function (TURN credentials included). */
const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');const fixture=require('./fixture.cjs');
(async()=>{
 const mod=await import('../netlify/functions/access-time.mjs'),auth=await import('../netlify/shared/auth.mjs'),turn=await import('../netlify/functions/turn-credentials.mjs');
 assert.deepEqual(mod.codesAt(Date.parse('2026-09-29T06:29:00Z')),{normal:'1030',master:'9818'});
 assert.equal(mod.codesAt(Date.parse('2026-09-29T05:50:00Z')).master,'9749');
 assert.deepEqual(mod.codesAt(Date.parse('2026-09-28T21:00:00Z')),{normal:'1111',master:'9999'});

 // ---- The functions themselves ----
 const epoch=Date.parse('2026-09-29T06:29:00Z');let now=epoch;
 const store=auth.memoryStore(),env={LEAGUE_SERVER_KEY:fixture.SERVER_KEY,CLOUDFLARE_TURN_KEY_ID:'k',CLOUDFLARE_TURN_KEY_API_TOKEN:'t'};
 let scriptCalls=0;const script=async(url,o)=>{scriptCalls++;return new Response(JSON.stringify(fixture.authCheck(JSON.parse(o.body))));};
 const deps=()=>({store,secret:fixture.SECRET,env,now,fetcher:script});
 // A tiny browser: one cookie jar per device and one network address.
 function device(ip='10.0.0.1'){
  const jar=new Map();
  async function call(method,body,query=''){
   const headers={'x-nf-client-connection-ip':ip,cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')};if(body)headers['content-type']='application/json';
   const r=await mod.handleAt(new Request('https://league.example/api/access-time'+query,{method,headers,body:body?JSON.stringify(body):undefined}),deps());
   for(const c of r.headers.getSetCookie()){const [pair]=c.split(';');const i=pair.indexOf('=');const v=pair.slice(i+1);if(/Max-Age=0/.test(c))jar.delete(pair.slice(0,i));else jar.set(pair.slice(0,i),v);}
   return r.json();
  }
  return {jar,call,code:code=>call('POST',{code}),pin:(challenge,pin)=>call('POST',{challenge,pin}),cookie:()=>[...jar].map(([k,v])=>k+'='+v).join('; ')};
 }
 const codes=()=>mod.codesAt(now);
 const board=device();
 let r=await board.call('GET');assert.equal(r.serverNow,epoch);assert.deepEqual(r.session,{active:false,expiresAt:0});assert.equal(r.device.trusted,false);
 assert.ok(board.jar.has('__Host-league_device'),'a device cookie, __Host- prefixed on https');
 // A new device: the right code asks for the Teacher PIN; a wrong PIN counts; the right one trusts the device.
 r=await board.code(codes().normal);assert.equal(r.kind,'pin');assert.ok(r.challenge);
 assert.deepEqual(await board.pin(r.challenge,'0000'),{serverNow:now,kind:'pin-invalid',remaining:4});
 r=await board.pin(r.challenge,fixture.TEST_PIN);assert.equal(r.kind,'granted');assert.equal(r.expiresAt,now+12*3600000);assert.ok(board.jar.has('__Host-league_session'));
 r=await board.call('GET');assert.equal(r.session.active,true);assert.equal(r.device.trusted,true);
 // Signed out: the device stays trusted, so the time code alone signs it in again; forgotten: the PIN again.
 await board.call('DELETE');assert.equal((await board.call('GET')).session.active,false);
 assert.equal((await board.code(codes().normal)).kind,'granted');
 await board.call('DELETE',null,'?forget=1');assert.equal((await board.code(codes().normal)).kind,'pin');
 r=await board.code(codes().normal);r=await board.pin(r.challenge,fixture.TEST_PIN);assert.equal(r.kind,'granted');
 // The PIN step expires after five minutes and belongs to the device that passed the code.
 const other=device('10.0.0.2');r=await other.code(codes().normal);const stolen=r.challenge;
 assert.equal((await device('10.0.0.3').pin(stolen,fixture.TEST_PIN)).kind,'expired','a challenge is bound to its device');
 now+=5*60000+1;assert.equal((await other.pin(stolen,fixture.TEST_PIN)).kind,'expired');now=epoch;
 console.log('PASS a new device needs the time code and then the Teacher PIN (checked by Apps Script with the server key); the device is then trusted and the code alone opens a 12-hour session; sign out, forget, a five-minute PIN step bound to its device');

 // Three wrong codes lock the device for six hours; the unlock code still works, a normal code does not; three wrong
 // codes during the lock end the unlock code too. Clearing the browser does not help: the record is on the server.
 const phone=device('10.0.0.9');r=await phone.code(codes().normal);await phone.pin(r.challenge,fixture.TEST_PIN);
 assert.deepEqual(await phone.code('0000'),{serverNow:now,kind:'invalid',remaining:2});
 assert.deepEqual(await phone.code('0000'),{serverNow:now,kind:'invalid',remaining:1});
 r=await phone.code('0000');assert.deepEqual(r,{serverNow:now,kind:'locked',scope:'device',until:now+21600000,unlock:true});
 assert.equal((await phone.code(codes().normal)).kind,'locked','the normal code is refused during the lock');
 assert.equal((await phone.code(codes().master)).kind,'granted','the unlock code ends the lock');
 for(let i=0;i<3;i++)await phone.code('0000');
 for(let i=0;i<3;i++)r=await phone.code('1111');assert.equal(r.unlock,false,'three wrong codes during the lock');
 assert.equal((await phone.code(codes().master)).kind,'locked','… end the unlock code until the lock expires');
 now+=21600000+1;assert.equal((await phone.code(mod.codesAt(now).normal)).kind,'granted','six hours later the device signs in again');now=epoch;
 console.log('PASS three wrong codes lock the device for six hours on the server; the unlock code ends the lock; three wrong codes during the lock also stop the unlock code; the lock expires after six hours');

 // Guessing from new devices: a fresh cookie jar does not reset anything for long. Ten failures from one network lock
 // new devices on that network for an hour; the teacher's trusted board on the same network still signs in.
 const school='10.1.1.1',teacherBoard=device(school);r=await teacherBoard.code(codes().normal);await teacherBoard.pin(r.challenge,fixture.TEST_PIN);await teacherBoard.call('DELETE');
 for(let i=0;i<10;i++)await device(school).code('0000');
 r=await device(school).code(codes().normal);assert.equal(r.kind,'locked');assert.equal(r.scope,'network');
 assert.equal((await teacherBoard.code(codes().normal)).kind,'granted','a trusted device is not locked out by someone else on the network');
 for(let i=0;i<14;i++){const d=device('10.2.0.'+i);r=await d.code(codes().normal);await d.pin(r.challenge,'1');await d.pin(r.challenge,'2');}
 for(let i=0;i<8;i++)await device('10.3.0.'+i).code('0000');
 r=await device('10.4.0.1').code(codes().normal);assert.equal(r.scope,'network','forty failures site-wide lock new devices everywhere for an hour');
 assert.equal((await board.code(codes().normal)).kind,'granted');
 now+=3600001;r=await device('10.4.0.2').code(mod.codesAt(now).normal);assert.equal(r.kind,'pin','an hour later new devices can sign in again');now=epoch;
 console.log('PASS devices that are not trusted yet are limited per network (10 an hour) and site-wide (40 an hour); the teacher\'s trusted board on the same network is never locked out');

 // Every API function needs the session; TURN credentials are limited per device.
 const turnFetch=async()=>new Response(JSON.stringify({iceServers:[{urls:['turn:relay.example']}]}));
 const turnCall=cookie=>turn.handleTurn(new Request('https://league.example/api/turn-credentials',{headers:cookie?{cookie}:{}}),{store,secret:fixture.SECRET,env,now,fetcher:turnFetch});
 r=await turnCall('');assert.equal(r.status,401);assert.equal((await r.json()).code,'session');
 r=await turnCall(other.cookie());assert.equal(r.status,401,'a device that has not finished signing in');
 r=await turnCall(board.cookie());assert.equal(r.status,200);assert.deepEqual((await r.json()).iceServers,[{urls:['turn:relay.example']}]);
 for(let i=1;i<60;i++)await turnCall(board.cookie());assert.equal((await turnCall(board.cookie())).status,429);
 const forged=board.cookie().replace(/__Host-league_session=[^;]+/,'__Host-league_session='+encodeURIComponent(auth.sign({t:'s',d:'x',k:'normal',iat:now,exp:now+1e6},'not-the-secret')));
 assert.equal((await turnCall(forged)).status,401,'a session signed with another secret');
 now+=12*3600000+1;assert.equal((await turnCall(board.cookie())).status,401,'the session ends after 12 hours');now=epoch;
 // Missing server key: the PIN step refuses with the setup message (and calls nothing).
 now=epoch+2*3600000;const calls=scriptCalls;delete env.LEAGUE_SERVER_KEY;const fresh=device('10.9.9.9');r=await fresh.code(codes().normal);r=await fresh.pin(r.challenge,fixture.TEST_PIN);
 assert.equal(r.kind,'error');assert.match(r.message,/LEAGUE_SERVER_KEY/);assert.equal(scriptCalls,calls);env.LEAGUE_SERVER_KEY=fixture.SERVER_KEY;now=epoch;
 const wrongOrigin=await mod.handleAt(new Request('https://league.example/api/access-time',{method:'POST',headers:{'content-type':'application/json',origin:'https://elsewhere.example'},body:'{"code":"1234"}'}),deps());
 assert.equal(wrongOrigin.status,403);
 console.log('PASS TURN credentials need a signed-in device (forged or expired sessions refused, 60 an hour); a missing server key is a setup message; other sites cannot post');

 // ---- In the browser: wrong local clock and timezone, the PIN step, nothing in browser storage ----
 const e=await setup({autoUnlock:false,time:epoch});
 try{
  const ctx=await e.browser.newContext({viewport:{width:393,height:660},timezoneId:'Pacific/Honolulu'});
  await ctx.addInitScript(()=>{Date.now=()=>1;});
  const p=await e.page(ctx);await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  assert.equal(await p.locator('#startup-overlay').isVisible(),false);
  await p.evaluate(()=>__qa.start());assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);
  async function submit(field,value){await p.locator(field).fill(value);await p.locator('#access-submit').click();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);}
  await submit('#access-code','0000');await submit('#access-code','0000');
  await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await p.reload();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  await submit('#access-code','0000');assert.match(await p.locator('#access-message').textContent(),/locked for six hours/,'clearing the browser does not reset the count');
  await submit('#access-code','1030');assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);
  await submit('#access-code','9818');assert.equal(await p.locator('#access-pin-row').isVisible(),true,'the unlock code, then the PIN on a new device');
  await submit('#access-pin','1111');assert.match(await p.locator('#access-message').textContent(),/Incorrect Teacher PIN\. 4 attempts remaining/);
  await submit('#access-pin',fixture.TEST_PIN);assert.equal(await p.evaluate(()=>LeagueAccess.granted),true);
  // Only the server's clock counts: the next minute's code works when the server says so.
  await p.reload();await p.waitForFunction(()=>LeagueAccess.granted,{},{timeout:5000});
  await p.evaluate(()=>LeagueAccess.signOut());await p.waitForFunction(()=>!LeagueAccess.granted);
  e.setTime(epoch+60000);await submit('#access-code','1030');assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);
  await submit('#access-code',e.codes().normal);assert.equal(await p.evaluate(()=>LeagueAccess.granted),true,'a trusted device: the code alone');
  const keys=await p.evaluate(()=>[...Object.keys(localStorage),...Object.keys(sessionStorage)].filter(k=>/access/i.test(k)));
  assert.deepEqual(keys,[],'no access state in browser storage');
  assert.equal(await p.evaluate(()=>document.cookie),'','the session cookies are HttpOnly');
  fs.mkdirSync('output',{recursive:true});await p.screenshot({path:'output/access-iphone.png'});
  // A request that finds the session gone brings the access screen back over the page.
  await p.context().clearCookies();
  await p.evaluate(()=>fetch('/api/turn-credentials'));await p.waitForFunction(()=>!LeagueAccess.granted);
  assert.equal(await p.locator('#access-screen').isVisible(),true);
  // No local fallback when the server is unavailable, and nothing counted.
  await p.route('**/api/access-time',r=>r.abort());await submit('#access-code',e.codes().normal);
  assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);assert.match(await p.locator('#access-message').textContent(),/not counted/);
  assert.deepEqual(e.errors,[]);
  console.log('PASS in the browser: server time and lockouts whatever the local clock, timezone or storage; the unlock code, the PIN step on a new device, the code alone on a trusted one; HttpOnly cookies only; an ended session shows the access screen; fail-closed when offline');
 }finally{await e.close();}
})().catch(e=>{console.error(e);process.exit(1);});
