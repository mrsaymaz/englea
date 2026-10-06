# Changelog

Newest first. Full notes for earlier versions are in `archive/`.

## 10.4.0
**The Challenge Deck** on the English wheel (Level 5 and Level 10):
- The wheel deals a real card from the class's island content: the island the team plays next, then the islands before it, with the teacher's Studio edits. Nine cards: Vocabulary, Translation, Grammar, Sentence Repair, Listening, Ask a Question (three options), and Taboo Description, Pronunciation, Speaking (the teacher judges ✓ / ✗).
- The card names the student who gave the team its last point and shows the stakes.
- Right keeps everything. Wrong takes the team back to where it stood when it reached the previous level (points, level, evolutions, relic, milestones). The wheel waits at that level again; Undo reverses a mistaken judgement. Skip changes nothing.
- Three-option cards are answered on the board or from the phone. The board shows Right or Wrong, the correct answer and a short explanation.
- Taboo: the phone alone shows the English word and up to four forbidden Turkish words (the translation, then Turkish words from its meaning). No timer.
- The phone shows the card with ✓ / ✗, the options, Skip card and Continue. Each button names its card, so a late tap never answers the next card.
- The manual English wheel deals practice cards (no points change). The All Subjects wheel is unchanged.
- Every card is saved to a new **Challenge_Log** tab with the session (day-first dates, no duplicate rows).
- An open, unanswered card's wheel is kept in the recovery snapshot and spins again after a reload.

Apps Script: `GOOGLE-APPS-SCRIPT-v10.4.0.gs` (includes v10.2.0 and v10.1.2).

## 10.3.0
**Smoother class moments on slow smart boards** (nothing looks or plays differently):
- **Island Run:** resolution steps (100%, 75%, 55%) chosen by the run's own speed and remembered by each board. On a quarter-speed CPU, later runs reach 53 fps instead of 26.
- **Awards:** no whole-board layout recalculation while an award runs:
  - score, level badge and leader-crown restarts no longer force a layout;
  - the ranking slide uses card places measured when the grid changes size;
  - the page's leader class changes only when the leader changes.
  The worst frame went from 233 ms to 83 ms on the slowed CPU.
- **Battle Arena:** the board background is not drawn under the Arena; the glow behind the fighters is screen-sized, and still on boards that need lighter effects; the effects level is checked every 4 s during a fight and remembered for each board.
- **Session recovery:** saved when the board is idle (within 0.6 s), and at once when the page is closed or hidden.

No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.2.0.gs`.

## 10.2.0
**Comeback Halo**:
- Teams that won neither the League title nor the Final Arena in a class's last session earn ×2 on every positive award (+ button and custom points; never deductions) for that class's next session.
- Shown as a golden halo with "×2" above the avatar's head. Its position is set for each of the 44 evolution pictures and for the Light avatars, so it follows the creature as it evolves. The avatar shrinks slightly when needed so the halo clears the team name.
- The phone marks halo teams with "×2".
- Shared League titles count every tied team as a winner.
- The halo is chosen with the class and fixed from the first award; it is kept after a reload.
- The board records each class's result when the Arena ends. Load islands also returns each class's last saved session from Google Sheets, so a class keeps its halo on any board.

Apps Script: `GOOGLE-APPS-SCRIPT-v10.2.0.gs` (includes v10.1.2).

## 10.1.2
**Dates in Google Sheets are day first (DD/MM/YYYY)**:
- The Apps Script now writes every date as a real date shown `dd/mm/yyyy hh:mm:ss`, whatever the Sheet's locale. This covers Leaderboard, Battle_Results, Student_Contributions, Navigator_Seals, Island_Progress (Last updated) and Question_Log.
- Question_Summary's Last wrong is a day-first date without the time.
- Earlier versions wrote US-style month-first text.
- A new `formatOldDates()` function, run once from the Apps Script editor, converts the dates of earlier saves. It leaves any other text unchanged, and a second run changes nothing.

Apps Script: `GOOGLE-APPS-SCRIPT-v10.1.2.gs` (required; includes v10.0.0).

## 10.1.1
**Student cards on the board**:
- One card at a time: a new award fades the previous card out in about 0.2 s before the next one appears.
- When an award changes the ranking, the card on screen fades first, then the team cards slide, and the new card appears once its team card has landed. Before, cards rode along with the sliding team cards and crossed over each other.
- Shorter freeze at each award:
  - the card is built in the frame after the score update;
  - its entrance starts once it has been drawn;
  - the ranking slide no longer measures the cards a second time;
  - the frame stripe flows by transform instead of being redrawn every frame;
  - the edge shapes and the crown have no blurred shadows.

In a quarter-speed CPU test, the longest frame at an award dropped from about 140 ms to about 100–110 ms. The card's look is unchanged. No Apps Script change.

## 10.1.0
**One-step Teacher sign-in**:
- A Teacher PIN box sits under the room code on the phone's opening screen.
- After Allow on the board, the phone signs in once. It loads the online roster (student names), then the class's islands, navigator seals, questions, answer log and School League Season, and passes them to the board.
- Load islands, Save Record (prefilled), saved-result Send/Retry, Manage and Studio reuse the same PIN, so there are no separate prompts.
- New names reach today's lesson until the first award.
- A wrong PIN is reported on the phone and asked for once; the PIN that works there signs in for everything.
- A status pill on the phone shows the result, and the More sheet adds **Teacher sign-in**.
- The PIN stays in memory only.

No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.0.0.gs`.

## 10.0.2
School League Season: the totals loaded on the phone (where the PIN is typed while a phone is connected) now always reach the board when its copy is older or missing, and an older Apps Script is reported on the board as "Update Apps Script to v10.0.0" instead of "Load islands". No Apps Script change.

## 10.0.1
The "★ First time" tag sits above the elemental card effects (and the edge effects behind it are left out). No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.0.0.gs`.

## 10.0.0
**Elemental student cards**: the award card takes on the student's team element as they collect navigator seals (fire for Gryffindor, nature for Slytherin, water for Ravenclaw, air for Hufflepuff), growing in four stages with no number shown: tinted frame and particles (1–3), breathing glow (4–6), a flowing elemental frame with flames, leaves, droplets or wind curls along the top edge (7–9), and at all ten seals a crown and a title: Flamebearer, Earthshaker, Tidecaller, Stormrider. One level-up burst on the next card after a new seal; Light mode and reduced motion show the cards still. **School League Season**: one season for every class at the school; League title = 1 win (a shared title gives each tied team a win), Final Arena = 1 win, Grand Champion = 2; every session already in the Sheet counts; a Season Wins panel in the upper right of the Champions screen shows today's wins until they are saved. Apps Script: `GOOGLE-APPS-SCRIPT-v10.0.0.gs` (includes v9.6.0 and v9.7.0).

## 9.7.0
Island Run navigator and accessibility. **One navigator per session**: a random contributor of the Arena champion team (the whole team if nobody contributed) leads every Island Run of the session; kept through a reload; "Another student" removed. **Navigator seals**: each island the navigator's runs complete (not practice) earns that student the island's seal; the student award card grows to show ten seal places (islands 1–10, two rows of five) instead of the points; team cards (board and remote) no longer show seals; a "Navigator seal earned" card after the run. Google Sheets: a **Navigator_Seals** tab (one row per student and island, matched by student ID), returned by Load islands and synced board ⇄ phone. **Student controller** on the teacher's phone: pops up when a run starts, large UP / DOWN / JUMP buttons, and a Bluetooth keyboard paired with the phone steers the runner (↑ ↓, → or Space) as light, session-bound messages; the phone tries to stay awake during Island Run. Apps Script: `GOOGLE-APPS-SCRIPT-v9.7.0.gs` (required; includes v9.6.0).

## 9.6.0
Animated mode and classroom requests. **Performance mode removed** (Animated and Light remain; a saved Performance choice opens Animated). Board: no "takes the lead" banner (the crown drops onto the new leader); no point bubbles on the board or the remote; Class Mission is one continuous, smoothly filling slim bar; Award Custom Points closes with × and Escape. Arena: attack and relic names are no longer shown in the centre (knockouts, Surge, Final Clash and the winner remain). Remote: taller team cards with at least three names each. Google Sheets: every student's contribution count is recorded in a new **Student_Contributions** tab (one row per student per session, zero included, updated in place on re-save), and Leaderboard I–L list every contributor with counts. Island Run: one navigator for the whole run; a fixed-height prompt panel (smaller pictures, Word Trail clue and slots on one row, long text steps down), so the course never resizes mid-run; far scenery always moves, the landmark never snaps and automatic graphics cannot bounce; new cached-sprite renderer with a lane surface per island type, turning coins, shaded obstacles, letter medallions, attack and firing lanes, weak-point reticle, coin-volley trails and a light-curtain gate, at about 40% less frame cost than v9.5.0. Apps Script: `GOOGLE-APPS-SCRIPT-v9.6.0.gs` (required).

## 9.5.0
Presentation pass across the game, still lightweight (no new images, fonts or libraries). Board: fits 1280×720 to 1920×1080 without scrolling in every display mode; larger scores that count up in Animated mode; points fly from the award ribbon into the score; leader crown and a "takes the lead" banner; slim segmented Class Mission meter; point and subject controls on one row; status pills step aside; Reset Season moves to a quiet corner link; a "★ First time" tag for a student's first contribution. Arena: solid backdrop, countdown dial in the platform centre, damage/critical/evade numbers, callouts for knockouts, signatures, Surge, Final Clash and the winner, a small shake on critical hits. Champions: a shared League title shows its champions in one row with coloured names. Island Run: title cards (intro, guardian, Spirit Surge, Perfect Run, guardian defeated); answer streak meter; **Spirit Surge** (every third correct answer in a row fills Elemental Focus); **Perfect Run** (+300 points for six of six; coins, stars and unlocks unchanged); answer gates burst or crack and light the right answer; floating points and guardian damage numbers, hit flash and a lagging damage trail; realm ambience, light shafts and restoration rays; living map water; result score count-up, star landing and badges; synthesised sound palette. Remote: crown and ring for the leading team, +N pop on new points. No Apps Script change.

## 9.4.0
Island Run visual polish: one header while running (sound, full screen and pause move into the run bar); a daylight palette and distinct skyline for each island type, which starts muted and regains its colour with each correct answer and fully when the guardian falls; spinning coins, running dust and a landing squash; lane letters A/B/C coloured to match the answer gates and lit for the runner's lane; plain coin target ("of 89 needed"); locked islands show a lock and the next island beckons on the map. Passport seals from successful runs appear on the team's board card and remote card, with a one-time announcement after the run. Shared look (`league-look.css`) for the board, remote and Island Run; the title and fonts stay as in v9.3.0. No Apps Script change.

## 9.3.0
Island Run learning loop: team answers are logged to Google Sheets (Question_Log, Question_Summary); missed concepts return in later runs; one second chance per run; listening gates (English voice only) and picture gates, switchable from the remote; Word Trail letter-coins before the boss with a 15% Word Strike; navigator names from the session's contributors; compact iPhone remote with a More sheet and Island Run panel. Old documents moved to `archive/`. Apps Script: `GOOGLE-APPS-SCRIPT-v9.3.0.gs`.

## 9.2.0
Island Run scenery and gameplay refinement · see `archive/START-HERE-v9.2.0.md`

## 9.1.0
the interactive Island Run update · see `archive/START-HERE-v9.1.0.md`

## 9.0.1
repair the reconnect / repeated approval loop · see `archive/START-HERE-v9.0.1.md`

## 9.0.0
Version 9 — update and use · see `archive/START-HERE-v9.0.0.md`

## 8.9.1
remote synchronization repair · see `archive/UPDATE-v8.9.1.md`

## 8.9.0
save and restore Island Run progress · see `archive/START-HERE-v8.9.0.md`

## 8.8.0
v8.8.0 verification · see `archive/TEST-REPORT-v8.8.0.md`

## 8.7.0
Set up the online roster — English League v8.7.0 · see `archive/SETUP-ROSTER-v8.7.0.md`

## 8.6.1
Visible threefold Unity reward · see `archive/UPDATE-v8.6.1.md`

## 8.6.0
Vixar and Unity Guardian · see `archive/UPDATE-v8.6.0.md`

## 8.5.1
Arena balance report — English League v8.5.1 · see `archive/BALANCE-REPORT-v8.5.1.md`

## 8.5.0
English League v8.5.0 · see `archive/UPDATE-v8.5.0.md`

## 8.4.0
English League v8.4.0 · see `archive/UPDATE-v8.4.0.md`

## 8.3.0
Secret Agent · see `archive/UPDATE-v8.3.0.md`

## 8.2.0
Next to invite · see `archive/UPDATE-v8.2.0.md`

## 8.1.1
English League v8.1.1 · see `archive/UPDATE-v8.1.1.md`

## 8.1.0
Recognition for every team · see `archive/RELEASE-NOTES-v8.1.0.md`

## 8.0.0
Teamwork constellations · see `archive/RELEASE-NOTES-v8.0.0.md`

## 7.2.0
Visible levels and calmer wheel results · see `archive/RELEASE-NOTES-v7.2.0.md`

## 7.1.5
Roster correction · see `archive/RELEASE-NOTES-v7.1.5.md`

## 7.1.4
Participation-first student rankings · see `archive/RELEASE-NOTES-v7.1.4.md`

## 7.1.3
Students contribute to their teams · see `archive/RELEASE-NOTES-v7.1.3.md`

## 7.0.0
classroom reliability and controlled animation · see `archive/RELEASE-NOTES-v7.0.md`

## 6.9.0
reliable wheel queue and cleaner champions · see `archive/RELEASE-NOTES-v6.9.md`

## 6.8.0
approved combat and code improvements · see `archive/RELEASE-NOTES-v6.8.md`

## 6.7.0
Evolution and VIXAR finale · see `archive/RELEASE-NOTES-v6.7.md`

## 6.6.0
English League v6.6 · see `archive/RELEASE-NOTES-v6.6.md`

## 6.5.0
English League v6.5 · see `archive/RELEASE-NOTES-v6.5.md`

## 6.4.1
Crown and Vixar visibility fixes · see `archive/RELEASE-NOTES-v6.4.1.md`

## 6.4.0
Animated Evolution · see `archive/RELEASE-NOTES-v6.4.md`

## 6.3.0
Balanced Motion & Arena Clarity · see `archive/RELEASE-NOTES-v6.3.md`

## 6.2.0
Balanced Center Combat · see `archive/RELEASE-NOTES-v6.2.md`
