# v9.7.0 verification

## Passed

- **Full dependency-free suite** (`npm run test:v97` from `tests`, 108 checks): every v9.6 check, including 240 + 400 scripted Island Run completions, 160 full v9.3 runs and all 4,240 question variants. The new `v97.cjs` checks:
  - Navigator seals: a student earns each island's seal once; invalid islands, classes and IDs are refused; seals belong to their class; they are kept after a reload; rows from Google Sheets only ever add; a new seal is announced with the student's name only once the class is back on the board, and seals loaded from the Sheet are not announced.
  - One navigator per session: the board chooses only among the champion team's contributors, at random (the whole team if nobody contributed, nobody without a class); the same session keeps its choice for every Island Run; a new session chooses again; the choice is saved in the session checkpoint and restored only for the same session; the runner has no per-run choice and the remote cannot change it.
  - Only a completed, non-practice run asks the board for the navigator's seal; the bridge checks the run's own token and islands 1–10.
  - The award card has ten seal places, five to a row, and no points chip; earned places are gold discs with the island number.
  - Apps Script v9.7.0 (in-memory spreadsheet): one Navigator_Seals row per student and island with the guardian's name, formula-like names neutralised; saving again adds only new seals; Load islands returns the class's seals only; an invalid seal (island, student ID, team, name or session ID) writes nothing at all; a save without seals is unchanged.
  - The Netlify function keeps navigator seals on the phone until the Sheet runs the v9.7.0 script; an older script still saves when there are no seals.
  - The phone's student controller pops up when a run starts, steers with its buttons, stays closed for that run once the teacher closes it, pops up again for the next run, does nothing while paused and closes with Island Run; the phone asks to stay awake. A Bluetooth keyboard steers with ↑ ↓ → and Space, with the controller open or closed; a held arrow is one lane; typing into a visible field and shortcuts are left alone, while a hidden field that kept focus does not block the keys.
  - Steering is a light message bound to the session and applied only to an open, ready Island Run with a running run.
- **Browser checks** (`npm run test:board`, Chromium): all v9.6 board checks, plus `board-v97.cjs` with a board and a phone page bridged through the real remote handlers:
  - The award card shows the student's name and ten seal places in two rows of five, with the earned islands filled, inside the creature area; no points chip; no seal chips on team cards.
  - After the Arena, the navigator is a contributor of the champion team, named on the board and on the phone; the student controller pops up when the run starts.
  - The phone keyboard (↓, ↑, Space) and the controller's DOWN button steer the runner on the board.
  - A second run keeps the same navigator.
  - A seal is kept on the board (once per island), reaches the phone for saving, is announced with the student's name after Island Run, and the controller closes with Island Run.
- **End-to-end in Chromium (Animated mode):** board and phone bridged, a session with contributors in every team, the Final Arena, then a complete island 1 run played by the skilled test driver. The champion team's contributor (Sümeyye) was named on the opening card and the phone controller; the result card showed **Sümeyye · seal 1 of 10**; back on the Champions screen "Navigator seal earned · Sümeyye · Island 1" appeared, and the seal was stored with the session ID. A student who already held that island's seal earned no second one.
- **Other browser suites pass:** iPhone remote layout (`next-to-invite.cjs`), arena techniques, projectiles and HP, Vixar finale, Unity reward visibility and the access gate.
- **Native Canvas2D renders** (`render-runner-v91.cjs` with `@napi-rs/canvas`): 320 frames pass.

## Found and fixed during testing

On the phone, the hidden PIN field of "Load islands" can keep keyboard focus after the dialog closes. The first version of the keyboard handler treated that as typing and ignored the arrows. The handler now ignores only visible fields, and opening the controller clears focus.

## Limits

- Chromium only. No Safari/WebKit, iPhone, physical Bluetooth keyboard or smartboard was used. Bluetooth keyboards on iPhone deliver arrow keys and Space to web pages as ordinary key events, which is what was tested; whether a particular keyboard and phone keep the connection and the screen awake for a whole lesson was not measured.
- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet. No live Netlify site, Google Sheet or Apps Script deployment was changed.
- The older browser suites `students.cjs`, `secret-agent.cjs`, `shield.cjs`, `roster-editor.cjs`, `verify.cjs` and `resilience.cjs` fail at the same step on the untouched v9.3.0 baseline (see `archive/TEST-REPORT-v9.6.0.md`); they were not changed by this release.

## Reproduce

From `tests`: `npm run test:v97` (Node.js, no dependencies). `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium. `render-runner-v91.cjs` needs `@napi-rs/canvas`.
