/* v11.0.0 browser check (Chromium): the Vixar fight preview (index.html#preview-act1 … #preview-finale).
   - Each act opens straight into its own fight: the right Vixar form, every team at the act's level, the Class Mission
     complete; the Finale opens with example names. Light mode shows Scarlet and Gilded Vixar (not an empty arena).
   - The board's access check still applies; nothing reaches the classes' saved data (real storage keeps no saga,
     session or contributions) and no server call is made apart from the access check.
   - The preview bar switches act and display; the launcher page links to every act in both displays. */
const assert=require('assert/strict');
const {setup}=require('./support.cjs');
(async()=>{
 const e=await setup({fixtureRoster:false}); // public previews show example names
 try{
  const ctx=await e.browser.newContext({viewport:{width:1366,height:768}});const api=[];let firstOpen=true;
  const open=async hash=>{const p=await ctx.newPage();p.on('pageerror',err=>e.errors.push(err.message));p.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url().replace(/^.*\/api/,'/api'));});
   await p.route('**/*',r=>r.request().url().startsWith(e.base)?r.continue():r.abort());await p.goto(e.base+'/index.html#preview-'+hash);
   if(!api.includes('/api/access-time')||firstOpen){firstOpen=false;assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('access-locked')),true,'the access check still applies');}
   await e.unlock(p);return p;}; // v12.0.0: the first page signs this browser in (code + PIN); later pages have its session
  for(const [hash,title,act,level] of [['act1','VIXAR','violet',10],['act2','SCARLET VIXAR','scarlet',11],['act3','GILDED VIXAR','gilded',12],['act2-light','SCARLET VIXAR','scarlet',11],['act3-light','GILDED VIXAR','gilded',12]]){
   const p=await open(hash);
   await p.waitForFunction(()=>document.getElementById('vixar-raid-overlay')?.classList.contains('visible'),null,{timeout:15000});await p.waitForTimeout(800);
   const s=await p.evaluate(()=>({title:document.querySelector('.vixar-title').textContent.trim(),act:document.getElementById('vixar-raid-overlay').dataset.act,
    levels:LeagueSaga.TEAMS.map(t=>Number(document.querySelector(`#level-display-${t}`)?.dataset.level)),animated:document.body.classList.contains('performance-animated'),
    boss:document.getElementById('vixar-boss-animated-art')?.getBoundingClientRect().width||0,svg:getComputedStyle(document.getElementById('vixar-boss-svg')).visibility,
    bar:[...document.querySelectorAll('#vixar-preview-bar .vp-menu button')].map(b=>b.textContent)}));
   assert.equal(s.title,title,hash);assert.equal(s.act,act);assert.deepEqual(s.levels,[level,level,level,level],'every team at the act level');
   assert.equal(s.animated,!hash.endsWith('light'));assert.deepEqual(s.bar,['Act I','Act II','Act III','Finale',hash.endsWith('light')?'Animated mode':'Light mode']);
   if(act!=='violet'){assert(s.boss>200,`${title} is drawn in ${hash.endsWith('light')?'Light':'Animated'} mode`);assert.equal(s.svg,'hidden');}
   await p.close();
  }
  console.log('PASS each act opens straight into its own fight (Violet 10, Scarlet 11, Gilded 12), in Animated and Light mode; Scarlet and Gilded Vixar are drawn in Light mode');
  const f=await open('finale');await f.waitForFunction(()=>LeagueSagaScenes.finale.view()?.step==='crack',null,{timeout:15000});
  for(let i=0;i<20&&(await f.evaluate(()=>LeagueSagaScenes.finale.view()?.step))!=='names';i++)await f.evaluate(()=>LeagueSagaScenes.finale.next());
  const names=await f.evaluate(()=>[...document.querySelectorAll('.finale-house')].map(h=>h.querySelectorAll('.finale-person').length));assert.deepEqual(names,[3,3,3,3],'example names in every house');
  // The bar switches act (a fresh start) and display.
  await f.evaluate(()=>LeagueSagaScenes.finale.stop(false));await f.locator('#vixar-preview-bar .vp-menu').getByRole('button',{name:'Act II',exact:true}).click();
  await f.waitForFunction(()=>location.hash==='#preview-act2'&&document.getElementById('vixar-raid-overlay')?.classList.contains('visible'),null,{timeout:15000}).catch(async()=>{
   await e.unlock(f);
   await f.waitForFunction(()=>location.hash==='#preview-act2'&&document.getElementById('vixar-raid-overlay')?.classList.contains('visible'),null,{timeout:15000});});
  await f.close();
  console.log('PASS the Finale opens with example names in every house; the preview bar starts another act');
  // Nothing reached the real storage of this browser, and only the access check went to the server.
  const plain=await ctx.newPage();await plain.goto(e.base+'/vixar-preview.html');
  const keys=await plain.evaluate(()=>[...Object.keys(localStorage),...Object.keys(sessionStorage)]);
  assert.deepEqual(keys.filter(k=>!/^englishLeague\.previewMode$/.test(k)),[],'no saga, session, contribution, access or settings keys: '+keys.join(', '));
  assert.deepEqual([...new Set(api)].filter(u=>u!=='/api/access-time'),[],'only the access check reaches the server');
  // The launcher links to every act, and the display switch adds -light.
  const hrefs=()=>plain.evaluate(()=>[...document.querySelectorAll('a.start')].map(a=>a.getAttribute('href')));
  assert.deepEqual(await hrefs(),['index.html#preview-act1','index.html#preview-act2','index.html#preview-act3','index.html#preview-finale']);
  await plain.locator('label[for="mode-light"]').click();assert.deepEqual(await hrefs(),['index.html#preview-act1-light','index.html#preview-act2-light','index.html#preview-act3-light','index.html#preview-finale-light']);
  console.log('PASS nothing reaches the classes’ saved data or the server (only the access check); the launcher links every act in both displays');
  assert.deepEqual(e.errors,[]);
 }finally{await e.close();}
})().catch(error=>{console.error(error);process.exit(1);});
