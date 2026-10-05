# v10.1.0 checks

Run `npm run test:v101` for the full dependency-free suite (all v10.0 checks plus `v101.cjs`). `v101.cjs` covers:

- the one-step Teacher sign-in: the PIN waits for Allow, signs in once (roster, then islands), forgets a wrong PIN and keeps one when the Sheet is unreachable;
- Load islands, Save Record, saved-result retry, Manage and Studio reusing the PIN;
- the PIN box between the room code and Connect Phone.

`npm run test:board` now also runs `board-v101.cjs` (v10.1.1: one student card at a time, never during a ranking slide; frame-by-frame sampling) and `teacher-signin.cjs` (Chromium, real Apps Script in the in-memory spreadsheet). It checks that names, islands, seals and the season reach the board with no PIN prompt, that a wrong PIN is asked for once, and that the remote works without a PIN.

# v10.0.0 checks

Run `npm run test:v10` for the full dependency-free suite (all v9.7 checks plus `v10.cjs`): season wins counted by the Apps Script (League title and Arena once each, a Grand Champion twice, a shared title once per tied team, older rows without session IDs, re-saves counted once, unreadable rows skipped), the board's season module (today's wins added until saved, no double counting, kept for the next lesson), how season data travels, and the elemental card rules. `npm run test:board` (Playwright with Chromium) also runs `board-v10.cjs`: the elemental cards at every stage and element, the level-up burst once, still cards in Light mode, and the Season Wins panel at 1280×720, 1366×768 and 1920×1080. See `../TEST-REPORT-v10.0.0.md`.

# v9.7.0 checks

Run `npm run test:v97` for the full dependency-free suite (all v9.6 checks plus `v97.cjs`): the navigator seal store (one seal per island, kept after a reload, only ever added to, announced once the class is back on the board), the board's one-navigator-per-session choice and its checkpoint, the seal path from a completed run, the ten-place award card, the v9.7.0 Apps Script (Navigator_Seals rows once per student and island, returned by Load islands, nothing written for an invalid seal), the Netlify capability check, and the phone's student controller and Bluetooth keyboard handling. `npm run test:board` (Playwright with Chromium) also runs `board-v97.cjs`: the award card, the navigator on the board and phone, the controller popping up, the phone keyboard steering the runner on the board, and a seal reaching the phone. See `../archive/TEST-REPORT-v9.7.0.md`.

# v9.6.0 checks

Run `npm run test:v96` for the full dependency-free suite (all v9.5 checks plus `v96.cjs`). `v96.cjs` checks the session summary that lists every student, the v9.6.0 Apps Script (one Student_Contributions row per student, in-place updates, all contributors in Leaderboard I–L, nothing half-saved), the Netlify capability check, the board and arena removals, the release tag, and (in `v96-island.cjs`) one navigator per run, the fixed prompt panel and its text fitting, no-op canvas resizes, the quality governor's bounce lock, single-copy cached scenery with one blended colour level at a time, far layers that always move, a landmark that never snaps, and a bounded sprite cache through four complete driven runs. `npm run test:board` (Playwright with Chromium) checks the board fit in Light and Animated, the removed Performance option, Award Custom Points closing, a quiet lead change, the arena dial and the shared League title. See `../archive/TEST-REPORT-v9.6.0.md`.

# v9.5.0 checks

Run `npm run test:v95` for the full dependency-free suite (all v9.4 checks plus `island-v95.cjs`: Spirit Surge, Perfect Run, guardian hit damage, bounded presentation layers, reduced motion and the sound palette). `npm run test:board` (Playwright with Chromium) checks the board fit at 1280×720, 1366×768 and 1920×1080 in all three display modes, the lead-change banner, the arena dial and the shared League title. See `../archive/TEST-REPORT-v9.5.0.md`.

# v9.4.0 checks

Run `npm run test:v94` for the full dependency-free suite (all v9.3 checks plus `island-v94.cjs`: scene colour, 392 stub-canvas frames across every realm, and passport seals on the board). With `@napi-rs/canvas` available, `render-runner-v91.cjs` renders the new scenery natively. See `../TEST-REPORT-v9.4.0.md`.

# v9.3.0 checks

Run `npm run test:v93` for the full dependency-free suite (all v9.2 checks plus `island-v93.cjs`). `next-to-invite.cjs` checks the compact remote layout in Chromium. See `../TEST-REPORT-v9.3.0.md`.

# v9.1.0 Island Run checks

Run `npm run test:v91` for the current dependency-free engine, embedded UI, passport, Apps Script, roster, participation and connection regression suites. See `../TEST-REPORT-v9.1.0.md` for results and limits. `runner-driver.cjs` is a deterministic skilled player; it uses movement and jump inputs, not health/coin/score cheats.

The optional `render-runner-v91.cjs` exercises native Canvas2D rendering when `@napi-rs/canvas` is installed. It does not test browser CSS layout.

## Retained Island Run checks

Run `npm run test:runner` for the dependency-free integration and gameplay suites. The integration harnesses execute the real UI and tally hook code with a simulated DOM; they do not replace native browser layout/touch testing. See `../TEST-REPORT-v8.8.0.md`.

The existing test documentation follows. Earlier browser results are historical.

# Optional developer regression checks

These files are not needed to upload or run the Netlify site. The main update instructions are in `../UPDATE-v8.5.1.md`.

With Node.js installed, run these commands from this `tests` folder:

```sh
npm install
npx playwright install chromium
npm test
```

The runner serves `../public` on a local temporary port and uses headless Chromium. It writes screenshots and reports into `output`. External requests are blocked or mocked. There are no real Sheets writes, TURN calls, or WebRTC connections.

The test server injects a private state adapter only into the response used by the tests. Production files contain no test hook. The phone/board tests bridge two browser pages using the actual command handlers, with a deliberately dropped acknowledgement; the underlying transport is simulated.

`verify.cjs` covers command receipts and replay, recovery, reward queues, battles in all three modes, mobile layout, and reconnect failure handling. `resilience.cjs` covers offline/uncertain Sheets delivery, adaptive effect limits, cleanup, pause, corrupt snapshots, and CPU throttling.

For an already-installed compatible Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. If that build needs special launch arguments, `PLAYWRIGHT_CHROMIUM_ARGS` accepts a JSON array. Normal Playwright installations need neither variable.

`students.cjs` covers the class/student picker, attribution, validation, duplicate delivery, Undo, recovery, reset, final snapshots and responsive layouts.

`apps-script.cjs` checks the included Apps Script against an in-memory spreadsheet: existing result sheets, count-based top-three leader cells, exclusion of student points and PIN rejection.

`v7-2-unit.cjs` checks the retained Level 5/10 wheel milestones, 20-second result hold, manual dismissal controls, unchanged subject labels and the revised top-right current-level display.

`teamwork-unit.cjs` exercises the production credit, halo-rendering, mission-completion, Team Reset and recovery code with a minimal DOM and storage adapter. It checks first versus repeated contributions, invalid awards, the 14-to-15 transition, exactly-once completion, stars after mission completion, reset preservation, restored/undone totals, legacy mission migration, and empty new-session records. Run it directly with `node teamwork-unit.cjs` without Chromium.

It also exercises the final recognition renderer for all four avatars, count-based top-three selection, shared ranks, empty teams, absent classes and stale-content replacement. The browser suite checks that all four cards and twelve contributor rows appear for a fully participating class.

## Version 8.5 checks

Run `npm run test:access` for server-time code calculations, a changed browser clock/timezone, minute boundaries, three-attempt lockout, reload persistence, master override, six-hour expiry and failed-network handling. The local server runs the production access function; other browser suites unlock automatically.

Run `npm run test:projectiles` for the 200–250 HP examples, a zero-score arena, visible projectile arrival and hit/block/partial-block/dodge outcomes, all twelve projectile variants in Vixar, defense accents, pause cleanup and fast-forward boss completion. `npm run test:arena` also checks rendered visibility, all defense variants, effect limits and reduced motion.

Browser verification uses Chromium, not a physical iPhone/Safari, classroom projector, live Netlify deployment or live PeerJS connection.

## Version 8.5.1 balance checks

Run `npm run test:balance` for production poison immunity, full/partial shield absorption, damage accounting, poison refresh/expiry, fractional carry and fixed-start calibration. `balance-lab` contains the released combat rules and reproducible Monte Carlo validation. Its README explains seed sets, assumptions and browser parity.
