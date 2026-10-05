# v10.1.0 verification

## Passed

- **Full dependency-free suite** (`npm run test:v101` from `tests`): 117 checks. It covers every v10.0 check, including 240 + 400 scripted Island Run completions, 160 full v9.3 runs and all 4,240 question variants.
- **New `v101.cjs`** (the sign-in module run in isolation, plus code checks):
  - Before Allow, the PIN waits, and Load islands does not ask in the meantime.
  - After the board's state arrives, sign-in runs once: the roster first, then the chosen class's islands. A reconnect does not sign in again.
  - A wrong PIN is forgotten and asked for again. A PIN that works in Load islands also loads the names.
  - An unreachable Sheet keeps the PIN. An empty PIN changes nothing.
  - The board does not load the roster on its own.
  - Connect Phone reads and clears the PIN box.
  - Save Record is prefilled, and saved-result Send/Retry, Studio and Manage reuse the PIN.
  - New names reach a lesson only before the first award.
  - The PIN is never written to browser storage.
  - The PIN box sits between the room code and Connect Phone.
- **New `teacher-signin.cjs`** (Chromium; board and phone bridged; the phone's `/api/session` and `/api/roster` requests answered by the real v10.0.0 Apps Script in the in-memory spreadsheet):
  - **Right PIN.** The class is chosen on the board before the phone connects. After Allow:
    - a renamed student from the Roster tab appears on the board and back on the phone;
    - the student's two navigator seals, the team's two islands and the school season reach the board;
    - no PIN dialog opens on the phone, and the board itself sends nothing to Google Sheets;
    - Studio opens straight into the workspace;
    - the More sheet reads "Teacher signed in ✓", and the status pill fades.
  - **Wrong PIN.** The phone shows "Teacher PIN not accepted", and Load islands asks once. The right PIN typed there loads the names, islands and season.
  - **No PIN.** The earlier behaviour remains: Load islands asks.
- **Browser checks** (`npm run test:board`, Chromium): all v9.6, v9.7 and v10.0 board checks and `season-relay.cjs` pass.
- **Other browser suites pass:** iPhone remote layout (`next-to-invite.cjs`), arena techniques and the access gate.
- **Phone opening screen** checked by screenshot at 393×660 and 375×600: room code, Teacher PIN and Connect Phone are all on screen.

## Limits

- Chromium only. No Safari/WebKit, iPhone or smartboard was used.
- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet.
- No live Netlify site, Google Sheet or Apps Script deployment was changed.
- The older browser suites `students.cjs`, `secret-agent.cjs`, `shield.cjs`, `roster-editor.cjs`, `verify.cjs` and `resilience.cjs` fail at the same step on the untouched v9.3.0 baseline (see `archive/TEST-REPORT-v9.6.0.md`). They were not changed by this release.

## Reproduce

From `tests`:

- `npm run test:v101` needs Node.js only, with no dependencies.
- `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium.
