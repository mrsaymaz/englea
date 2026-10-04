# English League v6.6

- Animated Unity Ascension uses four complete, transparent component images: torso/arms/legs, head/mane, tail, and paired wings. Natural feather, fur and armour edges replace the old clipped image sections.
- Components appear in that order at 4.2, 5.5, 6.8 and 8.1 seconds. The three existing level rewards remain at 10.1, 11.8 and 13.5 seconds.
- Four team spirits sit around the Guardian so their coloured streams stay visible.
- The same assembled Guardian performs the raid finisher. There is no swap back to the old single illustration.
- Animated and Light raids now show team lunges, VIXAR attacks, small coloured bolts, block rings, static shield outlines, and brief hit reactions. Effects use transforms and opacity, with one motion per character and at most 12 temporary effect elements.
- New combat effects stop on raid exit, completion, page hiding, or enabling reduced motion. They do not calculate damage or alter combat timers.
- The VIXAR combat display keeps names, HP, four seal indicators, the timer and Knocked Out labels. Explanatory narration, phase prose and extra team statistics are hidden. Result explanations remain available after combat.
- Light and Performance retain their earlier Guardian artwork. The four-part redesign is exclusive to Animated.
- Skipping Unity clears its pending visual timers and grants remaining rewards once.

This release retains the previous crown-position and VIXAR-curtain fixes. Netlify functions, TURN configuration and Sheets logging are unchanged.
