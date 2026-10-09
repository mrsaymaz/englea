# Vixar battle presentation — 11.0.0-motion1

This complete project includes the previous art upgrade and a new Vixar movement/effect pass.

## Test without deploying

Unzip the entire folder, then open **BATTLE-MOTION-PREVIEW.html** in Chrome, Edge, Firefox or Safari. Choose Violet, Scarlet or Gilded, then an attack. Try the shield checkbox and four-target volley. **Stop / clear** cancels the rehearsal. The preview uses the actual RaidMotion, creature-pose and scene-clock code with a simplified rehearsal arena. It does not connect to the remote or change class data. Its attack-name buttons are preview controls, not new labels on the classroom fight screen.

The preview respects the device's Reduced Motion setting, which suppresses moving effects. For the complete fight, use the existing **vixar-preview.html** on your deployed site.

## What changes in the fight

| Form | Movement | Projectiles |
|---|---|---|
| Violet | Floating preparation, restrained forward cast | Violet lance, crown shard, void orb, crescent and links |
| Scarlet | Sharper forward lean, stronger lunge and recoil | Flame-shaped lance, jagged embers, twin crescent slashes, burning links and a distinct Brand sigil |
| Gilded | Upright preparation, measured cast and firm defensive brace | Gold/platinum spear, faceted diamond, hexagonal core, angular blade and articulated links |

- A spell's preparation uses its existing delay. The projectile spends the first 22% of its 420 ms window forming at the source, then travels at constant speed. Its arrival and the damage callback share the same deadline.
- Charging and casting use separate existing poses. The long Fifth Silence preparation can retain its charge pose for the channel duration. Damage, guard and ultimate poses still take priority where appropriate.
- A multi-target volley shares a casting gesture instead of restarting Vixar's movement for every team. Recoil cannot interrupt the first 420 ms of that gesture; ultimate and defeat take priority.
- Compact slash/burst impacts appear when damage resolves. A shield emblem marks a fully blocked or immune hit. Shield break and partial-damage rules remain the game's existing rules.
- Removed the old premature lance impact, duplicate falling Crownfall shards, broad sweep overlay and early Soul Rend slashes. The new projectiles and resolved impacts tell the same story once.
- Scarlet and Gilded movement now targets the visible raster actor in Light mode too.
- One SVG wrapper per projectile; transform and opacity animation; no new raster downloads, particle loops or animated filters. The existing effects budget caps concurrent effects at 12 and lowers the limit on slower devices.
- Pause, hidden pages, scene exit, reduced-motion changes and cleanup cancel active presentation. Gameplay remains the authority for HP and outcomes.

**No HP, damage, seal, cooldown, progression, roster or Apps Script changes. No new environment variables.** If your existing v11.0.0 Apps Script already works, keep it. Deploy through your current Netlify process when ready; this ZIP has not been deployed for you. Cache tags have been updated for the changed scripts and styles.

## Verification

| Automated check | Result |
|---|---|
| `node tests/vixar-motion.cjs` | Six groups pass: form identity, 420 ms timing, volley coalescing, interruption priority, budget/cleanup, and the actual damage resolver |
| `node tests/creature-poses.cjs` | Twelve groups pass, including charge → cast, cancellation, defeat priority and long-channel duration |
| `node tests/v11.cjs` | Seventeen Saga rule, persistence, art and wiring groups pass |
| `node tests/art-upgrade.cjs` (requires `sharp`) | Five art and asynchronous loading groups pass |
| Changed JavaScript and offline preview | Syntax checked; local asset references resolve |

These are controlled DOM/clock and logic checks, **not a full browser playback test**. Browser playback and screen-size screenshots could not be verified here because Chromium was unavailable and the connected browser could not access the local project. Existing browser suites remain included for a machine with Playwright/Chromium installed. The original art and earlier reports are retained; they should not be mistaken for browser verification of this motion revision.
