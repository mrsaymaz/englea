/* Deterministic scene tests: execute the production reveal/reunion functions with a controlled clock. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),sharp=require('sharp');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8'),code=read('public/saga-scenes.js');
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
class Node{
 constructor(cls='',rect={left:200,top:0,width:280,height:500}){this.className=cls;this.rect=rect;this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v},getPropertyValue(k){return this[k]||''}};this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x)};this.nodes={};}
 append(x){this.children.push(x);x.parent=this}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}replaceChildren(...xs){this.children=[];xs.forEach(x=>this.append(x))}setAttribute(){}
 querySelector(q){return this.nodes[q]||this.children.find(x=>q==='img'?x.isImage:x.className===q.slice(1))||null}
 querySelectorAll(q){return this.nodes[q]||[]}
 getBoundingClientRect(){return this.rect}
}
function environment(){let now=0,paused=false;const tasks=[],images=[],sounds=[],plays=[];const c={Promise,Image:class extends Node{constructor(){super();this.isImage=true;this.naturalWidth=640;images.push(this)}decode(){return Promise.resolve()}},STEPS:['crack','break','reveal','speech','names','hug','closing'],manifest:{reveal:Array.from({length:6},(_,i)=>'frame'+i+'.webp')},artUrl:x=>x,finale:null,root:{innerWidth:1280,innerHeight:720},el:(tag,cls)=>new Node(cls),caption:(f,text)=>f.caption=text,CAPTIONS:{freed:'Mr. Saymaz is free!'},play:(node,frames,opts)=>{if(!c.finale?.settling&&!c.finale?.still)plays.push({node,frames,opts});return null},setTeacherPose:(node,pose)=>node.dataset.pose=pose,showHugIllustration:f=>f.pictureRequests=(f.pictureRequests||0)+1};
 c.after=(fn,ms)=>tasks.push({fn,due:now+ms});
 function advance(ms){if(paused)return;const end=now+ms;while(true){tasks.sort((a,b)=>a.due-b.due);if(!tasks.length||tasks[0].due>end)break;const t=tasks.shift();now=t.due;t.fn()}now=end;}
 vm.createContext(c);
 vm.runInContext(code.slice(code.indexOf(' const REVEAL_HOLD='),code.indexOf(' // ---- The hug:')),c);
 vm.runInContext(code.slice(code.indexOf(' const ARMS='),code.indexOf(' function showLine()')),c);
 const host=new Node(),teacher=new Node(),teacherArt=new Node();teacherArt.append(new c.Image());teacher.nodes['.saga-teacher-art']=teacherArt;
 const creatures=['gryffindor','slytherin','hufflepuff','ravenclaw'].map((id,i)=>{const n=new Node('',{left:80+i*280,top:340,width:180,height:150});n.dataset.house=id;n.nodes['.finale-creature-art']=new Node('',{left:80+i*280,top:340,width:115,height:115});n.nodes['.finale-creature-art'].innerHTML=id+'-12';n.nodes['.finale-creature-glow']=new Node();return n});
 Object.assign(host.nodes,{'.finale-teacher':teacher,'.saga-teacher-art':teacherArt,'.finale-stage':new Node('',{left:0,top:0,width:1280,height:590}),'.finale-creature':creatures,'.finale-hearts':new Node()});
 const queryAll=host.querySelectorAll.bind(host);host.querySelectorAll=q=>q==='.finale-hearts'?[host.nodes[q]]:queryAll(q);
 const teams=creatures.map(n=>Object.freeze({id:n.dataset.house,level:12,points:100,baby:n.dataset.house+'-0'}));Object.freeze(teams);
 const f={step:2,still:false,host,teams,anims:new Set(),sound:x=>sounds.push(x),kneelArt:{src:'kneel.webp'}};c.finale=f;
 return {c,f,host,teacher,creatures,images,plays,sounds,advance,pause:()=>paused=true,resume:()=>paused=false};
}
(async()=>{
 {const h=environment();h.f.reveal=h.c.preloadReveal(false);h.c.playReveal(h.f);h.advance(10000);assert.equal(h.f.reveal.index,-1,'no blank frames before download');for(const img of h.f.reveal.frames)img.onload();await settle();h.pause();h.advance(1000);assert.equal(h.f.reveal.index,-1,'async image completion respects pause');h.resume();h.advance(0);assert.equal(h.f.reveal.index,0);h.advance(1500);assert.equal(h.f.reveal.index,1);h.advance(2700);assert.equal(h.f.reveal.index,4);h.advance(900);assert.equal(h.f.reveal.index,5);h.advance(2000);assert.equal(h.f.reveal.done,true);assert.equal(h.f.caption,'Mr. Saymaz is free!');assert.deepEqual(h.sounds,['shatterMetal','shatterCrystal','goldCrack','heartbeat']);}
 console.log('PASS decoded six-frame reveal, scene-clock pause, frame order and liberation');
 for(const kind of ['failed','left','closed']){const h=environment();h.f.reveal=h.c.preloadReveal(false);h.c.playReveal(h.f);if(kind==='left'){h.f.step=3;h.c.endReveal(h.f)}if(kind==='closed')h.c.finale=null;for(const [i,img] of h.f.reveal.frames.entries())kind==='failed'&&i===2?img.onerror():img.onload();await settle();h.advance(10000);assert.equal(h.teacher.classList.contains('revealing'),false);assert.equal(h.f.reveal.index,-1);}
 console.log('PASS failed frame fallback and cancellation during pending downloads');
 {const h=environment();h.f.step=5;const before=JSON.stringify(h.f.teams);h.c.hugScene(h.f);h.advance(1400);for(const n of h.creatures)assert.equal(n.querySelector('.finale-creature-art').innerHTML,n.dataset.house+'-0');h.pause();h.advance(9000);assert(!h.f.hugComplete);h.resume();h.advance(4600);assert(h.f.hugComplete);assert.equal(h.host.querySelector('.saga-teacher-art').dataset.pose,'kneel');assert.equal(h.f.pictureRequests,1);assert.equal(JSON.stringify(h.f.teams),before,'earned points and levels unchanged');assert(h.creatures.every(n=>!/NaN|Infinity/.test(n.style.transform)));}
 console.log('PASS four Level 0 transformations, paused reunion, kneeling and preserved team data');
 for(const when of [0,900,2400,3600]){const h=environment();h.f.step=5;h.c.hugScene(h.f);h.advance(when);h.f.step=6;h.c.hugScene(h.f,true);const transforms=h.creatures.map(n=>n.style.transform),soundCount=h.sounds.length;assert(h.f.hugComplete);assert.equal(h.f.pictureRequests,1);h.advance(20000);assert.equal(h.f.pictureRequests,1,'old callbacks cannot restart hug');assert.equal(h.sounds.length,soundCount);assert.deepEqual(h.creatures.map(n=>n.style.transform),transforms);}
 console.log('PASS skip at four reunion phases settles once and invalidates old callbacks');
 {const h=environment();h.f.step=5;h.f.still=true;h.c.hugScene(h.f);assert(h.f.hugComplete);assert.equal(h.plays.length,0);assert.equal(h.f.pictureRequests,1);}
 {const h=environment();h.f.step=5;h.c.hugScene(h.f);h.c.finale=null;h.advance(20000);assert(!h.f.hugComplete);assert(!h.f.pictureRequests);}
 console.log('PASS reduced-motion instant reunion and stopped-scene cancellation');
 {const h=environment();for(const rect of [{left:0,top:0,width:200,height:600},{left:0,top:0,width:600,height:200}]){const b=h.c.containedPortrait(rect);assert(b.width<=rect.width&&b.height<=rect.height);assert(Math.abs(b.width/b.height-1024/1792)<.00001);assert.equal(b.top*2+b.height,rect.height);assert.equal(b.left*2+b.width,rect.width);}}
 for(const [W,H,portrait] of [[1280,720,425],[1920,1080,525],[1024,768,466],[393,852,178]]){const h=environment(),f=h.c.reunionFraming(W,H,portrait),canvas=Math.min(W*.86,H*.64),foot=f.centerY+(.974-.69)*portrait*f.zoom,cutoutFoot=.92*H-.102*canvas;assert(Math.abs(foot-cutoutFoot)<3,'live and cutout foot anchors agree');}
 console.log('PASS portrait containment and matching live/cutout foot anchors across four viewports');
 // Execute the actual animation lifecycle code and listener, not just source-pattern checks.
 {const callbacks={},f={still:false,anims:new Set()},animation={playState:'running',finished:new Promise(()=>{}),pause(){this.playState='paused'},play(){this.playState='running'}};
 const c={finale:f,root:{SceneRuntime:{paused:false}},doc:{addEventListener:(name,fn)=>callbacks[name]=fn}};vm.createContext(c);vm.runInContext(code.slice(code.indexOf(' function play(node,frames,opts){'),code.indexOf(' function enterStep(){')),c);c.play({animate:()=>animation},[],{});callbacks['league-pause-change']({detail:{paused:true}});assert.equal(animation.playState,'paused');callbacks['league-pause-change']({detail:{paused:false}});assert.equal(animation.playState,'running');}
 console.log('PASS Web Animations pause and resume with the teacher controls');
 const manifest=JSON.parse(read('public/assets/saga/manifest.json'));assert.equal(manifest.artRevision,'11.0.0-visual2');
 for(const name of [...Object.values(manifest.mrSaymaz),...manifest.reveal]){const {data,info}=await sharp(path.join(base,'public/assets/saga',name)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let empty=0,filled=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)empty++;if(data[i]>16)filled++}assert(empty>info.width*info.height*.1);assert(filled>info.width*info.height*.04);assert.equal(data[3],0);assert(fs.existsSync(path.join(base,'art/saga',name.replace('.webp','.png'))));}
 console.log('PASS all 13 illustrated runtime images have real alpha and full-resolution PNG sources');
 const html=read('FINALE-PREVIEW.html');for(const [,src] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(src);for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url==='./public/'||url.includes('${'))continue;assert(fs.existsSync(path.join(base,'public',url)),url)}
 for(const id of ['gryffindor','slytherin','hufflepuff','ravenclaw'])for(const level of [0,12])assert(fs.existsSync(path.join(base,`public/assets/animated/${id}-${level}.webp`)));
 console.log('PASS standalone preview scripts and local dependencies');
})().catch(e=>{console.error(e);process.exit(1)});
