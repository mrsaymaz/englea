# v8.1.0 verification

Passed production-renderer checks for all four team avatars; top-three selection by participation count rather than points; deterministic ordering and shared ranks on ties; empty teams; and removal of stale names between renders.

Passed existing teamwork, mission, roster, Apps Script, wheel and JavaScript syntax checks. The Level display check now verifies top-right positioning and removal of the track and denominator. The archive passed its integrity check.

The browser suite includes all-team recognition assertions, but Chromium remains unavailable in this environment. Visual layout, touch behavior and real-device networking have not been verified here. Follow `UPDATE-v8.1.0.md` for the short classroom check.
