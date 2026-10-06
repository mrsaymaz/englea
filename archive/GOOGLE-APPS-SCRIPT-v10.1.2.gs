// English League v10.1.2 · every date the script writes is a real date shown day first (DD/MM/YYYY), whatever the
// Sheet's locale; formatOldDates() converts the dates of earlier saves once. Includes v10.0.0 (School League
// Season), v9.7.0 (Navigator_Seals) and v9.6.0 (Student_Contributions). Keep your own Teacher PIN on the next line.
const TEACHER_PIN = "2595"; // Keep this private

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
const CONTRIBUTION_HEADERS = ['Date','Class','Team','Student','Contributions','Session ID'];
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

    if (String(data.pin).trim() !== String(TEACHER_PIN).trim()) {
      return jsonResponse({ status: "unauthorized", message: "Invalid PIN" });
    }

    requestLock = LockService.getScriptLock();
    if (!requestLock.tryLock(10000)) return jsonResponse({status:'error',message:'Another save is in progress. Please try again.'});
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.type === 'ROSTER_GET' || data.type === 'ROSTER_SAVE') return jsonResponse(handleRosterRequest(ss,data));
    if (['TEACHING_GET','TEACHING_SAVE'].includes(data.type)) return jsonResponse(handleTeaching(ss,data));
    if (data.type === 'ISLAND_GET') {
      const getClass=validIslandClass(data.className);
      return jsonResponse({status:'success',passportVersion:1,questionLogVersion:1,contributionsVersion:1,navigatorSealsVersion:1,seasonVersion:1,season:readSeason(ss),navigatorSeals:readNavigatorSeals(ss,getClass),islandProgress:readIslandProgress(ss,getClass),teaching:teachingCatalog(ss,Number(getClass[0])),questionLog:readQuestionLog(ss,getClass).slice(-600)});
    }
    if (!['FULL_SESSION','LEADERBOARD_FINAL','BATTLE_OUTCOME'].includes(data.type)) return jsonResponse({status:'error',message:'Unknown record type'});
    const islandClass = data.islandProgress !== undefined ? validIslandClass(data.className) : null;
    const incomingIslands = islandClass ? validateIslandProgress(data.islandProgress,islandClass) : null;
    if(data.sessionId !== undefined && (typeof data.sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(data.sessionId)))throw Error('Invalid session ID');
    // Validate answer rows before any sheet is written, so a bad row never leaves half a save.
    const questionRows = data.questionLog !== undefined ? validateQuestionRows(data.questionLog, String(data.className || '').trim()) : null;
    const contributionRows = ['FULL_SESSION','LEADERBOARD_FINAL'].includes(data.type) ? validateContributionRows(data.studentContributions) : [];
    const sealRows = data.navigatorSeals !== undefined ? validateNavigatorSeals(data.navigatorSeals, validIslandClass(data.className)) : null;
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
    const contributionsWritten = contributionRows.length ? writeContributions(ss, contributionRows, {date:now, className, sessionId:data.sessionId}) : 0;
    const sealsAdded = sealRows && sealRows.length ? writeNavigatorSeals(ss, sealRows, {date:now, className}) : 0;
    const navigatorSeals = sealRows ? readNavigatorSeals(ss, validIslandClass(data.className)) : undefined;
    return jsonResponse({ status: "success", passportVersion:1, questionLogVersion:1, contributionsVersion:1, navigatorSealsVersion:1, seasonVersion:1, season:readSeason(ss), islandProgress, questionsAdded, contributionsWritten, sealsAdded, navigatorSeals });
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
const DEFAULT_ROSTER = [
  {
    "id": "5-A:gryffindor:0",
    "name": "Elif Naz",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:1",
    "name": "Sümeyye",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:2",
    "name": "Mehmet Emin",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:3",
    "name": "Yusuf Mete",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:4",
    "name": "Yusuf H.",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:5",
    "name": "Canberk",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:gryffindor:6",
    "name": "Öykü Nas",
    "className": "5-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-A:slytherin:0",
    "name": "Şeyma",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:1",
    "name": "Yazan",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:2",
    "name": "Fatma C.",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:3",
    "name": "Zümra",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:4",
    "name": "Abdussamed",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:5",
    "name": "Baran",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:slytherin:6",
    "name": "İlhan",
    "className": "5-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:0",
    "name": "Nisa",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:1",
    "name": "Poyraz",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:2",
    "name": "Şeyma D.",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:3",
    "name": "Yunus Emre",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:4",
    "name": "Eymen",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:hufflepuff:5",
    "name": "İkra",
    "className": "5-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:0",
    "name": "Derin",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:1",
    "name": "Yusufhan",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:2",
    "name": "Behçet",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:3",
    "name": "Nesibe",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:4",
    "name": "Fatma K.",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-A:ravenclaw:5",
    "name": "Zehra",
    "className": "5-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:gryffindor:0",
    "name": "Leys",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:gryffindor:1",
    "name": "Cuma",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:gryffindor:2",
    "name": "Rahme",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:gryffindor:3",
    "name": "Murat",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:gryffindor:4",
    "name": "Dilek Yaren",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:gryffindor:5",
    "name": "Fatma N.",
    "className": "5-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "5-C:slytherin:0",
    "name": "Zuhal",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:1",
    "name": "Ahmet Osman",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:2",
    "name": "İsranur",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:3",
    "name": "Şahin",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:4",
    "name": "Ayşe",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:5",
    "name": "Hümeyra",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:slytherin:6",
    "name": "Cemile",
    "className": "5-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:0",
    "name": "Şüheda",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:1",
    "name": "Yusuf Taha",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:2",
    "name": "Cansu",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:3",
    "name": "Ömercan",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:4",
    "name": "Büşra",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:hufflepuff:5",
    "name": "Ahmet",
    "className": "5-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:0",
    "name": "Burak",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:1",
    "name": "Hasan",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:2",
    "name": "Elif",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:3",
    "name": "Emel",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:4",
    "name": "Mehmet Ali",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:5",
    "name": "Hira Nur",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "5-C:ravenclaw:6",
    "name": "Rukiye",
    "className": "5-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "6-C:gryffindor:0",
    "name": "Eslem Nur",
    "className": "6-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "6-C:gryffindor:1",
    "name": "Selin",
    "className": "6-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "6-C:gryffindor:2",
    "name": "Berfin",
    "className": "6-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "6-C:gryffindor:3",
    "name": "Amir",
    "className": "6-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "6-C:gryffindor:4",
    "name": "Hüseyin Emir",
    "className": "6-C",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "6-C:slytherin:0",
    "name": "Hanife Betül",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:slytherin:1",
    "name": "Muhammed Al.",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:slytherin:2",
    "name": "Yusuf",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:slytherin:3",
    "name": "Kamar",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:slytherin:4",
    "name": "Azra",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:slytherin:5",
    "name": "Kadriye",
    "className": "6-C",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "6-C:hufflepuff:0",
    "name": "Ecrin",
    "className": "6-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "6-C:hufflepuff:1",
    "name": "Burak",
    "className": "6-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "6-C:hufflepuff:2",
    "name": "Eslem Sare",
    "className": "6-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "6-C:hufflepuff:3",
    "name": "Ozan",
    "className": "6-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "6-C:hufflepuff:4",
    "name": "Muhammed Ab.",
    "className": "6-C",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "6-C:ravenclaw:0",
    "name": "Ece Eylül",
    "className": "6-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "6-C:ravenclaw:1",
    "name": "Elif Naz",
    "className": "6-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "6-C:ravenclaw:2",
    "name": "Seyfullah",
    "className": "6-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "6-C:ravenclaw:3",
    "name": "Mehmet Berat",
    "className": "6-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "6-C:ravenclaw:4",
    "name": "Hedil",
    "className": "6-C",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:gryffindor:0",
    "name": "Jana",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:gryffindor:1",
    "name": "Fettah Ali",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:gryffindor:2",
    "name": "Abdulvahap",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:gryffindor:3",
    "name": "Mekke Züleyha",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:gryffindor:4",
    "name": "Hatice Y.",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:gryffindor:5",
    "name": "Hamza Sadık",
    "className": "7-A",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "7-A:slytherin:0",
    "name": "Afra",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:slytherin:1",
    "name": "Belinay",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:slytherin:2",
    "name": "Ömer Faruk",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:slytherin:3",
    "name": "Zeynep",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:slytherin:4",
    "name": "Hadice",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:slytherin:5",
    "name": "Hiranur",
    "className": "7-A",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:0",
    "name": "Semih",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:1",
    "name": "Veysel",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:2",
    "name": "Rimes",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:3",
    "name": "Berfin",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:4",
    "name": "Meryem",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:hufflepuff:5",
    "name": "Rahaf",
    "className": "7-A",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:0",
    "name": "Abdullah",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:1",
    "name": "Asya",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:2",
    "name": "Rihem",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:3",
    "name": "Masuma",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:4",
    "name": "Sudenur Ecrin",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "7-A:ravenclaw:5",
    "name": "Ahmed",
    "className": "7-A",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:gryffindor:0",
    "name": "Ahmet Emir",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:gryffindor:1",
    "name": "Batuhan",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:gryffindor:2",
    "name": "Gazi",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:gryffindor:3",
    "name": "Emirhan",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:gryffindor:4",
    "name": "Yusuf Haktan",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:gryffindor:5",
    "name": "Yahya",
    "className": "8-B",
    "teamId": "gryffindor",
    "active": true
  },
  {
    "id": "8-B:slytherin:0",
    "name": "Abdullah",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:slytherin:1",
    "name": "Mahmud",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:slytherin:2",
    "name": "Salih",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:slytherin:3",
    "name": "Enes",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:slytherin:4",
    "name": "M. Emir",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:slytherin:5",
    "name": "Muhammed B.",
    "className": "8-B",
    "teamId": "slytherin",
    "active": true
  },
  {
    "id": "8-B:hufflepuff:0",
    "name": "Ahmet M.",
    "className": "8-B",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "8-B:hufflepuff:1",
    "name": "Kemal Berk",
    "className": "8-B",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "8-B:hufflepuff:2",
    "name": "Mert",
    "className": "8-B",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "8-B:hufflepuff:3",
    "name": "Mustafa",
    "className": "8-B",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "8-B:hufflepuff:4",
    "name": "Kubilay",
    "className": "8-B",
    "teamId": "hufflepuff",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:0",
    "name": "Ensar",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:1",
    "name": "Seydan",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:2",
    "name": "Bilal",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:3",
    "name": "Hasan Hüseyin",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:4",
    "name": "Ömer Asaf",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  },
  {
    "id": "8-B:ravenclaw:5",
    "name": "Halit",
    "className": "8-B",
    "teamId": "ravenclaw",
    "active": true
  }
];

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
// The board sends every student of the class (zero included) under studentContributions.everyone; older
// boards send only contributors under studentContributions.teams. Re-saving a session updates its rows.
function validateContributionRows(summary){
  if(!summary||typeof summary!=='object')return [];
  const source=summary.everyone&&typeof summary.everyone==='object'?summary.everyone:(summary.teams&&typeof summary.teams==='object'?summary.teams:null);
  if(!source)return [];
  const rows=[],seen={};
  Object.keys(CONTRIBUTION_TEAMS).forEach(teamId=>{
    const list=source[teamId];if(list===undefined)return;
    if(!Array.isArray(list))throw Error('Student contributions must be a list per team.');
    list.forEach(student=>{
      const name=String(student&&student.name||'').trim(),awards=Number(student&&student.awards);
      if(!name||name.length>80)throw Error('A student name in the contributions is empty or too long.');
      if(!Number.isInteger(awards)||awards<0||awards>100000)throw Error('A contribution count is invalid.');
      const key=teamId+'|'+name;if(seen[key])return;seen[key]=true;
      rows.push({team:CONTRIBUTION_TEAMS[teamId],name,awards});
    });
  });
  if(rows.length>300)throw Error('Too many students in one session record.');
  return rows;
}
function contributionSheet(ss){
  const sheet=ss.getSheetByName('Student_Contributions')||ss.insertSheet('Student_Contributions');
  if(!sheet.getLastRow()){sheet.getRange(1,1,1,CONTRIBUTION_HEADERS.length).setValues([CONTRIBUTION_HEADERS]).setFontWeight('bold');sheet.setFrozenRows(1);}
  const headers=sheet.getRange(1,1,1,CONTRIBUTION_HEADERS.length).getValues()[0].map(v=>String(v||'').trim());
  if(headers.join('|')!==CONTRIBUTION_HEADERS.join('|'))throw Error('Student_Contributions columns A–F must keep their headers: '+CONTRIBUTION_HEADERS.join(', ')+'.');
  return sheet;
}
function writeContributions(ss,rows,meta){
  const sheet=contributionSheet(ss),className=sheetText(meta.className),sessionId=meta.sessionId?String(meta.sessionId):'';
  const last=sheet.getLastRow(),existing=last>1?sheet.getRange(2,1,last-1,CONTRIBUTION_HEADERS.length).getValues():[],index={};
  if(sessionId)existing.forEach((r,i)=>{if(String(r[5])===sessionId&&String(r[1])===className)index[r[2]+'|'+r[3]]=i+2;});
  const fresh=[];let written=0;
  rows.forEach(row=>{
    const name=sheetText(row.name),at=sessionId?index[row.team+'|'+name]:undefined;
    if(at){sheet.getRange(at,5,1,1).setValues([[row.awards]]);written++;}
    else fresh.push([meta.date,className,row.team,name,row.awards,sessionId]);
  });
  if(fresh.length){sheet.getRange(Math.max(2,last+1),1,fresh.length,CONTRIBUTION_HEADERS.length).setValues(fresh);dayFirst(sheet.getRange(Math.max(2,last+1),1,fresh.length,1));written+=fresh.length;}
  return written;
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
