# v8.9.0 — save and restore Island Run progress

Update both Apps Script and Netlify. There is no need to type student names or island records into the spreadsheet.

## 1. Update the existing Apps Script first

1. Open your existing Google spreadsheet.
2. Choose **Extensions → Apps Script**.
3. Open `GOOGLE-APPS-SCRIPT-v8.9.0.gs` from this ZIP in a text editor and copy all its contents.
4. In Apps Script, replace the contents of the existing tally script (usually `Code.gs`) with this complete replacement. Do not paste it underneath the old code or add a second copy of the same functions. If you keep unrelated scripts in other files, leave those alone.
5. If you changed your Teacher PIN previously, keep your chosen value in `TEACHER_PIN` at the top.
6. Click **Save**.
7. Choose **Deploy → Manage deployments**.
8. Select the existing web app, click the pencil/Edit button, choose **New version**, then click **Deploy**. Keep the working access/execution settings.

Updating the existing deployment keeps the web app URL. The package uses your previously configured URL. If you deliberately use another URL, set `SCRIPT_URL` in both `netlify/functions/session.mjs` and `netlify/functions/roster.mjs` to that URL before deploying Netlify.

Do not delete your existing spreadsheet tabs or roster. The current backend retains the roster, participation-leader and result-saving functions. Historical `.gs` files included in this ZIP are for earlier versions; use **v8.9.0** now.

## 2. Update your Netlify site

1. Extract this ZIP.
2. Replace the files in your existing Netlify-connected project/repository with the ZIP contents. Keep `public`, `netlify/functions` and `netlify.toml` at the project root.
3. Deploy using your existing method that includes Netlify Functions. Uploading only `public/index.html` or only the static `public` directory is insufficient for this version.
4. Keep your existing environment variables. No new variables are required.
5. Wait for the deploy to finish, then refresh the board and phone. Check the opening badge says **Island Run Edition · v8.9.0**.

The publish directory remains `public`. The new `/api/session` endpoint is handled by `netlify/functions/session.mjs` through the included configuration.

## 3. Use it in class

1. Choose a class as usual. The teacher device asks for your Teacher PIN to **Load progress**. When a phone is connected, this happens on the phone; otherwise it happens on the board.
2. Enter the PIN. All four teams' completed islands, best scores and stars for that class are restored. The PIN stays only in that tab's memory. Other classes can load without another prompt while that tab remains open.
3. If offline, choose **Continue offline**. Existing local progress remains usable. To try loading again, use **Load islands** on the board, or in the remote's **Save Record** dialog once results are available.
4. Finish the Battle Arena and choose **Island Run** beside its winner's avatar. The button also works without pairing a remote.
5. Complete a run and return to Champions. On the remote, choose **Save Record**, select **Full session**, enter the Teacher PIN and save.
6. Wait for **Saved to Google Sheets**. A network failure or incorrect PIN is not reported as a successful save.

If you saved before playing Island Run, save again after the run. New records use a session ID, so the same lesson's League and Battle rows are updated rather than duplicated. The newest progress replaces the older pending upload snapshot. If delivery is uncertain, retry; these new session-ID records are safe to resend.

Cloud loading and saving need internet. Offline progress is retained in the browser when storage is available. Save it before clearing browser data or switching devices. A run in progress is not a completed island: only successfully completed, non-practice islands unlock progression.

## What appears in Google Sheets?

`Island_Progress` is created automatically on first load/save:

| Class | Team | Island completed | Best score | Stars | Last updated |
|---|---|---|---|---|---|
| 5-A | Gryffindor | 1 | 850 | 3 | Timestamp |

There is one row per completed class/team/island. First-time teams start at Island 1 without needing rows for every student. A weaker replay or an older device cannot lower stored best scores or stars. Each team's class progress is separate, and team/session point resets do not erase it.

The script also uses **Leaderboard column M** and **Battle_Results column G** for `Session ID`. These columns must be empty or already have that header; if you put custom data there, move it to another unused column first. Your existing result and participation columns keep their positions.

New session IDs deduplicate this release's records; older rows without an ID cannot automatically be matched. Do not resubmit old historical records unless needed.

Only island completion, best score and stars are cloud-synced. Teacher-edited questions, question history and personal runner settings still use local storage/JSON backups. Soft and Hard share the current progression track, as before.

## Quick check

- Select 5-A and load with your PIN: `Island_Progress` should appear.
- Complete Island 1 with a team, then save the full session.
- Confirm that team's row appears in `Island_Progress`.
- Save again: the lesson and island row counts should not increase for the same records.
- On another browser/device, select 5-A and load: that team's next island should be unlocked.
- Select 5-C: its teams should have their own progress.

If loading reports that Apps Script needs updating, repeat **Deploy → Manage deployments → Edit → New version**. Saving the editor code alone does not update the live web app.

If Island Run is still missing, check that the opening badge is v8.9.0 on both devices and finish a new Arena. If necessary, refresh using your browser's reload-without-cache command; avoid clearing local game storage before saving or exporting it.
