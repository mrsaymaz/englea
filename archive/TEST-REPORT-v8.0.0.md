# v8.0.0 verification

Passed:

- JavaScript syntax checks for all public scripts and test scripts.
- Production-function checks for first and repeated student contributions, positive and invalid awards, stable star positions, mission completion on the fifteenth distinct contributor, and no duplicate completion.
- Production Team Reset check: scores clear while halo stars and participation survive.
- Contribution restoration and checkpoint tests: mission and stars reconcile after restored/undone awards, older unfinished missions use the new target, completed legacy rewards remain earned, and empty new-session records clear progress.
- Existing 120-student roster, contribution ranking and Google Apps Script regression checks.
- Existing Level 5/10 wheel, 20-second result hold and unchanged wheel-label checks.

The browser suite includes additional halo, remote retry, Undo, reset and reload assertions. Chromium is not installed in this environment, so browser layout, live animations, and real-device WebRTC behavior were not verified here. Use the short classroom check in `UPDATE-v8.0.0.md` after deploying.
