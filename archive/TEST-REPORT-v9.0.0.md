# Version 9 verification

Passed dependency-free tests:

- `node tests/teacher-studio.cjs`: real Studio UI handlers for PIN/retry, objective/question publication, grade and island changes, embedded roster loading guard, class-progress table and close.

- `node tests/version9.cjs`: all 40 default banks validate; bulk vocabulary in both directions; invalid choices/blanks/IDs; PIN rejection; versioned online saves; idempotent retries; stale-edit conflicts; grade isolation; formula-safe objective storage; expansion beyond 1,000 sheet rows; write locks; proxy routing; out-of-order teaching chunks; stale-cache rejection; shared restoration stages; bounded continuous avatar motion; cloud-question history.
- `node tests/island-run-integration.cjs`: actual embedded UI code boots with the champion's class/current avatar; published objective and questions load; edits leave an active run unchanged and enter the next run; completed runs preserve scoped progress; pause/back/reopen, local backup import, exact-child authorization and session disposal work.
- `node tests/island-cloud.cjs`: class/team cloud restore, best-only merges, latest progress, idempotent lesson retries, invalid data/PIN, old-script preflight and proxy errors.
- `node tests/island-save-flow.cjs`: remote saves the latest post-Arena progress and refreshes pending records; server confirmation required; incorrect class rejected; PINs not persisted.
- `node tests/roster-backend.cjs`: initial 120-student roster, stable identities, additions/removals/moves, conflicts/retries, validation, locks and existing result/participation writes.
- `node tests/island-run-tally-hooks.cjs`: Arena winner, both champion titles, participation records and remote pause/back behavior retained.
- `node tests/remote-sync.cjs`: dropped startup state/receipt recovery; late approvals; stale receipts/actions; failed state application; mixed-build rejection; timeout behavior.
- `node tests/island-runner/test-engine.cjs`: 23 checks, 4,240 question variants, 240 completed simulated runs covering grades, islands, modes and reading speeds; coins/obstacles remain active during questions; forward jumps; unchanged percentage boss thresholds and team-equivalent rules.

Production JavaScript syntax and local HTML resource references were checked. The five island restoration stages were rendered to an image for inspection.

Limits: the UI checks use a DOM harness, not a native browser. No physical iPhone/Safari, smartboard, live PeerJS/TURN, Netlify or Google Sheets integration was exercised for this release. Apps Script tests use an in-memory spreadsheet model. No live deployment or live spreadsheet was changed. Existing browser tests remain included for later Chromium verification.
