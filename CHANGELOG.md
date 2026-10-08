# Changelog

Newest first. Full notes for earlier versions are in `archive/`.

## 11.0.0
**The Vixar Saga** (spec builds 11.0, 11.1 and 11.2, delivered together):
- **Per-class saga.** Each class has a stage: Violet → Scarlet → Gilded → Freed. The level cap follows it: 10, 11 (Mythic), 12 (Celestial). A win moves the class on once; the new cap starts from the next session. A loss counts an attempt and keeps the stage. Undo never changes the saga; a reload mid-fight counts nothing.
- **The Rift.** Every saga fight is opened from the phone (More controls → Vixar Saga → a 1.5-second hold). The raid sigil appears only when every team is at the act's level. One fight per class per session. The phone shows readiness ("Level 11: 3 of 4 teams · Class Mission ✓"), offers Switch to Soft on Hard mode, and has Set stage (Manage, PIN) for corrections.
- **Act I · Violet** and **Act II · Scarlet** end in an escape: a false victory, the celebration freezes, the form shatters (crystal, then embers), an eye in a tear, then a gold crack. The reward panel previews each team's next form.
- **Act II · the Scarlet Brand**: Vixar marks one team for 6 s; 30% of that team's damage heals Vixar.
- **Act III · Gilded**: the Edict of Separation at 70% HP; the **Merge Spell** (houses answer in turn, 2 right answers per house, a miss passes to the partner house for a rescue, a 2-minute circle and one 1-minute second casting). **Slyffindor** (Gryffindor + Slytherin) and **Huffleclaw** (Hufflepuff + Ravenclaw) fight fused; an unfused pair fights apart. Merge answers are logged in Challenge_Log as `Merge · …` rows.
- **The Finale**: crack, break, reveal, Mr. Saymaz's thank-you speech (one line per Continue, English voice optional), up to three names per house, the hug, a closing card. Continue from the board or the phone. A **Freed** class sees Mr. Saymaz as an ally and can replay the Finale.
- **Teacher Studio → Finale speech**: the speech per grade (1–10 lines, up to 160 characters each), saved online.
- **Fight effects** for the raid and the Arena: damage numbers, hit sparks, hit-stop on criticals, a ground warning before Vixar's blow, shield shards and a small shake on heavy blows. Transforms and opacity only, within the effects budget; still numbers in Light mode and with reduced motion.
- **New art**: Level 11 and Level 12 avatars and pose sheets for all four teams; Scarlet Vixar, Gilded Vixar and its cracking frame. Missing Level 11/12 art falls back to Level 10. Mr. Saymaz: a portrait (the ally), five poses for the Finale and a six-frame reveal as he breaks free of the cursed gown. Slyffindor and Huffleclaw: pictures for the Merge Spell and nine-pose sheets for the fused fight (still pictures in Light mode). The hug illustration has a slot (`public/assets/saga/manifest.json`) and a placeholder until it is added.
- **Vixar fight preview** (`vixar-preview.html`, `index.html#preview-act1` … `#preview-finale`): each act, or the Finale, opens straight into the real fight with every requirement met. The tab keeps everything in memory, so no class data is read or written and nothing is sent; the access code still applies.
- Balance lab (`tests/saga-balance.cjs`, 20 fights per scenario): every requirement met → Act I 20/20, Act II 20/20, Act III 20/20; Act III with one pair fused 13/20; Merge Spell failed 2/20; Act II without the Class Mission 0/20.

**Apps Script update:** deploy `GOOGLE-APPS-SCRIPT-v11.0.0.gs` as a New version (new tabs Vixar_Saga and Vixar_Finale_Lines). `GOOGLE-APPS-SCRIPT-v10.4.0.gs` moved to `archive/`. No new environment variables.

## 10.5.1
**Lighter creature poses** (nothing looks or plays differently):
- 10 pose sheets stay decoded instead of 6: four teams at their current and next level, an island boss and Vixar. In a test lesson where every team evolved twice, sheet requests fell from 46 to 31.
- The pose layer is square and fitted by CSS (`aspect-ratio`), so showing a pose no longer measures the page. Sizes and positions are identical. Browsers without `aspect-ratio` keep the old measurement.
- Measured and left out: a pre-scaled runner sprite cache for Island Run. The runner's pose drawing already costs about 0.1 ms per frame, so the cache gained nothing.
- The board loads Island Run content with the build number (10.5.1). The pose pictures keep their 10.5.0 cache tag, so they are not downloaded again.

No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.4.0.gs`.

## 10.5.0
- 465 transparent action poses: all four team avatars at levels 0–10, ten island bosses and Vixar, derived from their original visual identities.
- Event-driven score, evolution, attack, guard, hit, knockout and recovery poses. Low HP prompts a single bracing response; it does not repeatedly animate every HUD update.
- Current-level Island Run avatars stride, glide/slither, jump, land and strike. Question gates slow the pose cadence. Boss poses follow their warning, strike, exposed, counter and defeat states.
- Vixar charge, cast, shield, phase reveal, final blast and Guardian-claw responses use the existing event timings.
- Champions celebrate first; ties acknowledge one another; a teammate encourages the lowest-scoring creatures. Social exchanges stay inside the four recognition avatars.
- Lazy-loaded WebP atlases, six-entry image cache, safe original-art fallback, stable anchors, cancellable scene work and pause/visibility cleanup.
- Local `public/creature-studio.html` previews every creature, level and pose without deploying.
- No gameplay balance, educational content, roster, save schema, remote protocol, Apps Script or environment-variable changes. Board and phone build strings advance to 10.5.0.

## 10.4.3
**400 new translation cards** (ten per island, grades 5–8, on each island's theme): a short Turkish sentence or question with the right English and two English options that change one detail.
- **English wheel:** half the Translation cards are now sentences or questions.
- **Island Run:** they are "Translate into English" questions, so each island has 116 questions (4,640 in all). Saved progress, answer logs and Google Sheets are unchanged. Islands edited in Studio keep the teacher's bank; importing an older backup adds the new questions once.
- The board now loads the Island Run content with the build number, so a new release is always fetched.

No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.4.0.gs`.

## 10.4.2
**Vocabulary mixes in Turkish**: about one card in three shows an English word and three Turkish meanings; the rest show an English meaning and three English words. Studio word pairs without English meanings now make Vocabulary cards too. No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.4.0.gs`.

## 10.4.1
- **Short Ask a Question cards:** each island of grades 5–8 has six of its own on the island's theme (240 in all).
  - Each card has a short answer, the right question and two proper questions that ask for something else.
  - Questions have eight words or fewer.
  - The explanation names the question word ("What time" asks about a time).
- **More Ask a Question cards:** the island's Island Run reading questions that start with a question word are used too.
  - Their wrong options are the island's short questions that start with a different question word ("What" and "Which" count as the same word, and so do "When" and "What time").
  - Exercise questions are left out.
- **Shorter, easier Island Run questions** in all grades:
  - reading tasks: 10 words or fewer;
  - answer choices: 5 words or fewer;
  - meanings: 8 words or fewer;
  - gap sentences: 12 words or fewer.
  The topic, vocabulary, correct answer and position of every question are kept, so saved progress and answer logs still match. `tests/island-short.cjs` checks this. No Apps Script change: keep `GOOGLE-APPS-SCRIPT-v10.4.0.gs`.

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
