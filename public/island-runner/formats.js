/* v9.3.0 question formats. Pure functions: the engine and its tests stay deterministic. */
(function(root){
  'use strict';
  const E=typeof module==='object'&&module.exports?require('./engine.js'):root.RunnerEngine;
  const P=typeof module==='object'&&module.exports?require('./pictures.js'):root.RunnerPictures;
  const lower=v=>String(v||'').trim().toLocaleLowerCase('tr');
  // Vocabulary pairs come from word questions whose explanation reads "english = Turkish".
  function vocabulary(bank){
    const out=new Map();
    for(const q of bank||[]){
      if(q?.kind!=='word'||typeof q.explanation!=='string')continue;
      const parts=q.explanation.split(' = ');if(parts.length!==2)continue;
      const en=parts[0].trim(),tr=parts[1].trim();
      if(!en||!tr||en.length>40||tr.length>60||out.has(lower(en)))continue;
      out.set(lower(en),{en,tr,concept:q.concept||E.familyOf(q),id:q.id});
    }
    return [...out.values()];
  }
  function place(correct,decoys,lane){const choices=[],rest=decoys.slice();for(let l=0;l<3;l++)choices.push(l===lane?correct:rest.shift());return choices;}
  function pickDecoys(target,pool,rng,count=2,avoid=()=>false){
    const options=E.shuffle(pool.filter(v=>lower(v)!==lower(target)&&!avoid(v)),rng),out=[];
    for(const v of options){if(out.length>=count)break;if(!out.some(o=>lower(o)===lower(v)))out.push(v);}
    return out.length===count?out:null;
  }
  // A listening gate hides an English word and speaks it; the team chooses the Turkish meaning.
  function listeningQuestion(entry,vocab,rng,lane){
    const decoys=pickDecoys(entry.tr,vocab.map(v=>v.tr),rng);if(!decoys)return null;
    return {id:'listen:'+entry.id,kind:'word',concept:entry.concept,prompt:entry.en,choices:place(entry.tr,decoys,lane),answer:lane,
      instruction:'Listen. Choose the Turkish meaning',explanation:`${entry.en} = ${entry.tr}`,format:'listen',speak:entry.en};
  }
  // A picture gate shows a drawing; the team chooses the English word.
  function pictureQuestion(entry,vocab,rng,lane){
    const decoys=pickDecoys(entry.en,vocab.map(v=>v.en),rng,2,v=>P.similar(v,entry.en));if(!decoys)return null;
    return {id:'picture:'+entry.id,kind:'word',concept:entry.concept,prompt:'Picture: '+entry.en,choices:place(entry.en,decoys,lane),answer:lane,
      instruction:'Which word matches the picture?',explanation:`${entry.en} = ${entry.tr}`,format:'picture',picture:entry.en};
  }
  function applyFormats(questions,{bank,rng,listening=false,pictures=false}={}){
    const out=questions.map(q=>({...q})),vocab=vocabulary(bank);
    if(vocab.length<3||(!listening&&!pictures))return out;
    const concepts=new Set(out.map(q=>q.family||q.concept)),taken=new Set();
    // Prefer replacing ordinary word questions; review questions keep their place.
    const slots=()=>[...out.keys()].filter(i=>!out[i].review&&!taken.has(i)).sort((a,b)=>(out[b].kind==='word')-(out[a].kind==='word'));
    function replace(build,filter){
      const candidates=E.shuffle(vocab.filter(v=>!concepts.has(v.concept)&&filter(v)),rng);
      for(const i of slots())for(const entry of candidates){
        const q=build(entry,vocab,rng,out[i].answer);
        if(q&&E.validateQuestion(q)){q.family=entry.concept;out[i]=q;taken.add(i);concepts.add(entry.concept);return true;}
      }
      return false;
    }
    if(listening)replace(listeningQuestion,v=>/^[a-z][a-z' -]{1,30}$/i.test(v.en));
    if(pictures)replace(pictureQuestion,v=>P.has(v.en));
    return out;
  }
  // One single word (3–8 letters) for the Word Trail, avoiding the most recent trails.
  function trailWord(bank,rng,recent=[]){
    const words=vocabulary(bank).filter(v=>E.trailWordPattern.test(v.en)),seen=new Set((recent||[]).map(lower));
    let pool=words.filter(v=>!seen.has(lower(v.en)));if(!pool.length)pool=words;if(!pool.length)return null;
    const comfortable=pool.filter(v=>v.en.length>=4&&v.en.length<=7);if(comfortable.length)pool=comfortable;
    const v=pool[Math.floor(rng()*pool.length)];return {word:v.en,clue:v.tr,concept:v.concept,id:v.id};
  }
  // Up to two review questions: a fresh variant of a missed concept, current island first.
  function reviewQuestions(entries,{grade,island,bankFor}){
    const out=[],used=new Set();
    for(const entry of entries||[]){
      if(out.length>=2)break;if(!entry||used.has(entry.concept))continue;
      const islands=[island,entry.island].filter((v,i,a)=>Number.isInteger(v)&&v>=1&&v<=10&&a.indexOf(v)===i);
      let found=null;
      for(const i of islands){
        const bank=(bankFor(grade,i)||[]).filter(E.validateQuestion).filter(q=>E.familyOf(q)===entry.concept);
        if(!bank.length)continue;
        const missed=new Set(entry.ids||[]),fresh=bank.filter(q=>!missed.has(q.id));
        found=(fresh.length?fresh:bank)[0];if(found)break;
      }
      if(found){out.push(found);used.add(entry.concept);}
    }
    return out;
  }
  // Navigators rotate through every listed student before anyone repeats.
  class Navigators{
    constructor(names,rng){this.names=[...new Set((names||[]).filter(n=>typeof n==='string'&&n.trim()).map(n=>n.trim().slice(0,70)))];this.rng=rng||Math.random;this.bag=[];this.current='';}
    next(){if(!this.names.length)return '';if(!this.bag.length){this.bag=E.shuffle(this.names,this.rng);if(this.names.length>1&&this.bag[0]===this.current)this.bag.push(this.bag.shift());}this.current=this.bag.shift();return this.current;}
  }
  const api=Object.freeze({vocabulary,applyFormats,listeningQuestion,pictureQuestion,trailWord,reviewQuestions,Navigators});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerFormats=api;
})(typeof globalThis!=='undefined'?globalThis:this);
