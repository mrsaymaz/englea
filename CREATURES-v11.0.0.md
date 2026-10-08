# Creature art and behaviour (v11.0.0)

v11.0.0 adds two team levels and two Vixar forms to the v10.5.0 creature system, plus art slots for the pictures still to come. The v10.5.0 guide (pose controller, anchors, fallbacks) is in `archive/CREATURES-v10.5.0.md`; everything it describes still applies.

## Art inventory

| Asset group | Forms | Poses per form | Total poses |
| --- | ---: | ---: | ---: |
| Gryffindor, Hufflepuff, Slytherin, Ravenclaw | 52 (levels 0–12) | 9 | 468 |
| Island bosses | 10 | 6 | 60 |
| Vixar (Violet, Scarlet, Gilded) | 3 | 9 | 27 |
| Total | 65 | | 555 |

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
- `public/creature-studio.html` previews Levels 0–12 and the three Vixar forms.

## Fight effects (`public/fight-fx.js`)

Damage numbers (criticals larger, heals and blocks in their own colour), hit sparks, a ~70 ms hit-stop on criticals, a red ground warning under a team before Vixar's blow, shield shards and a few pixels of shake on heavy blows. Rules: transforms and opacity only (no filters, shadows or per-frame layout reads), every effect is finite and counted against `LeaguePerformance.limit`, hit-stop and shake run only at the top effects level, nothing runs while paused, hidden or fast-forwarding. Light mode and reduced motion keep only the numbers, shown still. Presentation only: no damage, HP or timing is read or changed.

## Adding the saga art

Mr. Saymaz's pictures, the hug illustration and the merged-team pictures are not in this build yet. Each has a slot in **`public/assets/saga/manifest.json`**. A slot left as `null` keeps the built-in placeholder and downloads nothing.

| Slot | Where it appears | Suggested picture |
|---|---|---|
| `mrSaymaz.portrait` | the round ally portrait on the board after the Finale (a Freed class) | square, face and shoulders, 512 × 512 |
| `mrSaymaz.ready` | the Finale reveal | full figure on a transparent background, about 600 × 1000 |
| `mrSaymaz.proud` | the Finale, while the names are shown | same size as `ready` |
| `mrSaymaz.support`, `mrSaymaz.wave` | the Finale speech (the poses take turns line by line) | same size as `ready` |
| `mrSaymaz.bow` | the closing card | same size as `ready` |
| `hug` | the hug step: the four creatures hug Mr. Saymaz | wide illustration, about 1600 × 900 |
| `merged.slyffindor` | Act III: Gryffindor + Slytherin fused | square, transparent, 384 × 384 (like the team avatars) |
| `merged.huffleclaw` | Act III: Hufflepuff + Ravenclaw fused | square, transparent, 384 × 384 |

To add one: put the file in `public/assets/saga/` (PNG or WebP), write its file name in the slot (for example `"ready": "mr-saymaz-ready.webp"`), deploy and reload. A missing Mr. Saymaz pose falls back to `ready`; a picture that fails to load falls back to the placeholder. `node art/place-avatar.cjs avatar <source.png> <out.webp>` trims and centres a merged-team picture the way the team avatars are made (needs Sharp).

Until then: Mr. Saymaz appears as a softly lit silhouette, the hug step shows him with the four Level 12 creatures around him, and each fused pair shows its two Level 12 creatures together in the pair's colours.

In the fused fight, the two Level 12 creatures inside the fused fighter take their own attack, guard and hit poses together. Once a merged picture is added it replaces them as a still picture that moves with the raid's attacks. The pose controller already reserves the `slyffindor` and `huffleclaw` keys (team states, cache tag 11.0.0) for nine-pose sheets, if those are made later; showing them would also need a small change in `game.js`.

## Repacking

`art/pack-poses.cjs` and `art/extract-poses.cjs` pack pose sheets as described in the v10.5.0 guide; the Level 11, Level 12 and Vixar sheets were packed with them from the supplied art packs, with the same cell sizes and ground anchor (95% of the cell height).
