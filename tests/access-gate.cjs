const assert=require('assert/strict'),fs=require('fs');const {setup}=require('./support.cjs');
(async()=>{
 const mod=await import('../netlify/functions/access-time.mjs');
 assert.deepEqual(mod.codesAt(Date.parse('2026-09-29T06:29:00Z')),{normal:'1030',master:'9818'});
 assert.equal(mod.codesAt(Date.parse('2026-09-29T05:50:00Z')).master,'9749');
 assert.deepEqual(mod.codesAt(Date.parse('2026-09-28T21:00:00Z')),{normal:'1111',master:'9999'});
 const epoch=Date.parse('2026-09-29T06:29:00Z'),e=await setup({autoUnlock:false,time:epoch});
 try{
  const ctx=await e.browser.newContext({viewport:{width:393,height:660},timezoneId:'Pacific/Honolulu'});
  await ctx.addInitScript(()=>{Date.now=()=>1;});
  const p=await e.page(ctx);await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  assert.equal(await p.locator('#startup-overlay').isVisible(),false);
  await p.evaluate(()=>__qa.start());assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);
  async function submit(code){await p.locator('#access-code').fill(code);await p.locator('#access-submit').click();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);}
  await submit('0000');await submit('0000');await p.reload();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);await submit('0000');
  const lock=await p.evaluate(()=>JSON.parse(localStorage.getItem('englishLeague.access.v1')));assert.equal(lock.lockedUntil,epoch+21600000);
  await submit('1030');assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);assert.match(await p.locator('#access-message').textContent(),/locked/);
  await submit('0000');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('englishLeague.access.v1')).lockedUntil),lock.lockedUntil);
  await submit('9818');assert.equal(await p.evaluate(()=>LeagueAccess.granted),true);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('englishLeague.access.v1')).failures),0);
  // Current-minute codes only, independent of the intentionally wrong local clock.
  await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  e.setTime(epoch+60000);await submit('1030');assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);
  await submit(e.codes().normal);assert.equal(await p.evaluate(()=>LeagueAccess.granted),true);
  // Six-hour expiry is checked against server time, and successful access resets consecutive failures.
  await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  await submit('0000');await submit('0000');await submit('0000');e.setTime(epoch+60000+21600000);
  await submit(e.codes().normal);assert.equal(await p.evaluate(()=>LeagueAccess.granted),true);
  await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForFunction(()=>!document.getElementById('access-submit').disabled);
  fs.mkdirSync('output',{recursive:true});await p.screenshot({path:'output/access-iphone.png'});
  // No local-clock fallback when the server is unavailable, and no failed-password penalty.
  await p.route('**/api/access-time',r=>r.abort());await submit(e.codes().normal);
  assert.equal(await p.evaluate(()=>LeagueAccess.granted),false);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('englishLeague.access.v1')).failures),0);
  assert.deepEqual(e.errors,[]);
  console.log('PASS TRT rollover, supplied examples, wrong client clock/timezone, minute rotation, persistent three-strike lockout, normal rejection during lock, master override, six-hour expiry and fail-closed network errors');
 }finally{await e.close();}
})().catch(e=>{console.error(e);process.exit(1);});
