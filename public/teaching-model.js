var TeachingModel=(function(){
 'use strict';
 const validKey=key=>typeof key==='string'&&/^[5-8]-(10|[1-9])$/.test(key);
 function str(v,max,optional=false){if(optional&&v===undefined)return '';if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))throw Error('A text field is empty or too long.');return v.trim();}
 function question(q){
  if(!q||!['word','gap','question'].includes(q.kind))throw Error('Choose Word, Sentence or Question.');
  const choices=Array.isArray(q.choices)&&q.choices.length===3?q.choices.map(v=>str(v,65)):null;
  if(!choices||new Set(choices.map(v=>v.toLocaleLowerCase('tr'))).size!==3)throw Error('Each question needs three different choices.');
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>2)throw Error('Choose the correct answer.');
  const out={id:str(q.id,100),kind:q.kind,prompt:str(q.prompt,150),choices,answer:q.answer,instruction:str(q.instruction,80,true),explanation:str(q.explanation,200,true)};
  if(out.id==='#unit'||/^[=+@-]/.test(out.id))throw Error('Invalid question ID.');
  if(out.kind==='gap'&&!out.prompt.includes('___'))throw Error('Mark the sentence blank with three underscores: ___');
  if(q.concept)out.concept=str(q.concept,100);return out;
 }
 function clean(raw){
  if(!raw||typeof raw!=='object')throw Error('Invalid teaching content.');
  const out={objective:str(raw.objective,300,true),bank:null};
  if(raw.bank!==null&&raw.bank!==undefined){if(!Array.isArray(raw.bank)||raw.bank.length<1||raw.bank.length>400)throw Error('Use 1–400 questions per island.');out.bank=raw.bank.map(question);if(new Set(out.bank.map(q=>q.id)).size!==out.bank.length)throw Error('Question IDs must be unique.');}
  if(JSON.stringify(out).length>300000)throw Error('This bank is too large. Shorten the questions.');return out;
 }
 function bulk(text,prefix){
  const rows=text.trim().split(/\r?\n/).filter(v=>v.trim()).map(v=>v.split(v.includes('\t')?'\t':'|').map(x=>x.trim()));
  if(!rows.length)throw Error('Paste vocabulary or questions first.');
  if(rows.every(r=>r.length===2)){
   if(rows.length<3||new Set(rows.map(r=>r[0].toLocaleLowerCase('tr'))).size!==rows.length||new Set(rows.map(r=>r[1].toLocaleLowerCase('tr'))).size!==rows.length)throw Error('Paste at least three pairs with different words and meanings.');
   return rows.flatMap((r,i)=>[0,1].map(d=>question({id:prefix+'-'+i+'-'+d,kind:'word',prompt:r[d],choices:[r[1-d],rows[(i+1)%rows.length][1-d],rows[(i+2)%rows.length][1-d]],answer:0,instruction:d?'Find the English meaning':'Find the Turkish meaning',explanation:r[0]+' = '+r[1]})));
  }
  return rows.map((r,i)=>{if(r.length!==5)throw Error('Use: kind | prompt | correct answer | wrong answer | wrong answer');return question({id:prefix+'-'+i,kind:r[0],prompt:r[1],choices:r.slice(2),answer:0});});
 }
 return {validKey,question,clean,bulk};
})();
if(typeof module==='object'&&module.exports)module.exports=TeachingModel;
