# v7.0 — classroom reliability and controlled animation

## Scenes and teacher controls

One scene controller coordinates Unity, evolution, chests, Subject Wheels, Arena, VIXAR, and champion results. Each timed scene has a cancellable clock. Switching visual mode during a scene waits until that scene ends.

**Pause / Resume** holds the scene's gameplay clock and animations. Hiding the browser tab also pauses the clocks; returning to the tab does not override the teacher's Pause.

**Skip** runs the remaining battle rules to their outcome while suppressing presentation effects. It does not declare the current HP leader the winner. Unity grants only its remaining planned level waves. **Exit** cancels that scene and its remaining work, returning control to the board. Earned reward presentations can be resumed with **Continue rewards**. The champion screen shows Exit only.

The remote mirrors these controls. Point changes are disabled during Arena, VIXAR, and champion results. Four team cards remain visible in the tested 390×844 phone layout.

## Remote delivery

Commands carry a session ID, controller ID, sequence, and command ID. The board acknowledges each command and records its receipt with the session checkpoint. A repeated command cannot award a second point when its acknowledgement is lost. The phone displays pending or confirmed status and retries pending commands after reconnecting. A new lesson rejects commands from a previous lesson.

The board sends a complete current state after pairing/reconnecting. Connection failures before a data channel opens now schedule another attempt; a late event from that failed connection is ignored. Existing on-board phone approval remains.

League and Arena summaries are stored separately on the phone and resent after reconnecting. Both board and phone tabs must be refreshed after this deployment because the command protocol changed.

## Recovery

The board checkpoints scores, levels, progression settings, point values, Class Mission, partial Unity rewards, pending reward presentations, Undo history, remote receipts, and received battle results in local browser storage. The opening screen offers **Resume session** when a valid v7 snapshot exists.

An interrupted Unity sequence resumes its remaining waves without adding previously granted levels again. Chest progression and its point multiplier are committed together. A partially played Arena or raid returns to the scoreboard after reload; it does not pretend to reconstruct every mid-battle position. An already completed Arena result can be restored.

Recovery is for the same browser, device, and site address. It begins with v7.0 sessions and does not import an unsaved v6.9 session. Starting a new session replaces the board's previous recovery checkpoint. Clearing browser data also removes checkpoints and saved local results. PINs and generated avatar markup are excluded from saved records.

## Performance and visual direction

A short frame-time sample runs periodically. Sustained slow frames reduce optional effects in two steps: approximately 60%, then 30% of the normal effect cap. Filters, shadows, and background decoration are reduced as needed. Several healthy samples are required before detail returns, preventing constant toggling.

This preserves the selected mode, team identity, gameplay, Unity assembly, attacks, and Guardian finale. It cannot guarantee a fixed frame rate on every school computer; Light remains the best starting mode for the weakest boards.

Arena and VIXAR use the shared attack/defence motion approach. Brief target outlines make attack direction clearer. Existing team WebP art, anatomical Guardian parts, half-size Guardian presentation, VIXAR seal-first attacks, final strike, and team revival remain in place. No new artwork download or rendering framework is introduced.

## Opening checks

The opening screen reports browser support, local recovery availability, an avatar asset check, audio readiness, and an optional relay credential check. Receiving TURN credentials is not proof that a particular FATIH connection can pass traffic; actual phone pairing is still necessary.

## Google Sheets without Apps Script changes

The existing endpoint and submitted field names are preserved. No changes to your Google Apps Script, teacher PIN, Cloudflare variables, or Netlify function are required.

The phone keeps up to 30 prepared submission records locally, without saving the teacher PIN. A request waiting offline can send when connectivity returns while the page remains open. After reopening the page, enter the PIN again to send a waiting record. **Open saved lesson results** reopens the latest received lesson and its outbox.

| Status | Meaning / next action |
| --- | --- |
| Saved locally · waiting to send | The record is on this device. Keep the page open for an offline retry, or reopen saved results and enter the PIN. |
| Sending… | A request is in progress. |
| Sent · check Google Sheet | The browser finished dispatching the request. Verify the row in Google Sheets. |
| Delivery uncertain · check before retrying | A network error, timeout, or page closure left the outcome unknown. Check the Sheet before using Retry. |

The existing cross-origin submission cannot confirm that Apps Script accepted the PIN and stored the row. v7.0 does not label that opaque response as a confirmed save. It also avoids automatic retries of uncertain or already-sent submissions, because those could create duplicate rows. Manual Retry asks you to check the Sheet first. **Full Session** and **Battle Outcome** require an actual Arena result; they cannot manufacture one from live scores.

## Preserved

The existing title, Performance / Animated / Light modes, team art, scoring rules, Soft 1-step default for new sessions, sequential wheel queue, half-size League Champion, Grand Champion, and minimal result text remain. The TURN function, Netlify configuration, and packaged assets are unchanged.
