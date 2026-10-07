# English League v10.5.1 — Living Creatures

The integrated tally system, Battle Arena, Island Run and Vixar fight now use action artwork based on the existing creatures. Start with **START-HERE-v10.5.1.md**. v10.5.1 keeps more pose sheets ready and sizes poses without measuring the page.

- Four teams × eleven levels (0–10), each with nine action poses.
- Ten island bosses, each with six encounter poses.
- Vixar has nine poses for its attacks, phases and finale.
- Results celebrate the champions first, then give tied teams an acknowledgement and the lowest-scoring teams encouragement. Contributor names remain in place.
- Open **public/creature-studio.html** to inspect the artwork locally without deploying.

The new art is used in Animated mode, which is the current board default, and in Island Run. Existing vector modes remain available as fallbacks. Original avatars remain the resting artwork and loading fallback.

**Upgrading from v10.4.3:** no Apps Script update, new Sheet columns, or new Netlify/Cloudflare environment variables. Keep your working `GOOGLE-APPS-SCRIPT-v10.4.0.gs` deployment. Deploy the whole project through your existing Netlify workflow, then reload both the board and phone so they use build 10.5.1.

This is a presentation update. Classroom participation, rosters, session saves, question pools, island progression, points, HP, shields, Secret Agent, wheels and Guardian rewards retain their existing rules.

## Verification

`npm run test:v105 --prefix tests` runs the dependency-free regression suite, the pose controller tests and the v10.5.1 checks. `npm run test:board --prefix tests` runs the browser (board + phone) suites, including `board-v1051.cjs`. Results and measurements: **TEST-REPORT-v10.5.1.md**. Optional artwork and native Canvas checks are described in `archive/TEST-REPORT-v10.5.0.md`.

See **NETLIFY-SETUP.md** for the existing deployment setup, **CREATURES-v10.5.0.md** for the action mapping and asset maintenance, and **CHANGELOG.md** for earlier releases. The previous README is preserved in `archive/README-v10.4.3.md`.
