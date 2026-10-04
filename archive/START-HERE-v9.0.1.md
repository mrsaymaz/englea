# v9.0.1 — repair the reconnect / repeated approval loop

## What was wrong

Version 9.0.0 used PeerJS's JSON connection format. The bundled library rejects an individual JSON message of 16,300 bytes or more. A lesson snapshot containing both the 120-student roster and saved roster catalogue already exceeds 23 KB. Sending it raises `message-too-big`, which the app treated as a failed connection. The phone reconnects, and the board asks for approval again.

This release uses PeerJS's existing binary format. The library splits large messages into smaller packets and reconstructs the original message before applying it. Student names, session information, participation and saved progress are retained. Small commands and receipts use the same connection. No pairing security checks are removed.

## One deployment, after checking the settings

1. On the new Netlify site, open **Project configuration → Environment variables**.
2. Confirm `CLOUDFLARE_TURN_KEY_ID` and `CLOUDFLARE_TURN_KEY_API_TOKEN` are a matching pair from the same active **Cloudflare Realtime TURN key**. The TURN Key API Token is the secret issued for that TURN key. A Cloudflare Account ID or a general account API token is not a substitute.
3. If uncertain, create a new TURN key in your existing Cloudflare account and copy both values into Netlify. Keep the old key active if the old site still uses it. Ensure the variables apply to the production deployment and Functions (All scopes works).
4. Replace the project files with this ZIP and deploy once, including `public`, `netlify/functions` and `netlify.toml`.
5. Close other tally tabs on both devices, then open the same new site address. Confirm **v9.0.1** on both opening screens.
6. Start a new room and approve the phone. Choose a class and award one student point to verify both synchronization and commands.

When upgrading from v9.0.0, **do not redeploy or modify Apps Script for this fix**. The included `GOOGLE-APPS-SCRIPT-v9.0.0.gs` remains the current complete backend. If you have never installed that script, follow `START-HERE-v9.0.0.md` for the original Version 9 setup.

## Cloudflare check observed on 4 October 2026

A read-only check of the supplied site, `https://mrsaymaz.netlify.app`, confirmed its JavaScript matched v9.0.0. Its `/api/turn-credentials` endpoint returned HTTP 502 with:

`The TURN provider did not issue credentials.`

That means the function reached a non-success response from Cloudflare. The old response does not reveal whether the cause was an invalid/revoked key, mismatched token, account problem, or provider failure. It does not prove which value is incorrect. Both variables were present from the function's perspective; an absent value would produce a different 503 response.

The corrected function exposes only the provider's status and a setup message:

| Provider response | Check |
|---|---|
| 401 or 403 | Active matching TURN Key ID and TURN Key API Token; account permissions |
| 404 | Correct existing TURN Key ID |
| 429 or 5xx | Provider/account limits or temporary service failure |

The endpoint's successful response contains `iceServers` and temporary credentials. Do not post credential values in screenshots; report only the error/status. A successful credential response confirms credential generation, not end-to-end connectivity through the school network.

No Google Sheets change is needed to repair pairing. No live Netlify, Cloudflare settings, or Google Sheet was changed while preparing this package.
