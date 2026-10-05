/* v10.1.2 dependency-free checks: every date the Apps Script writes is a real date shown day first (DD/MM/YYYY),
   whatever the Sheet's locale, and formatOldDates() converts the month-first text of earlier saves once. Runs the
   real Apps Script in the in-memory spreadsheet harness. */
const assert=require('node:assert/strict');
const {makeGas}=require('./roster-gas-harness.cjs');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const isDate=v=>Object.prototype.toString.call(v)==='[object Date]'&&!isNaN(v.getTime());
const cell=(gas,tab,row,col)=>({value:gas.sheets.get(tab).rows[row-1]?.[col-1],format:gas.sheets.get(tab).formats.get(row+':'+col)});
const FULL='dd/mm/yyyy hh:mm:ss',DAY='dd/mm/yyyy';
const session=(extra={})=>({type:'FULL_SESSION',pin:'2595',className:'5-A',sessionId:'lesson-1',winner:'Gryffindor',
 standings:[{name:'Gryffindor',points:90,level:3},{name:'Slytherin',points:40,level:2}],
 studentContributions:{everyone:true,teams:{gryffindor:[{name:'Elif Naz',awards:3}],slytherin:[{name:'Şeyma',awards:1}],hufflepuff:[],ravenclaw:[]}},
 islandProgress:{'5-A|gryffindor':{1:{score:700,stars:3}}},
 navigatorSeals:[{studentId:'5-A:gryffindor:0',student:'Elif Naz',team:'gryffindor',island:1,sessionId:'lesson-1'}],
 questionLog:[{id:'run-1:q1',t:Date.UTC(2026,9,5,9,30),s:'lesson-1',c:'5-A',h:'gryffindor',g:5,i:1,q:'q1',k:'apple',y:'word',f:'text',ok:false,e:false,v:false,m:true,p:'A',a:'B',x:'apple?'}],
 ...extra});
test('A session save writes real dates shown DD/MM/YYYY in every tab: Leaderboard, Battle_Results, Student_Contributions, Navigator_Seals, Island_Progress, Question_Log and Question_Summary',()=>{
 const gas=makeGas(),before=Date.now(),r=gas.post(session());assert.equal(r.status,'success',JSON.stringify(r));
 for(const [tab,col,format] of [['Leaderboard',1,FULL],['Battle_Results',1,FULL],['Student_Contributions',1,FULL],['Navigator_Seals',1,FULL],['Island_Progress',6,FULL],['Question_Log',1,FULL],['Question_Summary',8,DAY]]){
  const {value,format:f}=cell(gas,tab,gas.sheets.get(tab).getLastRow(),col);
  assert(isDate(value),`${tab}: a real date, not text (${value})`);assert.equal(f,format,`${tab}: shown day first`);
 }
 const stamp=cell(gas,'Leaderboard',gas.sheets.get('Leaderboard').getLastRow(),1).value.getTime();assert(stamp>=before-1000&&stamp<=Date.now()+1000,'the time of the save');
 assert.equal(cell(gas,'Question_Log',2,1).value.getTime(),Date.UTC(2026,9,5,9,30),'the answer’s own time');
});
test('Saving the same session again keeps the date day first; the season, seals and islands still load',()=>{
 const gas=makeGas();gas.post(session());gas.post(session());
 assert.equal(gas.sheets.get('Leaderboard').getLastRow(),3,'one header, the "existing lesson" row and this session');
 assert.equal(cell(gas,'Leaderboard',3,1).format,FULL);
 const got=gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'});
 assert.equal(got.status,'success');assert.equal(got.season.wins.gryffindor,2);assert.equal(got.navigatorSeals.length,1);assert.equal(got.islandProgress['5-A|gryffindor'][1].stars,3);
});
test('formatOldDates converts the month-first text of earlier saves (and ISO text) into day-first dates, once; other text stays as it is',()=>{
 const gas=makeGas(),D=gas.SheetDate,board=gas.sheets.get('Leaderboard').rows,battles=gas.sheets.get('Battle_Results').rows;
 board.push(['10/5/2026, 7:46:12 PM','5-A','Gryffindor (1 pts, Lv.1)'],['1/12/2026, 12:05:00 AM','5-C','Slytherin'],['12/1/2026, 12:30:00 PM','6-C','Ravenclaw'],
  ['13/25/2026, 1:00:00 PM','7-A','Hufflepuff'],['written by hand','8-B','Hufflepuff'],[new D(2026,2,4,8,15,0),'5-A','Gryffindor']);
 battles.push(['2026-10-05T16:46:12.000Z','5-A','Gryffindor']);
 const summary=gas.ss.insertSheet('Question_Summary');summary.rows=[['Class'],['5-A','apple','','','','','','2026-03-04','']];
 const report=gas.call('formatOldDates');
 const at=(row)=>cell(gas,'Leaderboard',row,1);
 const expect=(row,y,m,d,h,mi,s)=>{const c=at(row);assert(isDate(c.value),'row '+row);assert.deepEqual([c.value.getFullYear(),c.value.getMonth()+1,c.value.getDate(),c.value.getHours(),c.value.getMinutes(),c.value.getSeconds()],[y,m,d,h,mi,s]);assert.equal(c.format,FULL);};
 expect(3,2026,10,5,19,46,12);   // 10/5/2026 was 5 October (month first)
 expect(4,2026,1,12,0,5,0);      // 12:05 AM is just after midnight
 expect(5,2026,12,1,12,30,0);    // 12:30 PM is just after noon
 assert.equal(at(6).value,'13/25/2026, 1:00:00 PM','not a real month-first date: left as it is');assert.equal(at(6).format,'General','its format is left as it was');
 assert.equal(at(7).value,'written by hand');assert.equal(at(2).value,'existing lesson');
 expect(8,2026,3,4,8,15,0);      // already a date: only the format changes
 const iso=cell(gas,'Battle_Results',3,1);assert(isDate(iso.value));assert.equal(iso.value.getTime(),Date.UTC(2026,9,5,16,46,12));assert.equal(iso.format,FULL);
 const day=cell(gas,'Question_Summary',2,8);assert(isDate(day.value));assert.deepEqual([day.value.getFullYear(),day.value.getMonth()+1,day.value.getDate()],[2026,3,4]);assert.equal(day.format,DAY);
 assert.match(report,/Leaderboard: 3 converted · Battle_Results: 1 converted/);
 assert.match(gas.call('formatOldDates'),/Leaderboard: 0 converted · Battle_Results: 0 converted/,'running it again changes nothing');
 assert.equal(gas.locked,false,'the lock is released');
 const got=gas.post({type:'ISLAND_GET',pin:'2595',className:'5-A'});assert.equal(got.status,'success');assert(got.season.sessions>=5,'converted rows still count in the season');
});
console.log(JSON.stringify({checks}));
