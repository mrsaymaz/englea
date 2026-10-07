/* v7.0: bounded, finite presentation. Game code alone changes HP and raid state. */
(function(scope){
    'use strict';
    const actors=new Map(),effects=new Set(),turns={attack:{},guard:{}},variants={},shots=new Map();
    const next=(id,kind)=>{const v=turns[kind][id]||0;turns[kind][id]=(v+1)%3;return v;};
    // v11.0.0: a fused pair (Merge Spell) strikes with its two houses' techniques in turn.
    const FUSED={slyffindor:['gryffindor','slytherin'],huffleclaw:['hufflepuff','ravenclaw']},techOf={};
    const tech=id=>FUSED[id]?(techOf[id]||FUSED[id][0]):id;
    const nextTech=id=>{if(!FUSED[id])return id;techOf[id]=FUSED[id][(FUSED[id].indexOf(techOf[id])+1)%2]||FUSED[id][0];return techOf[id];};
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const allowed=()=>!preference.matches&&!document.hidden&&!SceneRuntime.paused&&!SceneRuntime.fastForwarding&&document.body.classList.contains('vixar-raid-active');
    function node(id){
        if(id==='boss')return document.getElementById(document.body.classList.contains('performance-animated')?'vixar-animated-actor':'vixar-boss-svg');
        if(id==='guardian')return document.getElementById('vixar-unity-guardian-svg');
        const shell=document.getElementById(`vixar-avatar-shell-${id}`);
        return shell?.querySelector('.raid-travel')||shell?.querySelector('.animated-avatar')||shell?.querySelector('svg');
    }
    function stop(){
        scope.CreaturePoses?.clear(document.getElementById('vixar-raid-overlay'));
        shots.clear();
        for(const {animation,el} of actors.values()){
            animation.cancel();delete el.dataset.raidMotion;delete el.dataset.raidTarget;
        }
        actors.clear();
        for(const entry of effects){entry.animation.cancel();entry.element.remove();}
        effects.clear();
        document.getElementById('raid-motion-layer')?.replaceChildren();
        document.querySelectorAll('.raid-targeted').forEach(el=>el.classList.remove('raid-targeted'));
    }
    function move(id,kind,target=null,options={}){
        scope.CreaturePoses?.raid(id,kind,options.impact);
        if(!allowed())return;
        const travel=node(id),pose=['guard','hit','cast'].includes(kind)&&travel?.querySelector('.raid-pose');
        const el=pose||travel;if(!el?.animate)return;const key=pose?`${id}-pose`:id;
        const old=actors.get(key);
        // Incoming recoil cannot erase a visible attack; knockout always interrupts it.
        if(old&&(kind==='hit'||kind==='cast')&&old.kind==='attack')return;
        old?.animation.cancel();
        const boss=id==='boss',guardian=id==='guardian';
        const origin=boss?document.getElementById('vixar-boss-stage'):guardian?document.getElementById('vixar-guardian-host'):document.getElementById(`vixar-avatar-shell-${id}`);
        target=target||document.getElementById('vixar-boss-stage');
        const a=origin.getBoundingClientRect(),b=target.getBoundingClientRect();
        const vx=b.x+b.width/2-a.x-a.width/2,vy=b.y+b.height/2-a.y-a.height/2;
        const distance=Math.hypot(vx,vy)||1;
        const approach=Math.min(distance*.45,boss?32:guardian?100:160);
        const dx=vx/distance*approach,dy=vy/distance*approach;
        const tilt=id==='slytherin'?Math.sign(dx)*8:id==='gryffindor'?Math.sign(dx)*-5:0;
        let frames,duration;
        if(kind==='attack'){
            const t=nextTech(id),v=ArenaTechniques.presets[t]?next(id,'attack'):0;variants[id]=v;
            const spec=ArenaTechniques.presets[t]?ArenaTechniques.approach(t,v,dx*.15,dy*.15,options.impact||520):LeagueMotion.approach(id,dx,dy,options.impact||520);duration=spec.duration;frames=spec.frames;
        }else if(kind==='guard'){
            const t=tech(id),v=ArenaTechniques.presets[t]?next(id,'guard'):0;
            const spec=ArenaTechniques.presets[t]?ArenaTechniques.defense(t,v):LeagueMotion.pose(id,'guard',-Math.sign(dx||1));
            if(ArenaTechniques.presets[t]){const markNode=mark(origin,'raid-element-guard',ArenaTechniques.presets[t].color);markNode.innerHTML=ArenaTechniques.mark(t,'guard',v);markNode.dataset.technique=ArenaTechniques.presets[t].defenses[v];effect(markNode,[{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:1,offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(1.2)'}],460);}duration=spec.duration;frames=spec.frames;
        }else if(kind==='hit'){
            const spec=LeagueMotion.pose(id,'hit',-Math.sign(dx||1));duration=spec.duration;frames=spec.frames;
        }else if(kind==='knockout'){
            duration=650;frames=[{transform:'none'},{transform:`translateY(22px) rotate(${Math.sign(dx||1)*-12}deg) scale(.85)`,offset:.7},{transform:'translateY(10px) scale(.9)'}];
        }else if(kind==='revive'){
            duration=850;frames=[{transform:'translateY(18px) scale(.86)',opacity:.25},{transform:'translateY(-8px) scale(1.04)',opacity:1,offset:.65},{transform:'none',opacity:1}];
        }else if(kind==='arrive'){
            duration=1050;frames=[{transform:'translateY(24px) scale(.25)',opacity:0},{transform:'translateY(-7px) scale(1.04)',opacity:1,offset:.72},{transform:'none',opacity:1}];
        }else if(kind==='ultimate'){
            duration=1250;frames=[{transform:'none'},{transform:'translateY(-12px) scale(.95)',offset:.55},{transform:'scale(1.09)',offset:.77},{transform:'none'}];
        }else{
            duration=650;frames=[{transform:'none'},{transform:'translateY(-12px) scale(1.035)',offset:.55},{transform:'none'}];
        }
        el.dataset.raidMotion=kind;el.dataset.raidTarget=target.id;
        if(kind==='attack')target.classList.add('raid-targeted');
        const animation=el.animate(frames,{duration,easing:kind==='attack'?'linear':'ease-in-out'});
        const entry={animation,kind,el};actors.set(key,entry);
        animation.finished.catch(()=>{}).then(()=>{
            if(actors.get(key)===entry){actors.delete(key);delete el.dataset.raidMotion;delete el.dataset.raidTarget;}
            if(kind==='attack')target.classList.remove('raid-targeted');
        });
    }
    function center(el){
        const a=document.getElementById('vixar-raid-arena').getBoundingClientRect(),r=el.getBoundingClientRect();
        return {x:r.x+r.width/2-a.x,y:r.y+r.height/2-a.y};
    }
    function effect(element,frames,duration){
        if(!allowed()||effects.size>=LeaguePerformance.limit(12))return;
        const layer=document.getElementById('raid-motion-layer');if(!layer)return;
        layer.appendChild(element);
        const animation=element.animate(frames,{duration,easing:'ease-out'});
        const entry={element,animation};effects.add(entry);
        animation.finished.catch(()=>{}).then(()=>{element.remove();effects.delete(entry);});
        return animation;
    }
    function mark(target,className,color){
        const p=center(target),el=document.createElement('span');
        el.className=`raid-small-fx ${className}`;
        el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.color=color;
        return el;
    }
    function ring(target,color='#c4b5fd',shield=false){
        if(!allowed()||!target)return;
        const el=mark(target,shield?'raid-block':'raid-impact',color);
        if(shield){const id=target.closest('[data-team]')?.dataset.team;el.classList.add(`raid-defense-${LeagueMotion.profiles[id]?.element||'void'}`);}
        effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.65)'},{opacity:.95,transform:'translate(-50%,-50%) scale(1)',offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}],shield?500:330);
    }
    function bolt(from,to,color='#c4b5fd',duration=430){
        if(!allowed()||!from||!to)return;
        const owner=from.closest('[data-team]')?.dataset.team,team=tech(owner);
        if(ArenaTechniques.presets[team]){const shot=CombatProjectiles.flight({from,to,bounds:document.getElementById('vixar-raid-arena'),team,variant:variants[owner]||0,duration,emit:effect});const key=owner+':'+to.id;shots.set(key,shot);shot.animation?.finished.catch(()=>{}).then(()=>{if(shots.get(key)===shot)shots.delete(key);});return shot;}
        const a=center(from),b=center(to),el=mark(from,'raid-bolt',color);
        const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        el.dataset.target=to.id;
        effect(el,[{opacity:0,transform:`translate(0,0) rotate(${angle}deg)`},{opacity:1,offset:.12},{opacity:.9,transform:`translate(${b.x-a.x}px,${b.y-a.y}px) rotate(${angle}deg)`}],duration);
    }
    // One small SVG per projectile; only its wrapper moves. No particles or filters.
    const bossGlyphs={
        spear:'<path d="M2 32 43 21 62 32 43 43Z" fill="currentColor"/><path d="M12 32H51" stroke="#fff" stroke-width="3"/>',
        shard:'<path d="M7 17 30 25 54 12 60 32 54 52 30 39 7 47 17 32Z" fill="currentColor"/><path d="m32 32 20-12-7 12 7 12Z" fill="#fff"/>',
        orb:'<circle cx="32" cy="32" r="17" fill="#24103f" stroke="currentColor" stroke-width="5"/><ellipse cx="32" cy="32" rx="29" ry="10" fill="none" stroke="#f5d0fe" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#fff"/>',
        crescent:'<path d="M15 5Q65 32 15 59Q40 32 15 5Z" fill="currentColor"/><path d="M26 12Q51 32 26 52" fill="none" stroke="#fff" stroke-width="3"/>',
        chain:'<g fill="none" stroke="currentColor" stroke-width="5"><ellipse cx="17" cy="32" rx="13" ry="8"/><ellipse cx="45" cy="32" rx="13" ry="8"/></g><path d="M22 32H40" stroke="#fff" stroke-width="3"/>',
        unity:'<path d="m32 2 9 20 21 10-21 10-9 20-9-20L2 32l21-10Z" fill="currentColor"/><circle cx="32" cy="32" r="8" fill="#fff"/>'
    };
    function bossShot(from,to,attack='',duration=420){
        if(!allowed()||!from||!to)return;
        const kind=attack==='UNITY'?'unity':attack.includes('CROWNFALL')?'shard':/GRAVITY|SILENCE|FINAL BLAST/.test(attack)?'orb':/SWEEP|REND/.test(attack)?'crescent':/SEPARATED|INVERTED/.test(attack)?'chain':'spear';
        const color=kind==='unity'?'#fde68a':kind==='crescent'?'#f0abfc':kind==='shard'?'#e9d5ff':'#c4b5fd';
        const a=center(from),b=center(to),el=mark(from,'raid-boss-shot',color);
        const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        el.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${bossGlyphs[kind]}</svg>`;
        el.dataset.projectile=kind;el.dataset.target=to.id;
        if(attack==='FINAL BLAST')el.classList.add('raid-final-shot');
        const transform=(x,y,scale)=>`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${angle}deg) scale(${scale})`;
        effect(el,[{opacity:0,transform:transform(0,0,.65)},{opacity:1,offset:.12},{opacity:1,transform:transform(b.x-a.x,b.y-a.y,1)}],duration);
    }
    function claw(target,side=0){
        if(!allowed()||!target)return;
        const el=mark(target,'raid-guardian-claw','#fde68a');
        el.dataset.claw=String(side);
        // Three curved talon cuts form each of the two broad diagonal swipes.
        el.innerHTML='<svg viewBox="0 0 240 160" aria-hidden="true"><g fill="currentColor"><path d="M4 26Q107 4 237 118Q105 47 4 26Z"/><path d="M3 61Q111 29 230 143Q108 75 3 61Z"/><path d="M11 98Q103 60 202 158Q103 114 11 98Z"/></g><path d="M14 28Q120 29 222 109M16 61Q117 54 216 131M24 96Q116 88 189 146" fill="none" stroke="#fffbea" stroke-width="3"/></svg>';
        const angle=side?-66:12;
        const t=(x,s)=>`translate(-50%,-50%) translateX(${x}px) rotate(${angle}deg) scale(${s})`;
        effect(el,[{opacity:0,transform:t(side?48:-48,.55)},{opacity:1,transform:t(0,1),offset:.22},{opacity:.9,offset:.6},{opacity:0,transform:t(side?-14:14,1.08)}],780);
    }
    function resolve(team,outcome){for(const [key,shot] of shots)if(key.startsWith(team+':')){CombatProjectiles.resolve(shot,outcome,effect);shots.delete(key);}}
    function stream(from,to,color,duration=1900,strong=false){
        if(!allowed()||!from||!to)return;
        const a=center(from),b=center(to),el=mark(from,`raid-stream${strong?' raid-stream-strong':''}`,color),angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        el.style.width=`${Math.hypot(b.x-a.x,b.y-a.y)}px`;el.dataset.target=to.id;
        effect(el,[{opacity:0,transform:`rotate(${angle}deg) scaleX(.02)`},{opacity:.95,transform:`rotate(${angle}deg) scaleX(1)`,offset:.24},{opacity:.75,offset:.75},{opacity:0,transform:`rotate(${angle}deg) scaleX(1)`}],Math.min(duration,2100));
    }
    function wave(target,color='#c4b5fd',duration=700,inward=false){
        if(!allowed()||!target)return;
        const el=mark(target,'raid-wave',color),large=Math.min(4,innerWidth/170);
        effect(el,[{opacity:inward?0:.9,transform:`translate(-50%,-50%) scale(${inward?large:.2})`},{opacity:.8,offset:.25},{opacity:0,transform:`translate(-50%,-50%) scale(${inward?.25:large})`}],duration);
    }
    function strike(target,color,owner){
        if(!allowed()||!target)return;const team=tech(owner);
        const count=team==='gryffindor'||team==='guardian'?2:1;
        for(let i=0;i<count;i++){
            const kind=team==='hufflepuff'?'air':team==='ravenclaw'?'water':team==='slytherin'?'nature':'claw';
            const el=mark(target,`raid-strike raid-strike-${kind}`,color),angle=i?45:-40;
            effect(el,[{opacity:0,transform:`translate(-50%,-50%) rotate(${angle}deg) scale(.35)`},{opacity:1,transform:`translate(-50%,-50%) rotate(${angle}deg) scale(1)`,offset:.3},{opacity:0,transform:`translate(-50%,-50%) rotate(${angle+18}deg) scale(1.3)`}],450);
        }
    }
    function core(target){if(!allowed()||!target)return;const el=mark(target,'raid-unity-core','#fff7c2');effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.25)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.25)',offset:.6},{opacity:0,transform:'translate(-50%,-50%) scale(.65)'}],800);}
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    preference.addEventListener?.('change',event=>{if(event.matches)stop();});
    addEventListener('pagehide',stop);
    scope.RaidMotion={node,move,ring,resolve,bolt,bossShot,claw,stream,wave,strike,core,stop,diagnostics:()=>({actors:actors.size,effects:effects.size})};
})(window);
