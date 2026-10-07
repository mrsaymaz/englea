/* One central exchange plus finite, targeted peripheral strikes. */
(function(root){
    'use strict';
    const motion=LeagueMotion.channel('arena',10),clock=SceneRuntime.create('arena-motion',{pause:stop}),locked=new Set();let centerBusy=false,geometry=null;
    const shell=id=>document.getElementById(`battle-shell-${id}`),pose=id=>shell(id)?.querySelector('.battle-avatar-pose'),layer=()=>document.getElementById('arena-motion-layer');
    const active=()=>LeagueMotion.allowed()&&document.body.classList.contains('battle-active');
    const turns={attack:{},guard:{}};
    const next=(id,kind)=>{const v=turns[kind][id]||0;turns[kind][id]=(v+1)%3;return v;};
    function point(el){const a=document.getElementById('battle-arena')?.getBoundingClientRect(),r=el?.getBoundingClientRect();return a&&r?{x:r.x+r.width/2-a.x,y:r.y+r.height/2-a.y}:null;}
    function cache(){const r=document.getElementById('battle-arena')?.getBoundingClientRect();if(!r||r.width<100)return null;return geometry={width:r.width,height:r.height,center:{x:r.width*.5,y:r.height*.52}};}
    function effect(id,kind,color,heavy=false,sourceId=id,variant=0){
        if(!active())return;const p=point(pose(id)||shell(id));if(!p)return;
        const el=document.createElement('span');el.className=`arena-mark arena-${kind} arena-element-${LeagueMotion.profiles[sourceId]?.element||'air'}`;el.dataset.target=id;
        el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.color=color;
        const preset=ArenaTechniques.presets[sourceId];
        if(preset&&(kind==='strike'||kind==='guard')){
            el.classList.add('arena-technique');el.innerHTML=ArenaTechniques.mark(sourceId,kind,variant);
            el.style.color=preset.color;el.dataset.technique=(kind==='guard'?preset.defenses:preset.attacks)[variant];
        }
        motion.effect(layer(),el,[{opacity:0,transform:'translate(-50%,-50%) rotate(-18deg) scale(.55)'},{opacity:.9,transform:`translate(-50%,-50%) rotate(0) scale(${heavy?1.25:1})`,offset:.3},{opacity:0,transform:'translate(-50%,-50%) rotate(15deg) scale(1.35)'}],kind==='guard'?LeagueMotion.timing.guard:330);
    }
    function bolt(from,to,color,duration=240){
        if(!active())return;const a=point(pose(from)),b=point(pose(to));if(!a||!b)return;
        const dx=b.x-a.x,dy=b.y-a.y,angle=Math.atan2(dy,dx)*180/Math.PI,el=document.createElement('span');el.className='arena-bolt';el.dataset.target=to;el.style.left=`${a.x}px`;el.style.top=`${a.y}px`;el.style.color=color;
        motion.effect(layer(),el,[{opacity:0,transform:`rotate(${angle}deg) scaleX(.4)`},{opacity:.9,offset:.15},{opacity:.9,transform:`translate(${dx}px,${dy}px) rotate(${angle}deg)`}],duration);
    }
    function face(id,direction){const el=shell(id)?.querySelector('.battle-avatar-face');if(el)el.style.transform=`scaleX(${direction})`;}
    function reaction(id,kind='hit',color='#fff'){root.CreaturePoses?.arena(id,kind);if(!active())return;const variant=kind==='guard'?next(id,'guard'):0;const spec=kind==='guard'&&ArenaTechniques.presets[id]?ArenaTechniques.defense(id,variant):LeagueMotion.pose(id,kind);motion.play(pose(id),`pose-${id}`,spec.frames,{duration:spec.duration});if(kind==='guard')effect(id,'guard',color,false,id,variant);}
    const shots=new Map();
    function launch(attacker,target,variant,duration,large){
        if(!active()||!attacker.alive||!target.alive)return;
        const shot=CombatProjectiles.flight({from:pose(attacker.id),to:pose(target.id),bounds:document.getElementById('battle-arena'),team:attacker.id,variant,duration,large,emit:(el,frames,ms)=>motion.effect(layer(),el,frames,ms)});
        const key=attacker.id+':'+target.id;shots.set(key,shot);
        clock.after(()=>{if(shots.get(key)===shot)shots.delete(key);},duration+100);
    }
    function resolve(targetId,sourceId,outcome){
        const key=sourceId+':'+targetId,shot=shots.get(key);if(shot){CombatProjectiles.resolve(shot,outcome,(el,frames,ms)=>motion.effect(layer(),el,frames,ms));shots.delete(key);}
        if(outcome==='evaded'){root.CreaturePoses?.arena(targetId,'jump');const p=pose(targetId);motion.play(p,`pose-${targetId}`,[{transform:'none'},{transform:'translate(35px,-15px) rotate(8deg)',offset:.4},{transform:'none'}],{duration:420});}
    }
    function extraTarget(attacker,target,impact){const variant=((turns.attack[attacker.id]||0)+2)%3;clock.after(()=>launch(attacker,target,variant,impact-120,true),120);}
    function attack(attacker,target,{impact=420,signature=false}={}){
        if(!attacker?.alive||!target?.alive)return;
        root.CreaturePoses?.arena(attacker.id,'attack',impact);
        if(!active())return;
        const a=shell(attacker.id),b=shell(target.id),start=point(a),end=point(b);if(!a||!b||!start||!end)return;
        const variant=next(attacker.id,'attack'),dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy)||1;
        const spec=ArenaTechniques.approach(attacker.id,variant,dx/length*20,dy/length*20,impact,'translateX(-50%)');
        motion.play(a,`travel-${attacker.id}`,spec.frames,{duration:spec.duration,easing:'linear'});
        const targetCard=b.closest('.battle-fighter');targetCard.classList.add('is-targeted');
        a.dataset.arenaTarget=target.id;
        clock.after(()=>launch(attacker,target,variant,impact-120,signature),120);
        clock.after(()=>{targetCard.classList.remove('is-targeted');delete a.dataset.arenaTarget;},impact+160);
    }
    function impact(target,color,options={}){if(!target)return;if(options.attackerId)resolve(target.id,options.attackerId,options.blocked?'blocked':options.defended?'partial':'hit');const kind=options.blocked||options.defended?'guard':options.heal?'charge':'hit';reaction(target.id,kind,kind==='guard'?target.color:color);if(kind!=='guard')effect(target.id,options.heal?'heal':'impact',color,options.critical);}
    function stop(){root.CreaturePoses?.clear(document.getElementById('battle-overlay'));shots.clear();clock.clear();motion.clear();locked.clear();centerBusy=false;geometry=null;document.querySelectorAll('.battle-avatar-shell').forEach(el=>{delete el.dataset.arenaTarget;const face=el.querySelector('.battle-avatar-face');if(face)face.style.transform='';el.closest('.battle-fighter').style.zIndex='';el.closest('.battle-fighter').classList.remove('is-targeted');});layer()?.replaceChildren();}
    addEventListener('resize',()=>{if(document.body.classList.contains('battle-active')){stop();cache();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{if(e.matches)stop();});
    root.ArenaMotion={attack,extraTarget,resolve,impact,reaction,effect,stop,cache,diagnostics:()=>({...motion.diagnostics(),timers:clock.tasks.size,centerBusy})};
})(window);
