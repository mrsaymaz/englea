# v10.5.1 verification

v10.5.1 is the supplied v10.5.0 build (imported unchanged, then reviewed) with two changes to `public/creature-poses.js` and `public/creature-poses.css`.

## The two changes, measured (Chromium, 1366 × 768, Animated mode)

| | v10.5.0 | v10.5.1 |
|---|---|---|
| Pose layer in a 245 × 205 team-card avatar box | 205 × 205, 20 px from the left | 205 × 205, 20 px from the left |
| Pose layers in the Arena and on the Champions screen | as measured | identical sizes and positions |
| Page measurements when a pose appears | 2 | **0** |
| Pose sheets kept decoded | 6 | **10** |
| Sheet requests in a test lesson (every team evolves twice) | 46 (12 sheets fetched again) | **31** (6 fetched again) |

## Island Run runner: measured, no change shipped

A cache of pre-scaled runner poses was built and measured with Island Run locked at full quality, on a CPU slowed to a quarter of its speed:

| | Frame rate | Creature drawing per frame |
|---|---|---|
| Original runner (poses off) | 24–27 fps | — |
| v10.5.0 poses | 25–30 fps | about 0.1 ms |
| With the runner cache | 26–27 fps | about 0.2 ms |

The v10.5.0 runner is as fast as the original, so the cache was left out. An earlier comparison suggested a 6–9 fps drop. It was not controlled: Island Run changes its resolution step while it runs, and that, not the poses, caused the difference.

## Tests

- **`npm run test:v105`** (dependency-free): passes, 157 PASS lines. It includes:
  - the v10.5.0 pose contract tests (`creature-poses.cjs`; the cache-size expectation moved from 6 to 10);
  - `v1051.cjs`: the ten-sheet cache, the CSS rule and fallback, and the version tags. The pose pictures keep `?v=10.5.0`, so they are not downloaded again.
- **`npm run test:board`** (Chromium, board + phone): all ten suites pass, 41 PASS lines. The new `board-v1051.cjs` checks:
  - a team-card pose is square, fitted and centred, and measures nothing;
  - up to 10 sheets stay decoded through a lesson;
  - Island Run draws the runner's creature poses.
- **Before import:** all ten board suites also passed on the supplied v10.5.0. Its own report says no browser tests were run there.
- **Unchanged:** the Apps Script, Netlify functions and question banks are the same as v10.4.3.

## Not covered

- Physical smart boards and iPhone/Safari were not tested.
- The optional artwork checks (`creature-art.cjs`, `render-creatures.cjs`) need Sharp and `@napi-rs/canvas`, which are not installed here.
