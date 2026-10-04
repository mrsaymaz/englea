# v7.1.4 — Participation-first student rankings

- Student rankings now use the number of contributions instead of points earned.
- Equal contribution counts share a rank; tied names are shown alphabetically using Turkish collation.
- Every name in the student picker shows its current session count, including **0 contributions**.
- League and Arena champion panels display contribution counts rather than student point totals.
- After final results arrive, the teacher phone offers a private **Participation** summary alongside **Save Record**.
- The summary shows all recorded contributors for each team, highlights each team's first three names and never displays student point totals.
- No attendance feature was added.
- Team Reset continues to preserve student contributions; New Session clears them.
- Existing Google Sheet leader columns already use award counts, so no Apps Script redeployment is required if v7.1.2 is installed.

The app still keeps earned-point totals internally because they are needed for scoring, Undo and session recovery. Those totals no longer determine student rank.
