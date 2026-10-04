/* DOM-harness check of the real Studio workflow; no native browser layout claim. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require.resolve('./island-run-integration.cjs'),'utf8').split('const board=environment')[0];
const sandbox={require,__dirname,console,Blob,URL};vm.runInNewContext(source+'\nthis.harness={environment,Node,Doc};',sandbox);
const {environment,Node}=sandbox.harness;
Object.defineProperty(Node.prototype,'innerHTML',{set(value){this.html=value;this.children=[];for(const match of value.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){const n=new Node(match[1],this.ownerDocument),id=match[2].match(/\bid="([^"]+)"/);if(id)n.setAttribute('id',id[1]);const tab=match[2].match(/data-studio-tab="([^"]+)"/);if(tab)n.dataset.studioTab=tab[1];this.append(n);}},get(){return this.html||'';}});
Node.prototype.querySelectorAll=function(q){const all=[];const visit=n=>{for(const child of n.children){all.push(child);visit(child);}};visit(this);if(q==='[data-studio-tab]')return all.filter(n=>n.dataset.studioTab);return all.filter(n=>q.split(',').map(x=>x.toUpperCase()).includes(n.tagName));};
const env=environment('', 'https://school.test/');const {w,document:d}=env;w.crypto.randomUUID=()=>Math.random().toString(16).slice(2);w.localStorage={getItem:()=>null,setItem(){}};w.RunnerContent=require('../public/island-runner/expand-content.js');w.TeachingModel=require('../public/teaching-model.js');w.LeagueAdventure=require('../public/adventure.js');
const g=require('./roster-gas-harness.cjs').makeGas();let progress={},rosterMounted=false,lastSave;
w.LeagueRoster={busy:false,mount(){rosterMounted=true;},unmount(){rosterMounted=false;}};
w.LeagueIslandProgress={acknowledge(c,v){progress=v;},snapshot(){return progress;}};
w.LeagueTeaching={loadContent:async()=>w.RunnerContent,accept(){},async request(type,pin,extra){const result=g.post({type,pin,...extra});if(result.status!=='success')throw Error(result.message);if(type==='TEACHING_SAVE')lastSave=result;return result;}};
env.eval('teacher-studio.js');w.LeagueStudio.configure({getClass:()=> '5-C'});w.LeagueStudio.open();
const el=id=>d.getElementById(id),event={preventDefault(){}};
(async()=>{
 el('studio-pin').value='bad';await el('studio-auth').onsubmit(event);assert.match(el('studio-status').textContent,/PIN/);
 el('studio-pin').value='2595';await el('studio-auth').onsubmit(event);assert.equal(el('studio-workspace').hidden,false);assert.equal(el('studio-class').value,'5-C');assert(el('studio-question-list').children.length>50);
 el('studio-objective').value='Teacher revised objective';el('studio-objective').oninput();el('studio-prompt').value='Custom word';el('studio-question-form').dispatchEvent({type:'input'});await el('studio-save').onclick();assert.equal(lastSave.content.objective,'Teacher revised objective');assert.equal(lastSave.content.bank[0].prompt,'Custom word');assert.equal(lastSave.version,1);
 el('studio-class').value='6-C';await el('studio-class').onchange();assert.equal(el('studio-objective').value,w.RunnerContent.grades[6][0].objective);
 el('studio-island').value='2';await el('studio-island').onchange();assert.match(el('studio-scope').textContent,/Grade 6/);
 const nav=el('teacher-studio').querySelectorAll('[data-studio-tab]');nav.find(n=>n.dataset.studioTab==='roster').onclick();assert(rosterMounted);w.LeagueRoster.busy=true;el('studio-class').value='8-B';await el('studio-class').onchange();assert.equal(el('studio-class').value,'6-C');w.LeagueRoster.busy=false;
 nav.find(n=>n.dataset.studioTab==='progress').onclick();await new Promise(resolve=>setImmediate(resolve));assert(!rosterMounted);assert(el('studio-progress').children.some(n=>n.tagName==='TABLE'),el('studio-status').textContent);
 el('studio-close').onclick();assert.equal(el('teacher-studio').open,false);assert.equal(el('studio-pin').value,'');
 console.log('PASS actual Studio PIN/retry, question and objective publication, grade/island changes, embedded roster busy guard, progress table and closing.');
})().catch(e=>{console.error(e);process.exitCode=1;});
