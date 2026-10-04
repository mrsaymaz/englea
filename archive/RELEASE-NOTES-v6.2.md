# English League v6.2 — Balanced Center Combat

## New in v6.2

- Randomly selected attackers and defenders now meet at opposite positions near the center of the Final Arena in Light mode.
- Each featured encounter uses a short approach, attack or defense exchange, and return sequence lasting about one second.
- Actual battle outcomes now trigger matching lightweight reactions: guard shield, evade step, hit recoil, critical recoil, or damage label.
- Basic, arc, slam, dive, and elemental attacks receive small transform-only variations and one reusable team-coloured strike line.
- Only one pair uses the center lane at a time. Overlapping actions use a small in-place fallback so avatars do not collide or overload weak hardware.
- The current attacker and defender names briefly appear in the battle phase line.

## Performance safeguards

- Center positions are measured once and cached when the arena opens.
- Motion uses only Web Animations with transform and opacity.
- No particles, blur, glow filters, screen shake, continuous battle motion, or Light-mode battle music.
- Only two avatar shells and two reusable flat effect elements can animate during a featured exchange.
- Final Arena logic remains capped at 10 updates per second in Light mode.

## Features preserved from v6.1

- The 16-second Light Unity Ascension with four team streams, six-part Guardian assembly, and three gradual evolution waves.
- Soft · 1 Step as the default for startup, reset, and new sessions; Hard · 3 Steps remains optional.
- Original team animals, colours, traits, evolved forms, levels, and relics.
- Mobile Reset Team and Class Mission controls, Cloudflare TURN, remote session finishing, and Google Sheets saving.
- Ultra mode, VIXAR, wheel, scoring, and all battle calculations.

The startup screen displays **Balanced Center Combat · v6.2** so you can verify the correct deployment.
