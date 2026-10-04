/* The four original transparent pieces join at anatomical sockets. */
(function(root){
    'use strict';
    const clock=SceneRuntime.create('guardian-assembly'),sockets={body:[580,570],head:[585,375],tail:[370,615],wings:[540,365]};let current=null;
    function aim(part){
        const art=document.getElementById('unity-guardian-animated-art');if(!art||!document.body.classList.contains('performance-animated'))return;
        const matrix=art.getScreenCTM();if(!matrix)return;const end=new DOMPoint(...(sockets[part]||sockets.body)).matrixTransform(matrix);
        for(const id of ['gryffindor','slytherin','hufflepuff','ravenclaw']){
            const spirit=document.getElementById(`unity-spirit-${id}`),path=document.getElementById(`unity-stream-${id}`),flow=document.getElementById(`unity-flow-${id}`);if(!spirit||!path||!flow)continue;
            const x=parseFloat(spirit.style.left),y=parseFloat(spirit.style.top);if(!Number.isFinite(x)||!Number.isFinite(y))continue;const bend=x<end.x?75:-75;
            const d=`M ${x} ${y} C ${x+bend} ${y-70}, ${end.x-bend} ${end.y-45}, ${end.x} ${end.y}`;path.setAttribute('d',d);flow.setAttribute('d',d);
            const length=path.getTotalLength();path.style.strokeDasharray=String(length);path.style.strokeDashoffset=path.classList.contains('show')?'0':String(length);
        }
    }
    function reveal(part){const el=document.querySelector(`#unity-guardian-animated-art [data-guardian-part="${part}"]`);if(!el)return;current=part;aim(part);LeagueScenes.phase('unity',`assembling-${part}`);el.classList.add('show');}
    function stop(){clock.clear();current=null;}
    addEventListener('resize',()=>{if(current)aim(current);});root.GuardianAssembly={reveal,aim,stop,diagnostics:()=>({part:current,timers:clock.tasks.size})};
})(window);
