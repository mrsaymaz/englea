# v10.3.0 — Smoother class moments on slow smart boards

This release changes nothing you see or play. It makes Island Run, earning points and the Battle Arena run more smoothly on slower smart boards.

## What changes in class

- **Island Run.** On a slow board, the run is now drawn at a slightly lower resolution: the scenery looks a little softer, but questions, answers and scores stay sharp. Each board remembers the setting it needs, so from the second run on it runs smoothly from the first second.
- **Earning points.** An award no longer makes the board recalculate its whole layout while the award is still happening. The score, the student card and the halo respond with a shorter pause.
- **Battle Arena.**
  - The board's animated background is no longer drawn behind the Arena, which covers it anyway.
  - On a slow board, the Arena's glowing backdrop stays still instead of pulsing.
  - The board checks its speed more often during a fight and remembers the result for the next one.
- **Board passport.** Each smart board remembers how fast it is: the Island Run setting and the effects level. A board that becomes fast again (for example after an update) moves back to full quality by itself. Gameplay, points and scores never change.
- **Session recovery** saves in the board's idle moments, within about half a second of a change, instead of in the middle of each award. It still saves immediately if the page is closed or hidden.

The Class Mission celebration and the Vixar boss fight were already smooth and are unchanged.

## Deploying this update

1. **Apps Script: no change.** Keep **GOOGLE-APPS-SCRIPT-v10.2.0.gs**.
2. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**.
3. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.3.0**.

## Quick classroom check

1. **Island Run on your slowest board:** the first run may adjust during its first few seconds. From the second run on, it should run smoothly from the start.
2. **Awards:** they should respond at once, including when the ranking changes.

Earlier guides are in `archive/`. `START-HERE-v10.2.0.md` covers the Comeback Halo.
