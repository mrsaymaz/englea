# v9.6.0 verification

## Passed

- **Full dependency-free suite** (`npm run test:v96` from `tests`, 98 checks): every v9.5 check, including 240 + 400 scripted Island Run completions, 160 full v9.3 runs and all 4,240 question variants. The new `v96.cjs` and `v96-island.cjs` checks:
  - The session summary lists every student of the class in roster order with their contribution count, zero included; the leader list still holds contributors only.
  - Apps Script v9.6.0 (in-memory spreadsheet): one **Student_Contributions** row per student, zero included, with formula-like names neutralised; saving the same session again updates its counts in place, a new session adds rows; an invalid count writes nothing (no half-saved session); older "Leaders of …" headers are renamed to "Contributors of …"; a battle-only save adds no student rows; a board without the full list still records its contributors.
  - The Netlify function keeps the record on the phone until the Sheet runs the v9.6.0 script.
  - Arena callouts are only knockouts, Arena Surge, Final Clash and the winner; no attack or relic names.
  - No "takes the lead" banner and no point bubbles in the board, remote or award code; the Class Mission bar has its width transition and no slices; remote cards have the 220 px minimum.
  - Only Animated and Light remain; a Performance choice is mapped to Animated; the Award Custom Points × calls its own close function.
  - Board, remote and runner load every changed file on the 9.6.0 tag (including `student-rosters.js`, previously on 8.7.0).
  - Island Run: the navigator is chosen only when the run starts (and by the teacher's own action); the prompt panel has one fixed height for every prompt type, pictures fit it, and `fitPrompt` steps long text down only as far as needed and resets for the next prompt; resizing to the same size never reallocates the canvas; the quality governor changes at most three times in four minutes on a board that is slow on one tier and fast on the next; settled scenery is one cached copy per layer, a new colour level is drawn one layer per frame and the old level is released; far layers move at every quality tier and stay still only with reduced motion; the landmark drifts one way with no jumps over 900 frames; the sprite cache stays at or under 240 entries through four complete driven runs (Academy, Coast, Harbour, Sky; course, gates, Word Trail and guardian), and drawing never changes gameplay.
- **Board browser checks** (`npm run test:board`, Chromium):
  - The board fits 1280×720, 1366×768 and 1920×1080 in Light and Animated with no page scroll, every control on screen and Add Points at least 44 px tall.
  - Only Animated and Light are offered; a board with Performance saved opens in Animated; Award Custom Points closes with × and with Escape.
  - A new leader is crowned with no banner, no "takes the lead" text and no point bubbles.
  - The arena dial mirrors the clock, damage numbers are capped at eight and the layer is removed after the battle.
  - A four-way League tie shows "Shared League Title" with all four champions in one row.
- **Other browser suites pass:** iPhone remote layout and live lists (`next-to-invite.cjs`: all five classes at 393 × 660 with all twelve "Next to invite" names on screen, no card overflow and no page scroll; 393 × 852; landscape), arena techniques, projectiles and HP, Vixar finale, Unity reward visibility and the access gate.
- **Native Canvas2D renders** (`render-runner-v91.cjs` with `@napi-rs/canvas`): 320 frames pass.
- **End-to-end in Chromium (Animated mode, 1366 × 768):** the skilled test driver completed island 1 (Academy) and island 7 (Harbour), from the opening card through gates, Spirit Surge, the guardian's attack and firing lanes, defeat, restoration and results. A measured run on island 4 (Hearthwood) with picture and listening gates on: the prompt panel stayed at **100 px** in all seven prompt states (idle, question, picture question, correct, Word Trail, Word Trail result, showdown); the course canvas was **never resized during the run** (once after the finish, when the restoration scene hides the panel); frame interval median 17 ms and 95th percentile 17 ms. The run was measured twice, the second time on the final build: the worst single frame was 33 ms (9,963 frames) and 50 ms (9,754 frames). The measuring script takes screenshots during the run, which can delay a frame.

## Lightweight

Island Run frame cost in headless Chromium (software rendering, 1600 × 600 course, a forced raster every frame, 300–600 frames per case):

| | v9.5.0 | v9.6.0 |
|---|---|---|
| Steady scene | 8.8–9.0 ms | 4.9–5.1 ms |
| Six colour changes (correct answers) | 8.7–8.9 ms mean, worst 12.1–14.6 ms | 5.8 ms mean, worst 10.4–11.3 ms |

- The scenery layers are drawn once per colour level into offscreen canvases and copied each frame. Two levels exist only while colour is fading in (about one second after a correct answer); a new level is drawn one layer per frame. At 1366 × 768 a level takes about 2.5 MB of canvas memory.
- The vignette is two narrow edge bands instead of a full-screen overlay. Small sprites (coins, obstacles, letters, glows) are cached and bounded at 240.
- No new images, fonts or libraries. `scenery.js` grows by 27 KB (8 KB gzipped); `visual-v96.css` adds 3 KB (1 KB gzipped); `board-fx.js` and `board-v95.css` shrink by 5 KB together.

## Limits

- Chromium only, at 1280 × 720, 1366 × 768, 1920 × 1080, 393 × 660 and 393 × 852. No Safari/WebKit, physical smartboard or iPhone was used, and frame rate on a real smartboard was not measured.
- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet. No live Netlify site, Google Sheet or Apps Script deployment was changed.
- These older browser suites fail at the same step on the untouched v9.3.0 baseline as on v9.6.0, so they were left as they are: `students.cjs`, `secret-agent.cjs`, `shield.cjs` and `roster-editor.cjs` (the Load islands dialog that opens on class selection blocks their clicks), `verify.cjs` (waits for a wheel Continue button; its display-mode loops now list Light and Animated) and `resilience.cjs` (timeout).

## Reproduce

From `tests`: `npm run test:v96` (Node.js, no dependencies). `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium. `render-runner-v91.cjs` needs `@napi-rs/canvas`.
