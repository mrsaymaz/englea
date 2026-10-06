(function(){
  'use strict';
  const H=window.RunnerHost;if(!H?.context)return;
  let hostVisible=true,frameId=0,lastHostState='',teaching={};
  function acceptTeaching(catalog){if(!catalog||catalog.grade!==H.context.grade)return;for(const [key,value]of Object.entries(catalog.units||{})){if(!window.TeachingModel?.validKey(key)||Number(key[0])!==catalog.grade||!Number.isInteger(value.version)||value.version<1)continue;try{const content=TeachingModel.clean(value.content);if(!teaching[key]||value.version>teaching[key].version)teaching[key]={...value,content};}catch{}}}
  acceptTeaching(H.context.teaching);
  const enforceHost=()=>{state.settings.grade=H.context.grade;state.settings.className=H.context.className;state.settings.house=H.context.house;};
  const E=window.RunnerEngine,C=window.RunnerContent,S=window.RunnerScenery,B=window.RunnerBosses,I=window.RunnerIslands,F=window.RunnerFormats,PIC=window.RunnerPictures;
  /* v9.3.0: navigator, listening/picture gates, Word Trail and the shared answer log. */
  let runId='',answerIndex=0,navigator='',listeningActive=false,speakTimer=0,currentSpeech='',navigatorSeal=null;
  // v9.7.0: the board chooses one navigator for the whole session (a random contributor of the champion team).
  const sessionNavigator=typeof H.context?.navigator?.name==='string'?H.context.navigator.name.slice(0,70):'';
  const localOptions={listening:true,pictures:false};
  function options(){const o=H.options?.();return o&&typeof o==='object'?{listening:o.listening!==false,pictures:o.pictures===true}:{...localOptions};}
  const speech=window.speechSynthesis&&window.SpeechSynthesisUtterance?window.speechSynthesis:null;
  /* Only an installed English voice is ever used. Ranking: British, American, any English; natural/online voices first.
     If no English voice exists, listening gates are not created and their words are shown as text instead. */
  let chosenVoice=null;
  function rankVoice(v){const lang=String(v.lang||'').replace('_','-').toLowerCase(),name=String(v.name||'');
    if(!lang.startsWith('en'))return -1;return (lang==='en-gb'?30:lang==='en-us'?20:10)+(/natural|neural|online|google|premium|enhanced/i.test(name)?5:0)+(v.localService===false?1:0);}
  function englishVoice(){
    try{const voices=speech?.getVoices()||[];let best=null,score=-1;for(const v of voices){const r=rankVoice(v);if(r>score){best=v;score=r;}}chosenVoice=score>=0?best:null;}catch{chosenVoice=null;}
    return chosenVoice;
  }
  function speechReady(){return Boolean(speech&&englishVoice());}
  // Voices load asynchronously; the map screen gives them time to arrive before the first run.
  try{speech?.getVoices();speech?.addEventListener?.('voiceschanged',()=>{englishVoice();if($('teacherDialog')?.open)renderRunOptions();reportHost();});}catch{}
  function speak(text){
    if(!speech||!text||!listeningActive)return;
    const voice=englishVoice();if(!voice){$('promptNote').textContent='No English voice on this board. Read the word instead.';if(run?.gate?.q?.format==='listen')$('promptText').textContent=run.gate.q.speak;return;}
    try{speech.cancel();const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.82;u.pitch=1;
      u.onerror=()=>{if(run?.gate?.q?.format==='listen'){$('promptText').textContent=run.gate.q.speak;$('promptNote').textContent='Audio is unavailable. The word is shown instead.';}};
      speech.speak(u);}catch{}
  }
  function stopSpeech(){clearTimeout(speakTimer);try{speech?.cancel();}catch{}}
  function setNavigator(name){navigator=name||'';const chip=$('navigatorChip');if(chip){chip.hidden=!navigator;const label=$('navigatorName');if(label)label.textContent=navigator;}}
  function logRows(rows){if(practice||!rows.length)return;try{H.answers?.(rows);}catch{}}
  function logAnswer(row){
    logRows([{id:`${runId}:${answerIndex++}`,t:Date.now(),s:H.context.sessionId,c:state.settings.className,h:state.settings.house,g:state.settings.grade,i:activeIsland,
      q:String(row.id||'unknown').slice(0,100),k:String(row.concept||row.id||'unknown').slice(0,100),y:row.kind,f:['listen','picture'].includes(row.format)?row.format:'text',
      ok:row.correct,e:row.echo===true,v:row.review===true,m:row.moved===true,p:String(row.picked||'').slice(0,80),a:String(row.answer||'').slice(0,80),x:String(row.prompt||'').slice(0,160)}]);
  }
  function logTrail(t){
    logRows([{id:`${runId}:${answerIndex++}`,t:Date.now(),s:H.context.sessionId,c:state.settings.className,h:state.settings.house,g:state.settings.grade,i:activeIsland,
      q:('trail:'+t.word.toLowerCase()).slice(0,100),k:(t.concept||'trail:'+t.word.toLowerCase()).slice(0,100),y:'spell',f:'spell',ok:t.success,e:false,v:false,m:true,
      p:t.steps.map(step=>step.picked||'·').join('').slice(0,80),a:t.word.slice(0,80),x:('Spell: '+t.clue).slice(0,160)}]);
  }
  const $=id=>document.getElementById(id);
  const classes={5:['5-A','5-C'],6:['6-C'],7:['7-A'],8:['8-B']};
  let state=E.fresh(),storageOK=true,selected=1,run=null,practice=false,activeIsland=1,toastTimer,runToastTimer;
  let activeBank=null,restoring=null,graphics='auto';const freshStamps=new Set();
  try{graphics=localStorage.getItem('island-run-graphics')==='light'?'light':'auto';}catch{}
  let editorGrade=5,editorIsland=1,editingID=null,editorDirty=false,pendingImport=null;
  try{const saved=localStorage.getItem(E.storageKey);if(saved)state=E.validateSave(JSON.parse(saved),C,Object.fromEntries(Object.entries(teaching).map(([k,v])=>[k,v.content.bank||C.grades[k[0]][Number(k.split('-')[1])-1].bank])));}
  catch(err){storageOK=false;setTimeout(()=>notify('Saved data could not be loaded. You can restore a backup in Teacher.'),800);}
  mergeProgress(H.context.progress||{});
  enforceHost();
  const hostImage=new Image();hostImage.src=H.context.avatar;
  hostImage.onerror=()=>{const fallback=new URL(`../assets/animated/${H.context.house}-${H.context.level}.webp`,document.baseURI).href;if(hostImage.src!==fallback)hostImage.src=fallback;};
  const bossImages={};function bossImage(island){const b=B.get(island);if(!bossImages[b.id]){const img=new Image();img.src=b.asset;bossImages[b.id]=img;}return bossImages[b.id];}
  const renderer=new S.Renderer($('gameCanvas'));
  let audioContext=null,lastCoinSound=0;
  function sound(type,options){
    if(!state.settings.sound)return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      if(!audioContext)audioContext=new Audio();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      const now=audioContext.currentTime;if(type==='coin'&&now-lastCoinSound<.11)return;if(type==='coin')lastCoinSound=now;
      if(window.RunnerFX?.play(audioContext,type,options))return;
      const tones={coin:[720,.075],jump:[320,.11],hit:[115,.15],answer:[880,.2],finish:[660,.3]};
      const [hz,duration]=tones[type]||tones.coin,osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(hz,now);osc.frequency.exponentialRampToValueAtTime(hz*(type==='hit'?.5:1.35),now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }catch(_){/* Audio is optional; gameplay remains fully silent if unavailable. */}
  }
  function mergeProgress(progress){
    const safe=E.validateSave({...state,progress}).progress;
    for(const [key,levels]of Object.entries(safe)){state.progress[key]??={};for(const [id,v]of Object.entries(levels)){state.progress[key][id]=E.bestResult(state.progress[key][id]||{score:0,stars:0},v);}}
  }
  function persist(){
    try{localStorage.setItem(E.storageKey,JSON.stringify(state));storageOK=true;}
    catch(_){storageOK=false;notify('This browser cannot save locally. Download a backup from Teacher before closing.');}
    H.progress(state.progress);
    updateStorageStatus();
  }
  function updateStorageStatus(){$('storageStatus').textContent=storageOK?'Local save is available in this browser. Back up before moving the game folder or clearing browser data.':'Local save is unavailable. Changes still work now; download a backup before closing this page.';}
  function notify(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
  function runNotify(text){clearTimeout(runToastTimer);$('runToast').textContent=text;$('runToast').classList.add('visible');runToastTimer=setTimeout(()=>$('runToast').classList.remove('visible'),1800);}
  function currentHouse(){return C.houses.find(h=>h.id===state.settings.house)||C.houses[0];}
  function historyKey(island=activeIsland){return `${state.settings.className}|${state.settings.grade}-${island}`;}
  function progressKey(){return `${state.settings.className}|${state.settings.house}`;}
  function levels(){return state.progress[progressKey()]||{};}
  function currentUnit(island=selected,grade=state.settings.grade){const unit=C.grades[grade][island-1],published=teaching[`${grade}-${island}`];return published?{...unit,objective:published.content.objective||unit.objective}:unit;}
  function bankFor(grade,island){const published=teaching[`${grade}-${island}`];return published?(published.content.bank||C.grades[grade][island-1].bank):(state.overrides[`${grade}-${island}`]||C.grades[grade][island-1].bank);}
  function preferredIsland(){let i=1;while(i<10&&levels()[i])i++;return i;}
  function avatar(){return hostImage.src;}
  function setAccent(){const h=currentHouse();document.documentElement.style.setProperty('--accent',h.color);document.documentElement.style.setProperty('--glow',h.glow);document.documentElement.classList.toggle('runner-reduced',state.settings.reducedMotion===true);}
  const coords=[[10,26.7],[30,23.3],[50,26.7],[70,23.3],[90,26.7],[90,66.7],[70,69.2],[50,70],[30,66.7],[10,70]];
  function renderMap(){
    enforceHost();$('gradeSelect').disabled=true;$('classSelect').disabled=true;$('housePicker').hidden=true;
    setAccent();$('gradeSelect').value=state.settings.grade;
    $('classSelect').replaceChildren(...classes[state.settings.grade].map(name=>new Option(name,name)));$('classSelect').value=state.settings.className;
    $('softMode').classList.toggle('active',state.settings.mode==='soft');$('hardMode').classList.toggle('active',state.settings.mode==='hard');
    $('softMode').setAttribute('aria-pressed',state.settings.mode==='soft');$('hardMode').setAttribute('aria-pressed',state.settings.mode==='hard');
    const h=currentHouse();$('heroImage').src=avatar(h,selected);$('heroImage').alt=`${h.name} ${h.element.toLowerCase()} spirit`;$('houseName').textContent=h.name;$('houseElement').textContent=`${h.element} spirit · Level ${H.context.level}`;
    const done=Object.keys(levels()).length;$('islandsCompleted').textContent=`${done} / 10`;$('mapProgress').style.width=`${done*10}%`;
    $('islands').replaceChildren(...C.grades[state.settings.grade].map((u,i)=>{
      const button=document.createElement('button'),open=E.unlocked(levels(),u.id),stars=levels()[u.id]?.stars||0;
      const restored=window.LeagueAdventure?.restoration(state.progress,state.settings.className,u.id);
      button.className=`island${!open?' locked':''}${selected===u.id?' selected':''}${u.id===preferredIsland()?' current':''}${stars?' completed':''}${restored?.restored?' restored':''}${restored?.stage===4?' fully-restored':''}`;
      button.style.left=`${coords[i][0]}%`;button.style.top=`${coords[i][1]}%`;
      button.setAttribute('aria-label',`Island ${u.id}: ${u.theme}, ${u.title}. ${open?'Open':'Locked'}. ${stars} stars.`);button.setAttribute('aria-pressed',selected===u.id);
      button.innerHTML=S.islandSVG(u.realm,u.id,restored);
      if(restored?.teams.length)button.setAttribute('aria-label',button.getAttribute('aria-label')+' Restored by '+restored.teams.join(', ')+'.');
      const number=document.createElement('span');number.className='island-num';number.textContent=u.id;button.append(number);
      const name=document.createElement('span');name.className='island-name';name.textContent=u.theme;
      // Give split Maarif stages a meaningful distinguishing name.
      if((state.settings.grade===5||state.settings.grade===6)&&[5,6,9,10].includes(u.id))name.textContent=u.id===5?(state.settings.grade===5?'Neighbourhood':'Local Events'):u.id===6?(state.settings.grade===5?'City Life':'Transport'):u.id===9?(state.settings.grade===5?'Planet Earth':'Planets & Weather'):(state.settings.grade===5?'Holiday Plans':'Life in the Future');
      button.append(name);
      const rating=document.createElement('span');rating.className='island-stars';rating.setAttribute('aria-hidden','true');for(let j=0;j<3;j++){const star=document.createElement('span');star.textContent='✦';if(j<stars)star.className='earned';rating.append(star);}button.append(rating);
      button.onclick=()=>{selected=u.id;renderMap();};return button;
    }));
    const u=currentUnit();$('islandNumber').textContent=String(u.id).padStart(2,'0');$('selectedTheme').textContent=`${state.settings.className} · ${u.theme}`;$('selectedTitle').textContent=u.title;$('selectedObjective').textContent=u.objective;const boss=B.get(selected);$('selectedBoss').textContent=`Guardian: ${boss.name} · collect ${E.bossPercent(state.settings.mode,selected)}% of the coins, then win the showdown`;
    $('selectedMechanic').textContent=I.get(selected).hint;bossImage(selected);if(selected<10)bossImage(selected+1);
    const silhouette=$('selectedBossArt');silhouette.src=boss.asset;silhouette.alt=levels()[selected]?boss.name:'Silhouette of '+boss.name;silhouette.classList.toggle('unrevealed',!levels()[selected]);
    const path=$('completedRoute');path.style.strokeDasharray=`${Math.min(100,done/9*100)} 100`;
    const open=E.unlocked(levels(),selected);$('startButton').disabled=!open;$('startButton').textContent=open?(levels()[selected]?'Run again →':'Run this island →'):`Complete island ${selected-1} first`;
    if(window.LeagueAdventure&&$('restorationStatus')){const r=LeagueAdventure.restoration(state.progress,state.settings.className,selected),summary=LeagueAdventure.summary(state.progress,state.settings.className);$('restorationStatus').textContent=summary.restored+'/10 islands restored together · '+LeagueAdventure.restorationText(u.realm,r.stage);}
    updateSoundButton();
  }
  function updateSoundButton(){if($('runSoundButton')){$('runSoundButton').setAttribute('aria-pressed',String(Boolean(state.settings.sound)));$('runSoundButton').setAttribute('aria-label',`Turn sound ${state.settings.sound?'off':'on'}`);}$('soundButton').querySelector('span').textContent=state.settings.sound?'On':'Off';$('soundButton').setAttribute('aria-label',`Turn sound ${state.settings.sound?'off':'on'}`);}
  // v9.6.0: the prompt panel has one fixed height (visual-v96.css); a long prompt steps its text size down to fit
  // instead of growing the panel, so the course never resizes mid-run.
  function fitPrompt(){const panel=$('promptPanel'),text=$('promptText');if(!panel?.dataset||!text?.dataset)return;delete text.dataset.fit;delete panel.dataset.fit;
    for(let level=1;level<=4&&panel.scrollHeight>panel.clientHeight+1;level++){if(level<4)text.dataset.fit=String(level);else panel.dataset.fit='4';}}
  if(window.MutationObserver)new MutationObserver(fitPrompt).observe($('promptPanel'),{childList:true,subtree:true,characterData:true});
  function resize(){const rect=$('track').getBoundingClientRect();renderer.resize(rect.width,rect.height,window.devicePixelRatio||1);fitPrompt();}
  if(window.ResizeObserver)new ResizeObserver(resize).observe($('track'));else window.addEventListener('resize',resize);
  // v9.5: short title cards over the course. They never block input or the answer gates.
  let bannerTimer=0;
  function banner(kind,title,sub='',eyebrow='',color=''){
    const b=$('runBanner');if(!b)return;clearTimeout(bannerTimer);
    b.className='run-banner '+kind;b.style.setProperty('--banner-color',color||'var(--accent)');
    $('runBannerEyebrow').textContent=eyebrow;$('runBannerTitle').textContent=title;$('runBannerSub').textContent=sub;b.hidden=true;void b.offsetWidth;b.hidden=false;
    bannerTimer=setTimeout(()=>{b.hidden=true;},kind==='intro'?2600:kind==='boss'?2300:1900);
  }
  function clearBanner(){clearTimeout(bannerTimer);if($('runBanner'))$('runBanner').hidden=true;}
  // Answer gates keep the result on screen briefly: the chosen card bursts or cracks and the answer glows.
  let gateResultTimer=0;
  function clearGateResult(){clearTimeout(gateResultTimer);Array.from($('answerGates').children).forEach(card=>card.classList.remove('result-correct','result-wrong','result-answer'));}
  function updateStreak(){const n=run?Math.min(3,run.combo||0):0,el=$('streakHud');if(!el)return;const v=String(run?run.combo||0:0);if(el.dataset.streak!==v){el.dataset.streak=v;el.setAttribute('aria-label','Answer streak '+v);el.dataset.level=String(n);el.classList.remove('pulse');void el.offsetWidth;if(+v>0)el.classList.add('pulse');}}
  function idlePrompt(){
    $('promptPanel').className='prompt-panel';$('promptType').textContent=currentUnit(activeIsland).theme;
    $('promptText').style.fontSize='';$('promptText').textContent=run.time<8?run.config.hint:run.coins>=run.requiredCoins?'Your coin volley is ready.':'Follow the gold. Find your next answer.';
    $('promptNote').textContent=run.time<8?'UP / DOWN to change lanes · JUMP or swipe right':'';$('courseInstruction').textContent=run.config.name;
  }
  function startRun(island=selected,isPractice=false){
    if(!isPractice&&!E.unlocked(levels(),island)){notify('Finish the earlier islands, or try this one from Teacher → Run setup.');return;}
    activeIsland=island;selected=island;practice=isPractice;
    restoring=null;$('restorationScene').hidden=true;$('gameSurface').classList.remove('restoring');
    for(const d of document.querySelectorAll('dialog'))if(d.open)d.close();
    let seed;if(window.crypto?.getRandomValues){const values=new Uint32Array(1);window.crypto.getRandomValues(values);seed=values[0];}else seed=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
    activeBank=bankFor(state.settings.grade,island);
    const opts=options(),formatRng=E.random(seed^0x5bd1e995),history=state.seen[historyKey(island)]||{};
    const reviewEntries=H.review?.(state.settings.grade)||[];
    const review=F.reviewQuestions(reviewEntries,{grade:state.settings.grade,island,bankFor});
    const trail=F.trailWord(activeBank,formatRng,history.trail);
    run=new E.Run({seed,bank:activeBank,mode:state.settings.mode,island,readPace:state.settings.readPace,history,review,secondChance:true,trail});
    listeningActive=opts.listening&&speechReady();
    run.questions=F.applyFormats(run.questions,{bank:activeBank,rng:formatRng,listening:listeningActive,pictures:opts.pictures});
    runId=(seed>>>0).toString(36)+Date.now().toString(36);answerIndex=0;stopSpeech();
    setNavigator(sessionNavigator);navigatorSeal=null;
    if(opts.listening&&!listeningActive)setTimeout(()=>runNotify('No English voice on this board · listening is off'),900);
    $('mapView').hidden=true;$('runView').hidden=false;$('teacherButton').disabled=true;if($('runSettingsButton'))$('runSettingsButton').disabled=true;$('bossesButton').disabled=true;$('passportButton').disabled=true;lastFeedback=0;
    const h=currentHouse(),u=currentUnit(island);$('runHouseIcon').src=avatar(h,island);$('runTitle').textContent=u.title;$('runMode').textContent=`${practice?'PRACTICE · ':''}${state.settings.className} · ISLAND ${island} · ${state.settings.mode}`;
    $('bossHUD').hidden=true;['upButton','downButton','jumpButton'].forEach(id=>$(id).disabled=false);$('answerGates').hidden=true;$('runToast').classList.remove('visible');$('challengeCount').textContent='✦ 0 / 6';$('trailSlots').hidden=true;$('repeatAudio').hidden=true;
    renderer.setup(h,hostImage,u.realm,state.settings.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches,bossImage(island),B.get(island),graphics==='light');
    renderer.restoredStart?.(window.LeagueAdventure?.restoration(state.progress,state.settings.className,island)?.stage);
    // Animated mode hands over the detailed creature artwork (not a generated SVG portrait); draw it larger.
    renderer.artScale=String(H.context?.avatar||'').startsWith('blob:')?1:1.3;$('app').classList.add('running');lastLane=-1;
    clearGateResult();clearBanner();idlePrompt();resize();updateHUD();updateStreak();$('gameSurface').focus({preventScroll:true});
    banner('intro',u.title,`${navigator?`Navigator · ${navigator} · `:''}Guardian · ${B.get(island).name}`,`${practice?'Practice · ':''}Island ${island} · ${u.theme}`,currentHouse().color);
    if(state.settings.sound)sound('jump');
  }
  let lastLane=-1;
  function updateHUD(){
    if(!run)return;
    const shownCoins=run.phase==='boss'?run.boss.ammo:run.coins;if($('coinCount').textContent!==String(shownCoins))$('coinCount').textContent=shownCoins;
    const coinLabel=run.phase==='boss'?'coin volley':`of ${run.requiredCoins} needed`;if($('coinTarget').textContent!==coinLabel)$('coinTarget').textContent=coinLabel;$('coinHud').classList.toggle('ready',run.coins>=run.requiredCoins);
    if($('scoreCount').textContent!==run.score.toLocaleString())$('scoreCount').textContent=run.score.toLocaleString();
    $('runProgress').style.width=`${run.progress*100}%`;
    if(run.lane!==lastLane){lastLane=run.lane;Array.from($('laneGuide').children).forEach((span,i)=>span.classList.toggle('current',i===run.lane));Array.from($('answerGates').children).forEach((card,i)=>card.classList.toggle('in-lane',i===run.lane));}
    if(run.boss){const hp=Math.ceil(run.boss.hp/run.boss.maxHP*100);if($('bossMeter').getAttribute('aria-valuenow')!==String(hp)){$('bossHP').style.width=hp+'%';$('bossMeter').setAttribute('aria-valuenow',hp);if($('bossHPTrail'))$('bossHPTrail').style.width=hp+'%';}}
    const focusValue=run.focusTime>0?100:Math.floor(run.focus),focusLabel=run.focusTime>0?(run.focusShield?'FOCUS · MAGNET + SHIELD':'FOCUS · MAGNET'):'ELEMENTAL FOCUS';
    if($('focusMeter').getAttribute('aria-valuenow')!==String(focusValue)){$('focusFill').style.width=focusValue+'%';$('focusMeter').setAttribute('aria-valuenow',focusValue);}if($('focusLabel').textContent!==focusLabel){$('focusLabel').textContent=focusLabel;$('focusMeter').classList.toggle('active',run.focusTime>0);}
    const label=`${run.health} of ${run.maxHealth} guards remaining`;
    if($('health').getAttribute('aria-label')!==label){$('health').replaceChildren(...Array.from({length:run.maxHealth},(_,i)=>{const dot=document.createElement('span');dot.className='health-dot'+(i>=run.health?' empty':'');dot.textContent='◆';dot.setAttribute('aria-hidden','true');return dot;}));$('health').setAttribute('aria-label',label);}
  }
  function showQuestion(q){
    stopSpeech();
    const label=q.echo?'Second chance · half points':q.review?'Review · '+q.instruction:q.instruction;
    $('promptPanel').className='prompt-panel question'+(q.format==='listen'?' listen':'')+(q.format==='picture'?' picture':'')+(q.echo?' echo':'')+(q.review?' review':'');
    $('promptType').textContent=label;$('promptText').style.fontSize='';$('repeatAudio').hidden=q.format!=='listen';
    if(q.format==='picture'&&PIC.has(q.picture)){$('promptText').innerHTML=PIC.svg(q.picture,'Picture question');$('promptNote').textContent='Look at the picture. Your choices are approaching.';}
    else if(q.format==='listen'&&!listeningActive){$('promptText').textContent=q.speak;$('repeatAudio').hidden=true;$('promptNote').textContent='Listening is off. Choose the Turkish meaning.';}
    else if(q.format==='listen'){$('promptText').textContent='Listen carefully';$('promptNote').textContent='Hear the English word. Choose its Turkish meaning.';speakTimer=setTimeout(()=>speak(q.speak),450);}
    else{$('promptText').textContent=q.prompt;$('promptText').style.fontSize=q.prompt.length>90?'clamp(18px,2vw,30px)':'';$('promptNote').textContent='Read first. Your choices are approaching.';}
    if(!q.echo){const key=historyKey();if(!state.seen[key])state.seen[key]={};E.markSeen(state.seen[key],activeBank,q);persist();}
    clearGateResult();const cards=$('answerGates').children;Array.from(cards).forEach((card,i)=>{card.querySelector('span').textContent=q.choices[i];card.classList.toggle('long-choice',q.choices[i].length>36);});$('answerGates').hidden=true;$('courseInstruction').textContent='Your lane selects your answer';
  }
  function showAnswer(row){
    stopSpeech();$('repeatAudio').hidden=true;logAnswer(row);
    const cards=Array.from($('answerGates').children);clearGateResult();
    if(cards.length===3&&!$('answerGates').hidden){const picked=cards[row.lane],right=cards.findIndex(card=>card.querySelector('span')?.textContent===row.answer);
      if(picked)picked.classList.add(row.correct?'result-correct':'result-wrong');if(!row.correct&&cards[right])cards[right].classList.add('result-answer');
      gateResultTimer=setTimeout(()=>{$('answerGates').hidden=true;clearGateResult();},renderer.reduced?400:760);}
    else $('answerGates').hidden=true;
    $('promptPanel').className=`prompt-panel ${row.correct?'correct':'wrong'}`;$('promptType').textContent=row.correct?`Correct choice · +${row.points} points`:row.echo?'Keep going · we will review it again':'Keep going · learn this one';$('promptText').textContent=row.explanation;$('promptText').style.fontSize=row.explanation.length>90?'clamp(16px,1.6vw,26px)':'';$('promptNote').textContent=row.correct?'Nicely done. The next trail is yours.':`You chose “${row.picked}”. The answer is “${row.answer}”.`;
    $('challengeCount').textContent=`✦ ${run.correct} / 6`;$('courseInstruction').textContent='Coins +10 · obstacles cost one guard';
    if(row.correct){renderer.burst('answer',run.lane);renderer.floatAtRunner?.(`+${row.points}`,'#ffe7a3',1.15);renderer.ringAtRunner?.(currentHouse().color,1);sound('answer');}
    else sound('wrong');
    updateStreak();
  }
  function showTrail(event){
    stopSpeech();
    const key=historyKey();state.seen[key]??={};state.seen[key].trail=[...(state.seen[key].trail||[]).filter(w=>w.toLowerCase()!==event.word.toLowerCase()),event.word.toLowerCase()].slice(-12);persist();
    $('promptPanel').className='prompt-panel trail';$('promptType').textContent='Word Trail · spell the English word';
    $('promptText').textContent=event.clue||'Spell the word';$('promptText').style.fontSize='';
    $('promptNote').textContent=run.trail.allowed?'Collect the letters in order. One slip is allowed.':'Collect the letters in order. Every letter counts in Hard mode.';
    $('trailSlots').replaceChildren(...Array.from({length:event.length},()=>{const slot=document.createElement('span');slot.textContent='';return slot;}));$('trailSlots').hidden=false;
    $('courseInstruction').textContent='Spell it right for a Word Strike';
    if(listeningActive){$('repeatAudio').hidden=false;speakTimer=setTimeout(()=>speak(event.word.toLowerCase()),450);}
  }
  function showLetter(event){
    const slot=$('trailSlots').children[event.index];if(slot){slot.textContent=event.letter;slot.className=event.ok?'ok':'missed';slot.title=event.ok?'':`You collected ${event.picked}`;}
    if(event.ok){renderer.burst('answer',event.lane);renderer.floatAtRunner?.(event.letter,'#fff1c4',1.2);sound('letter');}else sound('hit');
  }
  function endTrail(event){
    stopSpeech();$('repeatAudio').hidden=true;logTrail(run.trail);
    $('promptPanel').className=`prompt-panel trail ${event.success?'correct':'wrong'}`;
    $('promptType').textContent=event.success?'Word Strike ready':'Word Trail complete';
    $('promptNote').textContent=event.success?`${event.word} is your special attack against the guardian.`:`The word was ${event.word}. Keep practising it.`;
    if(event.success){sound('answer');renderer.burst('answer',run.lane);}
  }
  function showBoss(){
    $('trailSlots').hidden=true;stopSpeech();$('repeatAudio').hidden=true;
    const boss=B.get(activeIsland);clearGateResult();$('answerGates').hidden=true;$('bossHUD').hidden=false;banner('boss',boss.name,boss.title,'Guardian of island '+activeIsland,boss.color);sound('bossIntro');
    if($('bossHPTrail'))$('bossHPTrail').style.width='100%';
    $('bossName').textContent=boss.name;$('bossTitle').textContent=boss.title;$('bossStatus').textContent='The guardian arrives';
    $('promptPanel').className='prompt-panel boss-prompt';$('promptType').textContent='ISLAND SHOWDOWN';$('promptText').style.fontSize='';$('promptText').textContent=`${boss.name} blocks the finish.`;
    $('promptNote').textContent='Dodge marked lanes. Enter the gold lane to fire.';$('courseInstruction').textContent='Every collected coin deals 10 damage';
    ['upButton','downButton','jumpButton'].forEach(id=>$(id).disabled=false);
  }
  function bossPhase(event){
    const state=event.state,lane=['A','B','C'][event.weakLane];
    if(state==='warn'||state==='strike'){$('promptText').textContent='Dodge the marked lanes — or jump.';$('bossStatus').textContent=state==='warn'?'Incoming attack':'Dodge / jump';$('promptNote').textContent='';}
    if(state==='expose'){$('promptText').textContent=`Enter lane ${lane} to fire your coins.`;$('bossStatus').textContent='Weak point exposed';$('promptNote').textContent='Stay briefly in the gold lane. No extra button needed.';}
  }
  $('passportButton').onclick=()=>{
    const h=currentHouse();$('passportTeam').textContent=`${h.name} · ${state.settings.className}`;$('passportAvatar').src=avatar();
    $('passportGrid').replaceChildren(...C.grades[state.settings.grade].map(u=>{
      const saved=levels()[u.id],card=document.createElement('article'),seal=document.createElement('div'),title=document.createElement('h3'),unit=document.createElement('small'),stars=document.createElement('b'),stats=document.createElement('p');
      card.className='passport-slot'+(saved?' stamped':'')+(freshStamps.has(u.id)?' fresh-stamp':'');seal.className='passport-seal';
      if(saved){const img=new Image();img.loading='lazy';img.src=B.get(u.id).asset;img.alt=B.get(u.id).name+' defeated';seal.append(img);const mark=document.createElement('span');mark.textContent={gryffindor:'✦',hufflepuff:'≋',slytherin:'❧',ravenclaw:'◈'}[h.id];mark.setAttribute('aria-label',h.element+' team seal');seal.append(mark);}else seal.textContent=String(u.id).padStart(2,'0');
      unit.textContent=`ISLAND ${u.id} · ${u.theme}`;title.textContent=B.get(u.id).name;stars.textContent=saved?'✦'.repeat(saved.stars)+'☆'.repeat(3-saved.stars):'Not yet stamped';stats.textContent=saved?`${saved.coinPercent===undefined?'Coin record —':saved.coinPercent+'% best coin haul'}${saved.hardClear?' · Hard cleared':''}`:'Your next story awaits.';card.append(seal,unit,title,stars,stats);return card;
    }));$('passportDialog').classList.toggle('reduced',state.settings.reducedMotion);$('passportDialog').showModal();freshStamps.clear();
  };
  $('bossesButton').onclick=()=>{
    $('bossGallery').replaceChildren(...B.bosses.map(b=>{const card=document.createElement('article'),img=new Image(),label=document.createElement('small'),title=document.createElement('h3'),sub=document.createElement('b'),description=document.createElement('p'),target=document.createElement('span');
      img.src=b.asset;img.alt=b.description;label.textContent=`ISLAND ${String(b.island).padStart(2,'0')}`;title.textContent=b.name;sub.textContent=b.title;description.textContent=b.description;target.textContent=`${E.bossPercent(state.settings.mode,b.island)}% of available coins · ${state.settings.mode.toUpperCase()}`;card.style.setProperty('--boss-color',b.color);card.append(img,label,title,sub,description,target);return card;}));$('bossesDialog').showModal();
  };
  function finish(result){
    stopSpeech();$('trailSlots').hidden=true;$('repeatAudio').hidden=true;setNavigator('');
    const before=window.LeagueAdventure?.restoration(state.progress,state.settings.className,activeIsland);
    const old=levels()[activeIsland];if(result.completed&&!practice&&(!old||result.stars>old.stars))freshStamps.add(activeIsland);
    resultContext={firstSeal:!practice&&result.completed&&!old,newBest:!practice&&result.completed&&Boolean(old)&&result.score>(old.score||0)};
    // v9.7.0: a completed run earns the session's navigator this island's seal (kept by the board and Google Sheets).
    if(result.completed&&!practice&&sessionNavigator)navigatorSeal=H.seal?.(activeIsland)||null;
    if(!practice){E.record(state.progress,progressKey(),activeIsland,result);persist();}
    // Bounded anonymous balance notes remain only on this browser, never in Sheets.
    try{const key='island-run-balance-v91',rows=JSON.parse(localStorage.getItem(key)||'[]');rows.push({island:activeIsland,grade:state.settings.grade,mode:state.settings.mode,readPace:state.settings.readPace,seed:result.seed,completed:result.completed,coinPercent:result.coinPercent,correct:result.correct,reason:result.failureReason,seconds:result.seconds,...result.metrics});localStorage.setItem(key,JSON.stringify(rows.slice(-60)));}catch{}
    if(result.completed){
      let after=window.LeagueAdventure?.restoration(state.progress,state.settings.className,activeIsland)||{stage:1,teams:[state.settings.house]};
      if(practice)after={stage:Math.min(4,(before?.stage||0)+1),teams:[...new Set([...(before?.teams||[]),state.settings.house])]};
      restoring={age:0,result,before:before||{stage:0,teams:[]},after,lastStage:-1};
      $('answerGates').hidden=true;$('bossHUD').hidden=true;$('restorationScene').hidden=false;$('gameSurface').classList.add('restoring');
      $('restorationAvatar').src=avatar();$('restorationLabel').textContent=practice?'Practice restoration':`${currentHouse().name} leaves its mark.`;
      const emblem=new Image();emblem.src=B.get(activeIsland).asset;emblem.alt='';const sealText=document.createElement('span');sealText.textContent=B.get(activeIsland).name+(practice?' · practice, not saved':' · seal earned');
      const sealStars=document.createElement('b');sealStars.textContent='✦'.repeat(result.stars)+'☆'.repeat(3-result.stars);const teamMark=document.createElement('i');teamMark.textContent={gryffindor:'✦',hufflepuff:'≋',slytherin:'❧',ravenclaw:'◈'}[state.settings.house];teamMark.setAttribute('aria-label',currentHouse().element+' team seal');$('restorationSeal').replaceChildren(emblem,teamMark,sealText,sealStars);
      $('restorationScene').classList.toggle('reduced',renderer.reduced);return;
    }
    stopSpeech();showResult(result);
  }
  function restorationFrame(dt){
    if(!restoring)return;restoring.age+=dt;const r=restoring;
    if(r.lastStage===-1){const realm=currentUnit(activeIsland).realm;$('restorationArt').innerHTML='<div class="landmark-before">'+S.islandSVG(realm,activeIsland,r.before)+'</div><div class="landmark-after">'+S.islandSVG(realm,activeIsland,r.after)+'</div>';r.lastStage=1;}
    const reveal=renderer.reduced?(r.age<1.2?0:100):Math.max(0,Math.min(100,(r.age-1.2)/1.8*100));$('restorationArt').style.setProperty('--renewal',reveal+'%');
    $('restorationScene').dataset.phase=r.age<1.2?'arrive':r.age<3.2?'renew':'seal';
    if(r.age>=5)endRestoration();
  }
  function endRestoration(){if(!restoring)return;const result=restoring.result;restoring=null;$('restorationScene').hidden=true;$('gameSurface').classList.remove('restoring');showResult(result);}
  $('skipRestoration').onclick=endRestoration;
  let resultContext={firstSeal:false,newBest:false},countUp=0;
  function showResult(result){
    $('answerGates').hidden=true;$('resultAvatar').src=avatar(currentHouse(),activeIsland);
    $('resultEyebrow').textContent=`${practice?'PRACTICE · ':''}${currentHouse().name} · ISLAND ${activeIsland}`;
    $('resultTitle').textContent=result.completed?(activeIsland===10?'The horizon is yours.':`${B.get(activeIsland).name} defeated!`):result.failureReason==='boss'?'The guardian held its ground.':'Another run awaits.';
    $('resultStars').replaceChildren(...Array.from({length:3},(_,i)=>{const span=document.createElement('span');span.textContent='✦';if(i>=result.stars)span.className='dim';return span;}));$('resultStars').setAttribute('aria-label',`${result.stars} stars earned`);
    $('resultMessage').textContent=practice?'Practice run — saved progress is unchanged.':result.completed?(activeIsland===10?'All ten islands are open. Replay your favourite trail.':'Your progress is saved. A new island is waiting.'):'Try a different lane, jump a little earlier, or switch to Soft mode on the map.';
    if(result.failureReason==='boss')$('resultMessage').textContent=`You collected ${result.coins} of ${result.requiredCoins} coins. Collect ${Math.max(0,result.requiredCoins-result.coins)} more on your next run to break ${B.get(activeIsland).name}’s guard.${practice?' Practice does not change saved progress.':''}`;
    if(result.failureReason==='boss-dodge')$('resultMessage').textContent='Watch the marked attack lanes, then move into the gold lane to fire. Your coin target stays the same. Try again when you are ready.';
    if(!storageOK&&!practice&&result.completed)$('resultMessage').textContent='Completed! Download a backup in Teacher to keep your progress.';
    $('resultScore').textContent=result.score.toLocaleString();
    // v9.5: the score counts up and the stars land one by one; badges name what was special about the run.
    window.cancelAnimationFrame?.(countUp);
    if(!renderer.reduced&&typeof requestAnimationFrame==='function'&&result.score>0){const start=performance.now(),target=result.score;$('resultScore').textContent='0';
      const step=now=>{const t=Math.min(1,(now-start)/900),v=Math.round(target*(1-Math.pow(1-t,3)));$('resultScore').textContent=v.toLocaleString();if(t<1)countUp=requestAnimationFrame(step);};countUp=requestAnimationFrame(step);}
    const badges=[];
    if(result.perfect)badges.push(['perfect','Perfect run']);
    if(resultContext.firstSeal)badges.push(['seal','Passport seal earned']);
    if(navigatorSeal?.added)badges.push(['seal',`${navigatorSeal.name} · seal ${navigatorSeal.count} of 10`]);
    if(resultContext.newBest)badges.push(['best','New best score']);
    if(result.hardClear)badges.push(['hard','Hard cleared']);
    if(result.bestStreak>=3)badges.push(['streak','Best streak ×'+result.bestStreak]);
    if($('resultBadges'))$('resultBadges').replaceChildren(...badges.map(([kind,text],i)=>{const b=document.createElement('span');b.className='result-badge '+kind;b.textContent=text;b.style.setProperty('--i',String(i));return b;}));
    $('resultStars').classList.remove('reveal');void $('resultStars').offsetWidth;$('resultStars').classList.add('reveal');$('resultCoins').textContent=`${result.coins} / ${result.totalCoins}`;$('resultAnswers').textContent=`${result.correct} / ${result.total}`;
    const reviewRows=result.review.map(row=>{const item=document.createElement('article'),title=document.createElement('b'),text=document.createElement('p');title.textContent=(row.echo?'Second chance · ':row.review?'Review · ':'')+(row.format==='listen'?'Listening: '+row.prompt:row.prompt);text.className=row.correct?'ok':'learn';text.textContent=row.correct?`✓ ${row.answer}`:`You chose: ${row.picked} · Answer: ${row.answer}`;item.append(title,text);return item;});
    if(result.trail?.done){const item=document.createElement('article'),title=document.createElement('b'),text=document.createElement('p');title.textContent=`Word Trail · ${result.trail.clue}`;text.className=result.trail.success?'ok':'learn';text.textContent=result.trail.success?`✓ ${result.trail.word} · Word Strike`:`You spelled: ${result.trail.letters.join('')} · Word: ${result.trail.word}`;item.append(title,text);reviewRows.push(item);}
    $('reviewList').replaceChildren(...reviewRows);
    $('resultDialog').querySelector('details').open=false;$('resultNext').hidden=!result.completed||activeIsland===10;$('resultNext').textContent=practice?'Preview next →':'Next island →';$('resultDialog').showModal();sound('finish');
    // Integration hook, inert unless a future host deliberately listens to it.
    window.dispatchEvent(new CustomEvent('island-runner:complete',{detail:{version:3,className:state.settings.className,grade:state.settings.grade,house:state.settings.house,island:activeIsland,practice,result}}));
  }
  function returnToMap(){stopSpeech();setNavigator('');clearBanner();clearGateResult();for(const d of document.querySelectorAll('dialog'))if(d.open)d.close();restoring=null;$('restorationScene').hidden=true;$('gameSurface').classList.remove('restoring');run=null;$('runView').hidden=true;$('mapView').hidden=false;$('app').classList.remove('running');$('teacherButton').disabled=false;if($('runSettingsButton'))$('runSettingsButton').disabled=false;$('bossesButton').disabled=false;$('passportButton').disabled=false;renderMap();}
  function pause(){if(!run||run.status!=='running'||run.paused)return;stopSpeech();run.pause(true);$('pauseDialog').showModal();reportHost();}
  function resume(){if(!hostVisible||!run||run.status!=='running')return;$('pauseDialog').close();run.pause(false);$('gameSurface').focus({preventScroll:true});reportHost();}
  let previous=performance.now(),lastFeedback=0;
  function frame(now){
    frameId=0;if(!hostVisible)return;
    const rawDt=Math.max(0,(now-previous)/1000),dt=Math.min(.1,rawDt);previous=now;
    if(run&&!$('runView').hidden){
      run.step(dt);
      for(const event of run.drain()){
        if(event.type==='question')showQuestion(event.question);
        if(event.type==='choices'){$('answerGates').hidden=false;sound('gate');$('promptNote').textContent='Choose A, B or C · keep collecting and jumping.';if(run.gate?.q?.format==='listen')speak(run.gate.q.speak);}
        if(event.type==='answer')showAnswer(event);
        if(event.type==='trailStart')showTrail(event);
        if(event.type==='letter')showLetter(event);
        if(event.type==='trailEnd')endTrail(event);
        if(event.type==='wordStrike'){runNotify(`Word Strike · ${event.word}`);$('bossStatus').textContent='Word Strike';}
        if(event.type==='coin'){renderer.burst('coin',event.lane,event.magnet);sound('coin',{streak:run.coinStreak});if(run.coinStreak>0&&run.coinStreak%10===0)renderer.floatAtRunner?.(`${run.coinStreak} coin chain`,'#ffe7a3',.7);}
        if(event.type==='streak'){renderer.floatAtRunner?.(`Streak ×${event.streak}`,'#fff1c4',.8);sound('streak');}
        if(event.type==='surge'){banner('surge','Spirit Surge',event.focus?'Three in a row · Elemental Focus is full':'Three in a row','Answer streak ×'+event.streak,currentHouse().color);renderer.ringAtRunner?.(currentHouse().color,1.6);sound('surge');}
        if(event.type==='perfect'){banner('perfect','Perfect Run','+'+event.bonus+' points · every question right first time','Island '+activeIsland,'#facc15');sound('perfect');}
        if(event.type==='jump')sound('jump');
        if(event.type==='hit'){renderer.burst('hit',run.lane);runNotify('One guard lost · dodge or jump');sound('hit');}
        if(event.type==='focus'){renderer.burst('answer',run.lane);runNotify('Elemental Focus · nearby coins + one shield');sound('answer');}
        if(event.type==='shield'){renderer.burst('answer',run.lane);runNotify('Focus shield protected you');}
        if(event.type==='rune')renderer.burst('answer',event.lane);
        if(event.type==='mechanic'){$('promptPanel').className='prompt-panel';$('promptType').textContent=event.name;$('promptText').textContent=event.hint;$('promptNote').textContent='';}
        if(event.type==='boss')showBoss();
        if(event.type==='bossPhase')bossPhase(event);
        if(event.type==='coinShot'){$('bossStatus').textContent='Coin volley launched';sound('answer');}
        if(event.type==='bossAttack'){$('promptText').textContent='Your coins become your attack.';$('bossStatus').textContent='Coin volley';}
        if(event.type==='bossHit'){renderer.burst(run.boss.hp===0?'bossFinal':'bossHit',run.lane);if(event.damage)renderer.floatAtBoss?.(`−${event.damage}`,event.word?'#fff1c4':'#ffd27a',event.final?1.5:event.word?1.3:1);sound('bossHit',{final:event.final});}
        if(event.type==='bossCounter'){$('promptText').textContent='The guardian holds the passage.';$('promptNote').textContent=run.coins<run.requiredCoins?'Collect more coins on your next run.':'Use the gold firing lanes on your next run.';$('bossStatus').textContent='Counterattack';}
        if(event.type==='bossKnockout'){renderer.burst('hit',1);sound('hit');$('promptText').textContent='The guardian pushes you back.';}
        if(event.type==='bossDefeated'){$('promptText').textContent=`${B.get(activeIsland).name}’s guard is broken!`;$('promptNote').textContent='The path to the next island is open.';$('bossStatus').textContent='Defeated';banner('defeated','Guardian defeated',`${B.get(activeIsland).name}’s guard is broken`,'Island '+activeIsland,B.get(activeIsland).color);sound('victory');}
        if(event.type==='finishTrail'){$('bossHUD').hidden=true;$('promptText').textContent='The finish is yours.';}
        if(event.type==='finish')finish(event.result);
      }
      if(lastFeedback>0&&run.feedback===0&&!run.gate&&run.status==='running'&&run.phase==='course'&&!run.trail?.started)idlePrompt();lastFeedback=run.feedback;
      if(run.gate)Array.from($('answerGates').children).forEach((card,i)=>{card.style.left='76%';card.classList.toggle('active',i===Math.round(run.lanePos));});
      const renderStart=performance.now();renderer.render(run,run.paused?0:dt);
      if(!run.paused&&run.status==='running')renderer.sample?.(rawDt,performance.now()-renderStart);updateHUD();
      restorationFrame(dt);
    }
    reportHost();frameId=requestAnimationFrame(frame);
  }
  function control(action){if(!run||!run.canControl())return;if(action==='up')run.move(-1);if(action==='down')run.move(1);if(action==='jump')run.jump();}
  // v9.7.0: the teacher's phone (student controller or a Bluetooth keyboard on it) steers the runner too.
  function remoteControl(action){
    if(!['up','down','jump'].includes(action)||!run||run.status!=='running'||document.querySelector('dialog[open]'))return false;
    control(action);const button=$({up:'upButton',down:'downButton',jump:'jumpButton'}[action]);
    if(button){button.classList.add('pressed');clearTimeout(button._remote);button._remote=setTimeout(()=>button.classList.remove('pressed'),160);}
    return true;
  }
  [['upButton','up'],['downButton','down'],['jumpButton','jump']].forEach(([id,action])=>{
    const button=$(id);button.addEventListener('pointerdown',e=>{e.preventDefault();control(action);button.classList.add('pressed');button.setPointerCapture?.(e.pointerId);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>button.classList.remove('pressed'));
    button.addEventListener('click',e=>{if(e.detail===0)control(action);});
  });
  let pointer=null;
  $('gameSurface').addEventListener('pointerdown',e=>{if(e.isPrimary===false)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('gameSurface').setPointerCapture?.(e.pointerId);});
  $('gameSurface').addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const action=E.swipe(e.clientX-pointer.x,e.clientY-pointer.y);pointer=null;if(action)control(action);});
  $('gameSurface').addEventListener('pointercancel',()=>pointer=null);
  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if($('pauseDialog').open&&['Escape','p','P'].includes(e.key)){e.preventDefault();resume();return;}
    if(document.querySelector('dialog[open]')||!run||run.status!=='running')return;
    const actions={ArrowUp:'up',ArrowDown:'down',ArrowRight:'jump',' ':'jump'};
    if(actions[e.key]){e.preventDefault();if(!e.repeat||actions[e.key]==='jump')control(actions[e.key]);}
    if(['p','P','Escape'].includes(e.key)){e.preventDefault();pause();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>pause());
  $('pauseDialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('resultDialog').addEventListener('cancel',e=>{e.preventDefault();returnToMap();});
  $('resumeButton').onclick=resume;$('pauseButton').onclick=pause;$('restartButton').onclick=()=>startRun(activeIsland,practice);$('leaveButton').onclick=returnToMap;
  $('resultChampions').onclick=()=>H.back();$('resultMap').onclick=returnToMap;$('resultReplay').onclick=()=>startRun(activeIsland,practice);$('resultNext').onclick=()=>startRun(Math.min(10,activeIsland+1),practice);
  $('startButton').onclick=()=>startRun();$('howButton').onclick=()=>$('helpDialog').showModal();
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(b.dataset.close==='teacherDialog'&&!discardDraft())return;$(b.dataset.close).close();});
  $('brand').onclick=e=>{e.preventDefault();if(run){pause();}else renderMap();};
  $('gradeSelect').onchange=()=>{state.settings.grade=+$('gradeSelect').value;state.settings.className=classes[state.settings.grade][0];selected=preferredIsland();persist();renderMap();};
  $('classSelect').onchange=()=>{state.settings.className=$('classSelect').value;selected=preferredIsland();persist();renderMap();};
  ['soft','hard'].forEach(mode=>$(mode+'Mode').onclick=()=>{state.settings.mode=mode;persist();renderMap();});
  $('soundButton').onclick=()=>{state.settings.sound=!state.settings.sound;persist();updateSoundButton();if(state.settings.sound)sound('coin');};
  $('fullscreenButton').onclick=async()=>{try{await H.fullscreen();}catch(_){notify('Use the browser’s full-screen option.');}};
  if($('runSoundButton'))$('runSoundButton').onclick=()=>$('soundButton').click();if($('runFullscreenButton'))$('runFullscreenButton').onclick=()=>$('fullscreenButton').click();

  /* Teacher editing uses a separate draft; only valid, explicit saves replace the bank. */
  function discardDraft(){if(!editorDirty)return true;if(!window.confirm('Discard the unsaved question changes?'))return false;editorDirty=false;return true;}
  function showTab(name){if(name!=='questions'&&!discardDraft())return;['setup','questions','backup'].forEach(t=>$(t+'Tab').hidden=t!==name);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-selected',b.dataset.tab===name);});}
  function renderRunOptions(){
    const o=options();$('optionListening').checked=o.listening;$('optionPictures').checked=o.pictures;
    const voice=speech?englishVoice():null;$('testVoice').disabled=!voice;
    $('listeningSupport').textContent=!speech?'This browser cannot speak. Listening gates will show their words as text.':voice?`Voice: ${voice.name} (${voice.lang}).`:'No English voice is installed on this board. Listening gates will show their words as text. Add an English voice in the board\u2019s speech settings, then reopen Island Run.';
    const entries=H.review?.(state.settings.grade)||[];
    $('reviewSummary').textContent=entries.length?`${entries.length} concept${entries.length===1?'':'s'} waiting for review in ${state.settings.className}. Up to two return in each run.`:`Nothing to review in ${state.settings.className} yet. Missed questions will appear here.`;
    $('reviewItems').replaceChildren(...entries.slice(0,8).map(e=>{const li=document.createElement('li');li.textContent=`${e.prompt||e.concept} · island ${e.island} · missed ${e.misses}×`;return li;}));
    $('clearReview').disabled=!entries.length;
  }
  function saveRunOptions(){const value={listening:$('optionListening').checked,pictures:$('optionPictures').checked};Object.assign(localOptions,value);H.setOptions?.(value);}
  function openRunSettings(){
    renderRunOptions();
    editorGrade=state.settings.grade;editorIsland=selected;editorDirty=false;$('readingPace').value=state.settings.readPace;$('reducedMotion').checked=state.settings.reducedMotion;$('graphicsQuality').value=graphics;
    $('previewIsland').replaceChildren(...C.grades[state.settings.grade].map(u=>new Option(`${u.id}. ${u.theme} — ${u.title}`,u.id)));$('previewIsland').value=selected;
    $('editorGrade').value=editorGrade;fillEditorIslands();renderEditorList();updateStorageStatus();showTab('setup');$('teacherDialog').showModal();
  };
  $('teacherButton').onclick=()=>{if(!H.studio?.({island:selected}))openRunSettings();};
  if($('runSettingsButton'))$('runSettingsButton').onclick=openRunSettings;
  $('testVoice').onclick=()=>{const was=listeningActive;listeningActive=true;speak('Welcome to Island Run');listeningActive=was;};
  $('optionListening').onchange=saveRunOptions;$('optionPictures').onchange=saveRunOptions;
  $('clearReview').onclick=()=>{if(!window.confirm(`Clear the review list for ${state.settings.className}? Saved answers stay in Google Sheets.`))return;H.clearReview?.();renderRunOptions();};
  $('repeatAudio').onclick=()=>{const q=run?.gate?.q;if(q?.format==='listen')speak(q.speak);else if(run?.trailActive)speak(run.trail.word.toLowerCase());};
  $('graphicsQuality').onchange=()=>{graphics=$('graphicsQuality').value==='light'?'light':'auto';try{localStorage.setItem('island-run-graphics',graphics);}catch{}};
  if(H.studio)document.querySelector('[data-tab="questions"]')?.setAttribute('hidden','');
  $('teacherDialog').addEventListener('cancel',e=>{if(!discardDraft())e.preventDefault();});
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  $('readingPace').onchange=()=>{state.settings.readPace=$('readingPace').value;persist();};$('reducedMotion').onchange=()=>{state.settings.reducedMotion=$('reducedMotion').checked;persist();setAccent();};$('previewButton').onclick=()=>startRun(+$('previewIsland').value,true);
  function fillEditorIslands(){$('editorIsland').replaceChildren(...C.grades[editorGrade].map(u=>new Option(`${u.id}. ${u.theme} — ${u.title}`,u.id)));$('editorIsland').value=editorIsland;$('editorObjective').textContent=C.grades[editorGrade][editorIsland-1].objective;}
  function renderEditorList(focusID){
    const bank=bankFor(editorGrade,editorIsland);editingID=focusID||bank[0].id;$('editorObjective').textContent=`${C.grades[editorGrade][editorIsland-1].objective} · ${bank.length} questions`;
    $('questionList').replaceChildren(...bank.map((q,i)=>{const b=document.createElement('button');b.classList.toggle('active',q.id===editingID);const label=document.createElement('small');label.textContent=`${i+1} · ${q.kind==='gap'?'Sentence':q.kind==='word'?'Word meaning':'Question'}`;const text=document.createElement('span');text.textContent=q.prompt;b.append(label,text);b.onclick=()=>{if(!discardDraft())return;renderEditorList(q.id);};return b;}));
    loadQuestion(bank.find(q=>q.id===editingID)||bank[0]);
  }
  function loadQuestion(q){
    editingID=q.id;$('questionKind').value=q.kind;$('questionPrompt').value=q.prompt;q.choices.forEach((c,i)=>$('choice'+i).value=c);$('correctChoice').value=q.answer;$('questionInstruction').value=q.instruction||'';$('questionExplanation').value=q.explanation||'';$('editorStatus').textContent='Choices are shuffled between lanes during play.';$('deleteQuestion').disabled=false;editorDirty=false;
  }
  $('editorGrade').onchange=()=>{if(!discardDraft()){$('editorGrade').value=editorGrade;return;}editorGrade=+$('editorGrade').value;editorIsland=1;fillEditorIslands();renderEditorList();};
  $('editorIsland').onchange=()=>{if(!discardDraft()){$('editorIsland').value=editorIsland;return;}editorIsland=+$('editorIsland').value;fillEditorIslands();renderEditorList();};
  $('questionForm').addEventListener('input',()=>{editorDirty=true;$('editorStatus').textContent='Unsaved changes — choose Save question to keep them.';});
  $('addQuestion').onclick=()=>{if(!discardDraft())return;editingID=null;document.querySelectorAll('#questionList button').forEach(b=>b.classList.remove('active'));$('questionForm').reset();$('questionInstruction').value='';$('questionExplanation').value='';$('deleteQuestion').disabled=true;$('editorStatus').textContent='Add your prompt and three different answers. Then choose the correct answer.';$('questionPrompt').focus();};
  $('questionForm').onsubmit=e=>{
    e.preventDefault();const q={id:editingID||`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,kind:$('questionKind').value,prompt:$('questionPrompt').value,choices:[0,1,2].map(i=>$('choice'+i).value),answer:+$('correctChoice').value,instruction:$('questionInstruction').value.trim(),explanation:$('questionExplanation').value.trim()};
    const original=bankFor(editorGrade,editorIsland).find(item=>item.id===editingID);if(original?.concept&&q.kind==='word'&&q.prompt.trim()===original.prompt)q.concept=original.concept;
    if(!E.validateQuestion(q)){$('editorStatus').textContent='Please add a prompt, three different choices and a valid correct answer. Keep each choice under 66 characters.';return;}
    if(q.kind==='gap'&&!q.prompt.includes('___')){$('editorStatus').textContent='For a sentence challenge, mark the blank with three underscores: ___';return;}
    const bank=bankFor(editorGrade,editorIsland).map(E.cleanQuestion),index=bank.findIndex(item=>item.id===q.id);
    if(index>=0)bank[index]=E.cleanQuestion(q);else if(bank.length<400)bank.push(E.cleanQuestion(q));else{$('editorStatus').textContent='This island already has 400 questions. Edit or delete one first.';return;}
    state.overrides[`${editorGrade}-${editorIsland}`]=bank;editorDirty=false;persist();renderEditorList(q.id);$('editorStatus').textContent=storageOK?'Saved. This question can appear in the next run.':'Saved for now. Download a backup before closing.';
  };
  $('deleteQuestion').onclick=()=>{
    const bank=bankFor(editorGrade,editorIsland);if(bank.length<=1){$('editorStatus').textContent='Keep at least one question on each island.';return;}
    if(!window.confirm('Delete this question from this island?'))return;
    state.overrides[`${editorGrade}-${editorIsland}`]=bank.filter(q=>q.id!==editingID).map(E.cleanQuestion);editorDirty=false;persist();renderEditorList();$('editorStatus').textContent='Question deleted.';
  };
  $('exportButton').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`island-runner-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup download started. Keep it with your game folder.');};
  $('importButton').onclick=()=>$('importFile').click();
  $('balanceExport').onclick=()=>{try{const rows=JSON.parse(localStorage.getItem('island-run-balance-v91')||'[]'),blob=new Blob([JSON.stringify({version:'10.4.0',runs:rows},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='island-run-balance-notes.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{notify('Balance notes are unavailable in this browser.');}};
  $('importFile').onchange=async()=>{
    const file=$('importFile').files[0];$('importFile').value='';if(!file)return;
    try{if(file.size>8*1024*1024)throw Error('This file is too large. Choose an Island Runner JSON backup smaller than 8 MB.');pendingImport=E.validateSave(JSON.parse(await file.text()));const edits=Object.keys(pendingImport.overrides).length,completed=Object.values(pendingImport.progress).reduce((n,p)=>n+Object.keys(p).length,0);$('importSummary').textContent=`Ready to restore ${completed} completed team islands and ${edits} edited question banks. This will replace the current progress, settings and edits in this browser.`;$('importPreview').hidden=false;}
    catch(error){pendingImport=null;notify(error.message);}
  };
  $('confirmImport').onclick=()=>{if(!pendingImport)return;state=pendingImport;pendingImport=null;enforceHost();persist();$('importPreview').hidden=true;$('teacherDialog').close();selected=preferredIsland();renderMap();notify('Backup restored. Your islands and questions are ready.');};
  $('cancelImport').onclick=()=>{pendingImport=null;$('importPreview').hidden=true;};
  function reportHost(){
    const audio=Boolean(listeningActive&&run&&run.status==='running'&&(run.gate?.q?.format==='listen'||run.trailActive));
    const status={ready:true,status:run?run.status:'map',canPause:Boolean(run&&run.status==='running'),paused:Boolean(run?.paused),navigator:sessionNavigator,audio,voice:speech?(chosenVoice?`${chosenVoice.name} (${chosenVoice.lang})`:'none'):'unsupported'};
    const key=JSON.stringify(status);if(key!==lastHostState){lastHostState=key;H.report(status);}
  }
  function setHostVisible(value){
    hostVisible=Boolean(value);
    if(!hostVisible){pause();if(frameId)cancelAnimationFrame(frameId);frameId=0;audioContext?.suspend().catch(()=>{});}
    else{previous=performance.now();if(!frameId)frameId=requestAnimationFrame(frame);if(state.settings.sound&&audioContext?.state==='suspended')audioContext.resume().catch(()=>{});}
    reportHost();
  }
  selected=preferredIsland();renderMap();updateStorageStatus();frameId=requestAnimationFrame(frame);
  window.IslandRunner={version:'10.4.0',
    setOptions(value){if(value&&typeof value==='object')Object.assign(localOptions,{listening:value.listening!==false,pictures:value.pictures===true});if(value?.listening)listeningActive=speechReady();if(!value?.listening){listeningActive=false;stopSpeech();if(run?.gate?.q?.format==='listen'){$('promptText').textContent=run.gate.q.speak;$('promptNote').textContent='Listening is off. The word is shown instead.';$('repeatAudio').hidden=true;}}if($('teacherDialog').open)renderRunOptions();reportHost();},
    repeatAudio(){const q=run?.gate?.q;if(q?.format==='listen'&&listeningActive){speak(q.speak);return {ok:true,message:'Repeating the word'};}if(run?.trailActive&&listeningActive){speak(run.trail.word.toLowerCase());return {ok:true,message:'Repeating the word'};}return {ok:false,message:'No listening question right now'};},
    control:remoteControl,applyTeaching(catalog){acceptTeaching(catalog);if(!run||run.status!=='running')renderMap();},applyProgress(progress){mergeProgress(progress);persist();if(!run||run.status!=='running'){selected=preferredIsland();renderMap();}},pause,resume,setHostVisible,getSnapshot:()=>({settings:{...state.settings},selectedIsland:selected,status:run?run.status:'map',practice,progress:JSON.parse(JSON.stringify(state.progress))})};
  reportHost();
})();
