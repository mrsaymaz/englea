# English League v8.4.0

Deploy the complete updated package using your existing Netlify method. Keep public, netlify and netlify.toml together. Refresh the board and phone, then check for Animated Evolution · v8.4.0. No Apps Script update is required.

## Shield: one incoming effect per activation

Activate Shield on the team card. It now blocks whichever happens first:

- Half Down is switched on for that team: Shield is consumed, Half Down stays off, and awards continue normally.
- A Secret Agent student is selected from that team: Shield is consumed, and that agent is permanently marked as blocked. The receiving team has used its one Secret Agent attempt. The teacher sees confirmation privately, and the reveal shows that Shield protected the team with zero points transferred.

The next Half Down or Secret Agent attempt goes through unless the teacher issues a fresh Shield. Two Half Down clicks in a row illustrate this: the first is blocked; the second activates Half Down. Switching an existing Half Down off never consumes Shield. Invalid or cancelled agent selections never consume it.

Protection is evaluated at selection time, not at point-award or reveal time. Adding Shield after Half Down or an agent is already active does not undo that effect. The new shield remains available for a later incoming effect. Shield is a manually issued charge, not automatic protection for the whole session.

Example: Hufflepuff has Shield. Slytherin selects Nisa as its Secret Agent. Hufflepuff's Shield is consumed and Nisa's agent transfer is blocked. Half Down applied afterward affects Hufflepuff normally. At reveal, Nisa transfers zero points. If Half Down had arrived first, it would have been blocked and the later Secret Agent would transfer the full amount, even below zero after a reset.

Undo restores the shield charge and blocked-agent state together. Session recovery preserves both. Retried remote commands do not consume a charge again. Public feedback never displays the selected student's identity before reveal.

## Elemental arena choreography

Each team cycles through all three attacks and all three defensive responses. These are visual styles of the existing combat events, not new abilities or damage bonuses.

| Team / element | Attack animation | Defensive animation |
| --- | --- | --- |
| Gryffindor / Fire | Ember Pounce: low wind-up and leaping flame slash | Ember Brace: a compressed stance and ember shield |
| Gryffindor / Fire | Flame Wheel: curved rush with a rotating flame arc | Flare Parry: turning sidestep and opposing fire arcs |
| Gryffindor / Fire | Meteor Claw: high dive and pointed fire burst | Flame Mantle: raised stance inside a flame wall |
| Slytherin / Nature | Vine Whip: sideways lash and curling vine | Leaf Fold: coiled lean behind a leaf shield |
| Slytherin / Nature | Thorn Ambush: drawn-back lunge and thorn strike | Vine Weave: counter-lean behind crossing vines |
| Slytherin / Nature | Coiling Strike: twisting approach and spiral vine | Thorn Bulwark: low brace with a thorn ring |
| Hufflepuff / Air | Gust Dash: direct wind-up and rushing air lines | Wind Cushion: soft recoil with compressed air rings |
| Hufflepuff / Air | Spiral Lift: rising curved rush and spiral gust | Slipstream Turn: lifted sidestep and sweeping currents |
| Hufflepuff / Air | Cyclone Drop: high arc and descending cyclone | Cyclone Shell: hovering turn inside a wind spiral |
| Ravenclaw / Water | Tidal Sweep: curved sweep with a breaking wave | Bubble Guard: buoyant brace with a water bubble |
| Ravenclaw / Water | Ripple Dart: quick angled dive and water droplets | Flowing Veil: fluid sideways lean behind water curtains |
| Ravenclaw / Water | Maelstrom Dive: high twisting dive and whirlpool | Undertow Roll: rolling recoil with a curling water crescent |

The animations use small SVG accents and transform/opacity movement. No new continuous particle loops, damage calculations or combat timers are introduced. Each movement returns to its starting pose. Impact remains synchronized with the existing attack's damage time. Effects stay within the existing adaptive budget and are cleared on pause, exit, visibility changes and reduced-motion changes. The same variants run in Performance, Animated and Light modes when motion is allowed; reduced-motion settings suppress them.

## Checks completed

- Both Shield orders, repeat Half Down, fresh shield issuance and non-retroactive protection.
- Blocked agent zero transfer, spent attacking attempt, Undo, receipt retry and checkpoint recovery.
- Existing negative transfers after reset, final standings, Secret Agent reveal recovery and four-agent reveals.
- All 12 attack and 12 defense variants render and rotate, have distinct motion, preserve impact timing and do not mutate HP.
- Burst-load effects remain capped; pause, exit and reduced-motion cleanup work.
- A live arena battle ran and completed without browser errors.
- iPhone 14 Pro portrait layout, safe-area layout, existing participation, mission, wheel and Apps Script checks pass; JavaScript syntax checks pass.

Browser checks used Chromium emulation. Physical iPhone/Safari and classroom hardware performance were not directly tested. Existing artwork, rosters, level badges and classroom features remain included.

Developer commands from tests: npm run test:shield, npm run test:arena, npm run test:agent, npm run test:invite. Use the existing Playwright setup described in tests/README.md.
