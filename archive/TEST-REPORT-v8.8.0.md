# v8.8.0 verification

## New integration checks

`node tests/island-run-integration.cjs` runs the parent module and the actual embedded runner scripts in a dependency-free DOM harness. It covers:

- No launch before an eligible, authenticated Arena result; exact child-window/token binding.
- Winning team, session class, grade, current avatar and previously unlocked island selection.
- Fixed champion/class selectors with preserved Soft/Hard, teacher tools and backup imports.
- A complete six-answer run through the real embedded UI, with completed progress saved only to the winning class/team.
- Pause/resume, return/reopen without losing an unfinished run, cancellation of hidden animation frames, result return and cleanup on session exit.
- Class choice when the tally session had none, half-loaded frame disposal, load retry and direct-entry guard.
- Rejection of stale child messages and hiding the runner when teacher access locks.

`node tests/island-run-tally-hooks.cjs` executes the actual result rendering, winner selection, launch adapter and remote command functions. It covers separate Arena/League winners, a shared Grand Champion, current avatar traits, preserved tally scores/contributions, remote pause/return and blocked score/class changes during the result.

These are logic/DOM harnesses, not native browser visual tests.

## Gameplay and existing feature checks

`node tests/island-runner/test-engine.cjs`: all 23 suites passed, including 240 full runs across every grade, island, difficulty and reading pace. Every scripted run completed all six answers and defeated its boss. Exact coin thresholds, jumps through speed changes, repetition control and v1/v2 backup migration are covered.

The following existing dependency-free suites also passed:

- `tests/arena-balance-unit.cjs`
- `tests/apps-script.cjs`
- `tests/participation-unit.cjs`
- `tests/v7-2-unit.cjs`
- `tests/teamwork-unit.cjs`
- `tests/roster-backend.cjs`

Static checks verified unique page IDs, local script/style references, JavaScript syntax, the launch button's placement inside the Arena champion panel and preservation of every existing archive entry. Approved Runner v3 physics, banks, boss rules, rendering and base styles are byte-identical. The roster, Secret Agent, scoring rules, access gate, scene runtime, Apps Script files and Netlify Functions are byte-identical to the attached v8.7.0 build.

## Device checks remaining

Native browser visual/layout checks, live WebRTC, actual Google Sheets, a production Netlify deployment and physical smartboard touch were not exercised. Historical browser tests remain included, but their earlier reports are not claims of a new browser run for this integration.
