# Verification — v8.9.0

Passed dependency-free checks:

- `node tests/island-cloud.cjs`: class/team isolation, restore, max-score/star merge, new post-run data, repeated FULL_SESSION and individual result saves without duplicates, validation, PIN failures, old-script capability check, origin and network errors.
- `node tests/island-save-flow.cjs`: actual remote Save function and outbox; latest progress after an earlier save, same session ID, confirmed success, wrong PIN, network ambiguity, wrong-class rejection, no PIN in persistent storage.
- `node tests/island-run-integration.cjs`: actual embedded runner scripts, champion/class/avatar, child connection, completed run, pause/return/reopen, backup import and cleanup using a DOM harness.
- `node tests/island-run-tally-hooks.cjs`: actual Arena result and remote hooks; correct champion, launch with no paired remote, controller exclusion and tally-state preservation.
- `node tests/roster-backend.cjs`: current complete Apps Script retains roster seeding, edits, conflicts, locks, participation leaders and result writes.
- JavaScript syntax checks for modified browser and Netlify modules.

Limits: these checks use simulated DOM, SpreadsheetApp and HTTP responses. Native Chromium could not run because its executable is unavailable in this workspace. No live Google spreadsheet, Netlify deployment, physical iPhone or smartboard was modified/tested. Follow the short end-to-end check in START-HERE after deployment.
