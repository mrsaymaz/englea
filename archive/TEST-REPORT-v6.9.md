# v6.9 verification

Local Chromium verification completed on 27 September 2026.

## Passed scenarios

- Three queued automatic wheels complete in order in Light, Animated, and Performance modes.
- After each queue, the pending queue, active owner, spin timer, advance timer, and wheel modal are all cleared.
- Closing the first of two automatic wheels early settles it once, proceeds to the next wheel, and leaves no stuck state.
- Two Ravenclaw automatic results apply exactly two 10% bonuses, confirming that the early-close path does not duplicate a reward.
- A manually opened wheel reveals one result and remains open until the teacher closes it.
- A separate Arena and League winner renders one large Arena avatar and one League avatar at exactly 50% width.
- One team winning both titles renders a single Grand Champion presentation.
- A two-team League tie renders both half-size League avatars.
- Result layouts at 1024×600 and 390×844 show no horizontal overflow.
- The visible result details contain no HP, remaining health, damage, critical-hit, or combat-stat text.
- All packaged JavaScript parses successfully.

## Preserved integration checks

The Google Sheets submission section, Netlify TURN function, `netlify.toml`, packaged avatar artwork, and PeerJS vendor file were compared with the previous preserved release source. No changes are required to Google Apps Script, Cloudflare TURN credentials, or Netlify environment variables.

## Verification limits

Tests ran locally. No live Google Sheets write, Netlify deployment, FATIH-network relay connection, physical Pardus smartboard, or actual iPhone test was performed. Classroom use remains the final device-and-network check.
