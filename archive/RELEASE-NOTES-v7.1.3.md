# v7.1.3 — Students contribute to their teams

## Rosters

| Class | Gryffindor | Slytherin | Ravenclaw | Hufflepuff | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5-A | 7 | 7 | 6 | 6 | 26 |
| 5-C | 6 | 6 | 7 | 6 | 25 |
| 6-C | 5 | 6 | 5 | 5 | 21 |
| 7-A | 6 | 6 | 6 | 6 | 24 |
| 8-B | 6 | 6 | 6 | 5 | 23 |
| Total | 30 | 31 | 30 | 28 | 119 |

Names retain the supplied spelling, Turkish characters and initials. Every student has an identity scoped to class and team, so repeated names remain separate.

## Remote and board

- **Class** opens large buttons for the five classes. The confirmed choice remains visible on both devices.
- A newly selected class chooses its grade starting tier automatically: 5-A/5-C = 10, 6-C = 100, 7-A = 1,000 and 8-B = 10,000. The four point controls remain active, and choosing another tier manually is respected for the rest of the session and after recovery.
- **+** opens the selected team's student names. The award is sent only after a name is tapped; cancel has no effect on score or evolution.
- The board validates the class and team membership before applying remote awards. Retries share the existing command receipt, so one award gives one student credit.
- Class selection locks after the first student earns points. Team Reset preserves those contributions and keeps the class selected. Starting a new session clears the selection and begins a fresh contribution record.
- Student names briefly appear near their avatars with actual awarded points and, where relevant, evolution progress. Motion uses a short transform/opacity animation; Light mode and reduced-motion preferences use a static, temporary badge. There is at most one active badge per team.
- Small phone screens use a single column when needed. The popup header and cancel control stay available while scrolling. Native dialogs support keyboard focus, Escape and touch.

## Contribution rules

Student totals count the positive points actually earned by their selected award, including combo, comeback, power-up, relic, Point Rush and triggered milestone bonuses. Positive custom awards also count; their existing behavior does not grant evolution progress.

The existing team scoring and evolution rules are unchanged. Team penalties, automatic events, score swaps, Snitch rewards and wheel rewards remain team-level effects. They do not rewrite individual earned-point totals. For that reason, individual totals can differ from a team's final net score.

Rankings use earned points, highest first. Equal totals share a rank; the supplied roster order is retained within a tie. Each champion shows its top three contributors. When several teams share the League title, each tied team has a compact leading-contributor list. Extra names remain available through **View all**, and ties extending beyond the preview are explicitly labelled. Zero-point students do not appear as contributors.

Battle champion contributors are the students who earned points for that team during the lesson. The automatic Arena does not award individual combat scores.

## Undo, resets and recovery

- Undo restores the score and student totals from the same snapshot.
- Reset Team clears that team's score, level, evolution progress, traits, relic and power-ups while preserving every student's earned contribution total. Undo restores the team state without changing those preserved totals.
- New Session and Season Reset clear student totals and the class choice with the existing session reset.
- Board recovery restores class and contributions. A reconnecting or refreshed phone receives these from the board.
- Older v7 snapshots can still be resumed. Their previous unassigned points cannot be attributed retrospectively.
- A new session or lost connection dismisses a pending student picker. Awards from an old session are rejected.

## Final records

League and Arena result snapshots sent to the phone include the selected class and a structured `studentContributions` field with names, teams, earned points, award counts and ranks. The class field in **Save Official Record** is pre-filled. Student contribution counts are retained with the local official-result outbox payload when you save that result.

The included `GOOGLE-APPS-SCRIPT-v7.1.2.gs` preserves the existing `Leaderboard` and `Battle_Results` fields and adds four columns to `Leaderboard`: **Leaders of Gryffindor**, **Leaders of Hufflepuff**, **Leaders of Slytherin**, and **Leaders of Ravenclaw**. Each cell contains up to three students, ordered by how many times they contributed. Equal counts are alphabetized using Turkish collation. Point totals are not written to these leader columns.

These are per-session totals. Save a finished result before beginning another lesson if you want to keep its local record. This update does not add a cross-session student leaderboard.
