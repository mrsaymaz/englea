# v9.5.0 — A game-quality presentation pass, still lightweight

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **No Apps Script change.** Keep **GOOGLE-APPS-SCRIPT-v9.3.0.gs**. If you skipped v9.3.0, follow `archive/START-HERE-v9.3.0.md` step 2 first.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v9.5.0**. Mixed versions are refused on purpose.

The English League title and fonts are unchanged. No new images, fonts or libraries are added. Every new effect is drawn with CSS, the existing canvas or the browser's own animation and sound engines.

## The board

**Fits the smartboard.** On 16:9 screens from 1280×720 to 1920×1080, the whole board fits without scrolling in Light, Animated and Performance modes, with every button on screen. The creatures grow with the screen. The point tiers and the subject set share one row, Class Mission is a slim meter with one segment per student, and **Reset Season** is a quiet link in the bottom-right corner.

**Score first.** Scores are larger and count up in Animated mode as they already did in Performance. When you award a student, a "+points" chip flies from the award ribbon into the team's score. A student's first contribution of the session shows a gold **★ First time** tag.

**The leader.** The leading team wears a crown and a gold ring. When the lead changes, a short "**Ravenclaw takes the lead**" banner sweeps across the top of the cards. It lasts about two seconds, lets taps pass through to the buttons underneath, and isn't shown during the arena, results or Island Run. Ties show no crown.

**Quiet status pills.** A few seconds after a change, the connection pill shrinks to its coloured dot and the display-mode pill fades. The connection pill stays open while the remote is connecting, reconnecting or has failed.

## Final Arena and Champions

The arena backdrop is solid, so the tally board no longer shows through. The countdown moves into a dial in the centre of the platform and turns red for the last five seconds. Damage, critical hits, blocks and evades appear as numbers over the creatures. Knockouts, signature moves, Arena Surge, Final Clash and the winner are called out in the centre, and critical hits shake the arena slightly. On the Champions screen, a shared League title is labelled **Shared League Title**, its champions stand in one row and each name is shown in its team colour.

## Island Run

**Title cards.** Each run opens with the island's name and its guardian. The guardian arrives with its own card and an ominous sound, and its defeat gets a closing card.

**Answer streak and Spirit Surge.** A streak meter in the run bar fills with each correct answer in a row. Every third correct answer in a row is a **Spirit Surge**, which fills Elemental Focus at once: a coin magnet and one shield. A wrong answer resets the streak. The surge never adds coins or changes the coin target.

**Perfect Run.** Answering all six questions right first time adds **300 points** to the run score and shows a Perfect Run card. Coins, stars, unlocks and the answer log are unchanged.

**Answers you can see.** When a gate closes, the chosen card bursts green if it was right or cracks if it was wrong, and the correct answer lights up. Points float up from the runner, and the runner glows brighter as a streak builds.

**The showdown.** Each coin volley shows its damage over the guardian, which flashes when struck. A lighter trail behind the guardian bar shows how much the last volley took.

**Atmosphere.** Fireflies drift in forests and villages, gulls cross the coast and harbour, meteors cross the sky islands, and soft light shafts fall from the sun. Light rays turn behind the island during restoration. Water moves on the island map.

**Results.** The score counts up, the stars land one by one, and badges name what was special: Perfect run, Passport seal earned, New best score, Hard cleared, Best streak.

**Sound.** A new sound palette: coin chimes that rise with a coin chain, a chord for correct answers, a soft two-note fall for wrong ones, the surge, the guardian and a victory fanfare. Sound is still off until you turn on ♪.

## The remote

The leading team's card wears a crown and a gold ring, and new points pop above the score. The four cards still fit an iPhone 14 Pro without scrolling.

## Motion and older boards

- **Light** mode keeps the layout and information but leaves out decorative motion.
- The computer's **reduce motion** setting, or **Run settings → Reduce decorative movement** in Island Run, turns off the title-card movement, rings, glow, ambience and shakes. The numbers and cards still appear.
- Island Run's automatic graphics also drop the extras on a slow board.

## Quick classroom check

1. Board and phone show **v9.5.0**. On the board, the whole page fits without scrolling and Add Points is visible on all four cards.
2. Award a student: the ribbon shows the name, "+points" flies into the score, and a first-timer gets ★ First time. Award another team past the leader: "takes the lead" sweeps across, and the crown moves.
3. Finish the session: the arena shows the dial, damage numbers and callouts.
4. Open Island Run: the title card appears. Answer three in a row for a Spirit Surge. Miss one on purpose to see the crack and the correct answer light up.
5. Win the island: guardian defeated, restoration, then the result with badges.
