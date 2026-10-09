# Sharper Scarlet and Gilded Vixar poses (finished sources)

These 18 pictures are the finished transparent sources: 1254 × 1254 renders with 80 px empty padding on each edge (1414 × 1414 files). The padding is not upscaling. Both runtime sheets are already packed and enabled.

| File | Pose |
|---|---|
| `vixar-scarlet-ready.png`, `vixar-gilded-ready.png` | standing ready, facing forward |
| `…-charge.png` | gathering power |
| `…-cast.png` | casting a spell |
| `…-guard.png` | shielding itself |
| `…-exposed.png` | staggered, open to attack |
| `…-hit.png` | recoiling from a hit |
| `…-ultimate.png` | unleashing its strongest attack |
| `…-defeat.png` | collapsing, defeated |
| `…-proud.png` | triumphant |

Each picture: about 1254 × 1254 (at least 1000 × 1000), a transparent background, the same creature and framing as `public/assets/animated/vixar-scarlet.webp` or `vixar-gilded.webp`.

When all nine of a form are in place, run (needs Node and `npm install sharp`):

```
node art/pack-vixar-poses.cjs scarlet --check   # lists what is missing or still a placeholder
node art/pack-vixar-poses.cjs scarlet           # packs public/assets/poses/vixar-scarlet.webp and switches its poses on
```

The same for `gilded`. Packing also rebuilds the matching idle picture in `public/assets/animated/`. Repack after editing any source.
