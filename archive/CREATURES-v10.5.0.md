# Creature art and behaviour

## Art inventory

| Asset group | Forms | Poses per form | Total |
| --- | ---: | ---: | ---: |
| Gryffindor, Hufflepuff, Slytherin, Ravenclaw | 44 (levels 0–10) | 9 | 396 |
| Island bosses | 10 | 6 | 60 |
| Vixar | 1 | 9 | 9 |
| Total | 55 | | 465 |

Team states, in reading order: `ready`, `attack`, `guard`, `hit`, `proud`, `support`, `runA`, `runB`, `jump`.

Island boss states: `ready`, `attack`, `guard`, `hit`, `exposed`, `defeat`.

Vixar states: `ready`, `charge`, `cast`, `guard`, `exposed`, `hit`, `ultimate`, `defeat`, `proud`.

The generated action sheets use each original creature and level as the identity reference. Hufflepuff retains its bear/stone/antler evolution; Ravenclaw retains two wings; Slytherin's three-headed forms start at level 8. The original PNG/WebP avatar assets were not replaced.

## Runtime

`public/creature-poses.js` is a presentation-only controller. DOM avatars use a temporary atlas layer; the runner crops the same atlases through Canvas2D. Game rules and engine state remain authoritative.

- Current forms load on demand; the controller retains at most six image entries. No full-catalog preload.
- WebP atlas cells are 320 px for teams, 384 px for island bosses and 448 px for Vixar. Total new art is about 11.54 MiB; a normal scene requests its current forms only.
- All frames share a ground anchor at 95% of cell height and one scale per form. The atlas is fitted to a square inside the original avatar box, avoiding distortion in rectangular results slots.
- A higher-priority hit, guard or knockout can interrupt a lesser reaction. Revive explicitly removes the knockout lock. A stale decode cannot resurrect an old pose.
- The original avatar is hidden only after a new pose image loads. Failed or slow loads leave it visible.
- Scene changes, pause, hidden tabs, resize and page exit clear active pose layers. Results exchanges are finite and stop when opening Island Run.
- Runner art uses the level supplied by the current lesson, not island number. The real question gate slows running pose changes; jump physics are unchanged.
- There is no new timer, random decision, damage calculation, point award, participation write or Sheets operation in the pose controller.

## Where hooks live

`animated-mode.js`: current/next-form warming and evolution reveal.

`game.js`: board reactions, leader changes, low-health transitions, arena knockout, Vixar phases and results scheduling.

`arena-motion.js` / `raid-motion.js`: existing attack/guard/hit/revive events, retaining the original movement and projectile timings.

`island-runner/scenery.js`: current-level sprite crops and boss-state art, with original-image fallback.

The exported manifest at `public/assets/poses/manifest.json` records cell order, dimensions, byte counts and SHA-256 hashes. To replace art, keep those state orders and anchors, then update the manifest and cache version. `art/pack-poses.cjs` and `art/extract-poses.cjs` document the mechanical packing process. Source generation sheets are not required to run the game and are omitted from the deployment ZIP.

For repacking new original sheets, install Sharp, then run `node art/pack-poses.cjs /absolute/path/to/inputs.json --force`. Input is an array of `{id, source, cols, rows, states}` records, where `source` is the PNG path. The extractor identifies figure cores and grows labels back to the original alpha edges; this avoids chopping a figure at an imperfect grid line. It does not repaint the artwork. Review the generated sheets in Creature Studio after repacking.

## Intentional limits

These are hand-picked action poses with restrained motion, not skeletal animation or video. Movement between poses comes from the game's existing transforms. Light/Ultra vector rendering remains the old rendering path. The new sprites do not add speech, labels or effects over question choices and contributor names.
