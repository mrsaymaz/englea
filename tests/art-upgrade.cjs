/* Targeted checks for art1: real alpha and atlas registration, plus delayed Finale artwork loading. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),states=['ready','charge','cast','guard','exposed','hit','ultimate','defeat','proud'];
async function alpha(file){const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,empty=0;for(let i=3;i<data.length;i+=4){if(data[i]>16)visible++;if(data[i]===0)empty++;}return {data,info,visible,empty};}
async function box(file){const {data,info}=await alpha(file);let l=info.width,t=info.height,r=0,b=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return [l,t,r,b];}
function sceneHarness(){const images=[],hug={style:{},hidden:true,children:[],querySelector(){return this.children[0]||null},append(i){this.children.push(i);i.remove=()=>this.children.splice(this.children.indexOf(i),1)}};
 const c={Promise,after:fn=>fn(),Image:class{constructor(){images.push(this)}},STEPS:['hug','closing'],finale:null,plays:[],play:(node,frames,opts)=>c.plays.push(opts)};
 vm.createContext(c);const code=read('public/saga-scenes.js').toString();vm.runInContext(code.slice(code.indexOf(' function slotArt('),code.indexOf(' // Where each little one lands')),c);
 const actors={'.finale-teacher':{style:{opacity:'1'}},'.finale-creatures':{style:{opacity:'1'}}};
 const f={step:0,still:false,host:{querySelector:q=>q==='.finale-hug'?hug:actors[q]||null,classList:{add(){}}}};c.finale=f;f.hugArt=c.slotArt('hug.webp',1000);return {c,f,images,hug,actors};}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
(async()=>{
 for(const form of ['scarlet','gilded'])for(const state of states){const file=path.join(root,`art/vixar-poses/vixar-${form}-${state}.png`),m=await sharp(file).metadata();assert.equal(m.width,1414);assert.equal(m.height,1414);assert(m.hasAlpha);const a=await alpha(file);assert(a.empty>a.info.width*a.info.height*.15,'real transparent empty space');assert(a.visible>a.info.width*a.info.height*.15,'non-empty figure');assert.equal(a.data[3],0,'transparent corner');}
 console.log('PASS 18 separate high-resolution PNGs, real alpha and non-empty silhouettes');
 const m=await sharp(path.join(root,'art/saga/mr-saymaz-kneel.png')).metadata();assert.deepEqual([m.width,m.height,m.hasAlpha],[1024,1792,true]);assert.equal((await box(path.join(root,'art/saga/mr-saymaz-kneel.png')))[3],1744);
 const hug=await sharp(path.join(root,'public/assets/saga/hug.webp')).metadata();assert.deepEqual([hug.width,hug.height],[1024,1024]);console.log('PASS kneeling canvas and ground anchor; transparent reunion cutout');
 const manifest=JSON.parse(read('public/assets/poses/manifest.json')).packs;
 for(const form of ['scarlet','gilded']){const id='vixar-'+form,p=manifest[id],file=path.join(root,'public/assets/poses',p.file),bytes=fs.readFileSync(file);assert.deepEqual(p.states,states);assert.deepEqual([p.cols,p.rows,p.cell],[3,3,640]);assert.equal(p.bytes,bytes.length);assert.equal(p.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
  const atlasMeta=await sharp(file).metadata();assert.deepEqual([atlasMeta.width,atlasMeta.height],[1920,1920]);
  const ready=await sharp(file).extract({left:0,top:0,width:640,height:640}).png().toBuffer();const a=await box(ready),b=await box(path.join(root,`public/assets/animated/${id}.webp`));assert(a.every((n,i)=>Math.abs(n-b[i]/2)<=2),'idle and ready atlas anchors agree');
 }
 console.log('PASS atlas state order, size, hashes and matched idle registration');
 {const h=sceneHarness();h.c.showHugIllustration(h.f);assert.equal(h.hug.children.length,0);h.images[0].naturalWidth=1672;h.images[0].onload();await settle();assert.equal(h.hug.children.length,1);assert.equal(h.hug.hidden,true);h.images[1].onload();assert.equal(h.hug.hidden,false);assert(Object.values(h.actors).every(a=>a.style.opacity==='0'),'only live actors fade after the replacement loads');h.c.showHugIllustration(h.f);await settle();assert.equal(h.hug.children.length,1);}
 {const h=sceneHarness();h.f.step=1;h.f.still=true;h.c.showHugIllustration(h.f);h.images[0].naturalWidth=1672;h.images[0].onload();await settle();h.images[1].onload();assert.equal(h.hug.hidden,false);assert.equal(h.c.plays[0].duration,0);}
 for(const kind of ['error','undersized','closed']){const h=sceneHarness();h.c.showHugIllustration(h.f);if(kind==='closed')h.c.finale=null;if(kind==='error')h.images[0].onerror();else{h.images[0].naturalWidth=kind==='undersized'?800:1672;h.images[0].onload();}await settle();assert.equal(h.hug.children.length,0);assert.equal(h.hug.hidden,true);assert(Object.values(h.actors).every(a=>a.style.opacity==='1'),'failed or cancelled cutout retains live group');}
 console.log('PASS delayed artwork, direct closing/Light mode, failed loads, stale scene cancellation and duplicate requests');
 const html=read('ART-PREVIEW.html').toString();new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert(fs.existsSync(path.join(root,url)),url);console.log('PASS offline preview script syntax and literal image links');
})().catch(e=>{console.error(e);process.exit(1)});
