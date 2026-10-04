# v7.1.3 verification

39 grouped local Chromium scenarios and one focused Apps Script scenario passed, plus champion and small-screen layout checks. No uncaught page errors or missing local resources were reported in the completed runs.

## Student feature checks

- All 119 students across the 20 class/team lists; cancel changes no score.
- Grade-based class defaults select 10, 100, 1,000 or 10,000 as appropriate; manual tier changes remain available.
- First award guides class selection followed by the chosen team's students.
- Lost acknowledgement and retry apply one score and one student credit.
- Combo attribution; rejection of a different team's student or a different class.
- Class changes blocked while attributed scores exist.
- Reset Team clears the live team score while preserving student totals; reset Undo restores the team state without duplicating or removing contributions.
- Final result snapshots include student totals and pre-fill the class.
- Phone reload and board reload/resume preserve class and contributions.
- Milestone bonuses are included in the triggering student's award; team deductions do not reduce earned totals.
- Hard progression and positive custom point awards retain student identity.
- Ranked champion names, tied first places and expandable contributor lists.
- New sessions clear class and totals and dismiss stale selection popups.
- Touch-target and width checks at 320×568, 390×844 and 844×390.
- Apps Script preservation of the existing result sheets, four count-based top-three leader columns, exclusion of student point totals, and PIN rejection.

## Existing behavior

The previous 29 grouped scenarios passed with the remote award test adapted to select a student. These cover command deduplication, old-session rejection, recovery, evolution economy, Unity recovery, wheel queues, Pause/Skip/Exit, Arena and VIXAR in all three modes, remote final records, offline/uncertain result outbox behavior, adaptive effects, CPU throttling and startup/remote widths.

The final contributor screens and pickers were visually inspected. The default champion layout and Start Session control were checked at 1366×768 and 1024×600. Long contributor lists expand into a scrollable result screen. Small-screen picker headers retain the cancel button while the names scroll.

The original artwork, vendor PeerJS, TURN function and Netlify configuration are preserved. All packaged JavaScript and the Apps Script parse in the local test harness. The private test state adapter is injected by the local test server only; production files contain no QA hook.

## Limits

The phone and board were two local browser pages using real application handlers over simulated transport. No live PeerJS/TURN session, Netlify deployment, physical phone/Safari test, FATIH-network test or live Google Sheet write was performed. The Apps Script was tested with an in-memory spreadsheet model; complete the short real-Sheet check after deploying it.

Run the brief real-device check in `UPDATE-v7.1.3.md` after deployment. Optional repeatable checks are in `tests/`.
