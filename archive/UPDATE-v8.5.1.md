# English League v8.5.1 — Arena balance refinement

This update refines the four-team Final Arena using the battle laboratory. Read `BALANCE-REPORT-v8.5.1.md` for the final independent simulation results and limits.

## What changed

- Recalibrated each team's attack and poison output at Levels 0–10. The adjustments account for each team's offensive, defensive, evasion and relic abilities.
- Added smooth calibration between 200-HP and 250-HP battle conditions. The interpolation uses the **average maximum HP at battle start**, never current health, current placement or the eventual winner. It remains fixed throughout that battle.
- Hufflepuff's signature grants at least **10 shield HP**. Its healing relic restores up to **28 HP**, capped by missing health. This preserves their usefulness when a team starts with less HP.
- Poison now respects **combat invulnerability and combat shield HP**. Invulnerability blocks the tick without consuming the shield; a shield absorbs damage and any excess reaches HP. Poison still bypasses armor and the ordinary guard reduction.
- Poison carries fractional damage between ticks in one active chain. Actual HP changes remain whole numbers, and tiny calibration changes no longer round every tick up or down together. Refreshing active poison preserves one chain; a new chain starts a new rounding accumulator.

The 200–250 points-to-HP formula remains in effect. Higher points and levels continue to provide measured advantages; the class-specific point scales work the same way. Vixar retains its existing balance. These changes concern the competitive arena.

The classroom Shield that blocks Half Down or Secret Agent selection is separate from arena shield HP. Its one-effect protection, consumption, Undo and recovery rules remain in effect.

## Deploy

Unzip the package and deploy the complete project using your existing Netlify Git or CLI workflow, including `public`, `netlify/functions` and `netlify.toml`. The Turkey-time access screen still requires the server function added in v8.5.0. Keep your existing TURN settings. No Google Apps Script or spreadsheet-layout change is required.

For an existing linked Netlify project, from the folder containing `netlify.toml`:

```sh
npx netlify-cli deploy --dir=public --functions=netlify/functions
```

Check the draft deployment, then publish the checked files:

```sh
npx netlify-cli deploy --prod --dir=public --functions=netlify/functions
```

Refresh both the board and phone after deployment. Look for **Animated Evolution · v8.5.1**. Existing saved classroom participation records do not need to be cleared. Let any battle already in progress finish before refreshing.

The previous `UPDATE-v8.5.0.md` includes full access-code and first-time Netlify setup instructions. The current package includes those functions; this release does not introduce another online dependency.

## Optional developer checks

From `tests`, run `node arena-balance-unit.cjs` for poison protection, damage accounting, rounding carry, refresh/expiry and fixed-start calibration checks. The browser projectile test also exercises arena outcomes and Vixar completion.

`tests/balance-lab` contains the exact released combat source extract, reproducible seeded simulator and final validation results. It is not loaded by the classroom website.

Simulation results describe automatic fights with random valid evolution traits. Deliberately chosen trait builds, unequal levels and points can change winning chances. Balanced does not mean every real classroom match should have a 25% chance per team.
