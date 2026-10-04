const fs=require('fs'),path=require('path'),{makeLab,measure,ids}=require('./lab.cjs');process.chdir(__dirname);
const lab=makeLab(),n=Number(process.argv[2]||1000);if(!Number.isInteger(n)||n<1)throw Error('Pass a positive integer trial count');const rows=[];
for(const mode of ['high','low'])for(let level=0;level<=10;level++){
 const r=measure(lab,{level,...(mode==='low'?{points:[0,0,0,0]}:{})},mode==='low'&&level===9?n*2:n,mode==='low'&&level===9?50000000:40000000+(mode==='low'?500000:0)+level*20000);r.mode=mode;rows.push(r);console.log(mode,level,Object.values(r.rates).map(x=>x.toFixed(2)).join('/'));
}fs.writeFileSync('rerun-validation.json',JSON.stringify(rows,null,2));
