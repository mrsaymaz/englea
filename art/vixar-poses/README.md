# Sharper Scarlet and Gilded Vixar poses (placeholders)

The 18 pictures in this folder are labelled placeholders, half size (627 × 627). Each one names the file it stands for, the pose and the final size. Replace them with the real pictures under the same names:

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

The same for `gilded`. Until a form is packed, it fights as its full picture (no poses), as it does now.
