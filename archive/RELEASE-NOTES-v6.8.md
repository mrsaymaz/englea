# v6.8 — approved combat and code improvements

## Shared motion language

Short anticipation, approach, contact, recoil and return phases use common timings and team-specific movement profiles. Position, facing, level scale and impact pose use separate wrappers so a shield reaction does not overwrite an attacking team's movement. Optional effects use finite transform/opacity animations. Existing card reorder/Switch movements and inline Animated chest moments use the shared timing definitions.

## Final Arena

One pair at a time can meet near the center. Other attacks use short directed movements and a single connecting effect. Impact marks follow the actual target, including during movement. Claw, nature, air and water attack/guard shapes remain distinct without particle showers.

All three modes use the HP-focused combat presentation and retain Knocked Out labels. Level size remains an Arena-only cue, from 0.55 at level 0 to 1.55 at level 10 (about 2.8 times as large). The scoreboard avatars are not rescaled by this change. The existing result screen still separates the League Champion from the Arena Champion.

## VIXAR and Unity Guardian

Scene phases explicitly control the intro curtain, sealed combat, exposed core, last attack, summoning and result. The Performance intro completes before the combat clock advances; Light and Animated reveal the field immediately. Teams keep their seal-first targeting and then direct attacks to the exposed core. Guard and hit reactions use independent pose layers.

The final attack, four team-color summon streams, approximately half-size Guardian, decisive strike and full-health revival are retained and coordinated through tracked scene timers. The summon gains a brief four-color convergence effect. No explanatory combat narration was added.

Animated Unity assembly uses the existing transparent body/arms/legs, head, tail and wings assets. Each joins at its attachment area, with the four streams aimed at the part being assembled. Gradual one-level reward waves, skip completion and replay without duplicate rewards are preserved.

## Code organization and load controls

| File | Responsibility |
| --- | --- |
| `game.js`, `game.css` | Main application logic and existing styles extracted from HTML |
| `game-rules.js` | Pure score calculation and team reset rules |
| `session-state.js` | Bounded 20-entry Undo snapshots, excluding generated SVG caches |
| `scene-runtime.js` | Scene ownership, tracked timers, pause/resume and cancellation |
| `motion.js` | Shared finite timing, team movement profiles and effect channels |
| `arena-motion.js` | Central exchanges, directed marks, geometry and cleanup |
| `raid-motion.js` | Finite VIXAR actors, streams and effects |
| `guardian-assembly.js` | Anatomical assembly and stream attachment targets |
| `combat-motion.css` | Shared combat pose and effect styles |

Board and remote Add/Reset actions now use the same application functions; Undo restores combo state too. Arena and raid game loops run at 10 updates per second while browser animation runs independently. Temporary Arena effects are capped at 10 and raid effects at 12. Hidden pages pause scene clocks; exits cancel scene work and remove transient visuals. Reduced motion preserves game outcomes while suppressing optional motion.

This is an incremental separation, not a complete application rewrite. External libraries, avatar files and backend services have not been replaced.

## Preserved scope

The existing title, artwork, opening screen, mobile remote layout, scoreboard layout, Performance/Animated/Light choices and Soft 1-step default remain. The Google Sheets submission section, Netlify TURN function, Netlify configuration and PeerJS vendor file are byte-identical to v6.7. No Apps Script or environment-variable changes are required.
