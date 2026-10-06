/* v10.4.0 Challenge Deck. When the English wheel lands on a challenge, a real card is dealt from the class's island
   content (word pairs with Turkish and English definitions, gap sentences, short reading questions; the teacher's
   Studio edits are used where they exist).
   - Vocabulary, Translation, Grammar, Sentence Repair, Listening and Ask a Question: three options as in Island Run.
     The student taps one on the board, or says it and the teacher taps it on the phone. The board then shows
     Right or Wrong and, after a wrong answer, the correct answer with a clear explanation.
   - Taboo: the phone shows the English word and forbidden Turkish words; the student describes it in Turkish and the
     team guesses the English word. No timer. Pronunciation and Speaking: the teacher judges with ✓ / ✗.
   The game decides what a result means (game.js): right keeps the team's points and level, wrong takes the team
   back to just before it reached this wheel level. Nothing here changes points. */
(function(root){
 'use strict';
 const TYPES=['Vocabulary','Grammar','Pronunciation','Speaking','Listening','Sentence Repair','Taboo Description','Translation','Ask a Question'];
 const CHOICE=new Set(['Vocabulary','Translation','Grammar','Sentence Repair','Listening','Ask a Question']);
 const ICONS={Vocabulary:'📘',Grammar:'🧩',Pronunciation:'🗣️',Speaking:'💬',Listening:'🎧','Sentence Repair':'🔧','Taboo Description':'🚫',Translation:'🌍','Ask a Question':'❓'};
 // What each question word asks about (Ask a Question explains the right question with it).
 const WH={'how many':'a number','how much':'an amount or a price','how old':'age','how long':'a length of time','how often':'how many times something happens',
  'how far':'a distance','how tall':'height','what time':'a time','what kind':'a type of thing','what colour':'a colour',
  what:'a thing or an idea',where:'a place',when:'a time',who:'a person',whose:'who something belongs to',which:'one choice from a group',why:'a reason',
  how:'the way something is or happens'};
 const YES_NO=/^(can|could|is|are|was|were|do|does|did|have|has|will|would)\b/i;
 const QWORD=/^(what|where|when|who|whose|which|why|how)\b/i;
 const EXERCISE=/\b(word|words|sentence|sentences|description|question|statement|reply|response|phrase|fits?|means?|meaning|correct|choose|option|best|true|false|grammar|form)\b/i;
 // "What"/"Which" and "When"/"What time" can ask for the same thing, so a wrong option never shares the group of the
 // right question.
 const firstWord=q=>{const t=q.toLowerCase().replace(/['’]s\b/,''),w=t.split(/\s+/)[0];return /^what time\b/.test(t)?'when':w==='which'?'what':w;};
 function asks(question){
  if(YES_NO.test(question))return `“${question}” is a yes/no question.`;
  const two=question.toLowerCase().replace(/['’]s\b/g,'').split(/\s+/).slice(0,2).join(' ').replace(/[^a-z ]/g,''),one=two.split(' ')[0];
  const key=WH[two]?two:WH[one]?one:null;
  return key?`“${question}” — “${key[0].toUpperCase()+key.slice(1)}” asks about ${WH[key]}.`:`The question is: “${question}”`;
 }
 // Turkish of the words that most often carry a meaning in the islands' English definitions (Taboo forbids them).
 const KEY_TR=Object.fromEntries(('person:kişi place:yer food:yiyecek small:küçük large:büyük big:büyük event:etkinlik time:zaman building:bina long:uzun animal:hayvan '+
  'space:uzay natural:doğal body:vücut water:su work:iş job:meslek information:bilgi planet:gezegen material:malzeme meal:yemek device:cihaz road:yol school:okul tool:alet '+
  'money:para sea:deniz heat:ısı earth:dünya land:kara hot:sıcak cold:soğuk vehicle:araç telephone:telefon phone:telefon equipment:ekipman country:ülke sound:ses music:müzik '+
  'danger:tehlike liquid:sıvı soil:toprak air:hava game:oyun cloth:kumaş clothes:kıyafet group:grup container:kap clean:temiz home:ev house:ev rock:kaya travel:seyahat '+
  'boat:tekne sun:güneş television:televizyon power:güç sport:spor book:kitap room:oda city:şehir town:kasaba tree:ağaç plant:bitki hand:el head:baş eye:göz foot:ayak '+
  'light:ışık fire:ateş car:araba family:aile friend:arkadaş teacher:öğretmen child:çocuk children:çocuklar day:gün night:gece weather:hava sick:hasta ill:hasta '+
  'doctor:doktor hospital:hastane shop:dükkân buy:satın sell:satmak eat:yemek drink:içmek cook:pişirmek write:yazmak read:okumak speak:konuşmak play:oynamak '+
  'film:film picture:resim photo:fotoğraf computer:bilgisayar sky:gökyüzü star:yıldız moon:ay river:nehir mountain:dağ forest:orman metal:metal wood:tahta glass:cam '+
  'paper:kâğıt bread:ekmek fruit:meyve vegetable:sebze meat:et milk:süt sweet:tatlı bird:kuş fish:balık dog:köpek cat:kedi kitchen:mutfak bed:yatak sleep:uyumak '+
  'help:yardım ill:hasta pain:ağrı medicine:ilaç sad:üzgün happy:mutlu angry:kızgın afraid:korkmuş fast:hızlı slow:yavaş old:eski young:genç money:para price:fiyat '+
  'plan:plan trip:gezi holiday:tatil festival:festival party:parti friendship:arkadaşlık heart:kalp brain:beyin energy:enerji electricity:elektrik machine:makine '+
  'computer:bilgisayar message:mesaj letter:mektup word:kelime language:dil story:hikâye news:haber song:şarkı dance:dans colour:renk shape:şekil round:yuvarlak '+
  'dirty:kirli wet:ıslak dry:kuru wind:rüzgâr rain:yağmur snow:kar ice:buz island:ada ship:gemi train:tren plane:uçak bus:otobüs street:sokak garden:bahçe farm:çiftlik').split(' ').map(x=>x.split(':')));
 const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

 // ---- Content: everything a card needs, read from an island's question bank ----
 function material(bank){
  const pairs=new Map(),defs=new Map(),gaps=[],questions=[];
  for(const q of Array.isArray(bank)?bank:[]){
   if(!q||!Array.isArray(q.choices)||q.choices.length<3)continue;
   const right=clean(q.choices[q.answer??0]);
   const pair=/^(.+?) = (.+)$/.exec(clean(q.explanation));
   if(q.kind==='word'&&pair&&!pairs.has(pair[1].toLowerCase()))pairs.set(pair[1].toLowerCase(),{en:pair[1],tr:pair[2]});
   const def=/^Which word means “(.+)”\?$/.exec(clean(q.prompt));
   if(def){defs.set(right.toLowerCase(),{en:right,def:def[1]});continue;}
   if(q.kind==='gap'&&clean(q.prompt).includes('___'))gaps.push({text:clean(q.prompt),right,wrong:q.choices.filter((c,i)=>i!==(q.answer??0)).map(clean)});
   else if(q.kind==='question'&&!pair)questions.push({prompt:clean(q.prompt),right,wrong:q.choices.filter((c,i)=>i!==(q.answer??0)).map(clean)});
  }
  for(const [k,d] of defs){const p=pairs.get(k);if(p)p.def=d.def;else pairs.set(k,{en:d.en,tr:'',def:d.def});}
  return {pairs:[...pairs.values()],gaps,questions};
 }
 // Seeded randomness keeps tests repeatable; the board passes Math.random.
 function pick(list,random){return list.length?list[Math.floor(random()*list.length)]:null;}
 function others(list,not,count,random,key=x=>x){const pool=list.filter(x=>key(x).toLowerCase()!==key(not).toLowerCase()&&key(x));const out=[];while(pool.length&&out.length<count)out.push(pool.splice(Math.floor(random()*pool.length),1)[0]);return out;}
 function options(right,wrong,random){const all=[right,...wrong].map(clean);const order=all.map((text,i)=>({text,i,r:random()})).sort((a,b)=>a.r-b.r);return {options:order.map(o=>o.text),answer:order.findIndex(o=>o.i===0)};}
 const unique=list=>new Set(list.map(x=>x.toLowerCase())).size===list.length;

 // ---- The nine cards ----
 const builders={
  'Vocabulary'(m,ctx,random){const target=pick(m.pairs.filter(p=>p.def),random);if(!target)return null;const wrong=others(ctx.wordPool,target,2,random,p=>p.en).map(p=>p.en);if(wrong.length<2)return null;
   return {prompt:`Which word means “${target.def}”?`,instruction:'Read the meaning. Choose the English word.',...options(target.en,wrong,random),word:target.en,
    explain:`“${target.en}” means ${target.def}${target.tr?` (in Turkish: ${target.tr})`:''}.`};},
  'Translation'(m,ctx,random){const target=pick(m.pairs.filter(p=>p.tr),random);if(!target)return null;const wrong=others(ctx.wordPool,target,2,random,p=>p.en).map(p=>p.en);if(wrong.length<2)return null;
   return {prompt:target.tr,instruction:'What is this word in English?',...options(target.en,wrong,random),word:target.en,explain:`“${target.tr}” in English is “${target.en}”.`};},
  'Grammar'(m,ctx,random){const g=pick(m.gaps.filter(g=>g.wrong.length>=2&&unique([g.right,...g.wrong])),random);if(!g)return null;
   return {prompt:g.text,instruction:'Choose the word that completes the sentence.',...options(g.right,g.wrong.slice(0,2),random),word:g.right,explain:`The full sentence is: “${g.text.replace('___',g.right)}”`};},
  'Sentence Repair'(m,ctx,random){const g=pick(m.gaps.filter(g=>g.wrong.length>=2&&unique([g.right,...g.wrong])&&!/^\W/.test(g.wrong[0])),random);if(!g)return null;
   const mistake=g.wrong[Math.floor(random()*2)],[before,after]=g.text.split('___');
   return {prompt:`${before}${mistake}${after}`,mistake:{before,word:mistake,after},instruction:'One word is wrong. Choose the word that fixes the sentence.',...options(g.right,g.wrong.slice(0,2),random),word:g.right,
    explain:`“${mistake}” is wrong here. The correct sentence is: “${g.text.replace('___',g.right)}”`};},
  'Listening'(m,ctx,random){
   // Grades 5–6 hear a word; grades 7–8 hear a whole sentence.
   if(ctx.grade>=7){const g=pick(m.gaps.filter(g=>g.wrong.length>=2&&unique([g.right,...g.wrong])),random);if(g){const say=g.text.replace('___',g.right);
    return {prompt:'Listen carefully. Which sentence did you hear?',instruction:'Tap 🔊 to hear it again.',speak:say,...options(say,g.wrong.slice(0,2).map(w=>g.text.replace('___',w)),random),word:g.right,explain:`You heard: “${say}”`};}}
   const target=pick(m.pairs,random);if(!target)return null;const wrong=others(ctx.wordPool,target,2,random,p=>p.en).map(p=>p.en);if(wrong.length<2)return null;
   return {prompt:'Listen carefully. Which word did you hear?',instruction:'Tap 🔊 to hear it again.',speak:target.en,...options(target.en,wrong,random),word:target.en,
    explain:`You heard “${target.en}”${target.tr?` (${target.tr})`:''}.`};},
  // v10.4.1: short cards from the island's own Ask a Question list (ask-questions.js): a short answer, the question
  // that asks for it, and two proper questions that ask for something else.
  // v10.4.1: two sources. The island's own short cards (ask-questions.js: answer, question, two written wrong questions),
  // and the island's Island Run reading questions that start with a question word (short context, question, answer).
  // Exercise questions ("Which word fits?", "Which sentence…?") are left out. A reading card's wrong options are
  // questions from the island's own short cards that start with a different question word: proper English that
  // makes sense on its own and asks for something else.
  'Ask a Question'(m,ctx,random){
   const own=(m.asks||[]).filter(r=>Array.isArray(r)&&r.length===4&&r.every(Boolean)).map(r=>{const [answer,question,...wrong]=r.map(clean);return {answer,question,wrong};});
   const reading=m.questions.map(q=>{const parts=q.prompt.match(/^(.*?)([^.!?]*\?)\s*$/);if(!parts)return null;const question=parts[2].trim();
    return QWORD.test(question)&&!EXERCISE.test(question)&&question.split(/\s+/).length<=10&&q.right.split(/\s+/).length<=6?{answer:q.right,question,context:parts[1].trim()}:null;}).filter(Boolean);
   const standalone=[...new Set(own.flatMap(r=>[r.question,...r.wrong]))].filter(q=>QWORD.test(q));
   const usable=reading.map(r=>{const word=firstWord(r.question);
    const wrong=others(standalone.filter(q=>firstWord(q)!==word),r.question,2,random);
    return wrong.length===2?{...r,wrong}:null;}).filter(Boolean);
   const a=pick([...own,...usable],random);if(!a)return null;
   return {prompt:a.answer,...(a.context?{context:a.context}:{}),instruction:'Here is the answer. Choose the question that asks for it.',...options(a.question,a.wrong,random),
    word:a.question.split(' ')[0],explain:asks(a.question)};},
  'Taboo Description'(m,ctx,random){const target=pick(m.pairs.filter(p=>p.tr&&p.def),random)||pick(m.pairs.filter(p=>p.tr),random);if(!target)return null;
   // Forbidden: the Turkish translation, and the Turkish of other words from this grade that appear in its meaning.
   const inMeaning=target.def?ctx.gradePool.filter(p=>p.tr&&p.en.toLowerCase()!==target.en.toLowerCase()&&new RegExp(`\\b${p.en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(target.def)).map(p=>p.tr):[];
   // Then the Turkish of the meaning's key words (person → kişi, water → su …), so most cards forbid 2–4 words.
   const keyWords=(String(target.def||'').toLowerCase().match(/[a-z]+/g)||[]).map(w=>KEY_TR[w]||KEY_TR[w.replace(/e?s$/,'')]).filter(Boolean);
   return {judged:true,word:target.en,tr:target.tr,def:target.def||'',forbidden:[...new Set([target.tr,...inMeaning,...keyWords].map(w=>w.toLocaleLowerCase('tr')))].slice(0,4),
    prompt:'Guess the English word!',instruction:'Your teammate describes it in Turkish without the forbidden words.'};},
  'Pronunciation'(m,ctx,random){const target=pick(m.pairs.filter(p=>p.en.length>=5),random)||pick(m.pairs,random);if(!target)return null;
   return {judged:true,word:target.en,tr:target.tr,speak:target.en,prompt:target.en,instruction:'Read this word aloud clearly.'};},
  'Speaking'(m,ctx,random){const target=pick(m.pairs,random);if(!target)return null;
   return {judged:true,word:target.en,tr:target.tr,prompt:`Say one sentence with the word “${target.en}”.`,instruction:`Topic: ${ctx.theme||'this island'}${target.tr?` · ${target.en} = ${target.tr}`:''}`};}
 };
 // ctx: {grade, theme, current: bank, earlier: [bank, …], grade: [bank, …] for every island of the grade}.
 // The current island is used first; earlier islands when it has nothing for this card.
 function deal(type,ctx,random=Math.random){
  if(!builders[type])return null;
  // ctx.asks: {current: rows, earlier: [rows, …]} from ask-questions.js, in the same order as the islands.
  const current={...material(ctx.current),asks:ctx.asks?.current||[]},earlier=(ctx.earlier||[]).map((bank,i)=>({...material(bank),asks:ctx.asks?.earlier?.[i]||[]})),all=(ctx.gradeBanks||[]).map(material);
  const wordPool=[...current.pairs,...earlier.flatMap(m=>m.pairs)],gradePool=all.flatMap(m=>m.pairs);
  for(const m of [current,...earlier.slice().sort(()=>random()-.5)]){
   const card=builders[type](m,{grade:ctx.grade,theme:ctx.theme,wordPool,gradePool},random);
   if(card)return {type,icon:ICONS[type],choice:!card.judged,...card};
  }
  return null;
 }

 // ---- Board: the card, and what the phone needs to show and send ----
 let current=null,overlay=null,dealt=0,hooks={send:()=>{},changed:()=>{}};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function speak(text){try{const s=root.speechSynthesis;if(!s||!text)return false;s.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.88;
  const voice=s.getVoices().find(v=>/^en(-|_)GB/i.test(v.lang))||s.getVoices().find(v=>/^en/i.test(v.lang));if(voice)u.voice=voice;s.speak(u);return true;}catch{return false;}}
 function ensure(){
  if(overlay)return overlay;
  overlay=el('div','challenge-overlay');overlay.id='challenge-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','challenge-type');
  document.body.append(overlay);return overlay;
 }
 // A class on the wheel itself (not on the page) so only the wheel is restyled.
 const cover=on=>document.getElementById('wheel-modal')?.classList.toggle('under-challenge',on);
 function render(){
  const o=ensure(),c=current;if(!c||!c.shown){o.hidden=true;o.replaceChildren();cover(false);hooks.changed();return;}
  const card=el('div','challenge-card'),{card:k}=c;card.style.setProperty('--challenge-color',c.color||'#4f46e5');card.style.setProperty('--team-color',c.teamColor||'#94a3b8');
  card.dataset.type=k.type;card.dataset.state=c.outcome?'done':'open';
  const head=el('header','challenge-head');head.append(el('span','challenge-icon',k.icon),Object.assign(el('h2','',k.type),{id:'challenge-type'}));
  const who=el('p','challenge-who');who.textContent=c.team?`${c.student?c.student+' · ':''}${c.team}`:'Practice card';head.append(who);
  if(c.stakes&&!c.outcome)head.append(el('p','challenge-stakes',c.stakes));
  card.append(head);
  if(k.type==='Taboo Description'){
   card.append(el('p','challenge-big','🤫 Guess the English word!'),el('p','challenge-instruction',c.student?`${c.student} describes it in Turkish — without the forbidden words. ${c.team} team, guess!`:k.instruction));
  }else{
   if(k.context)card.append(el('p','challenge-context',k.context));
   const prompt=el('p','challenge-prompt');
   if(k.mistake){prompt.append(k.mistake.before,el('mark','challenge-mistake',k.mistake.word),k.mistake.after);}else prompt.textContent=k.type==='Ask a Question'?`Answer: ${k.prompt}`:k.prompt;
   card.append(prompt,el('p','challenge-instruction',k.instruction));
   if(k.speak&&(k.type==='Listening'||c.outcome&&k.type==='Pronunciation')){const b=el('button','challenge-listen','🔊 Listen');b.type='button';b.onclick=()=>speak(k.speak);card.append(b);}
  }
  if(k.choice){
   const list=el('div','challenge-options');
   k.options.forEach((text,i)=>{const b=el('button','challenge-option');b.type='button';b.dataset.index=String(i);b.append(el('b','', 'ABC'[i]),el('span','',text));
    if(c.outcome){b.disabled=true;if(i===k.answer)b.classList.add('right');else if(i===c.chosen)b.classList.add('wrong');}else b.onclick=()=>choose(i);
    list.append(b);});
   card.append(list);
  }else if(!c.outcome)card.append(el('p','challenge-judge-note','Your teacher decides on the phone: ✓ or ✗'));
  if(c.outcome){
   const r=el('div',`challenge-result ${c.outcome}`);
   r.append(el('strong','',c.outcome==='right'?'✓ Right!':c.outcome==='wrong'?'✗ Wrong':'Skipped'));
   if(c.outcome==='wrong'&&k.choice)r.append(el('p','challenge-correct',`Correct answer: ${'ABC'[k.answer]}) ${k.options[k.answer]}`));
   if(c.outcome==='wrong'&&k.type==='Taboo Description')r.append(el('p','challenge-correct',`The word was “${k.word}”.`));
   if(k.explain&&c.outcome!=='skipped')r.append(el('p','challenge-explain',k.explain));
   if(c.message)r.append(el('p','challenge-consequence',c.message));
   const go=el('button','challenge-continue','Continue');go.type='button';go.onclick=()=>finish();r.append(go);card.append(r);
  }else{const skip=el('button','challenge-skip','Skip card');skip.type='button';skip.onclick=()=>resolve(null);card.append(skip);}
  // The wheel (and its blurred backdrop) is not drawn under the card, and only the card animates: old boards stay smooth.
  o.replaceChildren(card);o.hidden=false;cover(true);
  if(!c.flipped&&typeof card.animate==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){c.flipped=true;
   card.animate([{transform:'perspective(900px) rotateY(80deg)',opacity:0},{transform:'none',opacity:1}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});}
  hooks.changed();
 }
 function resolve(ok,chosen=null){
  const c=current;if(!c||c.outcome)return {ok:false,message:'No open challenge card'};
  c.chosen=chosen;c.shown=true;c.outcome=ok===null?'skipped':ok?'right':'wrong';
  c.message=c.onResolve?.(ok===null?null:Boolean(ok),c.card)||'';
  if(ok===null){finish();return {ok:true};}
  render();return {ok:true};
 }
 function choose(i){const c=current;if(!c||c.outcome||!c.card.choice||![0,1,2].includes(i))return {ok:false,message:'Choose A, B or C'};return resolve(i===c.card.answer,i);}
 function judge(ok){const c=current;if(!c||c.outcome||c.card.choice)return {ok:false,message:'This card is answered on the board'};return resolve(Boolean(ok));}
 function finish(){const c=current;if(!c)return;current=null;render();try{root.speechSynthesis?.cancel();}catch{}c.onClose?.();}
 // Closed by the game (a new session, a cancelled wheel): no result and no callbacks.
 function dismiss(){if(!current)return;current=null;render();try{root.speechSynthesis?.cancel();}catch{}}
 // options: {team, teamColor, student, color, stakes (what right and wrong mean), delay, onResolve(ok|null, card) → message, onClose()}
 // The wheel's result stays in view for a moment (delay); the phone gets the card at once (Taboo: show it right away).
 function open(card,options={}){const c=current={card,...options,id:++dealt,outcome:null,flipped:false,shown:false},delay=options.delay??650;render();
  setTimeout(()=>{if(current!==c||c.shown)return;c.shown=true;render();if(card.type==='Listening')setTimeout(()=>{if(current===c)speak(card.speak);},500);},delay);return true;}
 // What the teacher's phone shows. The phone is the teacher's: Taboo, Pronunciation and Speaking show the word.
 // Choice cards hide the right option until it has been chosen.
 function remoteView(){
  const c=current;if(!c)return null;const k=c.card;
  return {id:c.id,type:k.type,icon:k.icon,team:c.team||'',student:c.student||'',stakes:c.stakes||'',prompt:k.prompt,context:k.context||'',instruction:k.instruction,choice:k.choice,
   options:k.choice?k.options:null,outcome:c.outcome,chosen:c.chosen??null,answer:c.outcome&&k.choice?k.answer:null,message:c.message||'',
   word:k.judged?k.word:null,tr:k.judged?k.tr||'':null,def:k.judged?k.def||'':null,forbidden:k.forbidden||null,speak:Boolean(k.speak),explain:c.outcome?k.explain||'':''};
 }
 function command(data){
  const op=data?.op;
  // Each phone button names its card, so a late tap never answers the next card.
  if(data?.card!==undefined&&data.card!==current?.id)return {ok:false,message:'That card has already closed'};
  if(op==='choose')return choose(Number(data.index));
  if(op==='judge')return judge(data.ok===true);
  if(op==='skip')return resolve(null);
  if(op==='continue'){if(current?.outcome){finish();return {ok:true};}return {ok:false,message:'Answer the card first'};}
  if(op==='speak'){const k=current?.card;return k?.speak?{ok:speak(k.speak)}:{ok:false,message:'Nothing to play'};}
  return {ok:false,message:'Unknown challenge action'};
 }
 // ---- Phone: the panel in the wheel overlay; buttons send commands to the board ----
 function renderRemote(host,view,send){
  if(!host)return;host.hidden=!view;host.replaceChildren();if(!view)return;
  const add=(tag,cls,text)=>{const n=el(tag,cls,text);host.append(n);return n;};
  add('p','mobile-challenge-type',`${view.icon} ${view.type}`);
  if(view.team)add('p','mobile-challenge-who',`${view.student?view.student+' · ':''}${view.team}`);
  if(view.stakes&&!view.outcome)add('p','mobile-challenge-note',view.stakes);
  const button=(text,cls,op,extra={})=>{const b=el('button',`mobile-challenge-btn ${cls}`,text);b.type='button';b.onclick=()=>send({op,card:view.id,...extra});host.append(b);return b;};
  if(view.type==='Taboo Description'){
   add('p','mobile-challenge-word',view.word);if(view.def)add('p','mobile-challenge-def',view.def);
   const f=add('div','mobile-challenge-forbidden');f.append(el('span','','Yasak kelimeler (forbidden):'));for(const w of view.forbidden||[])f.append(el('b','',w));
   add('p','mobile-challenge-note','Show this screen to the student who describes the word.');
  }else if(!view.choice){
   add('p','mobile-challenge-word',view.word);if(view.tr)add('p','mobile-challenge-def',view.tr);add('p','mobile-challenge-note',view.prompt);
   if(view.speak)button('🔊 Play on the board','ghost','speak');
  }else{
   if(view.context)add('p','mobile-challenge-note',view.context);add('p','mobile-challenge-prompt',view.type==='Ask a Question'?`Answer: ${view.prompt}`:view.prompt);
   if(view.speak)button('🔊 Play again on the board','ghost','speak');
   view.options.forEach((text,i)=>{const b=button(`${'ABC'[i]}) ${text}`,'option','choose',{index:i});if(view.outcome){b.disabled=true;if(i===view.answer)b.classList.add('right');else if(i===view.chosen)b.classList.add('wrong');}});
  }
  if(view.outcome){add('p',`mobile-challenge-result ${view.outcome}`,view.outcome==='right'?'✓ Right':'✗ Wrong');if(view.message)add('p','mobile-challenge-note',view.message);button('Continue','primary','continue');}
  else{if(!view.choice){button('✓ Correct','yes','judge',{ok:true});button('✗ Not correct','no','judge',{ok:false});}button('Skip card','ghost','skip');}
 }
 const api={TYPES,CHOICE,material,deal,open,dismiss,choose,judge,command,remoteView,renderRemote,speak,configure(h){hooks={...hooks,...h};},get active(){return Boolean(current);},get answered(){return Boolean(current?.outcome);},get card(){return current?.card||null;}};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LeagueChallenge=api;
})(typeof globalThis!=='undefined'?globalThis:this);
