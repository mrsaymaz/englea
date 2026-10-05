const vm=require('vm'),fs=require('fs'),crypto=require('crypto'),path=require('path');
function makeGas(){
 const sheets=new Map(),properties=new Map();let locked=false,denyLock=false,active='Leaderboard';
 class Sheet{
  constructor(name){this.name=name;this.rows=[];}
  getName(){return this.name;}getMaxRows(){return this.maxRows||1000;}insertRowsAfter(at,n){this.maxRows=this.getMaxRows()+n;}getLastRow(){let n=this.rows.length;while(n&&!this.rows[n-1]?.some(v=>v!==''&&v!==undefined))n--;return n;}
  getRange(row,col=1,n=1,width=1){if(typeof row==='string'){row=1;n=1000;}const sheet=this;return {
   getValues(){return Array.from({length:n},(_,i)=>Array.from({length:width},(_,j)=>sheet.rows[row+i-1]?.[col+j-1]??''));},
   setValues(values){if(values.length!==n||values.some(r=>r.length!==width))throw Error('Range size mismatch');values.forEach((r,i)=>{sheet.rows[row+i-1]??=[];r.forEach((v,j)=>sheet.rows[row+i-1][col+j-1]=v);});return this;},
   setFontWeight(){return this;},setBackground(){return this;},setFontColor(){return this;}
  };}
  setFrozenRows(){}autoResizeColumns(){}clearContents(){this.rows=[];return this;}
 }
 const ss={getSheetByName:n=>sheets.get(n)||null,insertSheet(n){const s=new Sheet(n);sheets.set(n,s);return s;},getActiveSheet:()=>sheets.get(active),getSheets:()=>[...sheets.values()]};
 ss.insertSheet('Leaderboard').rows=[['Date','Class','First','Second','Third','Fourth','Score','Mission'],['existing lesson']];
 ss.insertSheet('Battle_Results').rows=[['Date','Class','Winner','HP','Damage','Duration'],['existing battle']];
 const c={SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k),setProperty:(k,v)=>properties.set(k,v)})},LockService:{getScriptLock:()=>({tryLock(){if(denyLock||locked)return false;locked=true;return true;},hasLock:()=>locked,releaseLock(){locked=false;}})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()]},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>({text})})}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../GOOGLE-APPS-SCRIPT-v9.7.0.gs'),'utf8'),c);
 return {post:data=>JSON.parse(c.doPost({postData:{contents:JSON.stringify(data)}}).text),ss,sheets,active(name){active=name;},lock(value){denyLock=value;},get locked(){return locked;}};
}
module.exports={makeGas};
