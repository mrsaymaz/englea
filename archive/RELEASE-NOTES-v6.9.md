# v6.9 — reliable wheel queue and cleaner champions

## Subject Wheel queue

- Automatic milestone wheels now have one owner from start through result display and queue advance.
- The next team's wheel waits until the current result has settled and the modal has closed.
- Closing an automatic wheel early settles that spin once and continues the queue instead of leaving a hidden or permanent spinning state.
- Duplicate queue entries for the same team and milestone are ignored.
- Ravenclaw's wheel bonus is awarded exactly once per completed result.
- Light and Animated retain their short wheel timing; Performance retains the longer presentation.
- Manual wheel use still leaves the selected result open until the teacher closes it.

The fix also prevents the Animated presentation pump from repeatedly scheduling itself while an automatic wheel owns the screen.

## Final result screen

- The Arena Champion remains the main, larger avatar.
- The League Champion is now shown at exactly half the Arena avatar's rendered width and height.
- League ties display the tied team avatars together at the same half size.
- If one team wins the League and the Arena, the two awards merge into one **Grand Champion** presentation.
- HP, remaining health, damage, critical-hit, and similar explanatory statistics are not shown on the classroom result screen.
- The layout is self-contained and responsive at both smartboard and iPhone-sized viewports.

## Preserved scope

The scoring rules, team artwork, opening screen, scoreboard, remote controller, Performance/Animated/Light modes, VIXAR raid, Unity Guardian, Soft 1-step default, Google Sheets submission code, Netlify TURN function, and Netlify configuration are unchanged by this release.
