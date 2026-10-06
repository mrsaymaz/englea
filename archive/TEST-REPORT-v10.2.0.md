# v10.2.0 verification

## Passed

**New `v102.cjs`** (no dependencies; the Apps Script runs in the in-memory spreadsheet harness).

*Who gets the halo:*
- The halo goes to every team that won neither title.
- A Grand Champion leaves the other three teams with a halo.
- A shared League title counts each tied team as a winner.
- If every team won something, nobody gets a halo; a first session has none, and a session never counts its own result.
- Each class has its own last session.

*Where the result comes from:*
- A result from Google Sheets is kept unless the board knows a later session; one from a later session played on another board replaces it.
- Invalid results are refused, and results are kept on the board for the next lesson.

*Scoring:*
- The halo doubles an award after every other bonus, so with the Double power-up it gives ×4.

*Apps Script v10.2.0:* Load islands returns the class's last saved session:
- League title holders and the Arena champion of the same session;
- a shared title;
- a later Arena-only save;
- rows saved before Session IDs existed;
- unaffected by other classes.

*Placement and wiring:*
- An anchor exists for all 44 Animated avatars, and for the Light avatar traits that raise the head.
- Wiring checks:
  - the halo is chosen with the class and fixed from the first award;
  - it is kept in the session checkpoint;
  - it is recorded when the Arena ends;
  - custom points are doubled, deductions never;
  - it is synced to the phone and from Sheets.

**New `board-v102.cjs`** (Chromium, board and phone).

- **The board records a class's result** when the Final Arena ends.
- **In the class's next session:**
  - the other teams wear the halo with "×2";
  - a halo team receives 2 × the award (20 for a 10-point award).
- **The halo stays fixed:** a later result does not change it after the first award, and a reload keeps it and still doubles.
- **The halo stays on the head** at every evolution level from 0 to 10 for each halo team, and on the Light avatars:
  - horizontally within 2% of the head centre, just above the head top;
  - inside the picture and clear of the team name.
- **From Google Sheets via the phone:** after the Teacher PIN, a board that never played 5-A shows the halo on Hufflepuff and Ravenclaw, and the phone marks them ×2.

**Other suites:**
- The full dependency-free suite (`npm run test:v102`) passes 127 checks.
- `npm run test:board` passes 27 of 27, twice in a row.
- `next-to-invite.cjs`, arena techniques, projectiles and HP, Unity reward visibility, the access gate and the Vixar finale pass.
- Two existing tests were adjusted for the new code:
  - `remote-sync.cjs` models the new halo variables;
  - `v101.cjs` accepts any v10.x version badge.

**Visual checks:**
- Contact sheets of all 44 Animated avatars with halos.
- Board screenshots at levels 0, 6 and 10 (Animated) and 4 and 10 (Light).
- The phone at 393 × 660 with the ×2 marks.

## Limits

- Chromium only. No Safari/WebKit, iPhone or smartboard was used.
- The Apps Script was tested against the in-memory spreadsheet harness, not a live Google Sheet.
- The halo's room-making shrink uses the CSS `scale` property (Chrome 104 and later). On older browsers, the halo can overlap the team name on avatars whose head is near the top of the picture.
- When the board and the Sheet disagree, the later session is chosen by its time. A board whose clock is far ahead could keep its own older result.

## Reproduce

From `tests`:

- `npm run test:v102` needs Node.js only, with no dependencies.
- `npm run test:board` and `node next-to-invite.cjs` need Playwright with Chromium.
