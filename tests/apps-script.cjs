const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');

class Range {
  constructor(sheet,row,column,rowCount=1,columnCount=1,columnOnly=false){Object.assign(this,{sheet,row,column,rowCount,columnCount,columnOnly});}
  getValues(){
    const count=this.columnOnly?Math.max(this.sheet.rows.length,1):this.rowCount;
    return Array.from({length:count},(_,r)=>Array.from({length:this.columnCount},(_,c)=>this.sheet.rows[this.row-1+r]?.[this.column-1+c]??''));
  }
  setValues(values){values.forEach((valuesRow,r)=>valuesRow.forEach((value,c)=>{const rr=this.row-1+r;this.sheet.rows[rr]??=[];this.sheet.rows[rr][this.column-1+c]=value;}));return this;}
  getValue(){return this.getValues()[0][0];}
  setFontWeight(){return this;}setBackground(){return this;}setFontColor(){return this;}
}
class Sheet {
  constructor(name,headers=[]){this.name=name;this.rows=headers.length?[headers]:[];}
  getRange(a,b,c,d){if(typeof a==='string'){assert.equal(a,'A:A');return new Range(this,1,1,1,1,true);}return new Range(this,a,b,c,d);}
  getLastRow(){let result=0;this.rows.forEach((row,index)=>{if(row.some(value=>value!==''&&value!==undefined))result=index+1;});return result;}
  setFrozenRows(){}autoResizeColumns(){}
}
class Spreadsheet {
  constructor(){this.sheets={Leaderboard:new Sheet('Leaderboard',['Date']),Battle_Results:new Sheet('Battle_Results',['Date'])};}
  getSheetByName(name){return this.sheets[name]||null;}getActiveSheet(){return this.sheets.Leaderboard;}
  insertSheet(name){return this.sheets[name]=new Sheet(name);}
}
const spreadsheet=new Spreadsheet();
const context={
  SpreadsheetApp:{getActiveSpreadsheet:()=>spreadsheet},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},
  console
};
vm.createContext(context);
// v12.0.0: the archived script's PIN was removed from the repository; the test supplies its own.
vm.runInContext(fs.readFileSync(path.join(__dirname,'../archive/GOOGLE-APPS-SCRIPT-v7.1.2.gs'),'utf8').replace('const TEACHER_PIN = "REMOVED";','const TEACHER_PIN = "8642";'),context);
const payload={
  pin:'8642',type:'FULL_SESSION',sessionId:'session-one',className:'5-A',classMissionCompleted:true,
  standings:[{name:'Gryffindor',points:200,level:2},{name:'Slytherin',points:100,level:1}],winner:'Gryffindor',remainingHP:40,damageDealt:80,durationSeconds:30,
  studentContributions:{teams:{
    gryffindor:[{name:'Nog',points:80,awards:2,rank:2},{name:'Süvog',points:120,awards:1,rank:1},{name:'Casubon',points:60,awards:2,rank:3},{name:'Meyebur Eril',points:50,awards:3,rank:4}],
    slytherin:[{name:'Şugebı',points:100,awards:1,rank:1}],ravenclaw:[],hufflepuff:[]
  }}
};
const post=data=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(data)}}).text);
let response=post(payload);
assert.deepEqual(response,{status:'success'});
assert.equal(spreadsheet.sheets.Leaderboard.getLastRow(),2);assert.equal(spreadsheet.sheets.Battle_Results.getLastRow(),2);
const leaderboard=spreadsheet.sheets.Leaderboard;
assert.deepEqual(leaderboard.rows[0].slice(8,12),['Leaders of Gryffindor','Leaders of Hufflepuff','Leaders of Slytherin','Leaders of Ravenclaw']);
assert.equal(leaderboard.rows[1][8],'Meyebur Eril (3) · Casubon (2) · Nog (2)');
assert.equal(leaderboard.rows[1][9],'-');assert.equal(leaderboard.rows[1][10],'Şugebı (1)');assert.equal(leaderboard.rows[1][11],'-');
assert.ok(!JSON.stringify(leaderboard.rows[1].slice(8,12)).includes('120'));
response=post({...payload,pin:'wrong'});assert.equal(response.status,'unauthorized');assert.equal(leaderboard.getLastRow(),2);
response=post({...payload,type:'UNKNOWN',sessionId:'session-two'});assert.equal(response.status,'error');assert.equal(leaderboard.getLastRow(),2);
console.log('PASS Apps Script retains existing results and writes four count-based top-three leader columns without student points');
