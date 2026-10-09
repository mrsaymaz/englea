# English League v8.2.0 — Next to invite

Each remote team card now shows three students with the fewest participation turns. The list includes students with zero turns, displays each count as 0×, 1×, etc., and uses stable roster order for ties. It is visible only on the teacher remote. Tap the usual + button and choose the student to award points.

The board remains the source of confirmed counts. Lists update after confirmed awards, Undo and class changes. Team Reset keeps the counts. A New Session clears them. Reconnecting receives the board's current participation data.

## Deployment

1. Deploy the complete updated package using your existing Netlify method, keeping its public folder, netlify folder and netlify.toml together.
2. Refresh both the board and phone. Check for Animated Evolution · v8.2.0 at startup.
3. Connect the remote and select your class. Each team card shows Next to invite.
4. Award a point through + and the student picker; the suggestions update once the board confirms it.

No Google Apps Script changes are required. All champion displays, constellation stars, Class Mission and wheel settings are preserved.

The corrected 5-A roster is included: Nog in Hufflepuff, Emobi Nese in Gryffindor. If upgrading from v8.1.0 or earlier, start a fresh 5-A session rather than resuming an old session, because saved student identities use roster positions. Sessions created in v8.1.1 have the corrected roster already.

## Phone layout and verification

- All four cards, 12 names and counts fit without scrolling at 393 × 660 CSS pixels, the iPhone 14 Pro portrait browser viewport used in the test.
- Full-screen 393 × 852 was checked with 59 pixels reserved at the top and 40 at the bottom.
- Every roster name fits the available row width. Scoring buttons remain at least 44 pixels high.
- Shorter or zoomed views scroll instead of clipping controls. Landscape uses four columns on sufficiently wide screens.
- Tests cover all classes, zero counts, contribution-count ordering, stable ties, live award sync, reset preservation, Undo and clearing on New Session.
- Existing participation, teamwork, Apps Script and wheel unit checks pass; all JavaScript syntax checks pass.

Layout was inspected using Chromium mobile emulation. Physical iPhone and Safari testing was not available. Browser zoom and text-size settings can change the available space.

Developer check: from tests, run npm run test:invite with Playwright and Chromium installed. Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH and PLAYWRIGHT_CHROMIUM_ARGS environment variables select an existing Chromium binary.
