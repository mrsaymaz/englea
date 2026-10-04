# v8.9.1 — remote synchronization repair

The reported screenshot shows disabled controls and “Waiting for a connected smartboard” on the phone, despite a connection message on the board. The old board message confirmed only that its data channel opened. The old startup exchange did not retry session synchronization independently of connection heartbeats.

This update retries the initial state exchange, requires the phone to acknowledge successfully applying the current session, and reports the board as connected only after that receipt. Dropped initial updates/receipts recover; a silent live connection times out and reconnects. A late approval cannot demote an already-synchronized phone to Connecting. Old-session/wrong-connection receipts cannot unlock actions.

A **Retry sync** button appears on the phone while synchronization is incomplete. It requests fresh state without resetting the lesson. Different builds show an explicit version-mismatch message. The mobile header now separates status from controls so that Manage and Class cannot cover the connection indicator in narrow Safari viewports.

## Install

1. Deploy the complete contents of this ZIP to your existing Netlify project, including `public`, `netlify/functions` and `netlify.toml`.
2. Close/reload old app tabs on **both** devices. The opening screen must say **Island Run Edition · v8.9.1** on each. Do not clear local game storage.
3. Since you have not deployed v8.9.0 yet, also complete its Apps Script upgrade using **GOOGLE-APPS-SCRIPT-v8.9.0.gs**. Follow **START-HERE-v8.9.0.md** for those steps. The script included there is still the current complete backend; v8.9.1 does not change it.
4. Pair the phone and approve it on the board. The phone should change from **SYNCING…** to **CONNECTED**. The board should say **session synchronized**.
5. Choose a class, load island progress if desired, and award one student a point. Confirm the phone and board update together.

This ZIP includes all v8.9.0 cloud island-progress functionality. You can skip deploying the older ZIP and install this one directly. References to a v8.9.0 startup badge in that older setup guide are superseded by v8.9.1.

If the phone remains stuck, use Retry sync once and note the detailed message beneath its header. Version mismatch means both devices must load the new files. If it persists after both show v8.9.1, provide the full Netlify URL and that message so the deployed assets/network can be checked. The screenshot alone does not prove the exact network or browser trigger.

## Verification

`node tests/remote-sync.cjs` exercises the actual state handlers with dropped initial snapshots and acknowledgments, late approval, stale receipts, blocked commands before readiness, state-application errors, mismatched versions and a silent open transport. All passed.

The five v8.9.0 cloud, remote save, embedded runner, Arena hook and roster-backend suites also pass. JavaScript syntax checks pass. This environment has no native browser executable, so a live WebRTC/Safari and physical-phone test remains necessary after deployment. The supplied screenshot was visually inspected; no live Netlify deployment was changed here.
