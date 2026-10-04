(function(root){
  'use strict';
  const bosses=[
    ['veyr','Veyr','The Gatekeeper','An obsidian sentinel with an owl-shaped helm and an amber keyhole at its heart.','#f3bb63','Amber shockwave'],
    ['tickthorn','Tickthorn','The Clockwork Sentinel','A bronze mechanical raven, with gear-plated wings and a turquoise clockwork core.','#75d6d3','Gear spiral'],
    ['mirrath','Mirrath','The Glass Serpent','An amethyst cobra with translucent fins and overlapping blades of crystal.','#c5a0ff','Crystal lance'],
    ['rootmaw','Rootmaw','The Thorn Colossus','An ancient giant of stone and roots, crowned with branching antlers and moss.','#94ca7e','Thorn wave'],
    ['vox','Vox','The Signal Phantom','A silent armoured wraith, held together by cyan light and floating fragments.','#73e1ed','Signal pulse'],
    ['kaelis','Kaelis','The Storm Talon','A silver-blue gryphon with a lightning core and sharp, sweeping wings.','#9dd9ff','Lightning arc'],
    ['morrow','Morrow','The Tide Warden','A plated dragon-tortoise with sea-green scales, silver horns and an immense shell.','#65d8c0','Tidal ring'],
    ['noctryn','Noctryn','The Veil Stag','A midnight stag carrying moonstone crystals between branching silver antlers.','#c1b4fa','Moon shard'],
    ['ferron','Ferron','The Runeforged Titan','An iron and copper golem with heavy square fists and an amber furnace core.','#ffc27e','Forge burst'],
    ['astrax','Astrax','The Eclipse Dragon','A midnight dragon with star-filled wings, silver horns and an eclipse at its chest.','#ceadfa','Eclipse wave']
  ].map((a,i)=>({id:a[0],name:a[1],title:a[2],description:a[3],color:a[4],attack:a[5],island:i+1,asset:`assets/bosses/${a[0]}.webp`}));
  const api={bosses,get:island=>bosses[Math.max(0,Math.min(9,island-1))]};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RunnerBosses=api;
})(typeof globalThis!=='undefined'?globalThis:this);
