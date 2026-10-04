# Version 9 — update and use

This is the complete Netlify project. Your existing student roster, result sheets and island progress are retained. Start with the Apps Script update, then deploy the site.

## 1. Update the existing Apps Script

1. Open your existing Google spreadsheet and choose **Extensions → Apps Script**.
2. Open **GOOGLE-APPS-SCRIPT-v9.0.0.gs** from this ZIP using a text editor. Copy the whole file.
3. Replace the contents of the existing tally script (usually `Code.gs`) with it. Do not paste below the old script or keep duplicate tally functions in a second file. Leave unrelated script files alone.
4. If you previously changed `TEACHER_PIN`, retain your chosen PIN at the top of the replacement.
5. Click **Save**.
6. Choose **Deploy → Manage deployments**. Select the existing web app and click the pencil/Edit button.
7. Under Version choose **New version**, then click **Deploy**. Retain your working execution and access settings.

Updating the existing deployment keeps its URL. If you intentionally create a different web app URL, change `SCRIPT_URL` in both `netlify/functions/session.mjs` and `netlify/functions/roster.mjs` before deploying the site.

Do not delete or manually rewrite existing sheets. `Teaching_Content` is created automatically on first use. `Roster`, `Island_Progress`, participation leaders, League results and Battle results remain supported. Existing session-ID columns stay in Leaderboard column M and Battle_Results column G.

## 2. Deploy the complete Netlify project

1. Extract this ZIP.
2. Replace the files in your existing Netlify project/repository. Keep `public`, `netlify/functions` and `netlify.toml` together at the project root.
3. Deploy using your existing method that includes **Netlify Functions**. Uploading only `index.html` or the static `public` directory will not deploy the required APIs.
4. Keep your existing environment variables. No additional variables are needed.
5. Refresh the smartboard and phone. Both opening screens should show **Island Run Edition · v9.0.0**. If a phone still has an old build, refresh it before reconnecting.

## 3. Teacher Studio

- Choose **Manage** on the remote or board, then enter the Teacher PIN.
- Select the class and island under **Questions & objectives**. The class determines the grade.
- Select a question, edit it, and use **Keep in draft**. Use **Student preview** to try the three choices.
- Edit the learning objective or add/delete questions. Sentence blanks use `___`.
- Choose **Save online** to publish the unit. Draft changes are not published until you save.
- For bulk vocabulary, choose **Paste vocabulary / questions** and paste at least three lines such as `apple | elma`. The editor creates English-to-Turkish and Turkish-to-English questions with distractors drawn from the other pairs. Check them before saving.
- For individual questions, use `kind | prompt | correct | wrong | wrong`, where kind is `word`, `gap` or `question`. Pasted spreadsheet tabs work as separators too.
- Use **Roster** to add, rename, move or remove students through the existing editor. These edits apply to the next lesson.
- Use **Class progress** to see completed islands, stars and the next island for each team.

Questions and objectives are shared by **grade and island**. For example, editing Grade 5 Island 1 affects both 5-A and 5-C. Student rosters and island progress remain separate for each class/team.

A new run uses the latest loaded publication; a run already underway keeps its six selected questions. A connected board receives saved teaching changes from its phone. On another device, select the class and **Load islands**, or open the unit in Studio and **Reload online**. Loading/saving needs internet; previously loaded content can still be used from the browser cache. Question history and runner settings remain local.

If Studio detects a newer edit from another device, it keeps your current draft on screen and refuses to overwrite the online version. Copy any text you want to retain, reload the unit, then apply your edits again. Up to 400 questions fit in one island bank.

Existing local question edits appear as the initial Studio draft for a unit that has never been published. Choose Save online to publish them. An existing online publication takes priority. The separate **Run settings** button inside Island Run keeps reading pace, reduced motion, practice and local backup controls available.

## 4. Play and save

1. Choose your class and load its online island progress as usual.
2. Finish Battle Arena. Choose **Island Run** beside the Arena champion avatar.
3. The class map shows restoration from all four teams, while that champion keeps its own unlock sequence. One completed team restores the path; additional teams add lamps, growth and a complete elemental halo. Elemental seals identify the teams that completed that island.
4. Play with the winner's current avatar and level. Soft/Hard, jumping, answer lanes, coin requirements and boss rules are unchanged.
5. Return to Champions. The compact recap shows class restoration, each team's progress and new team completions during this lesson's expedition. Existing champion titles and all-team participation leaders remain prominent.
6. On the remote choose **Save Record → Full session** after playing. Wait for confirmation. If you saved before Island Run, save again afterward: the same lesson ID updates its result rows and saves the latest island progress.

Team-point resets do not erase island progress or participation. New lesson sessions preserve long-term island progress. The recap compares with the map loaded when this lesson's first Island Run opens; it does not count historical progress as a new achievement.

## Quick deployment check

- Open Manage and load Grade 5 Island 1. Confirm `Teaching_Content` appears automatically.
- Edit an objective, save it, then load that unit on another device.
- Connect phone and board. Check one student award reaches the board.
- Finish Arena, open Island Run, and confirm the champion's class and current avatar.
- Complete an island, return to Champions, save Full session and reload class progress on another device.

Automated engine, backend and synchronization tests passed in the development environment. This build has not been tested on your live Netlify/Google deployment, physical iPhone or smartboard. `TEST-REPORT-v9.0.0.md` records the checks and limits. Earlier version documents and scripts are historical; use this guide and the v9.0.0 script for this release.
