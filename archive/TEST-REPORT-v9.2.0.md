# v9.2.0 verification

## Passed

- **640 complete scripted runs:** 240 across every grade/island/mode/reading pace, plus 400 additional seed and 20/60-FPS combinations. Each completed six questions, an island mechanic and the interactive boss through normal controls. These skilled bots establish feasibility, not classroom success rates.
- **Retained gameplay checks:** all 4,240 question variations validate; no-repeat history, teacher overrides and older backups remain compatible. Distance-based jumps work through reading slowdown. Coin targets still use the exact finite route total; one-coin-short failures and bonus-score exclusion remain tested. House rules are identical.
- **Six new vector/gameplay checks:** ten physically different restored silhouettes; capped adaptive quality with cautious recovery and manual Light; smooth house gaits and distance-based jump tilt; live coins and single hazards in reading corridors; obstacle breathers and safe cluster lanes; magnet visuals cannot create coins or alter targets.
- **320 native Canvas2D frames:** four houses × ten islands × eight course/Focus/question/boss/impact/reduced-motion/Light states. Rendering does not mutate the run. All ten boss signatures also produce distinct images with the same colour. Light stays at or below 18 active particles and one million canvas pixels; full graphics retains the 60-particle, 2.4-million-pixel caps.
- **Visual inspection:** ten boss attack scenes, twenty damaged/repaired island drawings and a Focus/encounter frame were reviewed. A malformed crystal-ruin path was corrected before packaging.
- **Real application code in a DOM harness:** champion/class/current-avatar launch, authenticated child binding, completed run and scoped save, unobstructed restoration before results, layered landmark reveal, boss emblem/stars, one-time new passport stamping, remembered Light preference, pause/reopen, teacher edits, backup import and session cleanup.
- **Cloud/backend regressions:** progress and passport best-only merging, class/team isolation, outbox retries, session deduplication, old-script capability errors, roster changes and teacher publication remain tested against the complete existing Apps Script and simulated spreadsheet.
- **Connection/tally regressions:** shipped PeerJS binary chunking, dropped-sync/receipt recovery, mixed builds, stale messages, TURN diagnostics, contribution-count rankings, reset preservation, constellation stars, Class Mission, four-team recognition and arena balance checks pass.
- **Scope comparison:** the full main tally `game.js` matches v9.1.0 except its build number. All Netlify functions/configuration, Apps Script files and the student roster are byte-identical to v9.1.0.

## Limits

Canvas rendering and the DOM harness are not native browser layout tests. Chromium was unavailable in this environment. Browser CSS layout, actual touch/Safari behaviour and physical smartboard/iPhone testing were not performed. No live Netlify site, Google Sheet, Apps Script deployment or Cloudflare account was changed or tested.

Use the short classroom check in `START-HERE-v9.2.0.md`. In particular, confirm long-choice readability and try Light on your actual board. Automatic graphics adjustment is tested with synthetic timing samples; its benefit on your board still needs a playtest.

## Reproduce

From `tests`, run **npm run test:v92** with Node.js. The regression suite has no external dependencies.

The optional native renderer is `tests/render-runner-v91.cjs` (retained name, updated coverage). It uses `@napi-rs/canvas` from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; optional image output also uses Sharp. Neither library is a runtime dependency of the game. All new live visuals use local Canvas/SVG/CSS; no framework, external font, shader or new image download was added.
