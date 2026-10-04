/* v7: exclusive scene ownership and pausable, cancellable scene clocks. */
(function(root){
    'use strict';
    const scopes=new Map(),reasons=new Set(document.hidden?['hidden']:[]);
    let simulatedNow=null,fastForwarding=false;
    const now=()=>simulatedNow===null?performance.now():simulatedNow;
    const emit=()=>document.dispatchEvent(new CustomEvent('league-scene-change'));
    function create(name,options={}){
        if(scopes.has(name))return scopes.get(name);
        const tasks=new Set();let generation=0,pausedAt=reasons.size?now():null;
        const run=task=>{tasks.delete(task);task.timer=null;if(task.generation===generation)task.fn();};
        const arm=task=>{task.due=now()+task.remaining;if(!fastForwarding)task.timer=setTimeout(()=>run(task),task.remaining);};
        const api={tasks,
            after(fn,delay=0){const task={fn,remaining:Math.max(0,Number(delay)||0),generation,timer:null,due:now()+Math.max(0,Number(delay)||0)};tasks.add(task);if(pausedAt===null)arm(task);return task;},
            cancel(task){if(task){clearTimeout(task.timer);tasks.delete(task);}},
            clear(){generation++;for(const task of tasks)clearTimeout(task.timer);tasks.clear();},
            pause(){if(pausedAt!==null)return;pausedAt=now();for(const task of tasks){task.remaining=Math.max(0,task.due-pausedAt);clearTimeout(task.timer);}options.pause?.();},
            resume(){if(pausedAt===null||reasons.size)return;const elapsed=now()-pausedAt;pausedAt=null;options.resume?.(elapsed);for(const task of tasks)arm(task);},
            run,arm,get paused(){return pausedAt!==null;}
        };scopes.set(name,api);return api;
    }
    function shiftClock(state,delta){
        if(!state?.running)return;
        const shift=object=>{if(object)for(const key of Object.keys(object))if(/(At|Until)$/.test(key)&&Number.isFinite(object[key])&&object[key]>0)object[key]+=delta;};
        shift(state);shift(state.boss);state.fighters?.forEach(shift);state.targetLocks?.forEach(lock=>lock.expires+=delta);
    }
    function pause(reason='teacher'){reasons.add(reason);for(const scope of scopes.values())scope.pause();syncPaused();}
    function resume(reason='teacher'){reasons.delete(reason);if(!reasons.size)for(const scope of scopes.values())scope.resume();syncPaused();}
    function syncPaused(){document.body?.classList.toggle('league-scene-paused',Boolean(reasons.size));document.dispatchEvent(new CustomEvent('league-pause-change',{detail:{paused:Boolean(reasons.size)}}));}
    // Run the existing rules and damage callbacks in time order when skipping.
    function fastForward(name,done,maxMs=120000){
        const scope=scopes.get(name);if(!scope||fastForwarding||document.hidden)return false;
        resume('teacher');const start=performance.now(),limit=start+maxMs;
        fastForwarding=true;simulatedNow=start;
        for(const task of scope.tasks)clearTimeout(task.timer);
        try{
            let count=0;
            while(!done()&&count++<20000){
                const task=[...scope.tasks].sort((a,b)=>a.due-b.due)[0];
                if(!task||task.due>limit)break;
                simulatedNow=Math.max(simulatedNow,task.due);scope.run(task);
            }
            return done();
        }finally{
            const end=simulatedNow;simulatedNow=null;fastForwarding=false;
            for(const task of scope.tasks){task.remaining=Math.max(0,task.due-end);scope.arm(task);}
        }
    }
    const views={agent:{id:'agent-reveal-overlay',visible:'visible'},arena:{id:'battle-overlay',visible:'visible',body:'battle-active'},raid:{id:'vixar-raid-overlay',visible:'visible',body:'vixar-raid-active'},unity:{id:'unity-event-overlay',visible:'active',body:'unity-event-active'},wheel:{id:'wheel-modal',visible:'visible'},chest:{id:'evolution-modal',visible:'visible'},evolution:{},results:{id:'winner-overlay',visible:'visible',body:'winner-active'}};
    const hooks=new Map();let active=null;
    const scenes={
        register(name,callbacks){hooks.set(name,callbacks);},
        enter(name,phase='intro'){
            if(!views[name]||(active&&active!==name))return false;
            const changed=active!==name;active=name;const v=views[name],el=document.getElementById(v.id);
            if(v.visible)el?.classList.add(v.visible);el?.setAttribute('aria-hidden','false');if(v.body)document.body.classList.add(v.body);
            this.phase(name,phase);if(changed)emit();return true;
        },
        phase(name,phase){const el=document.getElementById(views[name]?.id);if(el)el.dataset.scenePhase=phase;if(name==='raid'&&phase!=='intro'){const curtain=el?.querySelector('.vixar-intro-curtain');if(curtain){curtain.hidden=true;curtain.setAttribute('aria-hidden','true');}}},
        leave(name){const v=views[name];if(!v)return;const el=document.getElementById(v.id);if(v.visible)el?.classList.remove(v.visible);el?.setAttribute('aria-hidden','true');if(el)delete el.dataset.scenePhase;if(v.body)document.body.classList.remove(v.body);if(active===name){active=null;resume('teacher');emit();}},
        pause(){if(active)pause('teacher');},resume(){resume('teacher');},
        skip(){if(active){resume('teacher');hooks.get(active)?.skip?.();}},
        cancel(){if(active){resume('teacher');hooks.get(active)?.cancel?.();}},
        get active(){return active;},get paused(){return reasons.has('teacher');}
    };
    document.addEventListener('visibilitychange',()=>document.hidden?pause('hidden'):resume('hidden'));
    addEventListener('pagehide',event=>{if(event.persisted)pause('pagehide');else for(const scope of scopes.values())scope.clear();});
    addEventListener('pageshow',event=>{if(event.persisted){resume('pagehide');document.hidden?pause('hidden'):resume('hidden');}});
    root.LeagueScenes=scenes;root.SceneRuntime={create,shiftClock,now,pause,resume,fastForward,get fastForwarding(){return fastForwarding;},get paused(){return reasons.size>0;},diagnostics:()=>Object.fromEntries([...scopes].map(([n,s])=>[n,{tasks:s.tasks.size,paused:s.paused}]))};
})(window);
