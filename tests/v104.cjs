/* v10.4.0 dependency-free checks: the Challenge Deck on the English wheel.
   - Every card type can be dealt for every island of grades 5–8, from the island's own content first.
   - Choice cards: three different options, one right; the right one is what the explanation names.
   - Taboo: the English word with 1–4 forbidden Turkish words, the Turkish translation first.
   - The teacher's Studio content (pasted word pairs) is enough for Translation, Taboo, Speaking and Pronunciation.
   - Apps Script v10.4.0 writes Challenge_Log (day-first dates, no duplicate rows, invalid rows refused); the
     Netlify function keeps cards on the phone while the Sheet runs an older script.
   - Board wiring: the go-back point, the stakes line, the recovery snapshot, the phone panel and the Sheets payload.
   Browser checks: board-v104.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {makeGas}=require('./roster-gas-harness.cjs');
const C=require('../public/island-runner/expand-content.js'),L=require('../public/challenge-deck.js'),A=require('../public/ask-questions.js');
let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const pub=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const seeded=seed=>()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const ctx=(g,i,banks=C.grades[g].map(u=>u.bank))=>({grade:g,theme:C.grades[g][i].theme,current:banks[i],earlier:banks.slice(0,i),gradeBanks:banks,
 asks:{current:A.grades[g][i],earlier:A.grades[g].slice(0,i)}});
(async()=>{
await test('Every card type is dealt for every island of grades 5–8 (9 types × 40 islands × 5 deals); choice cards have three different options and one right answer',()=>{
 let dealt=0;
 for(const g of [5,6,7,8])for(let i=0;i<10;i++)for(const type of L.TYPES)for(let s=1;s<=5;s++){
  const card=L.deal(type,ctx(g,i),seeded(s*7919+i*31+g));assert(card,`${type} · grade ${g} island ${i+1}`);dealt++;
  assert.equal(card.type,type);assert.equal(card.choice,L.CHOICE.has(type));
  if(card.choice){
   assert.equal(card.options.length,3);assert.equal(new Set(card.options.map(o=>o.toLowerCase())).size,3,JSON.stringify(card.options));
   assert([0,1,2].includes(card.answer));assert(card.explain&&card.instruction&&card.prompt);
   if(['Vocabulary','Translation'].includes(type))assert.equal(card.options[card.answer],card.word);
   if(type==='Grammar'||type==='Sentence Repair')assert(card.explain.includes(card.options[card.answer]));
  }else assert(card.judged&&card.word&&card.prompt);
 }
 assert.equal(dealt,1800);
});
await test('Cards come from the team’s current island first (words of island 4 on island 4)',()=>{
 const own=new Set(L.material(C.grades[6][3].bank).pairs.map(p=>p.en));
 for(let s=1;s<=30;s++){const card=L.deal('Translation',ctx(6,3),seeded(s));assert(own.has(card.word),card.word);}
});
await test('Sentence Repair marks one wrong word that is among the options; Listening: grades 5–6 hear a word, grades 7–8 a sentence',()=>{
 for(let s=1;s<=20;s++){const c=L.deal('Sentence Repair',ctx(5,s%10),seeded(s));assert.equal(c.prompt,c.mistake.before+c.mistake.word+c.mistake.after);
  assert(c.options.includes(c.mistake.word));assert.notEqual(c.options[c.answer],c.mistake.word);}
 const young=L.deal('Listening',ctx(5,2),seeded(3)),old=L.deal('Listening',ctx(8,2),seeded(3));
 assert(!/\s/.test(young.speak.trim())||young.speak.split(' ').length<=3,'a word');assert(old.speak.split(' ').length>=4,'a sentence');assert.equal(old.options[old.answer],old.speak);
});
await test('v10.4.1 Ask a Question: its own short cards (six per island, 240) plus Island Run reading questions with proper wrong questions',()=>{
 let rows=0;
 for(const g of [5,6,7,8]){assert.equal(A.grades[g].length,10);
  A.grades[g].forEach((island,i)=>{assert.equal(island.length,6,`grade ${g} island ${i+1}`);
   for(const r of island){rows++;assert.equal(r.length,4);assert.match(r[0],/[.!?]$/);const qs=r.slice(1);
    assert(qs.every(q=>q.endsWith('?')&&q.split(/\s+/).length<=8),JSON.stringify(r));assert.equal(new Set(qs.map(q=>q.toLowerCase())).size,3);}});}
 assert.equal(rows,240);
 // Two sources: the island's own short cards (their own written wrong questions), and Island Run reading questions
 // that start with a question word, whose wrong options are the island's standalone questions with another question word.
 const island=A.grades[5][0],standalone=new Set(island.flatMap(r=>r.slice(1))),group=q=>{const t=q.toLowerCase(),w=t.split(' ')[0];return /^what time\b/.test(t)?'when':w==='which'?'what':w;};
 let own=0,reading=0;
 for(let s=1;s<=60;s++){const c=L.deal('Ask a Question',ctx(5,0),seeded(s));const row=island.find(r=>r[0]===c.prompt&&r[1]===c.options[c.answer]);
  if(row){own++;assert.deepEqual([...c.options].sort(),row.slice(1).sort());assert.equal(c.context,undefined);continue;}
  reading++;const right=c.options[c.answer],wrong=c.options.filter((o,i)=>i!==c.answer);
  assert(/^(What|Where|When|Who|Whose|Which|Why|How)\b/.test(right)&&right.split(' ').length<=10,right);
  assert.doesNotMatch(right,/\b(word|sentence|description|statement|reply|fits?)\b/i,'exercise questions are left out');
  for(const w of wrong){assert(standalone.has(w),w);assert.notEqual(group(w),group(right));}}
 assert(own>0&&reading>0,`both sources are used (${own} own, ${reading} from Island Run)`);
 const one=r=>L.deal('Ask a Question',{grade:6,current:[],asks:{current:[r]}},seeded(2)).explain;
 assert.equal(one(['At eight o\'clock.','What time does school start?','Where does school start?','Who starts school?']),'“What time does school start?” — “What time” asks about a time.');
 assert.equal(one(['Speaking.','Can I speak to Mert, please?','Where is Mert?','Who is Mert?']),'“Can I speak to Mert, please?” is a yes/no question.');
 assert.match(one(['It\'s Selin.','Who\'s calling, please?','Where are you calling from?','Why are you calling?']),/“Who” asks about a person\./);
 assert.equal(L.deal('Ask a Question',{grade:5,current:C.grades[5][0].bank},seeded(1)),null,'without the island’s own cards there are no clean wrong options: no card');
});
await test('Taboo: the English word with 1–4 forbidden Turkish words (the translation first, then Turkish words of its meaning)',()=>{
 const counts=new Map();
 for(const g of [5,6,7,8])for(let i=0;i<10;i++)for(let s=1;s<=4;s++){
  const c=L.deal('Taboo Description',ctx(g,i),seeded(s+i));assert(c.word&&c.tr);
  assert(c.forbidden.length>=1&&c.forbidden.length<=4);assert.equal(c.forbidden[0],c.tr.toLocaleLowerCase('tr'));
  // A cognate (festival = festival) is forbidden on purpose: saying it gives the word away.
  assert(!c.forbidden.some(w=>w.toLowerCase()===c.word.toLowerCase())||c.tr.toLowerCase()===c.word.toLowerCase(),'the English word only when Turkish uses it too');counts.set(c.forbidden.length,(counts.get(c.forbidden.length)||0)+1);
 }
 const neck=L.deal('Taboo Description',{grade:5,current:[{kind:'word',prompt:'neck',choices:['boyun','x','y'],answer:0,explanation:'neck = boyun'},{kind:'question',prompt:'Which word means “the body part between your head and shoulders”?',choices:['neck','arm','leg'],answer:0}],gradeBanks:[]},seeded(1));
 assert.deepEqual(neck.forbidden,['boyun','vücut','baş']);
 assert((counts.get(2)||0)+(counts.get(3)||0)+(counts.get(4)||0)>(counts.get(1)||0),'most cards forbid two or more words: '+JSON.stringify([...counts]));
});
await test('The teacher’s Studio word pairs are enough: Translation, Taboo, Pronunciation and Speaking from pasted pairs only',()=>{
 const M=require('../public/teaching-model.js');
 const bank=M.bulk('library|kütüphane\nnotebook|defter\neraser|silgi\nruler|cetvel','5-3');
 for(const type of ['Translation','Taboo Description','Pronunciation','Speaking']){const c=L.deal(type,{grade:5,current:bank,earlier:[],gradeBanks:[bank]},seeded(4));assert(c,type);assert(['library','notebook','eraser','ruler'].includes(c.word));}
 assert.equal(L.deal('Vocabulary',{grade:5,current:bank},seeded(4)),null,'no meanings pasted: the wheel shows the label only');
});
await test('Apps Script v10.4.0: Challenge_Log rows (day-first dates), no duplicates on a retried save, invalid rows refused, Load islands reports the version',()=>{
 const gas=makeGas(),pin='2595',at=Date.now();
 assert.equal(gas.post({type:'ISLAND_GET',pin,className:'5-A'}).challengeLogVersion,1);
 const row=(n,extra={})=>({id:`lesson-7-c${n}`,at:at+n,className:'5-A',team:'Gryffindor',studentId:'5-A:gryffindor:4',student:'Yusuf H.',level:5,type:'Taboo Description',word:'uniform',island:1,result:'wrong',...extra});
 const save=rows=>gas.post({type:'LEADERBOARD_FINAL',pin,className:'5-A',sessionId:'lesson-7',standings:[{name:'Gryffindor',points:240,level:4}],challengeLog:rows});
 let r=save([row(1),row(2,{result:'right',type:'Grammar',word:'=SUM(A1)'}),row(3,{team:'Practice',level:0,studentId:'',student:'',result:'skipped'})]);
 assert.equal(r.status,'success');assert.equal(r.challengesAdded,3);assert.equal(r.challengeLogVersion,1);
 const sheet=gas.sheets.get('Challenge_Log');
 assert.deepEqual(sheet.rows[0],['Date','Class','Team','Student','Student ID','Wheel level','Card','Word','Island','Result','Row ID','Session ID']);
 assert.deepEqual(sheet.rows[1].slice(1),['5-A','Gryffindor','Yusuf H.','5-A:gryffindor:4',5,'Taboo Description','uniform',1,'Wrong','lesson-7-c1','lesson-7']);
 assert.equal(sheet.rows[2][7],"'=SUM(A1)",'a formula is written as text');assert.equal(sheet.rows[3][2],'Practice');assert.equal(sheet.rows[3][5],'');assert.equal(sheet.rows[3][9],'Skipped');
 assert(sheet.rows[1][0] instanceof gas.SheetDate);assert.equal(sheet.formats.get('2:1'),'dd/mm/yyyy hh:mm:ss');
 r=save([row(1),row(2),row(3),row(4,{result:'right'})]);assert.equal(r.challengesAdded,1,'a retried save adds only the new card');assert.equal(sheet.getLastRow(),5);
 for(const bad of [row(9,{className:'6-C'}),row(9,{type:'Chemistry'}),row(9,{result:'maybe'}),row(9,{island:11}),row(9,{id:'bad id'}),row(9,{level:3}),row(9,{team:'Dragons'})]){
  r=save([bad]);assert.equal(r.status,'error');assert.match(r.message,/Invalid Challenge Deck row/);}
 assert.equal(sheet.getLastRow(),5,'a refused save writes nothing');
});
await test('Netlify: Challenge cards wait on the phone while the Sheet runs an older script; the v10.4.0 script takes them',async()=>{
 const {handleSession}=await import('../netlify/functions/session.mjs');
 const req=data=>new Request('https://school.test/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const payload={type:'LEADERBOARD_FINAL',pin:'2595',className:'5-A',sessionId:'lesson-8',islandProgress:{},standings:[],
  challengeLog:[{id:'lesson-8-c1',at:Date.now(),className:'5-A',team:'Slytherin',studentId:'',student:'',level:5,type:'Speaking',word:'club',island:2,result:'right'}]};
 let writes=0;const older=async(url,o)=>{const b=JSON.parse(o.body);if(b.type!=='ISLAND_GET')writes++;return new Response(JSON.stringify({status:'success',islandProgress:{},questionLogVersion:1,contributionsVersion:1,navigatorSealsVersion:1}));};
 const r=await (await handleSession(req(payload),older)).json();assert.equal(r.status,'error');assert.match(r.message,/Challenge cards are kept on this phone\. Update Apps Script using GOOGLE-APPS-SCRIPT-v10\.4\.0\.gs/);assert.equal(writes,0);
 const gas=makeGas();const current=async(url,o)=>new Response(JSON.stringify(gas.post(JSON.parse(o.body))));
 const ok=await (await handleSession(req(payload),current)).json();assert.equal(ok.status,'success');assert.equal(ok.challengesAdded,1);
});
await test('Board wiring: the go-back point, the stakes, wrong/right/skip, the recovery snapshot, the phone panel and the Sheets payload',()=>{
 const game=pub('game.js'),html=pub('index.html');
 assert.match(game,/pendingAnimatedWheels\.push\(\{teamId,stage,restore:levelStarts\.get\(`\$\{teamId\}:\$\{stage - 1\}`\) \|\| null,student\}\);/);
 assert.equal((game.match(/noteLevelStart\(team\);/g)||[]).length,4,'every level-up records where the team stood (Animated, both chests, Unity)');
 assert.match(game,/if \(person\) lastAwardStudent\.set\(team\.id, \{id:person\.id, name:person\.name\}\);/);
 assert.match(game,/if \(startChallenge\(sub, index, activeAnimatedWheel, \{ delay:advanceImmediately \? 0 : undefined \}\)\) \{/);
 assert.match(game,/stakes:team \? `✓ Right: keep Level \$\{team\.level\} · ✗ Wrong: back to Level \$\{wheel\.restore\?\.level \?\? wheel\.stage - 1\}` : '',/);
 assert.match(game,/team\.wheelMilestonesReached = team\.wheelMilestonesReached\.filter\(stage => stage <= team\.level\);/);
 assert.match(game,/saveState\(\); \/\/ Undo puts the team back/);
 assert.match(game,/if \(LeagueChallenge\.active\) \{ LeagueChallenge\.command\(\{op:LeagueChallenge\.answered \? 'continue' : 'skip'\}\); return; \}/,'Close Wheel / Skip / Exit: Skip card before an answer, Continue after');
 assert.match(game,/const active=activeAnimatedWheel&&\(!activeWheelSpin\?\.settled\|\|LeagueChallenge\.active&&!LeagueChallenge\.answered\)\?/,'an answered card is not dealt again after a reload');
 assert.match(game,/levelStarts:\[\.\.\.levelStarts\],lastAwardStudent:\[\.\.\.lastAwardStudent\],challengeLog,/);
 assert.match(game,/levelStarts=new Map\(\);lastAwardStudent=new Map\(\);challengeLog=\[\];/,'a new session starts afresh');
 assert.match(game,/if\(data\.action==='CHALLENGE'\)\{if\(!LeagueChallenge\.active\)return \{ok:false,message:'No challenge card is open'\};return LeagueChallenge\.command\(data\);\}/);
 assert.match(game,/challenge: globalThis\.LeagueChallenge\?\.remoteView\(\) \|\| null/);
 assert.match(game,/challengeLog:challengeLog\.filter\(row=>row\.className===selectedClass\)\.slice\(-200\),/);
 assert.match(game,/if\(cards\.length\)payload\.challengeLog=cards\.filter\(row=>row\?\.className===classInput\)\.slice\(-200\);/);
 assert.match(game,/if \(globalThis\.RunnerContent\?\.version === 3\) return;/,'the compiled content (24 pairs with meanings) is loaded before cards are dealt');
 assert(html.indexOf('challenge-deck.js?v=')>0&&html.indexOf('ask-questions.js?v=')>0&&html.indexOf('ask-questions.js')<html.indexOf('game.js?v=')&&html.indexOf('challenge-deck.js')<html.indexOf('game.js?v='));
 assert.match(game,/asks:\{ current:ask\[island - 1\] \|\| \[\], earlier:ask\.slice\(0, island - 1\) \}/,'Ask a Question uses the team’s island first');assert(html.includes('challenge-deck.css?v='));
 assert(html.indexOf('id="mobile-challenge"')<html.indexOf('id="mobile-wheel-close-btn"'));
 assert.doesNotMatch(pub('challenge-deck.css'),/color-mix|backdrop-filter/,'plain colours, no blur: old smart boards');
 assert.match(pub('challenge-deck.css'),/#wheel-modal\.under-challenge\{visibility:hidden!important\}/,'the wheel and its blurred backdrop are not drawn under the card');
 assert.match(pub('challenge-deck.js'),/o\.replaceChildren\(card\);o\.hidden=false;cover\(true\);/);
 assert.doesNotMatch(pub('challenge-deck.js'),/o\.animate\(/,'only the card animates, never the full-screen backdrop');
 assert.match(pub('challenge-deck.js'),/if\(data\?\.card!==undefined&&data\.card!==current\?\.id\)return \{ok:false,message:'That card has already closed'\};/);
});
console.log(JSON.stringify({checks}));
})().catch(error=>{console.error(error);process.exit(1);});
