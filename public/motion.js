/* Shared finite motion language; no scoring or reward decisions. */
(function(root){
    'use strict';
    const media=matchMedia('(prefers-reduced-motion: reduce)'),channels=new Map();
    const timing=Object.freeze({point:190,reorder:400,switch:500,hit:240,guard:420,reveal:350,chest:Object.freeze({3:1600,5:2000,7:2400,10:3000})});
    const profiles=Object.freeze({gryffindor:{lift:7,turn:-5,recoil:10,element:'claw'},slytherin:{lift:0,turn:8,recoil:8,element:'nature'},hufflepuff:{lift:17,turn:0,recoil:6,element:'air'},ravenclaw:{lift:30,turn:-8,recoil:13,element:'water'},guardian:{lift:12,turn:-3,recoil:5,element:'claw'},boss:{lift:5,turn:2,recoil:4,element:'void'}});
    const allowed=()=>!document.hidden&&!media.matches&&!SceneRuntime.paused&&!SceneRuntime.fastForwarding;
    function channel(name,limit=12){
        if(channels.has(name))return channels.get(name);
        const motions=new Map(),effects=new Set();
        const api={
            play(el,key,frames,options={}){if(!allowed()||!el?.animate)return null;motions.get(key)?.animation.cancel();const animation=el.animate(frames,{easing:'cubic-bezier(.2,.72,.24,1)',...options}),entry={el,animation};motions.set(key,entry);animation.finished.catch(()=>{}).then(()=>{if(motions.get(key)===entry)motions.delete(key);});return animation;},
            effect(layer,el,frames,duration){if(!allowed()||!layer||effects.size>=LeaguePerformance.limit(limit))return null;layer.appendChild(el);const animation=el.animate(frames,{duration,easing:'ease-out'}),entry={el,animation};effects.add(entry);animation.finished.catch(()=>{}).then(()=>{el.remove();effects.delete(entry);});return animation;},
            cancel(key){motions.get(key)?.animation.cancel();motions.delete(key);},
            clear(){for(const {animation} of motions.values())animation.cancel();for(const {animation,el} of effects){animation.cancel();el.remove();}motions.clear();effects.clear();},
            diagnostics:()=>({actors:motions.size,effects:effects.size})
        };channels.set(name,api);return api;
    }
    function approach(id,dx,dy,impact=520,base=''){
        const p=profiles[id]||profiles.gryffindor,direction=Math.sign(dx)||1,duration=impact+340;
        const at=(x,y,scale=1,turn=0)=>`${base} translate(${x}px,${y}px) rotate(${turn}deg) scale(${scale})`;
        // Easing belongs to each segment; a linear overall clock keeps contact
        // at the exact millisecond used by the separate HP/damage timer.
        return {duration,frames:[{transform:at(0,0),offset:0},{transform:at(-direction*8,3,.97,p.turn*direction),offset:Math.min(.16,120/duration)},{transform:at(dx*.82,dy-p.lift,.99,p.turn*direction),offset:(impact-100)/duration},{transform:at(dx,dy,1.055,-p.turn*direction*.4),offset:impact/duration},{transform:at(dx*.83,dy),offset:(impact+100)/duration},{transform:at(0,0),offset:1}].map(frame=>({...frame,easing:'cubic-bezier(.2,.72,.24,1)'}))};
    }
    function pose(id,kind,direction=1){
        const p=profiles[id]||profiles.gryffindor,guard=kind==='guard',charge=kind==='charge';
        const x=charge?0:direction*(guard?-3:p.recoil),y=charge?-Math.max(5,p.lift*.5):guard?5:2;
        return {duration:guard?timing.guard:charge?390:timing.hit,frames:[{transform:'none',opacity:1},{transform:`translate(${x}px,${y}px) rotate(${guard?-p.turn*.5:p.turn*.35}deg) scale(${guard?'.93':charge?'1.035':'.97'})`,opacity:kind==='hit'?.8:1,offset:.42},{transform:'none',opacity:1}]};
    }
    const clear=()=>{for(const ch of channels.values())ch.clear();};
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});media.addEventListener?.('change',e=>{if(e.matches)clear();});addEventListener('pagehide',clear);
    root.LeagueMotion={timing,profiles,allowed,channel,approach,pose,diagnostics:()=>Object.fromEntries([...channels].map(([n,c])=>[n,c.diagnostics()]))};
})(window);
