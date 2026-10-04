const fs=require('fs'),{makeLab,measure,ids}=require('./lab.cjs');process.chdir(__dirname);const lab=makeLab(),rows=[];
for(const base of [1,5,9])for(let lead=0;lead<4;lead++)for(const type of ['double','zeroOpponents','level']){
 const config={level:base};if(type==='level')config.levels=ids.map((_,i)=>base+(i===lead?1:0));else config.points=ids.map((_,i)=>i===lead?1000:type==='double'?500:0);
 const r=measure(lab,config,2000,(base===9?51000000:42000000+base*100000)+lead*10000+(['double','zeroOpponents','level'].indexOf(type))*2500);r.label=`${type}-${base}-${ids[lead]}`;rows.push(r);
}fs.writeFileSync('rerun-stress.json',JSON.stringify(rows,null,2));
const boundary=[];for(let lead=0;lead<4;lead++){const r=measure(lab,{levels:ids.map((_,i)=>i===lead?5:4)},5000,45000000+lead*10000);r.leader=ids[lead];boundary.push(r);}
fs.writeFileSync('rerun-relic-boundary.json',JSON.stringify(boundary,null,2));console.log('Completed point/level advantage and relic-boundary tests.');
