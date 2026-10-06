# v10.1.2 verification

## Passed

**New `v1012.cjs`** runs the real v10.1.2 Apps Script against the in-memory spreadsheet harness. The harness now also records number formats.

- **A full session save** writes a real date, not text, to every dated tab:
  - shown `dd/mm/yyyy hh:mm:ss` in Leaderboard, Battle_Results, Student_Contributions, Navigator_Seals, Island_Progress (Last updated) and Question_Log;
  - shown `dd/mm/yyyy` in Question_Summary (Last wrong).

  The save's date is the time of the save, and each answer's date is the answer's own time.
- **Re-saving the same session** updates its row and keeps the format. The season, seals and islands still load afterwards.
- **`formatOldDates()`** converts month-first text from earlier saves:
  - "10/5/2026, 7:46:12 PM" becomes 5 October 2026, 19:46:12;
  - "12:05 AM" becomes 00:05 and "12:30 PM" becomes 12:30;
  - ISO text and plain `YYYY-MM-DD` dates are converted too;
  - existing dates only get the day-first format.

  It leaves impossible dates ("13/25/2026") and hand-typed text unchanged, along with their formats. A second run converts nothing, the lock is released, and the converted rows still count in the School League Season.
- These checks pass with the computer's time zone set to UTC, Europe/Istanbul and America/New_York.

**Other suites:**

- The full dependency-free suite (`npm run test:v1012`) passed 121 checks.
- The Chromium board suite (`npm run test:board`) passed 22 of 22, including `season-relay.cjs` and `teacher-signin.cjs`, which use the new script.
- `next-to-invite.cjs` passes.

## Limits

- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet.
- The display format `dd/mm/yyyy hh:mm:ss` follows Google Sheets' documented number-format codes: `mm` next to `hh` or `ss` means minutes, otherwise months.
- The rows are dated in the Sheet's time zone (File → Settings).
- `formatOldDates` reads old text in the script's time zone. That is normally the same as the Sheet's.
- Chromium only. No live Netlify site, Google Sheet or Apps Script deployment was changed.
- The v10.1.0 and v10.1.1 results are in `archive/TEST-REPORT-v10.1.0.md`.

## Reproduce

From `tests`:

- `npm run test:v1012` needs Node.js only, with no dependencies.
- `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium.
