# Update your existing Netlify game — no Terminal needed

This patch fixes the crown alignment and Vixar entrance. The new Guardian/Vixar illustrations shown in chat are concept previews and are not installed in this bug-fix package.

Use the complete v6.4.1 ZIP. Updating only index.html will leave the new artwork and animation code missing.

1. Download the ZIP and double-click it on your Mac to extract it.
2. Open the extracted `english-league-v6-4-1-netlify` folder. You should see `public`, `netlify` and `netlify.toml` inside it.
3. Open the GitHub repository already connected to your Netlify game. Stay on its first file-list page, on the production branch (usually `main`). This first page is the **repository root**; it is not a folder named “root”.
4. Select **Add file → Upload files**. Drag the CONTENTS of the extracted folder into GitHub, including the whole `public` and `netlify` folders and `netlify.toml`. Keep their folder structure. Do not upload the ZIP or the outer `english-league-v6-4-1-netlify` folder itself.
5. Review the uploaded paths. You should see `public/index.html`, `public/animated-mode.js`, `public/animated-mode.css`, and the images under `public/assets/animated/`. At the bottom, enter a message such as `Update English League to v6.4.1 Animated` and choose **Commit changes** to the production branch. If your repository requires a pull request, merge it into that branch when ready.
6. Open your existing project in Netlify and select **Deploys**. Wait for the deployment associated with your new commit to become **Published**. The connected repository automatically starts this deployment.
7. Open your game in a fresh private window on the Mac. Confirm the startup label says **Animated Evolution · v6.4.1**, with **PERFORMANCE / ANIMATED / LIGHT**. Then reload both the smartboard and phone before starting a new lesson.

## Netlify settings

The included `netlify.toml` already specifies:

| Setting | Value |
| --- | --- |
| Base directory | Repository root; leave blank for this folder layout |
| Build command | None needed |
| Publish directory | `public` |
| Functions directory | `netlify/functions` |

If you need to check these in Netlify, open **Project configuration → Developer settings → Continuous deployment → Build settings**. Some dashboard versions label this section **Build & deploy**.

Keep your two existing Cloudflare environment variables as they are. There are no new variables, accounts, installations or Functions to configure for Animated mode. The existing TURN Function stays in the package and still supplies temporary connection credentials to the phone and board. All avatar files are hosted with your site.

## Quick classroom check

1. Select **Animated**, start a new session, and connect the phone as usual.
2. Add points to a team. In Soft mode, its level advances with each normal Add Points award. The major chest effects appear inside the card at levels 3, 5, 7 and 10, without a chest popup or text. The existing Subject Wheel at levels 3, 6 and 9 still works separately.
3. Try the phone's three emoji mode buttons: ✨ Performance, 🎬 Animated and ⚡ Light. They change the board's visuals. A request made during Unity, an evolution or a battle waits until the event and its result screen close.
4. Complete Class Mission. Watch the team streams and Guardian assembly, followed by three separate level rewards.
5. Finish the session. If an earned Subject Wheel is still pending, finish that wheel and close it; the requested Final Arena then starts automatically.
6. After the final results arrive on the phone, use **Save Official Record** as before. Confirm that the row appears in your actual Google Sheet.

## If you still see v6.3

Check the latest Netlify deploy's commit and production branch. On GitHub, open `public/index.html`; its first comment should mention **v6.4.1**. Make sure you updated the `public` folder in the repository Netlify actually uses, rather than adding another index at the top level or inside an extra enclosing folder. After the new deploy is Published, reload in a private window.

## What was checked here

Browser checks cover mode changes, all 44 sprites, score/level updates, Undo/Reset, milestone cleanup, Remote messages, final-result snapshots and the Google Sheets request body. The Sheets request was intercepted for testing; no test row was sent to your live sheet. The FATİH network and the actual classroom hardware still need the short classroom check above.

Official instructions: [GitHub file uploads](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Netlify deployments](https://docs.netlify.com/deploy/create-deploys/), [Netlify build configuration](https://docs.netlify.com/build/configure-builds/overview/).
