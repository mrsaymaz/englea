# v6.7 verification

Verified in local headless Chromium on 26 September 2026.

Passed: 12 scenario groups plus focused effect/lock checks.

- Directed approach and visible transforms in Animated, Light and Performance modes.
- Own seal targeting, assistance on remaining seals, and boss HP protection until every seal is broken.
- Distinct boss-core targeting after seals disappear, shield reactions and approximately 0.50 Guardian/VIXAR fitted-height ratio.
- One final attack at 420/4200 HP, including bypass of temporary shields/invulnerability for the scripted knockout.
- Four knocked-out teams at 0 HP; four distinct team-color summon beams.
- Guardian final strike sets boss HP to zero and restores all four teams to maximum raid HP.
- Uncompleted Class Mission results in defeat without a Guardian.
- Closing during the cinematic cancels callbacks; retry starts clean.
- Reduced motion suppresses optional effects while maintaining the same game-state outcome.
- No horizontal overflow at 1024×600 or 390×844.
- Existing Class Mission grants three levels once.
- All 44 team sprites decode at 384×384; no missing local resources.
- A real-time raid with four Level-10 teams and a completed Class Mission finished in victory without forcing boss damage.
- Effect stress check never exceeded 12 live temporary nodes; Light/Animated boss casts remained visible; Level-8 seals stayed locked.
- No uncaught browser errors in the scenarios.
- JavaScript parsed successfully after final edits.
- Netlify configuration and TURN function are byte-identical to v6.6.
- Remote/TURN/Google Sheets integration block is unchanged.

Scope: browser verification was local. No live Google Sheets write, live Netlify deployment, FATIH-network connection or measurement on the school's physical hardware was performed. Short transform/opacity animations and bounded effects reduce load; this is not a guarantee of a particular FPS on every smartboard.

