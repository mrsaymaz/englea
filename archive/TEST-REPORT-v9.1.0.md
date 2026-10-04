# v9.1.0 verification

## Passed

- **640 complete scripted runs:** 240 covering every grade, island, mode and reading pace; 400 additional seed/20-FPS/60-FPS combinations. Each completed all six questions, encountered its island mechanic and defeated the boss using real controls. These skilled bots are feasibility checks, not predictions of student success rates.
- **23 retained engine checks:** all 4,240 question variations validate; answers/types/lanes shuffle; class question history, teacher-edited banks and older backups remain compatible; jumps work through reading slowdown; coin thresholds remain exact, including one-coin-short failures.
- **11 new feature checks:** prompt-before-choice timing, live coins/hazards, one-charge Focus shield and bounded meter, ten distinct mechanics, interactive firing/dodging, stationary-camera boss jumps, missed-opening failures, pause, passport best-only merging, old-sheet extension, custom-column protection and old-script capability checks.
- **240 actual Canvas2D smoke-rendered frames:** all four team artworks × ten islands × six encounter/Focus/boss/reduced-motion states. Three representative frames were visually inspected. The particle pool stays at 60 objects.
- **Real application code in a DOM harness:** champion/class/current-avatar launch, direct-entry protection, embedded run completion, unobstructed five-second restoration before results, exit/reopen pause, live teacher publication isolation, backup import and session cleanup.
- **Sheets/backend simulations:** complete updated Apps Script executed against an in-memory spreadsheet. Existing roster, leaderboard, battle, teaching content and session-id deduplication tests pass. Passport percentage and Hard clears survive weaker replays, stale restores and repeated saves; no unknown coin statistic is invented for old victories.
- **Remote regression:** full roster snapshots pass through the shipped PeerJS binary serializer and actual sync handlers. Dropped states/receipts, mixed builds, stale messages and timeouts retain their existing handling. TURN diagnostics and long-lived-token exclusion pass.
- **Coin-economy sanity check:** another 400 scripted comparisons used a coin-chasing bot and an answer-focused bot. Both played boss controls; only the first chased ordinary coin trails. The collectors won 200/200; the non-collectors lost 200/200 from coin shortfalls. This verifies that learning bonus points still do not replace the coin requirement; it does not measure human difficulty.
- **Tally regression:** participation counts, reset preservation, constellation stars, Class Mission, all-four-team recognition and arena balance unit checks pass. Main `game.js` differs from v9.0.1 only in its build number. TURN credential code is unchanged.

## Limits

The full Chromium browser could not be installed in this environment; its download failed. Native browser CSS layout, browser touch input, accessibility-tree behaviour and end-to-end browser screenshots were not run for this release. Canvas rendering and DOM harnesses are not substitutes for those checks.

No live Netlify deployment, Cloudflare setting, Google Sheet or Apps Script deployment was changed or tested. No physical smartboard, Safari or iPhone was used. Earlier mobile-layout test reports apply to earlier releases; the teacher remote markup and styles are unchanged here.

Use the pre-class checklist in `START-HERE-v9.1.0.md`. Keep the working deployment and local backup until that check is complete.

## Reproduce

From the `tests` folder, run `npm run test:v91` with Node.js. It has no external dependencies and includes gameplay, application-harness, backend and connection checks.

`render-runner-v91.cjs` is an optional native canvas smoke renderer. It uses `@napi-rs/canvas` from `CODEX_PRIMARY_RUNTIME_NODE_MODULES` in the supplied test environment; it is not a browser layout test or a runtime dependency of the site.

All live gameplay assets are local. No new external JavaScript framework or service is required. Canvas resolution is capped at 2.4 million pixels, with DOM question text staying sharp. Only the selected/next boss artwork preloads; opening the gallery or passport deliberately loads the requested art.
