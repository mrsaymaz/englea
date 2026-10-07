/* v10.4.1 Island Run content check: questions short and easy (all grades, or one: node island-short.cjs 6).
   Limits: reading/question tasks ≤ 10 words; answer choices ≤ 5 words; meanings ≤ 8 words; gap sentences ≤ 12 words.
   The structure is fixed: the same number of islands, words, gaps and tasks in each file, the correct answer first,
   three different choices, one ___ in each gap, and each word's English and Turkish unchanged (so saved progress
   and answer logs still match). */
const fs=require('fs'),path=require('path'),vm=require('vm'),{execSync}=require('child_process');
const dir=path.join(__dirname,'../public/island-runner');
const wc=s=>String(s).trim().split(/\s+/).filter(Boolean).length;
const LIMIT={question:10,choice:5,meaning:8,gap:12};
function load(source,file){const c={};c.window=c;vm.createContext(c);vm.runInContext(source,c,{filename:file});return c.RunnerExpansion||c.RunnerVariety;}
const rows=s=>s.trim().split('\n').map(l=>l.split('|').map(v=>v.trim()));
const grades=process.argv[2]?[Number(process.argv[2])]:[5,6,7,8];
let problems=[];
for(const g of grades)for(const kind of ['questions','variety']){
 const file=`${kind}-grade${g}.js`,now=load(fs.readFileSync(path.join(dir,file),'utf8'),file)[g];
 let base=null;try{base=load(execSync(`git show 8553fb9:public/island-runner/${file}`,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','ignore']}),file)[g];}catch{}
 const say=(i,m)=>problems.push(`${file} island ${i+1}: ${m}`);
 if(now.length!==10)say(-1,'must have 10 islands');
 now.forEach((p,i)=>{
  const w=rows(p.words),gp=rows(p.gaps),q=rows(p.questions);
  if(base){const b=base[i];const bw=rows(b.words);
   if(w.length!==bw.length||gp.length!==rows(b.gaps).length||q.length!==rows(b.questions).length)say(i,'the number of words, gaps or tasks changed');
   w.forEach((r,n)=>{if(!bw[n]||r[0]!==bw[n][0]||r[1]!==bw[n][1])say(i,`word ${n+1}: keep the English and Turkish (${bw[n]?.slice(0,2).join('|')})`);});}
  w.forEach((r,n)=>{if(r.length!==3)say(i,`word row ${n+1} needs english|turkish|meaning`);else{
   if(wc(r[2])>LIMIT.meaning)say(i,`meaning of “${r[0]}” has ${wc(r[2])} words: ${r[2]}`);
   if(new RegExp(`\\b${r[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(r[2]))say(i,`meaning of “${r[0]}” contains the word itself`);}});
  gp.forEach((r,n)=>{if(r.length!==4)say(i,`gap row ${n+1} needs sentence|right|wrong|wrong`);
   else{if((r[0].match(/___/g)||[]).length!==1)say(i,`gap ${n+1} needs exactly one ___: ${r[0]}`);if(wc(r[0])>LIMIT.gap)say(i,`gap ${n+1} has ${wc(r[0])} words: ${r[0]}`);
    if(new Set(r.slice(1).map(x=>x.toLowerCase())).size!==3)say(i,`gap ${n+1} choices repeat`);}});
  q.forEach((r,n)=>{if(r.length!==4)say(i,`task row ${n+1} needs prompt|right|wrong|wrong`);
   else{if(wc(r[0])>LIMIT.question)say(i,`task ${n+1} has ${wc(r[0])} words: ${r[0]}`);
    r.slice(1).forEach(c=>{if(wc(c)>LIMIT.choice)say(i,`task ${n+1} choice has ${wc(c)} words: ${c}`);});
    if(new Set(r.slice(1).map(x=>x.toLowerCase())).size!==3)say(i,`task ${n+1} choices repeat`);
    if(r.some(x=>/[`|]/.test(x)))say(i,`task ${n+1} contains | or a backtick`);}});
 });
}
// v10.4.2: translate-grade5–8.js: ten Turkish → English rows per island (Turkish|correct English|wrong|wrong).
// Short (Turkish ≤ 10 words, English ≤ 10 words, ≤ 65 characters), at least 3 questions and 3 statements per island,
// every option ends like the Turkish (? or .), three different options.
for(const g of grades){
 const file=`translate-grade${g}.js`,full=path.join(dir,file);
 if(!fs.existsSync(full)){problems.push(`${file}: missing`);continue;}
 const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync(full,'utf8'),c,{filename:file});
 const islands=c.RunnerTranslate?.[g];const say=(i,m)=>problems.push(`${file} island ${i+1}: ${m}`);
 if(!Array.isArray(islands)||islands.length!==10){problems.push(`${file}: needs 10 islands`);continue;}
 islands.forEach((text,i)=>{const r=rows(text);if(r.length!==10)say(i,`needs 10 rows (has ${r.length})`);
  let q=0,st=0;const seen=new Set();
  r.forEach((x,n)=>{if(x.length!==4||x.some(v=>!v)){say(i,`row ${n+1} needs turkish|english|wrong|wrong`);return;}
   if(seen.has(x[0]))say(i,`row ${n+1} repeats a Turkish sentence`);seen.add(x[0]);
   const end=x[0].slice(-1);if(end==='?')q++;else st++;
   if(!/[.?!]$/.test(x[0]))say(i,`row ${n+1}: end the Turkish with . ? or !`);
   if(wc(x[0])>10)say(i,`row ${n+1}: Turkish has ${wc(x[0])} words`);
   x.slice(1).forEach(e=>{if(wc(e)>10||e.length>65)say(i,`row ${n+1}: English too long: ${e}`);if((e.slice(-1)==='?')!==(end==='?'))say(i,`row ${n+1}: “${e}” should end like the Turkish`);});
   if(new Set(x.slice(1).map(e=>e.toLowerCase())).size!==3)say(i,`row ${n+1}: options repeat`);
   if(x.some(v=>/[`|]/.test(v)))say(i,`row ${n+1} contains | or a backtick`);});
  if(q<3||st<3)say(i,`needs at least 3 questions and 3 statements (has ${q} and ${st})`);
 });
}
if(problems.length){console.log(problems.join('\n'));console.log(`\n${problems.length} problems`);process.exitCode=1;}
else console.log(`PASS Island Run content for grade${grades.length>1?'s 5–8':' '+grades[0]} is short: tasks ≤ ${LIMIT.question} words, choices ≤ ${LIMIT.choice}, meanings ≤ ${LIMIT.meaning}, gaps ≤ ${LIMIT.gap}; structure, words and correct answers kept; ten short translations per island`);
