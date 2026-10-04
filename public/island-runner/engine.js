(function(root){
  'use strict';
  const I=typeof module==='object'&&module.exports?require('./islands.js'):root.RunnerIslands;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function random(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(a,rng){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
  function validateQuestion(q){
    return !!q&&typeof q==='object'&&['word','gap','question'].includes(q.kind)&&typeof q.id==='string'&&q.id.length>0&&q.id.length<=100&&typeof q.prompt==='string'&&q.prompt.trim().length>0&&q.prompt.length<=150&&Array.isArray(q.choices)&&q.choices.length===3&&q.choices.every(a=>typeof a==='string'&&a.trim().length>0&&a.length<=65)&&new Set(q.choices.map(a=>a.trim().toLocaleLowerCase('tr'))).size===3&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<=2&&(q.explanation===undefined||typeof q.explanation==='string'&&q.explanation.length<=200)&&(q.instruction===undefined||typeof q.instruction==='string'&&q.instruction.length<=80)&&(q.concept===undefined||typeof q.concept==='string'&&q.concept.length<=100);
  }
  function cleanQuestion(q){const out={id:q.id,kind:q.kind,prompt:q.prompt.trim(),choices:q.choices.map(c=>c.trim()),answer:q.answer,instruction:q.instruction||({word:'Choose the meaning',gap:'Complete the sentence',question:'Choose the best answer'}[q.kind]),explanation:q.explanation||q.choices[q.answer]};if(q.concept)out.concept=q.concept;return out;}
  // Remember word meanings and grammar patterns as well as individual prompt IDs.
  function familyOf(q){
    if(q.concept)return q.concept;
    if(q.kind!=='gap')return q.id;
    const choices=q.choices.map(v=>v.trim().toLowerCase()),prompt=q.prompt.toLowerCase(),has=v=>choices.includes(v),all=values=>choices.every(v=>values.includes(v));
    if(all(['is','are','am']))return /now|at the moment|look!|listen!/.test(prompt)?'gap:progressive-be':'gap:present-be';
    if(has('was')&&has('were'))return 'gap:past-be';
    if(has('will')&&/future|tomorrow|think|hope|will|one day/.test(prompt))return 'gap:future';
    if(/, ___ (he|she|it|they|we|you)\?/.test(prompt))return 'gap:question-tag';
    if(choices.every(v=>/^(who|what|which|where|when|why|how|whose)/.test(v)))return 'gap:question-word';
    if(has('than')&&has('then'))return 'gap:comparison-link';
    if(all(['in','on','at','to','of','for','from','by','under','into','between','across','through']))return 'gap:preposition';
    if(choices.some(v=>['myself','yourself','himself','herself','ourselves','themselves'].includes(v)))return 'gap:reflexive';
    if(all(['i','me','my','mine','he','him','his','she','her','hers','we','us','our','ours','it','its','they','them','their']))return 'gap:pronouns';
    if(choices.some(v=>['many','much','a few','a little','any','some'].includes(v)))return 'gap:quantity';
    if(has('have')&&has('has'))return 'gap:have-got';
    if(/plural|one .*, two|one .*two|there are (two|three|four)|two ___|three ___/.test(prompt))return 'gap:plurals';
    if(/than|of the|of all|in our solar system/.test(prompt)&&choices.some(v=>/er$|est$/.test(v)||['more','most','less','least'].includes(v)))return 'gap:comparison-form';
    if(/yesterday|last |ago|in (19|20)\d\d/.test(prompt)&&!/^did |didn.t/.test(prompt))return q.choices[q.answer].endsWith('ed')?'gap:regular-past':'gap:irregular-past';
    const stems=choices.map(v=>v.replace(/ies$/,'y').replace(/ing$|es$|s$/,'').replace(/(.)\1$/,'$1').replace(/e$/,''));
    if(new Set(stems).size===1)return 'gap:verb-form';
    return 'gap:'+choices.sort().join('|');
  }
  function markSeen(history,bank,q){
    const ids=bank.filter(b=>b.kind===q.kind).map(b=>b.id),allowed=new Set(ids);
    let used=(history[q.kind]||[]).filter(id=>allowed.has(id));
    if(ids.every(id=>used.includes(id)))used=[];
    if(!used.includes(q.id))used.push(q.id);
    history[q.kind]=used;
    const family=familyOf(q);
    history.recent=[...(history.recent||[]).filter(v=>v!==family),family].slice(-36);
    history.lastLane=q.answer;
  }
  // Review questions (missed concepts from earlier runs) take at most two fixed slots.
  const reviewSlots=[1,4];
  function selectQuestions(bank,rng,count=6,history={},review=[]){
    const valid=bank.filter(validateQuestion);if(!valid.length)throw Error('This island needs at least one valid question.');
    const local=JSON.parse(JSON.stringify(history)),used=new Set(),families=new Set();
    const reviews=(Array.isArray(review)?review:[]).filter(validateQuestion).slice(0,Math.min(2,Math.max(0,count-1)));
    const reviewAt=new Map(reviews.map((q,i)=>[reviewSlots[i],q]));
    for(const q of reviews){used.add(q.id);families.add(familyOf(q));}
    const kinds=shuffle(Array.from({length:count},(_,i)=>['word','gap','question'][i%3]),rng);
    const lanes=shuffle(Array.from({length:count},(_,i)=>i%3),rng);
    if(lanes[0]===history.lastLane){const j=lanes.findIndex(l=>l!==lanes[0]);if(j>0)[lanes[0],lanes[j]]=[lanes[j],lanes[0]];}
    return kinds.map((kind,index)=>{
      if(reviewAt.has(index)){
        const q=cleanQuestion(reviewAt.get(index)),wrong=shuffle([0,1,2].filter(j=>j!==q.answer),rng),answer=lanes[index],choices=[];
        for(let j=0;j<3;j++)choices.push(q.choices[j===answer?q.answer:wrong.shift()]);
        const selected={...q,choices,answer,review:true,family:familyOf(q)};markSeen(local,valid,selected);return selected;
      }
      let pool=valid.filter(q=>q.kind===kind);if(!pool.length)pool=valid;
      const unseen=pool.filter(q=>!(local[q.kind]||[]).includes(q.id));if(unseen.length)pool=unseen;
      const fresh=pool.filter(q=>!used.has(q.id));if(fresh.length)pool=fresh;
      const different=pool.filter(q=>!families.has(familyOf(q)));if(different.length)pool=different;
      const recent=local.recent||[],notRecent=pool.filter(q=>!recent.includes(familyOf(q)));
      if(notRecent.length)pool=notRecent;
      else {const oldest=Math.min(...pool.map(q=>recent.indexOf(familyOf(q))));pool=pool.filter(q=>recent.indexOf(familyOf(q))===oldest);}
      const q=cleanQuestion(pool[Math.floor(rng()*pool.length)]);used.add(q.id);families.add(familyOf(q));
      const wrong=shuffle([0,1,2].filter(j=>j!==q.answer),rng),answer=lanes[index],choices=[];
      for(let j=0;j<3;j++)choices.push(q.choices[j===answer?q.answer:wrong.shift()]);
      const selected={...q,choices,answer,family:familyOf(q)};markSeen(local,valid,selected);return selected;
    });
  }
  // Word Trail: one vocabulary word, spelled letter by letter across the three lanes.
  const trailWordPattern=/^[a-z]{3,8}$/i;
  function trailLetters(word,rng){
    const target=word.toUpperCase(),alphabet='ABCDEFGHIJKLMNOPRSTUVWY';
    return [...target].map((letter,index)=>{
      const others=[...new Set([...target].filter(l=>l!==letter))],decoys=[];
      if(others.length)decoys.push(others[Math.floor(rng()*others.length)]);
      while(decoys.length<2){const d=alphabet[Math.floor(rng()*alphabet.length)];if(d!==letter&&!decoys.includes(d))decoys.push(d);}
      const lane=Math.floor(rng()*3),letters=[];let d=0;for(let l=0;l<3;l++)letters.push(l===lane?letter:decoys[d++]);
      return {index,letter,lane,letters,picked:null,ok:null,at:0};
    });
  }
  function swipe(dx,dy,threshold=32){if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return null;if(Math.abs(dy)>Math.abs(dx)*1.15)return dy<0?'up':'down';if(dx>0&&dx>Math.abs(dy)*1.15)return 'jump';return null;}
  const bossPercent=(mode,island)=>(mode==='hard'?70:50)+2*clamp(island-1,0,9);
  const bossCoins=(mode,island,totalCoins)=>Math.ceil(totalCoins*bossPercent(mode,island)/100);
  const obstacleShapes=['crystal','log','boulder','gear','barrier'];
  class Run {
    constructor({bank,mode='soft',seed=Date.now(),island=1,readPace='calm',history={},review=[],secondChance=false,trail=null}){
      this.rng=random(seed);this.mode=mode==='hard'?'hard':'soft';mode=this.mode;this.rules=I.modes[mode];this.config=I.get(island);this.island=island;this.seed=seed;
      this.questions=selectQuestions(bank,this.rng,6,history,review);this.status='running';this.phase='course';this.paused=false;
      this.courseEnd=21500;this.distance=0;this.bossAt=this.courseEnd;this.length=this.bossAt+600;this.time=0;this.lane=1;this.lanePos=1;
      this.jumpAge=-1;this.jumpStart=0;this.jumpSpan=1;this.jumpBuffer=0;this.invincible=0;this.health=this.rules.guards;this.maxHealth=this.health;
      this.focus=0;this.focusTime=0;this.focusShield=false;this.coinStreak=0;this.mechanic=null;this.mechanicAt=650;this.mechanicIndex=0;
      this.metrics={hits:0,focusUses:0,bossDodges:0,bossVolleys:0,mechanics:0};
      this.score=0;this.coins=0;this.correct=0;this.combo=0;this.review=[];this.events=[];
      // A missed answer may return once, reshuffled, before the boss. It never changes stars.
      this.secondChance=secondChance===true;this.echoAt=17700;this.echoLatest=19600;this.echoDone=!this.secondChance;this.echoCorrect=0;
      this.gate=null;this.nextGate=0;this.gateAt=[1500,4200,6900,9600,12300,15000];
      this.readSeconds=readPace==='calm'?10:readPace==='extra'?14:7;
      this.baseSpeed=this.rules.speed+Math.min(island-1,9)*3;
      this.travelSpeed=this.baseSpeed;this.safeUntil=600;this.feedback=0;this.objects=[];this.boss=null;this.failureReason='';
      let coinLane=Math.floor(this.rng()*3);
      for(let at=500,n=0;at<this.courseEnd-350;at+=110,n++){
        if(n%6===0)coinLane=(coinLane+1+Math.floor(this.rng()*2))%3;
        this.objects.push({at,lane:coinLane,type:'coin',done:false});
      }
      for(let at=900,n=0;at<this.courseEnd-700;n++){
        const lane=Math.floor(this.rng()*3),shape=obstacleShapes[n%obstacleShapes.length];
        this.objects.push({at,lane,type:'obstacle',shape,width:36,done:false,hit:false});
        // A repeatable rhythm: three single jumps/switches, a two-lane choice, then a coin breather.
        if(n%5===3)this.objects.push({at,lane:(lane+1+Math.floor(this.rng()*2))%3,type:'obstacle',shape:obstacleShapes[(n+2)%5],width:36,done:false,hit:false,cluster:true});
        at+=this.rules.obstacleGap*(1-.15*clamp(at/this.courseEnd,0,1))*(n%5===4?1.7:1)+this.rng()*90;
      }
      const obstacles=this.objects.filter(o=>o.type==='obstacle');
      this.objects=this.objects.filter(o=>o.type!=='coin'||!obstacles.some(b=>b.lane===o.lane&&Math.abs(b.at-o.at)<70));
      this.totalCoins=this.objects.filter(o=>o.type==='coin').length;this.requiredPercent=bossPercent(mode,island);this.requiredCoins=bossCoins(mode,island,this.totalCoins);
      this.trail=null;
      if(trail&&typeof trail.word==='string'&&trailWordPattern.test(trail.word.trim())){
        // Letters sit after the coin course. The boss boundary moves back by the trail length.
        const steps=trailLetters(trail.word.trim(),this.rng),spacing=Math.round(this.baseSpeed*1.35*.62*1.75),start=this.courseEnd+650;
        steps.forEach((step,i)=>{step.at=start+i*spacing;});
        this.trail={word:trail.word.trim().toUpperCase(),clue:String(trail.clue||'').slice(0,80),concept:typeof trail.concept==='string'?trail.concept.slice(0,100):'',id:typeof trail.id==='string'?trail.id.slice(0,100):'',
          steps,index:0,mistakes:0,allowed:this.mode==='hard'?0:1,started:false,done:false,success:false,start,spacing};
        this.bossAt=start+(steps.length-1)*spacing+Math.round(spacing*.9)+400;this.length=this.bossAt+600;
      }
    }
    get normalSpeed(){return this.baseSpeed*(1+.35*clamp(this.distance/this.courseEnd,0,1));}
    get trailActive(){return Boolean(this.trail&&this.trail.started&&!this.trail.done);}
    get targetSpeed(){return this.normalSpeed*(this.gate?.32*this.readSeconds/(this.readSeconds+I.questionPreview):this.trailActive?.62:1);}
    get speed(){return this.travelSpeed;}
    get progress(){return this.phase==='finish'?clamp(.96+.04*(1-(this.length-this.distance)/600),.96,1):Math.min(.95,this.distance/this.bossAt*.95);}
    emit(type,data={}){this.events.push({type,...data});}
    drain(){return this.events.splice(0);}
    canControl(){return this.status==='running'&&!this.paused&&(this.phase==='course'||this.phase==='boss'&&!['defeated','counter','knockout'].includes(this.boss.state));}
    move(dir){if(!this.canControl())return false;const before=this.lane;this.lane=clamp(this.lane+dir,0,2);if(this.gate&&this.lane!==before)this.gate.moved=true;return true;}
    setLane(lane){if(!this.canControl())return false;const before=this.lane;this.lane=clamp(lane,0,2);if(this.gate&&this.lane!==before)this.gate.moved=true;return true;}
    jump(){
      if(!this.canControl())return false;
      if(this.jumpAge>=0){if(this.jumpProgress>.8)this.jumpBuffer=.2;return false;}
      this.jumpAge=0;this.jumpStart=this.distance;this.jumpSpan=this.normalSpeed*1.15;this.jumpBuffer=0;this.emit('jump');return true;
    }
    get jumpProgress(){return this.jumpAge<0?0:clamp(this.phase==='boss'?this.jumpAge/1.05:(this.distance-this.jumpStart)/this.jumpSpan,0,1);}
    get jumpHeight(){return this.jumpAge<0?0:Math.pow(Math.max(0,Math.sin(Math.PI*this.jumpProgress)),.7);}
    get jumpForward(){return this.jumpAge<0?0:Math.sin(Math.PI*this.jumpProgress)*60;}
    get runnerDistance(){return this.distance+this.jumpForward;}
    pause(value=true){if(this.status==='running')this.paused=value;}
    beginGate(echo=null){
      if(this.gate||(!echo&&this.nextGate>=this.questions.length))return;
      const index=echo?echo.index:this.nextGate++,q=echo?echo.q:this.questions[index];
      this.gate={q,index,echo:Boolean(echo),moved:false,age:0,duration:this.readSeconds+I.questionPreview,preview:I.questionPreview,choicesShown:false,ratio:0};
      // Keep hazards and every coin alive, but simplify clusters during the reading corridor.
      // Long prompts get one single hazard per corridor; shorter prompts retain spaced single hazards.
      const end=this.distance+this.normalSpeed*.32*this.readSeconds+this.normalSpeed*.8;
      let last=-Infinity;const spacing=this.normalSpeed*(q.prompt.length>90?4:1.7);
      for(const o of this.objects){if(o.type!=='obstacle'||o.done||o.at<this.distance||o.at>end)continue;
        if(o.cluster||o.at-last<spacing){o.done=true;o.readingSuppressed=true;}else last=o.at;
      }
      this.emit('question',{question:q});
    }
    resolveGate(){
      const g=this.gate,q=g.q,lane=Math.round(this.lanePos),ok=lane===q.answer;
      let points=0;
      if(g.echo){points=ok?50:0;if(ok){this.echoCorrect++;this.score+=points;this.addFocus(I.focus.answer);}}
      else{points=ok?100+Math.min(this.combo,3)*20:0;this.combo=ok?this.combo+1:0;this.bestStreak=Math.max(this.bestStreak||0,this.combo);if(ok){this.correct++;this.score+=points;this.addFocus(I.focus.answer);
        // v9.5: Spirit Surge. Every third correct answer in a row fills Elemental Focus at once.
        if(this.combo>=3&&this.combo%3===0){const before=this.metrics.focusUses;this.addFocus(I.focus.limit);this.metrics.surges=(this.metrics.surges||0)+1;this.emit('surge',{streak:this.combo,focus:this.metrics.focusUses>before});}
        else if(this.combo>=2)this.emit('streak',{streak:this.combo});}}
      const row={prompt:q.prompt,kind:q.kind,picked:q.choices[lane],answer:q.choices[q.answer],correct:ok,explanation:q.explanation,points,streak:g.echo?0:this.combo,
        id:q.id,concept:q.family||familyOf(q),index:g.index,format:q.format||'text',review:q.review===true,echo:g.echo,moved:g.moved,lane};
      this.review.push(row);this.emit('answer',row);this.gate=null;this.feedback=3;
    }
    beginEcho(){
      this.echoDone=true;
      const miss=this.review.find(r=>!r.correct&&!r.echo);if(!miss)return false;
      const original=this.questions[miss.index];if(!original)return false;
      // Same question, reshuffled: the correct answer moves to a different lane when possible.
      const correct=original.choices[original.answer],others=original.choices.filter((_,i)=>i!==original.answer);
      const lanes=[0,1,2].filter(l=>l!==original.answer),answer=lanes[Math.floor(this.rng()*lanes.length)],choices=[],rest=shuffle(others,this.rng);
      for(let l=0;l<3;l++)choices.push(l===answer?correct:rest.shift());
      this.beginGate({index:miss.index,q:{...original,choices,answer,echo:true}});return true;
    }
    stepTrail(){
      const t=this.trail;if(!t||t.done)return;
      if(!t.started&&this.distance>=t.start-this.normalSpeed*2.2&&!this.gate&&this.feedback===0){
        // A late second chance can push the start back: letters and the boss boundary move together.
        const shift=Math.max(0,Math.round(this.distance+this.normalSpeed*2.2-t.start));
        if(shift){t.start+=shift;t.steps.forEach(step=>{step.at+=shift;});this.bossAt+=shift;this.length=this.bossAt+600;}
        t.started=true;this.emit('trailStart',{word:t.word,clue:t.clue,length:t.steps.length});
      }
      if(!t.started)return;
      const step=t.steps[t.index];if(!step||this.runnerDistance<step.at)return;
      const lane=Math.round(this.lanePos);step.picked=step.letters[lane];step.ok=lane===step.lane;
      if(step.ok){this.score+=20;}else t.mistakes++;
      this.emit('letter',{index:t.index,ok:step.ok,letter:step.letter,picked:step.picked,lane});
      t.index++;
      if(t.index>=t.steps.length){
        t.done=true;t.success=t.mistakes<=t.allowed;if(t.success){this.score+=100;this.addFocus(I.focus.answer);}
        this.emit('trailEnd',{success:t.success,word:t.word,mistakes:t.mistakes,allowed:t.allowed});
      }
    }
    addFocus(amount){
      if(this.focusTime>0)return;
      this.focus=clamp(this.focus+amount,0,I.focus.limit);
      if(this.focus===I.focus.limit){this.focus=0;this.focusTime=I.focus.duration;this.focusShield=true;this.metrics.focusUses++;this.emit('focus');}
    }
    takeHit(source){
      if(this.invincible>0)return false;
      if(this.focusShield&&this.focusTime>0){this.focusShield=false;this.invincible=1;this.emit('shield',{source});return false;}
      this.health--;this.metrics.hits++;this.invincible=2;this.combo=0;this.coinStreak=0;this.emit('hit',{source});
      if(this.health<=0)this.finish(false,source==='boss'?'boss-dodge':'obstacles');return true;
    }
    beginMechanic(){
      const rule=this.config.rule,lane=Math.floor(this.rng()*3),at=this.distance+this.normalSpeed*2.6;
      const lanes=['signal','eclipse'].includes(rule)?[0,1,2].filter(l=>l!==lane):rule==='wave'?[0,1,2]:[lane];
      this.mechanic={rule,at,lane,lanes,age:0,resolved:false,index:++this.mechanicIndex,step:0,chain:0,shifted:false};
      // Reserve this short encounter corridor, without removing a single coin.
      for(const o of this.objects)if(o.type==='obstacle'&&!o.done&&o.at>this.distance&&o.at<at+600)o.done=true;
      this.mechanicAt=this.distance+3500;this.emit('mechanic',{name:this.config.name,hint:this.config.hint});
    }
    stepMechanic(dt){
      if(!this.mechanic&&this.distance>=this.mechanicAt&&this.distance<this.courseEnd-1600&&!this.gate&&this.feedback===0)this.beginMechanic();
      const m=this.mechanic;if(!m)return;m.age+=dt;
      if(m.rule==='shift'&&!m.shifted&&m.at-this.distance<this.normalSpeed*1.7){m.lane=(m.lane+1)%3;m.lanes=[m.lane];m.shifted=true;}
      if(!m.resolved&&this.runnerDistance>=m.at){
        const lane=Math.round(this.lanePos),reward=['rune','wind','sequence'].includes(m.rule);
        if(reward){if(lane===m.lane){m.chain++;this.addFocus(m.rule==='sequence'?12:22);this.emit('rune',{lane});}}
        else if(m.lanes.includes(lane)&&this.jumpHeight<.26)this.takeHit('mechanic');
        this.metrics.mechanics++;
        if(m.rule==='sequence'&&m.step<2){m.step++;m.at+=this.normalSpeed*1.45;m.lane=(m.lane+1)%3;m.lanes=[m.lane];}
        else if(m.rule==='double'&&m.step===0){m.step++;m.at+=this.normalSpeed*1.65;}
        else m.resolved=true;
      }
      if(this.distance>m.at+100)this.mechanic=null;
    }
    beginBoss(){
      this.phase='boss';this.lane=1;this.jumpAge=-1;this.jumpBuffer=0;this.length=this.distance+600;
      this.mechanic=null;
      this.boss={hp:this.requiredCoins*10,maxHP:this.requiredCoins*10,ammo:this.coins,spent:0,age:0,state:'arrive',clock:0,shots:[],recoil:0,defeated:false,attack:0,round:0,lanes:[],weakLane:1,hold:0,fired:false,wordStrike:0};
      this.emit('boss');
      // A correctly spelled Word Trail opens the showdown with a Word Strike: 15% of the guard.
      if(this.trail?.success){const damage=Math.max(10,Math.round(this.boss.maxHP*.15/10)*10);this.boss.wordStrike=damage;this.boss.shots.push({age:0,duration:.9,damage,lane:1,hit:false,word:this.trail.word});this.emit('wordStrike',{word:this.trail.word,damage});}
    }
    bossState(state){this.boss.state=state;this.boss.clock=0;this.boss.hold=0;this.emit('bossPhase',{state,lanes:this.boss.lanes,weakLane:this.boss.weakLane});}
    bossRound(){
      const b=this.boss;b.round++;b.fired=false;b.attack=0;
      const lane=Math.floor(this.rng()*3);b.lanes=[lane];
      if(this.mode==='hard'&&b.round%2===0)b.lanes.push((lane+1)%3);
      b.weakLane=(lane+1+Math.floor(this.rng()*2))%3;this.bossState('warn');
    }
    stepBoss(dt){
      const b=this.boss;b.age+=dt;b.clock+=dt;b.recoil=Math.max(0,b.recoil-dt);
      if(this.jumpAge>=1.05){this.jumpAge=-1;if(this.jumpBuffer>0)this.jump();}
      for(const shot of b.shots){shot.age+=dt;if(!shot.hit&&shot.age>=shot.duration){shot.hit=true;b.hp=Math.max(0,b.hp-shot.damage);b.recoil=.18;this.emit('bossHit',{damage:shot.damage,word:Boolean(shot.word),final:b.hp===0});}}
      b.shots=b.shots.filter(s=>!s.hit);
      if(b.hp<=0&&b.state!=='defeated'){
        b.state='defeated';b.defeated=true;b.clock=0;this.emit('bossDefeated');
      }
      if(b.state==='arrive'&&b.clock>=1.1)this.bossRound();
      if(b.state==='warn'&&b.clock>=this.rules.bossWarning)this.bossState('strike');
      else if(b.state==='strike'){
        b.attack=clamp(b.clock/.65,0,1);
        if(b.clock>=.65){
          if(b.lanes.includes(Math.round(this.lanePos))&&this.jumpHeight<.26)this.takeHit('boss');
          else{this.metrics.bossDodges++;this.addFocus(10);}
          this.bossState('expose');
        }
      }else if(b.state==='expose'){
        b.hold=Math.abs(this.lanePos-b.weakLane)<.28?b.hold+dt:0;
        if(!b.fired&&b.hold>=.25&&b.ammo>0){
          const coins=Math.min(b.ammo,Math.ceil(this.requiredCoins/4),Math.ceil(b.hp/10));b.ammo-=coins;b.spent+=coins;b.fired=true;
          b.shots.push({age:0,duration:.52,damage:coins*10,lane:b.weakLane,hit:false});this.metrics.bossVolleys++;this.emit('coinShot');
        }
        if(b.clock>=this.rules.bossWindow+this.correct*.07&&b.shots.length===0){
          if(b.ammo<=0||b.round>=this.rules.bossRounds){this.bossState('counter');this.emit('bossCounter');}
          else this.bossRound();
        }
      }else if(b.state==='counter'){
        b.attack=clamp((b.clock-.65)/.7,0,1);
        if(b.clock>=1.4){b.state='knockout';b.clock=0;this.health=0;this.emit('bossKnockout');}
      }else if(b.state==='knockout'&&b.clock>=1.5){this.finish(false,this.coins<this.requiredCoins?'boss':'boss-dodge');}
      else if(b.state==='defeated'&&b.clock>=2){this.phase='finish';this.emit('finishTrail');}
    }
    step(dt){
      if(this.status!=='running'||this.paused)return;
      dt=clamp(dt,0,.1);this.time+=dt;
      this.lanePos+=(this.lane-this.lanePos)*(1-Math.exp(-dt*18));if(Math.abs(this.lanePos-this.lane)<.002)this.lanePos=this.lane;
      if(this.jumpAge>=0)this.jumpAge+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
      this.invincible=Math.max(0,this.invincible-dt);this.feedback=Math.max(0,this.feedback-dt);
      this.focusTime=Math.max(0,this.focusTime-dt);if(!this.focusTime)this.focusShield=false;
      if(this.phase==='boss'){this.stepBoss(dt);return;}
      const old=this.runnerDistance;this.travelSpeed+=(this.targetSpeed-this.travelSpeed)*(1-Math.exp(-dt/.7));this.distance+=this.speed*dt;
      if(this.jumpAge>=0&&this.distance-this.jumpStart>=this.jumpSpan){this.jumpAge=-1;if(this.jumpBuffer>0)this.jump();}
      const front=this.runnerDistance;
      if(this.phase==='finish'){if(this.distance>=this.length)this.finish(true);return;}
      if(this.gate){this.gate.age+=dt;this.gate.ratio=clamp((this.gate.age-this.gate.preview)/this.readSeconds,0,1);if(!this.gate.choicesShown&&this.gate.age>=this.gate.preview){this.gate.choicesShown=true;this.emit('choices');}if(this.gate.age>=this.gate.duration)this.resolveGate();}
      else if(this.nextGate<this.gateAt.length&&this.distance>=this.gateAt[this.nextGate]&&this.feedback===0&&!this.mechanic)this.beginGate();
      else if(!this.echoDone&&this.nextGate>=this.questions.length&&this.distance>=this.echoAt&&this.feedback===0&&!this.mechanic){
        if(this.distance<=this.echoLatest)this.beginEcho();else this.echoDone=true;
      }
      this.stepMechanic(dt);if(this.status!=='running')return;
      this.stepTrail();
      // Course objects stay alive while a learning gate approaches.
      for(const o of this.objects){
        if(o.done)continue;
        if(o.type==='coin'){
          if(o.at>front)continue;o.done=true;
          if(o.at>=old&&Math.abs(this.lanePos-o.lane)<=(this.focusTime>0?1.15:.4)){this.coins++;this.score+=10;this.coinStreak++;if(this.coinStreak%5===0)this.addFocus(I.focus.streak);this.emit('coin',{lane:o.lane,magnet:this.focusTime>0});}else this.coinStreak=0;
        }else{
          const half=(o.width||36)/2;
          if(o.at+half<old){o.done=true;continue;}
          if(o.at-half>front)continue;
          if(!o.hit&&Math.abs(this.lanePos-o.lane)<=.36&&this.distance>=this.safeUntil&&this.invincible===0&&this.jumpHeight<.26){
            o.hit=true;this.takeHit('obstacles');if(this.status!=='running')return;
          }
          if(o.at+half<=front)o.done=true;
        }
      }
      if(this.distance>=this.bossAt&&!this.gate&&this.feedback===0&&this.nextGate>=this.questions.length&&(!this.trail||this.trail.done))this.beginBoss();
    }
    finish(completed,reason=''){if(this.status!=='running')return;this.failureReason=reason;
      // v9.5: a Perfect Run (every question right first time) adds 300 points. Score only: coins, stars and unlocks are unchanged.
      if(completed&&this.questions.length&&this.correct===this.questions.length){this.perfect=true;this.score+=300;this.emit('perfect',{bonus:300});}
      this.status=completed?'completed':'ended';this.emit('finish',{completed,result:this.result()});}
    result(){return {completed:this.status==='completed',score:this.score,coins:this.coins,coinPercent:Math.floor(this.coins/this.totalCoins*100),hardClear:this.mode==='hard'&&this.status==='completed',correct:this.correct,total:this.review.filter(r=>!r.echo).length,health:this.health,stars:this.status==='completed'?(this.correct>=5?3:this.correct>=3?2:1):0,review:this.review.slice(),failureReason:this.failureReason,requiredCoins:this.requiredCoins,totalCoins:this.totalCoins,requiredPercent:this.requiredPercent,bossDefeated:!!this.boss?.defeated,coinsSpent:this.boss?.spent||0,metrics:{...this.metrics},seed:this.seed,seconds:Math.round(this.time),
      echoCorrect:this.echoCorrect,perfect:this.perfect===true,bestStreak:this.bestStreak||0,trail:this.trail?{word:this.trail.word,clue:this.trail.clue,concept:this.trail.concept,id:this.trail.id,success:this.trail.success,done:this.trail.done,mistakes:this.trail.mistakes,letters:this.trail.steps.map(s=>s.picked||'')}:null,wordStrike:this.boss?.wordStrike||0};}
  }
  const storageKey='english-league-island-runner-v1';
  const fresh=()=>({schema:'english-league-island-runner',version:3,contentRevision:3,settings:{grade:5,className:'5-A',house:'gryffindor',mode:'soft',readPace:'calm',sound:false,reducedMotion:false},progress:{},overrides:{},seen:{}});
  function validateSave(raw,content=root.RunnerContent,teachingBanks={}){
    if(!raw||raw.schema!=='english-league-island-runner'||![1,2,3].includes(raw.version))throw Error('Choose an Island Runner version 1, 2 or 3 backup.');
    const out=fresh(),s=raw.settings||{};
    if([5,6,7,8].includes(+s.grade))out.settings.grade=+s.grade;
    if(['5-A','5-C','6-C','7-A','8-B'].includes(s.className))out.settings.className=s.className;
    if(['gryffindor','hufflepuff','slytherin','ravenclaw'].includes(s.house))out.settings.house=s.house;
    if(['soft','hard'].includes(s.mode))out.settings.mode=s.mode;
    if(['calm','extra','quick'].includes(s.readPace))out.settings.readPace=s.readPace;
    out.settings.sound=s.sound===true;out.settings.reducedMotion=s.reducedMotion===true;
    if(+out.settings.className[0]!==out.settings.grade)out.settings.className={5:'5-A',6:'6-C',7:'7-A',8:'8-B'}[out.settings.grade];
    for(const [key,values] of Object.entries(raw.progress||{})){
      if(!/^(5-A|5-C|6-C|7-A|8-B)\|(gryffindor|hufflepuff|slytherin|ravenclaw)$/.test(key))continue;
      const levels={};for(const [id,v] of Object.entries(values||{})){
        if(!/^(10|[1-9])$/.test(id)||!v||!Number.isFinite(v.score)||!Number.isInteger(v.stars)||v.stars<1||v.stars>3)continue;
        levels[id]=bestResult({score:0,stars:0},{...v,score:clamp(Math.round(v.score),0,100000)});
      }out.progress[key]=levels;
    }
    for(const [key,bank] of Object.entries(raw.overrides||{})){
      if(!/^[5-8]-(10|[1-9])$/.test(key))throw Error('An edited island has an invalid ID.');
      if(!Array.isArray(bank)||bank.length<1||bank.length>400||!bank.every(validateQuestion)||new Set(bank.map(q=>q.id)).size!==bank.length)throw Error('An edited bank needs 1–400 questions, three distinct choices, and one correct answer.');
      let clean=bank.map(cleanQuestion);
      const revision=raw.version===1?1:(raw.contentRevision||2);
      if(revision<3){
        if(!content)throw Error('The expanded question bank is required to import this older backup.');
        const [g,i]=key.split('-'),u=content.grades[g][+i-1],existing=new Set(clean.map(q=>q.id)),oldIds=new Set(revision===1?u.legacyIds:u.revision2Ids);
        const compare=q=>JSON.stringify([q.kind,q.prompt,q.choices,q.answer,q.instruction,q.explanation]);
        clean=clean.map(q=>{const before=u.revision2Bank.find(b=>b.id===q.id),now=u.bank.find(b=>b.id===q.id);return before&&now&&compare(cleanQuestion(before))===compare(q)?cleanQuestion(now):q;});
        clean=clean.concat(u.bank.filter(q=>!oldIds.has(q.id)&&!existing.has(q.id)).map(cleanQuestion));
        if(clean.length>400)throw Error('This older edited bank exceeds 400 questions after the new material is added. Remove a few items before importing.');
      }
      out.overrides[key]=clean;
    }
    for(const [key,history] of Object.entries(raw.seen||{})){
      if(!/^(5-A|5-C|6-C|7-A|8-B)\|[5-8]-(10|[1-9])$/.test(key)||!history||typeof history!=='object')continue;
      out.seen[key]={};for(const kind of ['word','gap','question'])if(Array.isArray(history[kind]))out.seen[key][kind]=[...new Set(history[kind].filter(id=>typeof id==='string'&&id.length<=100))].slice(-400);
      if(Array.isArray(history.recent))out.seen[key].recent=history.recent.filter(v=>typeof v==='string'&&v.length<=300).slice(-36);
      if([0,1,2].includes(history.lastLane))out.seen[key].lastLane=history.lastLane;
      if(Array.isArray(history.trail))out.seen[key].trail=history.trail.filter(v=>typeof v==='string'&&trailWordPattern.test(v)).slice(-12);
    }
    if(content)for(const [key,h] of Object.entries(out.seen)){
      const unitKey=key.split('|')[1],[g,i]=unitKey.split('-'),bank=teachingBanks[unitKey]||out.overrides[unitKey]||content.grades[g][+i-1].bank;
      const seen=new Set(['word','gap','question'].flatMap(k=>h[k]||[]));
      for(const k of ['word','gap','question'])h[k]=bank.filter(q=>q.kind===k&&seen.has(q.id)).map(q=>q.id);
      if(!h.recent)h.recent=bank.filter(q=>seen.has(q.id)).map(familyOf).slice(-36);
    }
    return out;
  }
  function unlocked(levels,island){if(island===1)return true;for(let i=1;i<island;i++)if(!levels[i])return false;return true;}
  function bestResult(a,b){const out={score:Math.max(a.score,b.score),stars:Math.max(a.stars,b.stars)};const coins=[a.coinPercent,b.coinPercent].filter(v=>Number.isInteger(v)&&v>=0&&v<=100);if(coins.length)out.coinPercent=Math.max(...coins);if(a.hardClear===true||b.hardClear===true)out.hardClear=true;return out;}
  function record(progress,key,island,result){if(!result.completed)return;if(!progress[key])progress[key]={};progress[key][island]=bestResult(progress[key][island]||{score:0,stars:0},result);}
  const api={Run,random,shuffle,swipe,validateQuestion,cleanQuestion,selectQuestions,markSeen,fresh,validateSave,unlocked,record,bestResult,storageKey,clamp,bossCoins,bossPercent,familyOf,obstacleShapes,trailLetters,trailWordPattern};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
