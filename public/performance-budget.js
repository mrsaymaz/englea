/* Brief frame samples with hysteresis; effects quality never changes gameplay or selected mode. */
(function(root){
    'use strict';
    // v10.3.0 board passport: the effects level this board settled on is remembered, so the next Arena or Vixar fight
    // starts with the right effects instead of adjusting during the fight. Faster samples while a scene is showing.
    const KEY='englishLeague.effectsBudget.v1';
    let level=0,slow=0,healthy=0,timer=null,raf=null,enabled=false;
    try{const saved=Number(localStorage.getItem(KEY));if(saved===1||saved===2)level=saved;}catch{}
    const apply=()=>{if(document.body)document.body.dataset.effectsBudget=String(level);else document.addEventListener('DOMContentLoaded',apply,{once:true});};apply();
    const pause=()=>root.LeagueScenes?.active?4000:15000;
    function set(next){next=Math.max(0,Math.min(2,next));if(next===level)return;level=next;document.body.dataset.effectsBudget=String(level);try{localStorage.setItem(KEY,String(level));}catch{}document.dispatchEvent(new CustomEvent('league-budget-change',{detail:{level}}));}
    function assess(avg){if(avg>29){slow++;healthy=0;if(slow>=2){set(level+1);slow=0;}}else if(avg<21){healthy++;slow=0;if(healthy>=3){set(level-1);healthy=0;}}else{slow=0;healthy=0;}}
    function sample(){
        if(!enabled||document.hidden||SceneRuntime.paused){timer=setTimeout(sample,pause());return;}
        let start=null,last=null,total=0,count=0;
        function frame(t){
            if(!enabled||document.hidden){raf=null;return;}
            if(start===null)start=t;if(last!==null){total+=Math.min(250,t-last);count++;}last=t;
            if(t-start<1400){raf=requestAnimationFrame(frame);return;}
            raf=null;if(count>=8)assess(total/count);timer=setTimeout(sample,pause());
        }raf=requestAnimationFrame(frame);
    }
    let announced=false;
    function start(){if(enabled)return;enabled=true;timer=setTimeout(sample,2000);
        // A remembered level is announced once the board has started, so the board drops the same extras as before.
        if(!announced&&level>0){announced=true;document.dispatchEvent(new CustomEvent('league-budget-change',{detail:{level}}));}}
    function stop(){enabled=false;clearTimeout(timer);cancelAnimationFrame(raf);timer=null;raf=null;}
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);cancelAnimationFrame(raf);}else if(enabled)timer=setTimeout(sample,1500);});
    root.LeaguePerformance={start,stop,get level(){return level;},limit(n){return Math.max(2,Math.floor(n*[1,.6,.3][level]));},diagnostics:()=>({level,slow,healthy,sampling:Boolean(raf)})};
    // v10.3.0: while the Arena covers the board, the board's animated background underneath is not drawn
    // (the Arena is almost opaque, so it looks the same and the screen has fewer layers to put together).
    function watchArena(){const overlay=document.getElementById('battle-overlay');if(!overlay)return;
        const sync=()=>document.body.classList.toggle('arena-covering',overlay.classList.contains('visible'));
        new MutationObserver(sync).observe(overlay,{attributes:true,attributeFilter:['class']});sync();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchArena,{once:true});else watchArena();
})(window);
