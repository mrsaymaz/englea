# v9.0.1 connection verification

- Confirmed the supplied live `game.js` exactly matched the local v9.0.0 source before modification.
- Reproduced `message-too-big` using the exact JSON serializer in the shipped PeerJS bundle, with a realistic 23,388-byte snapshot containing all 120 students and their saved catalogue.
- Used the exact bundled binary serializer and reassembler to transmit that snapshot, a larger 500-student result summary with Turkish text, and small actions/receipts. Multi-packet reconstruction preserved the complete payload.
- Ran the production state handlers through that real serializer with full rosters: synchronization and acknowledgment completed; dropped state/receipt retries, stale receipt rejection, queued actions, version mismatch and timeouts passed.
- Tested TURN missing configuration, safe provider-status diagnostics for 401/403/404/429/500, successful temporary credential responses, and absence of long-lived tokens from returned diagnostics.
- Existing runner integration, result/remote hooks and latest-progress save-flow tests passed after the transport fix.

The previous synchronization harness used empty roster arrays and bypassed PeerJS serialization. It therefore missed the size rejection. The updated harness exercises both the full roster and the shipped serializer.

Limits: no live two-device WebRTC or physical iPhone/Safari test was completed here. Serialization and application synchronization are tested; live school-network routing remains a post-deployment check. Read-only HTTP checks found a separate Cloudflare credential-service failure; its underlying provider status was not exposed by the deployed v9.0.0 function. No live deployment or configuration change was made.
