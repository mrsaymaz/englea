# English League v6.3 — Balanced Motion & Arena Clarity

## Light scoreboard motion

- Team cards now slide into their new positions when a score changes the ranking.
- Switch uses the same transform-only movement with a slightly longer 500 ms exchange.
- Only cards whose positions change animate, and a new action cancels an unfinished movement instead of creating a queue.
- Card shadows, gradients, avatar effects and particles remain disabled during Light movement.

## Clearer Light Final Arena

- Fighter panels contain only the HP label, HP bar and current/maximum HP.
- League-leader details, level/form text, final points, combat statistics, energy, relic text, live attack commentary, status text and floating damage text are removed from the Light presentation.
- The arena title and countdown remain visible.
- **Knocked Out** remains visible as the clear elimination marker.

## Battle-Arena-only level scale

- Light battle avatars use eleven distinct sizes from Level 0 (`0.55×`) through Level 5 (`1.00×`) to Level 10 (`1.55×`).
- A Level 10 Legendary avatar is about 2.8 times the displayed height of its Level 0 form.
- This scaling exists only on temporary Light Final Arena fighters. Main scoreboard cards, Unity Ascension, the mobile remote and Ultra mode are unchanged.
- Center-fight spacing adapts to both fighters' rendered sizes to reduce overlap between large forms.

## Distinct lightweight combat identities

- Gryffindor uses a direct pounce, angular fire slash and forward brace.
- Slytherin uses a low curved approach, vine/fang arc and narrow coiling shield.
- Hufflepuff uses a compact hop-and-slam, golden air ring and broad grounded defence.
- Ravenclaw uses a rising dive, blue crescent and horizontal water-ripple defence.
- Attack and impact visuals reuse two flat elements, while defence reuses each avatar's existing shield; motion is limited to transforms and opacity. Particles, blur, glow animation, screen shake and continuous battle motion remain disabled.

## Preserved systems

- The 16-second Light Unity Ascension and gradual three-wave level granting.
- Soft · 1 Step as the automatic default.
- Cloudflare TURN remote connection, mobile Reset Team and Class Mission controls.
- Final results transfer to the remote and Google Sheets saving.
- Ultra Final Arena, battle calculations, VIXAR and all team artwork.

The startup screen displays **Balanced Motion & Arena Clarity · v6.3** so the deployed version is easy to verify.
