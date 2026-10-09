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
        if(id==='boss')return document.getElementById(document.body.classList.contains('performance-animated')||document.getElementById('vixar-raid-overlay')?.classList.contains('saga-form-art')?'vixar-animated-actor':'vixar-boss-svg');
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
        if(!allowed())return;
        const travel=node(id),pose=['guard','hit','cast'].includes(kind)&&travel?.querySelector('.raid-pose');
        const el=pose||travel;if(!el?.animate)return;const key=pose?`${id}-pose`:id;
        const old=actors.get(key);
        // Incoming recoil cannot erase a visible attack; knockout always interrupts it.
        if(old&&(kind==='hit'||kind==='cast')&&old.kind==='attack'&&SceneRuntime.now()-old.started<420)return;
        // A volley is one casting gesture, not four competing lunges. Defeat/ultimate always win.
        if(id==='boss'&&old){
            if(['knockout','ultimate'].includes(old.kind)&&!['knockout','ultimate'].includes(kind))return;
            if(old.kind==='attack'&&kind==='attack'&&SceneRuntime.now()-old.started<420)return;
        }
        scope.CreaturePoses?.raid(id,kind,options.impact,options);
        old?.animation.cancel();
        const boss=id==='boss',guardian=id==='guardian';
        const origin=boss?document.getElementById('vixar-boss-stage'):guardian?document.getElementById('vixar-guardian-host'):document.getElementById(`vixar-avatar-shell-${id}`);
        target=target||document.getElementById('vixar-boss-stage');
        if(!origin||!target)return;
        const a=origin.getBoundingClientRect(),b=target.getBoundingClientRect();
        const vx=b.x+b.width/2-a.x-a.width/2,vy=b.y+b.height/2-a.y-a.height/2;
        const distance=Math.hypot(vx,vy)||1;
        const approach=Math.min(distance*.45,boss?32:guardian?100:160);
        const dx=vx/distance*approach,dy=vy/distance*approach;
        const tilt=id==='slytherin'?Math.sign(dx)*8:id==='gryffindor'?Math.sign(dx)*-5:0;
        let frames,duration;
        if(boss&&['attack','cast','guard','hit','ultimate'].includes(kind)){
            const spec=bossMovement(kind,dx,dy,options);duration=spec.duration;frames=spec.frames;
        }else if(kind==='attack'){
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
        const entry={animation,kind,el,target,started:SceneRuntime.now()};actors.set(key,entry);
        animation.finished.catch(()=>{}).then(()=>{
            if(actors.get(key)===entry){actors.delete(key);delete el.dataset.raidMotion;delete el.dataset.raidTarget;}
            if(kind==='attack'&&![...actors.values()].some(a=>a.kind==='attack'&&a.target===target))target.classList.remove('raid-targeted');
        });
    }
    function center(el){
        const a=document.getElementById('vixar-raid-arena').getBoundingClientRect(),r=el.getBoundingClientRect();
        return {x:r.x+r.width/2-a.x,y:r.y+r.height/2-a.y};
    }
    function effect(element,frames,duration,easing='ease-out'){
        if(!allowed()||effects.size>=LeaguePerformance.limit(12))return;
        const layer=document.getElementById('raid-motion-layer');if(!layer)return;
        layer.appendChild(element);
        const animation=element.animate(frames,{duration,easing});
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
    // Form identity comes from the visible art; these functions never inspect or change raid HP.
    function bossStyle(){
        const id=document.getElementById('vixar-animated-actor')?.dataset.poseId||'vixar';
        return id==='vixar-scarlet'?{form:'scarlet',color:'#fb7185',core:'#fff1d6',dark:'#67142f'}:
            id==='vixar-gilded'?{form:'gilded',color:'#facc65',core:'#fffced',dark:'#604727'}:
            {form:'violet',color:'#c4b5fd',core:'#f5edff',dark:'#24103f'};
    }
    function bossMovement(kind,dx,dy,options={}){
        const {form}=bossStyle(),scarlet=form==='scarlet',gilded=form==='gilded';
        const sign=Math.sign(dx)||1,reach=scarlet?1.1:gilded?.48:.7;
        const t=(x=0,y=0,r=0,s=1)=>`translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
        let duration=650,frames;
        if(kind==='attack'){
            duration=700;
            frames=[{transform:t()},{transform:t(-dx*.16,-4,-sign*(scarlet?3:1),.98),offset:.13},
                {transform:t(dx*reach,dy*reach,sign*(scarlet?5:1.5),1.025),offset:.48},
                {transform:t(dx*reach*.7,dy*reach*.7,sign,1.01),offset:.6},{transform:t()}];
        }else if(kind==='cast'){
            duration=Math.max(300,options.duration||900);
            frames=[{transform:t()},{transform:t(0,scarlet?-9:gilded?-6:-12,scarlet?-2:0,1.025),offset:.25},
                {transform:t(0,scarlet?-9:gilded?-6:-12,scarlet?-2:0,1.025),offset:.9},{transform:t()}];
        }else if(kind==='hit'){
            duration=310;frames=[{transform:t()},{transform:t(-sign*(gilded?5:9),3,-sign*(scarlet?4:1.5),.985),offset:.2},{transform:t()}];
        }else if(kind==='guard'){
            duration=800;frames=[{transform:t()},{transform:t(0,4,0,.975),offset:.16},{transform:t(0,4,0,.975),offset:.65},{transform:t()}];
        }else{
            duration=1320;frames=[{transform:t()},{transform:t(0,-15,0,.96),offset:.4},
                {transform:t(0,-15,0,.96),offset:.66},{transform:t(0,3,0,1.06),offset:.74},{transform:t()}];
        }
        return {duration,frames};
    }
    // One small SVG per projectile; only its wrapper moves. No particle loops or filters.
    const bossGlyphs={
        spear:'<path d="M2 32 43 21 62 32 43 43Z" fill="currentColor"/><path d="M12 32H51" stroke="#fff" stroke-width="3"/>',
        shard:'<path d="M7 17 30 25 54 12 60 32 54 52 30 39 7 47 17 32Z" fill="currentColor"/><path d="m32 32 20-12-7 12 7 12Z" fill="#fff"/>',
        orb:'<circle cx="32" cy="32" r="17" fill="#24103f" stroke="currentColor" stroke-width="5"/><ellipse cx="32" cy="32" rx="29" ry="10" fill="none" stroke="#f5d0fe" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#fff"/>',
        crescent:'<path d="M15 5Q65 32 15 59Q40 32 15 5Z" fill="currentColor"/><path d="M26 12Q51 32 26 52" fill="none" stroke="#fff" stroke-width="3"/>',
        chain:'<g fill="none" stroke="currentColor" stroke-width="5"><ellipse cx="17" cy="32" rx="13" ry="8"/><ellipse cx="45" cy="32" rx="13" ry="8"/></g><path d="M22 32H40" stroke="#fff" stroke-width="3"/>',
        unity:'<path d="m32 2 9 20 21 10-21 10-9 20-9-20L2 32l21-10Z" fill="currentColor"/><circle cx="32" cy="32" r="8" fill="#fff"/>'
    };
    const scarletGlyphs={
        spear:'<path d="M2 22 20 27 13 12 42 24 62 32 42 40 13 52 20 37 2 42 9 32Z" fill="currentColor"/><path d="M18 32 48 28 58 32 48 36Z" fill="#fff1d6"/>',
        shard:'<path d="M5 12 28 22 25 3 58 26 63 33 44 49 17 59 25 41 4 46 15 31Z" fill="currentColor"/><path d="M30 29 53 32 29 41 37 33Z" fill="#fff1d6"/>',
        orb:'<path d="M9 16 28 21 39 3 44 23 62 31 46 41 42 61 27 45 7 49 16 33Z" fill="currentColor"/><circle cx="34" cy="32" r="12" fill="#67142f"/><path d="m29 25 13 7-13 7 4-7Z" fill="#fff1d6"/>',
        crescent:'<path d="M10 4Q72 25 22 61Q46 32 10 4M4 15Q46 28 11 52Q28 32 4 15Z" fill="currentColor"/><path d="M25 13Q52 31 30 49" fill="none" stroke="#fff1d6" stroke-width="3"/>',
        chain:'<g fill="none" stroke="currentColor" stroke-width="5"><path d="m4 32 13-12 17 12-17 12Zm26 0 17-12 13 12-13 12Z"/></g><path d="m23 22 5 10-5 10 16-10Z" fill="#fff1d6"/>'
    };
    const gildedGlyphs={
        spear:'<path d="M3 25 42 25 42 16 63 32 42 48 42 39 3 39 12 32Z" fill="currentColor"/><path d="M15 32H51" stroke="#fffced" stroke-width="4"/>',
        shard:'<path d="m32 4 29 28-29 28L3 32Z" fill="currentColor"/><path d="m32 13 19 19-19 19-9-19Z" fill="#fffced"/><path d="M32 4V60M3 32H61" stroke="#9b741e" stroke-width="2"/>',
        orb:'<path d="m18 7 29 0 15 25-15 25H18L3 32Z" fill="#604727" stroke="currentColor" stroke-width="4"/><path d="m32 15 17 17-17 17-17-17Z" fill="none" stroke="#fffced" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="#fffced"/>',
        crescent:'<path d="m16 3 24 10 21 19-21 19-24 10 17-29Z" fill="currentColor"/><path d="m28 12 23 20-23 20 11-20Z" fill="#fffced"/>',
        chain:'<g fill="none" stroke="currentColor" stroke-width="5"><path d="m3 25 12-8 15 8v14l-15 8-12-8Zm31 0 15-8 12 8v14l-12 8-15-8Z"/></g><path d="M22 32H42" stroke="#fffced" stroke-width="4"/>'
    };
    function projectileKind(attack){return attack==='UNITY'?'unity':attack.includes('CROWNFALL')?'shard':/GRAVITY|SILENCE|FINAL BLAST/.test(attack)?'orb':/SWEEP|REND/.test(attack)?'crescent':/SEPARATED|INVERTED/.test(attack)?'chain':attack==='SCARLET BRAND'?'brand':'spear';}
    function bossShot(from,to,attack='',duration=420){
        if(!allowed()||!from||!to)return;
        const kind=projectileKind(attack),style=bossStyle();
        const color=kind==='unity'?'#fde68a':style.color;
        const a=center(from),b=center(to),el=mark(from,'raid-boss-shot',color);
        const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        const glyph=kind==='brand'?'<path d="m32 3 25 29-25 29L7 32Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="m32 16 6 11 12 5-12 5-6 11-6-11-12-5 12-5Z" fill="#fff1d6"/>':
            (style.form==='scarlet'?scarletGlyphs:style.form==='gilded'?gildedGlyphs:bossGlyphs)[kind]||bossGlyphs[kind];
        el.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${glyph}</svg>`;
        el.dataset.projectile=kind;el.dataset.target=to.id;el.dataset.form=style.form;
        if(attack==='FINAL BLAST')el.classList.add('raid-final-shot');
        const transform=(x,y,scale)=>`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${angle}deg) scale(${scale})`;
        // 22% anticipation + 78% constant-speed flight; the arrival is still exactly the gameplay's 420 ms.
        const animation=effect(el,[{opacity:0,transform:transform(0,0,.45)},
            {opacity:1,transform:transform(0,0,.85),offset:.22},
            {opacity:1,transform:transform(b.x-a.x,b.y-a.y,1)}],duration,'linear');
        if(animation&&kind!=='unity'&&attack!=='FINAL BLAST')move('boss','attack',to,{impact:duration,releaseAt:duration*.22});
        return animation;
    }
    function bossImpact(target,attack='',outcome='hit'){
        if(!allowed()||!target)return;
        const style=bossStyle(),blocked=outcome==='blocked',kind=projectileKind(attack);
        const el=mark(target,`raid-boss-impact${blocked?' raid-boss-block':''}`,blocked?'#fff3b0':style.color);
        el.dataset.outcome=outcome;el.dataset.form=style.form;
        el.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${blocked?
            '<path d="M32 6 54 14V31Q53 48 32 59Q11 48 10 31V14Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="m22 31 8 8 15-17" fill="none" stroke="currentColor" stroke-width="4"/>':
            kind==='crescent'?'<path d="M4 12Q34 10 59 50Q30 25 4 12M6 30Q31 22 48 58Q25 37 6 30Z" fill="currentColor"/>':
            style.form==='gilded'?'<path d="m32 5 27 27-27 27L5 32Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 0V17M32 47V64M0 32H17M47 32H64" stroke="currentColor" stroke-width="4"/>':
            '<path d="m32 4 5 17 17-12-11 18 17 5-17 5 11 18-17-12-5 17-5-17-18 12 12-18-17-5 17-5L9 9l18 12Z" fill="none" stroke="currentColor" stroke-width="3"/>'}</svg>`;
        return effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},
            {opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},
            {opacity:0,transform:`translate(-50%,-50%) scale(${blocked?1.12:1.4})`}],blocked?440:340);
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
    document.addEventListener('league-pause-change',()=>{if(SceneRuntime.paused)stop();});
    document.addEventListener('league-scene-change',stop);
    preference.addEventListener?.('change',event=>{if(event.matches)stop();});
    addEventListener('pagehide',stop);
    scope.RaidMotion={node,move,ring,resolve,bolt,bossStyle,bossShot,bossImpact,claw,stream,wave,strike,core,stop,diagnostics:()=>({actors:actors.size,effects:effects.size})};
})(window);
