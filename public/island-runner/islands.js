/* One readable rule per island. Gameplay never depends on the chosen house. */
(function(root){
  'use strict';
  const modes={
    soft:{guards:5,speed:230,obstacleGap:770,bossWarning:1.5,bossWindow:2.3,bossRounds:6},
    hard:{guards:3,speed:295,obstacleGap:600,bossWarning:1.25,bossWindow:1.9,bossRounds:5}
  };
  const islands=[
    {id:1,mechanic:'lantern',name:'Lantern gates',hint:'Jump the amber gate.',color:'#f3bb63',shape:'barrier',rule:'jump'},
    {id:2,mechanic:'clockwork',name:'Clockwork cargo',hint:'Watch the gear change lanes, then dodge or jump.',color:'#75d6d3',shape:'gear',rule:'shift'},
    {id:3,mechanic:'mirror',name:'Crystal reflections',hint:'Follow the solid diamond. Hollow echoes are harmless.',color:'#c5a0ff',shape:'crystal',rule:'rune'},
    {id:4,mechanic:'roots',name:'Rising roots',hint:'Roots mark one lane. Move away or jump.',color:'#94ca7e',shape:'root',rule:'root'},
    {id:5,mechanic:'signal',name:'Signal crossing',hint:'Follow the green lane through the signal.',color:'#73e1ed',shape:'barrier',rule:'signal'},
    {id:6,mechanic:'wind',name:'Stormstream',hint:'Catch the silver wind for extra Focus.',color:'#9dd9ff',shape:'gear',rule:'wind'},
    {id:7,mechanic:'tide',name:'Tidal sweep',hint:'Jump the low wave as it reaches you.',color:'#65d8c0',shape:'wave',rule:'wave'},
    {id:8,mechanic:'moon',name:'Moonlit trail',hint:'Follow three moonstones to build Focus.',color:'#c1b4fa',shape:'crystal',rule:'sequence'},
    {id:9,mechanic:'forge',name:'Forge vents',hint:'Jump the paired vents in the marked lane.',color:'#ffc27e',shape:'vent',rule:'double'},
    {id:10,mechanic:'eclipse',name:'Eclipse passage',hint:'Two lanes darken. Find the clear lane or jump.',color:'#ceadfa',shape:'eclipse',rule:'eclipse'}
  ];
  const api={modes,islands,get:id=>islands[Math.max(0,Math.min(9,id-1))],focus:{answer:28,streak:6,duration:7,limit:100},questionPreview:1.6};
  Object.values(modes).forEach(Object.freeze);islands.forEach(Object.freeze);Object.freeze(api.focus);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerIslands=api;
})(typeof globalThis!=='undefined'?globalThis:this);
