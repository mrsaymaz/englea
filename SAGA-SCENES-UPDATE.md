# Vixar Saga · Painted worlds · 11.0.0-scenes1

Built on the four updated v11.0.0 archives supplied by the teacher. This is a presentation revision; the application remains v11.0.0.

## What changed

| Scene | New artwork and staging |
|---|---|
| Act I · Violet | The Rift Court: silver-edged arches, floating violet crystals and a distant astral landscape. |
| Act II · Scarlet | The same court transformed into an ember forge: heated obsidian, molten falls in the distance and drifting cinders. |
| Act III · Gilded | Gold over platinum; outer cage ribs and chained islands suggest the beautiful prison surrounding Vixar. |
| Finale | The prison restores into dawn: cage and chains vanish, distant greenery returns, and the same floor and arches remain. This dawn stays behind the reveal, speech, Level 0 reunion and transparent hug. |

The approved creatures, all existing pose sheets, Mr. Saymaz's illustrated green-eyed identity, gown reveal and hug are unchanged. There are no new labels during attacks. Small orbital, burst and diamond casting seals distinguish Violet, Scarlet and Gilded respectively. One seal is emitted per volley, with capacity reserved for projectiles and impacts. The projectile arrival remains 420 ms.

Painted scenes replace the old geometric scenery only after decoding succeeds. The Finale commits prison and dawn together while still in the opening crack scene; slow or failed artwork keeps the existing fallback throughout that replay, avoiding a mid-reveal background switch. The arena discards detached download callbacks. Foreground shading keeps creatures and HUD readable; the background never receives per-frame movement or filters.

Four WebPs, each 1672 × 941, total 1,080,972 bytes. Only the selected fight background loads; the Finale loads its two matching backgrounds. Original high-resolution generation outputs are separate from this lightweight deployable package.

## Try before deploying

Extract all four ZIPs and merge their `english-league-v11.0.0` folders. Every part is required.

- Open **BATTLE-MOTION-PREVIEW.html** for the three painted battle environments and the real presentation functions for casting, projectiles, guarding and recoil. This is an art/motion rehearsal, not a scored fight.
- Open **FINALE-PREVIEW.html** for the complete production Finale choreography. Allow the opening crack scene a moment for both backgrounds to load before pressing Continue.
- On the hosted build, **public/vixar-preview.html** (the site's `/vixar-preview.html`) launches the actual three fights or Finale with preview data. Its existing access check remains in place.

No additional Apps Script update or environment variables are needed for scenes1. Keep the deployment configuration from the supplied v11.0.0 build.

## Verification for this revision

42 deterministic test groups passed: saga-worlds (5), vixar-motion (6), finale-integration (9), visual-integrity (5), v11 (17). They cover image loading failures and replay races, projectile timing and damage resolution, pause/skip cleanup, Level 0 display transformations without changing earned data, transparency, local asset links and saga progression/persistence rules.

The four generated environments were visually inspected. Browser playback, frame-rate measurements and physical smart-board/iPhone testing were not performed for scenes1 in this environment. The browser measurements in TEST-REPORT-v11.0.0.md belong to the supplied Claude-reviewed build, not these new changes.

Prompt specifications and asset provenance: art/saga/WORLDS-PROMPTS.md. Generation used the built-in image tool; runtime conversion uses WebP with quality 83.
