# v7.1.4 verification

The automated browser suite checks:

- contribution-count ranking even when a lower-frequency student earned more points;
- singular and plural counts in the student picker;
- count-based champion displays and final snapshot metric;
- the phone-only end-of-session participation summary;
- absence of student point totals from that summary;
- reset preservation, Undo, reload/recovery and remote retry deduplication;
- all 119 roster entries and grade-based point defaults;
- existing Arena, VIXAR, wheel, mission, visual-mode and official-record behavior;
- the unchanged Google Apps Script count-based leader columns.

The test transport uses local browser pages rather than a live PeerJS/TURN connection. After deploying, perform the short real-device check in `UPDATE-v7.1.4.md`.
