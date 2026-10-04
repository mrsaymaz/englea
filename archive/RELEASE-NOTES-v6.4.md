# English League v6.4 — Animated Evolution

## Three visual profiles

The selector now reads **Performance / Animated / Light**. Performance is the existing Ultra renderer, retaining its internal `ultra` storage key. Light keeps the original SVG avatars and lean presentation. Animated uses the same lean Arena, Unity, score and card-movement paths, with new creature artwork and short evolution reveals.

Animated has 11 transparent, static WebP forms for each team: a fire lion, emerald serpent/hydra, earth bear and celestial blue eagle. The fixed visual evolution follows level 0–10. Existing randomly selected traits still determine combat attributes and relic behavior. A form's painted accessories do not replace or reroll those traits.

The main team-card avatar area keeps its size. Arena scale alone runs from 0.55 at level 0 to 1.55 at level 10 (about 2.82 times larger). The lean Arena keeps HP and Knocked Out labels, center engagements, and each team's attack/defense animations.

## In-card evolution

Normal Add Points awards in Animated apply earned levels automatically, using the existing trait selection, relic unlock and point-tier doubling rules. Soft still requires one award and Hard requires three. Every fresh session starts in Soft.

At levels 3, 5, 7 and 10, a small chest anticipates, opens, sends a team-colored ribbon of light to the avatar, and reveals the next form. The effects last approximately 1.6, 2.0, 2.4 and 3.0 seconds respectively, after the target image is available. Other levels use a short crossfade. There is no chest modal, text or confirmation button in Animated. A chest already earned in another mode keeps its stored result and can still be opened from its card/Remote.

Subject Wheel rewards at levels 3, 6 and 9 remain separate. Finish waits for queued wheel rewards before recording the final leaderboard and starting the Arena. Unity retains its approximately 16-second assembly and three gradual reward waves. Remote evolutions earned during Unity wait for its reward sequence to finish.

## Resource controls

- 44 images at 384 × 384 pixels; approximately 2.07 MB combined on disk.
- Static sprites rather than video, animated GIFs or live 3D models.
- Only needed/current-next artwork is requested; the JavaScript preload cache holds at most eight image entries. Browser-managed image caching is separate.
- At most two card evolution effects run concurrently. Rapid awards for one team coalesce their pending visual reveal while retaining every earned level and milestone wheel reward.
- Transform/opacity motion; no particle burst, flying scenery, continuous avatar loop or animated blur in Animated.
- No new sprite requests in Light. Reduced motion skips the new chest effects.
- Undo, Reset Team, session reset, page hiding and profile changes cancel obsolete card effects.

## Remote and hosting

The phone header has compact ✨ / 🎬 / ⚡ board-mode buttons. Four teams, Reset Team, Class Mission and Finish remain on the phone layout. Visual-mode state is synchronized without changing the phone's rendering profile.

The existing TURN Function, Cloudflare environment-variable names, Google Apps Script endpoint and record format are retained. Animated adds static assets and requires the complete project upload described in `UPDATE-v6.4.md`.

The release has been checked in Chromium, including an artificial 4× CPU slowdown for the new milestone effects. This is not a frame-rate guarantee for every school computer. Light remains available for the weakest boards. Real FATİH connectivity and the final Google Sheets write must be confirmed on the deployed site.
