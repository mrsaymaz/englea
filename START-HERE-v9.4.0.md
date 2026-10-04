# v9.4.0 — Island Run polish, passport seals on the board, one shared look

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **No Apps Script change.** Keep **GOOGLE-APPS-SCRIPT-v9.3.0.gs** if you already deployed it for v9.3.0. If you skipped v9.3.0, follow `archive/START-HERE-v9.3.0.md` step 2 first.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v9.4.0**. Mixed versions are refused on purpose.

## What changed

**One header while running.** During a run, Island Run's own top bar disappears. Sound (♪), full screen (⛶) and Pause sit in the run bar, next to the coins, progress and guards. The map view keeps its full toolbar.

**Scenery for each island type.** Each island type now has its own daylight palette and skyline: campus roofs and a clock tower for school islands, cottages for villages, lit towers for cities, dunes and palms on the coast, cranes in the harbour, round trees in the forest, and floating rocks under stars on the sky islands. Clouds drift and the sun glows. In Light graphics mode or with reduced motion, the extra layers stay still or are left out.

**Colour returns as you learn.** A run starts slightly muted. Each correct answer brings back more colour, and the full palette arrives when the guardian falls. Islands the class has already restored start brighter. Colour never affects coins, speed or scoring.

**A livelier runner.** Coins spin and glint, the runner kicks up dust, and it settles with a short squash after each jump. All of this is skipped with reduced motion.

**Lanes match the answers.** The A, B and C lane letters are gold, teal and lilac, the same colours as the letter badges on the answer gates. The runner's current lane letter lights up, and its answer gate is highlighted while the choices are on screen. The coin counter now reads, for example, "COINS 24 of 89 needed", with a ✓ once the target is reached.

**Clearer map.** Locked islands show a lock and are dimmer. The next island to play gently beckons. The selected island line reads "Guardian: Veyr · collect 50% of the coins, then win the showdown".

**Passport seals on the board.** When a team completes an island (not a practice run), its passport stamp now also appears on that team's board card: the latest guardian's emblem and the number of seals, out of 10. When you return to Champions, a short "Passport seal added" announcement names the team, the island and the guardian, and the card shows **NEW** for the rest of the lesson. The remote shows **✦ n** next to the team name. Seals follow the selected class and are loaded with **Load islands** as before. Loading progress from Google Sheets never triggers the announcement.

**One shared look.** The board, the remote and Island Run use the same night-blue panels, borders, gold accents and title style (`public/league-look.css`).

## Quick classroom check

1. Board and phone show **v9.4.0**. Choose a class; the remote still fits on the phone without scrolling.
2. Finish a short session and the Arena, then open Island Run and start the next island. The top bar disappears; ♪, ⛶ and Pause are in the run bar.
3. Answer a few questions correctly: the scene grows more colourful. The lane letter follows the runner.
4. Win the island, then choose **Back to Champions**. The "Passport seal added" announcement appears. After the lesson, the team's card shows the seal with **NEW**.
5. If the board struggles, choose **Light** on the start screen, or **Run settings → Graphics → Light**.

## Lightweight by design

No new images, fonts or libraries. All scenery is drawn on the existing canvas and reuses cached gradients. The seals reuse the existing boss artwork.
