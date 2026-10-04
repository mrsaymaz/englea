/* Finite elemental choreography. These presets never read or change damage. */
(function(root){
 'use strict';
 const presets={
  gryffindor:{element:'fire',color:'#fb923c',attacks:['Ember Pounce','Flame Wheel','Meteor Claw'],defenses:['Ember Brace','Flare Parry','Flame Mantle'],
   travel:[[-22,0,-6,10],[-6,26,19,8],[-42,-9,-13,18]],guard:[[-4,8,-4,.96,.9],[12,-3,16,.94,1.04],[0,-9,-8,1.08,.95]],
   strike:['<path d="M10 62Q22 23 47 12L39 37 68 20Q59 55 25 68M25 57l25-24"/>','<path d="M21 19Q65 0 69 43Q69 69 35 71L46 55M58 60Q14 80 11 38Q12 16 34 9L26 27"/>','<path d="M13 15l20 24M27 8l16 26M10 31l19 17M40 31l-9 25 21-4-2 18 19-32-19 4 6-23Z"/>'],
   guardMark:['<path d="M40 9L65 21 60 52 40 71 20 52 15 21Z M28 50l12-26 12 26-12-5Z"/>','<path d="M65 22Q25-6 12 35Q7 65 38 71M15 51Q55 82 69 42Q75 14 45 8M22 12l-5 21 20-3"/>','<path d="M14 66Q1 45 24 17L22 44Q33 29 40 8Q61 25 53 47L64 32Q77 59 62 69Z"/>']},
  slytherin:{element:'nature',color:'#4ade80',attacks:['Vine Whip','Thorn Ambush','Coiling Strike'],defenses:['Leaf Fold','Vine Weave','Thorn Bulwark'],
   travel:[[0,25,11,7],[-12,-18,-15,16],[7,32,24,6]],guard:[[-8,7,20,.88,1.05],[7,0,-14,1.07,.93],[0,11,5,1.12,.88]],
   strike:['<path d="M7 64Q64 77 65 15Q43 0 29 30Q22 56 61 47M24 55l-12-9M51 35l15-6M37 29l-8-15"/>','<path d="M9 66l14-30 4 15 14-40 4 23 24-21-18 37 15-6-20 25"/>','<path d="M16 17Q62-4 68 31Q71 66 30 66Q8 62 17 39Q24 23 48 32Q62 43 44 51M18 64L6 72M65 22l9-9"/>'],
   guardMark:['<path d="M13 59Q8 18 65 10Q76 65 24 70Z M20 63L60 17M33 48l-9-17M43 38l17 5"/>','<path d="M12 13Q63 29 66 66M65 12Q16 30 13 67M12 28Q40 65 67 29M12 49Q40 14 67 49"/>','<path d="M40 7l8 13 15-6-1 17 12 9-12 8 1 17-15-5-8 13-9-13-14 5 1-17-12-8 12-9-1-17 14 6Z"/>']},
  hufflepuff:{element:'air',color:'#e0f2fe',attacks:['Gust Dash','Spiral Lift','Cyclone Drop'],defenses:['Wind Cushion','Slipstream Turn','Cyclone Shell'],
   travel:[[-4,0,0,14],[-32,26,13,6],[-50,-15,-9,10]],guard:[[-10,0,0,1.05,.88],[17,-12,-18,.94,1.02],[0,-16,12,1.06,1.04]],
   strike:['<path d="M7 27h47l-9-10M7 40h64L54 52M14 58h30"/>','<path d="M12 57Q69 74 65 42Q56 17 26 35Q7 47 28 55M20 21Q50 4 66 22M40 8l8 10-13 4"/>','<path d="M12 20Q40 5 68 20M18 33Q40 19 62 33M25 46Q40 35 55 46M34 57l6 15 7-15"/>'],
   guardMark:['<ellipse cx="40" cy="42" rx="32" ry="22"/><path d="M15 21Q40 7 65 21M15 64Q40 76 65 64"/>','<path d="M8 45Q25 12 66 23L56 9M71 36Q56 67 15 57L25 71M23 38Q40 23 56 40"/>','<path d="M40 7Q75 10 73 41Q69 75 35 71Q6 67 8 37Q10 13 36 16Q60 18 61 40Q59 58 40 57Q24 54 27 39"/>']},
  ravenclaw:{element:'water',color:'#7dd3fc',attacks:['Tidal Sweep','Ripple Dart','Maelstrom Dive'],defenses:['Bubble Guard','Flowing Veil','Undertow Roll'],
   travel:[[-8,20,-10,7],[-20,-16,8,12],[-55,18,-20,9]],guard:[[0,-5,0,1.12,1.04],[-13,6,-12,.9,1.08],[12,9,20,1.04,.92]],
   strike:['<path d="M8 61Q26 51 27 31Q29 9 53 14Q69 20 60 34Q49 43 43 29Q38 47 71 61Z"/>','<path d="M12 58Q5 46 21 25Q37 44 27 55ZM33 40Q29 27 45 8Q60 26 50 37ZM51 65Q44 53 62 32Q77 51 68 62Z"/>','<path d="M11 29Q26 1 54 13Q80 24 65 52Q49 78 22 63Q0 48 23 31Q44 18 53 39Q56 57 36 53M42 36l-2 10"/>'],
   guardMark:['<circle cx="40" cy="40" r="31"/><path d="M19 37Q19 19 37 17M55 60l6-7"/><circle cx="62" cy="16" r="6"/>','<path d="M12 63Q3 33 25 13Q14 39 34 62M37 69Q21 32 47 8Q36 40 57 65M63 68Q49 40 69 24"/>','<path d="M63 13Q25 0 12 35Q1 64 37 70Q61 72 70 46Q48 67 32 46Q20 27 43 20M56 11l9 4-3 12"/>']}
 };
 for(const p of Object.values(presets)){for(const key of ['attacks','defenses','travel','guard','strike','guardMark']){p[key].forEach(v=>{if(Array.isArray(v))Object.freeze(v);});Object.freeze(p[key]);}Object.freeze(p);}Object.freeze(presets);
 function approach(id,v,dx,dy,impact,base=''){
  const p=presets[id], [lift,sway,turn,windup]=p.travel[v],d=Math.sign(dx)||1,duration=impact+340;
  const len=Math.hypot(dx,dy)||1,sideX=-dy/len*sway,sideY=dx/len*sway;
  const t=(x,y,r=0,scale=1)=>`${base} translate(${x}px,${y}px) rotate(${r}deg) scale(${scale})`;
  return {duration,frames:[{transform:t(0,0),offset:0},{transform:t(-d*windup,4,-turn*d*.4,.96),offset:.12},{transform:t(dx*.72+sideX,dy*.72+sideY+lift,turn*d),offset:(impact-100)/duration},{transform:t(dx,dy,-turn*d*.2,1.04),offset:impact/duration},{transform:t(dx*.8,dy*.8+lift*.15,turn*d*.12),offset:(impact+100)/duration},{transform:t(0,0),offset:1}].map(f=>({...f,easing:'cubic-bezier(.2,.72,.24,1)'}))};
 }
 function defense(id,v){const [x,y,turn,sx,sy]=presets[id].guard[v];return {duration:460,frames:[{transform:'none',offset:0},{transform:`translate(${x}px,${y}px) rotate(${turn}deg) scale(${sx},${sy})`,offset:.35},{transform:`translate(${-x*.25}px,${y*.3}px) rotate(${-turn*.25}deg)`,offset:.7},{transform:'none',offset:1}]};}
 function mark(id,kind,v){const p=presets[id];return `<svg viewBox="0 0 80 80" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${(kind==='guard'?p.guardMark:p.strike)[v]}</svg>`;}
 root.ArenaTechniques=Object.freeze({presets,approach,defense,mark});
})(window);
