/* Pure scoring rules shared by board and remote. */
(function(root){
    'use strict';
    function award({team,teams,base,lastTeam,combo=0,event}){
        combo=lastTeam===team.id?combo+1:1;let points=base;const modifiers=[];
        if(combo>1){const extra=combo*10;points+=extra;modifiers.push({icon:'⚡',label:`Combo +${extra.toLocaleString()}`});}
        const max=Math.max(...teams.map(t=>t.points)),min=Math.min(...teams.map(t=>t.points));
        if(team.points===min&&min<max*.8&&max>0){const mult=team.hasRelic&&team.id==='hufflepuff'?2:1.5;points*=mult;modifiers.push({icon:'🔥',label:`Comeback ×${mult}`});if(mult===2)modifiers.push({icon:'🏆',label:'Relic Boost'});}
        if(team.hasRelic&&team.id==='slytherin'){points*=1.1;modifiers.push({icon:'📿',label:'Relic ×1.1'});}
        if(event==='PointRush'){points*=2;modifiers.push({icon:'⚡',label:'Point Rush ×2'});}
        if(team.powerups.halfDown){points*=.5;modifiers.push({icon:'⬇',label:'Half ×0.5'});}
        if(team.powerups.doubleUp){points*=2;modifiers.push({icon:'✦',label:'Double ×2'});}
        return {points:Math.round(points),modifiers,combo,lastTeam:team.id};
    }
    function arenaHP(points,highest){const ratio=highest>0?Math.max(0,Math.min(1,points/highest)):0;return Math.round(200+50*Math.sqrt(ratio));}
    function resetTeam(team){Object.assign(team,{points:0,level:0,evolutionProgress:0,traits:[],hasRelic:false,pendingEvolution:null,cachedSVG:''});}
    function absorbNegative(team){
        if(!team?.powerups?.shield)return false;
        team.powerups.shield=false;return true;
    }
    function togglePowerup(team,type){
        if(!['doubleUp','halfDown','shield'].includes(type))return {changed:false,blocked:false};
        if(type==='halfDown'&&!team.powerups.halfDown&&absorbNegative(team))return {changed:true,blocked:true};
        team.powerups[type]=!team.powerups[type];return {changed:true,blocked:false};
    }
    root.LeagueRules=Object.freeze({award,arenaHP,resetTeam,absorbNegative,togglePowerup});
})(window);
