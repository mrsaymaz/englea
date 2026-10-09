# Creature art and behaviour (v11.0.0)

v11.0.0 adds two team levels and two Vixar forms to the v10.5.0 creature system, Mr. Saymaz (five poses, a portrait and a six-frame reveal) and the two Merge Spell fusions. The v10.5.0 guide (pose controller, anchors, fallbacks) is in `archive/CREATURES-v10.5.0.md`; everything it describes still applies.

## Art inventory

| Asset group | Forms | Poses per form | Total poses |
| --- | ---: | ---: | ---: |
| Gryffindor, Hufflepuff, Slytherin, Ravenclaw | 52 (levels 0–12) | 9 | 468 |
| Island bosses | 10 | 6 | 60 |
| Vixar (Violet, Scarlet, Gilded) | 3 | 9 | 27 |
| Slyffindor, Huffleclaw (Merge Spell) | 2 | 9 | 18 |
| Total | 67 | | 573 |

New in v11.0.0 (about 4.1 MB, loaded only when a class reaches them):

| Picture | Avatar (`public/assets/animated/`) | Pose sheet (`public/assets/poses/`) |
|---|---|---|
| Level 11 · **Mythic** (violet crystal), four teams | `{team}-11.webp`, 384 × 384 | `{team}-11.webp`, 3 × 3 cells of 320 px |
| Level 12 · **Celestial** (scarlet ember), four teams | `{team}-12.webp`, 384 × 384 | `{team}-12.webp`, 3 × 3 cells of 320 px |
| Scarlet Vixar (Act II) | `vixar-scarlet.webp`, 1100 × 890 | `vixar-scarlet.webp`, 3 × 3 cells of 448 px |
| Gilded Vixar (Act III) | `vixar-gilded.webp`, 1100 × 890 | `vixar-gilded.webp`, 3 × 3 cells of 448 px |
| Gilded Vixar, cracking (the Finale) | `vixar-gilded-cracking.webp`, 1100 × 890 | — |

Team and Vixar state orders are unchanged (teams: `ready`, `attack`, `guard`, `hit`, `proud`, `support`, `runA`, `runB`, `jump`; Vixar: `ready`, `charge`, `cast`, `guard`, `exposed`, `hit`, `ultimate`, `defeat`, `proud`). Each Level 11 form keeps its Level 10 creature and adds violet crystal; each Level 12 form is its scarlet-ember awakening, as supplied in the art packs.

## Runtime notes

- The level clamp is 12 in the pose controller, Animated mode, the Comeback Halo (new head anchors for Levels 11 and 12), session recovery, Island Run and Creature Studio. A class only reaches Level 11 or 12 when its saga cap allows it.
- **Cache tags:** the new pictures load with `?v=11.0.0`; the v10.5.0 sheets keep `?v=10.5.0`, so boards that already have them do not download them again.
- **Fallback:** if a Level 11 or 12 avatar or sheet fails to load, the board shows the Level 10 picture of the same team instead of a gap.
- Scarlet and Gilded Vixar always use their pictures, in every mode. The Violet form keeps the Light mode drawing as before.
- **Scarlet and Gilded Vixar now use nine high-resolution poses each.** Sources are in `art/vixar-poses/`; the two 1920 × 1920 runtime sheets use 640 px cells. Both forms have `poses:true`. The packer also creates a matching idle picture so poses return to the same scale and ground anchor. Light mode keeps the still picture and does not download the sheets (the boss still moves).
- **Every fighter faces Vixar.** The creatures on the left look right and those on the right look left. A few pictures were drawn looking left (Gryffindor Levels 0–2, Slytherin Level 0); `animated-mode.js` marks them (`data-native-facing`) and the fight flips them when needed. The Finale uses the same marks so every creature looks toward Mr. Saymaz.
- `public/creature-studio.html` previews Levels 0–12, the three Vixar forms and the two fused creatures.

## Fight effects (`public/fight-fx.js`)

Damage numbers (criticals larger, heals and blocks in their own colour), hit sparks, a ~70 ms hit-stop on criticals, a red ground warning under a team before Vixar's blow, shield shards and a few pixels of shake on heavy blows. Rules: transforms and opacity only (no filters, shadows or per-frame layout reads), every effect is finite and counted against `LeaguePerformance.limit`, hit-stop and shake run only at the top effects level, nothing runs while paused, hidden or fast-forwarding. Light mode and reduced motion keep only the numbers, shown still. Presentation only: no damage, HP or timing is read or changed.

## Mr. Saymaz and the fused teams (`public/assets/saga/`)

The saga's own pictures are listed in **`public/assets/saga/manifest.json`**. They load only when the Finale starts or a pair fuses in Act III (about 1.2 MB in all).

| Slot | Files | Where it appears |
|---|---|---|
| `mrSaymaz.portrait` | `mr-saymaz-portrait.webp`, 320 × 320 | the round ally portrait on the board for a Freed class |
| `mrSaymaz.ready` | `mr-saymaz-ready.webp`, 640 × 1120 | the Finale, after the reveal |
| `mrSaymaz.proud` | `mr-saymaz-proud.webp` | while the names are shown, and in the speech |
| `mrSaymaz.support`, `mrSaymaz.wave` | `mr-saymaz-support.webp`, `mr-saymaz-wave.webp` | the speech (the poses take turns line by line); `support` (arms open) stands in for `kneel` if that picture is missing |
| `mrSaymaz.bow` | `mr-saymaz-bow.webp` | the hug: he bends down to the little creatures at his feet |
| `mrSaymaz.kneel` | `mr-saymaz-kneel.webp`: 1024 × 1792, transparent | the hug: kneeling with his arms open; used during the hug before the reunion illustration |
| `reveal` (six frames) | `mr-saymaz-reveal-01-bound.webp` … `-06-identity-revealed.webp`, 640 × 1120 | the Finale reveal: bound in the cursed gown, the chains and violet bindings break, the gold faceplate cracks, his face is revealed |
| `merged.slyffindor`, `merged.huffleclaw` | `slyffindor.webp`, `huffleclaw.webp`, 512 × 512 | the Merge Spell when a pair fuses, and the fused fighter in Act III |
| `hug` | `hug.webp`: 1024 × 1024, transparent (source `art/saga/hug.png`) | the end of the hug: the live characters dissolve into it over the same dawn, and it stays under the closing title |

All Mr. Saymaz pictures share one canvas (1024 × 1792 in the art pack, shoes on the same line), so the board shows every pose and reveal frame in the same box with no jump; they were only scaled, never trimmed. The reveal frames cross-fade (opacity only) while he fades in, then a soft flash covers the change from the gown to his own clothes. Light mode and reduced motion show the identity frame, then the standing pose. The frames load while the armour cracks, so they are ready when the reveal starts.

**Fused teams:** each pair has a still picture (made with `node art/place-avatar.cjs avatar <source.png> <out.webp> 512`, framed like the team avatars) and a nine-pose sheet in `public/assets/poses/` (`slyffindor.webp`, `huffleclaw.webp`; 3 × 3 cells of 320 px, team states, cache tag 11.0.0). In Animated mode the fused fighter is a creature avatar, so the raid's attack, guard and hit poses play from its own sheet. In Light mode it is the still picture and the sheets are not downloaded. If a picture fails to load, the two Level 12 creatures stand in for it, as before.

**The hug.** About six seconds: the four Celestial creatures glow and turn back into their Level 0 selves, run to Mr. Saymaz, he bends down to them (`bow`), kneels with his arms open (`kneel`), the camera moves in and the little ones jump into his arms; hearts rise. Then only the characters dissolve into the hug picture (a transparent cut-out of him hugging the lion cub, little snake, bear cub and eaglet), so the dawn, the light and the ground never change. The board skips a kneeling picture under 480 px wide or a hug picture under 1000 px wide and keeps the live scene instead. Light mode and reduced motion show the final hug at once.

**The reveal's faceplate.** The fifth reveal frame's crack is a hairline in the art, so the board draws seams of light across the gold mask while that frame shows (on the frames' 1024 × 1792 canvas, so it stays on the mask at any size) and lets them flash away as his face appears. Animated mode only.

To replace any picture: keep the file name or write the new one in its slot, deploy and reload. A missing Mr. Saymaz pose falls back to `ready`; a picture that fails to load falls back to the placeholder.

## Repacking

`art/pack-poses.cjs` and `art/extract-poses.cjs` pack pose sheets as described in the v10.5.0 guide; the Level 11, Level 12, Vixar and fused-team sheets were packed with them from the supplied art packs, with the same cell sizes and ground anchor (95% of the cell height). The fused-team sheets arrived packed; their sizes and SHA-256 hashes were checked against the pack's manifest before they were added.
