# English League v8.6.0 — Vixar and Unity Guardian

## Changed

- Vixar uses five small SVG projectile silhouettes: a void spear, crown shard, ringed gravity orb, crescent blade and linked chain. Its final blast sends enlarged orbs to all four teams. No attack names appear on the battlefield.
- The Unity Guardian launches a golden star, then makes two separate broad, three-talon claw swipes across Vixar. The first leaves the protected 10% HP intact; the second defeats Vixar. All four teams are then restored.
- Legendary Last Stand, Overdrive and the single overtime extension now depend on all four teams being Level 10, independently of Class Mission completion. Previously those safeguards required the completed mission, although ordinary boss damage itself already allowed a broken-seal party to hit Vixar.
- Once every seal breaks, all four teams can reduce Vixar to 420/4200 HP. Its final blast then knocks out all four teams, bypassing shields and last-stand protection. Completing the Class Mission earns the Guardian rescue. Without the mission, the finale ends in defeat at 10% boss HP.
- Teams below Level 10 retain their locked seals. The Class Mission still requires 15 unique contributors.
- Guardian assembly hides its top caption block and the underlying board. Teacher Pause, Skip and Exit controls remain available.

New effects use a single SVG wrapper per projectile or claw, animated with finite transform/opacity keyframes. They share the existing effect budget and pause/exit cleanup. Reduced-motion and Skip still execute the correct game outcome without the transient effects. Ordinary Vixar projectile damage now lands after 420 ms of travel; its final knockout lands when the four 420 ms blast projectiles arrive.

## Verification

- 24 seeded, complete production raids: all Level 10, mission complete/incomplete, three score totals and four random seeds. In every run all seals broke, every team dealt boss damage, and the 10% blast occurred. All completed missions won; all incomplete missions lost after the blast.
- Level 9 control: locked seals, no Guardian victory. Direct damage check: seals block boss damage; broken seals permit damage without a completed mission.
- Browser checks: all six projectile silhouettes (five boss plus Guardian), separate claw timing and HP transition, four-team knockout/restoration, no top assembly captions, reduced-motion finale, pause/exit cleanup.
- Existing 200–250 HP and elemental-projectile tests passed, including all 12 team projectile variants and defenses in Vixar. Arena balance unit checks passed. The competitive arena code is byte-for-byte unchanged from v8.5.1; its balance report remains historical and was not rerun as a new statistical study.
- Visual review at 1366 × 768 in Chromium. A physical classroom smartboard was not available for testing.

Developer check: run `node tests/vixar-finale.cjs` with Playwright/Chromium available. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and `PLAYWRIGHT_CHROMIUM_ARGS` can select an installed Chromium. Test hooks are injected by the local test server only and are not shipped in production JavaScript.

## Deploy

Deploy this complete project using your existing Netlify Git deployment or Netlify CLI so both the static site and the included server functions are deployed. Keep your existing TURN environment settings. Refresh the board and remote afterward and confirm the v8.6.0 opening badge. No Google Apps Script or Sheet layout update is needed.

The previous student records, participation rules, Secret Agent, Shield, security screen, points-to-HP formula and competitive arena balance remain included. Earlier release documents describe their respective versions.
