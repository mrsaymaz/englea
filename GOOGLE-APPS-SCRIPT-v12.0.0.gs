// English League v12.0.0 · Foundations and Trials.
// SETUP (once): Apps Script editor → Project Settings (gear icon) → Script properties → Add script property:
//   TEACHER_PIN        your Teacher PIN (choose a new one: the PIN of earlier versions was published with the code)
//   LEAGUE_SERVER_KEY  a long random passphrase; put the SAME value in Netlify → Environment variables → LEAGUE_SERVER_KEY
// Then Deploy → Manage deployments → Edit → New version. Run checkLeagueSetup() from the editor to check both values.
// - Only your English League site can use this web app: every request must carry LEAGUE_SERVER_KEY (Netlify adds it on
//   the server; browsers never see it), then the Teacher PIN. No PIN and no student names are written in this code.
// - The Roster tab is the only place that holds the real class lists. A new Roster tab starts empty (add students in
//   Manage); earlier versions of this file filled it with names written in the code.
// - Student_Contributions rows carry each student's roster ID (column G) next to the name and team as they were in that
//   lesson (columns C–D), so renames, team changes and repeated names never split or merge a student's record. Older
//   rows are matched to IDs once (column H says how); run migrateStudentIds() again after fixing the Roster tab.
// - English League → Build term report writes Term_Report: one row per student ID across the whole record.
// - The Vixar Saga's Act I (the True Rune) and Act II (the Scarlet Brand rescue) answers are added to Challenge_Log as
//   "Rune · …" and "Brand · …" rows, like the Merge Spell's "Merge · …" rows.
// Includes v11.0.0 (Vixar_Saga, Vixar_Finale_Lines, Merge answers), v10.4.0 (Challenge_Log), v10.2.0 (the class's last
// saved session for the Comeback Halo), v10.1.2 (day-first dates, formatOldDates), v10.0.0 (School League Season),
// v9.7.0 (Navigator_Seals) and v9.6.0 (Student_Contributions).
function leagueSecrets_() {
  const props = PropertiesService.getScriptProperties();
  return { pin: String(props.getProperty('TEACHER_PIN') || '').trim(), key: String(props.getProperty('LEAGUE_SERVER_KEY') || '') };
}
// Compares a given secret with the expected one in time that does not depend on where they first differ.
function sameSecret_(given, expected) {
  given = String(given === undefined || given === null ? '' : given); expected = String(expected || '');
  if (!expected) return false;
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (given.charCodeAt(i) || 0);
  return diff === 0;
}
// Run from the editor: says whether both script properties are set (it never shows them).
function checkLeagueSetup() {
  const s = leagueSecrets_(), notes = [];
  notes.push(s.pin ? 'TEACHER_PIN is set (' + s.pin.length + ' characters' + (s.pin.length < 6 ? ', use at least 6' : '') + ').' : 'TEACHER_PIN is missing.');
  notes.push(s.key ? 'LEAGUE_SERVER_KEY is set (' + s.key.length + ' characters' + (s.key.length < 24 ? ', use at least 24' : '') + ').' : 'LEAGUE_SERVER_KEY is missing.');
  const text = notes.join(' ');
  Logger.log(text);
  return text;
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('English League')
    .addItem('Build term report', 'buildTermReport')
    .addItem('Match student IDs in older contributions', 'migrateStudentIds')
    .addItem('Check setup', 'checkLeagueSetup')
    .addToUi();
}

// Earlier versions wrote "Leaders of …" (top three). v9.6.0 lists every contributor, so new sheets get
// "Contributors of …"; sheets with the earlier headers are renamed in place.
const LEADER_HEADERS = [
  "Leaders of Gryffindor",
  "Leaders of Hufflepuff",
  "Leaders of Slytherin",
  "Leaders of Ravenclaw"
];
const CONTRIBUTOR_HEADERS = [
  "Contributors of Gryffindor",
  "Contributors of Hufflepuff",
  "Contributors of Slytherin",
  "Contributors of Ravenclaw"
];
// v12.0.0: G–H added. Student ID is the roster ID; the name and team in C–D are as they were in that lesson.
const CONTRIBUTION_HEADERS = ['Date','Class','Team','Student','Contributions','Session ID','Student ID','ID source'];
const CONTRIBUTION_TEAMS = {gryffindor:'Gryffindor',hufflepuff:'Hufflepuff',slytherin:'Slytherin',ravenclaw:'Ravenclaw'};
// v9.7.0: one row per student per island seal earned as the session's Island Run navigator.
const NAVIGATOR_HEADERS = ['Date','Class','Team','Student','Student ID','Island','Guardian','Session ID'];
const GUARDIAN_NAMES = ['Veyr','Tickthorn','Mirrath','Rootmaw','Vox','Kaelis','Morrow','Noctryn','Ferron','Astrax'];

// v10.1.2: dates are stored as real dates (so the Sheet can sort and filter them) and shown day first, with the
// time, whatever the Sheet's locale. Earlier versions wrote US-style text (month first).
const DATE_TIME_FORMAT = 'dd/mm/yyyy hh:mm:ss';
const DATE_ONLY_FORMAT = 'dd/mm/yyyy';
function dayFirst(range,format){range.setNumberFormat(format||DATE_TIME_FORMAT);return range;}

function doPost(e) {
  let requestLock;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No payload" });
    }

    const data = JSON.parse(e.postData.contents);

    const secrets = leagueSecrets_();
    if (!secrets.pin || !secrets.key) return jsonResponse({ status: "error", code: "setup", message: "Apps Script setup: add TEACHER_PIN and LEAGUE_SERVER_KEY in Project Settings → Script properties, then deploy a New version." });
    // Only the English League site (Netlify, which adds the key on the server) can reach the PIN check.
    if (!sameSecret_(data.serverKey, secrets.key)) return jsonResponse({ status: "error", code: "server-key", message: "This request did not come from your English League site. LEAGUE_SERVER_KEY must be the same in Netlify and in Apps Script." });
    if (!sameSecret_(String(data.pin === undefined || data.pin === null ? '' : data.pin).trim(), secrets.pin)) {
      return jsonResponse({ status: "unauthorized", message: "Invalid PIN" });
    }
    // v12.0.0: the site checks the Teacher PIN once when a new board or phone signs in.
    if (data.type === 'AUTH_CHECK') return jsonResponse({ status: 'success', authVersion: 1 });

    requestLock = LockService.getScriptLock();
    if (!requestLock.tryLock(10000)) return jsonResponse({status:'error',message:'Another save is in progress. Please try again.'});
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.type === 'ROSTER_GET' || data.type === 'ROSTER_SAVE') return jsonResponse(handleRosterRequest(ss,data));
    if (['TEACHING_GET','TEACHING_SAVE'].includes(data.type)) return jsonResponse(handleTeaching(ss,data));
    if (['SAGA_SAVE','SAGA_SET','SAGA_LINES_SAVE'].includes(data.type)) return jsonResponse(handleSaga(ss,data));
    if (data.type === 'ISLAND_GET') {
      const getClass=validIslandClass(data.className);
      // v12.0.0: older contribution rows get their student IDs the first time the teacher signs in after the update.
      if(PropertiesService.getScriptProperties().getProperty('ENGLISH_LEAGUE_CONTRIBUTION_IDS')!=='1'&&ss.getSheetByName('Student_Contributions'))contributionSheet(ss);
      const saga=readSaga(ss,getClass);
      return jsonResponse({status:'success',passportVersion:1,questionLogVersion:1,contributionsVersion:1,contributionIdsVersion:1,trialsVersion:1,authVersion:1,navigatorSealsVersion:1,seasonVersion:1,lastSessionVersion:1,challengeLogVersion:1,sagaVersion:1,lastSession:lastSessionFor(ss,getClass),season:readSeason(ss),navigatorSeals:readNavigatorSeals(ss,getClass),islandProgress:readIslandProgress(ss,getClass),teaching:teachingCatalog(ss,Number(getClass[0])),questionLog:readQuestionLog(ss,getClass).slice(-600),
        saga:saga,sagaExtras:sagaExtras(ss,getClass,saga),finaleLines:readFinaleLines(ss,Number(getClass[0]))});
    }
    if (!['FULL_SESSION','LEADERBOARD_FINAL','BATTLE_OUTCOME'].includes(data.type)) return jsonResponse({status:'error',message:'Unknown record type'});
    const islandClass = data.islandProgress !== undefined ? validIslandClass(data.className) : null;
    const incomingIslands = islandClass ? validateIslandProgress(data.islandProgress,islandClass) : null;
    if(data.sessionId !== undefined && (typeof data.sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(data.sessionId)))throw Error('Invalid session ID');
    // Validate answer rows before any sheet is written, so a bad row never leaves half a save.
    const questionRows = data.questionLog !== undefined ? validateQuestionRows(data.questionLog, String(data.className || '').trim()) : null;
    const contributionRows = ['FULL_SESSION','LEADERBOARD_FINAL'].includes(data.type) ? validateContributionRows(data.studentContributions) : [];
    const sealRows = data.navigatorSeals !== undefined ? validateNavigatorSeals(data.navigatorSeals, validIslandClass(data.className)) : null;
    const challengeRows = data.challengeLog !== undefined ? validateChallengeRows(data.challengeLog, String(data.className || '').trim()) : null;
    function resultsSheet(name) {
      const sheet=ss.getSheetByName(name)||ss.insertSheet(name);
      if(!sheet.getLastRow()){
        const headers=name==='Leaderboard'?['Date','Class','First','Second','Third','Fourth','Top score','Mission']:['Date','Class','Winner','HP','Damage','Duration'];
        sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
      }
      return sheet;
    }

    const className = String(data.className || "Unassigned").trim();
    const now = new Date();

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
      dayFirst(sheet.getRange(row, 1));
    }

    function ensureLeaderHeaders(sheet) {
      const range = sheet.getRange(1, 9, 1, CONTRIBUTOR_HEADERS.length); // Columns I–L
      const existing = range.getValues()[0].map(value => String(value || "").trim());
      const occupied = existing.some(value => value !== "");
      const matches = headers => existing.every((value, index) => value === headers[index]);

      if (occupied && !matches(LEADER_HEADERS) && !matches(CONTRIBUTOR_HEADERS)) {
        throw new Error("Leaderboard columns I-L must be empty or use the four English League contributor headers.");
      }

      if (!matches(CONTRIBUTOR_HEADERS)) {
        range.setValues([CONTRIBUTOR_HEADERS]);
        range.setFontWeight("bold");
        range.setBackground("#1e293b");
        range.setFontColor("#ffffff");
      }
    }

    // v9.6.0: every contributor of the team, most contributions first, with the count.
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
        .map(student => `${student.name} (${Math.round(student.contributions)})`)
        .join(" · ") || "-";
    }
    // A list that starts with a formula-like name is stored as text; the empty marker stays "-".
    function contributorsCell(teamId) {
      const list = leadersFor(teamId);
      return list === "-" ? list : sheetText(list);
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
        contributorsCell("gryffindor"),
        contributorsCell("hufflepuff"),
        contributorsCell("slytherin"),
        contributorsCell("ravenclaw")
      ]);
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
    const questionsAdded = questionRows && questionRows.length ? appendQuestionLog(ss, questionRows) : 0;
    const contributionsWritten = contributionRows.length ? writeContributions(ss, contributionRows, {date:now, className, sessionId:data.sessionId}) : {written:0};
    const sealsAdded = sealRows && sealRows.length ? writeNavigatorSeals(ss, sealRows, {date:now, className}) : 0;
    const navigatorSeals = sealRows ? readNavigatorSeals(ss, validIslandClass(data.className)) : undefined;
    const challengesAdded = challengeRows && challengeRows.length ? appendChallengeLog(ss, challengeRows) : 0;
    return jsonResponse({ status: "success", passportVersion:1, questionLogVersion:1, contributionsVersion:1, contributionIdsVersion:1, trialsVersion:1, navigatorSealsVersion:1, seasonVersion:1, challengeLogVersion:1, sagaVersion:1, season:readSeason(ss), islandProgress, questionsAdded, contributionsWritten:contributionsWritten.written, contributionsSkipped:contributionRows.skipped||0, sealsAdded, challengesAdded, navigatorSeals });
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

// v12.0.0: no student names are written in this code. A new Roster tab starts with its headers only; add students in
// Manage on the phone (earlier versions filled a new tab with names written here).

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
const ISLAND_HEADERS=['Class','Team','Island completed','Best score','Stars','Last updated','Best coin percent','Hard cleared'];
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
      if(v.coinPercent!==undefined){if(!Number.isInteger(v.coinPercent)||v.coinPercent<0||v.coinPercent>100)throw Error('Invalid passport coin percentage');clean[key][id].coinPercent=v.coinPercent;}
      if(v.hardClear!==undefined){if(typeof v.hardClear!=='boolean')throw Error('Invalid passport mode');if(v.hardClear)clean[key][id].hardClear=true;}
    }
  }
  return clean;
}
function islandSheet(ss){
  const sheet=ss.getSheetByName('Island_Progress')||ss.insertSheet('Island_Progress');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,8).setValues([ISLAND_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,6).getValues()[0])!==JSON.stringify(ISLAND_HEADERS.slice(0,6)))throw Error('Island_Progress has different headers. Rename that tab before saving.');
  const extra=sheet.getRange(1,7,1,2).getValues()[0],missing=[];
  extra.forEach((name,index)=>{
    if(name===ISLAND_HEADERS[index+6])return;
    if(name!==''||(sheet.getLastRow()>1&&sheet.getRange(2,index+7,sheet.getLastRow()-1,1).getValues().some(r=>r[0]!=='')))throw Error('Island_Progress columns G/H contain other data. Move those custom columns before adding passport records.');
    missing.push(index);
  });
  missing.forEach(index=>sheet.getRange(1,index+7,1,1).setValues([[ISLAND_HEADERS[index+6]]]).setFontWeight('bold'));
  return sheet;
}
function readIslandProgress(ss,className){
  const sheet=islandSheet(ss),result={};
  ISLAND_TEAMS.forEach(team=>result[className+'|'+team]={});
  if(sheet.getLastRow()<2)return result;
  sheet.getRange(2,1,sheet.getLastRow()-1,8).getValues().forEach(r=>{
    if(r[0]!==className)return;
    const team=String(r[1]).toLowerCase(),id=String(r[2]);
    if(!ISLAND_TEAMS.includes(team)||!/^(10|[1-9])$/.test(id))return;
    const score=Number(r[3]),stars=Number(r[4]);
    if(!Number.isInteger(score)||score<0||score>100000||!Number.isInteger(stars)||stars<1||stars>3)return;
    const key=className+'|'+team,old=result[key][id]||{score:0,stars:0};
    const value={score,stars};if(r[6]!==''&&Number.isInteger(Number(r[6]))&&Number(r[6])>=0&&Number(r[6])<=100)value.coinPercent=Number(r[6]);if(r[7]==='Yes'||r[7]===true)value.hardClear=true;
    result[key][id]=bestIslandResult(old,value);
  });
  return result;
}
function mergeIslandProgress(ss,className,incoming){
  const sheet=islandSheet(ss),existing=readIslandProgress(ss,className);
  const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,8).getValues():[];
  Object.keys(incoming).forEach(key=>Object.keys(incoming[key]).forEach(id=>{
    const value=incoming[key][id],old=existing[key][id],team=key.split('|')[1];
    const best=bestIslandResult(old||{score:0,stars:0},value);
    if(old&&JSON.stringify(old)===JSON.stringify(best))return;
    const index=rows.findIndex(r=>r[0]===className&&String(r[1]).toLowerCase()===team&&String(r[2])===id);
    const row=[className,team[0].toUpperCase()+team.slice(1),Number(id),best.score,best.stars,new Date(),best.coinPercent===undefined?'':best.coinPercent,best.hardClear?'Yes':''];
    if(index>=0){sheet.getRange(index+2,1,1,8).setValues([row]);dayFirst(sheet.getRange(index+2,6));rows[index]=row;}
    else {if(rows.length+2>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);sheet.getRange(rows.length+2,1,1,8).setValues([row]);dayFirst(sheet.getRange(rows.length+2,6));rows.push(row);}
    existing[key][id]=best;
  }));
  return existing;
}
function bestIslandResult(a,b){
  const out={score:Math.max(a.score,b.score),stars:Math.max(a.stars,b.stars)};
  const coins=[a.coinPercent,b.coinPercent].filter(v=>Number.isInteger(v)&&v>=0&&v<=100);if(coins.length)out.coinPercent=Math.max.apply(null,coins);
  if(a.hardClear===true||b.hardClear===true)out.hardClear=true;return out;
}

var TeachingModel=(function(){
 'use strict';
 const validKey=key=>typeof key==='string'&&/^[5-8]-(10|[1-9])$/.test(key);
 function str(v,max,optional=false){if(optional&&v===undefined)return '';if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))throw Error('A text field is empty or too long.');return v.trim();}
 function question(q){
  if(!q||!['word','gap','question'].includes(q.kind))throw Error('Choose Word, Sentence or Question.');
  const choices=Array.isArray(q.choices)&&q.choices.length===3?q.choices.map(v=>str(v,65)):null;
  if(!choices||new Set(choices.map(v=>v.toLocaleLowerCase('tr'))).size!==3)throw Error('Each question needs three different choices.');
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>2)throw Error('Choose the correct answer.');
  const out={id:str(q.id,100),kind:q.kind,prompt:str(q.prompt,150),choices,answer:q.answer,instruction:str(q.instruction,80,true),explanation:str(q.explanation,200,true)};
  if(out.id==='#unit'||/^[=+@-]/.test(out.id))throw Error('Invalid question ID.');
  if(out.kind==='gap'&&!out.prompt.includes('___'))throw Error('Mark the sentence blank with three underscores: ___');
  if(q.concept)out.concept=str(q.concept,100);return out;
 }
 function clean(raw){
  if(!raw||typeof raw!=='object')throw Error('Invalid teaching content.');
  const out={objective:str(raw.objective,300,true),bank:null};
  if(raw.bank!==null&&raw.bank!==undefined){if(!Array.isArray(raw.bank)||raw.bank.length<1||raw.bank.length>400)throw Error('Use 1–400 questions per island.');out.bank=raw.bank.map(question);if(new Set(out.bank.map(q=>q.id)).size!==out.bank.length)throw Error('Question IDs must be unique.');}
  if(JSON.stringify(out).length>300000)throw Error('This bank is too large. Shorten the questions.');return out;
 }
 function bulk(text,prefix){
  const rows=text.trim().split(/\r?\n/).filter(v=>v.trim()).map(v=>v.split(v.includes('\t')?'\t':'|').map(x=>x.trim()));
  if(!rows.length)throw Error('Paste vocabulary or questions first.');
  if(rows.every(r=>r.length===2)){
   if(rows.length<3||new Set(rows.map(r=>r[0].toLocaleLowerCase('tr'))).size!==rows.length||new Set(rows.map(r=>r[1].toLocaleLowerCase('tr'))).size!==rows.length)throw Error('Paste at least three pairs with different words and meanings.');
   return rows.flatMap((r,i)=>[0,1].map(d=>question({id:prefix+'-'+i+'-'+d,kind:'word',prompt:r[d],choices:[r[1-d],rows[(i+1)%rows.length][1-d],rows[(i+2)%rows.length][1-d]],answer:0,instruction:d?'Find the English meaning':'Find the Turkish meaning',explanation:r[0]+' = '+r[1]})));
  }
  return rows.map((r,i)=>{if(r.length!==5)throw Error('Use: kind | prompt | correct answer | wrong answer | wrong answer');return question({id:prefix+'-'+i,kind:r[0],prompt:r[1],choices:r.slice(2),answer:0});});
 }
 return {validKey,question,clean,bulk};
})();
if(typeof module==='object'&&module.exports)module.exports=TeachingModel;

const TEACHING_HEADERS=['Unit','Revision','Objective JSON','Question ID','Question JSON'];
function teachingSheet(ss){
 const sh=ss.getSheetByName('Teaching_Content')||ss.insertSheet('Teaching_Content');
 if(!sh.getLastRow()){sh.getRange(1,1,1,5).setValues([TEACHING_HEADERS]).setFontWeight('bold');sh.setFrozenRows(1);}
 if(JSON.stringify(sh.getRange(1,1,1,5).getValues()[0])!==JSON.stringify(TEACHING_HEADERS))throw Error('Teaching_Content has different headers. Rename that tab first.');
 return sh;
}
function teachingRows(sh){return sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getValues().filter(r=>r[0]):[];}
function contentRevision(content){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(content),Utilities.Charset.UTF_8).map(b=>(b&255).toString(16).padStart(2,'0')).join('');}
function teachingUnit(rows,key){
 const selected=rows.filter(r=>r[0]===key),meta=selected.find(r=>r[3]==='#unit');
 const content=TeachingModel.clean(meta?{objective:JSON.parse(meta[2]),bank:JSON.parse(meta[4]).bank==='default'?null:selected.filter(r=>r[3]!=='#unit').map(r=>JSON.parse(r[4]))}:{objective:'',bank:null});
 return {content,revision:contentRevision(content),version:meta?Number(JSON.parse(meta[4]).version)||1:0};
}
function teachingCatalog(ss,grade){
 const rows=teachingRows(teachingSheet(ss)),units={};
 [...new Set(rows.map(r=>r[0]))].filter(k=>TeachingModel.validKey(k)&&Number(k[0])===grade).forEach(k=>units[k]=teachingUnit(rows,k));
 return {schema:1,grade,units};
}
function handleTeaching(ss,data){
 if(!TeachingModel.validKey(data.unit))throw Error('Choose a grade and island.');
 const sh=teachingSheet(ss),rows=teachingRows(sh),current=teachingUnit(rows,data.unit);
 if(data.type==='TEACHING_GET')return {status:'success',schema:1,unit:data.unit,...current};
 const next=TeachingModel.clean(data.content),revision=contentRevision(next);
 if(current.revision!==data.revision&&current.revision!==revision)return {status:'conflict',message:'Another device changed this unit. Reload online before saving.',schema:1,unit:data.unit,...current};
 if(current.revision!==revision){
  const keep=rows.filter(r=>r[0]!==data.unit),bank=next.bank||[];
  keep.push([data.unit,revision,JSON.stringify(next.objective),'#unit',JSON.stringify({bank:next.bank===null?'default':'custom',version:current.version+1})]);
  bank.forEach(q=>keep.push([data.unit,revision,'',q.id,JSON.stringify(q)]));
  const length=Math.max(rows.length,keep.length);while(keep.length<length)keep.push(['','','','','']);
  if(sh.getMaxRows()<length+1)sh.insertRowsAfter(sh.getMaxRows(),length+1-sh.getMaxRows());
  sh.getRange(2,1,length,5).setValues(keep);
 }
 return {status:'success',schema:1,unit:data.unit,content:next,revision,version:current.revision===revision?current.version:current.version+1};
}


// v9.3.0: Island Run team answers. One row per answer; Row ID prevents duplicates when a session is saved again.
// v10.4.0 Challenge Deck: one row per card dealt by the English wheel. Result is Right, Wrong or Skipped; a wrong
// answer took the team back to the level before the wheel. Rows are never written twice (Row ID).
const CHALLENGE_HEADERS=['Date','Class','Team','Student','Student ID','Wheel level','Card','Word','Island','Result','Row ID','Session ID'];
const CHALLENGE_TYPES=['Vocabulary','Grammar','Pronunciation','Speaking','Listening','Sentence Repair','Taboo Description','Translation','Ask a Question'];
// v11.0.0: Merge Spell answers are logged as "Merge · <card>" (Level 12, the raid's level).
const MERGE_TYPES=['Vocabulary','Translation','Grammar','Sentence Repair','Ask a Question'].map(function(t){return 'Merge · '+t;});
// v12.0.0: Act I (the True Rune, Level 10) and Act II (the Scarlet Brand rescue, Level 11).
const TRIAL_TYPES=['Rune','Brand'].reduce(function(all,kind){return all.concat(['Vocabulary','Translation','Grammar','Sentence Repair','Ask a Question'].map(function(t){return kind+' · '+t;}));},[]);
const SAGA_ANSWER_TYPES=MERGE_TYPES.concat(TRIAL_TYPES);
const CHALLENGE_RESULTS={right:'Right',wrong:'Wrong',skipped:'Skipped'};
function validateChallengeRows(rows,className){
  if(!Array.isArray(rows)||rows.length>200)throw Error('Challenge cards must be a list of no more than 200 rows.');
  validIslandClass(className);
  const text=(v,max)=>v===undefined||typeof v==='string'&&v.length<=max;
  return rows.map(r=>{
    const at=Number(r&&r.at),level=Number(r&&r.level),island=Number(r&&r.island);
    if(!r||typeof r.id!=='string'||!/^[A-Za-z0-9:_.-]{3,140}$/.test(r.id)||r.className!==className||!Number.isFinite(at)||at<1.5e12||at>4e12
      ||['Gryffindor','Hufflepuff','Slytherin','Ravenclaw','Practice'].indexOf(r.team)<0||[0,5,10,11,12].indexOf(level)<0||(CHALLENGE_TYPES.indexOf(r.type)<0&&SAGA_ANSWER_TYPES.indexOf(r.type)<0)||(MERGE_TYPES.indexOf(r.type)>=0&&(level!==12||r.team==='Practice'))
      ||(TRIAL_TYPES.indexOf(r.type)>=0&&(level!==(r.type.indexOf('Rune')===0?10:11)||r.team==='Practice'))
      ||!Number.isInteger(island)||island<1||island>10||!CHALLENGE_RESULTS[r.result]||!text(r.student,80)||!text(r.studentId,120)||!text(r.word,120))throw Error('Invalid Challenge Deck row.');
    return {id:r.id,at:Math.round(at),className:className,team:r.team,student:r.student||'',studentId:r.studentId||'',level:level,type:r.type,word:r.word||'',island:island,result:r.result};
  });
}
function challengeSheet(ss){
  const sheet=ss.getSheetByName('Challenge_Log')||ss.insertSheet('Challenge_Log');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,CHALLENGE_HEADERS.length).setValues([CHALLENGE_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,CHALLENGE_HEADERS.length).getValues()[0])!==JSON.stringify(CHALLENGE_HEADERS))throw Error('Challenge_Log has different headers. Rename that tab before saving.');
  return sheet;
}
function appendChallengeLog(ss,rows){
  const sheet=challengeSheet(ss),values=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,CHALLENGE_HEADERS.length).getValues():[],seen={};
  values.forEach(r=>{seen[String(r[10]).replace(/^'/,'')]=true;});
  const fresh=rows.filter(r=>!seen[r.id]&&(seen[r.id]=true));
  if(!fresh.length)return 0;
  const out=fresh.map(r=>[new Date(r.at),r.className,r.team,sheetText(r.student),sheetText(r.studentId),r.level||'',r.type,sheetText(r.word),r.island,CHALLENGE_RESULTS[r.result],sheetText(r.id),sheetText(String(r.id).replace(/-c\d+$/,''))]);
  const start=values.length+2;if(start+out.length-1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),out.length+50);
  sheet.getRange(start,1,out.length,CHALLENGE_HEADERS.length).setValues(out);dayFirst(sheet.getRange(start,1,out.length,1));
  return out.length;
}
const QUESTION_HEADERS=['Date','Class','Team','Grade','Island','Question ID','Concept','Kind','Format','Correct','Second chance','Review','Chose lane','Picked','Answer','Prompt','Row ID','Session ID','Time (ms)'];
const SUMMARY_HEADERS=['Class','Concept','Example prompt','Attempts','Correct','Wrong','Accuracy','Last wrong','In review'];
const QUESTION_TEAMS=['gryffindor','hufflepuff','slytherin','ravenclaw'];
function sheetText(value){const text=String(value===undefined||value===null?'':value);return /^[=+@-]/.test(text)?"'"+text:text;}
function validateQuestionRows(rows,className){
  if(!Array.isArray(rows)||rows.length>400)throw Error('Island Run answers must be a list of no more than 400 rows.');
  validIslandClass(className);
  const text=(v,max,required)=>typeof v==='string'&&v.length<=max&&(!required||v.length>0);
  return rows.map(r=>{
    const t=Number(r&&r.t),g=Number(r&&r.g),i=Number(r&&r.i);
    if(!r||!text(r.id,140,true)||!/^[A-Za-z0-9:_.-]{3,140}$/.test(r.id)||r.c!==className||QUESTION_TEAMS.indexOf(r.h)<0
      ||!Number.isFinite(t)||t<1.5e12||t>4e12||g!==Number(className[0])||!Number.isInteger(i)||i<1||i>10
      ||!text(r.q,100,true)||!text(r.k,100,true)||['word','gap','question','spell'].indexOf(r.y)<0||['text','listen','picture','spell'].indexOf(r.f)<0||typeof r.ok!=='boolean'
      ||(r.p!==undefined&&!text(r.p,80))||(r.a!==undefined&&!text(r.a,80))||(r.x!==undefined&&!text(r.x,160))||(r.s!==undefined&&!text(r.s,120)))throw Error('Invalid Island Run answer row.');
    return {id:r.id,t:Math.round(t),s:r.s||'',c:r.c,h:r.h,g:g,i:i,q:r.q,k:r.k,y:r.y,f:r.f,ok:r.ok,e:r.e===true,v:r.v===true,m:r.m===true,p:r.p||'',a:r.a||'',x:r.x||''};
  });
}
function questionSheet(ss){
  const sheet=ss.getSheetByName('Question_Log')||ss.insertSheet('Question_Log');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,QUESTION_HEADERS.length).setValues([QUESTION_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,QUESTION_HEADERS.length).getValues()[0])!==JSON.stringify(QUESTION_HEADERS))throw Error('Question_Log has different headers. Rename that tab before saving.');
  return sheet;
}
function questionValues(sheet){return sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,QUESTION_HEADERS.length).getValues():[];}
function rowFromSheet(r){
  const unquote=v=>{const t=String(v===undefined||v===null?'':v);return t.charAt(0)==="'"?t.slice(1):t;};
  return {id:unquote(r[16]),t:Number(r[18]),s:unquote(r[17]),c:unquote(r[1]),h:unquote(r[2]).toLowerCase(),g:Number(r[3]),i:Number(r[4]),q:unquote(r[5]),k:unquote(r[6]),y:unquote(r[7]),f:unquote(r[8]),
    ok:r[9]==='Yes'||r[9]===true,e:r[10]==='Yes'||r[10]===true,v:r[11]==='Yes'||r[11]===true,m:r[12]==='Yes'||r[12]===true,p:unquote(r[13]),a:unquote(r[14]),x:unquote(r[15])};
}
function readQuestionLog(ss,className){
  return questionValues(questionSheet(ss)).filter(r=>r[1]===className).map(rowFromSheet)
    .filter(r=>r.id&&Number.isFinite(r.t)&&QUESTION_TEAMS.indexOf(r.h)>=0).sort((a,b)=>a.t-b.t);
}
function appendQuestionLog(ss,rows){
  const sheet=questionSheet(ss),values=questionValues(sheet),seen={};values.forEach(r=>{seen[String(r[16]).replace(/^'/,'')]=true;});
  const yes=v=>v?'Yes':'',fresh=rows.filter(r=>!seen[r.id]&&(seen[r.id]=true));
  if(!fresh.length)return 0;
  const out=fresh.map(r=>[new Date(r.t),r.c,r.h.charAt(0).toUpperCase()+r.h.slice(1),r.g,r.i,sheetText(r.q),sheetText(r.k),r.y,r.f,r.ok?'Yes':'No',yes(r.e),yes(r.v),r.m?'Yes':'No',sheetText(r.p),sheetText(r.a),sheetText(r.x),sheetText(r.id),sheetText(r.s),r.t]);
  const start=values.length+2;if(start+out.length-1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),out.length+50);
  sheet.getRange(start,1,out.length,QUESTION_HEADERS.length).setValues(out);dayFirst(sheet.getRange(start,1,out.length,1));
  rebuildQuestionSummary(ss,questionValues(sheet).map(rowFromSheet));
  return out.length;
}
// The same rule the board uses: a wrong answer starts review; correct answers in two later runs end it.
function rebuildQuestionSummary(ss,rows){
  const sheet=ss.getSheetByName('Question_Summary')||ss.insertSheet('Question_Summary'),groups={};
  if(sheet.getLastRow()>0&&String(sheet.getRange(1,1,1,1).getValues()[0][0])!=='Class')throw Error('Question_Summary contains other data. Rename that tab before saving.');
  rows.slice().sort((a,b)=>a.t-b.t).forEach(r=>{
    if(r.f==='spell')return;
    const key=r.c+'|'+r.k,g=groups[key]||(groups[key]={c:r.c,k:r.k,prompt:'',attempts:0,correct:0,wrong:0,lastWrong:0,review:false,runs:{}});
    if(!g.prompt||!r.ok)g.prompt=r.x||g.prompt;g.attempts++;
    if(r.ok){g.correct++;if(g.review&&!r.e){g.runs[r.id.slice(0,r.id.lastIndexOf(':'))]=true;if(Object.keys(g.runs).length>=2)g.review=false;}}
    else{g.wrong++;g.lastWrong=Math.max(g.lastWrong,r.t);if(!r.e){g.review=true;g.runs={};}}
  });
  const out=Object.keys(groups).map(k=>groups[k]).sort((a,b)=>a.c.localeCompare(b.c)||b.wrong-a.wrong||a.k.localeCompare(b.k))
    .map(g=>[g.c,sheetText(g.k),sheetText(g.prompt),g.attempts,g.correct,g.wrong,Math.round(g.correct/g.attempts*100)+'%',g.lastWrong?new Date(g.lastWrong):'',g.review?'Yes':'']);
  sheet.clearContents();
  sheet.getRange(1,1,1,SUMMARY_HEADERS.length).setValues([SUMMARY_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);
  if(out.length){if(out.length+1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),out.length+1-sheet.getMaxRows());sheet.getRange(2,1,out.length,SUMMARY_HEADERS.length).setValues(out);dayFirst(sheet.getRange(2,8,out.length,1),DATE_ONLY_FORMAT);}
}

// ---- v9.6.0 · Student_Contributions: one row per student per session, with the number of contributions ----
// The board sends every student of the class (zero included) under studentContributions.everyone; older boards send
// only contributors under studentContributions.teams. Re-saving a session updates its rows.
// v12.0.0: every row carries the student's roster ID; rows are matched by ID within a session (by team and name only
// for rows saved before IDs). Example students (IDs "example-…", shown before anyone signs in) are never saved.
const STUDENT_ID_PATTERN = /^[A-Za-z0-9:_-]{1,100}$/;
function validateContributionRows(summary){
  const rows=[];rows.skipped=0;
  if(!summary||typeof summary!=='object')return rows;
  const source=summary.everyone&&typeof summary.everyone==='object'?summary.everyone:(summary.teams&&typeof summary.teams==='object'?summary.teams:null);
  if(!source)return rows;
  const seen={};
  Object.keys(CONTRIBUTION_TEAMS).forEach(teamId=>{
    const list=source[teamId];if(list===undefined)return;
    if(!Array.isArray(list))throw Error('Student contributions must be a list per team.');
    list.forEach(student=>{
      const name=String(student&&student.name||'').trim(),awards=Number(student&&student.awards);
      const id=student&&student.id!==undefined&&student.id!==null?String(student.id):'';
      if(!name||name.length>80)throw Error('A student name in the contributions is empty or too long.');
      if(!Number.isInteger(awards)||awards<0||awards>100000)throw Error('A contribution count is invalid.');
      if(id&&!STUDENT_ID_PATTERN.test(id))throw Error('A student ID in the contributions is invalid.');
      if(id.indexOf('example-')===0){rows.skipped+=awards;return;}
      const key=id?'id|'+id:teamId+'|'+name;if(seen[key])return;seen[key]=true;
      rows.push({team:CONTRIBUTION_TEAMS[teamId],name,awards,id});
    });
  });
  if(rows.length>300)throw Error('Too many students in one session record.');
  return rows;
}
function contributionSheet(ss){
  const sheet=ss.getSheetByName('Student_Contributions')||ss.insertSheet('Student_Contributions');
  const width=CONTRIBUTION_HEADERS.length;
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,width).setValues([CONTRIBUTION_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  const headers=sheet.getRange(1,1,1,width).getValues()[0].map(v=>String(v||'').trim());
  if(headers.slice(0,6).join('|')!==CONTRIBUTION_HEADERS.slice(0,6).join('|'))throw Error('Student_Contributions columns A–F must keep their headers: '+CONTRIBUTION_HEADERS.slice(0,6).join(', ')+'.');
  if(headers.slice(6).join('|')!==CONTRIBUTION_HEADERS.slice(6).join('|')){
    if(headers[6]||headers[7])throw Error('Student_Contributions columns G–H must be empty or keep the headers Student ID, ID source.');
    sheet.getRange(1,7,1,2).setValues([CONTRIBUTION_HEADERS.slice(6)]).setFontWeight('bold');
  }
  if(PropertiesService.getScriptProperties().getProperty('ENGLISH_LEAGUE_CONTRIBUTION_IDS')!=='1')matchContributionIds_(ss,sheet);
  return sheet;
}
function writeContributions(ss,rows,meta){
  const width=CONTRIBUTION_HEADERS.length;
  const sheet=contributionSheet(ss),className=sheetText(meta.className),sessionId=meta.sessionId?String(meta.sessionId):'';
  const last=sheet.getLastRow(),existing=last>1?sheet.getRange(2,1,last-1,width).getValues():[],byId={},byName={};
  if(sessionId)existing.forEach((r,i)=>{
    if(String(r[5])!==sessionId||String(r[1])!==className)return;
    const id=String(r[6]||'');
    if(id)byId[id]=i+2;else byName[r[2]+'|'+r[3]]=i+2;
  });
  const fresh=[];let written=0;
  rows.forEach(row=>{
    const name=sheetText(row.name);
    let at=sessionId&&row.id?byId[row.id]:undefined;
    if(!at&&sessionId)at=byName[row.team+'|'+name];
    if(at){
      sheet.getRange(at,5,1,1).setValues([[row.awards]]);
      // A row first saved before IDs gets its ID now; the name and team stay as the lesson had them.
      if(row.id&&!byId[row.id]){sheet.getRange(at,7,1,2).setValues([[row.id,'board']]);byId[row.id]=at;}
      written++;
    }
    else fresh.push([meta.date,className,row.team,name,row.awards,sessionId,row.id||'',row.id?'board':'']);
  });
  if(fresh.length){sheet.getRange(Math.max(2,last+1),1,fresh.length,width).setValues(fresh);dayFirst(sheet.getRange(Math.max(2,last+1),1,fresh.length,1));written+=fresh.length;}
  return {written};
}
// Gives rows saved before v12.0.0 their student ID, once: the Roster tab (current names) and Navigator_Seals (names as
// they were) say which ID a class's name belonged to. A name that matches one student in the team (or else one in the
// class) gets that ID; a name shared by two students stays blank as "ambiguous"; a name not found stays "unmatched".
function rosterNameKey_(name){return String(name===undefined||name===null?'':name).replace(/^'/,'').trim().normalize('NFC').toLocaleLowerCase('tr');}
function studentIdIndex_(ss){
  const index={};
  const add=(className,team,name,id)=>{
    if(!STUDENT_ID_PATTERN.test(id)||!className||!name)return;
    [className+'|'+team+'|'+rosterNameKey_(name),className+'||'+rosterNameKey_(name)].forEach(k=>{(index[k]=index[k]||{})[id]=true;});
  };
  const roster=ss.getSheetByName('Roster');
  if(roster&&roster.getLastRow()>1)roster.getRange(2,1,roster.getLastRow()-1,5).getValues().forEach(r=>add(String(r[1]),String(r[3]).toLowerCase(),r[2],String(r[0])));
  const seals=ss.getSheetByName('Navigator_Seals');
  if(seals&&seals.getLastRow()>1)seals.getRange(2,1,seals.getLastRow()-1,NAVIGATOR_HEADERS.length).getValues().forEach(r=>add(String(r[1]).replace(/^'/,''),String(r[2]).toLowerCase(),r[3],String(r[4])));
  return index;
}
function matchContributionIds_(ss,sheet){
  const width=CONTRIBUTION_HEADERS.length,last=sheet.getLastRow(),report={matched:0,ambiguous:0,unmatched:0,kept:0};
  if(last>1){
    const index=studentIdIndex_(ss),range=sheet.getRange(2,7,last-1,2),values=sheet.getRange(2,1,last-1,width).getValues();
    const out=values.map(r=>{
      if(String(r[6]||'')){report.kept++;return [r[6],r[7]||'board'];}
      if(!String(r[3]||'').trim())return ['',''];
      const className=String(r[1]).replace(/^'/,''),team=String(r[2]).toLowerCase(),name=rosterNameKey_(r[3]);
      const inTeam=Object.keys(index[className+'|'+team+'|'+name]||{}),inClass=Object.keys(index[className+'||'+name]||{});
      if(inTeam.length===1){report.matched++;return [inTeam[0],'matched by name and team'];}
      if(!inTeam.length&&inClass.length===1){report.matched++;return [inClass[0],'matched by name in class'];}
      if(inTeam.length>1||inClass.length>1){report.ambiguous++;return ['','ambiguous: same name'];}
      report.unmatched++;return ['','unmatched'];
    });
    range.setValues(out);
  }
  PropertiesService.getScriptProperties().setProperty('ENGLISH_LEAGUE_CONTRIBUTION_IDS','1');
  return report;
}
// Menu → Match student IDs in older contributions (also safe to run again after editing the Roster tab).
function migrateStudentIds(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw Error('A save is in progress. Try again in a moment.');
  try{
    const sheet=ss.getSheetByName('Student_Contributions');
    if(!sheet||sheet.getLastRow()<2)return 'No contribution rows yet.';
    contributionSheet(ss);
    const r=matchContributionIds_(ss,sheet);
    const text='Student IDs: '+r.kept+' already set, '+r.matched+' matched, '+r.ambiguous+' ambiguous, '+r.unmatched+' unmatched.';
    Logger.log(text);return text;
  }finally{lock.releaseLock();}
}

// ---- v9.7.0 · Navigator_Seals: the island seals each student earned as the session's Island Run navigator ----
// One row per class, student and island; saving the same seal again changes nothing. Rows are matched by the
// roster's student ID, so a renamed student keeps their seals.
function validateNavigatorSeals(list,className){
  if(!Array.isArray(list))throw Error('Navigator seals must be a list.');
  if(list.length>600)throw Error('Too many navigator seals in one record.');
  const out=[],seen={};
  list.forEach(item=>{
    const id=String(item&&item.studentId||''),name=String(item&&item.student||'').trim(),team=CONTRIBUTION_TEAMS[item&&item.team],island=Number(item&&item.island);
    const sessionId=item&&item.sessionId!==undefined&&item.sessionId!==null?String(item.sessionId):'';
    if(!/^[A-Za-z0-9:_-]{1,100}$/.test(id))throw Error('A navigator seal has an invalid student ID.');
    if(!name||name.length>80)throw Error('A navigator seal has an empty or too long student name.');
    if(!team)throw Error('A navigator seal has an unknown team.');
    if(!Number.isInteger(island)||island<1||island>10)throw Error('A navigator seal must name island 1 to 10.');
    if(sessionId&&!/^[A-Za-z0-9_-]{1,120}$/.test(sessionId))throw Error('A navigator seal has an invalid session ID.');
    const key=id+'|'+island;if(seen[key])return;seen[key]=true;
    out.push({studentId:id,student:name,team,island,sessionId,className});
  });
  return out;
}
function navigatorSheet(ss){
  const sheet=ss.getSheetByName('Navigator_Seals')||ss.insertSheet('Navigator_Seals');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,NAVIGATOR_HEADERS.length).setValues([NAVIGATOR_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  const headers=sheet.getRange(1,1,1,NAVIGATOR_HEADERS.length).getValues()[0].map(v=>String(v||'').trim());
  if(headers.join('|')!==NAVIGATOR_HEADERS.join('|'))throw Error('Navigator_Seals columns A–H must keep their headers: '+NAVIGATOR_HEADERS.join(', ')+'.');
  return sheet;
}
function writeNavigatorSeals(ss,rows,meta){
  const sheet=navigatorSheet(ss),className=sheetText(meta.className),last=sheet.getLastRow();
  const existing=last>1?sheet.getRange(2,1,last-1,NAVIGATOR_HEADERS.length).getValues():[],have={};
  existing.forEach(r=>{have[String(r[1])+'|'+String(r[4])+'|'+Number(r[5])]=true;});
  const fresh=[];
  rows.forEach(row=>{
    const key=className+'|'+row.studentId+'|'+row.island;if(have[key])return;have[key]=true;
    fresh.push([meta.date,className,row.team,sheetText(row.student),row.studentId,row.island,GUARDIAN_NAMES[row.island-1],row.sessionId]);
  });
  if(fresh.length){sheet.getRange(Math.max(2,last+1),1,fresh.length,NAVIGATOR_HEADERS.length).setValues(fresh);dayFirst(sheet.getRange(Math.max(2,last+1),1,fresh.length,1));}
  return fresh.length;
}
function readNavigatorSeals(ss,className){
  const sheet=ss.getSheetByName('Navigator_Seals');if(!sheet||sheet.getLastRow()<2)return [];
  const teams={};Object.keys(CONTRIBUTION_TEAMS).forEach(id=>{teams[CONTRIBUTION_TEAMS[id]]=id;});
  return sheet.getRange(2,1,sheet.getLastRow()-1,NAVIGATOR_HEADERS.length).getValues()
    .filter(r=>String(r[1])===className&&teams[String(r[2])]&&/^[A-Za-z0-9:_-]{1,100}$/.test(String(r[4]))&&Number(r[5])>=1&&Number(r[5])<=10)
    .map(r=>({studentId:String(r[4]),student:String(r[3]).replace(/^'/,''),team:teams[String(r[2])],island:Number(r[5]),sessionId:String(r[7]||'')}))
    .slice(-1000);
}

// ---- v10.0.0 · School League Season ----
// One season for the whole school, every class together, every saved session counted (older ones too).
// League: the team(s) with the top score in a Leaderboard row win once each (a shared title gives each tied
// team a win). Arena: the Battle_Results winner wins once. A Grand Champion therefore wins twice.
// A session saved again replaces its own row (Session ID), so it is never counted twice.
const SEASON_TEAMS = {gryffindor:'gryffindor',hufflepuff:'hufflepuff',slytherin:'slytherin',ravenclaw:'ravenclaw'};
function seasonTeam(text){const m=String(text||'').match(/\b(gryffindor|hufflepuff|slytherin|ravenclaw)\b/i);return m?SEASON_TEAMS[m[1].toLowerCase()]:null;}
function seasonStanding(cell){const team=seasonTeam(cell);if(!team)return null;const m=String(cell).match(/\((-?\d+(?:\.\d+)?)\s*pts/i);return {team,points:m?Number(m[1]):null};}
function readSeason(ss){
  const wins={gryffindor:0,hufflepuff:0,slytherin:0,ravenclaw:0},classes={},ids=[],seen={};let sessions=0;
  const count=(className,sessionId)=>{if(className)classes[className]=true;if(sessionId){if(seen[sessionId])return;seen[sessionId]=true;ids.push(sessionId);}sessions++;};
  const board=ss.getSheetByName('Leaderboard');
  if(board&&board.getLastRow()>1)board.getRange(2,1,board.getLastRow()-1,13).getValues().forEach(r=>{
    const standings=[r[2],r[3],r[4],r[5]].map(seasonStanding).filter(Boolean);if(!standings.length)return;
    const scored=standings.filter(s=>s.points!==null);
    let champions=[standings[0].team];
    if(scored.length){const top=Math.max.apply(null,scored.map(s=>s.points));champions=scored.filter(s=>s.points===top).map(s=>s.team);}
    champions.filter((t,i,a)=>a.indexOf(t)===i).forEach(t=>{wins[t]++;});
    count(String(r[1]||'').trim(),String(r[12]||'').trim());
  });
  const battles=ss.getSheetByName('Battle_Results');
  if(battles&&battles.getLastRow()>1)battles.getRange(2,1,battles.getLastRow()-1,7).getValues().forEach(r=>{
    const team=seasonTeam(r[2]);if(!team)return;wins[team]++;
    const id=String(r[6]||'').trim();if(!id||!seen[id])count(String(r[1]||'').trim(),id);
  });
  return {wins,sessions,classes:Object.keys(classes).filter(c=>/^[0-9]+-[A-Z]$/.test(c)).sort(),recent:ids.filter(id=>/^[A-Za-z0-9_-]{1,120}$/.test(id)).slice(-1000)};
}

// ---- v10.1.2 · formatOldDates: run once from the Apps Script editor (choose formatOldDates, then Run) ----
// Earlier versions wrote dates as US-style text such as "10/5/2026, 7:46:12 PM" (month first) or as ISO text
// such as "2026-10-05T16:46:12.000Z". This turns them into real dates shown DD/MM/YYYY. Cells that are already
// dates only get the day-first format; anything else (notes, hand-typed text) is left exactly as it is.
// Running it again changes nothing.
const OLD_DATE_COLUMNS = [['Leaderboard',1],['Battle_Results',1],['Student_Contributions',1],['Navigator_Seals',1],['Island_Progress',6],['Question_Log',1],['Question_Summary',8,DATE_ONLY_FORMAT]];
function oldDateValue(value){
  if(value instanceof Date)return isNaN(value.getTime())?null:value;
  const text=String(value===undefined||value===null?'':value).trim();
  let m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?$/i);
  if(m){let hour=Number(m[4]);const half=(m[7]||'').toUpperCase();if(half==='PM'&&hour<12)hour+=12;if(half==='AM'&&hour===12)hour=0;
   const d=new Date(Number(m[3]),Number(m[1])-1,Number(m[2]),hour,Number(m[5]),Number(m[6]||0));
   return d.getMonth()===Number(m[1])-1&&d.getDate()===Number(m[2])?d:null;}
  m=text.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/);
  if(m){const d=m[1]?new Date(text):new Date(Number(text.slice(0,4)),Number(text.slice(5,7))-1,Number(text.slice(8,10)));return isNaN(d.getTime())?null:d;}
  return null;
}
function formatOldDates(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),lock=LockService.getScriptLock(),report=[];
  if(!lock.tryLock(30000))throw Error('A save is in progress. Try again in a moment.');
  try{
    OLD_DATE_COLUMNS.forEach(([name,column,format])=>{
      const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()<2)return;
      // One read and at most two writes per tab, so large tabs finish quickly.
      const range=sheet.getRange(2,column,sheet.getLastRow()-1,1),values=range.getValues(),formats=range.getNumberFormats();let changed=0;
      const out=values.map((r,i)=>{const d=oldDateValue(r[0]);if(!d)return [r[0]];formats[i]=[format||DATE_TIME_FORMAT];if(!(r[0] instanceof Date))changed++;return [d];});
      if(changed)range.setValues(out);
      range.setNumberFormats(formats);
      report.push(name+': '+changed+' converted');
    });
  }finally{lock.releaseLock();}
  return report.join(' · ');
}

// ---- v10.2.0 · Comeback Halo: the class's last saved session ----
// League title holder(s) from the class's latest Leaderboard row (a shared title counts every tied team) and the
// Arena champion from Battle_Results: the same session when both were saved, otherwise whichever was saved later.
// Every team that won neither earns ×2 in the class's next session (decided on the board).
function lastSessionFor(ss,className){
  const when=v=>{const d=oldDateValue(v);return d?d.getTime():0;},same=v=>String(v||'').trim();
  let league=null,arena=null,battleRows=[];
  const board=ss.getSheetByName('Leaderboard');
  if(board&&board.getLastRow()>1)board.getRange(2,1,board.getLastRow()-1,13).getValues().forEach(r=>{
    if(same(r[1])!==className)return;
    const standings=[r[2],r[3],r[4],r[5]].map(seasonStanding).filter(Boolean);if(!standings.length)return;
    const scored=standings.filter(s=>s.points!==null);let champions=[standings[0].team];
    if(scored.length){const top=Math.max.apply(null,scored.map(s=>s.points));champions=scored.filter(s=>s.points===top).map(s=>s.team);}
    league={sessionId:same(r[12]),at:when(r[0]),teams:champions.filter((t,i,a)=>a.indexOf(t)===i)};
  });
  const battles=ss.getSheetByName('Battle_Results');
  if(battles&&battles.getLastRow()>1)battleRows=battles.getRange(2,1,battles.getLastRow()-1,7).getValues().filter(r=>same(r[1])===className&&seasonTeam(r[2]));
  const arenaOf=r=>({sessionId:same(r[6]),at:when(r[0]),team:seasonTeam(r[2])});
  const lastArena=battleRows.length?arenaOf(battleRows[battleRows.length-1]):null;
  const id=(x,at)=>/^[A-Za-z0-9_-]{1,120}$/.test(x)?x:'sheet-'+at;
  const arenaOnly=a=>({sessionId:id(a.sessionId,a.at),at:a.at,league:[],arena:a.team});
  if(!league)return lastArena?arenaOnly(lastArena):null;
  // The Arena of the same session as the latest League row (rows from before Session IDs: saved within 6 hours).
  let paired=null;
  if(league.sessionId){const match=battleRows.filter(r=>same(r[6])===league.sessionId).pop();if(match)paired=arenaOf(match);}
  else if(lastArena&&!lastArena.sessionId&&Math.abs(league.at-lastArena.at)<6*3600000)paired=lastArena;
  // A later Arena-only save is a later session.
  const lastIsPaired=Boolean(paired&&lastArena&&(league.sessionId?lastArena.sessionId===league.sessionId:paired===lastArena));
  if(lastArena&&!lastIsPaired&&lastArena.at>league.at)return arenaOnly(lastArena);
  return {sessionId:id(league.sessionId,league.at),at:Math.max(league.at,paired?paired.at:0),league:league.teams,arena:paired?paired.team:null};
}


// ---- v11.0.0 · The Vixar Saga ----
// One row per class. A won stage is never taken back by a save: the furthest stage is kept, and the same session's win
// cannot advance twice (the board sends the whole row, never "advance by one"). Only Set stage (a teacher correction,
// with the PIN) moves a class back; it is written in Corrections.
const SAGA_HEADERS=['Class','Stage','Level cap','Attempts at current form','Violet won','Scarlet won','Gilded won','Last session ID','Corrections','Corrected at','Fight sessions','Updated'];
const SAGA_STAGES=['Violet','Scarlet','Gilded','Freed'];
const SAGA_CAPS={Violet:10,Scarlet:11,Gilded:12,Freed:12};
const SAGA_FORMS=['Violet','Scarlet','Gilded'];
function sagaSheet(ss){
  const sheet=ss.getSheetByName('Vixar_Saga')||ss.insertSheet('Vixar_Saga');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,SAGA_HEADERS.length).setValues([SAGA_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,SAGA_HEADERS.length).getValues()[0])!==JSON.stringify(SAGA_HEADERS))throw Error('Vixar_Saga has different headers. Rename that tab before saving.');
  return sheet;
}
function sagaTime(v){const d=v instanceof Date?v:oldDateValue(v);const n=d?d.getTime():Number(v);return Number.isFinite(n)&&n>1.4e12&&n<4.2e12?Math.round(n):0;}
function sagaSessionOk(s){return typeof s==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(s);}
function sagaBlank(className){return {className:className,stage:'Violet',attempts:0,won:{Violet:0,Scarlet:0,Gilded:0},lastSessionId:'',fightSessions:[],corrections:[],correctionsText:'',updatedAt:0,correctedAt:0};}
function cleanSaga(raw,className){
  const row=sagaBlank(className);if(!raw||typeof raw!=='object')return row;
  if(SAGA_STAGES.indexOf(raw.stage)>=0)row.stage=raw.stage;
  const attempts=Number(raw.attempts);row.attempts=Math.floor(attempts)===attempts&&attempts>=0&&attempts<=1000?attempts:0;
  SAGA_FORMS.forEach(function(s){row.won[s]=sagaTime(raw.won&&raw.won[s]);});
  row.lastSessionId=sagaSessionOk(raw.lastSessionId)?raw.lastSessionId:'';
  row.fightSessions=Array.isArray(raw.fightSessions)?raw.fightSessions.filter(sagaSessionOk).filter(function(v,i,a){return a.indexOf(v)===i;}).slice(-40):[];
  row.corrections=Array.isArray(raw.corrections)?raw.corrections.filter(function(x){return x&&sagaTime(x.at)&&SAGA_STAGES.indexOf(x.to)>=0;}).map(function(x){return {at:sagaTime(x.at),from:SAGA_STAGES.indexOf(x.from)>=0?x.from:'',to:x.to,note:String(x.note||'').slice(0,80)};}).slice(-20):[];
  row.updatedAt=sagaTime(raw.updatedAt);row.correctedAt=sagaTime(raw.correctedAt);
  return row;
}
function sagaRows(sheet){return sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,SAGA_HEADERS.length).getValues():[];}
function readSaga(ss,className){
  const sheet=ss.getSheetByName('Vixar_Saga');if(!sheet||sheet.getLastRow()<2)return sagaBlank(className);
  const r=sagaRows(sheet).filter(function(x){return String(x[0])===className;})[0];if(!r)return sagaBlank(className);
  const row=sagaBlank(className);
  row.stage=SAGA_STAGES.indexOf(String(r[1]))>=0?String(r[1]):'Violet';
  row.attempts=Math.max(0,Math.floor(Number(r[3])||0));
  row.won={Violet:sagaTime(r[4]),Scarlet:sagaTime(r[5]),Gilded:sagaTime(r[6])};
  row.lastSessionId=sagaSessionOk(String(r[7]||''))?String(r[7]):'';
  row.correctionsText=String(r[8]||'');row.correctedAt=sagaTime(r[9]);
  if(row.correctedAt)row.corrections=[{at:row.correctedAt,from:'',to:row.stage,note:'Sheet correction'}];
  row.fightSessions=String(r[10]||'').split(',').map(function(x){return x.trim();}).filter(sagaSessionOk).slice(-40);
  row.updatedAt=sagaTime(r[11]);
  return row;
}
// The same rule as the board (vixar-saga.js): a correction newer than everything the other copy did wins; otherwise the
// furthest stage is kept, with the attempts of the copy that holds it.
function mergeSaga(a,b){
  const union=function(x,y){return x.concat(y).filter(function(v,i,arr){return arr.indexOf(v)===i;}).slice(-40);};
  if(b.correctedAt>a.correctedAt&&b.correctedAt>=a.updatedAt){const out=JSON.parse(JSON.stringify(b));out.fightSessions=union(a.fightSessions,b.fightSessions);out.correctionsText=a.correctionsText;return out;}
  if(a.correctedAt>b.correctedAt&&a.correctedAt>=b.updatedAt){const out=JSON.parse(JSON.stringify(a));out.fightSessions=union(a.fightSessions,b.fightSessions);return out;}
  const ia=SAGA_STAGES.indexOf(a.stage),ib=SAGA_STAGES.indexOf(b.stage);
  const ahead=ib>ia?b:ia>ib?a:(b.attempts>a.attempts?b:a);
  const out=JSON.parse(JSON.stringify(ahead));
  SAGA_FORMS.forEach(function(s){const x=[a.won[s],b.won[s]].filter(Boolean);out.won[s]=SAGA_STAGES.indexOf(s)<SAGA_STAGES.indexOf(out.stage)&&x.length?Math.min.apply(null,x):0;});
  out.lastSessionId=(b.updatedAt>a.updatedAt?b:a).lastSessionId||ahead.lastSessionId;
  out.fightSessions=union(a.fightSessions,b.fightSessions);out.correctionsText=a.correctionsText;out.correctedAt=Math.max(a.correctedAt,b.correctedAt);
  out.updatedAt=Math.max(a.updatedAt,b.updatedAt);
  return out;
}
function writeSaga(ss,row){
  const sheet=sagaSheet(ss),values=sagaRows(sheet);
  let at=-1;values.forEach(function(r,i){if(String(r[0])===row.className)at=i;});
  const date=function(ms){return ms?new Date(ms):'';};
  const out=[row.className,row.stage,SAGA_CAPS[row.stage],row.attempts,date(row.won.Violet),date(row.won.Scarlet),date(row.won.Gilded),sheetText(row.lastSessionId),
    sheetText(row.correctionsText||''),date(row.correctedAt),sheetText(row.fightSessions.join(',')),new Date()];
  const line=at>=0?at+2:values.length+2;
  sheet.getRange(line,1,1,SAGA_HEADERS.length).setValues([out]);
  [5,6,7,10,12].forEach(function(col){dayFirst(sheet.getRange(line,col));});
  return readSaga(ss,row.className);
}
function dayFirstText(ms){const d=new Date(ms),p=function(n){return (n<10?'0':'')+n;};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear();}
function handleSaga(ss,data){
  const className=validIslandClass(data.className);
  if(data.type==='SAGA_LINES_SAVE'){
    const grade=Number(data.grade);if([5,6,7,8].indexOf(grade)<0)throw Error('Choose grade 5, 6, 7 or 8.');
    const lines=Array.isArray(data.lines)?data.lines.map(function(l){return String(l||'').replace(/\s+/g,' ').trim();}).filter(Boolean):[];
    if(!lines.length||lines.length>10||lines.some(function(l){return l.length>160;}))throw Error('Write 1 to 10 lines of up to 160 characters.');
    writeFinaleLines(ss,grade,lines);
    return {status:'success',sagaVersion:1,finaleLines:readFinaleLines(ss,grade)};
  }
  const current=readSaga(ss,className);
  if(data.type==='SAGA_SET'){
    // Set stage (Manage, PIN): moves a class to any stage to fix a misclick or a test run. Logged in Corrections.
    if(SAGA_STAGES.indexOf(data.stage)<0)throw Error('Unknown stage.');
    const at=sagaTime(data.at)||Date.now(),note=String(data.note||('Set to '+data.stage+' by teacher')).slice(0,80);
    const row=JSON.parse(JSON.stringify(current));
    row.stage=data.stage;row.attempts=0;row.correctedAt=at;row.updatedAt=Math.max(row.updatedAt,at);
    SAGA_FORMS.forEach(function(s){if(SAGA_STAGES.indexOf(s)>=SAGA_STAGES.indexOf(data.stage))row.won[s]=0;});
    row.correctionsText=(row.correctionsText?row.correctionsText+' | ':'')+note+', '+dayFirstText(at);
    return {status:'success',sagaVersion:1,saga:writeSaga(ss,row)};
  }
  // SAGA_SAVE: the board's row after a fight (through the phone). Merge answers travel with it.
  const incoming=cleanSaga(data.saga,className);
  const merged=mergeSaga(current,incoming);
  const mergeRows=data.mergeLog!==undefined?validateChallengeRows(data.mergeLog,className).filter(function(r){return SAGA_ANSWER_TYPES.indexOf(r.type)>=0;}):[];
  const saved=writeSaga(ss,merged);
  const challengesAdded=mergeRows.length?appendChallengeLog(ss,mergeRows):0;
  return {status:'success',sagaVersion:1,trialsVersion:1,saga:saved,challengesAdded:challengesAdded};
}
// What the Finale names students from: the class's contributions in the sessions it fought a saga form, its Island Run
// navigators and its Merge Spell answers. (No list of who missed a question is kept anywhere.)
function sagaExtras(ss,className,saga){
  const teams={};Object.keys(CONTRIBUTION_TEAMS).forEach(function(id){teams[CONTRIBUTION_TEAMS[id]]=id;});
  const unquote=function(v){const t=String(v===undefined||v===null?'':v);return t.charAt(0)==="'"?t.slice(1):t;};
  const sessions={};(saga&&saga.fightSessions||[]).forEach(function(id){sessions[id]=true;});
  const contributions=[],navigators=[],merge=[];
  const cs=ss.getSheetByName('Student_Contributions');
  if(cs&&cs.getLastRow()>1)cs.getRange(2,1,cs.getLastRow()-1,CONTRIBUTION_HEADERS.length).getValues().forEach(function(r){
    if(unquote(r[1])!==className||!sessions[String(r[5])]||!teams[String(r[2])]||!(Number(r[4])>0))return;
    contributions.push({team:teams[String(r[2])],name:unquote(r[3]).slice(0,70),studentId:String(r[6]||''),contributions:Number(r[4]),sessionId:String(r[5])});
  });
  readNavigatorSeals(ss,className).forEach(function(r){navigators.push({team:r.team,student:r.student,studentId:r.studentId});});
  const ch=ss.getSheetByName('Challenge_Log');
  if(ch&&ch.getLastRow()>1)ch.getRange(2,1,ch.getLastRow()-1,CHALLENGE_HEADERS.length).getValues().forEach(function(r){
    if(String(r[1])!==className||SAGA_ANSWER_TYPES.indexOf(String(r[6]))<0||!teams[String(r[2])])return;
    merge.push({id:unquote(r[10]),team:teams[String(r[2])],student:unquote(r[3]).slice(0,70),studentId:unquote(r[4]).slice(0,100),kind:String(r[6]).split(' · ')[0].toLowerCase(),result:String(r[9])==='Right'?'right':'wrong'});
  });
  return {contributions:contributions.slice(-2000),navigators:navigators.slice(-500),merge:merge.slice(-500)};
}
// ---- v11.0.0 · Vixar_Finale_Lines: the Finale's thank-you speech per grade (edited in Studio) ----
const FINALE_HEADERS=['Grade','Lines','Updated'];
function finaleSheet(ss){
  const sheet=ss.getSheetByName('Vixar_Finale_Lines')||ss.insertSheet('Vixar_Finale_Lines');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,FINALE_HEADERS.length).setValues([FINALE_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,FINALE_HEADERS.length).getValues()[0])!==JSON.stringify(FINALE_HEADERS))throw Error('Vixar_Finale_Lines has different headers. Rename that tab before saving.');
  return sheet;
}
function readFinaleLines(ss,grade){
  const sheet=ss.getSheetByName('Vixar_Finale_Lines');if(!sheet||sheet.getLastRow()<2)return null;
  const r=sheet.getRange(2,1,sheet.getLastRow()-1,FINALE_HEADERS.length).getValues().filter(function(x){return Number(x[0])===grade;})[0];
  if(!r)return null;
  const lines=String(r[1]||'').split('\n').map(function(l){return l.replace(/^'/,'').trim();}).filter(Boolean).slice(0,10);
  return lines.length?{grade:grade,lines:lines,at:sagaTime(r[2])}:null;
}
function writeFinaleLines(ss,grade,lines){
  const sheet=finaleSheet(ss),values=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,FINALE_HEADERS.length).getValues():[];
  let at=-1;values.forEach(function(r,i){if(Number(r[0])===grade)at=i;});
  const line=at>=0?at+2:values.length+2;
  sheet.getRange(line,1,1,FINALE_HEADERS.length).setValues([[grade,lines.map(sheetText).join('\n'),new Date()]]);
  dayFirst(sheet.getRange(line,3));
}


// ---- v12.0.0 · Term report: one row per student ID (English League → Build term report) ----
// Everything is grouped by the roster ID, so a student who was renamed or moved to another team is still one row, and
// two students with the same name stay two rows. Rows saved before IDs that could not be matched are listed at the
// end by name, so nothing is silently left out.
const TERM_HEADERS=['Student ID','Student (roster)','Class','Team (roster)','Active','Lessons','Contributions','Challenge cards right','Challenge cards','Saga answers right','Navigator seals','Names in lessons','Teams in lessons','First lesson','Last lesson'];
function buildTermReport(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw Error('A save is in progress. Try again in a moment.');
  try{
    const people={},unmatched={},teamName=id=>CONTRIBUTION_TEAMS[String(id).toLowerCase()]||String(id);
    const person=id=>people[id]=people[id]||{id,lessons:{},contributions:0,right:0,cards:0,saga:0,seals:0,names:{},teams:{},first:0,last:0,cls:''};
    const roster=ss.getSheetByName('Roster');
    const rosterRows=roster&&roster.getLastRow()>1?roster.getRange(2,1,roster.getLastRow()-1,5).getValues():[];
    const rosterById={};rosterRows.forEach(r=>{if(String(r[0]))rosterById[String(r[0])]={name:String(r[2]),cls:String(r[1]),team:String(r[3]),active:r[4]===true||String(r[4]).toUpperCase()==='TRUE'};});
    const time=v=>{const d=oldDateValue(v);return d?d.getTime():0;};
    const cs=ss.getSheetByName('Student_Contributions');
    if(cs&&cs.getLastRow()>1){
      contributionSheet(ss);
      cs.getRange(2,1,cs.getLastRow()-1,CONTRIBUTION_HEADERS.length).getValues().forEach(r=>{
        const id=String(r[6]||''),awards=Number(r[4])||0,at=time(r[0]),name=String(r[3]).replace(/^'/,''),cls=String(r[1]).replace(/^'/,'');
        if(!id){if(!name)return;const k=cls+'|'+r[2]+'|'+name;const u=unmatched[k]=unmatched[k]||{cls,team:String(r[2]),name,lessons:0,contributions:0,note:String(r[7]||'unmatched')};u.lessons++;u.contributions+=awards;return;}
        const p=person(id);p.cls=p.cls||cls;p.lessons[String(r[5])||('row'+at)]=true;p.contributions+=awards;p.names[name]=true;p.teams[String(r[2])]=true;
        if(at&&(!p.first||at<p.first))p.first=at;if(at>p.last)p.last=at;
      });
    }
    const ch=ss.getSheetByName('Challenge_Log');
    if(ch&&ch.getLastRow()>1)ch.getRange(2,1,ch.getLastRow()-1,CHALLENGE_HEADERS.length).getValues().forEach(r=>{
      const id=String(r[4]||'').replace(/^'/,'');if(!id||!STUDENT_ID_PATTERN.test(id))return;
      const p=person(id),saga=SAGA_ANSWER_TYPES.indexOf(String(r[6]))>=0,right=String(r[9])==='Right';
      if(saga){if(right)p.saga++;}else if(String(r[9])!=='Skipped'){p.cards++;if(right)p.right++;}
    });
    readNavigatorSealsAll_(ss).forEach(r=>{person(r.studentId).seals++;});
    const day=ms=>ms?new Date(ms):'';
    const out=Object.keys(people).map(id=>{
      const p=people[id],r=rosterById[id]||{};
      return [id,sheetText(r.name||Object.keys(p.names).pop()||''),r.cls||p.cls,r.team||'',r.active===undefined?'':r.active?'Yes':'No',Object.keys(p.lessons).length,p.contributions,p.right,p.cards,p.saga,p.seals,
        sheetText(Object.keys(p.names).join(' · ')),Object.keys(p.teams).join(' · '),day(p.first),day(p.last)];
    }).sort((a,b)=>String(a[2]).localeCompare(String(b[2]))||String(a[3]).localeCompare(String(b[3]))||String(a[1]).localeCompare(String(b[1]),'tr'));
    const extra=Object.keys(unmatched).map(k=>{const u=unmatched[k];return ['('+u.note+')',sheetText(u.name),u.cls,u.team,'',u.lessons,u.contributions,'','','','',sheetText(u.name),u.team,'',''];});
    const sheet=ss.getSheetByName('Term_Report')||ss.insertSheet('Term_Report');
    sheet.clearContents();
    sheet.getRange(1,1,1,TERM_HEADERS.length).setValues([TERM_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);
    const rows=out.concat(extra);
    if(rows.length){
      if(rows.length+1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),rows.length+1-sheet.getMaxRows());
      sheet.getRange(2,1,rows.length,TERM_HEADERS.length).setValues(rows);
      dayFirst(sheet.getRange(2,14,rows.length,2),DATE_ONLY_FORMAT);
    }
    const text='Term report: '+out.length+' students'+(extra.length?', '+extra.length+' older rows without an ID (listed at the end)':'')+'.';
    Logger.log(text);return text;
  }finally{lock.releaseLock();}
}
function readNavigatorSealsAll_(ss){
  const sheet=ss.getSheetByName('Navigator_Seals');if(!sheet||sheet.getLastRow()<2)return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,NAVIGATOR_HEADERS.length).getValues()
    .filter(r=>STUDENT_ID_PATTERN.test(String(r[4])))
    .map(r=>({studentId:String(r[4]),island:Number(r[5])}));
}
