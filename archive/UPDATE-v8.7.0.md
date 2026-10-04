# English League v8.7.0 — Online roster editor

Manage is now available in the remote's top bar. After Teacher PIN authentication, teachers can add, rename, move, remove and restore students. The existing spreadsheet gains a Roster tab seeded automatically with all 120 existing students. Setup instructions are in SETUP-ROSTER-v8.7.0.md; deploy GOOGLE-APPS-SCRIPT-v8.7.0.gs as a new version of the existing Apps Script deployment.

Roster edits use stable student IDs, version/conflict checks and acknowledged saves through the new Netlify roster function. PINs are not written to browser storage or URLs. Names are validated and rendered as text. Removed students keep their IDs as inactive records. The editor supports the five existing classes and up to 500 records, including removed students.

Live lessons keep roster snapshots through board/phone sync, Undo and recovery. New Session uses the most recently loaded saved roster; active lessons remain unchanged. The current catalogue is cached on both devices. Loading changes from another device requires Manage → Load online, using the Teacher PIN. Offline copies support lessons; edits need a confirmed online save.

Existing leaderboard, battle, Full Session and contribution-count leader writes are retained. Result saves cannot accidentally target the new Roster tab. Existing result rows are not migrated or rewritten.

Validation:
- Apps Script and bridge checks: 120-student initialization only after authentication; add/rename/move/remove persistence; ID retention; conflict rejection; safe retries; name validation; lock behavior; leaderboard/battle/Full Session writes and top-three contribution counts.
- Browser integration against the real Apps Script code running in a local Sheets simulator: Manage at 393 × 660, wrong PIN, edits, conflicts, network errors, active roster isolation, next-session adoption, recovery and Undo.
- Existing next-to-invite regression suite: iPhone 14 Pro portrait/safe-area layout, all default roster names, 44 px scoring controls, live participation lists and resets.
- Existing Secret Agent regression suite: private selection, transfers, negative totals after reset, summary records and recovery.

No live Google spreadsheet or Netlify deployment was changed during development. Follow the setup guide to activate this update. Guardian's three consecutive rewards, Vixar's two-claw finale and the prior arena balance are retained.
