# English League v6.6 — Netlify + Secure Remote Setup

**Already using Netlify? Follow `UPDATE-v6.6.md` for the short update procedure. Keep your existing Cloudflare variables.**

This package keeps the scoreboard on Netlify and adds a short-lived Cloudflare TURN connection for restrictive networks such as a school network communicating with a phone on mobile data.

Your Google Sheets address and save format are already included in `public/index.html`. The TURN service only changes how the phone and smartboard communicate; it does not replace Google Sheets.

## What is inside the package?

- `public/index.html` — the scoreboard entry page.
- `public/animated-mode.js` and `public/animated-mode.css` — Animated rendering and controls.
- `public/assets/animated/` — the 44 optimized team forms.
- `public/styles.css` — the precompiled interface styles (do not delete).
- `public/vendor/peerjs.min.js` — the local remote-control connection library (do not delete).
- `netlify/functions/turn-credentials.mjs` — securely requests temporary TURN credentials.
- `netlify.toml` — tells Netlify where the website and Function are located.

## Part 1 — Create the Cloudflare TURN key

1. Sign in to Cloudflare or create a free Cloudflare account.
2. In the Cloudflare dashboard, open **Realtime** and then **TURN**.
3. Choose **Create TURN key**.
4. Give it a name such as `English League Smartboard`.
5. Copy and temporarily save both values shown by Cloudflare:
   - the **TURN Key ID**;
   - the **TURN Key API Token**.

Keep the API token private. Do not paste it into `index.html`, send it to students, or publish it on GitHub.

## Part 2 — Add the two secret values to Netlify

1. Sign in to Netlify and open your existing scoreboard site.
2. Open **Project configuration** → **Environment variables**.
3. Add this variable:

   - Key: `CLOUDFLARE_TURN_KEY_ID`
   - Value: your Cloudflare TURN Key ID

4. Add a second variable:

   - Key: `CLOUDFLARE_TURN_KEY_API_TOKEN`
   - Value: your Cloudflare TURN Key API Token

5. If Netlify offers a “secret” or “sensitive value” option, enable it for the API token.
6. If Netlify asks for a scope, choose **Functions** or **All scopes**.

## Part 3 — Deploy through GitHub (no Terminal required)

1. Extract this ZIP package.
2. Open the GitHub repository already connected to your Netlify site.
3. Upload the **contents** of the extracted `english-league-v6-4-1-netlify` folder to the repository root. Keep this exact structure:

   - `netlify.toml`
   - `netlify/functions/turn-credentials.mjs`
   - `public/index.html`
   - `public/styles.css`
   - `public/vendor/peerjs.min.js`

4. Commit the files to the branch Netlify deploys (usually `main`).
5. Open Netlify → **Deploys**. Wait for the new production deploy to say **Published**.
6. In **Project configuration → Build & deploy**, confirm the publish directory is `public`. `netlify.toml` normally sets this automatically.
7. Open your site in a private/incognito tab. The startup screen should show **Animated Evolution · v6.6**.

Upload the full package: v6.6 needs `raid-motion.js`, both `animated-mode` files, `styles.css`, `assets/animated`, `vendor`, and the Netlify Function alongside `public/index.html`.

## Part 4 — Confirm that TURN is configured

Open this address in your browser, replacing the example domain with your own:

```text
https://YOUR-SITE.netlify.app/api/turn-credentials
```

Correct result: a JSON page containing `iceServers` and temporary `turn:` / `turns:` addresses.

If you see `TURN is not configured`, recheck the two Netlify environment-variable names and deploy again.

## Part 5 — Classroom test

1. Keep the smartboard connected to the FATİH network.
2. Keep the phone on mobile data.
3. On the board, choose Performance, Animated or Light and select **Start New Session**.
4. The board should report **Room ready — TURN relay available**.
5. Enter the four-character room code on the phone.
6. Select **ALLOW** on the board.
7. Wait until both devices show a green **Connected** status.
8. Add and subtract points from the phone.
9. Finish the session on the board.
10. Confirm both messages:
    - Board: **Final results received by the phone**.
    - Phone: **Final results received from the smartboard**.
11. On the phone, select **Save Official Record** and confirm that the new row appears in Google Sheets.

## Status messages

- **TURN relay available** — Netlify Function and Cloudflare TURN are configured.
- **Direct connection only** — the app could not retrieve TURN credentials. It may work on easy networks but is not reliable across the FATİH and mobile networks.
- **Waiting for smartboard approval** — select ALLOW on the board.
- **Reconnecting** — do not repeatedly press a score button; wait until the indicator becomes green.
- **Final results pending** — the board has retained the result and will resend it when the phone reconnects.

## Important safety note

The long-lived Cloudflare API token remains in Netlify's server-side environment variables. The browser receives only temporary TURN credentials valid for six hours.
