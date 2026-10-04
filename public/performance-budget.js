/* Brief frame samples with hysteresis; effects quality never changes gameplay or selected mode. */
(function(root){
    'use strict';
    let level=0,slow=0,healthy=0,timer=null,raf=null,enabled=false;
    function set(next){next=Math.max(0,Math.min(2,next));if(next===level)return;level=next;document.body.dataset.effectsBudget=String(level);document.dispatchEvent(new CustomEvent('league-budget-change',{detail:{level}}));}
    function assess(avg){if(avg>29){slow++;healthy=0;if(slow>=2){set(level+1);slow=0;}}else if(avg<21){healthy++;slow=0;if(healthy>=3){set(level-1);healthy=0;}}else{slow=0;healthy=0;}}
    function sample(){
        if(!enabled||document.hidden||SceneRuntime.paused){timer=setTimeout(sample,15000);return;}
        let start=null,last=null,total=0,count=0;
        function frame(t){
            if(!enabled||document.hidden){raf=null;return;}
            if(start===null)start=t;if(last!==null){total+=Math.min(250,t-last);count++;}last=t;
            if(t-start<1400){raf=requestAnimationFrame(frame);return;}
            raf=null;if(count>=8)assess(total/count);timer=setTimeout(sample,15000);
        }raf=requestAnimationFrame(frame);
    }
    function start(){if(enabled)return;enabled=true;timer=setTimeout(sample,2000);}
    function stop(){enabled=false;clearTimeout(timer);cancelAnimationFrame(raf);timer=null;raf=null;}
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);cancelAnimationFrame(raf);}else if(enabled)timer=setTimeout(sample,1500);});
    root.LeaguePerformance={start,stop,get level(){return level;},limit(n){return Math.max(2,Math.floor(n*[1,.6,.3][level]));},diagnostics:()=>({level,slow,healthy,sampling:Boolean(raf)})};
})(window);
