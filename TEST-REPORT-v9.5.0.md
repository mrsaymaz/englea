# v9.5.0 verification

## Passed

- **Full dependency-free suite** (`npm run test:v95` from `tests`, 83 checks): every v9.4 check, including 240 + 400 scripted Island Run completions, 160 full v9.3 runs, all 4,240 question variants, passport merging, Apps Script, connection and tally hooks. The new `island-v95.cjs` checks:
  - Spirit Surge fills Elemental Focus on every third correct answer in a row; a miss resets the streak; an active Focus is not restarted; a surge never adds coins or changes the coin target.
  - Perfect Run adds 300 points only for six of six, never on a failed run; stars and the passport fields recorded for the island are unchanged.
  - Guardian hit events carry their damage, the damage adds up to the guard, and exactly one hit is final.
  - Floating numbers (at most 8) and rings (at most 6) expire and never change gameplay state in every realm; ambience stays sparse.
  - Reduced motion still shows the numbers but drops rings, rises and ambience.
  - Every sound the app plays exists in the palette, and every sound node is stopped and disconnected.
  - The board and runner pages load the new files on the 9.5.0 tag.
- **Board browser checks** (`npm run test:board`, Chromium):
  - The board fits 1280×720, 1366×768 and 1920×1080 in Light, Animated and Performance with no page scroll, every control on screen, and Add Points at least 44 px tall.
  - A lead change is announced with the new leader; the leader present at start is not.
  - The arena dial mirrors the clock; damage numbers are capped at eight; the layer is removed after the battle.
  - A four-way League tie shows "Shared League Title" with all four champions in one row.
- **Other browser suites pass:** iPhone remote layout (`next-to-invite.cjs`, all five classes at 393 × 660), arena techniques, projectiles and HP, Vixar finale, Unity reward visibility and the access gate. A separate 393 × 660 check with the leader crown and a seal on the cards measured no scrolling and no card overflow.
- **Native Canvas2D renders** (`render-runner-v91.cjs` with `@napi-rs/canvas`): 320 frames pass.
- **End-to-end in Chromium (Animated mode):** the existing skilled test driver played island 1 at 1366 × 768 (a Perfect Run) and at 1920 × 1080 (two deliberate misses). Captured: intro card, gate results, Spirit Surge, guardian card, volleys with damage numbers, guardian defeated, restoration rays, and results with badges. Light mode with reduced motion was also captured.

## Lightweight

- No new images, fonts or libraries. Six new CSS/JS files add 43 KB (13 KB gzipped); nine existing files were edited.
- Island Run frame cost, CPU-only raster (Skia, 1600 × 600, a forced raster every frame, the worst case for a board without GPU help): **v9.3.0 about 10.4 ms per frame, v9.5.0 about 11.6 ms** (+12%). The glow effects reuse one cached 32 × 32 sprite per colour, and the ambience is skipped in Light graphics, on slow boards and with reduced motion.
- Board effects use transform and opacity animations, plus one half-second ring on the score panel. Light mode keeps its static presentation.

## Limits

- Chromium only, at 1280 × 720, 1366 × 768, 1920 × 1080 and 393 × 660. No Safari/WebKit, physical smartboard or iPhone was used, and frame rate on a real smartboard was not measured.
- Sound was checked against a simulated audio engine, not listened to.
- These older browser suites fail at the same step on the untouched v9.3.0 baseline as on v9.5.0, so they were left unchanged: `students.cjs`, `secret-agent.cjs`, `shield.cjs` and `roster-editor.cjs` (the Load islands dialog that opens on class selection blocks their clicks), `verify.cjs` (waits for a wheel Continue button) and `resilience.cjs` (timeout).
- No live Netlify site, Google Sheet or Apps Script deployment was changed.

## Reproduce

From `tests`: `npm run test:v95` (Node.js, no dependencies). `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium. `render-runner-v91.cjs` needs `@napi-rs/canvas`.
