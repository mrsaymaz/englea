# v9.3.0 verification

## Passed

- **Full regression suite** (`npm run test:v93` from `tests`): every v9.2 check still passes, including 240 + 400 scripted Island Run completions, all 4,240 question variants, passport merging, Apps Script, connection and tally checks.
- **Ten new v9.3 checks** (`island-v93.cjs`):
  - Review questions take slots 2 and 5, keep their concept and never duplicate a family; lookup prefers a fresh variant.
  - A missed answer returns once, reshuffled, for 50 points; correct answers and stars still count only the six questions (a test caught and fixed a 5/7 total).
  - Word Trail tiles always include the correct letter once; the boss boundary moves back by the trail length, and re-anchors after a late second chance.
  - Word Strike removes exactly 15% of the guard; one slip is allowed in Soft, none in Hard.
  - **160 full runs**: every grade and island, Soft and Hard, quick and extra reading pace, with listening and picture gates, a review question, a deliberate miss, its second chance and the Word Trail. All complete and spell the word.
  - Listening and picture gates are valid questions, keep the original answer lane and never offer lookalike drawings (moon/crescent, spoon/tablespoon…).
  - Answer log: review starts on a miss and ends after correct answers in two separate runs; second chances and spelling never change it; invalid rows are rejected; merging is duplicate-free.
  - Apps Script v9.3.0: answers append once on repeated saves, formula-like text is neutralised, the summary rebuilds, Load islands returns the rows, and an invalid row writes nothing.
  - The Netlify session function refuses to save answers to an older Apps Script instead of dropping them.
- **Remote layout in Chromium** (`next-to-invite.cjs`, which failed on v9.2.0 with "portrait scroll"): all five classes fit at 393 × 660 with no scrolling, 393 × 852 safe-area fit, every roster name fits, score targets ≥ 44 px, landscape reachable. Additional screenshots at 393 × 590 (Safari with toolbars expanded): no scrolling, two names per card at that height.
- **Board screenshots in Chromium**: listening gate, picture gate, answer feedback, Word Trail tiles and slots, Word Strike, Run settings with voice line and review list.

## Limits

Chromium only; no Safari/WebKit engine was available, and no physical iPhone or smartboard was used. Speech was simulated in screenshots; real voice quality and availability depend on the board's operating system. Older browser suites from v8.x (`students.cjs`, `verify.cjs`, `resilience.cjs`, `secret-agent.cjs`, `shield.cjs`) already failed on v9.2.0 because the Load islands dialog blocks their clicks; they were not updated in this release. No live Netlify site, Google Sheet, Apps Script deployment or Cloudflare account was changed.

## Reproduce

From `tests`: `npm run test:v93` (Node.js, no dependencies). The browser layout test needs Playwright with Chromium: `node next-to-invite.cjs`.
