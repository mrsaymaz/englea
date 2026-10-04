# English League v8.6.1 — Visible threefold Unity reward

The Guardian again visibly grants three consecutive level upgrades to all eligible teams. After assembly, team cards return, each spirit avatar evolves with each real award, and large level labels show the new level. The heading follows Ascension 1 of 3, 2 of 3 and 3 of 3. Top captions and the underlying board remain hidden during assembly only.

The duplicate lower Skip button is hidden during the rewards so it cannot cover Ravenclaw's label. Top Pause, Skip and Exit controls remain available.

The existing reward calculation remains unchanged: one level per wave, up to Level 10. Replaying the celebration does not award more levels. Skipping still applies outstanding earned rewards exactly once. The Vixar projectiles, double-claw finale, 10% knockout and mission requirement remain included.

Verification: browser-tested real-time Level 3 → 4 → 5 → 6 progression for all four teams, all three visible reward badges and headings, assembly/reward visibility, cleanup afterward, replay without duplicate awards, and the Level 10 cap. Screens reviewed at 1366 × 768. Test: `node tests/unity-reward-visibility.cjs` with Playwright/Chromium available.

Deploy the complete project through your existing Netlify Git deployment or Netlify CLI, then refresh both board and remote. Confirm the v8.6.1 opening badge. No Apps Script or Google Sheet changes are needed. Earlier release documents describe their respective versions.
