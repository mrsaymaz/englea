# Final Arena laboratory — v8.5.1

This folder contains a reproducible simulator for the exact released arena code. It is not loaded by the website. Run commands from this folder with Node.js:

- `node verify.cjs 10000`: reproduce the 230,000 final equal-team validation fights (10,000 per case; the low-HP Level-9 case uses 20,000 fresh seeds after its targeted refinement).
- `node stress.cjs`: reproduce the 72,000 point/level advantage fights and 20,000 Level-4-to-5 relic-boundary fights.
- `node parity.cjs`: compare 72 seeded cases with the full browser game. Requires Playwright and Chromium; the project test README documents optional executable-path environment variables.
- `node lab.cjs 1000`: a smaller exploratory positive-score run.

The source folder contains the production arena extract, production clock and HP rules. `manifest.json` pins the released game.js hash. Only presentation/audio entry points are disabled; combat scheduling, targeting, damage, abilities and winner selection use production functions.

Recorded final results are in `validation.json`, `stress.json`, `relic-boundary.json`, `win-rates.csv` and `parity-result.json`. Reproduction commands write separate `rerun-*.json` files, except the small exploratory runner. Seeds for final validation were not used to fit the released parameters.

Traits are sampled uniformly without replacement within each team's own tree; relics unlock at Level 5. The clock runs the production 30-second arena in event order, without real browser timing jitter. The four-team arena is the scope; Vixar is not part of the win-rate calibration.

Calibration uses two fixed tables for each team/level. The arena's mean initial maximum HP linearly interpolates between them, clamped to 200–250 HP. This value is recorded once at arena start, so attacks do not receive a live catch-up bonus based on current HP or placement.

Root `BALANCE-REPORT-v8.5.1.md` explains results, remaining contextual differences and validation limits.
