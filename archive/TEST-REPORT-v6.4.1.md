# v6.4.1 targeted verification

The two reported issues were reproduced in v6.4 before editing:

- Vixar's curtain remained displayed at opacity 1 with animation disabled after combat began in Light.
- The champion crown overlapped the result avatar's bounds.

The patch was checked in Chromium:

- Crown and avatar bounds have a 16px gap and the same horizontal center, with no crown animation.
- Every team was checked at levels 0 and 10 in Animated and Light at 1920×1080, 1366×768, 1024×600 and 390×844 (64 combinations).
- The crown does not overlap the result heading on short layouts.
- Vixar's boss and all four fighters are visible while the raid runs in Animated and Light. The curtain remains hidden on retry, and exiting clears scheduled raid tasks.
- Performance's intro is dismissed even when its CSS animation is deliberately disabled; reduced motion skips it.
- The JavaScript syntax and ZIP contents are checked before delivery.

The TURN function, connection code, scoring/battle calculations and Google Sheets code were not modified by this patch. The v6.4 integration checks are documented separately in TEST-REPORT-v6.4.md. Real smartboard performance and FATİH connectivity still depend on the deployed environment.
