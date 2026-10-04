# v6.4 verification

Checked in headless Chromium on 25 September 2026, against the packaged code and its actual UI event handlers.

- Light retains the SVG avatars and makes no requests for Animated image assets.
- All 44 transparent WebP assets decode at 384 × 384 pixels.
- Mode changes preserve scores and levels. Stored preferences accept all three modes.
- Soft and Hard progression, rapid awards, Undo, Reset Team and Switch work with the new presentation.
- Levels 3, 5, 7 and 10 show their in-card effects, reveal the correct form and release their animation handles. The same check passed with a simulated 4× CPU slowdown.
- Reduced motion bypasses the new chest effects.
- Unity's four streams and Guardian assembly remain visible. Its three separate reward waves advance real levels, at least one second apart. A Remote point award during Unity waits before evolving and does not consume a planned Unity trait.
- A complete Arena simulation reaches the winner screen with damage and knockout states. HP-only panels, Knocked Out labels, level scaling and shared combat attributes were checked.
- Mode requests during a battle/result screen wait and apply for the next session.
- Finish waits for an earned Subject Wheel and its Ravenclaw relic bonus before capturing the final leaderboard.
- Remote mode actions and final-result/acknowledgment messages use the existing message handlers.
- At 390 and 320 pixels wide, the phone's four team cards, mode buttons and session control stay inside an 844-pixel-high viewport.
- The mobile Google Sheets request includes final points, levels, Class Mission status, Arena winner, HP and damage. The request was intercepted with a test response; no live row was written.
- The existing TURN function, Netlify configuration, PeerJS bundle and base stylesheet are byte-for-byte unchanged from v6.3. The Google Apps Script endpoint is retained.
- No uncaught JavaScript errors were reported in the browser checks. The release JavaScript parses successfully.

These checks do not reproduce a specific Pardus smartboard GPU, FATİH firewall or the live Google Apps Script service. Use the short deployed-site check in UPDATE-v6.4.md before a lesson.
