# The Vixar Saga — art revision 11.0.0-art1

This update fills the art placeholders in the supplied v11.0.0 project and enables the new boss poses.

## Try the artwork without deploying

Unzip the project and open **ART-PREVIEW.html**. Choose the reunion, Mr. Saymaz, Scarlet Vixar or Gilded Vixar. The boss buttons show all nine individual poses. The transparency toggle helps inspect their edges. This page works offline and does not access class records.

For the actual fights and Finale, use **vixar-preview.html** on your deployed site. It retains the normal board access screen and uses disposable preview data.

## Included artwork

| Asset | Editable source | Game file |
|---|---|---|
| Mr. Saymaz kneeling with open arms | `art/saga/mr-saymaz-kneel.png`, 1024 × 1792, alpha | `public/assets/saga/mr-saymaz-kneel.webp` |
| Sunrise reunion with all four Level 0 creatures | `art/saga/hug.png`, 1672 × 941 | `public/assets/saga/hug.webp` |
| Scarlet Vixar, nine poses | `art/vixar-poses/vixar-scarlet-*.png` | `public/assets/poses/vixar-scarlet.webp` |
| Gilded Vixar, nine poses | `art/vixar-poses/vixar-gilded-*.png` | `public/assets/poses/vixar-gilded.webp` |

Boss sources contain native 1254 × 1254 renders with 80 pixels of transparent padding on each edge: 1414 × 1414 files. They were redrawn from the references, not produced by enlarging the low-resolution placeholders. Each runtime atlas is 1920 × 1920, with 640-pixel cells in the existing order: **ready, charge, cast, guard, exposed, hit, ultimate, defeat, proud**. Generation prompts are preserved in `art/ART-PROMPTS.json`.

The kneeling pose retains the white polo, dark grey pleated trousers, black shoes and watch. Its full canvas shares the standing poses' ground anchor. The hug places all five faces below the title area, with quiet violet sky above and golden sunrise behind the hills.

## Presentation changes

- Scarlet and Gilded pose sheets are enabled. Each has distinct charging, casting, shielding, exposed, recoil, ultimate, defeat and proud silhouettes.
- Idle boss pictures are rebuilt at the same scale and anchor as their ready atlas cells. This prevents size jumps after actions.
- Knockout now selects **defeat** for all three Vixar forms.
- The Finale checks artwork availability when it needs the image and waits for a slow hug download. Continuing straight to the closing card also requests the illustration.
- Closing-title size now considers screen height as well as width. The hug illustration reserves its upper area for those words.
- Updated art URLs have a new cache tag; unchanged art keeps its existing tag.
- The game uses compressed WebP assets. Individual PNGs remain outside the published `public/` folder.

The class data, roster, scores, progression, remote connection configuration and Apps Script are unchanged. **No Apps Script update or new environment variable is needed for this art revision.** Deploy the project through your existing process; `netlify.toml` still publishes `public/`.

## Rebuilding the boss atlases

With Node and the `sharp` package available:

```sh
node art/pack-vixar-poses.cjs scarlet
node art/pack-vixar-poses.cjs gilded
```

The packer rebuilds both the atlas and matching idle picture, updates atlas hashes and enables the form's poses.

## Verification

See **ART-TEST-REPORT.md** for checks run on this revision and the browser-testing limitation.
