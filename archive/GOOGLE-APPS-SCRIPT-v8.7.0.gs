const TEACHER_PIN = "2595"; // Keep this private

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
    function resultsSheet(name) {
      return ss.getSheetByName(name) || ss.getSheets().find(sheet=>sheet.getName()!=='Roster') || ss.insertSheet(name);
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
      sheet.getRange(nextAvailableRow(sheet), 1, 1, rowValues.length).setValues([rowValues]);
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

    return jsonResponse({ status: "success" });
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
