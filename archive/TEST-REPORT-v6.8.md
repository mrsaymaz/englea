# v6.8 verification

Local Chromium verification completed on 27 September 2026.

The main browser suite passed 21 scenario groups with no uncaught browser errors or missing local requests. Focused follow-up checks covered defense visibility, exact approach timing and scene resume under 4× CPU throttling.

## Passed scenarios

- Actual board Add click and the remote ACTION receiver produce the same score, combo and progression. Reset shares one action, and Undo restores combo state.
- Arena in Light, Animated and Performance: both fighters approach the stage center, HP changes on impact, level-10 scale is about 2.8× level-0 scale, and exit clears motion and scene timers.
- Targeted timing check samples both actors at the damage-contact millisecond. Per-segment easing preserves the intended contact time.
- Performance defense shields remain visible with their continuous animation disabled.
- VIXAR in all three modes: intro curtain clears; attacks target seals first; the boss remains protected until all seals break; subsequent attacks target the core; guard reactions are visible.
- Guardian fitted height is approximately half VIXAR's height.
- At 420/4200 HP, only one final attack runs. It knocks out all teams through temporary shields/invulnerability. Four distinct team-color streams summon the Guardian; the final strike defeats VIXAR and revives every team at full HP.
- An incomplete mission produces defeat without the Guardian.
- Closing during the finale cancels callbacks. A new raid starts without stale damage or a stale Guardian.
- Hidden-page clocks pause and shift deadlines on resume. Cached-page lifecycle events preserve pending scene timers and resume correctly.
- Reduced motion suppresses optional effects while preserving finale and reward outcomes.
- 1024×600 and 390×844 raid layouts have no horizontal overflow; the close control remains visible.
- Animated Unity shows the body/head before tail/wings. Three real level rewards arrive gradually. Skip completes the pending reward; replay adds no duplicate levels.
- Arena effects cap at 10; raid effects cap at 12. Repeated exits leave no actor animations, effects or raid timers.
- All 44 team WebP images decode at 384×384.
- One full unassisted Legendary raid reached victory and full-health revival. One full unassisted Arena reached the result screen and released scene ownership.
- Under Chromium's 4× CPU throttling, bounded effects, cached-page pause/resume, finale state and cleanup passed. This is a functional stress check, not a measured FPS guarantee.
- Visual review covered Arena, VIXAR, Guardian assembly/arrival, result screen and narrow layouts.

## Static preservation checks

All packaged JavaScript, including the Netlify function, parses successfully. The Google Sheets submission section, TURN function, `netlify.toml`, packaged artwork and PeerJS vendor file are byte-identical to v6.7. The existing title and opening/scoreboard/remote layouts are retained; the release badge is v6.8.

## Verification limits

Tests ran locally with external requests blocked. No live Google Sheets write, Netlify deployment or FATIH-network/phone relay connection was made. The school's physical Pardus smartboards and an actual iPhone were not available. Browser viewport checks and CPU throttling do not reproduce every device or GPU. Classroom testing remains the final check of smoothness and the existing Sheets workflow.
