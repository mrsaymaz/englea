# v9.4.0 verification

## Passed

- **Full dependency-free suite** (`npm run test:v94` from `tests`): every v9.3 check, including 160 full v9.3 runs, all question variants, passport merging, Apps Script, connection and tally hooks, plus the new `island-v94.cjs`:
  - Every realm palette has the new scene colours and keeps the v9 island-art colours.
  - Scene colour starts muted, holds without answers, rises with correct answers and is complete when the guardian falls; reduced motion jumps to the target; restored islands start brighter.
  - 392 stub-canvas frames over every realm, house, Light/automatic graphics and course, gate and boss phases: no errors, drawing never changes gameplay state, particles and the gradient cache stay bounded.
  - Board seals: hidden until a stamp exists; count, latest guardian art and spoken label are correct.
  - Only a finished run celebrates a new seal; a Sheets load or an expired run marker does not.
  - Board and runner pages load the shared look, the seals script and only v9.4.0 asset URLs.
- **Native Canvas2D renders** (`render-runner-v91.cjs` with `@napi-rs/canvas`): 320 frames pass, all houses, ten mechanics, boss warnings, openings, projectiles, Focus, reduced motion and bounded particles.
- **Remote layout in Chromium** (`next-to-invite.cjs`): all five classes still fit at 393 × 660. With a seal on a card, a separate 393 × 660 check measured no page scroll and no card overflow. **Arena, projectiles, Vixar finale, Unity reward, access gate, island-v91 and island-v92** browser and unit suites pass.
- **End-to-end in Chromium**, with the existing skilled test driver steering a real browser run on island 1: muted start, colour returning through six correct answers, boss, restoration scene, result dialog. After Back to Champions, the seal announcement appears and the team card shows the seal with NEW. Islands 3, 4, 6, 7 and 10 were also captured for their realm scenery.

## Limits

Chromium only, at 1366 × 768, 1920 × 1080 and 393 × 660; no Safari/WebKit, physical smartboard or iPhone. These older browser suites fail with the same errors on the untouched v9.3.0 baseline as on v9.4.0, so they were left unchanged: `students.cjs`, `secret-agent.cjs`, `shield.cjs` and `roster-editor.cjs` (the Load islands dialog that opens on class selection blocks their clicks), `verify.cjs` (waits for a wheel Continue button) and `resilience.cjs` (timeout). Frame rate on low-end smartboards was not measured; Light graphics mode skips the clouds, grass, dust and parallax scrolling. No live Netlify site, Google Sheet or Apps Script deployment was changed.

## Reproduce

From `tests`: `npm run test:v94` (Node.js, no dependencies). `node next-to-invite.cjs` needs Playwright with Chromium. `render-runner-v91.cjs` needs `@napi-rs/canvas`.
