/* Scene-owned clocks: pause hidden pages and cancel stale work on exit. */
(function(root){
    'use strict';
    const scopes=new Map();
    function create(name,options={}){
        if(scopes.has(name))return scopes.get(name);
        const tasks=new Set();let generation=0,pausedAt=document.hidden?performance.now():null;
        const arm=task=>{task.due=performance.now()+task.remaining;task.timer=setTimeout(()=>{tasks.delete(task);if(task.generation===generation)task.fn();},task.remaining);};
        const api={tasks,
            after(fn,delay=0){const task={fn,remaining:Math.max(0,delay),generation,timer:null,due:0};tasks.add(task);if(pausedAt===null)arm(task);return task;},
            cancel(task){if(task){clearTimeout(task.timer);tasks.delete(task);}},
            clear(){generation++;for(const task of tasks)clearTimeout(task.timer);tasks.clear();pausedAt=document.hidden?performance.now():null;},
            pause(){if(pausedAt!==null)return;pausedAt=performance.now();for(const task of tasks){task.remaining=Math.max(0,task.due-pausedAt);clearTimeout(task.timer);}options.pause?.();},
            resume(){if(pausedAt===null)return;const elapsed=performance.now()-pausedAt;pausedAt=null;options.resume?.(elapsed);for(const task of tasks)arm(task);},
            get paused(){return pausedAt!==null;}
        };scopes.set(name,api);return api;
    }
    function shiftClock(state,delta){
        if(!state?.running)return;
        const shift=object=>{if(object)for(const key of Object.keys(object))if(/(At|Until)$/.test(key)&&Number.isFinite(object[key])&&object[key]>0)object[key]+=delta;};
        shift(state);shift(state.boss);state.fighters?.forEach(shift);state.targetLocks?.forEach(lock=>lock.expires+=delta);
    }
    const views={arena:{id:'battle-overlay',visible:'visible',body:'battle-active'},raid:{id:'vixar-raid-overlay',visible:'visible',body:'vixar-raid-active'},unity:{id:'unity-event-overlay',visible:'active',body:'unity-event-active'}};
    let active=null;
    const scenes={
        enter(name,phase='intro'){if(!views[name]||(active&&active!==name))return false;active=name;const v=views[name],el=document.getElementById(v.id);el?.classList.add(v.visible);el?.setAttribute('aria-hidden','false');document.body.classList.add(v.body);this.phase(name,phase);return true;},
        phase(name,phase){const el=document.getElementById(views[name]?.id);if(el)el.dataset.scenePhase=phase;if(name==='raid'&&phase!=='intro'){const curtain=el?.querySelector('.vixar-intro-curtain');if(curtain){curtain.hidden=true;curtain.setAttribute('aria-hidden','true');}}},
        leave(name){const v=views[name];if(!v)return;const el=document.getElementById(v.id);el?.classList.remove(v.visible);el?.setAttribute('aria-hidden','true');if(el)delete el.dataset.scenePhase;document.body.classList.remove(v.body);if(active===name)active=null;},
        get active(){return active;}
    };
    function syncVisibility(){document.body?.classList.toggle('league-scene-paused',document.hidden);for(const scope of scopes.values())document.hidden?scope.pause():scope.resume();}
    document.addEventListener('visibilitychange',syncVisibility);
    // A back/forward-cache visit keeps the game state alive. Preserve its timers
    // too, so returning to the page resumes the scene instead of freezing it.
    addEventListener('pagehide',event=>{if(event.persisted)document.body?.classList.add('league-scene-paused');for(const scope of scopes.values())event.persisted?scope.pause():scope.clear();});
    addEventListener('pageshow',event=>{if(event.persisted)syncVisibility();});
    root.LeagueScenes=scenes;root.SceneRuntime={create,shiftClock,diagnostics:()=>Object.fromEntries([...scopes].map(([n,s])=>[n,{tasks:s.tasks.size,paused:s.paused}]))};
})(window);
