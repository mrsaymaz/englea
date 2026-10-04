# Update your existing Netlify site to v7.0

Use your current GitHub-connected Netlify site. You do not need Terminal, npm, a new site, new Cloudflare credentials, or a Google Apps Script change.

1. Download `english-league-v7-0-netlify.zip`. Double-click it on your Mac to extract it.
2. Open the GitHub repository and branch that your Netlify site deploys, normally `main`. Go to its main file page, where `netlify.toml` and the `public` folder are visible.
3. Choose **Add file → Upload files**.
4. Open the extracted `english-league-v7-0-netlify` folder. Drag **`public`**, **`netlify`**, **`netlify.toml`**, and **`VERSION.txt`** into GitHub together. Upload their contents in this structure; do not upload the ZIP or the enclosing `english-league-v7-0-netlify` folder.
5. Confirm that the upload includes `public/game.js`, `public/index.html`, `public/classroom-runtime.js`, `public/remote-protocol.js`, `public/session-recovery.js`, `public/performance-budget.js`, `public/sheets-outbox.js`, and `public/classroom.css`. Uploading only `index.html` will leave the new version incomplete.
6. Enter **Update English League to v7.0** as the commit message, then commit to your production branch. If GitHub creates a pull request, merge it into that branch.
7. Open your existing Netlify project's **Deploys** page. Wait for the deploy corresponding to this commit to finish and become the published production deploy.
8. Open the site and check that the opening screen says **Animated Evolution · v7.0**. Reload the remote-controller page on your phone too: both devices need the new code.

If GitHub reports an upload file limit, upload the `public` contents in smaller batches while retaining the same paths. Wait for the final commit's Netlify deploy before testing. The optional `tests` folder and Markdown documents are not needed to run the site.

## Netlify function

The existing function is included in `netlify/functions/turn-credentials.mjs`. The existing `netlify.toml` tells Netlify where that function lives. A GitHub deployment publishes it with the website; you do not need to install a command-line tool or create the function manually.

Keep your existing Cloudflare TURN environment variables and their values. No environment-variable changes are required for v7.0. The publish directory remains `public`; there is no build command for this static package.

You can check the function at `https://YOUR-SITE.netlify.app/api/turn-credentials`, replacing the domain with yours. JSON containing `iceServers` means credential generation is working. Those credentials are temporary: do not paste them into the source code. Pairing a phone on mobile data with the smartboard on FATIH is the separate check of the actual network connection.

## If the old version appears

- Check `public/index.html` on GitHub: its top comment should say v7.0 and its `game.js` URL should end in `?v=7.0`.
- Check that the published Netlify deploy uses your latest commit and the intended branch.
- `public` and `netlify` must sit beside `netlify.toml`. An extra outer folder, or `public/public`, means the upload went one folder too deep.
- Close and reopen the board and phone tabs. A private tab is useful for checking the release badge, but its temporary storage is unsuitable for session recovery.

## First classroom check

1. Start in Light mode. Add points, reload, and choose **Resume session**. Confirm that the scores and levels return.
2. Connect the phone. Award one point action and wait for **Confirmed**. Briefly disconnect and reconnect the phone; verify the displayed scores match the board. Approve the phone on the board when prompted.
3. Queue rewards for several teams. Check that wheels finish in order. Try **Pause**, **Resume**, and **Skip**.
4. Run Arena and VIXAR in Light and Animated. Check that **Exit** returns control to the scoreboard and **Continue rewards** appears if earned presentations remain.
5. Finish a lesson and wait for the Arena result. On the phone choose **Save Official Record**, enter the usual class name and PIN, and submit. Check the actual Google Sheet for the row before retrying.

These checks use your real classroom devices and network, which local automated tests cannot reproduce fully.
