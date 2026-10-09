/* Load/failure/replay races in the actual painted-world integration; no browser needed. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(base,'public/saga-scenes.js'),'utf8');
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function harness(){
 const images=[];
 function host(){return {isConnected:true,children:[],classes:new Set(),classList:{add(x){this.owner.classes.add(x)}},append(img){this.children.push(img);img.parentNode=this;img.isConnected=true}}}
 function make(){const h=host();h.classList.owner=h;return h}
 const sky=make(),light=make(),container=make();container.querySelector=s=>s==='.finale-sky'?sky:light;
 const c={Promise,Image:class {constructor(){this.naturalWidth=1672;images.push(this)}decode(){return Promise.resolve()}remove(){this.isConnected=false;this.parentNode=null}},STEPS:['crack','break','reveal','speech','names','hug','closing'],finale:{host:container,step:0},root:{addEventListener(){}},doc:{}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf(' const WORLDS='),source.indexOf(' function alignWorld()')),c);
 return {c,images,sky,light,container,make};
}
(async()=>{
 {const h=harness(),r=h.c.worldImage(h.sky,'violet');assert(!h.sky.classes.size);h.images[0].onload();assert(await r.loaded);assert(r.show());assert(h.sky.classes.has('world-ready'));}
 {const h=harness(),r=h.c.worldImage(h.sky,'scarlet');h.images[0].onerror();assert.equal(await r.loaded,false);assert.equal(r.show(),false);assert(!h.sky.classes.size);}
 {const h=harness(),r=h.c.worldImage(h.sky,'gilded');h.images[0].decode=()=>Promise.reject(Error('bad image'));h.images[0].onload();assert.equal(await r.loaded,false);assert(!h.sky.classes.size);}
 console.log('PASS decoded world commit and network/decode failure retain fallback');
 {const h=harness();h.c.finaleWorlds(h.c.finale);h.images[0].onload();await settle();assert(!h.container.classes.size);h.images[1].onload();await settle();assert(h.container.classes.has('painted-finale'));assert(h.sky.classes.has('world-ready'));assert(h.light.classes.has('world-ready'));}
 for(const state of ['advanced','replaced','failed']){const h=harness();h.c.finaleWorlds(h.c.finale);if(state==='advanced')h.c.finale.step=2;if(state==='replaced')h.c.finale={host:h.container,step:0};h.images[0].onload();state==='failed'?h.images[1].onerror():h.images[1].onload();await settle();assert(!h.container.classes.size);assert(!h.sky.classes.size);assert(!h.light.classes.size);}
 console.log('PASS both Finale layers commit together; slow/failed/replaced scenes cannot change scenery mid-reveal');
 {const h=harness(),r=h.c.worldImage(h.sky,'violet');h.images[0].onload();await r.loaded;h.images[0].isConnected=false;assert(!r.show());assert(!h.sky.classes.size);assert.equal(h.c.worldImage(h.sky,'invalid'),null);}
 console.log('PASS detached old arena and unknown world cannot replace current scene');
 let total=0;for(const name of ['violet-court','scarlet-forge','gilded-prison','restored-dawn']){const f=path.join(base,'public/assets/saga/worlds',name+'.webp');const bytes=fs.readFileSync(f);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert(bytes.length<350000);total+=bytes.length;}
 assert(total<1200000);console.log(`PASS four production WebPs total ${(total/1e6).toFixed(2)} MB`);
 const html=fs.readFileSync(path.join(base,'public/index.html'),'utf8');assert(html.indexOf('saga-worlds.css')>html.indexOf('visual-refinement.css'));assert(html.includes('saga-scenes.js?v=11.0.0-scenes1'));assert(html.includes('raid-motion.js?v=11.0.0-scenes1'));
 console.log('PASS production styling order and changed-script cache versions');
})().catch(e=>{console.error(e);process.exit(1)});
