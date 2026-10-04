# Update your existing Netlify site to v6.8

Use your existing GitHub-connected Netlify project. No terminal, npm installation, new account, new environment variables or Google Apps Script edits are needed for this update.

1. Download `english-league-v6-8-netlify.zip` and double-click it on your Mac to extract it.
2. Open your existing GitHub repository. Select the branch Netlify deploys, normally `main`.
3. Stay on the repository's main file page — the page where your existing `public` folder and `netlify.toml` are listed. This is what “repository root” means; it is not a folder named “root”.
4. Click **Add file → Upload files**.
5. From inside the extracted `english-league-v6-8-netlify` folder, drag these three items into the upload area together: **`public`**, **`netlify`**, and **`netlify.toml`**. Also upload **`VERSION.txt`** if you keep it in GitHub. Preserve the folders. Do not drag the ZIP or its outer `english-league-v6-8-netlify` folder.
6. Wait for the upload list to finish. It should include `public/index.html`, `public/game.js`, `public/game.css`, `public/scene-runtime.js`, `public/motion.js`, `public/game-rules.js`, `public/session-state.js`, `public/arena-motion.js`, `public/guardian-assembly.js`, `public/combat-motion.css`, `public/animated-mode.js` and `public/raid-motion.js`, plus the existing assets.
7. Enter **Update English League to v6.8** as the commit message and click **Commit changes**. If your repository requires a pull request, merge it into the branch Netlify deploys.
8. Open your existing Netlify project and its **Deploys** page. Wait for the deploy from that commit to finish and publish.
9. Open the live site in a new private/incognito tab. Before starting, check for **Animated Evolution · v6.8**. Refresh/reopen the controller on your phone too so both devices load the same release.

## If it still looks like the old version

- The opening, scoreboard and remote layouts intentionally look the same. Check the version badge first; the visible changes are mainly in combat and Unity animations.
- Open `public/index.html` in GitHub. Its second line should say `v6.8`, and the same folder must contain the new `.js` and `.css` files listed above. Uploading only `index.html` is not sufficient.
- Check that the successful Netlify deploy corresponds to your **Update English League to v6.8** commit and your configured production branch.
- The supplied `netlify.toml` still publishes `public` and loads functions from `netlify/functions`. Keep your existing Cloudflare environment variables. If you need to inspect settings, Netlify documents them under **Project configuration → Developer settings → Continuous deployment → Build settings**. The package requires no build command or dependency installation.
- A `public/public` path or an extra `english-league-v6-8-netlify` folder in GitHub means the files were uploaded one folder too deep. Place the deployment folders beside your existing `netlify.toml`.

## Quick classroom check

1. Start in Light or Animated mode and add a point from the board and then the remote.
2. Complete Class Mission and check the gradual three-level reward. In Animated mode the Guardian's body, head, tail and wings assemble in sequence.
3. Run Final Arena: HP and Knocked Out remain visible, avatars approach for exchanges, and larger levels appear larger only in Arena.
4. When the secret raid is available, verify that VIXAR is visible. Teams attack seals first, then the core. With all four Legendary teams and the completed/rewarded mission, the Guardian delivers the final strike and revives the teams.
5. Send one lesson result to Sheets through your usual remote workflow and check the spreadsheet. That integration has been preserved; no live submission was made during local verification.

Official references checked 27 September 2026:

- [GitHub: uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Netlify: Git workflows](https://docs.netlify.com/build/git-workflows/overview/)
- [Netlify: build configuration](https://docs.netlify.com/build/configure-builds/overview/)
