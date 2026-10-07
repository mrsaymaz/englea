# v10.5.1 — Living Creatures, smoother

This is v10.5.0 (the creature action poses) with two changes that make the poses lighter on the smart board. Nothing looks or plays differently.

## What changes

- **More pose sheets stay ready.** The board keeps 10 creature pose sheets in memory instead of 6. That covers four teams at their current and next level, plus an island boss and Vixar. Fewer sheets are loaded again during a lesson: in a test lesson where every team evolved twice, requests fell from 46 to 31.
- **No measuring when a pose appears.** The pose picture is now sized by the page's style rules. Before, the board measured the avatar box each time a pose appeared, which made it work out the page layout. Poses have exactly the same size and position as before: on the team cards, in the Arena and on the Champions screen. Older browsers (before Chrome 88 or Safari 15) still measure, so they keep working.

**Island Run:** I tested a version that pre-draws the runner's poses. Measured carefully, the runner's creature drawing costs only about 0.1 ms per frame. The v10.5.0 runner is as fast as the original one, so that change was left out.

## Deploying this update

1. **Apps Script: no change.** Keep **GOOGLE-APPS-SCRIPT-v10.4.0.gs**.
2. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**.
3. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.5.1**.

The pose pictures keep their v10.5.0 cache tag, so boards that already loaded them do not download the 12 MB again.

Creature Studio (`public/creature-studio.html`) previews every creature, level and pose. `CREATURES-v10.5.0.md` describes the artwork. Earlier guides are in `archive/`.
