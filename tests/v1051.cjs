/* v10.5.1 dependency-free checks: smoother creature poses.
   - Ten pose sheets stay decoded (four teams at their current and next level, an island boss and Vixar).
   - The pose layer is square and fitted by CSS (aspect-ratio), so showing a pose never measures the page; older
     browsers without aspect-ratio still measure once.
   (A pre-scaled runner sprite cache was tried and measured: the runner's pose drawing costs about 0.1 ms per frame,
   so it gained nothing and was left out. See ../archive/TEST-REPORT-v10.5.1.md.)
   Browser checks: board-v1051.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
function poses({css=true}={}){
 const images=[];
 const c={console,URL,Map,Set,WeakMap,Promise,Math,performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},
  CSS:css?{supports:(p,v)=>p==='aspect-ratio'}:undefined,
  Image:class{constructor(){images.push(this);this.naturalWidth=960;this.naturalHeight=960;}decode(){return Promise.resolve();}}};
 vm.createContext(c);vm.runInContext(pub('creature-poses.js'),c);
 return {P:c.CreaturePoses,images,ready:async()=>{images.filter(i=>!i.done).forEach(i=>{i.done=true;i.onload();});for(let k=0;k<5;k++)await Promise.resolve();}};
}
(async()=>{
await test('Ten pose sheets stay decoded: four teams at two levels, plus an island boss and Vixar',async()=>{
 const h=poses();for(const t of ['gryffindor','slytherin','hufflepuff','ravenclaw'])for(const n of [4,5])h.P.load(t,n);h.P.load('veyr');h.P.load('vixar');await h.ready();
 assert.equal(h.P.diagnostics().maxSheets,10);assert.equal(h.P.diagnostics().cached,10);
 for(const t of ['gryffindor','slytherin','hufflepuff','ravenclaw'])for(const n of [4,5])assert(h.P.loaded(t,n),`${t}-${n} is still decoded`);
 h.P.load('tickthorn');await h.ready();assert.equal(h.P.diagnostics().cached,10,'the eleventh sheet replaces the least recently used one');
});
await test('The pose layer is square and fitted by CSS; the script measures only where aspect-ratio is missing',()=>{
 const css=pub('creature-poses.css'),js=pub('creature-poses.js');
 assert.match(css,/\.creature-pose-layer \{ position:absolute; inset:0; margin:auto; display:block; aspect-ratio:1 \/ 1; width:auto; height:auto; max-width:100%; max-height:100%;/);
 assert.match(js,/const squareByCSS=Boolean\(root\.CSS\?\.supports\?\.\('aspect-ratio','1 \/ 1'\)\);/);
 assert.match(js,/if\(!squareByCSS\)\{const side=Math\.min\(el\.clientWidth,el\.clientHeight\);/);
 assert.equal((js.match(/clientWidth|clientHeight|getBoundingClientRect|offsetWidth/g)||[]).length,8,'no measuring added: the old-browser fallback and the Champions seating of v10.5.0 only');
});
await test('Wiring: the current build on the page, the phone check and Island Run; the v10.5.0 pose pictures keep their 10.5.0 cache tag',()=>{
 const html=pub('index.html'),run=pub('island-runner/index.html'),build=(pub('game.js').match(/const REMOTE_BUILD = '(\d+\.\d+\.\d+)';/)||[])[1];
 assert(build,'REMOTE_BUILD');assert(html.includes('creature-poses.js?v='+build)&&run.includes('../creature-poses.js?v='+build));
 assert(pub('teaching.js').includes("file+'?v="+build+"'"));
 // v11.0.0: the original sheets are unchanged, so boards do not download them again; only the new sheets have a new tag.
 const js=pub('creature-poses.js');assert.match(js,/url:base\+p\.key\+'\.webp\?v='\+tag\(p\.key\)/);
 assert.match(js,/const tag=key=>\/-1\[12\]\$\|\^vixar-\|\^slyffindor\$\|\^huffleclaw\$\/\.test\(key\)\?'11\.0\.0':'10\.5\.0';/);
});
console.log(JSON.stringify({checks}));
})().catch(error=>{console.error(error);process.exit(1);});
