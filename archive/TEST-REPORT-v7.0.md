# v7.0 verification

Local Chromium verification completed on 27 September 2026. All 29 grouped regression scenarios passed, with no uncaught page errors or missing local resources in those runs.

## Passed scenarios

### Remote and recovery

- Duplicate point commands apply once, including after a board reload and resume.
- Commands from an old lesson cannot change a new lesson.
- Scores, levels, selected visual mode, and point values survive reload.
- Reloading between chest reveal and closure preserves one evolution and one point multiplier.
- Unity recovery resumes after its stored first wave without granting that wave again.
- A lost acknowledgement triggers a phone retry; the board applies one score and clears the pending command when acknowledged.
- League and Arena summaries remain separate on the phone.
- A failed channel before it opens schedules a reconnect; a stale late-open event is ignored.
- Malformed recovery data does not prevent starting a new session.

### Presentation and combat

- Multiple queued wheels pause and resume without becoming stuck. Tab visibility changes do not override teacher Pause.
- Arena Skip reaches a computed result in Light, Animated, and Performance modes.
- VIXAR finale Skip reaches Guardian victory and full team revival in all three modes when the mission was completed.
- An incomplete mission does not receive a Guardian victory through Skip.
- Exit holds remaining earned reward presentations; Continue rewards resumes them.
- Exit during a live Arena cancels its clock, effects, and stale result callbacks.
- VIXAR Pause preserves combat state. Exit during the final attack cancels pending Guardian work.
- A 4× CPU-throttled finale preserves the outcome and cleanup.
- Adaptive effects step down under a synthetic slow-frame trace and recover only after several healthy samples.

### Mobile, opening screen, and Sheets

- Four remote team cards fit a 390×844 viewport with command status and scene controls.
- Champion controls show Exit only and disable score changes.
- Readiness and recovery layouts do not overflow horizontally at 1024×600 and 390×844.
- Full Session submission is blocked until a real Arena outcome exists.
- A mocked offline result persists without its PIN and sends once when the connection returns.
- Outbox state and the honest Sent status survive reload.
- An ambiguous mocked Sheets request does not automatically retry or falsely claim confirmed storage.

Screenshots of the opening screen, mobile controller, and champion presentation were visually reviewed. All packaged JavaScript parses successfully. Production files contain no test-only state adapter.

## Integration checks

The existing Google Apps Script endpoint, packaged artwork, PeerJS vendor file, TURN function, and `netlify.toml` were compared with v6.9 and are unchanged. The submission retains the existing payload fields: `type`, `className`, `pin`, `standings`, `classMissionCompleted`, `winner`, `remainingHP`, `damageDealt`, and `durationSeconds`.

The cache version on updated game resources and the opening-screen badge are v7.0. The entire public folder is required for the update.

## Limits

Phone commands were tested between two browser pages using simulated transport. The retry and receiver handlers are real application code, but no live PeerJS/TURN connection was made. Sheets requests were intercepted locally; no live Google Sheet was modified. CPU throttling is an approximation, not a measured frame-rate guarantee for Pardus hardware.

There was no Netlify deployment, FATIH-network test, physical smartboard test, or actual iPhone/Safari test. Run the short classroom check in `UPDATE-v7.0.md` after deploying. The existing cross-origin Sheets submission cannot verify successful server-side storage; check the actual Sheet before retrying an uncertain request.

Optional repeatable checks are in `tests/`. Historical v6.x reports apply to their respective releases.
