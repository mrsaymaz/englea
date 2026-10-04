# v9.2.0 — Island Run scenery and gameplay refinement

This is the complete tally project. Island Run opens from the golden island beside the Battle Arena champion, with that team's current class and avatar.

## Deploying this update

1. Finish the active lesson. Keep your working deployment and download an Island Run backup from **Run settings → Save & restore**.
2. If **GOOGLE-APPS-SCRIPT-v9.1.0.gs** is already deployed, leave it in place. This update adds no Sheet columns or backend changes.
3. Deploy the complete extracted project to your existing Netlify site using your working deployment method. Include **public**, **netlify/functions** and **netlify.toml**. Uploading only the public folder omits required connection and Sheets functions.
4. Keep your existing Google deployment URL and working Cloudflare TURN environment variables. No new key or environment variable is needed.
5. Reopen/refresh both board and phone. Check **Island Run Edition · v9.2.0** on both opening screens. Start a new room and connect the phone.

If you have an older Apps Script, the complete **GOOGLE-APPS-SCRIPT-v9.1.0.gs** is included. Replace the old main script, retaining your current teacher PIN. Save, then **Deploy → Manage deployments → Edit → New version → Deploy**, retaining your existing deployment URL and access settings. Follow `START-HERE-v9.1.0.md` for the detailed Sheet upgrade. Do not add a duplicate script alongside the old functions.

## What changed

- **Scenery:** every island has a distinct vector landmark. Distant terrain, the landmark/background plane, and near-edge scenery move at different gentle speeds. The curriculum realm still supplies its palette.
- **Runner:** the current avatar has a calmer house-specific gait, acceleration lean, distance-based jump tilt and a small landing ripple. There is no rapid pose swapping.
- **Boss attacks:** ten signatures travel along the marked lanes. Warning duration, dodge/jump rules, weak lanes and damage are the same as v9.1. Exposed weak points glow; coin impacts recoil and create a small ring. The final impact is stronger without flashing the whole screen.
- **Focus:** fire embers, wind ribbons, leaves or water droplets circle the avatar. Nearby collected coins leave short curved trails. All houses still receive the same magnet and one-charge shield.
- **Course rhythm:** hazard groups have a longer coin-collecting breather. Questions keep coins and hazards active but simplify upcoming two-lane clusters. Longer prompts use wider single-hazard spacing.
- **Reading:** restrained brass and stone framing surrounds a stationary, high-contrast prompt and parchment choices. Correct answers briefly colour the chosen lane. No countdown is displayed.
- **Restoration:** after a win, repaired landmark geometry and lights reveal over the old island. The boss emblem, stars and team mark settle beside it. The five-second scene is skippable; results wait until it finishes.
- **Passport:** new seals and improved star records settle into the existing slot the next time Passport is opened during that visit. The animation does not replay on every opening. Practice stamps are clearly labelled and never saved.

| Island | Landmark | Boss signature |
|---|---|---|
| 1 | Lantern sanctuary | Veyr: amber shockwave |
| 2 | Clockwork station | Tickthorn: crossing gears |
| 3 | Crystal arch | Mirrath: crystal shards |
| 4 | Rootbound grove | Rootmaw: curling roots |
| 5 | Signal viaduct | Vox: fragmented signal bars |
| 6 | Storm spire | Kaelis: lightning fork |
| 7 | Tidal lighthouse | Morrow: curling wave |
| 8 | Moon observatory | Noctryn: moon crescents |
| 9 | Ember forge | Ferron: ember slab |
| 10 | Eclipse astrolabe | Astrax: eclipse ring and shadow crescents |

## Slower smartboards

**Run settings → Graphics → Automatic** is the default. Sustained slow rendering reduces decorative particles, avatar strips, scenery motion and canvas resolution. It recovers cautiously when performance improves. Questions and controls stay in the DOM; graphics settings never change the run's rules or coin totals.

Choose **Light** before a run for an older board. This preference is remembered in that browser. **Reduce decorative movement** remains a separate option and also honours the operating system's reduced-motion preference. Boss projectiles remain visible because they communicate the attack.

## Progress and balance

Save the class session from the teacher remote after returning to Champions to save passport progress online. Load islands when choosing that class on another board. Existing best stars, scores, coin percentages and Hard clears never decrease. Each class/team keeps its own unlocks; Soft/Hard share progression. The new visual stamps need no additional Sheet data.

The question pool still contains **4,240 variations** and uses the existing no-repeat history and Teacher Studio. Teacher edits affect the next run. Soft requires **50%** of finite route coins on Island 1 and Hard **70%**, increasing by **2 percentage points** per island to **68% / 88%**. The route layout has changed, so an exact coin count may differ; the displayed target is still rounded up from the actual total. Bonus points and Focus do not replace required coins.

Vixar remains the separate main-board raid. All four teams at Level 8 reveal it; all four at Level 10 can damage it. The Class Mission and Unity Guardian sequence remains. Ten island completions are not required.

## Quick classroom check

Connect the remote and award a point. Finish a test Arena, open Island Run, and verify the champion avatar/class. Use **Run settings → Test any island** for an unsaved preview. Try Jump during a question, dodge a boss attack, fire from the gold lane and watch a restoration. Open Passport after a real win, then save the session. Check long-choice readability on your actual horizontal board; try Light if needed.

Automated gameplay, application, connection, backend and native canvas checks pass. Native browser layout, Safari and your physical devices were not tested here. See `TEST-REPORT-v9.2.0.md` for the exact scope. No live site or account was changed while preparing this package.
