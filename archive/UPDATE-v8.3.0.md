# English League v8.3.0 — Secret Agent

## Update

Deploy the complete package using your existing Netlify method, retaining public, netlify and netlify.toml. Refresh both the smartboard and phone. Check for Animated Evolution · v8.3.0 at startup. No Google Apps Script update is required.

## Use Secret Agent

1. Connect the remote and choose the class.
2. Tap the hat-and-glasses icon on the receiving team's card, beside the existing board power-ups. The same icon is also available beside Reset on each remote card.
3. A private remote picker lists the other three teams' students, grouped by team. Select the agent. Already assigned students are disabled. Closing the picker cancels the pending selection without consuming the power-up.
4. The icon turns gold. The board does not show the agent's name. Teach and award points as usual.
5. To reveal early, tap that team's remote icon and then Reveal Agent. Otherwise, Finish Session reveals all active agents before calculating the final standings and starting the battle.
6. The board shows each agent, both team avatars and the transferred amount. Press Continue on the board or remote when ready. There is no countdown or automatic dismissal.

## Scoring rules

- Transfer the student's entire actual earned point total for this session through the reveal, including awards before selection, combos and bonuses already applied.
- Subtract that full amount from the original team and add it to the receiving team. **Do not cap the transfer at the team's balance. Negative scores are intentional, even after a reset.** For example, a student earned 1,250 points, the team was reset to zero, and the reveal leaves it at −1,250 while the receiving team gains 1,250.
- Shield does not block Secret Agent. Double/Half Points affect the original awards, not the transfer a second time.
- Levels, evolution progress, contributions, constellation stars and Class Mission progress do not change.
- Each team can select one agent per session. The same student cannot be used by another team, even after an early reveal. A selected agent is locked in; use Undo to correct a mistaken selection.
- Team Reset preserves agents and student totals. New Session clears them. Class changes require a new session once an agent has been chosen.
- Early reveal completes the power-up. Future awards go normally to the original team. Multiple agents settle together from recorded student totals; incoming transfers never become student earnings.
- Assignments and transfers participate in Undo. Checkpoints preserve an open reveal, its finish-session intent and already-transferred scores. Reconnecting or refreshing does not repeat the transfer.

## Verification

Passed browser checks for private selection, correct opposing rosters, duplicate-target prevention, class lock, bonus totals, Shield bypass, negative scores after reset, unchanged levels and participation, lost receipts, Undo, early reveals, recovery during a reveal and during Finish Session, and correct final records.

Four simultaneous reciprocal transfers were tested, including a zero net balance, and all four reveal panels fit at 1366 × 768. The board power-up icons do not overlap Level badges at 1366 or 1024 pixels wide. All four remote cards still fit at 393 × 660 (iPhone 14 Pro portrait emulation), with 44-pixel scoring buttons. Existing participation, teamwork, Apps Script and wheel checks and JavaScript syntax checks pass.

Testing used Chromium browser emulation. Physical iPhone/Safari validation was not available. The student picker scrolls to show the full class list while keeping its close button available.

Developer tests: from tests, run npm run test:agent and npm run test:invite after installing Playwright and its browser. Existing Chromium binaries can be selected with PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH and PLAYWRIGHT_CHROMIUM_ARGS.

The corrected 5-A roster is included: Nisa in Hufflepuff, Elif Naz in Gryffindor. If updating from v8.1.0 or earlier, start a fresh 5-A session; older saved records use the previous roster positions.
