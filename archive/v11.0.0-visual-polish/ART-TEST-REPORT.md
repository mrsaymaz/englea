# Art revision verification — 11.0.0-art1

Checks performed on this revision:

| Check | Result |
|---|---|
| `node tests/v11.cjs` | Passed: 17 Saga rule, persistence, art and wiring groups |
| `node tests/creature-poses.cjs` | Passed: 11 pose lifecycle and state-mapping groups |
| `node tests/art-upgrade.cjs` (requires `sharp`) | Passed: five asset, atlas, loading and preview check groups |
| Both `pack-vixar-poses.cjs ... --check` commands | All nine sources per form accepted |
| Changed gameplay/presentation JavaScript syntax | Passed |
| Individual generated art and packed sheets | Visually inspected |

Asset checks confirm 18 separate 1414 × 1414 PNG files with real transparency and non-empty figures; the 1024 × 1792 kneeling master; the 1672 × 941 hug; both 1920 × 1920 atlases; manifest hashes; and matching idle/ready anchors. The source files preserve their native rendered resolution within transparent padding.

The asynchronous Finale checks use a controlled image loader. They cover an image arriving late, going directly to the closing step, the still-mode presentation path, failed and undersized images, scene cancellation, and duplicate display requests. The preview's embedded script parses successfully and its literal image links resolve.

**Browser limitation:** full browser playback and screen screenshots were not verified in this environment. Chromium was unavailable, and its download failed. The existing browser suites remain included for running on a machine with Playwright/Chromium installed. The new offline `ART-PREVIEW.html` offers a quick local artwork review; the deployed `vixar-preview.html` opens the real fights and Finale.

The original project's older test reports are retained as historical documentation; they are not evidence of new browser testing on this art revision.
