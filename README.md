# English League with Mr. Saymaz — v10.4.0

Start with **START-HERE-v10.4.0.md**: the **Challenge Deck**. At Level 5 and 10 the English wheel deals a real card from the class's islands to the student who gave the last point. Right keeps the level; wrong takes the team back to the previous level. Taboo puts forbidden Turkish words on your phone. Every card is saved to a new Challenge_Log tab. Apps Script update: **GOOGLE-APPS-SCRIPT-v10.4.0.gs**.

## v10.3.0 (retained)

Guide: `archive/START-HERE-v10.3.0.md`. Island Run, awards and the Battle Arena run more smoothly on slow smart boards, and each board remembers its speed.

## v10.2.0 (retained)

Guide: `archive/START-HERE-v10.2.0.md`. The **Comeback Halo**: teams that won neither the League title nor the Final Arena in a class's last session earn ×2 points in its next session, shown as a golden halo with ×2 on the avatar's head. Apps Script update: **GOOGLE-APPS-SCRIPT-v10.2.0.gs**.

## v10.1.2 (retained)

Dates in Google Sheets are day first (DD/MM/YYYY). Guide: `archive/START-HERE-v10.1.2.md`.

## v10.1 (retained)

Guide: `archive/START-HERE-v10.1.0.md`. Type your Teacher PIN under the room code when you connect the phone: after **Allow** on the board, the phone signs in once and loads the student names, islands, seals and the School League Season, and Save Record, Manage and Studio stop asking for the PIN.

## v10.0 (retained)

Guide: `archive/START-HERE-v10.0.0.md`. A student's award card now takes on their team's element as they collect Island Run navigator seals (fire, nature, water, air), growing stronger with every seal until, at all ten, it wears a crown and a title: **Flamebearer**, **Earthshaker**, **Tidecaller** or **Stormrider**. The whole school now plays one **League Season**: a Season Wins panel on the Champions screen ranks the four teams by League titles and Final Arena wins across every class, counting every session already in the Sheet.

**Apps Script update required**: **GOOGLE-APPS-SCRIPT-v10.4.0.gs** (deploy a New version of the existing web app; it includes v10.2.0, v10.1.2, v10.0.0, v9.7.0 and v9.6.0). No new Netlify or Cloudflare variables. Both opening screens should show **Island Run Edition · v10.4.0** (v10.4.0 adds the Challenge Deck; v10.3.0 smooths class moments on slow boards; v10.2.0 adds the Comeback Halo; v10.1.2 writes Google Sheets dates day first; v10.1.1 shows one student card at a time and keeps it clear of the team cards' ranking slide; v10.0.1 keeps the "★ First time" tag above the elemental card effects; v10.0.2 brings the school season from the phone to the board).

## v9.7.0 (retained)

v9.7.0 made one student the Island Run navigator for the whole session, gave each navigator their own island seals (shown on their award card and kept in Google Sheets as Navigator_Seals), and added a student controller on the teacher's phone with Bluetooth keyboard steering.

## v9.6.0 (retained)

v9.6.0 made Animated mode the board's mode (Performance removed), dropped the lead banner and point bubbles, restored the smoothly filling Class Mission bar, fixed the Award Custom Points ×, removed attack names from the arena centre, gave the remote taller cards, recorded every student's contribution count in Google Sheets, and gave Island Run a fixed question panel, a steady background and a lighter, richer renderer.

## v9.5.0 (retained)

v9.5.0 raised the presentation of the whole game while keeping it light: the board fits a 16:9 smartboard without scrolling and the score leads each card; the Final Arena has a countdown dial, damage numbers and callouts; a shared League title lines its champions up in a row. Island Run added title cards, an answer streak with a **Spirit Surge**, a **Perfect Run** bonus, answer gates that show the result, guardian hit numbers, realm ambience, a sound palette and a result sequence.

## v9.4.0 (retained)

v9.4.0 gave Island Run a single header while running, a daylight scene for each island type that regains its colour with correct answers, colour-matched lane letters and answer gates, a clearer map, and passport seals on the board and remote after a successful run.

## v9.3.0 (retained)

v9.3.0 turned Island Run into a learning loop: team answers are saved to Google Sheets, missed concepts come back in later runs, one missed question gets a second chance, and new listening gates, picture gates and a Word Trail (with a 15% Word Strike) join the run. A navigator from the champion team is named (since v9.7.0, one navigator leads the whole session). The teacher remote fits an iPhone 14 Pro in Safari without scrolling.

Older guides, reports and scripts are in `archive/`; `CHANGELOG.md` lists every version. Tests and limits: **TEST-REPORT-v10.4.0.md**.

## Retained features and earlier fixes

**v9.0.1 fixes a connection bug:** the previous JSON transport rejected full-roster messages larger than 16,300 bytes, causing repeated reconnect/approval loops. The app now uses the bundled PeerJS binary transport, which splits and reconstructs large messages. No roster deletion or Apps Script change is required when upgrading from v9.0.0. Existing remote approval and build checks remain.

Cloudflare credential failures now return a safe provider status and an actionable message. The two TURN environment variables still must belong to the same active Cloudflare TURN key.

Version 9 adds the four selected features:

- A living class map: completed islands regain paths, lamps, greenery and elemental team signatures. Each team's unlocks remain separate.
- Spirit runners: the winning team's current avatar and level gain smooth movement, elemental trails, jump lean and landing ripples. Reduced motion remains available.
- Teacher Studio: use **Manage** on the phone or board to edit questions and learning objectives, preview choices, paste vocabulary pairs, maintain rosters and view class progression. Teaching material saves online by grade and island.
- A compact expedition recap below the existing champion and contributor sections, with team progress, this lesson's new completions and a next-island teaser.

For this release, use **START-HERE-v10.4.0.md** and deploy **GOOGLE-APPS-SCRIPT-v10.4.0.gs**. The startup badge should read **Island Run Edition · v10.4.0** on both devices. No new environment variables are required.

Remote startup synchronization, Retry sync, class/team cloud progress and session-save deduplication from v8.9.1 remain included. Existing artwork, grade curricula, 4,240 question variants, scoring, coin targets and Soft/Hard rules are retained.

The script automatically creates `Teaching_Content` for published questions and objectives. No manual question or student rows are needed. Edits apply to every class of that grade; rosters and island progression remain class-specific. Running games finish with their existing question set; new runs receive published edits. Load islands or reload the unit in Studio to retrieve another device's online changes.

The script creates `Island_Progress` automatically. Session ID columns in Leaderboard (M) and Battle_Results (G) prevent duplicate results when saving again after a run. Existing result columns, participation leaders and the Manage roster editor remain supported.

Roster edits apply to the next session. The active lesson retains its roster through sync, Undo and recovery. On a new phone, or to retrieve another device's changes, use Manage → Load online before selecting the class. The app retains an offline copy for later lessons; online saves require a connection.

Access codes change every minute using server UTC+3 time. Add one to each HHMM digit, wrapping 9 to 0, for normal access. Subtract one from each digit, wrapping 0 to 9, for master access. Three consecutive incorrect entries lock that browser profile for six hours; the current master code clears the lock and opens the classroom. Verification requires an internet connection. This is a casual browser access gate, not strong authentication: clearing browser storage or modifying client code can bypass local restrictions, and the time-based codes are predictable.

The competitive arena now uses independently tested team/level adjustments that interpolate between low-HP and high-HP conditions using fixed starting health. Poison respects combat invulnerability and shield HP; fractional tick output carries forward so HP deductions stay integral without large rounding jumps. Hufflepuff receives at least 10 signature shield HP and up to 28 relic healing, capped by missing health. See **archive/BALANCE-REPORT-v8.5.1.md** for measurements and limits.

Arena starting HP is `round(200 + 50 × sqrt(max(0, points) / highestPositiveScore))`, capped at 250. Zero and negative scores receive 200 HP; if every score is nonpositive, all teams receive 200. Scores are read after Secret Agent transfers. Vixar keeps its existing HP model.

Projectiles travel from the attacking team to its actual target, with damage applied at arrival. Each team cycles through three small elemental SVG designs, and three matching defenses. Full blocks scatter the shot, partial blocks show a reduced shot, and evasions let it pass by. Team attacks and defenses also work in Vixar's fight. Attack and defense names are not shown. Effects are finite, bounded and suppressed by reduced-motion preferences.

Shield blocks the first new Half Down activation or Secret Agent selection from that team, then turns off. A blocked Half Down never becomes active. A blocked agent still consumes the attacking team's one attempt, and reveals with zero transfer. The next effect passes through unless the teacher activates a new Shield. Protection is decided when the effect is selected; adding Shield later does not undo an already-active effect. Undo and session recovery preserve the shield charge and the agent's blocked status.

Select a class, then tap the hat-and-glasses icon on the receiving team's board or remote card. Choose a student privately on the connected remote, from another team in that class. One agent is allowed per team per session, and a student cannot be assigned twice. Tap the remote icon again to reveal early, or choose Finish Session to reveal all active agents before final standings and battle.

For an unblocked agent, the student's full awarded point total through the reveal, including points earned before selection and bonuses, transfers to the receiving team. **The original team's score can go negative, including after Team Reset.** A Shield present at selection intercepts that agent permanently; a Shield added afterward does not stop the transfer. Levels, evolution, contributions, stars and mission progress stay unchanged. Continue dismisses the reveal on either device; there is no countdown. Later contributions go to the original team normally. Transfers, assignments and an open reveal survive recovery and work with Undo.

Each card shows the three students with the fewest contributions and their counts, including zero. Ties use stable roster order. Lists follow the board's confirmed session data after awards, Undo, class selection and recovery. Team Reset preserves contributions; New Session clears them. Use the existing + button and student picker to award points.

The existing compact layout fits all four cards in an iPhone 14 Pro portrait viewport (393 × 660 CSS pixels with room for browser controls), without scrolling. Scoring buttons remain at least 44 pixels high. Full-screen safe-area spacing was also checked. Shorter or zoomed views can scroll; landscape uses four columns when space permits. Earlier layout validation used Chromium mobile emulation, not a physical iPhone or Safari. v8.9.0 adds its remote load control inside the Save Record dialog, preserving the header layout.

The corrected 5-A roster remains included: Nisa belongs to Hufflepuff and Elif Naz belongs to Gryffindor. If upgrading from v8.1.0 or earlier, start a fresh 5-A session rather than resuming an old saved session, since saved identities use roster positions.

Refresh the board and remote after deployment. Each browser opens the access screen before the classroom start screen.

The final screen keeps the League and Battle/Arena champion displays prominent. Beneath them, **Every Team's Contributors** shows all four team avatars and up to three contributing students per team, ranked by participation count with their counts displayed. Equal counts share a rank and tied names use alphabetical order. Teams with no recorded contributions show an honest empty state. The section also appears when one team wins both titles.

The first positive point award to each student adds one star around their team's avatar and one step to the Class Mission. The mission completes at **15 different students across the class**. Repeated awards increase participation counts but add no extra stars or mission steps. Team Reset and point deductions preserve stars and mission progress; New Session clears them. Undo reverses the associated contribution and star together.

Mission progress is automatic, so the old manual +1, +5 and Complete controls are replaced with a short explanation. Replay remains available after completion. All team members can still earn their stars after the mission reaches 15.

Every smartboard team card has a high-contrast badge in its **top-right corner**, showing only **LEVEL** and its current number. The ten-step track and /10 denominator are removed. The Wheel of Subjects is earned only at Levels **5** and **10**. After it stops, the selected subject remains visible for 20 seconds or until the teacher selects **Continue** on the smartboard or remote. No countdown is displayed, and all existing subject names remain unchanged.

Choose **Class** on the connected remote, then tap a team's **+** and the student's name. All 120 students from 5-A, 5-C, 6-C, 7-A and 8-B are included. The picker shows how many times each student has contributed. Champion panels rank students by contribution count, not points.

Choosing a class also selects its starting point tier: 10 for grade 5, 100 for grade 6, 1,000 for grade 7 and 10,000 for grade 8. The teacher can still select any point tier afterward.

Student totals survive team resets and participate in Undo, session recovery and final result snapshots. After finishing, the teacher remote provides a private participation summary for all four teams. A team reset also preserves that team's already-earned wheel milestones, preventing a Level 5 or Level 10 wheel from repeating in the same session. A New Session clears those milestones.

- `archive/SETUP-ROSTER-v8.7.0.md`: step-by-step script update and roster usage.
- `tests/next-to-invite.cjs`: mobile layout and live participation-list checks.
- `tests/secret-agent.cjs`: selection, transfer, negative scores, recovery, Undo and final-results checks.
- `tests/shield.cjs`: both protection orders, consumption, blocked agents, Undo and recovery.
- `tests/arena-techniques.cjs`: all 24 moves, contact timing, visual isolation, limits and cleanup.
- `archive/RELEASE-NOTES-v8.1.0.md`: previous all-team recognition and compact Level badge changes.
- `archive/TEST-REPORT-v8.1.0.md`: previous release verification and limits.
- `GOOGLE-APPS-SCRIPT-v10.4.0.gs`: current complete backend (the Challenge_Log of Challenge Deck cards; each class's last session for the Comeback Halo; dates written day first, plus `formatOldDates` for earlier rows) with results, roster, teaching material, island progress, passport details, the Island Run answer log, every student's contribution count, navigator seals and the School League Season. Older scripts in `archive/` are historical; do not deploy them.
- `public/student-rosters.js`: the class and team rosters.
- `tests/`: optional developer checks; not required to run the site.

Earlier version documents are historical and live in `archive/`.
