/* Deterministic skilled test player. No score, health, timing or coin mutation. */
function drive(r,style='collector'){
  if(!r.canControl())return;
  if(r.phase==='boss'){
    if(['warn','strike'].includes(r.boss.state))r.setLane([0,1,2].find(l=>!r.boss.lanes.includes(l)));
    if(r.boss.state==='expose')r.setLane(r.boss.weakLane);
    return;
  }
  let wanted=r.lane;const coin=r.objects.find(o=>!o.done&&o.type==='coin'&&o.at>r.runnerDistance);
  if(style==='collector'&&coin)wanted=coin.lane;
  if(r.gate&&r.gate.duration-r.gate.age<1){
    // Tests may ask the bot to miss chosen questions (by original index) to exercise review and second chances.
    const miss=r.botMiss&&!r.gate.echo&&r.botMiss.includes(r.gate.index);wanted=miss?(r.gate.q.answer+1)%3:r.gate.q.answer;
  }
  const step=r.trail&&!r.trail.done?r.trail.steps[r.trail.index]:null;
  if(step&&step.at-r.runnerDistance<r.speed*.9){const miss=r.botTrailMiss&&r.botTrailMiss.includes(step.index);wanted=miss?(step.lane+1)%3:step.lane;}
  const m=r.mechanic;
  if(m&&!m.resolved&&['rune','wind','sequence'].includes(m.rule)&&m.at-r.runnerDistance<r.normalSpeed*.7)wanted=m.lane;
  const inPath=o=>o.lane>=Math.min(wanted,Math.round(r.lanePos))&&o.lane<=Math.max(wanted,Math.round(r.lanePos));
  const close=r.objects.some(o=>!o.done&&!o.hit&&o.type==='obstacle'&&inPath(o)&&o.at-r.runnerDistance>=-24&&o.at-r.runnerDistance<r.speed*.2+18);
  if(!close||r.jumpHeight>.45)r.setLane(wanted);
  const hazard=r.objects.find(o=>!o.done&&!o.hit&&o.type==='obstacle'&&(o.lane===r.lane||inPath(o))&&o.at-r.runnerDistance>=-18&&o.at-r.runnerDistance<r.normalSpeed*.42+30);
  const special=m&&!m.resolved&&!['rune','wind','sequence'].includes(m.rule)&&m.lanes.some(l=>inPath({lane:l}))&&m.at-r.runnerDistance>=-18&&m.at-r.runnerDistance<r.normalSpeed*.42+30;
  if((hazard||special)&&r.jumpAge<0)r.jump();
}
function simulate(r,style='collector',fps=60){let ticks=0;while(r.status==='running'&&ticks++<fps*360){drive(r,style);r.step(1/fps);r.drain();}return r;}
module.exports={drive,simulate};
