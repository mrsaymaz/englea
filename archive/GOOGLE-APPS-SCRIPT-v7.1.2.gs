const TEACHER_PIN = "2595"; // Keep this private

const LEADER_HEADERS = [
  "Leaders of Gryffindor",
  "Leaders of Hufflepuff",
  "Leaders of Slytherin",
  "Leaders of Ravenclaw"
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No payload" });
    }

    const data = JSON.parse(e.postData.contents);

    if (String(data.pin).trim() !== String(TEACHER_PIN).trim()) {
      return jsonResponse({ status: "unauthorized", message: "Invalid PIN" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
      const sheet = ss.getSheetByName("Leaderboard") || ss.getActiveSheet();
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
      const sheet = ss.getSheetByName("Battle_Results") || ss.getActiveSheet();
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
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
