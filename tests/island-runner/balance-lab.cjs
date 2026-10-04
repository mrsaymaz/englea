/* Reproducible strategies, NOT predictions of student success rates. */
const E=require('../../public/island-runner/engine.js'),C=require('../../public/island-runner/expand-content.js');
const {simulate}=require('../runner-driver.cjs'),stats={};
for(const mode of ['soft','hard'])for(const style of ['collector','answer-first']){
 const row={runs:0,wins:0,coinShortfalls:0,dodgeFailures:0,courseFailures:0,minCoinPercent:100,maxCoinPercent:0};
 for(let island=1;island<=10;island++)for(let seed=0;seed<10;seed++){
  const r=simulate(new E.Run({bank:C.grades[5][island-1].bank,mode,island,seed:1000+seed,readPace:'calm'}),style),out=r.result();
  row.runs++;if(out.completed)row.wins++;else if(out.failureReason==='boss')row.coinShortfalls++;else if(out.failureReason==='boss-dodge')row.dodgeFailures++;else row.courseFailures++;
  row.minCoinPercent=Math.min(row.minCoinPercent,out.coinPercent);row.maxCoinPercent=Math.max(row.maxCoinPercent,out.coinPercent);
 }
 stats[mode+' / '+style]=row;
}
console.log(JSON.stringify({version:'9.1.0',note:'Both bots answer and play bosses. Only collector deliberately follows ordinary coin trails. No health/coin/score mutation.',stats},null,2));
