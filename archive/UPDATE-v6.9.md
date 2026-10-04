# Update your existing Netlify site to v6.9

Use the same GitHub-connected Netlify project. You do not need Terminal, npm, a new Netlify site, new environment variables, or a Google Apps Script change.

1. Download `english-league-v6-9-netlify.zip` and double-click it on your Mac to extract it.
2. Open the GitHub repository and branch that your Netlify site deploys, normally `main`.
3. On the repository's main file page, click **Add file → Upload files**.
4. Open the extracted `english-league-v6-9-netlify` folder. Drag **`public`**, **`netlify`**, **`netlify.toml`**, and **`VERSION.txt`** into GitHub together. Do not upload the ZIP or the outer folder.
5. Wait until GitHub lists the files. Confirm that `public/game.js`, `public/game.css`, and `public/index.html` are included; the wheel fix is in `game.js`, so uploading only `index.html` is not enough.
6. Enter **Update English League to v6.9** as the commit message and click **Commit changes**. If GitHub creates a pull request, merge it into Netlify's production branch.
7. In Netlify, open the existing site's **Deploys** page and wait until the deploy for that commit says **Published**.
8. Open the live site in a private/incognito tab. The opening screen must say **Animated Evolution · v6.9**. Reload the remote-controller page on the phone as well.

## If the old version still appears

- Open `public/index.html` on GitHub. Line 2 should identify v6.9, and the same `public` folder should contain the newly uploaded `game.js` and `game.css`.
- Check that the published Netlify deploy uses the **Update English League to v6.9** commit and the correct production branch.
- A `public/public` path or an extra `english-league-v6-9-netlify` folder in GitHub means the package was uploaded one folder too deep. The `public` and `netlify` folders must sit beside `netlify.toml`.
- Keep the Cloudflare TURN variables already saved in Netlify. This update does not change their names or values.

## Quick classroom check

1. Start the game and confirm the v6.9 badge.
2. Queue automatic Subject Wheels for two or more teams. Each wheel should spin once, reveal its result, close, and continue to the next team.
3. Run Final Arena. The final screen should show the Arena Champion large and the League Champion at half avatar size. If the same team wins both, it should show one **Grand Champion**.
4. Confirm that the final classroom screen does not list HP, damage, critical hits, or other combat statistics.
5. Send one lesson result to your existing Google Sheet through the usual remote flow. The Sheets and TURN code are preserved; no live service write was made during local verification.
