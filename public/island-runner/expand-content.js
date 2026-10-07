/* Compile the four authored banks. Classic scripts work directly from index.html. */
(function(root){
  'use strict';
  const C=typeof module==='object'&&module.exports?require('./content.js'):root.RunnerContent;
  if(typeof module==='object'&&module.exports)for(let g=5;g<=8;g++){require('./questions-grade'+g+'.js');require('./variety-grade'+g+'.js');require('./translate-grade'+g+'.js');}
  if(C.version===3){if(typeof module==='object'&&module.exports)module.exports=C;return;}
  const rows=s=>s.trim().split('\n').map(line=>line.split('|').map(v=>v.trim()));
  for(const [grade,units] of Object.entries(C.grades))units.forEach((u,index)=>{
    const p=root.RunnerExpansion[grade][index],words=rows(p.words),prefix=`${grade}-${u.id}`;
    u.legacyIds=u.bank.map(q=>q.id);
    u.bank.forEach(q=>{if(q.kind==='word')q.concept=q.id.replace(/-[01]$/,'');});
    words.forEach((w,n)=>{
      const concept=`${prefix}-xword-${n}`;
      [0,1].forEach(direction=>{
        const side=1-direction;
        u.bank.push({id:`${concept}-${direction}`,concept,kind:'word',prompt:w[direction],instruction:direction?'Find the English meaning':'Find the Turkish meaning',choices:[w[side],words[(n+5)%words.length][side],words[(n+11)%words.length][side]],answer:0,explanation:`${w[0]} = ${w[1]}`});
      });
      u.bank.push({id:`${concept}-meaning`,concept,kind:'question',prompt:`Which word means “${w[2]}”?`,instruction:'Read the definition',choices:[w[0],words[(n+5)%words.length][0],words[(n+11)%words.length][0]],answer:0,explanation:`${w[0]}: ${w[2]}.`});
    });
    [['gap',p.gaps],['question',p.questions]].forEach(([kind,text])=>rows(text).forEach((q,n)=>u.bank.push({id:`${prefix}-x${kind}-${n}`,kind,prompt:q[0],instruction:kind==='gap'?'Complete the sentence':'Choose the best answer',choices:q.slice(1),answer:0,explanation:kind==='gap'?q[0].replace('___',q[1]):q[1]})));
  });
  // Keep the previous revision for non-destructive migration of teacher edits.
  for(const [grade,units] of Object.entries(C.grades))units.forEach((u,index)=>{
    u.revision2Ids=u.bank.map(q=>q.id);u.revision2Bank=JSON.parse(JSON.stringify(u.bank));
    u.bank.forEach(q=>{if(q.concept&&q.id.endsWith('-meaning'))q.kind='word';});
    const p=root.RunnerVariety[grade][index],words=rows(p.words),prefix=`${grade}-${u.id}`;
    words.forEach((w,n)=>{
      const concept=`${prefix}-yword-${n}`;
      [0,1].forEach(direction=>{const side=1-direction;u.bank.push({id:`${concept}-${direction}`,concept,kind:'word',prompt:w[direction],instruction:direction?'Find the English meaning':'Find the Turkish meaning',choices:[w[side],words[(n+1)%words.length][side],words[(n+2)%words.length][side]],answer:0,explanation:`${w[0]} = ${w[1]}`});});
      u.bank.push({id:`${concept}-meaning`,concept,kind:'word',prompt:`Which word means “${w[2]}”?`,instruction:'Read the definition',choices:[w[0],words[(n+1)%words.length][0],words[(n+2)%words.length][0]],answer:0,explanation:`${w[0]}: ${w[2]}.`});
    });
    [['gap',p.gaps],['question',p.questions]].forEach(([kind,text])=>rows(text).forEach((q,n)=>u.bank.push({id:`${prefix}-y${kind}-${n}`,kind,prompt:q[0],instruction:kind==='gap'?'Complete the sentence in context':'Read, think and choose',choices:q.slice(1),answer:0,explanation:kind==='gap'?q[0].replace('___',q[1]):q[1]})));
  });
  // v10.4.2: ten Turkish → English sentence and question translations per island (translate-grade5–8.js).
  // Each row: Turkish | English (correct) | English | English. Kind "question", so they share the question slots.
  for(const [grade,units] of Object.entries(C.grades))units.forEach((u,index)=>{
    const text=root.RunnerTranslate?.[grade]?.[index];if(!text)return;
    rows(text).forEach((q,n)=>{const id=`${grade}-${u.id}-ztranslate-${n}`;
      u.bank.push({id,concept:id,kind:'question',prompt:q[0],instruction:'Translate into English',choices:q.slice(1),answer:0,explanation:`${q[0]} = ${q[1]}`});});
  });
  C.version=3;
  if(typeof module==='object'&&module.exports)module.exports=C;
})(typeof globalThis!=='undefined'?globalThis:this);
