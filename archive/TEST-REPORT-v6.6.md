# v6.6 targeted verification

Seven browser check groups passed with no uncaught page errors and no missing local assets.

1. Four independent Guardian parts appeared in body → head → tail → wings order. Starting at level 7, the teams received level 8, then 9, then 10 during the real timed sequence.
2. Skipping awarded remaining levels once. Replaying awarded no duplicate levels.
3. Animated raid: all four teams' actual attack actions produced visible transforms; VIXAR attacks, blocks, hit reactions, shields, HP and Knocked Out labels worked. Exit removed pending motions and raid timers.
4. Light raid: the same action and cleanup checks passed with its existing SVG characters.
5. The four-part Guardian appeared with four coloured streams in the raid finisher. The final strike removed the protected 420 HP and displayed victory.
6. Reduced-motion settings suppressed optional raid effects. Visual load was bounded to one motion per character and no more than 12 temporary effect elements, including an 80-effect stress request.
7. Raid layouts fit 1024 × 600 and 390 × 844 viewports. Performance mode continued to use its earlier SVG characters.

The assembly and combat scenes were visually inspected at 1366 × 768. Inline application JavaScript and both external game scripts passed syntax checks. Netlify configuration and functions were byte-for-byte unchanged from v6.5.

These are browser checks, not measurements on the school's hardware. No live Google Sheets submission or FATIH network connection was performed during this update.
