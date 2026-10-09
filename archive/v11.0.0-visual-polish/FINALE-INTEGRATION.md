> Updated by revision 11.0.0-visual2: the hug is now a transparent 1024-square actor layer over the same dawn. See VISUAL-REFINEMENT.md for the current behavior.

# Finale integration · 11.0.0-finale1

The Finale now uses the illustrated Mr. Saymaz throughout: natural eyebrows, green eyes, white polo, dark grey pleated trousers, black shoes and watch. The portrait, standing poses, kneeling pose and six liberation images share the creatures’ drawing style. The final sunrise illustration shows him embracing the four Level 0 creatures, with all five faces visible and quiet sky for the closing title.

## Watch before deploying

1. Extract the complete ZIP.
2. Open **FINALE-PREVIEW.html** in your browser. Keep it beside the `public` folder.
3. Choose **Play full Finale** or **Rehearse the reunion**.
4. Use **Continue** to advance between scenes. Let the reveal and reunion play for about eight seconds each before continuing.
5. Try **Pause**, **Closing card**, and **Light / still mode**. Exit returns to the preview menu.

This offline page uses the production Finale code and included artwork. It does not connect to the board, authenticate, save class records or change scores. The preview has no audio; the live game retains its sound and optional speech hooks.

## In the live game

The existing Act III win still opens the Finale. The teacher can advance it from the board or remote:

- Gilded armour cracks and breaks apart.
- The bound figure’s chains and spells fall away; the faceplate cracks and Mr. Saymaz’s identity is revealed, eyes and mouth closed as he awakens.
- He stands in his own clothes, thanks the class and celebrates contributors.
- All four Celestial creatures glow and become their Level 0 forms. They gather as he kneels, then move into the embrace.
- The live group fades into the new sunrise hug illustration. The closing words stay above their faces.

The Level 0 transformation only replaces the Finale’s displayed artwork. It does not reset points, participation, earned team levels, class saga progress or island progress.

## Reliability and performance

Reveal frames must load and decode before their sequence starts. Failed downloads retain a visible fallback. The reunion’s creature placement uses the actual contained portrait dimensions and the new kneeling artwork’s arm positions. Skipping during the reunion completes the final pose immediately and invalidates old movement callbacks. Loading completions respect the scene clock; active Web Animations follow pause/resume. Closing a scene prevents late downloads from reopening it.

Runtime artwork is WebP: portrait 320 square; ordinary and reveal poses 640 × 1120; kneeling 1024 × 1792; reunion 1672 × 941. The full PNG sources are in `art/saga`. New cache tags request the revised art and scene code after deployment. Motion uses finite opacity/transform animations; Light mode and reduced-motion settings keep a still reunion.

## Deployment

Deploy the complete project using your existing Netlify method. Retain its `netlify.toml`, functions and `public` folder. This revision adds no environment variables and needs **no additional Apps Script update** when already running the v11 script. The existing first-time v11 migration instructions still apply if upgrading from an older major build.

## Verification

All 49 automated groups passed: v11 saga/data rules (17), creature poses (12), Vixar motion (6), art/asset loading (5), and new Finale integration (9). The new checks cover reveal decoding and failure, pausing, four Level 0 transformations, preserved team data, skipping at four points, stale callbacks, reduced motion, portrait containment, animation pause/resume, transparent assets and preview dependencies.

Artwork was visually inspected. Browser playback on a real board/phone was not available in this environment; use the included preview for that final visual check. All prior battle polish remains included.
