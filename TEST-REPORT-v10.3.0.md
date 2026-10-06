# v10.3.0 verification

## Before and after

Chromium, 1366 × 768, Animated mode. The processor was slowed to a quarter of its speed to stand in for an old smart board. Each moment was recorded for 9 seconds on v10.2.0 and v10.3.0, in the same way.

"Stutter" is the total time spent in frames longer than 50 ms, which the eye sees as a jerk.

| Moment | v10.2.0 | v10.3.0 |
|---|---|---|
| Points + student card (6 awards) | worst frame 233 ms; stutter 953 ms | worst frame 83 ms; stutter 467 ms |
| Island Run, first run | 26 fps; stutter 784 ms | 36 fps; stutter 400 ms (adjusting) |
| Island Run, later runs | 26 fps; stutter 1051 ms | **53 fps**; stutter 50 ms |
| Battle Arena | 34 fps; stutter 617 ms | 33 fps; stutter 283 ms |
| Battle Arena, next fight | 30 fps; stutter 317 ms | 37 fps; stutter 200 ms |
| Class Mission celebration | 60 fps; stutter 50 ms | 60 fps; no stutter |
| Vixar boss fight | 60 fps; no stutter | 60 fps; no stutter |

**A separate award test** (8 awards, slowed CPU): the longest frame after an award averaged 114 ms on v10.2.0 and 86–90 ms on v10.3.0.

**Island Run resolution steps** (slowed CPU, later runs):
- 100%: 24 fps
- 75%: 39 fps
- 55%: 53 fps

At one-sixth speed, the 55% step gives 36 fps with no stutter, against 16 fps before.

## How each gain was found

- **Island Run:** about 93% of a frame was the browser handing the picture to the screen, not the game's code. That cost grows with the number of pixels, so lower resolution steps were added, and the board remembers its step. The step drops when a run stays below about 42 frames a second.
- **Awards:** a trace showed the browser recalculating the whole board's styles and layout in the middle of an award. Four places caused it, and all four were removed:
  - the score restart;
  - the level badge restart;
  - the ranking slide's measurements, now cached when the grid changes size;
  - the leader crown, now started just after the next frame.
- **Battle Arena:** the game's code used under 10% of each frame. The cost was combining about 13.5 screens' worth of layers. Two changes help:
  - not drawing the board background under the Arena;
  - keeping the glow still on boards that need lighter effects.

  The Arena has no 30-frame cap; its rate is limited by this layer work.

## Checks

- **New `v103.cjs`** (no dependencies):
  - the resolution steps (100%, 75%, 55%);
  - a slow board steps down and remembers its step, and a fast board steps back up;
  - Light graphics are not remembered as the board's step;
  - awards contain no layout reads;
  - recovery is saved when idle, and at once on close or hide;
  - the effects level is remembered;
  - no board background is drawn under the Arena.
- **New `board-v103.cjs`** (Chromium):
  - 5 awards, 2 of them with a ranking slide, read no layout while they run;
  - the recovery snapshot is saved within a second of an award, and at once when the page is hidden;
  - the board background is hidden under the Arena;
  - Island Run runs at 100% on a new board, steps down after a slow run, and starts the next run at 55%;
  - a remembered effects level applies at the next start.
- **Other suites:**
  - the full dependency-free suite (`npm run test:v103`) passes 131 checks;
  - `npm run test:board` passes 31 of 31, twice in a row;
  - next-to-invite, arena techniques, projectiles and HP, Unity reward visibility, the access gate and the Vixar finale pass.

## Limits

- **Simulated hardware.** Chromium ran without a graphics card, with the processor slowed. No real smart board was used. On a board with working graphics acceleration, the Arena and Island Run gains may be smaller or larger.
- **Variable figures.** Frame rates vary from run to run by a few frames a second, so they are reported here rather than used as pass/fail checks.
- **Awards on a slow board.** Awards still show one frame of about 80–90 ms on the slowed CPU, from drawing the new student card and score. My earlier target was no pause over 50 ms; that was not reached.
