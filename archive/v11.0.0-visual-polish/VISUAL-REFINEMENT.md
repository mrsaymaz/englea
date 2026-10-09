# Visual refinement · 11.0.0-visual2

The final embrace is now a transparent character group over the same dawn scene used immediately before it. The landscape no longer changes when the finished hug appears. The camera keeps the same framing through the closing card, and the live characters dissolve into the finished pose while the background remains visible.

## What changed

| Area | Finding | Refinement |
| --- | --- | --- |
| Finale continuity | The opaque sunrise picture replaced the preceding scene completely. | Removed its entire background with image generation. The runtime uses a 1024-square alpha WebP; the existing dawn, floor, light and particles remain in place. |
| Finale framing | Live and illustrated characters had different vertical positions; the closing step changed the zoom again. | Matched their visible height and foot line across viewport sizes; retained one camera framing. Only character layers crossfade. |
| Finale text | The lower caption could compete with Continue. Long speech and names had limited overflow handling. | Moved captions above controls; added balanced title wrapping, bounded speech scrolling and a two-column names layout on narrow screens. |
| Board | Strong coloured glows softened the level digits. Touch hover could lift whole cards. | Crisp level digits on a solid dark badge; disabled card lift on touch-only screens. The badge stays at the top right. |
| Champions | Recognition panels used a different surface treatment from the main ceremony. | Matched their midnight panels and subtle gold emphasis; kept both champion titles prominent and all four contribution lists readable. |
| Battle / Vixar | White critical numbers could appear on bright yellow or green. Several HP labels were very small. | Fixed gold critical badges with dark text (14.4:1 contrast), tabular numbers, and larger HP labels on classroom-sized screens. |
| Teacher remote | The Comeback Halo badge could compete with a team name; the bottom status pill could overlap the session control. | Reserved name space and footer clearance. Existing three-name participation lists and scoring controls remain. |
| Island Run | Some decorative effects repainted filters/shadows; long boss/title text could overflow a single line. | Used transform/opacity alternatives for island beckoning, ordinary title arrival and correct-answer effects. Banners now wrap within their allotted width. |
| Shared presentation | Focus states and small panel details differed across screens. | Consistent focus rings, subtle inset edges, number spacing and button feedback. Covered tally backgrounds stop painting during full-screen scenes. |

The existing house identities, elemental colours, creature designs, question pool, progression, rewards and combat rules remain intact. The Level 0 reunion is presentation only; earned progress is not reset.

## Review scope and limits

Reviewed the production layout/style code for the board, remote, selection dialogs, champions, Arena, three Vixar acts, Finale, Island Run map/HUD/answer gates/boss/restoration/results, and shared motion rules. Visually inspected the revised reunion, Mr. Saymaz kneeling and the four Celestial stills; existing pose/atlas and asset checks cover their runtime contracts. This is not a claim that every frame of every creature pose was visually re-approved.

The main goal is a cohesive fantasy game presentation that remains legible across a classroom and lightweight on the board. The included checks verify asset and code behavior. Native browser playback, measured frame rate and layout screenshots were unavailable in this environment, so those remain the final device check before treating this as release-ready visual approval.

## Test it without deploying

Extract the complete ZIP, then open **FINALE-PREVIEW.html**. Choose **Rehearse the reunion** and let the animation finish. The transparent group should replace only the characters; the dawn behind them must remain unchanged. Use Continue for the closing title, then try Pause, Closing card and Light / still mode.

**ART-PREVIEW.html** shows the separate artwork on a neutral inspection backdrop. **BATTLE-MOTION-PREVIEW.html** rehearses the Vixar projectile sequence. Neither preview writes class records.

On the real board, check these views at its normal browser zoom:

- Board: level badge, long team scores, first-contribution name and constellation.
- Results: separate champions, a tied League result, all four top-three lists, Island Run access.
- Remote: iPhone 14 Pro with Safari toolbars expanded, a Comeback Halo team, and long student names. The main area can scroll when available height is reduced.
- Island Run: a long question, all three answer gates, obstacles during reading, a boss, restoration and the result dialog.
- Finale: full reveal, early Skip, pause during the embrace, then the closing card.

## Deployment and art files

Deploy the full project with the existing Netlify configuration. No new environment variables and no additional Apps Script update are required for this visual revision.

- `art/saga/hug.png`: native transparent image-generation output.
- `public/assets/saga/hug.webp`: optimized 1024-square runtime cutout, about 212 KB.
- `art/saga/HUG-PROMPT.txt`: the exact background-removal prompt and export notes.
- `public/visual-refinement.css`: scoped shared presentation refinements.
- `public/island-runner/visual-refinement.css`: runner-specific refinements.

Background removal used the built-in image-generation tool. The runtime export only crops/frames/resizes the generated alpha; it adds no scenery. Original character PNG sources and the previous battle improvements remain included.
