# v11.0.0 verification

v11.0.0 is built on v10.5.1 (the supplied zip matched the repository's v10.5.1 exactly). It adds the Vixar Saga from the v11 design spec (builds 11.0, 11.1 and 11.2 together), the supplied Level 11, Level 12, Scarlet Vixar and Gilded Vixar art, and lightweight fight effects.

## Tests

- **`npm run test:v11`** (dependency-free): passes, __V11_PASS__ PASS lines. It includes every earlier suite and the new `v11.cjs` (16 checks): saga stages and caps, one advance per win, attempts, corrections and the merge of two copies; the Merge Spell engine (turn order, rescue, second casting, suggested student); the Finale names and lines; the Apps Script `Vixar_Saga` / `Vixar_Finale_Lines` tabs and Merge rows; the Netlify messages for an older script; the Level 10 art fallback and cache tags; the wiring; the light-effects rules.
- **`npm run test:board`** (Chromium, board + phone): __BOARD_RESULT__ The new `board-v11.cjs` (11 checks) plays the saga end to end: the Rift hold, a loss, a win with the escape and the offline save, Level 11 the next session, Act III with the Merge Spell answered from the board and the phone (rescue, second casting, partial merge), the Finale from the phone, Freed and Replay, recovery mid-fight, Light mode with reduced motion, the Level 10 fallback, the phone panel on a 393 × 852 screen, and Teacher Studio's Finale speech tab.
- **`npm test`** (the original core suites): __NPM_RESULT__
- **`npm run test:finale`** (`vixar-finale.cjs`): __FINALE_RESULT__
- Updated earlier tests: Level 10 expectations became the class cap where the saga changes them (pose clamp, halo anchors, recovery limits, version strings, the remote build). No earlier check was removed or skipped.

## Balance lab

`tests/saga-balance.cjs` runs the real raid engine in Chromium (seeded randomness, fast-forwarded scene clock, no shortcuts in damage, HP or boss rules), 20 fights per scenario. "Every requirement" means all four teams at the act's level and the Class Mission complete; in Act III also the Merge Spell.

| Scenario | Wins | Spec target |
|---|---:|---|
| Act I · Violet · Level 10 · Class Mission | 20 / 20 | (as v10.5.1) |
| Act II · Scarlet · Level 11 · Class Mission | 20 / 20 | 8 or more in 10 |
| Act III · Gilded · Level 12 · Class Mission · both pairs fused | 20 / 20 | 8 or more in 10 |
| Act III · one pair fused | 13 / 20 | — |
| Act III · Merge Spell failed (no pair fused) | 2 / 20 | rare |
| Act II · no Class Mission | 0 / 20 | — |

The tuning values sit in one object in `game.js` (`sagaBalance`): the Scarlet Brand heals Vixar by 30% of the marked team's damage; a fused fighter deals 1.18× damage; the Fifth Silence hits fused fighters for 30% and unfused ones for 20%; an unfused class gets two last stands (one with a partial merge).

## Old computers

__FPS_SECTION__

## Not covered

- Physical smart boards and iPhone/Safari were not tested.
- The Apps Script was tested with the repository's Apps Script harness, not a live Google Sheet.
- The English voice depends on the device having an English (en-GB or other English) voice; without one the button has no effect and the lines stay on screen.
- Mr. Saymaz's pictures, the hug illustration and the merged-team pictures are placeholders until the art is supplied; the tests check that the slots load nothing while empty and fall back cleanly.
