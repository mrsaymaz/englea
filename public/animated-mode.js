/* English League 7.0. Visuals only: rewards and scores belong to the game. */
(function(scope){
    'use strict';
    const ids=['gryffindor','slytherin','hufflepuff','ravenclaw'];
    const colors={gryffindor:'#fb7185',slytherin:'#6ee7b7',hufflepuff:'#fcd34d',ravenclaw:'#7dd3fc'};
    const symbols={gryffindor:'🦁',slytherin:'🐍',hufflepuff:'🐻',ravenclaw:'🦅'};
    const durations=LeagueMotion.timing.chest;
    const held=new Map(),queue=new Map(),active=new Map(),images=new Map();
    let enabled=false,bridge=null,generation=0,pumpScheduled=false;
    const clock=SceneRuntime.create('evolution');
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp=level=>Math.max(0,Math.min(10,Math.floor(Number(level)||0)));
    const valid=id=>ids.includes(id);
    const source=(id,level)=>`./assets/animated/${id}-${clamp(level)}.webp?v=6.7`;
    function markup(id,level){
        if(!valid(id))return '';
        level=clamp(level);
        return `<span class="animated-avatar" data-avatar-team="${id}" data-avatar-level="${level}" role="img" aria-label="${id}, level ${level}"><img class="animated-sprite" src="${source(id,level)}" width="384" height="384" alt="" decoding="async" draggable="false"></span>`;
    }
    function preload(id,level){
        if(!enabled||!valid(id))return Promise.resolve();
        const url=source(id,level);
        if(images.has(url)){const entry=images.get(url);images.delete(url);images.set(url,entry);return entry.promise;}
        const img=new Image();
        const entry={img,promise:null};
        entry.promise=new Promise(resolve=>{
            img.onload=()=>{const decoded=typeof img.decode==='function'?img.decode():Promise.resolve();decoded.catch(()=>{}).then(resolve);};
            img.onerror=resolve;
        });
        img.src=url;images.set(url,entry);
        // Four current/next forms, not all forty-four decoded images.
        while(images.size>8)images.delete(images.keys().next().value);
        return entry.promise;
    }
    function warmNext(id,level){if(enabled&&level<10)preload(id,clamp(level)+1);}
    function wait(ms,job){
        if(job.cancelled)return Promise.resolve();
        return new Promise(resolve=>{
            const entry={timer:null,resolve};
            entry.timer=clock.after(()=>{job.waiters.delete(entry);resolve();},ms);
            job.waiters.add(entry);
        });
    }
    function motion(el,frames,options,job){
        if(!el||job.cancelled||reduced()||typeof el.animate!=='function')return Promise.resolve();
        const animation=el.animate(frames,{fill:'forwards',...options});job.animations.add(animation);
        return animation.finished.catch(()=>{});
    }
    const alive=job=>enabled&&!job.cancelled&&job.generation===generation;
    function render(id){if(bridge&&enabled)bridge.render(id);}
    function reveal(job){
        if(!alive(job))return;
        const container=document.getElementById(`mascot-${job.id}`);
        const old=container?.querySelector('.animated-avatar')?.cloneNode(true);
        held.set(job.id,job.to);render(job.id);
        if(!container||reduced()||!old)return;
        const next=container.querySelector('.animated-avatar');
        old.classList.add('animated-previous');old.setAttribute('aria-hidden','true');container.appendChild(old);job.ghost=old;
        motion(old,[{opacity:1},{opacity:0}],{duration:230,easing:'ease-out'},job).then(()=>{old.remove();if(job.ghost===old)job.ghost=null;});
        motion(next,[{opacity:0,transform:'translateY(3px) scale(.97)'},{opacity:1,transform:'translateY(-3px) scale(1.02)',offset:.65},{opacity:1,transform:'none'}],{duration:LeagueMotion.timing.reveal,easing:'ease-out'},job);
    }
    function chestMarkup(id){
        return `<div class="animated-chest-layer" aria-hidden="true" style="--animated-light:${colors[id]}"><div class="animated-arrival"></div><svg class="animated-ribbon" viewBox="0 0 200 200" focusable="false"><path d="M102 169C143 153 142 117 104 94" fill="none" stroke="${colors[id]}" stroke-width="6" stroke-linecap="round" opacity=".22"/><path d="M102 169C143 153 142 117 104 94" fill="none" stroke="#fff7da" stroke-width="2" stroke-linecap="round"/></svg><span class="animated-light-seed"></span><div class="animated-chest"><div class="animated-chest-glow"></div><div class="animated-chest-base"></div><div class="animated-chest-lid"></div><div class="animated-chest-lock"></div></div></div>`;
    }
    async function play(job){
        job.generation=generation;job.animations=new Set();job.waiters=new Set();job.cancelled=false;
        active.set(job.id,job);
        try{
            await Promise.race([preload(job.id,job.to),wait(1000,job)]);
            if(!alive(job))return;
            if(reduced()||document.hidden){held.set(job.id,job.to);render(job.id);return;}
            if(!job.milestone){reveal(job);await wait(360,job);return;}
            const area=document.querySelector(`#team-${job.id} .mascot-area`);
            if(!area){held.set(job.id,job.to);render(job.id);return;}
            const holder=document.createElement('div');holder.innerHTML=chestMarkup(job.id);
            const layer=holder.firstElementChild;job.layer=layer;area.appendChild(layer);
            layer.dataset.milestone=String(job.milestone);
            const chest=layer.querySelector('.animated-chest'),lid=layer.querySelector('.animated-chest-lid');
            const glow=layer.querySelector('.animated-chest-glow'),ribbon=layer.querySelector('.animated-ribbon');
            const seed=layer.querySelector('.animated-light-seed'),arrival=layer.querySelector('.animated-arrival');
            const total=durations[job.milestone],anticipation=total*.36,transfer=total*.32;
            motion(chest,[{opacity:0,transform:'translateY(5px) scale(.88)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.16},{opacity:1,transform:'translateX(-2px) rotate(-3deg)',offset:.46},{opacity:1,transform:'translateX(2px) rotate(3deg)',offset:.56},{opacity:1,transform:'translateX(-1px) rotate(-2deg)',offset:.75},{opacity:1,transform:'none'}],{duration:anticipation,fill:'forwards',easing:'ease-in-out'},job);
            // The underlying CSS keeps the chest visible after the entrance completes.
            motion(glow,[{opacity:0,transform:'scaleX(.3)'},{opacity:.85,transform:'scaleX(1)'}],{duration:anticipation,fill:'forwards'},job);
            await wait(anticipation,job);if(!alive(job))return;
            glow.style.opacity='.85';
            lid.style.transform='translateY(-10px) rotate(-17deg)';
            motion(lid,[{transform:'none'},{transform:'translateY(-10px) rotate(-17deg)'}],{duration:220,easing:'ease-out'},job);
            motion(ribbon,[{opacity:0},{opacity:.85,offset:.4},{opacity:.9,offset:.78},{opacity:0}],{duration:transfer+210,easing:'ease-out'},job);
            motion(seed,[{opacity:0,transform:'translate(0,0) scale(.6)'},{opacity:1,transform:'translate(15px,-11px) scale(1)',offset:.2},{opacity:1,transform:'translate(24px,-29px)',offset:.48},{opacity:1,transform:'translate(18px,-51px)',offset:.74},{opacity:0,transform:'translate(2px,-75px) scale(.45)'}],{duration:transfer,easing:'linear'},job);
            await wait(transfer,job);if(!alive(job))return;
            reveal(job);
            motion(arrival,[{opacity:0,transform:'scale(.6)'},{opacity:job.milestone === 10 ? .68 : .4,transform:'scale(1)',offset:.25},{opacity:0,transform:`scale(${job.milestone===10?1.4:1.13})`}],{duration:total*.27,easing:'ease-out'},job);
            motion(chest,[{opacity:1},{opacity:0,transform:'translateY(4px) scale(.94)'}],{duration:total*.25,easing:'ease-in'},job);
            await wait(total*.32,job);
        }finally{
            dispose(job);
            if(active.get(job.id)===job)active.delete(job.id);
            if(job.generation===generation&&!job.cancelled){
                if(!queue.has(job.id))held.delete(job.id);
                render(job.id);warmNext(job.id,bridge?.level(job.id)??job.to);
            }
            pump();
        }
    }
    function pump(){
        if(pumpScheduled||!enabled||document.hidden)return;
        pumpScheduled=true;
        queueMicrotask(()=>{
            pumpScheduled=false;
            if(!enabled||document.hidden||SceneRuntime.paused||bridge?.busy())return;
            if(LeagueScenes.active&&LeagueScenes.active!=='evolution')return;
            if(queue.size||active.size)LeagueScenes.enter('evolution','revealing');
            for(const [id,job] of queue){
                if(active.size>=2)break;
                if(active.has(id))continue;
                queue.delete(id);play(job);
            }
            if(!active.size&&!queue.size){LeagueScenes.leave('evolution');bridge?.idle?.();}
        });
    }
    function enqueue(id,from,to){
        if(!enabled||!valid(id)||to<=from)return;
        from=clamp(from);to=clamp(to);
        if(!held.has(id))held.set(id,from);
        const previous=queue.get(id);
        const earliest=previous?previous.from:from;
        const milestone=[3,5,7,10].filter(n=>n>earliest&&n<=to).pop()||0;
        queue.set(id,{id,from:earliest,to,milestone});
        pump();
    }
    function dispose(job){
        for(const entry of job.waiters||[]){clock.cancel(entry.timer);entry.resolve();}
        job.waiters?.clear();
        for(const animation of job.animations||[])animation.cancel();
        job.animations?.clear();job.layer?.remove();job.ghost?.remove();
    }
    function cancelTeam(id){
        queue.delete(id);held.delete(id);
        const job=active.get(id);
        if(job){job.cancelled=true;dispose(job);active.delete(id);}
        render(id);pump();
    }
    function cancelAll(){
        generation++;queue.clear();held.clear();
        for(const job of active.values()){job.cancelled=true;dispose(job);}
        active.clear();clock.clear();LeagueScenes.leave('evolution');ids.forEach(render);
    }
    function setEnabled(value){
        if(enabled===Boolean(value))return;
        cancelAll();enabled=Boolean(value);
        if(!enabled)images.clear();
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAll();else pump();});
    addEventListener('pagehide',cancelAll);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',event=>{if(event.matches)cancelAll();});
    document.addEventListener('error',event=>{
        const img=event.target;
        if(!(img instanceof HTMLImageElement)||!img.classList.contains('animated-sprite'))return;
        const frame=img.closest('.animated-avatar');if(!frame)return;
        frame.dataset.assetFailed='true';
        frame.innerHTML=`<span class="animated-art-fallback">${symbols[frame.dataset.avatarTeam]||'✦'}</span>`;
    },true);
    scope.AnimatedMode={markup,preload,warmNext,enqueue,cancelAll,cancelTeam,pump,setEnabled,
        configure(callbacks){bridge=callbacks;},
        displayLevel(id,actual){return held.has(id)?held.get(id):clamp(actual);},
        hasVisual(id){return held.has(id);},
        getDiagnostics(){return {enabled,active:active.size,queued:queue.size,held:held.size,cachedImages:images.size,motions:[...active.values()].reduce((n,j)=>n+j.animations.size,0)};}
    };
})(window);
