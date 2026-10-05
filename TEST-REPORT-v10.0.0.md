# v10.0.0 verification

**v10.0.1:** `board-v10.cjs` now also checks that the "★ First time" tag is the top element at its own centre on an elemental card and that no edge effect sits behind it. The suites below were re-run for v10.0.1.

## Passed

- **Full dependency-free suite** (`npm run test:v10` from `tests`, 113 checks): every v9.7 check, including 240 + 400 scripted Island Run completions, 160 full v9.3 runs and all 4,240 question variants. The new `v10.cjs` checks:
  - Apps Script v10.0.0 (in-memory spreadsheet) counts season wins across classes 5-A, 6-C, 7-A and 8-B: a Grand Champion earns 2, a shared League title gives each tied team 1, a standings-only save counts the League title and an Arena-only save counts the Arena.
  - Rows written by earlier versions (no Session ID, or no points) still count; a session saved again is counted once; unreadable rows are skipped; saves return the season as well as Load islands.
  - The board's season module adds today's wins (shared titles and Grand Champions included) until the Sheet has them, then shows the saved totals without double counting; tied teams share a rank; totals are kept for the next lesson; invalid data is refused; no panel outside the Champions screen.
  - Season data arrives with Load islands and every save, and travels from the phone to the board.
  - Elemental card rules: fire, nature, water and air by team; Spark, Surge, Storm and Mythic by seals; no level number; motion only in Animated mode without reduced motion; one level-up burst per new seal.
- **Browser checks** (`npm run test:board`, Chromium): all v9.6 and v9.7 board checks, plus `board-v10.cjs`:
  - Cards with 0, 2, 5, 8 and 10 seals: the regular card, then nature Spark, water Surge, air Storm (with its edge effects) and nature Mythic with the Earthshaker crown and title; Flamebearer, Tidecaller and Stormrider on the other teams; no level number in any card; the particles move in Animated mode.
  - A newly earned seal gives the student's next card one burst, and only that card.
  - Light mode shows the same elemental card, still.
  - The Season Wins panel sits in the upper right of the Champions screen at 1280×720, 1366×768 and 1920×1080, on screen and clear of the champion names; today's wins appear as dotted "+1/+2"; after the season comes back from a save, the totals include today once and the marks turn solid.
- **Other browser suites pass:** iPhone remote layout (`next-to-invite.cjs`), arena techniques, projectiles and HP, Vixar finale, Unity reward visibility and the access gate.
- **Native Canvas2D renders** (`render-runner-v91.cjs` with `@napi-rs/canvas`): 320 frames pass.

## Lightweight

- No new images, fonts or libraries. The cards are drawn with CSS: at most 16 particles and 9 edge shapes per card, animating only transform and opacity, and only while the card is on screen (about four seconds).
- The season is computed by the Apps Script when the Sheet is loaded or saved, not on the board.

## Limits

- Chromium only. No Safari/WebKit, iPhone or smartboard was used.
- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet. Leaderboard rows written by much older versions were tested in the current "Team (points pts, Lv.n)" format and as plain team names; other hand-edited formats count the first team named, or are skipped if no team is named.
- No live Netlify site, Google Sheet or Apps Script deployment was changed.
- The older browser suites `students.cjs`, `secret-agent.cjs`, `shield.cjs`, `roster-editor.cjs`, `verify.cjs` and `resilience.cjs` fail at the same step on the untouched v9.3.0 baseline (see `archive/TEST-REPORT-v9.6.0.md`); they were not changed by this release.

## Reproduce

From `tests`: `npm run test:v10` (Node.js, no dependencies). `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium. `render-runner-v91.cjs` needs `@napi-rs/canvas`.
