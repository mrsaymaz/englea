const TEACHER_PIN = "REMOVED"; // v12.0.0: the PIN was removed from the published archive (v12 keeps it in Script properties)

const LEADER_HEADERS = [
  "Leaders of Gryffindor",
  "Leaders of Hufflepuff",
  "Leaders of Slytherin",
  "Leaders of Ravenclaw"
];

function doPost(e) {
  let requestLock;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No payload" });
    }

    const data = JSON.parse(e.postData.contents);

    if (String(data.pin).trim() !== String(TEACHER_PIN).trim()) {
      return jsonResponse({ status: "unauthorized", message: "Invalid PIN" });
    }

    requestLock = LockService.getScriptLock();
    if (!requestLock.tryLock(10000)) return jsonResponse({status:'error',message:'Another save is in progress. Please try again.'});
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.type === 'ROSTER_GET' || data.type === 'ROSTER_SAVE') return jsonResponse(handleRosterRequest(ss,data));
    if (data.type === 'ISLAND_GET') return jsonResponse({status:'success',islandProgress:readIslandProgress(ss,validIslandClass(data.className))});
    if (!['FULL_SESSION','LEADERBOARD_FINAL','BATTLE_OUTCOME'].includes(data.type)) return jsonResponse({status:'error',message:'Unknown record type'});
    const islandClass = data.islandProgress !== undefined ? validIslandClass(data.className) : null;
    const incomingIslands = islandClass ? validateIslandProgress(data.islandProgress,islandClass) : null;
    if(data.sessionId !== undefined && (typeof data.sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(data.sessionId)))throw Error('Invalid session ID');
    function resultsSheet(name) {
      const sheet=ss.getSheetByName(name)||ss.insertSheet(name);
      if(!sheet.getLastRow()){
        const headers=name==='Leaderboard'?['Date','Class','First','Second','Third','Fourth','Top score','Mission']:['Date','Class','Winner','HP','Damage','Duration'];
        sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
      }
      return sheet;
    }

    const className = String(data.className || "Unassigned").trim();
    const now = new Date().toLocaleString();

    function nextAvailableRow(sheet) {
      const dates = sheet.getRange("A:A").getValues();
      let nextRow = 1;
      while (nextRow <= dates.length && dates[nextRow - 1][0] !== "") nextRow++;
      return nextRow;
    }

    function appendSmartRow(sheet, rowValues) {
      let row=nextAvailableRow(sheet);
      if(data.sessionId){
        const keyColumn=sheet.getName()==='Leaderboard'?13:7;
        const header=String(sheet.getRange(1,keyColumn).getValues()[0][0]||'');
        if(header && header!=='Session ID')throw Error(sheet.getName()+' needs an empty Session ID column '+keyColumn);
        sheet.getRange(1,keyColumn).setValues([['Session ID']]);
        const values=sheet.getRange(1,1,Math.max(1,sheet.getLastRow()),keyColumn).getValues();
        const found=values.findIndex((r,i)=>i>0&&r[keyColumn-1]===data.sessionId&&r[1]===className);
        if(found>=0)row=found+1;
        rowValues[keyColumn-1]=data.sessionId;
      }
      sheet.getRange(row, 1, 1, rowValues.length).setValues([rowValues]);
    }

    function ensureLeaderHeaders(sheet) {
      const range = sheet.getRange(1, 9, 1, LEADER_HEADERS.length); // Columns I–L
      const existing = range.getValues()[0];
      const occupied = existing.some(value => String(value || "").trim() !== "");
      const correct = existing.every((value, index) => String(value || "").trim() === LEADER_HEADERS[index]);

      if (occupied && !correct) {
        throw new Error("Leaderboard columns I-L must be empty or use the four English League leader headers.");
      }

      if (!correct) {
        range.setValues([LEADER_HEADERS]);
        range.setFontWeight("bold");
        range.setBackground("#1e293b");
        range.setFontColor("#ffffff");
      }
    }

    function leadersFor(teamId) {
      const contributionData = data.studentContributions;
      const teams = contributionData && contributionData.teams;
      const students = teams && Array.isArray(teams[teamId]) ? teams[teamId] : [];

      return students
        .map(student => ({
          name: String(student && student.name || "").trim(),
          contributions: Number(student && student.awards)
        }))
        .filter(student => student.name && Number.isFinite(student.contributions) && student.contributions > 0)
        .sort((a, b) => b.contributions - a.contributions || a.name.localeCompare(b.name, "tr"))
        .slice(0, 3)
        .map(student => `${student.name} (${Math.round(student.contributions)})`)
        .join(" · ") || "-";
    }

    function recordLeaderboard() {
      const sheet = resultsSheet("Leaderboard");
      const s = Array.isArray(data.standings) ? data.standings : [];

      const formatStanding = standing => standing
        ? `${standing.name || "-"} (${standing.points || 0} pts, Lv.${standing.level || 0})`
        : "-";

      const topScore = s[0] ? (s[0].points || 0) : 0;
      const missionStatus = data.classMissionCompleted ? "Yes" : "No";

      ensureLeaderHeaders(sheet);
      appendSmartRow(sheet, [
        now,
        className,
        formatStanding(s[0]),
        formatStanding(s[1]),
        formatStanding(s[2]),
        formatStanding(s[3]),
        topScore,
        missionStatus,
        leadersFor("gryffindor"),
        leadersFor("hufflepuff"),
        leadersFor("slytherin"),
        leadersFor("ravenclaw")
      ]);
      sheet.autoResizeColumns(9, 4);
    }

    function recordBattle() {
      const sheet = resultsSheet("Battle_Results");
      const winner = data.winner || "-";
      const hp = data.remainingHP !== undefined && data.remainingHP !== null ? data.remainingHP : "-";
      const dmg = data.damageDealt !== undefined && data.damageDealt !== null ? data.damageDealt : "-";
      const dur = data.durationSeconds ? `${data.durationSeconds}s` : "30s";

      appendSmartRow(sheet, [now, className, winner, hp, dmg, dur]);
    }

    if (data.type === "FULL_SESSION") {
      recordLeaderboard();
      recordBattle();
    } else if (data.type === "LEADERBOARD_FINAL") {
      recordLeaderboard();
    } else if (data.type === "BATTLE_OUTCOME") {
      recordBattle();
    } else {
      return jsonResponse({ status: "error", message: "Unknown record type" });
    }

    const islandProgress = islandClass ? mergeIslandProgress(ss,islandClass,incomingIslands) : undefined;
    return jsonResponse({ status: "success", islandProgress });
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString(), message: err.message || String(err) });
  } finally {
    if(requestLock && requestLock.hasLock()) requestLock.releaseLock();
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// v8.7.0: existing students are imported automatically. No manual roster entry needed.
const DEFAULT_ROSTER = []; // v12.0.0: the real class lists were removed from the published archive

const ROSTER_HEADERS = ['Student ID','Class','Student','Team','Active'];
function validateRosterRows(students) {
  const classes=['5-A','5-C','6-C','7-A','8-B'],teams=['gryffindor','slytherin','hufflepuff','ravenclaw'];
  if(!Array.isArray(students)||students.length>500)throw new Error('Roster must contain no more than 500 students.');
  const ids=new Set();
  return students.map(p=>{
    const name=typeof p?.name==='string'?p.name.trim().normalize('NFC'):'';
    if(!p||typeof p.id!=='string'||! /^[A-Za-z0-9:_-]{1,100}$/.test(p.id)||ids.has(p.id)
       ||!classes.includes(p.className)||!teams.includes(p.teamId)||typeof p.active!=='boolean'
       ||!name||name.length>70||! /^\p{L}[\p{L}\p{M}\p{N} .’'-]*$/u.test(name))throw new Error('Invalid student name, class, team or identity.');
    ids.add(p.id);return {id:p.id,name,className:p.className,teamId:p.teamId,active:p.active};
  });
}
function rosterRevision(students) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(students),Utilities.Charset.UTF_8)
    .map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function writeRosterRows(sheet,students) {
  // One range write, including cleared trailing rows, while holding the script lock.
  const oldRows=Math.max(0,sheet.getLastRow()-1),count=Math.max(oldRows,students.length);
  if(!count)return;
  const rows=students.map(p=>[p.id,p.className,p.name,p.teamId.charAt(0).toUpperCase()+p.teamId.slice(1),p.active]);
  while(rows.length<count)rows.push(['','','','','']);
  sheet.getRange(2,1,count,5).setValues(rows);
  SpreadsheetApp.flush();
}
function handleRosterRequest(ss,data) {
  let sheet=ss.getSheetByName('Roster');
  const props=PropertiesService.getScriptProperties();
  if(!sheet)sheet=ss.insertSheet('Roster');
  if(sheet.getLastRow()===0){
    sheet.getRange(1,1,1,5).setValues([ROSTER_HEADERS]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    writeRosterRows(sheet,DEFAULT_ROSTER);
    props.setProperty('ENGLISH_LEAGUE_ROSTER_VERSION','1');
    sheet.autoResizeColumns(1,5);
  }
  if(JSON.stringify(sheet.getRange(1,1,1,5).getValues()[0])!==JSON.stringify(ROSTER_HEADERS))throw new Error('The Roster tab already contains different data. Rename that tab before using Manage.');
  const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,5).getValues():[];
  let students=validateRosterRows(rows.filter(r=>r.some(v=>v!=='')).map(r=>({id:String(r[0]),className:String(r[1]),name:String(r[2]),teamId:String(r[3]).toLowerCase(),active:r[4]})));
  let revision=rosterRevision(students),version=Math.max(1,Number(props.getProperty('ENGLISH_LEAGUE_ROSTER_VERSION'))||1);
  if(data.type==='ROSTER_SAVE'){
    const next=validateRosterRows(data.students),nextRevision=rosterRevision(next);
    if(data.revision!==revision&&nextRevision!==revision)return {status:'conflict',message:'The online roster changed on another device. Reload online, then make this edit again.'};
    // Retain removed identities as inactive rows so they cannot be reused accidentally.
    if(students.some(p=>!next.some(n=>n.id===p.id)))throw new Error('Use Remove in Manage; do not delete student identities.');
    if(nextRevision!==revision){
      writeRosterRows(sheet,next);students=next;revision=nextRevision;version++;
      props.setProperty('ENGLISH_LEAGUE_ROSTER_VERSION',String(version));
    }
  }
  return {status:'success',schema:1,students,revision,version};
}

// v8.9.0: one durable record per class/team/completed island. Best results only.
const ISLAND_HEADERS=['Class','Team','Island completed','Best score','Stars','Last updated'];
const ISLAND_TEAMS=['gryffindor','hufflepuff','slytherin','ravenclaw'];
function validIslandClass(name){if(!['5-A','5-C','6-C','7-A','8-B'].includes(name))throw Error('Choose a supported class for Island Run.');return name;}
function validateIslandProgress(progress,className){
  if(!progress||typeof progress!=='object'||Array.isArray(progress))throw Error('Invalid island progress');
  const clean={};
  for(const key of Object.keys(progress)){
    const parts=key.split('|');
    if(parts.length!==2||parts[0]!==className||!ISLAND_TEAMS.includes(parts[1]))throw Error('Island progress belongs to a different class or team');
    const levels=progress[key];if(!levels||typeof levels!=='object'||Array.isArray(levels))throw Error('Invalid islands');
    clean[key]={};
    for(const id of Object.keys(levels)){
      const v=levels[id];
      if(!/^(10|[1-9])$/.test(id)||!v||!Number.isInteger(v.score)||v.score<0||v.score>100000||!Number.isInteger(v.stars)||v.stars<1||v.stars>3)throw Error('Invalid island result');
      clean[key][id]={score:v.score,stars:v.stars};
    }
  }
  return clean;
}
function islandSheet(ss){
  const sheet=ss.getSheetByName('Island_Progress')||ss.insertSheet('Island_Progress');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,6).setValues([ISLAND_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,6).getValues()[0])!==JSON.stringify(ISLAND_HEADERS))throw Error('Island_Progress has different headers. Rename that tab before saving.');
  return sheet;
}
function readIslandProgress(ss,className){
  const sheet=islandSheet(ss),result={};
  ISLAND_TEAMS.forEach(team=>result[className+'|'+team]={});
  if(sheet.getLastRow()<2)return result;
  sheet.getRange(2,1,sheet.getLastRow()-1,6).getValues().forEach(r=>{
    if(r[0]!==className)return;
    const team=String(r[1]).toLowerCase(),id=String(r[2]);
    if(!ISLAND_TEAMS.includes(team)||!/^(10|[1-9])$/.test(id))return;
    const score=Number(r[3]),stars=Number(r[4]);
    if(!Number.isInteger(score)||score<0||score>100000||!Number.isInteger(stars)||stars<1||stars>3)return;
    const key=className+'|'+team,old=result[key][id]||{score:0,stars:0};
    result[key][id]={score:Math.max(old.score,score),stars:Math.max(old.stars,stars)};
  });
  return result;
}
function mergeIslandProgress(ss,className,incoming){
  const sheet=islandSheet(ss),existing=readIslandProgress(ss,className);
  const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,6).getValues():[];
  Object.keys(incoming).forEach(key=>Object.keys(incoming[key]).forEach(id=>{
    const value=incoming[key][id],old=existing[key][id],team=key.split('|')[1];
    const best={score:Math.max(old?old.score:0,value.score),stars:Math.max(old?old.stars:0,value.stars)};
    if(old&&old.score===best.score&&old.stars===best.stars)return;
    const index=rows.findIndex(r=>r[0]===className&&String(r[1]).toLowerCase()===team&&String(r[2])===id);
    const row=[className,team[0].toUpperCase()+team.slice(1),Number(id),best.score,best.stars,new Date().toISOString()];
    if(index>=0){sheet.getRange(index+2,1,1,6).setValues([row]);rows[index]=row;}
    else {sheet.getRange(rows.length+2,1,1,6).setValues([row]);rows.push(row);}
    existing[key][id]=best;
  }));
  return existing;
}
